<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('CreateArticle')]
#[Description('Create an article. Provide the same fields the dashboard article form sends (title, body, images, is_published). Validation errors are returned with the offending field names.')]
class CreateArticleTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardArticleController::class;

    protected string $action = 'store';

    protected string $verb = 'POST';

    /** @var array<int, string> */
    protected array $models = [];
}
