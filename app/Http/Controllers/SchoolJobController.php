<?php

namespace App\Http\Controllers;

use App\Models\Job;
use Inertia\Inertia;
use Inertia\Response;

class SchoolJobController extends Controller
{
    public function index(): Response
    {
        $jobs = Job::query()
            ->active()
            ->get()
            ->map(fn (Job $job): array => [
                'id' => $job->id,
                'title' => $job->title,
                'slug' => $job->slug,
                'department' => $job->department,
                'category' => $job->category,
                'category_label' => $job->categoryLabel(),
                'description' => $job->description,
                'requirements' => $job->requirements,
                'employment_type' => $job->employment_type,
                'working_hours' => $job->working_hours,
                'application_email' => $job->application_email,
                'application_url' => $job->application_url,
                'deadline' => $job->deadline?->toDateString(),
                'created_at' => $job->created_at->toIso8601String(),
            ]);

        return Inertia::render('school/jobs/index', [
            'jobs' => $jobs,
        ]);
    }
}
