<?php

use App\Http\Middleware\AuditMcpRequests;
use App\Http\Middleware\AuthenticateMcp;
use App\Mcp\Servers\SchoolDashboardServer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Laravel\Mcp\Facades\Mcp;

Route::get('/.well-known/oauth-protected-resource/mcp', function (Request $request) {
    $origin = $request->getSchemeAndHttpHost();

    return response()->json([
        'resource' => $origin.'/mcp',
        'authorization_servers' => [$origin],
        'bearer_methods_supported' => ['header'],
    ]);
});

Route::get('/.well-known/oauth-authorization-server', function (Request $request) {
    $origin = $request->getSchemeAndHttpHost();

    return response()->json([
        'issuer' => $origin,
        'authorization_endpoint' => $origin.'/oauth/authorize',
        'token_endpoint' => $origin.'/oauth/token',
        'response_types_supported' => ['code'],
        'response_modes_supported' => ['query'],
        'grant_types_supported' => ['authorization_code', 'refresh_token'],
        'code_challenge_methods_supported' => ['S256'],
        'token_endpoint_auth_methods_supported' => ['client_secret_post', 'client_secret_basic'],
    ]);
});

/*
|--------------------------------------------------------------------------
| Model Context Protocol servers
|--------------------------------------------------------------------------
|
| The school dashboard is exposed over MCP at `/mcp`. Access is guarded by a
| Laravel Passport OAuth 2.0 bearer token, so the acting user (and therefore
| every role, verified and active check plus each policy) is identical to a
| browser session. Tokens are issued via `php artisan mcp:token <email>`,
| which creates a Passport personal access token. Clients supporting standard
| OAuth 2.0 (e.g., Gemini) can also use the Password Grant flow at /oauth/token.
| The server itself contains no business logic: each tool forwards to an existing
| dashboard controller action through App\Mcp\Support\DashboardDispatcher.
|
*/

Mcp::web('/mcp', SchoolDashboardServer::class)
    ->middleware([
        'mcp.auth',
        // Budget the endpoint before any dashboard work happens.
        'throttle:mcp',
        // OAuth is required except in explicitly local, debug-enabled development.
        AuthenticateMcp::class,
        // Innermost so the acting user is resolved: one audit line per call.
        AuditMcpRequests::class,
    ]);
