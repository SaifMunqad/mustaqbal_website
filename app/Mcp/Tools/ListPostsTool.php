<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;

#[Name('ListPosts')]
#[IsReadOnly]
#[Description('List community posts (paginated) with only each post’s id, title, type and visibility. Use ShowPost to read the full details. Optional argument: page.')]
class ListPostsTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardPostController::class;

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

        $posts = $props['posts'] ?? [];
        $posts['data'] = array_map(static fn (array $post): array => array_intersect_key(
            $post,
            array_flip(['id', 'title', 'type', 'visibility']),
        ), $posts['data'] ?? []);

        return Response::structured(['posts' => $posts]);
    }
}
