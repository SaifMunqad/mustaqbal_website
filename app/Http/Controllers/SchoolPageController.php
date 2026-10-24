<?php

namespace App\Http\Controllers;

use App\Models\Program;
use App\Models\SitePage;
use App\Support\Home\PageSections;
use Inertia\Inertia;
use Inertia\Response;

class SchoolPageController extends Controller
{
    public function about(): Response
    {
        $page = SitePage::query()
            ->with('translations.language')
            ->where('slug', 'about')
            ->where('is_published', true)
            ->first();

        return Inertia::render('school/about/school-about', [
            'page' => $page,
            // Authored layout from the unified page builder. Empty until the
            // backfill/editor has run, in which case the view keeps rendering
            // the legacy site_pages composition.
            'blocks' => PageSections::render('about'),
        ]);
    }

    public function programs(): Response
    {
        $locale = app()->getLocale();

        $page = SitePage::query()
            ->with('translations.language')
            ->where('slug', 'programs')
            ->where('is_published', true)
            ->first();

        $programs = Program::query()
            ->with(['translations.language', 'typeTranslations.language'])
            ->orderBy('display_order')
            ->orderBy('name')
            ->orderBy('id')
            ->paginate(9)
            ->withQueryString()
            ->through(fn (Program $program): array => [
                'id' => $program->id,
                'name' => $program->translatedName($locale),
                'program_type' => $program->program_type,
                'program_type_label' => $program->translatedProgramType($locale),
                'description' => $program->translatedDescription($locale),
                'schedule' => $program->translatedSchedule($locale),
                'fees' => $program->fees,
                'age_recommendation' => $program->translatedAgeRecommendation($locale),
                'classroom_number' => $program->translatedClassroomNumber($locale),
                'available_for_enroll' => $program->available_for_enroll,
            ]);

        // Per-category totals stay stable while the listing grows page by page.
        $programCounts = Program::query()
            ->selectRaw('program_type, count(*) as aggregate')
            ->groupBy('program_type')
            ->pluck('aggregate', 'program_type')
            ->all();

        return Inertia::render('school/programs/school-programs', [
            'page' => $page,
            'programs' => $programs,
            'programCounts' => $programCounts,
        ]);
    }

    public function contact(): Response
    {
        $page = SitePage::query()
            ->with('translations.language')
            ->where('slug', 'contact')
            ->where('is_published', true)
            ->first();

        return Inertia::render('school/contact/school-contact', [
            'page' => $page,
            // Authored layout from the unified page builder. Empty until the
            // contact page has blocks, in which case the view keeps rendering
            // the legacy site_pages composition.
            'blocks' => PageSections::render('contact'),
        ]);
    }

    public function enrollment(): Response
    {
        return Inertia::render('school/enroll/school-enroll');
    }

    public function resendEnrollmentEmail(): Response
    {
        return Inertia::render('school/enroll/school-enroll-resend-email');
    }
}
