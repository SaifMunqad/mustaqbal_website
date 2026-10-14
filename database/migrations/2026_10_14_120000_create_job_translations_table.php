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
        Schema::create('job_translations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('job_id')->constrained('job_postings')->cascadeOnDelete();
            $table->foreignId('language_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('department')->nullable();
            $table->text('description');
            $table->text('requirements')->nullable();
            $table->timestamps();

            $table->unique(['job_id', 'language_id']);
        });

        $this->backfill();
    }

    public function down(): void
    {
        Schema::table('job_postings', function (Blueprint $table): void {
            $table->string('title')->nullable()->after('slug');
            $table->string('department')->nullable()->after('title');
            $table->text('description')->nullable()->after('category');
            $table->text('requirements')->nullable()->after('description');
        });

        $language = $this->defaultLanguage();

        if ($language) {
            DB::table('job_translations')
                ->where('language_id', $language->id)
                ->orderBy('id')
                ->chunkById(100, function ($rows): void {
                    foreach ($rows as $row) {
                        DB::table('job_postings')
                            ->where('id', $row->job_id)
                            ->update([
                                'title' => $row->title,
                                'department' => $row->department,
                                'description' => $row->description,
                                'requirements' => $row->requirements,
                            ]);
                    }
                });
        }

        Schema::dropIfExists('job_translations');

        Schema::table('job_postings', function (Blueprint $table): void {
            $table->dropColumn(['title', 'department', 'description', 'requirements']);
        });
    }

    private function backfill(): void
    {
        $language = $this->defaultLanguage();
        $hasColumns = Schema::hasColumn('job_postings', 'title');

        if ($language && $hasColumns) {
            $now = now();

            DB::table('job_postings')
                ->whereNotNull('title')
                ->orderBy('id')
                ->chunkById(100, function ($jobs) use ($language, $now): void {
                    $rows = [];

                    foreach ($jobs as $job) {
                        $rows[] = [
                            'job_id' => $job->id,
                            'language_id' => $language->id,
                            'title' => $job->title ?? '',
                            'department' => $job->department ?? null,
                            'description' => $job->description ?? '',
                            'requirements' => $job->requirements ?? null,
                            'created_at' => $now,
                            'updated_at' => $now,
                        ];
                    }

                    if ($rows !== []) {
                        DB::table('job_translations')->insert($rows);
                    }
                });
        }

        if ($hasColumns) {
            Schema::table('job_postings', function (Blueprint $table): void {
                $table->dropColumn(['title', 'department', 'description', 'requirements']);
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
