<?php

declare(strict_types=1);

namespace Tests\Feature\Mcp;

use App\Mcp\Servers\SchoolDashboardServer;
use App\Models\User;
use Laravel\Mcp\Server\Testing\TestResponse;
use Laravel\Mcp\Server\Tools\ExecuteTools;
use Laravel\Mcp\Server\Tools\ToolSearch;
use ReflectionClass;

/**
 * Calls a tool through the server's `execute_tools` gateway — the production
 * path for anything living in the ToolSearch catalog — so tests exercise the
 * same dispatch, guards and user resolution an agent client hits.
 *
 * The gateway carries the tool's result as JSON text rather than mirrored
 * structured content, so assert with `assertSee` on payload fragments (and
 * database state), while eager tools keep `assertStructuredContent`.
 */
trait CallsCatalogTools
{
    protected function callCatalog(User $as, string $toolClass, array $args = []): TestResponse
    {
        // Eagerly registered tools are addressed by name directly; only tools
        // that live inside the server's real ToolSearch catalog go through the
        // gateway (the server dispatches execute_tools by its own registration,
        // not by any ad-hoc instance the test could build).
        $entries = (new ReflectionClass(SchoolDashboardServer::class))->getDefaultProperties()['tools'];
        $catalog = $entries[ToolSearch::class] ?? [];

        if (! in_array($toolClass, $catalog, true)) {
            return SchoolDashboardServer::actingAs($as)->tool($toolClass, $args);
        }

        return SchoolDashboardServer::actingAs($as)
            ->tool(new ExecuteTools(new ToolSearch($catalog), 10), [
                'calls' => [
                    ['name' => app($toolClass)->name(), 'arguments' => $args],
                ],
            ]);
    }
}
