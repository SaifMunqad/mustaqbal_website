<?php

use App\Models\Language;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Localizes the structured About-page sections. Today they live in the shared
 * parent `site_pages.content` JSON; this adds a per-language `content` column to
 * `site_page_translations` so editors can translate stats/values/mission/etc.
 * per language, mirroring the `home_section_translations` and
 * `site_setting_translations` patterns.
 *
 * Backfill copies each page's shared structured keys (everything except the
 * already-localized `body` and the legacy `manager_message`) into the default
 * language's translation row, so existing content keeps rendering while the
 * parent column gradually becomes shared-only (video embed).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('site_page_translations', function (Blueprint $table): void {
            $table->json('content')->nullable()->after('body');
        });

        $language = Language::defaultCode();

        $row = DB::table('languages')->where('code', $language)->first()
            ?? DB::table('languages')->orderBy('id')->first();

        if (! $row) {
            return;
        }

        DB::table('site_pages')
            ->whereNotNull('content')
            ->orderBy('id')
            ->chunkById(100, function ($pages) use ($row): void {
                foreach ($pages as $page) {
                    $content = json_decode((string) $page->content, true) ?: [];
                    // `body` is already localized; drop the legacy manager_message.
                    $structured = array_diff_key($content, array_flip(['body', 'manager_message']));

                    if ($structured === []) {
                        continue;
                    }

                    DB::table('site_page_translations')
                        ->where('site_page_id', $page->id)
                        ->where('language_id', $row->id)
                        ->update(['content' => json_encode($structured)]);
                }
            });
    }

    public function down(): void
    {
        Schema::table('site_page_translations', function (Blueprint $table): void {
            $table->dropColumn('content');
        });
    }
};
