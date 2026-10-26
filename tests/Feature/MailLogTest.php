<?php

namespace Tests\Feature;

use App\Enums\EmailDeliveryStatus;
use App\Enums\UserRole;
use App\Models\MailLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * Covers the unified mail log pipeline: every outbound message is captured by
 * the MessageSending/MessageSent listeners and lands in mail_logs with the right
 * delivery status, and the /mails inbox is restricted to management + admin.
 */
class MailLogTest extends TestCase
{
    use RefreshDatabase;

    public function test_outgoing_mail_is_recorded_and_marked_sent(): void
    {
        Mail::raw('Hello there', fn ($message) => $message
            ->to('someone@example.com')
            ->subject('Ping subject'));

        $log = MailLog::query()->sole();

        $this->assertSame(EmailDeliveryStatus::Sent, $log->status);
        $this->assertSame('Ping subject', $log->subject);
        $this->assertStringContainsString('someone@example.com', $log->recipients);
        $this->assertNotNull($log->sent_at);
        // Untagged mail (no X-Mail-Source header) has a null source label.
        $this->assertNull($log->source);
    }

    public function test_mails_inbox_allows_management_and_admin(): void
    {
        foreach ([UserRole::Admin, UserRole::Management] as $role) {
            $this->actingAs(User::factory()->create(['role' => $role->value]))
                ->get(route('dashboard.mails.index'))
                ->assertOk();
        }
    }

    public function test_mails_inbox_forbids_lower_roles(): void
    {
        $this->actingAs(User::factory()->create(['role' => UserRole::Family->value]))
            ->get(route('dashboard.mails.index'))
            ->assertForbidden();
    }
}
