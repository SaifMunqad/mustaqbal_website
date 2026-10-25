<?php

namespace App\Http\Controllers;

use App\Enums\JobApplicationStatus;
use App\Http\Requests\StoreJobApplicationRequest;
use App\Models\Job;
use App\Models\JobApplication;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\File\UploadedFile;

class SchoolJobApplyController extends Controller
{
    private const DISK = 'local';

    public function create(Job $job): Response
    {
        $this->ensureOpen($job);

        return Inertia::render('school/jobs/school-job-apply', [
            'job' => $job->toCard(),
        ]);
    }

    public function store(StoreJobApplicationRequest $request, Job $job): RedirectResponse
    {
        $this->ensureOpen($job);

        $application = DB::transaction(function () use ($request, $job): JobApplication {
            $application = $job->applications()->create([
                ...$request->only([
                    'first_name',
                    'last_name',
                    'father_name',
                    'email',
                    'phone',
                    'city',
                    'address',
                    'experience',
                    'cover_letter',
                ]),
                'user_id' => $request->user()?->id,
                'status' => JobApplicationStatus::Pending,
            ]);

            /** @var UploadedFile $file */
            foreach ($request->file('documents', []) as $file) {
                $extension = $file->getClientOriginalExtension() ?: $file->guessExtension() ?: 'dat';
                $path = 'job-applications/'.$application->id.'/'.Str::random(24).'.'.$extension;

                Storage::disk(self::DISK)->putFileAs(
                    dirname($path),
                    $file,
                    basename($path),
                );

                $application->documents()->create([
                    'path' => $path,
                    'original_name' => $file->getClientOriginalName(),
                    'mime_type' => $file->getClientMimeType(),
                    'size' => $file->getSize(),
                ]);
            }

            return $application;
        });

        return redirect()
            ->route('school.jobs')
            ->with('success', ['title' => 'flash.jobApplicationReceived', 'params' => ['job' => $job->title]]);
    }

    /**
     * Mirror the `Job::scopeActive()` rules so an application can never land on
     * a job that has since been closed or passed its deadline.
     */
    private function ensureOpen(Job $job): void
    {
        $expired = $job->deadline !== null && $job->deadline->lt(now()->toDateString());

        abort_if(! $job->is_active || $expired, 404);
    }
}
