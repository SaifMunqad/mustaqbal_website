<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Issued awards that the public verification page can look up.
     *
     * `person_id` and `award_id` are free-form strings because every school
     * numbers its students and certificates differently; the pair together is
     * the verification key and must be unique.
     */
    public function up(): void
    {
        Schema::create('awards', function (Blueprint $table) {
            $table->id();
            $table->string('person_id', 64);
            $table->string('award_id', 64);
            $table->string('full_name', 100);
            $table->string('father_name', 100)->nullable();
            $table->date('awarded_at');
            $table->timestamps();

            $table->unique(['person_id', 'award_id']);
            $table->index('award_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('awards');
    }
};
