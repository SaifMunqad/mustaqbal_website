<?php

namespace Database\Seeders;

use App\Enums\EventAudience;
use App\Enums\UserRole;
use App\Models\Event;
use App\Models\User;
use App\Support\Translation\LocalizedContent;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

/**
 * Seeds a realistic events calendar for the multi-calendar view.
 *
 * Creates 22 events spread across the current month and about 50 events
 * distributed over the surrounding months (4 past + 7 future), so the
 * dashboard always has upcoming, ongoing and past events to render.
 *
 * Idempotent: it skips entirely when any event already exists, so re-running
 * never duplicates rows and never overwrites content an admin has edited.
 */
class EventSeeder extends Seeder
{
    /**
     * Number of events to create within the current month.
     */
    private const CURRENT_MONTH_COUNT = 22;

    /**
     * Month offsets (relative to now) that receive backfill events. The
     * current month (0) is intentionally excluded; ~5 events per month.
     *
     * @var list<int>
     */
    private const BACKFILL_MONTH_OFFSETS = [-4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7];

    private const EVENTS_PER_BACKFILL_MONTH = 5;

    /**
     * Running counter used to cycle titles/audiences deterministically.
     */
    private int $index = 0;

    /**
     * Curated school-event titles, cycled across all seeded events.
     *
     * @var list<string>
     */
    private const TITLES = [
        'Parent-Teacher Meeting',
        'Science Fair Exhibition',
        'Quran Recitation Competition',
        'Annual Sports Day',
        'Mathematics Olympiad',
        'English Speech Contest',
        'Open House for New Families',
        'Art and Craft Exhibition',
        'Career Guidance Seminar',
        'Reading Week Kickoff',
        'Graduation Ceremony',
        'Teacher Training Workshop',
        'Community Clean-Up Drive',
        'Inter-Class Football Tournament',
        'Poetry and Literature Night',
        'Technology and Robotics Day',
        'Health Awareness Session',
        'Board Meeting with Stakeholders',
        'Field Trip to National Museum',
        'Debate Club Final Round',
        'Calligraphy Workshop',
        'End-of-Term Assessment Briefing',
    ];

    public function run(): void
    {
        if (Event::query()->exists()) {
            $this->command?->info('Events already exist, skipping EventSeeder.');

            return;
        }

        $author = $this->resolveAuthor();
        $now = Carbon::now();

        // Current month: evenly space events across the available days.
        $daysInMonth = (int) $now->copy()->endOfMonth()->format('d');
        $currentDates = [];

        for ($i = 0; $i < self::CURRENT_MONTH_COUNT; $i++) {
            $day = min($daysInMonth, max(1, (int) floor($i * $daysInMonth / self::CURRENT_MONTH_COUNT) + 1));
            $currentDates[] = $now->copy()->day($day);
        }

        $this->createEvents($author, $currentDates);

        // Backfill months: a handful of events per month around the calendar.
        foreach (self::BACKFILL_MONTH_OFFSETS as $offset) {
            $month = $now->copy()->addMonthsNoOverflow($offset)->startOfMonth();
            $daysIn = (int) $month->daysInMonth;

            $dates = [];

            for ($i = 0; $i < self::EVENTS_PER_BACKFILL_MONTH; $i++) {
                // Spread across the month: roughly the 3rd, 9th, 15th, 21st, 27th.
                $day = min($daysIn, 3 + $i * 6 + random_int(0, 2));
                $dates[] = $month->copy()->day($day);
            }

            $this->createEvents($author, $dates);
        }
    }

    /**
     * Create one event per given date, cycling titles/audiences deterministically.
     *
     * @param  list<Carbon>  $dates
     */
    private function createEvents(User $author, array $dates): void
    {
        $audiences = [
            EventAudience::Public,
            EventAudience::Public,
            EventAudience::Public,
            EventAudience::Families,
            EventAudience::Teachers,
        ];

        foreach ($dates as $date) {
            $title = self::TITLES[$this->index % count(self::TITLES)];
            $audience = $audiences[$this->index % count($audiences)];

            $event = Event::factory()
                ->onDay($date)
                ->withTitle($title)
                ->create([
                    'user_id' => $author->id,
                    'audience' => $audience,
                    'cover_image' => 'https://picsum.photos/seed/school-event-'.($this->index + 1).'/1200/675',
                    // A few cancelled / draft events for status variety.
                    'is_cancelled' => $this->index % 17 === 5,
                    'is_published' => $this->index % 19 !== 7,
                ]);

            // Localized text lives in event_translations; overwrite the factory
            // default row with this curated, deterministic content.
            $location = fake()->randomElement([
                'Main Hall, Kabul',
                'School Courtyard, Kabul',
                'Classroom Block A, Kabul',
                'Auditorium, Kabul',
                'Sports Ground, Kabul',
            ]);

            $event->syncDefaultTranslation([
                'title' => $title,
                'excerpt' => fake()->sentence(10),
                'body' => implode("\n\n", fake()->paragraphs(random_int(2, 3))),
                'location' => $location,
            ]);

            // Dari/Pashto rows: glossary title + location, localized prose pools.
            LocalizedContent::apply($event->translations(), LocalizedContent::eventSecondary($title, $location, $this->index));

            $this->index++;
        }
    }

    /**
     * A management user to attribute seeded events to, reused across rows.
     */
    private function resolveAuthor(): User
    {
        return User::query()->firstOrCreate(
            ['email' => 'content@example.com'],
            [
                'name' => 'Content Editor',
                'role' => UserRole::Management->value,
                'password' => 'password',
                'email_verified_at' => now(),
            ],
        );
    }
}
