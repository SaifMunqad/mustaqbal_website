<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Contact-form visitors are anonymous, so a message submitted from the
     * public contact page has no registered author or conversation. Make the
     * foreign keys nullable and store the sender details directly on the
     * message so those inquiries can appear in the dashboard "incoming" box.
     */
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->unsignedBigInteger('conversation_id')->nullable()->change();
            $table->unsignedBigInteger('user_id')->nullable()->change();

            $table->string('sender_name')->nullable()->after('user_id');
            $table->string('sender_email')->nullable()->after('sender_name');
            $table->string('sender_phone')->nullable()->after('sender_email');
            $table->string('subject')->nullable()->after('sender_phone');
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropColumn(['sender_name', 'sender_email', 'sender_phone', 'subject']);

            $table->unsignedBigInteger('conversation_id')->nullable(false)->change();
            $table->unsignedBigInteger('user_id')->nullable(false)->change();
        });
    }
};
