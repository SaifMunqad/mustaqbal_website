<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Article;
use App\Models\Event;
use App\Models\Program;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Seeds demo content (programs, events, articles) up to a target count.
 *
 * Idempotent: it only "tops up" to the target, so re-running never creates
 * duplicates and never overwrites content an admin has already edited.
 */
class ContentSeeder extends Seeder
{
    /**
     * How many rows to ensure exist for each content type.
     */
    private const TARGET = 20;

    public function run(): void
    {
        $author = $this->resolveAuthor();

        $this->topUp(function (int $missing): void {
            Program::factory()->count($missing)->create();
        }, Program::query()->count());

        $this->topUp(function (int $missing) use ($author): void {
            Event::factory()->count($missing)->create(['user_id' => $author->id]);
        }, Event::query()->count());

        $this->topUp(function (int $missing) use ($author): void {
            Article::factory()->count($missing)->create(['user_id' => $author->id]);
        }, Article::query()->count());
    }

    /**
     * Run the given creator only for the rows still missing to reach the target.
     */
    private function topUp(callable $create, int $currentCount): void
    {
        $missing = max(0, self::TARGET - $currentCount);

        if ($missing > 0) {
            $create($missing);
        }
    }

    /**
     * A management user to attribute demo events/articles to, reused across rows.
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
