<?php

use App\Models\Language;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('site_page_translations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('site_page_id')->constrained()->cascadeOnDelete();
            $table->foreignId('language_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->longText('body')->nullable();
            $table->timestamps();

            $table->unique(['site_page_id', 'language_id']);
        });

        $this->backfill();
    }

    public function down(): void
    {
        Schema::table('site_pages', function (Blueprint $table): void {
            $table->string('title')->nullable()->after('slug');
        });

        $language = $this->defaultLanguage();

        if ($language) {
            DB::table('site_page_translations')
                ->where('language_id', $language->id)
                ->orderBy('id')
                ->chunkById(100, function ($rows): void {
                    foreach ($rows as $row) {
                        DB::table('site_pages')
                            ->where('id', $row->site_page_id)
                            ->update(['title' => $row->title]);
                    }
                });
        }

        Schema::dropIfExists('site_page_translations');

        Schema::table('site_pages', function (Blueprint $table): void {
            $table->dropColumn('title');
        });
    }

    /**
     * Move each page's title and rich-text body (currently nested inside the
     * `content` JSON) into a default-language row, then drop the parent title
     * column. The structured/video keys stay in `content` (shared across
     * languages); only title + body become localized.
     */
    private function backfill(): void
    {
        $language = $this->defaultLanguage();
        $hasTitle = Schema::hasColumn('site_pages', 'title');

        if ($language && $hasTitle) {
            $now = now();

            DB::table('site_pages')
                ->whereNotNull('title')
                ->orderBy('id')
                ->chunkById(100, function ($pages) use ($language, $now): void {
                    $rows = [];

                    foreach ($pages as $page) {
                        $content = json_decode((string) $page->content, true) ?: [];

                        $rows[] = [
                            'site_page_id' => $page->id,
                            'language_id' => $language->id,
                            'title' => $page->title ?? '',
                            'body' => $content['body'] ?? null,
                            'created_at' => $now,
                            'updated_at' => $now,
                        ];
                    }

                    if ($rows !== []) {
                        DB::table('site_page_translations')->insert($rows);
                    }
                });
        }

        if ($hasTitle) {
            Schema::table('site_pages', function (Blueprint $table): void {
                $table->dropColumn('title');
            });
        }
    }

    private function defaultLanguage(): ?object
    {
        $code = Language::defaultCode();

        return DB::table('languages')->where('code', $code)->first()
            ?? DB::table('languages')->orderBy('id')->first();
    }
};
