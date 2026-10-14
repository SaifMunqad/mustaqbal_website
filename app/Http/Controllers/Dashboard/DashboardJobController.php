<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Job;
use App\Support\Translation\TranslationPayload;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DashboardJobController extends Controller
{
    /**
     * @var list<string>
     */
    private const TRANSLATED = ['title', 'department', 'description', 'requirements'];

    public function index(Request $request): Response
    {
        $jobs = Job::query()
            ->with(['author:id,name', 'translations.language'])
            ->search($request->string('search')->toString())
            ->orderByDesc('created_at')
            ->paginate(15)
            ->through(fn (Job $job): array => [
                'id' => $job->id,
                'title' => $job->title,
                'department' => $job->department,
                'category' => $job->category,
                'category_label' => $job->categoryLabel(),
                'employment_type' => $job->employment_type,
                'working_hours' => $job->working_hours,
                'deadline' => $job->deadline?->toDateString(),
                'is_active' => $job->is_active,
                'author' => $job->author?->name,
                'created_at' => $job->created_at->toIso8601String(),
            ]);

        return Inertia::render('dashboard/jobs/index', [
            'jobs' => $jobs,
            'filters' => ['search' => $request->string('search')->toString()],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('dashboard/jobs/create', [
            'employmentTypes' => $this->employmentTypeOptions(),
            'categories' => $this->categoryOptions(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate($this->rules());

        $payload = TranslationPayload::extract($request, self::TRANSLATED);
        $defaultTitle = TranslationPayload::defaultAttributes($payload)['title'] ?? '';

        $job = Job::query()->create([
            ...Arr::only($request->only($this->parentFields()), $this->parentFields()),
            'slug' => Str::slug($defaultTitle).'-'.Str::lower(Str::random(4)),
            'user_id' => $request->user()->id,
            'is_active' => (bool) $request->input('is_active', true),
        ]);

        TranslationPayload::apply($job->translations(), $payload);

        return redirect()
            ->route('dashboard.jobs.index')
            ->with('success', 'Job created.');
    }

    public function edit(Job $job): Response
    {
        $job->load(['translations.language']);

        return Inertia::render('dashboard/jobs/edit', [
            'job' => $job,
            'translations' => $this->existingTranslations($job),
            'employmentTypes' => $this->employmentTypeOptions(),
            'categories' => $this->categoryOptions(),
        ]);
    }

    public function update(Request $request, Job $job): RedirectResponse
    {
        $request->validate($this->rules());

        $job->update([
            ...Arr::only($request->only($this->parentFields()), $this->parentFields()),
            'is_active' => (bool) $request->input('is_active'),
        ]);

        TranslationPayload::apply($job->translations(), TranslationPayload::extract($request, self::TRANSLATED));

        return redirect()
            ->route('dashboard.jobs.index')
            ->with('success', 'Job updated.');
    }

    public function destroy(Job $job): RedirectResponse
    {
        $job->delete();

        return redirect()
            ->route('dashboard.jobs.index')
            ->with('success', 'Job deleted.');
    }

    /**
     * @return list<string>
     */
    private function parentFields(): array
    {
        return [
            'category',
            'employment_type',
            'working_hours',
            'application_email',
            'application_url',
            'deadline',
            'is_active',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function rules(): array
    {
        return array_merge([
            'category' => ['nullable', Rule::in(['school', 'course', 'islamic_madrasa'])],
            'employment_type' => ['required', Rule::in(['full_time', 'part_time', 'contract'])],
            'working_hours' => ['nullable', 'string', 'max:255'],
            'application_email' => ['nullable', 'email', 'max:255'],
            'application_url' => ['nullable', 'url', 'max:500'],
            'deadline' => ['nullable', 'date'],
            'is_active' => ['nullable', 'boolean'],
        ], TranslationPayload::rules(self::TRANSLATED, [
            'title' => ['string', 'max:255'],
            'department' => ['string', 'max:255'],
            'description' => ['string'],
            'requirements' => ['string'],
        ], ['title', 'description']));
    }

    private function employmentTypeOptions(): array
    {
        return [
            ['value' => 'full_time', 'label' => 'Full Time'],
            ['value' => 'part_time', 'label' => 'Part Time'],
            ['value' => 'contract', 'label' => 'Contract'],
        ];
    }

    /**
     * Program-style categories aligned with the school's Program types so the
     * public job card can render the same label vocabulary.
     */
    private function categoryOptions(): array
    {
        return [
            ['value' => '', 'label' => 'No category'],
            ['value' => 'school', 'label' => 'School'],
            ['value' => 'course', 'label' => 'Course'],
            ['value' => 'islamic_madrasa', 'label' => 'Islamic Madrasa'],
        ];
    }

    /**
     * @return array<string, array<string, string>>
     */
    private function existingTranslations(Job $job): array
    {
        return $job->translations
            ->filter(fn ($translation) => $translation->language)
            ->mapWithKeys(fn ($translation): array => [
                $translation->language->code => [
                    'title' => (string) $translation->title,
                    'department' => (string) $translation->department,
                    'description' => (string) $translation->description,
                    'requirements' => (string) $translation->requirements,
                ],
            ])
            ->all();
    }
}
