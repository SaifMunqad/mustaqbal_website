<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Award;
use App\Models\User;
use Database\Seeders\AwardSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AwardVerificationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function award(array $overrides = []): Award
    {
        return Award::query()->create(array_merge([
            'person_id' => 'STU-2024-00123',
            'award_id' => 'DIP-2024-000137',
            'full_name' => 'Ahmad Karimi',
            'father_name' => 'Rahim',
            'awarded_at' => '2024-06-15',
        ], $overrides));
    }

    private function userWithRole(UserRole $role): User
    {
        return User::factory()->create(['role' => $role->value]);
    }

    /**
     * Read the challenge question from the rendered page props.
     *
     * @return array{question?: string}
     */
    private function challenge(TestResponse $response): array
    {
        return $response->viewData('page')['props']['captcha'] ?? [];
    }

    /**
     * @param  array{question?: string}  $challenge
     */
    private function answerFor(array $challenge): string
    {
        [$left, $right] = array_map('intval', explode('+', (string) ($challenge['question'] ?? '')));

        return (string) ($left + $right);
    }

    private function failLookups(int $times, string $personId, string $ip = '127.0.0.1'): void
    {
        foreach (range(1, $times) as $attempt) {
            $this->withServerVariables(['REMOTE_ADDR' => $ip])
                ->post(route('school.verify.lookup'), [
                    'person_id' => $personId,
                    'award_id' => 'AWD-UNKNOWN-'.$attempt,
                ])
                ->assertOk();
        }
    }

    public function test_verify_page_renders_without_a_lookup(): void
    {
        $this->get(route('school.verify'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('school/verify/school-verify')
                ->where('submitted', false)
                ->where('award', null));
    }

    public function test_matching_pair_returns_the_award(): void
    {
        $this->award();

        $this->post(route('school.verify.lookup'), [
            'person_id' => 'STU-2024-00123',
            'award_id' => 'DIP-2024-000137',
        ])
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('school/verify/school-verify')
                ->where('submitted', true)
                ->where('award.full_name', 'Ahmad Karimi')
                ->where('award.awarded_at', '2024-06-15')
                // Internal identifiers stay out of the public payload.
                ->missing('award.id'));
    }

    public function test_a_mismatched_pair_is_not_revealed(): void
    {
        $this->award();

        $this->post(route('school.verify.lookup'), [
            'person_id' => 'STU-2024-00123',
            'award_id' => 'DIP-9999-000001',
        ])
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('submitted', true)
                ->where('award', null));
    }

    public function test_both_codes_are_required_for_a_lookup(): void
    {
        $this->award();

        $this->post(route('school.verify.lookup'), ['person_id' => 'STU-2024-00123'])
            ->assertInvalid(['award_id']);

        $this->post(route('school.verify.lookup'), ['award_id' => 'DIP-2024-000137'])
            ->assertInvalid(['person_id']);
    }

    public function test_codes_are_not_accepted_through_the_query_string(): void
    {
        $this->award();

        // The GET route only renders the empty form; the codes must be posted.
        $this->get(route('school.verify', [
            'person_id' => 'STU-2024-00123',
            'award_id' => 'DIP-2024-000137',
        ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('submitted', false)
                ->where('award', null));
    }

    public function test_families_and_teachers_cannot_manage_awards(): void
    {
        foreach ([UserRole::Family, UserRole::Teacher] as $role) {
            $this->actingAs($this->userWithRole($role))
                ->get(route('dashboard.awards.index'))
                ->assertForbidden();
        }
    }

    public function test_management_can_register_an_award(): void
    {
        $this->actingAs($this->userWithRole(UserRole::Management))
            ->post(route('dashboard.awards.store'), [
                'person_id' => '  STU-1  ',
                'award_id' => 'DIP-1',
                'full_name' => 'Sara Ahmad',
                'father_name' => '',
                'awarded_at' => '2024-05-01',
            ])
            ->assertRedirect(route('dashboard.awards.index'));

        $this->assertDatabaseHas('awards', [
            'person_id' => 'STU-1',
            'award_id' => 'DIP-1',
            'father_name' => null,
        ]);
    }

    public function test_the_person_and_award_pair_must_be_unique(): void
    {
        $this->award();

        $this->actingAs($this->userWithRole(UserRole::Management))
            ->post(route('dashboard.awards.store'), [
                'person_id' => 'STU-2024-00123',
                'award_id' => 'DIP-2024-000137',
                'full_name' => 'Duplicate',
                'awarded_at' => '2024-06-15',
            ])
            ->assertSessionHasErrors('award_id');

        $this->assertSame(1, Award::query()->count());
    }

    public function test_bulk_import_creates_new_rows_and_updates_existing_ones(): void
    {
        $this->award(['father_name' => 'Old']);

        $this->actingAs($this->userWithRole(UserRole::Management))
            ->post(route('dashboard.awards.bulk'), [
                'rows' => [
                    [
                        'person_id' => 'STU-2024-00123',
                        'award_id' => 'DIP-2024-000137',
                        'full_name' => 'Ahmad Karimi',
                        'father_name' => 'New',
                        'awarded_at' => '2024-06-15',
                    ],
                    [
                        'person_id' => 'STU-2',
                        'award_id' => 'DIP-2',
                        'full_name' => 'Bilal Noor',
                        'father_name' => null,
                        'awarded_at' => '2024-07-01',
                    ],
                ],
            ])
            ->assertRedirect(route('dashboard.awards.index'));

        $this->assertSame(2, Award::query()->count());
        $this->assertDatabaseHas('awards', [
            'person_id' => 'STU-2024-00123',
            'father_name' => 'New',
        ]);
        $this->assertDatabaseHas('awards', ['person_id' => 'STU-2']);
    }

    public function test_bulk_import_rejects_unreadable_dates(): void
    {
        $this->actingAs($this->userWithRole(UserRole::Management))
            ->post(route('dashboard.awards.bulk'), [
                'rows' => [[
                    'person_id' => 'STU-3',
                    'award_id' => 'DIP-3',
                    'full_name' => 'Nadia',
                    'awarded_at' => 'last spring',
                ]],
            ])
            ->assertSessionHasErrors('rows.0.awarded_at');

        $this->assertSame(0, Award::query()->count());
    }

    public function test_only_admins_can_delete_an_award(): void
    {
        $award = $this->award();

        $this->actingAs($this->userWithRole(UserRole::Management))
            ->delete(route('dashboard.awards.destroy', $award))
            ->assertForbidden();

        $this->actingAs($this->userWithRole(UserRole::Admin))
            ->delete(route('dashboard.awards.destroy', $award))
            ->assertRedirect(route('dashboard.awards.index'));

        $this->assertDatabaseMissing('awards', ['id' => $award->id]);
    }

    public function test_a_challenge_is_required_after_repeated_failures(): void
    {
        $this->failLookups(3, 'STU-GUESS');

        $this->get(route('school.verify'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('blocked', false)
                ->has('captcha.question'));
    }

    public function test_a_wrong_challenge_answer_does_not_perform_the_lookup(): void
    {
        $this->award();
        $this->failLookups(3, 'STU-GUESS');

        $this->get(route('school.verify'))->assertOk();

        $this->post(route('school.verify.lookup'), [
            'person_id' => 'STU-2024-00123',
            'award_id' => 'DIP-2024-000137',
            'captcha_answer' => '0',
        ])
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('captchaError', true)
                ->where('award', null));
    }

    public function test_a_correct_challenge_answer_completes_the_lookup(): void
    {
        $this->award();
        $this->failLookups(3, 'STU-GUESS');

        $challenge = $this->challenge($this->get(route('school.verify'))->assertOk());

        $this->post(route('school.verify.lookup'), [
            'person_id' => 'STU-2024-00123',
            'award_id' => 'DIP-2024-000137',
            'captcha_answer' => $this->answerFor($challenge),
        ])
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('captchaError', false)
                ->where('award.full_name', 'Ahmad Karimi'));
    }

    public function test_guessing_one_person_id_pauses_its_lookups(): void
    {
        // Rotating IPs defeats the per-IP ladder, so the per-person counter is
        // what stops a sustained attack on a single holder's code.
        foreach (range(1, 10) as $attempt) {
            $this->failLookups(1, 'STU-BLOCK', "10.0.0.{$attempt}");
        }

        $this->withServerVariables(['REMOTE_ADDR' => '10.0.0.99'])
            ->post(route('school.verify.lookup'), [
                'person_id' => 'STU-BLOCK',
                'award_id' => 'AWD-UNKNOWN-1',
            ])
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('blocked', true)
                ->where('submitted', true)
                ->where('award', null));
    }

    public function test_the_lookup_is_rate_limited_per_ip(): void
    {
        foreach (range(1, 10) as $attempt) {
            $this->post(route('school.verify.lookup'), [
                'person_id' => 'STU-RATE',
                'award_id' => 'AWD-RATE-'.$attempt,
            ])->assertOk();
        }

        $this->post(route('school.verify.lookup'), [
            'person_id' => 'STU-RATE',
            'award_id' => 'AWD-RATE-11',
        ])->assertStatus(429);
    }

    public function test_award_seeder_is_idempotent_and_verifiable(): void
    {
        $this->seed(AwardSeeder::class);

        $seeded = Award::query()->count();

        $this->assertGreaterThan(0, $seeded);

        // Re-running `db:seed` must not duplicate the register.
        $this->seed(AwardSeeder::class);

        $this->assertSame($seeded, Award::query()->count());

        // A seeded record verifies through the public page.
        $award = Award::query()->firstOrFail();

        $this->post(route('school.verify.lookup'), [
            'person_id' => $award->person_id,
            'award_id' => $award->award_id,
        ])
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('award.full_name', $award->full_name));
    }
}
