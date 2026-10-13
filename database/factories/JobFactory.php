<?php

namespace Database\Factories;

use App\Models\Job;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Job>
 */
class JobFactory extends Factory
{
    protected $model = Job::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $title = Str::title(trim(fake()->words(random_int(2, 4), true)));

        return [
            'user_id' => User::factory(),
            'title' => $title,
            'slug' => Str::slug($title) . '-' . Str::lower(Str::random(6)),
            'department' => fake()->randomElement([
                'Academic',
                'Administration',
                'IT & Technology',
                'Finance',
                'Human Resources',
                'Facilities',
                'Library',
                'Counseling',
            ]),
            'category' => fake()->randomElement(['school', 'course', 'islamic_madrasa']),
            'description' => implode("\n\n", fake()->paragraphs(random_int(2, 3))),
            'requirements' => implode("\n", [
                '- ' . fake()->sentence(6),
                '- ' . fake()->sentence(5),
                '- ' . fake()->sentence(7),
                '- ' . fake()->sentence(4),
            ]),
            'employment_type' => fake()->randomElement(['full_time', 'part_time', 'contract']),
            'working_hours' => fake()->randomElement([
                '8:00 AM - 12:00 PM',
                '12:30 PM - 5:30 PM',
                '2:00 PM - 6:00 PM',
                '4:00 PM - 8:00 PM',
            ]),
            'application_email' => 'careers@mustaqbal.af',
            'application_url' => null,
            'deadline' => fake()->boolean(60) ? fake()->dateTimeBetween('+1 week', '+3 months')->format('Y-m-d') : null,
            'is_active' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
            'deadline' => now()->subDays(random_int(1, 30))->format('Y-m-d'),
        ]);
    }

    public function withTitle(string $title): static
    {
        return $this->state(fn (array $attributes) => [
            'title' => $title,
            'slug' => Str::slug($title) . '-' . Str::lower(Str::random(6)),
        ]);
    }

    public function withDepartment(string $department): static
    {
        return $this->state(fn (array $attributes) => [
            'department' => $department,
        ]);
    }

    public function withCategory(string $category): static
    {
        return $this->state(fn (array $attributes) => [
            'category' => $category,
        ]);
    }
}
