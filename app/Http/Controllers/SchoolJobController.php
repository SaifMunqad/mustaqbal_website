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
            ->with('translations.language')
            ->active()
            ->paginate(10)
            ->withQueryString()
            ->through(fn (Job $job): array => $job->toCard());

        return Inertia::render('school/jobs/school-jobs', [
            'jobs' => $jobs,
        ]);
    }
}
