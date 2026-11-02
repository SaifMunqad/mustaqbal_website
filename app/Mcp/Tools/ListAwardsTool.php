<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;

#[Name('ListAwards')]
#[IsReadOnly]
#[Description('List awards (management, paginated) with only id, person_id and award_id. Use ShowAward to read the full award details. Optional: search, page.')]
class ListAwardsTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardAwardController::class;

    protected string $action = 'index';

    protected string $verb = 'GET';

    /** @var array<int, string> */
    protected array $models = [];

    public function handle(Request $request): Response|ResponseFactory
    {
        $props = $this->dispatcher->props($request, $this->controller, $this->action);

        if (! is_array($props)) {
            return $props;
        }

        $awards = $props['awards'] ?? [];
        $awards['data'] = array_map(static fn (array $award): array => array_intersect_key(
            $award,
            array_flip(['id', 'person_id', 'award_id']),
        ), $awards['data'] ?? []);

        return Response::structured(['awards' => $awards]);
    }
}
