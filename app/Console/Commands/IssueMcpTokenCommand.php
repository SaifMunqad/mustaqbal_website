<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Str;
use Laravel\Passport\Client;

class IssueMcpTokenCommand extends Command
{
    /**
     * @var string
     */
    protected $signature = 'mcp:token
        {email : The email address of the dashboard account to authorize}
        {--name= : A human-readable label for the token (defaults to the MCP server name)}
        {--oauth : Create an OAuth Password Grant client instead of a personal access token}';

    /**
     * @var string
     */
    protected $description = 'Issue a Passport OAuth 2.0 bearer token or OAuth Password Grant client for MCP access';

    /**
     * Mint a Passport personal access token or create an OAuth Password Grant client
     * for the given account. Whatever role that account has in the dashboard is
     * exactly what the MCP server will allow, so no separate authorization model
     * is introduced.
     */
    public function handle(): int
    {
        $email = (string) $this->argument('email');

        $user = User::query()->where('email', $email)->first();

        if (! $user) {
            $this->error("No dashboard account exists for [{$email}].");

            return self::FAILURE;
        }

        if ($user->isSuspended()) {
            $this->error("This account is suspended and cannot use the dashboard server: [{$email}].");

            return self::FAILURE;
        }

        $name = (string) ($this->option('name') ?: 'Dashboard MCP');

        $this->info('MCP endpoint: '.url('/mcp'));
        $this->line('');

        if ($this->option('oauth')) {
            return $this->createOAuthClient($user, $name);
        }

        return $this->createPersonalAccessToken($user, $name);
    }

    /**
     * Create a personal access token for the user.
     */
    protected function createPersonalAccessToken(User $user, string $name): int
    {
        $token = $user->createToken($name);

        $this->info("Authorization header: Bearer {$token->accessToken}");
        $this->line('');
        $this->warn('Store this token securely. It will not be shown again.');

        return self::SUCCESS;
    }

    /**
     * Create an OAuth Password Grant client for the user.
     */
    protected function createOAuthClient(User $user, string $name): int
    {
        $secret = Str::random(40);

        $client = new Client([
            'name' => $name,
            'secret' => $secret,
            'provider' => null,
            'redirect_uris' => [],
            'grant_types' => ['password', 'refresh_token'],
            'revoked' => false,
        ]);

        $user->oauthApps()->save($client);

        $this->info('OAuth Password Grant client created.');
        $this->line('');
        $this->line("Client ID:     {$client->id}");
        $this->line("Client Secret: {$client->plainSecret}");
        $this->line('');
        $this->info('To authenticate with the MCP server using OAuth Password Grant:');
        $this->line('');
        $this->line("  POST {base_url}/oauth/token");
        $this->line('  grant_type=password');
        $this->line("  client_id={$client->id}");
        $this->line("  client_secret={$client->plainSecret}");
        $this->line("  username={$user->email}");
        $this->line('  password=<your password>');
        $this->line('');
        $this->warn('Store the Client Secret securely. It will not be shown again.');

        return self::SUCCESS;
    }
}
