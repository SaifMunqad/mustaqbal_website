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
        Schema::create('post_translations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('post_id')->constrained()->cascadeOnDelete();
            $table->foreignId('language_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('content');
            $table->timestamps();

            $table->unique(['post_id', 'language_id']);
        });

        $this->backfill();
    }

    public function down(): void
    {
        // Restore the inline columns before removing the translations table so
        // existing localized data can flow back into the default language.
        Schema::table('posts', function (Blueprint $table): void {
            $table->string('title')->nullable()->after('visibility');
            $table->text('content')->nullable()->after('title');
        });

        $language = $this->defaultLanguage();

        if ($language) {
            DB::table('post_translations')
                ->where('language_id', $language->id)
                ->orderBy('id')
                ->chunkById(100, function ($rows): void {
                    foreach ($rows as $row) {
                        DB::table('posts')
                            ->where('id', $row->post_id)
                            ->update(['title' => $row->title, 'content' => $row->content]);
                    }
                });
        }

        Schema::dropIfExists('post_translations');

        Schema::table('posts', function (Blueprint $table): void {
            $table->dropColumn(['title', 'content']);
        });
    }

    /**
     * Copy each post's inline title/content into a default-language row (when a
     * language exists and the columns are still present), then always drop the
     * relocated columns now that the translations table owns them.
     */
    private function backfill(): void
    {
        $language = $this->defaultLanguage();
        $hasColumns = Schema::hasColumn('posts', 'title');

        if ($language && $hasColumns) {
            $now = now();

            DB::table('posts')
                ->whereNotNull('title')
                ->orderBy('id')
                ->chunkById(100, function ($posts) use ($language, $now): void {
                    $rows = [];

                    foreach ($posts as $post) {
                        $rows[] = [
                            'post_id' => $post->id,
                            'language_id' => $language->id,
                            'title' => $post->title ?? '',
                            'content' => $post->content ?? '',
                            'created_at' => $now,
                            'updated_at' => $now,
                        ];
                    }

                    if ($rows !== []) {
                        DB::table('post_translations')->insert($rows);
                    }
                });
        }

        if ($hasColumns) {
            Schema::table('posts', function (Blueprint $table): void {
                $table->dropColumn(['title', 'content']);
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
