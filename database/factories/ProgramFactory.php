<?php

namespace Database\Factories;

use App\Models\Program;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Program>
 */
class ProgramFactory extends Factory
{
    protected $model = Program::class;

    /**
     * Program categories (types) offered on the site.
     *
     * @var list<string>
     */
    private const TYPES = ['school', 'courses', 'islamic_madrasa'];

    /**
     * Curated, category-appropriate program names used for realistic generation.
     *
     * @var array<string, list<string>>
     */
    private const NAME_POOLS = [
        'school' => [
            'Kindergarten Foundation',
            'Pre-Primary Nurseries',
            'Grade 1 - Primary',
            'Grade 2 - Primary',
            'Grade 3 - Primary',
            'Grade 4 - Primary',
            'Grade 5 - Primary',
            'Grade 6 - Primary',
        ],
        'courses' => [
            'Static Physics',
            'Organic Chemistry',
            'Algebra I',
            'Geometry',
            'IELTS Preparation',
            'Business English',
            'Spoken English Level 1',
            'Spoken English Level 2',
            'Computer Basics',
            'Mathematics Olympiad',
        ],
        'islamic_madrasa' => [
            'Quran Recitation (Nazira)',
            'Tajweed Foundations',
            'Hifz Program',
            'Arabic Grammar (Nahw)',
            'Fiqh Basics',
            'Seerah Studies',
            'Hadith Introduction',
        ],
    ];

    /**
     * Schedules and fee/age bands keyed by category, so generated rows stay coherent.
     *
     * @var array<string, array{schedule: list<string>, fees: list<int>, ages: list<string>}>
     */
    private const BANDS = [
        'school' => [
            'schedule' => ['Sat-Thu, 8:00 AM - 12:30 PM', 'Sat-Thu, 7:30 AM - 12:00 PM'],
            'fees' => [2000, 2500, 3000, 3500],
            'ages' => ['5-6 years', '6-12 years', '7-12 years'],
        ],
        'courses' => [
            'schedule' => ['Sun-Tue-Thu, 2:00 PM - 4:00 PM', 'Mon-Wed-Fri, 4:00 PM - 6:00 PM'],
            'fees' => [1200, 1500, 1800, 2200],
            'ages' => ['12-18 years', '16+ years', '14-20 years'],
        ],
        'islamic_madrasa' => [
            'schedule' => ['Sat-Wed, 1:00 PM - 3:00 PM', 'Sat-Thu, 5:00 PM - 6:30 PM'],
            'fees' => [1000, 1200, 1500],
            'ages' => ['8-16 years', '10-18 years', 'All ages'],
        ],
    ];

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $type = fake()->randomElement(self::TYPES);

        return $this->attributesForType($type);
    }

    /**
     * Restrict the program to a specific category (type).
     */
    public function type(string $programType): static
    {
        return $this->state(fn (array $attributes) => $this->attributesForType($programType));
    }

    public function school(): static
    {
        return $this->type('school');
    }

    public function courses(): static
    {
        return $this->type('courses');
    }

    public function islamicMadrasa(): static
    {
        return $this->type('islamic_madrasa');
    }

    /**
     * Force a specific program name (used when seeding a deterministic catalog).
     */
    public function named(string $name): static
    {
        return $this->state(fn (array $attributes) => ['name' => $name]);
    }

    /**
     * Build a coherent set of attributes for a given category.
     *
     * @return array<string, mixed>
     */
    private function attributesForType(string $type): array
    {
        $names = self::NAME_POOLS[$type] ?? self::NAME_POOLS['courses'];
        $bands = self::BANDS[$type] ?? self::BANDS['courses'];

        return [
            'name' => fake()->randomElement($names),
            'program_type' => $type,
            'description' => fake()->sentences(3, true),
            'schedule' => fake()->randomElement($bands['schedule']),
            'fees' => fake()->randomElement($bands['fees']),
            'age_recommendation' => fake()->randomElement($bands['ages']),
            'classroom_number' => fake()->randomElement(['A-01', 'B-02', 'C-03', 'M-02', null]),
            'available_for_enroll' => true,
            'display_order' => fake()->numberBetween(1, 50),
        ];
    }
}
