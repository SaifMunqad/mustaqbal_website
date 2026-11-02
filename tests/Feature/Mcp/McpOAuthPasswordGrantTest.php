<?php

declare(strict_types=1);

namespace Tests\Feature\Mcp;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Passport\Client;
use Laravel\Passport\ClientRepository;
use Tests\TestCase;

/**
 * Verifies that the MCP server works with OAuth Password Grant authentication.
 *
 * This simulates how an OAuth 2.0 client (e.g., Gemini) would connect:
 * 1. Create an OAuth Password Grant client (Client ID + Client Secret).
 * 2. Exchange user credentials for an access token at /oauth/token.
 * 3. Use the access token to call the /mcp endpoint.
 */
class McpOAuthPasswordGrantTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private string $clientId;
    private string $clientSecret;

    protected function setUp(): void
    {
        parent::setUp();

        // Create a user with a known password.
        $this->user = User::factory()->create([
            'role' => 'admin',
            'email_verified_at' => now(),
            'password' => bcrypt('password123'),
        ]);

        // Create an OAuth Password Grant client for the user.
        $this->clientSecret = Str::random(40);

        $client = new Client([
            'name' => 'Test OAuth Client',
            'secret' => $this->clientSecret,
            'provider' => null,
            'redirect_uris' => [],
            'grant_types' => ['password', 'refresh_token'],
            'revoked' => false,
        ]);

        $this->user->oauthApps()->save($client);
        $this->clientId = $client->id;

        // Also create the personal access client so $user->createToken() works
        // in other tests that may run in the same process.
        app(ClientRepository::class)->createPersonalAccessGrantClient('Dashboard MCP', 'users');
    }

    /**
     * Test that we can obtain an access token using the OAuth Password Grant flow.
     */
    public function test_can_obtain_access_token_via_password_grant(): void
    {
        $response = $this->post('/oauth/token', [
            'grant_type' => 'password',
            'client_id' => $this->clientId,
            'client_secret' => $this->clientSecret,
            'username' => $this->user->email,
            'password' => 'password123',
            'scope' => '',
        ]);

        $response->assertOk();

        $data = $response->json();

        $this->assertArrayHasKey('access_token', $data);
        $this->assertArrayHasKey('token_type', $data);
        $this->assertArrayHasKey('expires_in', $data);
        $this->assertSame('Bearer', $data['token_type']);
    }

    /**
     * Test that invalid credentials are rejected.
     */
    public function test_password_grant_rejects_invalid_credentials(): void
    {
        $response = $this->post('/oauth/token', [
            'grant_type' => 'password',
            'client_id' => $this->clientId,
            'client_secret' => $this->clientSecret,
            'username' => $this->user->email,
            'password' => 'wrong-password',
            'scope' => '',
        ]);

        $response->assertStatus(400);

        $data = $response->json();
        $this->assertArrayHasKey('error', $data);
        $this->assertSame('invalid_grant', $data['error']);
    }

    /**
     * Test that invalid client credentials are rejected.
     */
    public function test_password_grant_rejects_invalid_client_credentials(): void
    {
        $response = $this->post('/oauth/token', [
            'grant_type' => 'password',
            'client_id' => 'invalid-client-id',
            'client_secret' => 'invalid-secret',
            'username' => $this->user->email,
            'password' => 'password123',
            'scope' => '',
        ]);

        $response->assertStatus(401);
    }

    /**
     * Test that an access token obtained via Password Grant can access the MCP endpoint.
     * This is the full end-to-end test: create client -> get token -> call MCP.
     */
    public function test_access_token_from_password_grant_can_access_mcp_endpoint(): void
    {
        // Step 1: Obtain an access token via Password Grant.
        $tokenResponse = $this->post('/oauth/token', [
            'grant_type' => 'password',
            'client_id' => $this->clientId,
            'client_secret' => $this->clientSecret,
            'username' => $this->user->email,
            'password' => 'password123',
            'scope' => '',
        ]);

        $tokenResponse->assertOk();
        $accessToken = $tokenResponse->json('access_token');

        // Step 2: Use the access token to call the MCP endpoint.
        $mcpResponse = $this->postJson('/mcp', [
            'jsonrpc' => '2.0',
            'id' => 1,
            'method' => 'initialize',
            'params' => [
                'protocolVersion' => '2025-06-18',
                'capabilities' => new \stdClass,
                'clientInfo' => ['name' => 'oauth-test', 'version' => '1.0'],
            ],
        ], ['Authorization' => 'Bearer ' . $accessToken]);

        $mcpResponse->assertOk();
    }

    /**
     * Test that an access token from Password Grant can run MCP tools.
     */
    public function test_access_token_from_password_grant_can_run_mcp_tools(): void
    {
        // Obtain an access token.
        $tokenResponse = $this->post('/oauth/token', [
            'grant_type' => 'password',
            'client_id' => $this->clientId,
            'client_secret' => $this->clientSecret,
            'username' => $this->user->email,
            'password' => 'password123',
            'scope' => '',
        ]);

        $tokenResponse->assertOk();
        $accessToken = $tokenResponse->json('access_token');

        // Call an MCP tool using the access token.
        $mcpResponse = $this->postJson('/mcp', [
            'jsonrpc' => '2.0',
            'id' => 1,
            'method' => 'tools/call',
            'params' => ['name' => 'DashboardStats', 'arguments' => []],
        ], ['Authorization' => 'Bearer ' . $accessToken]);

        $mcpResponse->assertOk()
            ->assertJsonPath('result.isError', false);
    }

    /**
     * Test that an invalid access token is rejected by the MCP endpoint.
     */
    public function test_mcp_endpoint_rejects_invalid_access_token(): void
    {
        $mcpResponse = $this->postJson('/mcp', [
            'jsonrpc' => '2.0',
            'id' => 1,
            'method' => 'initialize',
            'params' => [
                'protocolVersion' => '2025-06-18',
                'capabilities' => new \stdClass,
                'clientInfo' => ['name' => 'oauth-test', 'version' => '1.0'],
            ],
        ], ['Authorization' => 'Bearer invalid-token']);

        $mcpResponse->assertUnauthorized();
    }

    /**
     * Test that the MCP endpoint rejects requests without authentication.
     */
    public function test_mcp_endpoint_rejects_unauthenticated_requests(): void
    {
        $mcpResponse = $this->postJson('/mcp', [
            'jsonrpc' => '2.0',
            'id' => 1,
            'method' => 'initialize',
            'params' => [
                'protocolVersion' => '2025-06-18',
                'capabilities' => new \stdClass,
                'clientInfo' => ['name' => 'oauth-test', 'version' => '1.0'],
            ],
        ]);

        $mcpResponse->assertUnauthorized();
    }
}
