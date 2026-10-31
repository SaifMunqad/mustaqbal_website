<?php

use App\Http\Middleware\AuditMcpRequests;
use App\Mcp\Servers\SchoolDashboardServer;
use Laravel\Mcp\Facades\Mcp;

/*
|--------------------------------------------------------------------------
| Model Context Protocol servers
|--------------------------------------------------------------------------
|
| The school dashboard is exposed over MCP at `/mcp`. Access is guarded by a
| Laravel Sanctum bearer token, so the acting user (and therefore every role,
| verified and active check plus each policy) is identical to a browser session.
| The server itself contains no business logic: each tool forwards to an existing
| dashboard controller action through App\Mcp\Support\DashboardDispatcher.
|
*/

Mcp::web('/mcp', SchoolDashboardServer::class)
    ->middleware([
        'mcp.auth',
        // Budget the endpoint before any dashboard work happens.
        'throttle:mcp',
        'auth:sanctum',
        // Innermost so the acting user is resolved: one audit line per call.
        AuditMcpRequests::class,
    ]);
