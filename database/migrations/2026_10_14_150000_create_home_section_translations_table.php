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
        Schema::create('home_section_translations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('home_section_id')->constrained()->cascadeOnDelete();
            $table->foreignId('language_id')->constrained()->cascadeOnDelete();
            $table->string('title')->nullable();
            $table->string('heading')->nullable();
            $table->text('body')->nullable();
            $table->string('cta_label')->nullable();
            $table->timestamps();

            $table->unique(['home_section_id', 'language_id']);
        });

        $this->backfill();
    }

    public function down(): void
    {
        Schema::table('home_sections', function (Blueprint $table): void {
            $table->string('title')->nullable()->after('section_type');
        });

        $language = $this->defaultLanguage();

        if ($language) {
            DB::table('home_section_translations')
                ->where('language_id', $language->id)
                ->orderBy('id')
                ->chunkById(100, function ($rows): void {
                    foreach ($rows as $row) {
                        $section = DB::table('home_sections')->where('id', $row->home_section_id)->first();
                        $config = json_decode((string) ($section->config ?? ''), true) ?: [];

                        DB::table('home_sections')
                            ->where('id', $row->home_section_id)
                            ->update([
                                'title' => $row->title,
                                'config' => json_encode(array_merge($config, array_filter([
                                    'heading' => $row->heading,
                                    'body' => $row->body,
                                    'cta_label' => $row->cta_label,
                                ], static fn ($v): bool => $v !== null))),
                            ]);
                    }
                });
        }

        Schema::dropIfExists('home_section_translations');

        Schema::table('home_sections', function (Blueprint $table): void {
            $table->dropColumn('title');
        });
    }

    /**
     * Move each section's title plus the authored heading/body/cta_label (stored
     * inside the `config` JSON) into a default-language row, then strip those
     * keys from the parent config and drop the parent title column. The shared
     * keys (item_ids, image_url, cta_url, tone) stay in `config`.
     */
    private function backfill(): void
    {
        $language = $this->defaultLanguage();
        $hasTitle = Schema::hasColumn('home_sections', 'title');

        if ($language) {
            $now = now();

            DB::table('home_sections')
                ->orderBy('id')
                ->chunkById(100, function ($sections) use ($language, $now, $hasTitle): void {
                    $rows = [];

                    foreach ($sections as $section) {
                        $config = json_decode((string) $section->config, true) ?: [];
                        $title = $hasTitle ? ($section->title ?? null) : ($config['title'] ?? null);

                        $heading = $config['heading'] ?? null;
                        $body = $config['body'] ?? null;
                        $ctaLabel = $config['cta_label'] ?? null;

                        if (
                            ($title === null || $title === '')
                            && $heading === null
                            && $body === null
                            && $ctaLabel === null
                        ) {
                            continue;
                        }

                        $rows[] = [
                            'home_section_id' => $section->id,
                            'language_id' => $language->id,
                            'title' => $title,
                            'heading' => $heading,
                            'body' => $body,
                            'cta_label' => $ctaLabel,
                            'created_at' => $now,
                            'updated_at' => $now,
                        ];
                    }

                    if ($rows !== []) {
                        DB::table('home_section_translations')->insert($rows);
                    }
                });
        }

        // Strip the relocated authored keys from the parent config.
        DB::table('home_sections')
            ->whereNotNull('config')
            ->orderBy('id')
            ->chunkById(100, function ($sections): void {
                foreach ($sections as $section) {
                    $config = json_decode((string) $section->config, true) ?: [];
                    $remaining = array_diff_key($config, array_flip(['heading', 'body', 'cta_label']));

                    DB::table('home_sections')
                        ->where('id', $section->id)
                        ->update(['config' => json_encode($remaining)]);
                }
            });

        if ($hasTitle) {
            Schema::table('home_sections', function (Blueprint $table): void {
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
