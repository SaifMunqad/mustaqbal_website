<?php

namespace Tests\Feature\Settings;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ApiTokenManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_view_only_their_own_api_tokens(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $user->createToken('Own key');
        $otherUser->createToken('Other key');

        $this->actingAs($user)
            ->get(route('api-tokens.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('settings/api')
                ->has('tokens', 1)
                ->where('tokens.0.name', 'Own key')
                ->missing('tokens.0.token'));
    }

    public function test_user_can_create_a_key_and_secret_is_shown_once(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->post(route('api-tokens.store'), ['name' => 'MCP integration']);

        $response->assertRedirect(route('api-tokens.index'));
        $this->assertDatabaseHas('personal_access_tokens', [
            'tokenable_id' => $user->id,
            'name' => 'MCP integration',
        ]);

        $this->get(route('api-tokens.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('newToken', fn ($token) => is_string($token) && str_contains($token, '|')));

        $this->get(route('api-tokens.index'))
            ->assertInertia(fn (Assert $page) => $page->where('newToken', null));
    }

    public function test_user_can_revoke_only_their_own_key(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $ownToken = $user->createToken('Own key')->accessToken;
        $otherToken = $otherUser->createToken('Other key')->accessToken;

        $this->actingAs($user)
            ->delete(route('api-tokens.destroy', $ownToken->getKey()))
            ->assertRedirect(route('api-tokens.index'));

        $this->assertDatabaseMissing('personal_access_tokens', ['id' => $ownToken->getKey()]);
        $this->assertDatabaseHas('personal_access_tokens', ['id' => $otherToken->getKey()]);
    }
}
