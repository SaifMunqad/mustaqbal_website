<?php

namespace Database\Seeders;

use App\Models\Language;
use App\Models\Program;
use App\Models\ProgramTranslation;
use Illuminate\Database\Seeder;

/**
 * Seeds a curated catalog of programs across the three fixed categories
 * (school, courses, islamic_madrasa), each with en/ps/fa_AF translations.
 *
 * Idempotent: rows are keyed on the (English) program name, so re-running
 * updates existing programs instead of creating duplicates.
 */
class ProgramSeeder extends Seeder
{
    /**
     * Short, category-appropriate translated descriptions reused across rows.
     *
     * @var array<string, array<string, string>>
     */
    private const CATEGORY_DESCRIPTIONS = [
        'school' => [
            'ps' => 'بنسټيزه زده کړه د فعاليت-محوره تلو سره.',
            'fa_AF' => 'آموزش اساسي با يادگيري مبتني بر فعاليت.',
        ],
        'courses' => [
            'ps' => 'د زده کوونکو لپاره مهارت-محوره زده کړه.',
            'fa_AF' => 'آموزش متمرکز بر مهارت براي فراگیران.',
        ],
        'islamic_madrasa' => [
            'ps' => 'د اسلامي او قرآني زده کړو پروګرام.',
            'fa_AF' => 'برنامه مطالعات اسلامي و آموزش قرآن.',
        ],
    ];

    public function run(): void
    {
        $languages = Language::query()
            ->whereIn('code', ['en', 'ps', 'fa_AF'])
            ->pluck('id', 'code');

        foreach ($this->catalog() as $program) {
            $model = Program::query()->updateOrCreate(
                ['name' => $program['name']],
                [
                    'program_type' => $program['type'],
                    'description' => $program['description'],
                    'schedule' => $program['schedule'],
                    'fees' => $program['fees'],
                    'age_recommendation' => $program['age'],
                    'classroom_number' => $program['classroom'] ?? null,
                    'available_for_enroll' => $program['open'] ?? true,
                    'display_order' => $program['order'],
                ],
            );

            $categoryDesc = self::CATEGORY_DESCRIPTIONS[$program['type']];

            $translations = [
                'en' => [
                    'name' => $program['name'],
                    'description' => $program['description'],
                ],
                // Proper program names are kept as-is; only the description is
                // localized with a category-appropriate line.
                'ps' => [
                    'name' => $program['ps_name'] ?? $program['name'],
                    'description' => $categoryDesc['ps'],
                ],
                'fa_AF' => [
                    'name' => $program['fa_name'] ?? $program['name'],
                    'description' => $categoryDesc['fa_AF'],
                ],
            ];

            foreach ($translations as $code => $translation) {
                if (! isset($languages[$code])) {
                    continue;
                }

                ProgramTranslation::query()->updateOrCreate(
                    [
                        'program_id' => $model->id,
                        'language_id' => $languages[$code],
                    ],
                    $translation,
                );
            }
        }
    }

    /**
     * The curated catalog: 12 school + 16 courses + 12 madrasa = 40 programs.
     *
     * @return list<array<string, mixed>>
     */
    private function catalog(): array
    {
        return [
            // ---- School ----
            $this->entry('school', 1, 'Primary School Program', 'Core primary education with activity-based learning.', 'Sat-Thu, 8:00 AM - 12:30 PM', 2500, '6-12 years', 'A-01', [
                'ps_name' => 'د ابتدايي ښوونځي پروګرام',
                'fa_name' => 'برنامه مکتب ابتدائي',
            ]),
            $this->entry('school', 2, 'Kindergarten Foundation', 'Play-based early learning for young children.', 'Sat-Thu, 8:00 AM - 11:00 AM', 2000, '4-6 years', 'A-02'),
            $this->entry('school', 3, 'Pre-Primary Nurseries', 'Nurseries building early literacy and social skills.', 'Sat-Thu, 8:00 AM - 11:00 AM', 1800, '3-5 years', 'A-03'),
            $this->entry('school', 4, 'Grade 1 - Primary', 'Foundational reading, writing and numeracy.', 'Sat-Thu, 8:00 AM - 12:30 PM', 2200, '6-7 years', 'A-04'),
            $this->entry('school', 5, 'Grade 2 - Primary', 'Strengthening core literacy and mathematics.', 'Sat-Thu, 8:00 AM - 12:30 PM', 2200, '7-8 years', 'A-05'),
            $this->entry('school', 6, 'Grade 3 - Primary', 'Introducing science and social studies.', 'Sat-Thu, 8:00 AM - 12:30 PM', 2300, '8-9 years', 'A-06'),
            $this->entry('school', 7, 'Grade 4 - Primary', 'Building reading comprehension and problem solving.', 'Sat-Thu, 8:00 AM - 12:30 PM', 2300, '9-10 years', 'A-07'),
            $this->entry('school', 8, 'Grade 5 - Primary', 'Preparing learners for lower secondary.', 'Sat-Thu, 8:00 AM - 12:30 PM', 2400, '10-11 years', 'A-08'),
            $this->entry('school', 9, 'Grade 6 - Primary', 'Consolidating core subjects and study skills.', 'Sat-Thu, 8:00 AM - 12:30 PM', 2400, '11-12 years', 'A-09'),
            $this->entry('school', 10, 'Grade 7 - Lower Secondary', 'Broadened curriculum with lab sciences.', 'Sat-Thu, 8:00 AM - 1:00 PM', 2600, '12-13 years', 'B-01'),
            $this->entry('school', 11, 'Grade 8 - Lower Secondary', 'Advanced mathematics and analytical writing.', 'Sat-Thu, 8:00 AM - 1:00 PM', 2600, '13-14 years', 'B-02'),
            $this->entry('school', 12, 'Literacy & Numeracy Club', 'Supportive after-school club for core skills.', 'Sat-Wed, 3:00 PM - 4:30 PM', 800, '6-12 years', 'A-10'),

            // ---- Courses ----
            $this->entry('courses', 13, 'English Language Course', 'Communication-focused English classes for youth.', 'Sun-Tue-Thu, 2:00 PM - 4:00 PM', 1800, '12-18 years', 'C-03', [
                'ps_name' => 'د انګليسي ژبې کورس',
                'fa_name' => 'دوره زبان انگليسي',
            ]),
            $this->entry('courses', 14, 'Spoken English Level 1', 'Everyday conversation and pronunciation basics.', 'Mon-Wed-Fri, 4:00 PM - 6:00 PM', 1200, '14+ years', 'C-01'),
            $this->entry('courses', 15, 'Spoken English Level 2', 'Fluency building through guided discussion.', 'Mon-Wed-Fri, 4:00 PM - 6:00 PM', 1500, '16+ years', 'C-02'),
            $this->entry('courses', 16, 'IELTS Preparation', 'Exam strategy and practice for band targets.', 'Sat-Sun, 9:00 AM - 1:00 PM', 2200, '16+ years', 'C-04'),
            $this->entry('courses', 17, 'Business English', 'Professional writing, emails and presentations.', 'Tue-Thu, 5:00 PM - 7:00 PM', 2000, '18+ years', 'C-05'),
            $this->entry('courses', 18, 'Essay Writing Skills', 'Structuring clear, persuasive academic essays.', 'Mon-Wed, 3:00 PM - 5:00 PM', 1200, '14-20 years', 'C-06'),
            $this->entry('courses', 19, 'Static Physics', 'Forces, equilibrium and mechanics fundamentals.', 'Sun-Tue-Thu, 2:00 PM - 4:00 PM', 1500, '15-18 years', 'S-01'),
            $this->entry('courses', 20, 'General Physics', 'Motion, energy and waves for exam prep.', 'Mon-Wed-Fri, 4:00 PM - 6:00 PM', 1500, '15-18 years', 'S-02'),
            $this->entry('courses', 21, 'Organic Chemistry', 'Carbon compounds, reactions and nomenclature.', 'Sun-Tue-Thu, 2:00 PM - 4:00 PM', 1600, '16-18 years', 'S-03'),
            $this->entry('courses', 22, 'Inorganic Chemistry', 'Periodic trends, acids, bases and salts.', 'Mon-Wed-Fri, 4:00 PM - 6:00 PM', 1600, '16-18 years', 'S-04'),
            $this->entry('courses', 23, 'Biology Foundations', 'Cells, genetics and human systems overview.', 'Sat-Wed, 10:00 AM - 12:00 PM', 1400, '14-18 years', 'S-05'),
            $this->entry('courses', 24, 'Algebra I', 'Equations, inequalities and functions.', 'Sun-Tue-Thu, 2:00 PM - 4:00 PM', 1200, '13-16 years', 'M-01'),
            $this->entry('courses', 25, 'Geometry', 'Proofs, shapes and coordinate geometry.', 'Mon-Wed-Fri, 4:00 PM - 6:00 PM', 1200, '14-17 years', 'M-02'),
            $this->entry('courses', 26, 'Mathematics Olympiad', 'Advanced problem solving for competitions.', 'Sat-Sun, 9:00 AM - 12:00 PM', 1800, '12-18 years', 'M-03'),
            $this->entry('courses', 27, 'Computer Basics', 'Typing, office tools and internet safety.', 'Tue-Thu, 5:00 PM - 7:00 PM', 1000, '12-18 years', 'T-01'),
            $this->entry('courses', 28, 'Digital Literacy', 'Practical skills for online learning and work.', 'Mon-Wed, 5:00 PM - 7:00 PM', 1200, '14+ years', 'T-02'),

            // ---- Islamic Madrasa ----
            $this->entry('islamic_madrasa', 29, 'Islamic Madrasa Foundations', 'Quran, Tajweed, and Islamic studies foundation program.', 'Sat-Wed, 1:00 PM - 3:00 PM', 1500, '8-16 years', 'R-01', [
                'ps_name' => 'د اسلامي مدرسې بنسټونه',
                'fa_name' => 'مباني مدرسه اسلامي',
            ]),
            $this->entry('islamic_madrasa', 30, 'Quran Recitation (Nazira)', 'Correct reading of the Quran with guidance.', 'Sat-Thu, 5:00 PM - 6:30 PM', 1000, '7-16 years', 'R-02'),
            $this->entry('islamic_madrasa', 31, 'Tajweed Foundations', 'Rules of Quranic recitation from the basics.', 'Sat-Wed, 1:00 PM - 3:00 PM', 1200, '10+ years', 'R-03'),
            $this->entry('islamic_madrasa', 32, 'Hifz Program', 'Structured memorization of the Quran.', 'Sat-Thu, 6:00 AM - 8:00 AM', 1500, '8-18 years', 'R-04'),
            $this->entry('islamic_madrasa', 33, 'Arabic Grammar (Nahw)', 'Sentence structure and grammar for Quran study.', 'Sat-Wed, 1:00 PM - 3:00 PM', 1300, '12+ years', 'R-05'),
            $this->entry('islamic_madrasa', 34, 'Arabic Reading & Writing', 'Alphabet to fluent reading for beginners.', 'Sat-Thu, 4:00 PM - 5:30 PM', 1000, '8-14 years', 'R-06'),
            $this->entry('islamic_madrasa', 35, 'Fiqh Basics', 'Everyday worship rulings and practical fiqh.', 'Sat-Wed, 1:00 PM - 3:00 PM', 1200, '14+ years', 'R-07'),
            $this->entry('islamic_madrasa', 36, 'Aqeedah Essentials', 'Foundations of Islamic belief and creed.', 'Tue-Thu, 5:00 PM - 6:30 PM', 1200, '14+ years', 'R-08'),
            $this->entry('islamic_madrasa', 37, 'Seerah Studies', 'The life of the Prophet Muhammad (PBUH).', 'Sat-Thu, 4:00 PM - 5:30 PM', 1000, '12+ years', 'R-09'),
            $this->entry('islamic_madrasa', 38, 'Hadith Introduction', 'Core hadith and their everyday application.', 'Sat-Wed, 1:00 PM - 3:00 PM', 1100, '14+ years', 'R-10'),
            $this->entry('islamic_madrasa', 39, 'Islamic History', 'Key events of the early Muslim community.', 'Tue-Thu, 5:00 PM - 6:30 PM', 1100, '14+ years', 'R-11'),
            $this->entry('islamic_madrasa', 40, 'Duas & Adhkar', 'Daily supplications and remembrance.', 'Sat-Thu, 6:00 AM - 7:00 AM', 800, 'All ages', 'R-12'),
        ];
    }

    /**
     * Normalize a catalog entry into the array shape used in run().
     *
     * @param  array<string, mixed>  $extra
     * @return array<string, mixed>
     */
    private function entry(
        string $type,
        int $order,
        string $name,
        string $description,
        string $schedule,
        int $fees,
        string $age,
        ?string $classroom = null,
        array $extra = [],
    ): array {
        return [
            ...$extra,
            'type' => $type,
            'order' => $order,
            'name' => $name,
            'description' => $description,
            'schedule' => $schedule,
            'fees' => $fees,
            'age' => $age,
            'classroom' => $classroom,
        ];
    }
}
