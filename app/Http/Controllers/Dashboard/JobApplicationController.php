<?php

namespace App\Http\Controllers\Dashboard;

use App\Enums\JobApplicationStatus;
use App\Http\Controllers\Controller;
use App\Models\Job;
use App\Models\JobApplication;
use App\Models\JobApplicationDocument;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class JobApplicationController extends Controller
{
    private const DISK = 'local';

    public function index(Request $request, ?Job $job = null): Response
    {
        $status = $request->string('status')->toString();
        $statusFilter = in_array($status, JobApplicationStatus::values(), true)
            ? JobApplicationStatus::tryFrom($status)
            : null;

        $applications = JobApplication::query()
            ->with('job')
            ->withCount('documents')
            ->when($job, fn ($query) => $query->where('job_id', $job->id))
            ->forStatus($statusFilter)
            ->search($request->string('search')->toString())
            ->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(fn (JobApplication $application): array => $application->toRow());

        return Inertia::render('dashboard/jobs/dashboard-job-applications-index', [
            'applications' => $applications,
            'job' => $job ? ['id' => $job->id, 'title' => $job->title] : null,
            'filters' => [
                'search' => $request->string('search')->toString(),
                'status' => $status,
            ],
            'jobs' => Job::query()->with('translations.language')->orderByDesc('created_at')->get(['id'])->map(fn (Job $jobRow): array => [
                'id' => $jobRow->id,
                'title' => $jobRow->title,
            ])->values(),
            'statuses' => array_map(fn (JobApplicationStatus $case): array => [
                'value' => $case->value,
                'label' => $case->label(),
                'labelKey' => $case->labelKey(),
            ], JobApplicationStatus::cases()),
            'selectedCount' => JobApplication::query()
                ->when($job, fn ($query) => $query->where('job_id', $job->id))
                ->where('status', JobApplicationStatus::Selected->value)
                ->count(),
        ]);
    }

    public function show(JobApplication $application): Response
    {
        $application->load(['job', 'documents', 'user:id,name']);

        // Opening an application for the first time is itself a "read" signal,
        // so a still-pending row moves to read without a separate click.
        if ($application->status === JobApplicationStatus::Pending) {
            $application->update(['status' => JobApplicationStatus::Read]);
            $application->refresh();
        }

        return Inertia::render('dashboard/jobs/dashboard-job-application-show', [
            'application' => [
                ...$application->toRow(),
                'experience' => $application->experience,
                'cover_letter' => $application->cover_letter,
                'address' => $application->address,
                'applicant_user' => $application->user?->name,
                'documents' => $application->documents->map(fn (JobApplicationDocument $document): array => $document->toRow()),
            ],
            'statuses' => array_map(fn (JobApplicationStatus $case): array => [
                'value' => $case->value,
                'label' => $case->label(),
                'labelKey' => $case->labelKey(),
            ], JobApplicationStatus::cases()),
        ]);
    }

    public function updateStatus(Request $request, JobApplication $application): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(JobApplicationStatus::values())],
        ]);

        $application->update(['status' => JobApplicationStatus::from($validated['status'])]);

        return back()->with('success', 'flash.jobApplicationStatusUpdated');
    }

    public function downloadDocument(JobApplicationDocument $document): StreamedResponse
    {
        abort_unless(Storage::disk(self::DISK)->exists($document->path), 404);

        return Storage::disk(self::DISK)->download($document->path, $document->original_name);
    }
}
