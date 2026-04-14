<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('highlighted_student_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('type');
            $table->string('visibility')->default('community');
            $table->string('title');
            $table->text('content');
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->string('job_apply_url')->nullable();
            $table->timestamps();

            $table->index(['type', 'visibility']);
            $table->index(['scheduled_at', 'starts_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('posts');
    }
};

