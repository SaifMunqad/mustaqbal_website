<?php

namespace Tests\Feature;

use App\Models\Event;
use Database\Seeders\EventSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EventSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_seeds_at_least_twenty_events_in_the_current_month(): void
    {
        $this->seed(EventSeeder::class);

        $currentMonthCount = Event::query()
            ->whereYear('start_at', now()->year)
            ->whereMonth('start_at', now()->month)
            ->count();

        $this->assertGreaterThanOrEqual(20, $currentMonthCount);
    }

    public function test_it_seeds_backfill_events_around_the_current_month(): void
    {
        $this->seed(EventSeeder::class);

        $otherMonthsCount = Event::query()
            ->where(fn ($q) => $q
                ->whereYear('start_at', '<', now()->year)
                ->orWhereYear('start_at', '>', now()->year)
                ->orWhere(fn ($q2) => $q2
                    ->whereYear('start_at', now()->year)
                    ->whereMonth('start_at', '!=', now()->month)))
            ->count();

        $this->assertGreaterThanOrEqual(40, $otherMonthsCount);

        // Total should be roughly 70+ events.
        $this->assertGreaterThanOrEqual(60, Event::query()->count());
    }

    public function test_seeded_event_slugs_are_unique(): void
    {
        $this->seed(EventSeeder::class);

        $this->assertSame(
            Event::query()->count(),
            Event::query()->distinct('slug')->count('slug'),
        );
    }

    public function test_it_is_idempotent_and_skips_when_events_exist(): void
    {
        $this->seed(EventSeeder::class);

        $count = Event::query()->count();

        $this->seed(EventSeeder::class);

        $this->assertSame($count, Event::query()->count());
    }
}
