<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('programs', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('program_type');
            $table->text('description');
            $table->string('schedule');
            $table->decimal('fees', 10, 2)->default(0);
            $table->string('age_recommendation');
            $table->string('classroom_number')->nullable();
            $table->boolean('available_for_enroll')->default(true);
            $table->unsignedInteger('display_order')->default(0);
            $table->timestamps();

            $table->index(['program_type', 'available_for_enroll']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('programs');
    }
};

