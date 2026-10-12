<?php

namespace Database\Factories;

use App\Models\Article;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Article>
 */
class ArticleFactory extends Factory
{
    protected $model = Article::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $title = Str::title(trim(fake()->words(random_int(3, 6), true)));

        return [
            'user_id' => User::factory(),
            'title' => $title,
            'slug' => Str::slug($title).'-'.Str::lower(Str::random(6)),
            'excerpt' => fake()->sentence(12),
            'body' => implode("\n\n", fake()->paragraphs(random_int(3, 6))),
            'cover_image' => 'https://picsum.photos/seed/'.Str::lower(Str::random(8)).'/1200/675',
            'images' => [],
            'published_at' => fake()->dateTimeBetween('-6 months', 'now'),
            'is_published' => true,
        ];
    }

    /**
     * Mark the article as a draft (unpublished).
     */
    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_published' => false,
            'published_at' => null,
        ]);
    }

    /**
     * Pin the slug and cover image to a stable, ASCII seed key.
     *
     * Used by seeders so re-running produces the same slug (idempotent upserts)
     * and a deterministic cover, instead of a random suffix on every run.
     */
    public function forSeedKey(string $key): static
    {
        $slug = Str::slug($key);

        return $this->state(fn (array $attributes) => [
            'slug' => $slug,
            'cover_image' => 'https://picsum.photos/seed/'.$slug.'/1200/675',
        ]);
    }
}
