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
        Schema::create('book_translations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('book_id')->constrained()->cascadeOnDelete();
            $table->foreignId('language_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('publisher')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();

            $table->unique(['book_id', 'language_id']);
        });

        $this->backfill();
    }

    public function down(): void
    {
        Schema::table('books', function (Blueprint $table): void {
            $table->string('title')->nullable()->after('id');
            $table->string('publisher')->nullable()->after('published_year');
            $table->text('description')->nullable()->after('isbn');
        });

        $language = $this->defaultLanguage();

        if ($language) {
            DB::table('book_translations')
                ->where('language_id', $language->id)
                ->orderBy('id')
                ->chunkById(100, function ($rows): void {
                    foreach ($rows as $row) {
                        DB::table('books')
                            ->where('id', $row->book_id)
                            ->update([
                                'title' => $row->title,
                                'publisher' => $row->publisher,
                                'description' => $row->description,
                            ]);
                    }
                });
        }

        Schema::dropIfExists('book_translations');

        Schema::table('books', function (Blueprint $table): void {
            $table->dropColumn(['title', 'publisher', 'description']);
        });
    }

    private function backfill(): void
    {
        $language = $this->defaultLanguage();
        $hasColumns = Schema::hasColumn('books', 'title');

        if ($language && $hasColumns) {
            $now = now();

            DB::table('books')
                ->whereNotNull('title')
                ->orderBy('id')
                ->chunkById(100, function ($books) use ($language, $now): void {
                    $rows = [];

                    foreach ($books as $book) {
                        $rows[] = [
                            'book_id' => $book->id,
                            'language_id' => $language->id,
                            'title' => $book->title ?? '',
                            'publisher' => $book->publisher ?? null,
                            'description' => $book->description ?? null,
                            'created_at' => $now,
                            'updated_at' => $now,
                        ];
                    }

                    if ($rows !== []) {
                        DB::table('book_translations')->insert($rows);
                    }
                });
        }

        if ($hasColumns) {
            Schema::table('books', function (Blueprint $table): void {
                $table->dropColumn(['title', 'publisher', 'description']);
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
