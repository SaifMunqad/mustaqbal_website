<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Article;
use App\Models\Language;
use App\Models\Program;
use App\Models\ProgramTranslation;
use App\Models\ProgramTypeTranslation;
use App\Models\SitePage;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $languages = collect([
            ['code' => 'ar', 'name' => 'Arabic'],
            ['code' => 'ps', 'name' => 'Pashto'],
            ['code' => 'en', 'name' => 'English'],
            ['code' => 'fa_AF', 'name' => 'Dari'],
        ])->mapWithKeys(function (array $language): array {
            $model = Language::query()->updateOrCreate(
                ['code' => $language['code']],
                ['name' => $language['name']],
            );

            return [$language['code'] => $model];
        });

        $user = User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'role' => UserRole::Management->value,
                'password' => 'password',
                'email_verified_at' => now(),
            ]
        );

        SitePage::updateOrCreate(
            ['slug' => 'about'],
            [
                'title' => 'About Mustaqbal School',
                'hero_image' => 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1400&q=80',
                'content' => [
                    'vision' => 'Build a confident and capable generation guided by knowledge and values.',
                    'manager_message' => 'We welcome every learner to a safe, modern, and inspiring environment.',
                    'goals' => [
                        'Academic excellence',
                        'Character building',
                        'Community service and leadership',
                    ],
                    'main_points' => [
                        'Experienced teachers',
                        'Modern classrooms',
                        'Balanced extracurricular programs',
                    ],
                ],
                'is_published' => true,
            ],
        );

        SitePage::updateOrCreate(
            ['slug' => 'programs'],
            [
                'title' => 'Programs at Mustaqbal School',
                'content' => [
                    'intro' => 'We offer school, courses, and Islamic Madrasa programs for different age groups.',
                ],
                'is_published' => true,
            ],
        );

        SitePage::updateOrCreate(
            ['slug' => 'contact'],
            [
                'title' => 'Contact Mustaqbal School',
                'content' => [
                    'phone_numbers' => ['+93 700 000 001', '+93 799 000 001'],
                    'email' => 'info@mustaqbal.af',
                    'address' => 'Kart-e-Char, Kabul, Afghanistan',
                    'map_embed_url' => 'https://maps.google.com/maps?q=Kabul%20Afghanistan&t=&z=13&ie=UTF8&iwloc=&output=embed',
                ],
                'is_published' => true,
            ],
        );

        $programs = [
            [
                'name' => 'Primary School Program',
                'program_type' => 'school',
                'description' => 'Core primary education with activity-based learning.',
                'schedule' => 'Sat-Thu, 8:00 AM - 12:30 PM',
                'fees' => 2500,
                'age_recommendation' => '6-12 years',
                'classroom_number' => 'A-01',
                'available_for_enroll' => true,
                'display_order' => 1,
            ],
            [
                'name' => 'English Language Course',
                'program_type' => 'courses',
                'description' => 'Communication-focused English classes for youth.',
                'schedule' => 'Sun-Tue-Thu, 2:00 PM - 4:00 PM',
                'fees' => 1800,
                'age_recommendation' => '12-18 years',
                'classroom_number' => 'C-03',
                'available_for_enroll' => true,
                'display_order' => 2,
            ],
            [
                'name' => 'Islamic Madrasa Foundations',
                'program_type' => 'islamic_madrasa',
                'description' => 'Quran, Tajweed, and Islamic studies foundation program.',
                'schedule' => 'Sat-Wed, 1:00 PM - 3:00 PM',
                'fees' => 1500,
                'age_recommendation' => '8-16 years',
                'classroom_number' => 'M-02',
                'available_for_enroll' => true,
                'display_order' => 3,
            ],
        ];

        foreach ($programs as $program) {
            $model = Program::updateOrCreate(
                ['name' => $program['name']],
                $program,
            );

            $programTranslations = [
                'en' => [
                    'name' => $program['name'],
                    'description' => $program['description'],
                ],
                'ar' => match ($program['program_type']) {
                    'school' => ['name' => 'برنامج المرحلة الابتدائية', 'description' => 'تعليم ابتدائي اساسي مع تعلم قائم على الانشطة.'],
                    'courses' => ['name' => 'دورة اللغة الانجليزية', 'description' => 'دروس لغة انجليزية تركز على التواصل لفئة الشباب.'],
                    default => ['name' => 'اساسيات المدرسة الاسلامية', 'description' => 'برنامج تأسيسي في القران والتجويد والدراسات الاسلامية.'],
                },
                'ps' => match ($program['program_type']) {
                    'school' => ['name' => 'د ابتدايي ښوونځي پروګرام', 'description' => 'بنسټيزه ابتدايي زده کړه د فعاليت-محور زده کړې سره.'],
                    'courses' => ['name' => 'د انګليسي ژبې کورس', 'description' => 'د ځوانانو لپاره د اړيکو-محور انګليسي ټولګي.'],
                    default => ['name' => 'د اسلامي مدرسې بنسټونه', 'description' => 'د قران، تجويد او اسلامي زده کړو بنسټيز پروګرام.'],
                },
                'fa_AF' => match ($program['program_type']) {
                    'school' => ['name' => 'برنامه مکتب ابتدائي', 'description' => 'آموزش ابتدائي اساسي با يادگيري مبتني بر فعاليت.'],
                    'courses' => ['name' => 'دوره زبان انگليسي', 'description' => 'کلاس هاي زبان انگليسي با تمرکز بر مهارت ارتباطي براي نوجوانان.'],
                    default => ['name' => 'مباني مدرسه اسلامي', 'description' => 'برنامه بنيادي قران، تجويد و مطالعات اسلامي.'],
                },
            ];

            foreach ($programTranslations as $code => $translation) {
                ProgramTranslation::query()->updateOrCreate(
                    [
                        'program_id' => $model->id,
                        'language_id' => $languages[$code]->id,
                    ],
                    $translation,
                );
            }
        }

        $programTypeTranslations = [
            'school' => [
                'en' => 'School Programs',
                'ar' => 'البرامج المدرسية',
                'ps' => 'ښوونيز پروګرامونه',
                'fa_AF' => 'برنامه هاي مکتب',
            ],
            'courses' => [
                'en' => 'Courses',
                'ar' => 'الدورات',
                'ps' => 'کورسونه',
                'fa_AF' => 'دوره ها',
            ],
            'islamic_madrasa' => [
                'en' => 'Islamic Madrasa',
                'ar' => 'المدرسة الاسلامية',
                'ps' => 'اسلامي مدرسه',
                'fa_AF' => 'مدرسه اسلامي',
            ],
        ];

        foreach ($programTypeTranslations as $type => $translations) {
            foreach ($translations as $code => $label) {
                ProgramTypeTranslation::query()->updateOrCreate(
                    [
                        'program_type' => $type,
                        'language_id' => $languages[$code]->id,
                    ],
                    ['label' => $label],
                );
            }
        }

        Article::updateOrCreate(
            ['slug' => 'welcome-to-mustaqbal'],
            [
                'user_id' => $user->id,
                'title' => 'Welcome to Mustaqbal School',
                'slug' => 'welcome-to-mustaqbal',
                'excerpt' => 'Our mission, values, and commitment to student success.',
                'body' => 'Mustaqbal School welcomes all students and families. We are dedicated to quality education and positive growth.',
                'cover_image' => 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80',
                'published_at' => now(),
                'is_published' => true,
            ],
        );
    }
}
