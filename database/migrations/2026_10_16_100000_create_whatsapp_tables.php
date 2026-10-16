<?php

use App\Enums\WhatsAppCampaignStatus;
use App\Enums\WhatsAppDeliveryStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Storage for the bulk-WhatsApp campaigns feature, mirroring the bulk-email
 * campaign tables so the admin experience (queue, live progress, retry) is the
 * same. `whatsapp_settings` is a single-row, encrypted store for the Meta Cloud
 * API credentials an admin supplies from the dashboard; it is intentionally kept
 * separate from the public SiteSetting so tokens are never shared to the frontend.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('whatsapp_settings', function (Blueprint $table) {
            $table->id();
            $table->text('access_token')->nullable();
            $table->string('phone_number_id')->nullable();
            $table->string('business_account_id')->nullable();
            $table->string('graph_version')->default('v23.0');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('whatsapp_campaigns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            // "text" = free-form body; "template" = an approved Meta template.
            $table->string('mode')->default('text');
            $table->longText('message')->nullable();
            $table->string('template_name')->nullable();
            $table->string('template_language')->nullable();
            $table->json('template_variables')->nullable();
            $table->string('recipient_source');
            $table->unsignedInteger('total_count')->default(0);
            $table->unsignedInteger('sent_count')->default(0);
            $table->unsignedInteger('failed_count')->default(0);
            $table->string('status')->default(WhatsAppCampaignStatus::Queued->value);
            $table->timestamps();

            $table->index(['status', 'created_at']);
        });

        Schema::create('whatsapp_campaign_recipients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('whatsapp_campaign_id')->constrained()->cascadeOnDelete();
            $table->string('name')->nullable();
            $table->string('phone');
            $table->string('status')->default(WhatsAppDeliveryStatus::Pending->value);
            $table->text('error')->nullable();
            // Meta's returned message id (wamid...) for traceability.
            $table->string('message_id')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();

            $table->index(['whatsapp_campaign_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('whatsapp_campaign_recipients');
        Schema::dropIfExists('whatsapp_campaigns');
        Schema::dropIfExists('whatsapp_settings');
    }
};
