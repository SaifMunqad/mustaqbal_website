<?php

namespace App\Http\Controllers;

use App\Models\Program;
use App\Models\SitePage;
use Inertia\Inertia;
use Inertia\Response;

class SchoolPageController extends Controller
{
    public function about(): Response
    {
        $page = SitePage::query()->where('slug', 'about')->where('is_published', true)->first();

        return Inertia::render('school/about/index', [
            'page' => $page,
        ]);
    }

    public function programs(): Response
    {
        $locale = app()->getLocale();

        $page = SitePage::query()->where('slug', 'programs')->where('is_published', true)->first();

        $programs = Program::query()
            ->with(['translations.language', 'typeTranslations.language'])
            ->orderBy('display_order')
            ->orderBy('name')
            ->get()
            ->map(fn (Program $program): array => [
                'id' => $program->id,
                'name' => $program->translatedName($locale),
                'program_type' => $program->program_type,
                'program_type_label' => $program->translatedProgramType($locale),
                'description' => $program->translatedDescription($locale),
                'schedule' => $program->schedule,
                'fees' => $program->fees,
                'age_recommendation' => $program->age_recommendation,
                'classroom_number' => $program->classroom_number,
                'available_for_enroll' => $program->available_for_enroll,
            ]);

        return Inertia::render('school/programs/index', [
            'page' => $page,
            'programs' => $programs,
        ]);
    }

    public function contact(): Response
    {
        $page = SitePage::query()->where('slug', 'contact')->where('is_published', true)->first();

        return Inertia::render('school/contact/index', [
            'page' => $page,
        ]);
    }

    public function enrollment(): Response
    {
        return Inertia::render('school/enroll/index');
    }

    public function resendEnrollmentEmail(): Response
    {
        return Inertia::render('school/enroll/resend-email');
    }
}


