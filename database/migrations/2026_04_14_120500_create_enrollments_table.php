<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('enrollments', function (Blueprint $table) {
            $table->id();
            $table->string('student_name');
            $table->string('guardian_name');
            $table->string('email')->index();
            $table->string('phone');
            $table->string('grade');
            $table->date('date_of_birth');
            $table->text('address');
            $table->text('notes')->nullable();
            $table->boolean('prefers_email_updates')->default(true);
            $table->timestamp('last_email_sent_at')->nullable();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('email_verification_token', 80)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('enrollments');
    }
};

