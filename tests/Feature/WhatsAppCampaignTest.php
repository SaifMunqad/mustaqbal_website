<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Enums\WhatsAppCampaignStatus;
use App\Enums\WhatsAppDeliveryStatus;
use App\Jobs\SendWhatsAppMessage;
use App\Models\Contact;
use App\Models\User;
use App\Models\WhatsAppCampaign;
use App\Models\WhatsAppSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class WhatsAppCampaignTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['role' => UserRole::Admin->value]);
    }

    private function configure(): void
    {
        WhatsAppSetting::query()->create([
            'access_token' => 'test-token',
            'phone_number_id' => '123456789',
            'is_active' => true,
        ]);
    }

    public function test_non_admins_cannot_access_whatsapp_campaigns(): void
    {
        $this->actingAs(User::factory()->create(['role' => UserRole::Family->value]))
            ->get(route('dashboard.whatsapp-campaigns.index'))
            ->assertForbidden();
    }

    public function test_store_redirects_to_settings_when_not_configured(): void
    {
        $this->actingAs($this->admin())
            ->post(route('dashboard.whatsapp-campaigns.store'), [
                'recipient_source' => 'custom',
                'custom_numbers' => '+93700123456',
                'mode' => 'text',
                'message' => 'Hello families',
            ])
            ->assertRedirect(route('dashboard.whatsapp-settings.edit'))
            ->assertSessionHas('error');

        $this->assertDatabaseCount('whatsapp_campaigns', 0);
    }

    public function test_admin_can_queue_campaign_with_custom_numbers(): void
    {
        Queue::fake();
        $this->configure();

        $response = $this->actingAs($this->admin())
            ->post(route('dashboard.whatsapp-campaigns.store'), [
                'recipient_source' => 'custom',
                'custom_numbers' => "+93700123456\n+93 700 123 456\nnot-a-number\n700123456",
                'mode' => 'text',
                'message' => 'School closes for the holiday.',
            ]);

        $response->assertSessionHasNoErrors();

        $campaign = WhatsAppCampaign::query()->firstOrFail();
        $response->assertRedirect(route('dashboard.whatsapp-campaigns.show', $campaign));

        // The duplicate "+93700123456"/"+93 700 123 456" collapses and the
        // non-numeric line is dropped, leaving two recipients.
        $this->assertSame(2, $campaign->total_count);
        $this->assertSame(['93700123456', '700123456'], $campaign->recipients()->pluck('phone')->all());
        Queue::assertPushed(SendWhatsAppMessage::class, 2);
    }

    public function test_contact_source_uses_recorded_phone_numbers(): void
    {
        Queue::fake();
        $this->configure();

        Contact::query()->create(['name' => 'Parent', 'email' => 'p@example.com', 'phone' => '+93 799 000 111', 'message' => 'Hi']);
        Contact::query()->create(['name' => 'NoPhone', 'email' => 'n@example.com', 'message' => 'Hi']);

        $this->actingAs($this->admin())
            ->post(route('dashboard.whatsapp-campaigns.store'), [
                'recipient_source' => 'contacts',
                'mode' => 'text',
                'message' => 'Reminder',
            ])
            ->assertSessionHasNoErrors();

        $campaign = WhatsAppCampaign::query()->firstOrFail();
        $this->assertSame(1, $campaign->total_count);
        $this->assertSame('93799000111', $campaign->recipients()->value('phone'));
    }

    public function test_send_job_delivers_and_completes_campaign(): void
    {
        $this->configure();
        Http::fake([
            'graph.facebook.com/*' => Http::response(['messages' => [['id' => 'wamid.TEST']]], 200),
        ]);

        $campaign = WhatsAppCampaign::query()->create([
            'mode' => 'text',
            'message' => 'Have a blessed Eid.',
            'recipient_source' => 'custom',
            'total_count' => 1,
            'status' => WhatsAppCampaignStatus::Queued,
        ]);

        $recipient = $campaign->recipients()->create([
            'name' => 'Parent',
            'phone' => '93700123456',
            'status' => WhatsAppDeliveryStatus::Pending,
        ]);

        (new SendWhatsAppMessage($recipient->id))->handle(app(\App\Services\WhatsAppService::class));

        $recipient->refresh();
        $this->assertSame(WhatsAppDeliveryStatus::Sent, $recipient->status);
        $this->assertSame('wamid.TEST', $recipient->message_id);
        $this->assertSame(1, $campaign->fresh()->sent_count);
        $this->assertSame(WhatsAppCampaignStatus::Completed, $campaign->fresh()->status);
        Http::assertSent(fn ($request) => ($request['type'] ?? null) === 'text');
    }

    public function test_retry_requeues_failed_recipients(): void
    {
        Queue::fake();

        $campaign = WhatsAppCampaign::query()->create([
            'mode' => 'text',
            'message' => 'Reminder',
            'recipient_source' => 'custom',
            'total_count' => 2,
            'sent_count' => 1,
            'failed_count' => 1,
            'status' => WhatsAppCampaignStatus::Completed,
        ]);

        $failed = $campaign->recipients()->create([
            'name' => 'Parent',
            'phone' => '93700123456',
            'status' => WhatsAppDeliveryStatus::Failed,
            'error' => 'Number not on WhatsApp',
        ]);

        $campaign->recipients()->create([
            'name' => 'Aunt',
            'phone' => '93799000111',
            'status' => WhatsAppDeliveryStatus::Sent,
        ]);

        $this->actingAs($this->admin())
            ->post(route('dashboard.whatsapp-campaigns.retry', $campaign))
            ->assertSessionHas('success');

        $this->assertSame(WhatsAppDeliveryStatus::Pending, $failed->fresh()->status);
        $this->assertSame(0, $campaign->fresh()->failed_count);
        Queue::assertPushed(SendWhatsAppMessage::class, 1);
    }
}
