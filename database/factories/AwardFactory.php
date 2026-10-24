<?php

namespace Database\Factories;

use App\Models\Award;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Award>
 */
class AwardFactory extends Factory
{
    protected $model = Award::class;

    /**
     * Codes follow the shape schools typically print on documents, but they are
     * only illustrative — the columns accept any school-specific scheme.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'person_id' => 'STU-'.fake()->numberBetween(2015, 2026).'-'.fake()->numerify('#####'),
            'award_id' => fake()
                ->randomElement(['DIP', 'CRT', 'AWD'])
                .'-'.fake()->numberBetween(2019, 2026)
                .'-'.fake()->unique()->numerify('######'),
            'full_name' => fake()->name(),
            'father_name' => fake()->name('male'),
            'awarded_at' => fake()->dateTimeBetween('-6 years', 'now')->format('Y-m-d'),
        ];
    }

    /**
     * Pin the holder code, so several awards can be issued to one person.
     */
    public function forPerson(string $personId): static
    {
        return $this->state(fn (): array => ['person_id' => $personId]);
    }

    /**
     * Pin the award code, e.g. to build a deterministic verification test.
     */
    public function withAward(string $awardId): static
    {
        return $this->state(fn (): array => ['award_id' => $awardId]);
    }

    public function awardedAt(string $date): static
    {
        return $this->state(fn (): array => ['awarded_at' => $date]);
    }
}
