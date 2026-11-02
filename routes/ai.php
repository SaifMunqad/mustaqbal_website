<?php

use App\Http\Middleware\AuditMcpRequests;
use App\Http\Middleware\AuthenticateMcp;
use App\Mcp\Servers\SchoolDashboardServer;
use Laravel\Mcp\Facades\Mcp;

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
