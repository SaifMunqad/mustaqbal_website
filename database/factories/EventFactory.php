<?php

namespace Database\Factories;

use App\Enums\EventAudience;
use App\Models\Event;
use App\Models\User;
use App\Support\Translation\LocalizedContent;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * @extends Factory<Event>
 */
class EventFactory extends Factory
{
    protected $model = Event::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $title = Str::title(trim(fake()->words(random_int(2, 5), true)));

        // Spread start times around "now" so seeded data yields a healthy mix of
        // upcoming, ongoing and past events for the multi-calendar view.
        $startAt = Carbon::instance(fake()->dateTimeBetween('-2 months', '+3 months'));
        $endAt = $startAt->copy()->addHours(random_int(1, 6));

        return [
            'user_id' => User::factory(),
            'slug' => Str::slug($title).'-'.Str::lower(Str::random(6)),
            'cover_image' => 'https://picsum.photos/seed/'.Str::lower(Str::random(8)).'/1200/675',
            'images' => [],
            'start_at' => $startAt,
            'end_at' => $endAt,
            'audience' => fake()->randomElement(EventAudience::values()),
            'is_cancelled' => false,
            'is_published' => true,
        ];
    }

    /**
     * Localized text lives in `event_translations`. Give every factory-created
     * event a default-language row plus deterministic Dari/Pashto rows, so a
     * translated table is never half-filled (all writes no-op when a language
     * is not seeded, keeping bare test runs green).
     */
    public function configure(): static
    {
        return $this->afterCreating(function (Event $event): void {
            $title = Str::title(trim(fake()->words(random_int(2, 5), true)));
            $location = fake()->city().', Afghanistan';

            $event->syncDefaultTranslation([
                'title' => $title,
                'excerpt' => fake()->sentence(10),
                'body' => implode("\n\n", fake()->paragraphs(random_int(2, 4))),
                'location' => $location,
            ]);

            LocalizedContent::apply($event->translations(), LocalizedContent::eventSecondary($title, $location, (int) $event->id));
        });
    }

    /**
     * Force the event to start in the future (upcoming).
     */
    public function upcoming(): static
    {
        return $this->state(function (array $attributes) {
            $startAt = Carbon::now()->addDays(random_int(1, 60));

            return [
                'start_at' => $startAt,
                'end_at' => $startAt->copy()->addHours(random_int(1, 6)),
            ];
        });
    }

    /**
     * Mark the event as cancelled.
     */
    public function cancelled(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_cancelled' => true,
        ]);
    }

    /**
     * Pin the event to a specific day with a plausible school-hours window.
     */
    public function onDay(Carbon|string $day): static
    {
        $day = $day instanceof Carbon
            ? Carbon::parse($day->toDateString())
            : Carbon::parse($day);

        return $this->state(function (array $attributes) use ($day): array {
            $startAt = $day->copy()->setTime(random_int(8, 17), fake()->randomElement([0, 30]));

            return [
                'start_at' => $startAt,
                'end_at' => $startAt->copy()->addMinutes(random_int(60, 300)),
            ];
        });
    }

    /**
     * Use a realistic, fixed event title (and matching slug) instead of random
     * words. The localized title is written to the default-language translation
     * by the caller/seeder; here we only derive the stable parent slug.
     */
    public function withTitle(string $title): static
    {
        return $this->state(fn (array $attributes) => [
            'slug' => Str::slug($title).'-'.Str::lower(Str::random(6)),
        ]);
    }
}
