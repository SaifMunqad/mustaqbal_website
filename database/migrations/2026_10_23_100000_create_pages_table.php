<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A builder page: a named, ordered layout of blocks. Generalizes the home
     * page (key = 'home') so About/landings can reuse the same engine later.
     */
    public function up(): void
    {
        Schema::create('pages', function (Blueprint $table): void {
            $table->id();
            $table->string('key')->unique();          // stable programmatic id, e.g. 'home'
            $table->string('label')->nullable();      // admin display name
            $table->boolean('is_active')->default(true);
            $table->string('default_zone')->default('main'); // primary slot for new blocks
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pages');
    }
};
