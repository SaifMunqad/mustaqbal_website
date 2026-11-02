<?php

namespace Tests\Feature\Settings;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Laravel\Passport\ClientRepository;
use Tests\TestCase;

class ApiTokenManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        app(ClientRepository::class)->createPersonalAccessGrantClient('Test personal access client', 'users');
    }

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

    public function test_api_settings_handles_a_non_array_oauth_grant_type(): void
    {
        $user = User::factory()->create();

        DB::table('oauth_clients')->insert([
            'id' => (string) Str::uuid(),
            'owner_id' => $user->id,
            'owner_type' => $user::class,
            'name' => 'Malformed client',
            'secret' => null,
            'provider' => null,
            'redirect_uris' => '[]',
            'grant_types' => json_encode('password'),
            'revoked' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->actingAs($user)
            ->get(route('api-tokens.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('oauthClients', 1)
                ->where('oauthClients.0.grant_types', []));
    }

    public function test_user_can_create_a_key_and_secret_is_shown_once(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->post(route('api-tokens.store'), ['name' => 'MCP integration']);

        $response->assertRedirect(route('api-tokens.index'));
        $this->assertDatabaseHas('oauth_access_tokens', [
            'user_id' => $user->id,
            'name' => 'MCP integration',
        ]);

        $this->get(route('api-tokens.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('newToken', fn ($token) => is_string($token) && $token !== ''));

        $this->get(route('api-tokens.index'))
            ->assertInertia(fn (Assert $page) => $page->where('newToken', null));
    }

    public function test_user_can_revoke_only_their_own_key(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $ownTokenId = $user->createToken('Own key')->accessTokenId;
        $otherTokenId = $otherUser->createToken('Other key')->accessTokenId;

        $this->actingAs($user)
            ->delete(route('api-tokens.destroy', $ownTokenId))
            ->assertRedirect(route('api-tokens.index'));

        $this->assertDatabaseMissing('oauth_access_tokens', ['id' => $ownTokenId]);
        $this->assertDatabaseHas('oauth_access_tokens', ['id' => $otherTokenId]);
    }
}
