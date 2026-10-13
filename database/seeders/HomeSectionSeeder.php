<?php

namespace Database\Seeders;

use App\Enums\PostType;
use App\Enums\PostVisibility;
use App\Models\Article;
use App\Models\Event;
use App\Models\HomeSection;
use App\Models\Post;
use Illuminate\Database\Seeder;

/**
 * Seeds a ready-made home-page layout so the homepage is populated on a fresh
 * seed instead of showing nothing.
 *
 * The layout mixes the two section families the portal supports:
 *  - authored blocks (banner + announcement) that render unconditionally;
 *  - curated blocks (articles, events, recognition) wired to real, existing
 *    content ids so they show live data and stay in sync with their source.
 *
 * Idempotent: it skips entirely when any section already exists, so re-running
 * never duplicates rows and never overwrites a layout an admin has curated.
 */
class HomeSectionSeeder extends Seeder
{
    public function run(): void
    {
        if (HomeSection::query()->exists()) {
            $this->command?->info('Home sections already exist, skipping HomeSectionSeeder.');

            return;
        }

        $articleIds = Article::query()
            ->where('is_published', true)
            ->whereNotNull('published_at')
            ->latest('published_at')
            ->limit(3)
            ->pluck('id')
            ->all();

        $eventIds = Event::query()
            ->visibleTo(null)
            ->upcoming()
            ->limit(3)
            ->pluck('id')
            ->all();

        $recognitionIds = Post::query()
            ->where('visibility', PostVisibility::Public->value)
            ->whereIn('type', array_map(
                static fn (PostType $type): string => $type->value,
                PostType::recognitionTypes(),
            ))
            ->latest()
            ->limit(3)
            ->pluck('id')
            ->all();

        // 1) Hero-style banner (authored) — always visible, guarantees a
        //    populated home page even before other content exists.
        HomeSection::factory()
            ->banner([
                'heading' => 'A Bright Future Starts Here',
                'body' => 'Discover our programs, upcoming events and the students we are proud of at Mustaqbal School.',
                'image_url' => 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1400&q=80',
                'cta_label' => 'Explore Programs',
                'cta_url' => '/school/programs',
                'tone' => 'blue',
            ])
            ->create(['sort_order' => 0]);

        // 2) Admissions announcement (authored).
        HomeSection::factory()
            ->announcement([
                'heading' => 'Admissions are now open',
                'body' => 'Limited seats for the new term — enroll your child today.',
                'cta_label' => 'Enroll now',
                'cta_url' => '/school/enroll',
                'tone' => 'green',
            ])
            ->create(['sort_order' => 1]);

        // 3) Latest articles (curated).
        HomeSection::factory()
            ->articles($articleIds, 3)
            ->create(['title' => 'Latest Articles', 'sort_order' => 2]);

        // 4) Upcoming events (curated).
        HomeSection::factory()
            ->events($eventIds, 3)
            ->create(['title' => 'Upcoming Events', 'sort_order' => 3]);

        // 5) Recognition highlights (curated) — reuses the existing showcase.
        HomeSection::factory()
            ->recognition($recognitionIds, 3)
            ->create(['title' => 'Recognition Highlights', 'sort_order' => 4]);

        $this->command?->info('Seeded 5 home page sections.');
    }
}
