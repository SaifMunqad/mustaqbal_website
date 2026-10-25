<?php

namespace Tests\Feature;

use App\Enums\EmailCampaignStatus;
use App\Enums\EmailDeliveryStatus;
use App\Enums\JobApplicationStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Jobs\SendBulkAnnouncement;
use App\Mail\BulkAnnouncement;
use App\Models\Contact;
use App\Models\Conversation;
use App\Models\EmailCampaign;
use App\Models\Job;
use App\Models\JobApplication;
use App\Models\Message;
use App\Models\SiteSetting;
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

    public function test_rich_text_body_is_sanitized_before_storage(): void
    {
        Queue::fake();

        $this->actingAs($this->admin())
            ->post(route('dashboard.email-campaigns.store'), [
                'subject' => 'Eid Mubarak',
                'body' => '<p>Dear <strong>parents</strong></p><script>alert(1)</script>',
                'recipient_source' => 'custom',
                'custom_emails' => 'parent@example.com',
            ])
            ->assertSessionHasNoErrors();

        $campaign = EmailCampaign::query()->firstOrFail();

        // Formatting survives, unsafe markup does not reach the mail view.
        $this->assertStringContainsString('<strong>parents</strong>', $campaign->body);
        $this->assertStringNotContainsString('<script>', $campaign->body);
    }

    public function test_rendered_mail_uses_school_branding_and_only_the_authored_message(): void
    {
        SiteSetting::resolved()->update([
            'brand_name' => 'Mustaqbal High School',
            'logo_url' => '/storage/branding/logo.png',
            'brand_color' => '#0f766e',
        ]);

        $campaign = EmailCampaign::query()->create([
            'subject' => 'Eid Mubarak',
            'body' => '<h1>HAPPY EID!</h1><p>Wish you all a very happy eid.</p><p></p>',
            'recipient_source' => 'custom',
            'total_count' => 1,
            'status' => EmailCampaignStatus::Queued,
        ]);

        $recipient = $campaign->recipients()->create([
            'name' => 'Parent',
            'email' => 'parent@example.com',
            'status' => EmailDeliveryStatus::Pending,
        ]);

        $html = (new BulkAnnouncement($campaign, $recipient))->render();
        $base = rtrim((string) config('app.url'), '/');

        // The author's markup survives as real HTML, not escaped text.
        $this->assertStringContainsString('<h1>HAPPY EID!</h1>', $html);
        $this->assertStringContainsString('<p>Wish you all a very happy eid.</p>', $html);
        $this->assertStringNotContainsString('&lt;h1&gt;', $html);

        // Rounded card shell with DB-driven school identity, and the branding
        // placed above the card rather than inside it.
        $this->assertStringContainsString('border-radius: 24px', $html);
        $this->assertStringContainsString('Mustaqbal High School', $html);
        $this->assertStringContainsString($base.'/storage/branding/logo.png', $html);
        $this->assertStringContainsString('#0f766e', $html);
        $this->assertLessThan(
            strpos($html, 'border-radius: 24px'),
            strpos($html, 'mail-brand'),
            'The logo and school name must sit outside, above the card.'
        );

        // Copyright under the card: current year + school name from the database.
        $this->assertStringContainsString('&copy; '.date('Y').' Mustaqbal High School', $html);

        // No boilerplate around the message.
        $this->assertStringNotContainsString('Dear Parent', $html);
        $this->assertStringNotContainsString('Thanks,', $html);
        $this->assertStringNotContainsString('All rights reserved', $html);
        $this->assertStringNotContainsString('<p></p>', $html);
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

    public function test_selected_applicants_source_resolves_only_marked_selected_applications(): void
    {
        Queue::fake();

        $selectedJob = Job::factory()->create();
        $otherJob = Job::factory()->create();

        $this->makeApplication($selectedJob, JobApplicationStatus::Selected, 'selected@example.com');
        $this->makeApplication($selectedJob, JobApplicationStatus::Selected, 'also-selected@example.com');
        $this->makeApplication($otherJob, JobApplicationStatus::Selected, 'other-job@example.com');
        $this->makeApplication($selectedJob, JobApplicationStatus::Rejected, 'rejected@example.com');

        $this->actingAs($this->admin())
            ->post(route('dashboard.email-campaigns.store'), [
                'subject' => 'Interview invitation',
                'body' => 'You have been shortlisted.',
                'recipient_source' => 'selected_applicants',
            ])
            ->assertSessionHasNoErrors();

        $emails = EmailCampaign::query()->firstOrFail()->recipients()->pluck('email')->sort()->values()->all();

        $this->assertSame(['also-selected@example.com', 'other-job@example.com', 'selected@example.com'], $emails);
    }

    public function test_selected_applicants_source_honors_the_job_filter(): void
    {
        Queue::fake();

        $job = Job::factory()->create();
        $otherJob = Job::factory()->create();

        $this->makeApplication($job, JobApplicationStatus::Selected, 'in-job@example.com');
        $this->makeApplication($otherJob, JobApplicationStatus::Selected, 'out-of-job@example.com');

        $this->actingAs($this->admin())
            ->post(route('dashboard.email-campaigns.store'), [
                'subject' => 'Interview invitation',
                'body' => 'You have been shortlisted.',
                'recipient_source' => 'selected_applicants',
                'job_filter' => $job->id,
            ])
            ->assertSessionHasNoErrors();

        $this->assertSame(['in-job@example.com'], EmailCampaign::query()->firstOrFail()->recipients()->pluck('email')->all());
    }

    private function makeApplication(Job $job, JobApplicationStatus $status, string $email): JobApplication
    {
        return JobApplication::query()->create([
            'job_id' => $job->id,
            'first_name' => 'Applicant',
            'last_name' => 'One',
            'father_name' => 'Father',
            'email' => $email,
            'phone' => '0700000000',
            'experience' => 'Some experience.',
            'status' => $status,
        ]);
    }
}
