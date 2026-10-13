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
            ->map(fn (Job $job): array => $job->toCard());

        return Inertia::render('school/jobs/index', [
            'jobs' => $jobs,
        ]);
    }
}
