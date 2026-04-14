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
            'page' => $page ?? [
                'title' => 'About Mustaqbal School',
                'hero_image' => 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80',
                'content' => [
                    'vision' => 'Build a future-ready generation rooted in values and excellence.',
                    'manager_message' => 'Welcome to Mustaqbal School. We are committed to academic quality and character development.',
                    'goals' => [
                        'High quality modern curriculum',
                        'Strong Islamic and cultural values',
                        'Safe and inspiring environment',
                    ],
                    'main_points' => [
                        'Experienced teachers',
                        'Parent-school collaboration',
                        'Student clubs and activities',
                    ],
                ],
            ],
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
            'page' => $page ?? [
                'title' => 'Contact Mustaqbal School',
                'content' => [
                    'phone_numbers' => ['+93 700 000 001', '+93 799 000 001'],
                    'email' => 'info@mustaqbal.af',
                    'address' => 'Kart-e-Char, Kabul, Afghanistan',
                    'map_embed_url' => 'https://maps.google.com/maps?q=Kabul%20Afghanistan&t=&z=13&ie=UTF8&iwloc=&output=embed',
                ],
            ],
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


