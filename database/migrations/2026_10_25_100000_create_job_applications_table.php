<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('job_applications', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('job_id')->constrained('job_postings')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('father_name');
            $table->string('email');
            $table->string('phone');
            $table->string('city')->nullable();
            $table->text('address')->nullable();
            $table->text('experience');
            $table->text('cover_letter')->nullable();
            $table->string('status')->default('pending');
            $table->timestamps();

            $table->unique(['job_id', 'email']);
            $table->index(['job_id', 'status']);
        });

        Schema::create('job_application_documents', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('job_application_id')->constrained()->cascadeOnDelete();
            $table->string('path');
            $table->string('original_name');
            $table->string('mime_type')->nullable();
            $table->unsignedBigInteger('size')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_application_documents');
        Schema::dropIfExists('job_applications');
    }
};
