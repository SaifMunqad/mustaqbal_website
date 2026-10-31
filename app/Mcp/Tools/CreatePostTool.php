<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('CreatePost')]
#[Description('Create a post. Provide the dashboard post fields; validation errors list the field names.')]
class CreatePostTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardPostController::class;

    protected string $action = 'store';

    protected string $verb = 'POST';

    /** @var array<int, string> */
    protected array $models = [];
}
