<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;

#[Name('ListUsers')]
#[IsReadOnly]
#[Description('List school accounts (admin only). Optional: search, role, status, page.')]
class ListUsersTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardUserController::class;

    protected string $action = 'index';

    protected string $verb = 'GET';

    /** @var array<int, string> */
    protected array $models = [];
}
