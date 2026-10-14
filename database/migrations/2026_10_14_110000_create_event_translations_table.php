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
        Schema::create('event_translations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('event_id')->constrained()->cascadeOnDelete();
            $table->foreignId('language_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('excerpt')->nullable();
            $table->longText('body')->nullable();
            $table->string('location')->nullable();
            $table->timestamps();

            $table->unique(['event_id', 'language_id']);
        });

        $this->backfill();
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table): void {
            $table->string('title')->nullable()->after('user_id');
            $table->text('excerpt')->nullable()->after('slug');
            $table->longText('body')->nullable()->after('excerpt');
            $table->string('location')->nullable()->after('images');
        });

        $language = $this->defaultLanguage();

        if ($language) {
            DB::table('event_translations')
                ->where('language_id', $language->id)
                ->orderBy('id')
                ->chunkById(100, function ($rows): void {
                    foreach ($rows as $row) {
                        DB::table('events')
                            ->where('id', $row->event_id)
                            ->update([
                                'title' => $row->title,
                                'excerpt' => $row->excerpt,
                                'body' => $row->body,
                                'location' => $row->location,
                            ]);
                    }
                });
        }

        Schema::dropIfExists('event_translations');

        Schema::table('events', function (Blueprint $table): void {
            $table->dropColumn(['title', 'excerpt', 'body', 'location']);
        });
    }

    /**
     * Copy each event's inline localized columns into a default-language row
     * (when a language exists and the columns are still present), then always
     * drop the relocated columns now that the translations table owns them.
     */
    private function backfill(): void
    {
        $language = $this->defaultLanguage();
        $hasColumns = Schema::hasColumn('events', 'title');

        if ($language && $hasColumns) {
            $now = now();

            DB::table('events')
                ->whereNotNull('title')
                ->orderBy('id')
                ->chunkById(100, function ($events) use ($language, $now): void {
                    $rows = [];

                    foreach ($events as $event) {
                        $rows[] = [
                            'event_id' => $event->id,
                            'language_id' => $language->id,
                            'title' => $event->title ?? '',
                            'excerpt' => $event->excerpt ?? null,
                            'body' => $event->body ?? null,
                            'location' => $event->location ?? null,
                            'created_at' => $now,
                            'updated_at' => $now,
                        ];
                    }

                    if ($rows !== []) {
                        DB::table('event_translations')->insert($rows);
                    }
                });
        }

        if ($hasColumns) {
            Schema::table('events', function (Blueprint $table): void {
                $table->dropColumn(['title', 'excerpt', 'body', 'location']);
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
