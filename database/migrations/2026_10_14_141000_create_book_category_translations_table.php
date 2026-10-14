<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('book_category_translations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('book_category_id')->constrained()->cascadeOnDelete();
            $table->foreignId('language_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->timestamps();

            $table->unique(['book_category_id', 'language_id']);
        });

        $this->migrateJson();
    }

    public function down(): void
    {
        Schema::table('book_categories', function (Blueprint $table): void {
            $table->json('name_translations')->nullable()->after('slug');
        });

        if (Schema::hasColumn('book_categories', 'name_translations')) {
            $languages = DB::table('languages')->pluck('code', 'id');

            DB::table('book_category_translations')
                ->orderBy('id')
                ->chunkById(100, function ($rows) use ($languages): void {
                    $grouped = $rows->groupBy('book_category_id');

                    foreach ($grouped as $categoryId => $categoryRows) {
                        $translations = [];

                        foreach ($categoryRows as $row) {
                            $code = $languages[$row->language_id] ?? null;

                            if ($code) {
                                $translations[$code] = $row->name;
                            }
                        }

                        DB::table('book_categories')
                            ->where('id', $categoryId)
                            ->update(['name_translations' => json_encode($translations)]);
                    }
                });
        }

        Schema::dropIfExists('book_category_translations');

        Schema::table('book_categories', function (Blueprint $table): void {
            $table->dropColumn('name_translations');
        });
    }

    /**
     * Move each category's JSON `name_translations` map into proper rows, then
     * drop the JSON column. The parent `name` stays as the default-language
     * fallback (mirrors the programs pattern).
     */
    private function migrateJson(): void
    {
        if (! Schema::hasColumn('book_categories', 'name_translations')) {
            return;
        }

        $languageIds = DB::table('languages')->pluck('id', 'code');

        DB::table('book_categories')
            ->whereNotNull('name_translations')
            ->orderBy('id')
            ->chunkById(100, function ($categories) use ($languageIds): void {
                $rows = [];

                foreach ($categories as $category) {
                    $translations = json_decode((string) $category->name_translations, true) ?: [];

                    foreach ($translations as $code => $name) {
                        $languageId = $languageIds[$code] ?? null;

                        if ($languageId && filled($name)) {
                            $rows[] = [
                                'book_category_id' => $category->id,
                                'language_id' => $languageId,
                                'name' => $name,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ];
                        }
                    }
                }

                if ($rows !== []) {
                    DB::table('book_category_translations')->insert($rows);
                }
            });

        Schema::table('book_categories', function (Blueprint $table): void {
            $table->dropColumn('name_translations');
        });
    }
};
