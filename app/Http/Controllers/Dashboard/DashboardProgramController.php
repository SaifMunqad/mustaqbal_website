<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\StoreProgramRequest;
use App\Http\Requests\Dashboard\UpdateProgramRequest;
use App\Models\Language;
use App\Models\Program;
use App\Support\Translation\TranslationPayload;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardProgramController extends Controller
{
    /**
     * Program columns that vary per language. The parent `programs` row keeps
     * mirroring the default-language values (source of truth); alternate
     * languages are stored on `program_translations`.
     *
     * @var list<string>
     */
    private const TRANSLATED = ['name', 'description', 'schedule', 'age_recommendation', 'classroom_number'];

    public function index(): Response
    {
        $locale = app()->getLocale();

        $programs = Program::query()
            ->with(['translations.language', 'typeTranslations.language'])
            ->orderBy('display_order')
            ->orderBy('name')
            ->paginate(20)
            ->through(fn (Program $program): array => [
                'id' => $program->id,
                'name' => $program->translatedName($locale),
                'program_type' => $program->program_type,
                'program_type_label' => $program->translatedProgramType($locale),
                'schedule' => $program->translatedSchedule($locale),
                'fees' => $program->fees,
                'available_for_enroll' => $program->available_for_enroll,
            ]);

        return Inertia::render('dashboard/programs/dashboard-programs-index', [
            'programs' => $programs,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('dashboard/programs/dashboard-programs-create');
    }

    public function store(StoreProgramRequest $request): RedirectResponse
    {
        $payload = $this->normalizedPayload($request);
        $defaults = TranslationPayload::defaultAttributes($payload);

        $program = Program::query()->create([
            ...$this->configAttributes($request),
            'name' => $defaults['name'] ?? '',
            'description' => $defaults['description'] ?? '',
            'schedule' => $defaults['schedule'] ?? '',
            'age_recommendation' => $defaults['age_recommendation'] ?? '',
            'classroom_number' => $defaults['classroom_number'] ?? null,
        ]);

        TranslationPayload::apply($program->translations(), $payload);

        return redirect()
            ->route('dashboard.programs.index')
            ->with('success', 'flash.programCreated');
    }

    public function edit(Program $program): Response
    {
        $program->load(['translations.language']);

        return Inertia::render('dashboard/programs/dashboard-programs-edit', [
            'program' => $program,
            'translations' => $this->existingTranslations($program),
        ]);
    }

    public function update(UpdateProgramRequest $request, Program $program): RedirectResponse
    {
        $payload = $this->normalizedPayload($request);
        $defaults = TranslationPayload::defaultAttributes($payload);

        $program->update([
            ...$this->configAttributes($request),
            'name' => $defaults['name'] ?? $program->name,
            'description' => $defaults['description'] ?? $program->description,
            'schedule' => $defaults['schedule'] ?? $program->schedule,
            'age_recommendation' => $defaults['age_recommendation'] ?? $program->age_recommendation,
            'classroom_number' => $defaults['classroom_number'] ?? null,
        ]);

        TranslationPayload::apply($program->translations(), $payload);

        return redirect()
            ->route('dashboard.programs.index')
            ->with('success', 'flash.programUpdated');
    }

    /**
     * Extract the submitted translations and guarantee every language row carries
     * the NOT NULL name/description columns (empty strings fall back to the
     * default language at read time, since empty values are treated as unset).
     *
     * @return array<string, array<string, mixed>>
     */
    private function normalizedPayload(Request $request): array
    {
        $payload = TranslationPayload::extract($request, self::TRANSLATED);

        foreach ($payload as $code => $fields) {
            $payload[$code]['name'] ??= '';
            $payload[$code]['description'] ??= '';
        }

        return $payload;
    }

    /**
     * Language-agnostic columns stored directly on the parent row.
     *
     * @return array<string, mixed>
     */
    private function configAttributes(Request $request): array
    {
        return [
            'program_type' => $request->input('program_type'),
            'fees' => $request->input('fees'),
            'available_for_enroll' => ! empty($request->input('available_for_enroll')),
            'display_order' => $request->input('display_order', 0),
        ];
    }

    /**
     * Existing per-language content keyed by language code for the editor. The
     * default-language tab is seeded from the parent columns so a value authored
     * before per-language editing was available still shows as the source.
     *
     * @return array<string, array<string, string>>
     */
    private function existingTranslations(Program $program): array
    {
        $existing = $program->translations
            ->filter(fn ($translation) => $translation->language)
            ->mapWithKeys(fn ($translation): array => [
                $translation->language->code => [
                    'name' => (string) $translation->name,
                    'description' => (string) $translation->description,
                    'schedule' => (string) $translation->schedule,
                    'age_recommendation' => (string) $translation->age_recommendation,
                    'classroom_number' => (string) $translation->classroom_number,
                ],
            ])
            ->all();

        $defaultCode = Language::defaultCode();

        foreach (self::TRANSLATED as $field) {
            if (empty($existing[$defaultCode][$field])) {
                $existing[$defaultCode][$field] = (string) $program->{$field};
            }
        }

        return $existing;
    }
}
