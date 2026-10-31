<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Contracts\Http\Kernel as HttpKernel;
use Illuminate\Http\Request;

class McpSelfTestCommand extends Command
{
    /**
     * @var string
     */
    protected $signature = 'mcp:self-test {token : The Sanctum bearer token to validate (the value printed by mcp:token)}';

    /**
     * @var string
     */
    protected $description = 'Dispatch a real MCP initialize request through the HTTP stack to verify the token and route';

    /**
     * Sends the initialize handshake the same way an MCP client would, through
     * the full HTTP kernel (route + middleware + Sanctum). A 200 here proves the
     * token and dashboard server are correct; a 401 in a browser/client while
     * this returns 200 means the web server is stripping the Authorization
     * header (now mitigated by RecoverAuthorizationHeader + .htaccess).
     */
    public function handle(): int
    {
        $token = trim((string) $this->argument('token'));

        if ($token === '') {
            $this->error('A token is required.');

            return self::FAILURE;
        }

        $payload = json_encode([
            'jsonrpc' => '2.0',
            'id' => 1,
            'method' => 'initialize',
            'params' => [
                'protocolVersion' => '2025-06-18',
                'capabilities' => new \stdClass,
                'clientInfo' => ['name' => 'self-test', 'version' => '1.0'],
            ],
        ], JSON_THROW_ON_ERROR);

        $request = Request::create(
            '/mcp',
            'POST',
            [],
            [],
            [],
            [
                'HTTP_AUTHORIZATION' => 'Bearer '.$token,
                'CONTENT_TYPE' => 'application/json',
                'HTTP_ACCEPT' => 'application/json',
            ],
            $payload,
        );

        $response = app(HttpKernel::class)->handle($request);

        $status = $response->getStatusCode();

        if ($status === 200) {
            $this->info('OK — the MCP server authenticated the token and responded 200.');
            $this->line('Handshake result: '.substr((string) $response->getContent(), 0, 240));

            return self::SUCCESS;
        }

        $this->error("Failed with HTTP {$status}.");
        $this->line(substr((string) $response->getContent(), 0, 240));

        if ($status === 401) {
            $this->warn('Token was rejected. Re-run `php artisan mcp:token <email>` and use the full "ID|secret" value it prints.');
        }

        return self::FAILURE;
    }
}
