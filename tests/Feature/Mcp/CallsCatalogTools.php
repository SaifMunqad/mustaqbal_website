<?php

declare(strict_types=1);

namespace Tests\Feature\Mcp;

use App\Mcp\Servers\SchoolDashboardServer;
use App\Models\User;
use Laravel\Mcp\Server\Testing\TestResponse;

/**
 * Invokes a tool against the SchoolDashboardServer.
 *
 * All tools are registered directly on the server and accessible
 * via the standard MCP pagination system and direct invocation.
 */
trait CallsCatalogTools
{
    protected function callCatalog(User $as, string $toolClass, array $args = []): TestResponse
    {
        return SchoolDashboardServer::actingAs($as)->tool($toolClass, $args);
    }
}
