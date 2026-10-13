<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Admin-curated sections for the public home page. A row is either a
     * "curated" section (references existing content by id, rendered at read
     * time) or an "authored" section (self-contained content stored in config).
     */
    public function up(): void
    {
        Schema::create('home_sections', function (Blueprint $table): void {
            $table->id();
            $table->string('section_type');
            $table->string('title')->nullable();
            $table->json('config')->nullable();
            $table->unsignedInteger('limit')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('home_sections');
    }
};
