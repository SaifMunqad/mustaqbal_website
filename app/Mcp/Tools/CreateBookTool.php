<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('CreateBook')]
#[Description('Create a book. Provide the dashboard book fields.')]
class CreateBookTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardBookController::class;

    protected string $action = 'store';

    protected string $verb = 'POST';

    /** @var array<int, string> */
    protected array $models = [];
}
