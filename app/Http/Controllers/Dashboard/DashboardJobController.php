<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Job;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DashboardJobController extends Controller
{
    public function index(Request $request): Response
    {
        $jobs = Job::query()
            ->with('author:id,name')
            ->when($request->string('search')->toString(), function ($query, string $search): void {
                $query->where('title', 'like', "%{$search}%")
                    ->orWhere('department', 'like', "%{$search}%");
            })
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
        $validated = $this->validateJob($request);

        Job::query()->create([
            ...$validated,
            'slug' => Str::slug($validated['title']) . '-' . Str::lower(Str::random(4)),
            'user_id' => $request->user()->id,
            'is_active' => (bool) ($validated['is_active'] ?? true),
        ]);

        return redirect()
            ->route('dashboard.jobs.index')
            ->with('success', 'Job created.');
    }

    public function edit(Job $job): Response
    {
        return Inertia::render('dashboard/jobs/edit', [
            'job' => $job,
            'employmentTypes' => $this->employmentTypeOptions(),
            'categories' => $this->categoryOptions(),
        ]);
    }

    public function update(Request $request, Job $job): RedirectResponse
    {
        $validated = $this->validateJob($request);

        $job->update([
            ...$validated,
            'is_active' => (bool) ($validated['is_active'] ?? false),
        ]);

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

    private function validateJob(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'department' => ['nullable', 'string', 'max:255'],
            'category' => ['nullable', Rule::in(['school', 'course', 'islamic_madrasa'])],
            'description' => ['required', 'string'],
            'requirements' => ['nullable', 'string'],
            'employment_type' => ['required', Rule::in(['full_time', 'part_time', 'contract'])],
            'working_hours' => ['nullable', 'string', 'max:255'],
            'application_email' => ['nullable', 'email', 'max:255'],
            'application_url' => ['nullable', 'url', 'max:500'],
            'deadline' => ['nullable', 'date'],
            'is_active' => ['nullable', 'boolean'],
        ]);
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
}
