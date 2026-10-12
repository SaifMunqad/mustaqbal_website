<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Contact inquiries (anonymous Messages) can be answered by management from
     * the dashboard. A single inquiry may receive multiple replies over time, so
     * each answer lives on its own row with the date it was recorded.
     */
    public function up(): void
    {
        Schema::create('message_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('message_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->text('body');
            $table->timestamp('answered_at')->nullable();
            $table->timestamps();

            $table->index(['message_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('message_answers');
    }
};
