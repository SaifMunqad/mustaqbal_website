<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Enrolment enquiries can be answered by an admin/employee from the
     * dashboard and emailed back to the guardian. A single enquiry may receive
     * multiple replies over time, so each reply lives on its own row with the
     * date it was recorded. The email's subject is stored alongside the body (the
     * TipTap editor's HTML) so the sender controls the full outgoing message.
     */
    public function up(): void
    {
        Schema::create('enrollment_replies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('enrollment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('subject')->nullable();
            $table->text('body');
            $table->timestamp('replied_at')->nullable();
            $table->timestamps();

            $table->index(['enrollment_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('enrollment_replies');
    }
};
