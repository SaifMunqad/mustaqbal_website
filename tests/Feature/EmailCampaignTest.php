<?php

namespace Tests\Feature;

use App\Enums\EmailCampaignStatus;
use App\Enums\EmailDeliveryStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Jobs\SendBulkAnnouncement;
use App\Models\Contact;
use App\Models\Conversation;
use App\Models\EmailCampaign;
use App\Models\Message;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class EmailCampaignTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['role' => UserRole::Admin->value]);
    }

    public function test_non_admins_cannot_access_email_campaigns(): void
    {
        $this->actingAs(User::factory()->create(['role' => UserRole::Family->value]))
            ->get(route('dashboard.email-campaigns.index'))
            ->assertForbidden();

        $this->actingAs(User::factory()->create(['role' => UserRole::Management->value]))
            ->get(route('dashboard.email-campaigns.index'))
            ->assertForbidden();
    }

    public function test_admin_can_queue_campaign_with_custom_emails(): void
    {
        Queue::fake();

        $response = $this->actingAs($this->admin())
            ->post(route('dashboard.email-campaigns.store'), [
                'subject' => 'Eid Mubarak',
                'body' => 'School will be closed for Eid holidays.',
                'recipient_source' => 'custom',
                'custom_emails' => "parent@example.com\nNotAnEmail\nparent@example.com; aunt@example.com",
            ]);

        $response->assertSessionHasNoErrors();

        $campaign = EmailCampaign::query()->firstOrFail();
        $response->assertRedirect(route('dashboard.email-campaigns.show', $campaign));

        $this->assertSame(2, $campaign->total_count);
        $this->assertSame(2, $campaign->recipients()->count());
        Queue::assertPushed(SendBulkAnnouncement::class, 2);
    }

    public function test_users_and_contacts_sources_are_deduplicated_and_skip_inactive_users(): void
    {
        Queue::fake();

        User::factory()->create(['email' => 'shared@example.com', 'status' => UserStatus::Active->value]);
        User::factory()->create(['email' => 'suspended@example.com', 'status' => UserStatus::Suspended->value]);
        Contact::query()->create(['name' => 'Inquiry', 'email' => 'shared@example.com', 'message' => 'Hello']);
        Contact::query()->create(['name' => 'Other', 'email' => 'inquiry@example.com', 'message' => 'Hello']);

        $this->actingAs($this->admin())
            ->post(route('dashboard.email-campaigns.store'), [
                'subject' => 'New semester',
                'body' => 'Classes start next week.',
                'recipient_source' => 'users_contacts',
            ])
            ->assertSessionHasNoErrors();

        $campaign = EmailCampaign::query()->firstOrFail();
        $emails = $campaign->recipients()->pluck('email')->sort()->values()->all();

        $this->assertSame(['inquiry@example.com', 'shared@example.com'], $emails);
    }

    public function test_empty_custom_list_is_rejected_with_error_flash(): void
    {
        $this->actingAs($this->admin())
            ->post(route('dashboard.email-campaigns.store'), [
                'subject' => 'Test',
                'body' => 'Body',
                'recipient_source' => 'custom',
                'custom_emails' => 'garbage-not-an-email',
            ])
            ->assertSessionHas('error');

        $this->assertDatabaseCount('email_campaigns', 0);
    }

    public function test_send_job_delivers_mail_and_completes_campaign(): void
    {
        Mail::fake();

        $campaign = EmailCampaign::query()->create([
            'subject' => 'Eid Mubarak',
            'body' => 'Have a blessed Eid.',
            'recipient_source' => 'custom',
            'total_count' => 1,
            'status' => EmailCampaignStatus::Queued,
        ]);

        $recipient = $campaign->recipients()->create([
            'name' => 'Parent',
            'email' => 'parent@example.com',
            'status' => EmailDeliveryStatus::Pending,
        ]);

        (new SendBulkAnnouncement($recipient->id))->handle();

        $this->assertSame(EmailDeliveryStatus::Sent, $recipient->fresh()->status);
        $this->assertSame(1, $campaign->fresh()->sent_count);
        $this->assertSame(EmailCampaignStatus::Completed, $campaign->fresh()->status);
        Mail::assertSent(\App\Mail\BulkAnnouncement::class, 1);
    }

    public function test_retry_requeues_failed_recipients(): void
    {
        Queue::fake();

        $campaign = EmailCampaign::query()->create([
            'subject' => 'Eid Mubarak',
            'body' => 'Have a blessed Eid.',
            'recipient_source' => 'custom',
            'total_count' => 2,
            'failed_count' => 1,
            'sent_count' => 1,
            'status' => EmailCampaignStatus::Completed,
        ]);

        $failed = $campaign->recipients()->create([
            'name' => 'Parent',
            'email' => 'failed@example.com',
            'status' => EmailDeliveryStatus::Failed,
            'error' => 'SMTP timeout',
        ]);

        $campaign->recipients()->create([
            'name' => 'Aunt',
            'email' => 'aunt@example.com',
            'status' => EmailDeliveryStatus::Sent,
        ]);

        $this->actingAs($this->admin())
            ->post(route('dashboard.email-campaigns.retry', $campaign))
            ->assertSessionHas('success');

        $this->assertSame(EmailDeliveryStatus::Pending, $failed->fresh()->status);
        $this->assertSame(0, $campaign->fresh()->failed_count);
        Queue::assertPushed(SendBulkAnnouncement::class, 1);
    }

    public function test_messages_index_splits_incoming_and_sent_boxes(): void
    {
        $admin = $this->admin();
        $other = User::factory()->create();
        $conversation = Conversation::query()->create(['created_by' => $admin->id, 'topic' => 'General']);

        $mine = Message::query()->create([
            'conversation_id' => $conversation->id,
            'user_id' => $admin->id,
            'body' => 'Reply from admin',
        ]);
        $theirs = Message::query()->create([
            'conversation_id' => $conversation->id,
            'user_id' => $other->id,
            'body' => 'Question from parent',
        ]);

        $sentPage = $this->actingAs($admin)->get(route('dashboard.messages.index', ['box' => 'sent']));
        $sentPage->assertOk();
        $sentPage->assertInertia(fn ($page) => $page
            ->where('box', 'sent')
            ->has('messages.data', 1)
            ->where('messages.data.0.id', $mine->id));

        $incomingPage = $this->actingAs($admin)->get(route('dashboard.messages.index'));
        $incomingPage->assertOk();
        $incomingPage->assertInertia(fn ($page) => $page
            ->where('box', 'incoming')
            ->has('messages.data', 1)
            ->where('messages.data.0.id', $theirs->id));
    }
}
