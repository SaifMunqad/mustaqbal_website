<?php

use App\Enums\EmailDeliveryStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Unified outbound mail log. Populated by the framework's mail events, so
        // it captures every message the app sends — bulk campaigns, transactional
        // replies, and system mail (password resets) alike — not just campaigns.
        Schema::create('mail_logs', function (Blueprint $table) {
            $table->id();
            // Human-readable origin of the message (e.g. "Bulk Email"); null for
            // untagged mail such as Fortify's password resets.
            $table->string('source')->nullable();
            $table->string('subject')->nullable();
            // Comma-joined recipient addresses (the primary "to" list).
            $table->text('recipients');
            $table->string('status')->default(EmailDeliveryStatus::Pending->value);
            $table->text('error')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'created_at']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mail_logs');
    }
};
