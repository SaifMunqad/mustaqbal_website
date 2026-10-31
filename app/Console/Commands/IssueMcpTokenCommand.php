<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class IssueMcpTokenCommand extends Command
{
    /**
     * @var string
     */
    protected $signature = 'mcp:token
        {email : The email address of the dashboard account to authorize}
        {--name= : A human-readable label for the token (defaults to the MCP server name)}';

    /**
     * @var string
     */
    protected $description = 'Issue a Sanctum bearer token that grants MCP access to the dashboard on behalf of an existing account';

    /**
     * Mint a long-lived Sanctum token for the given account. Whatever role that
     * account has in the dashboard is exactly what the MCP server will allow, so
     * no separate authorization model is introduced.
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

        // One non-expiring token per invocation; the plaintext is shown once.
        $token = $user->createToken($name);

        $this->info('MCP endpoint: '.url('/mcp'));
        $this->info("Authorization header: Bearer {$token->plainTextToken}");
        $this->line('');
        $this->warn('Store this token securely. It will not be shown again.');

        return self::SUCCESS;
    }
}
