<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;

#[Name('ListArticles')]
#[IsReadOnly]
#[Description('List school articles (paginated, newest first) with only each article’s id, title and slug. Use ShowArticle to read the full details. Optional argument: page.')]
class ListArticlesTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardArticleController::class;

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

        $articles = $props['articles'] ?? [];
        $articles['data'] = array_map(static fn (array $article): array => array_intersect_key(
            $article,
            array_flip(['id', 'title', 'slug']),
        ), $articles['data'] ?? []);

        return Response::structured(['articles' => $articles]);
    }
}
