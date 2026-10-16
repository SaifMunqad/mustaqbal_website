<?php

namespace Database\Seeders;

use App\Enums\PostType;
use App\Enums\PostVisibility;
use App\Enums\UserRole;
use App\Models\Post;
use App\Models\User;
use App\Support\Translation\LocalizedContent;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Seeds the recognition showcase: top students, teachers and an employee of the
 * month. These power both the public showcase (ShowcaseController) and the home
 * page "recognition highlights" section, so they must exist before the home
 * layout is curated.
 *
 * Volume mirrors the brief: 10 students, 6 teachers and 1 employee. Teachers are
 * balanced across two categories — 3 men and 3 women (honored via gendered names,
 * since Post has no gender column) — and students follow the same 5/5 split.
 *
 * Idempotent: it skips entirely once any recognition post exists, so re-running
 * never duplicates honors or overwrites admin-curated posts.
 */
class RecognitionSeeder extends Seeder
{
    /**
     * The management account that authors every recognition post.
     */
    private const AUTHOR_EMAIL = 'recognition@example.com';

    public function run(): void
    {
        if (Post::query()->whereIn('type', $this->recognitionTypeValues())->exists()) {
            $this->command?->info('Recognition posts already exist, skipping RecognitionSeeder.');

            return;
        }

        $author = $this->resolveAuthor();

        // [name, role] per honoree, grouped by the recognition type. Students and
        // teachers each alternate a men/women block; the employee is a single pick.
        $groups = [
            PostType::StudentOfMonth->value => [
                // 5 men
                ['Ahmad Rahimi', UserRole::Family],
                ['Farid Nazari', UserRole::Family],
                ['Najib Ahmadi', UserRole::Family],
                ['Omid Karimi', UserRole::Family],
                ['Salim Hakimi', UserRole::Family],
                // 5 women
                ['Zahra Karimi', UserRole::Family],
                ['Mariam Noori', UserRole::Family],
                ['Fatima Rahmani', UserRole::Family],
                ['Laila Hussaini', UserRole::Family],
                ['Huria Sultani', UserRole::Family],
            ],
            PostType::TeacherOfMonth->value => [
                // 3 men
                ['Abdul Wahid Sadiqui', UserRole::Teacher],
                ['Gul Mohammad Stanikzai', UserRole::Teacher],
                ['Mohammad Asif Wardak', UserRole::Teacher],
                // 3 women
                ['Shahla Anwari', UserRole::Teacher],
                ['Nazifa Gholami', UserRole::Teacher],
                ['Wesal Samangani', UserRole::Teacher],
            ],
            PostType::EmployeeOfMonth->value => [
                ['Sayed Kazem Muradi', UserRole::Management],
            ],
        ];

        $created = 0;

        foreach ($groups as $typeValue => $honorees) {
            $type = PostType::from($typeValue);

            foreach ($honorees as $index => [$name, $role]) {
                $honoree = $this->firstOrCreateHonoree($name, $role);

                $post = Post::query()->create([
                    'user_id' => $author->id,
                    'highlighted_student_id' => $honoree->id,
                    'type' => $type,
                    'visibility' => PostVisibility::Public,
                    'images' => ['https://picsum.photos/seed/'.Str::slug($name).'/600/600'],
                    'featured' => true,
                    'featured_from' => now()->subDays($index),
                ]);

                LocalizedContent::persist(
                    $post,
                    [
                        'title' => $type->label(),
                        'content' => "{$name} was honored as {$type->label()} for their dedication, "
                            .'hard work, and outstanding contribution to our school community this month.',
                    ],
                    LocalizedContent::recognitionSecondary($type->label(), $name, $index),
                );

                $created++;
            }
        }

        $this->command?->info("Seeded {$created} recognition highlights.");
    }

    /**
     * @return list<string>
     */
    private function recognitionTypeValues(): array
    {
        return array_map(
            static fn (PostType $type): string => $type->value,
            PostType::recognitionTypes(),
        );
    }

    /**
     * Create (or reuse) the honored person. Matched on a stable, name-derived
     * email so reseeding the same roster is a no-op.
     */
    private function firstOrCreateHonoree(string $name, UserRole $role): User
    {
        return User::query()->firstOrCreate(
            ['email' => 'recognition-'.Str::slug($name).'@example.com'],
            [
                'name' => $name,
                'role' => $role->value,
                'password' => 'password',
                'email_verified_at' => now(),
            ],
        );
    }

    /**
     * A management user to attribute the recognition posts to.
     */
    private function resolveAuthor(): User
    {
        return User::query()->firstOrCreate(
            ['email' => self::AUTHOR_EMAIL],
            [
                'name' => 'Recognition Desk',
                'role' => UserRole::Management->value,
                'password' => 'password',
                'email_verified_at' => now(),
            ],
        );
    }
}
