<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;

#[Name('ListPrograms')]
#[IsReadOnly]
#[Description('List academic programs.')]
class ListProgramsTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardProgramController::class;

    protected string $action = 'index';

    protected string $verb = 'GET';

    /** @var array<int, string> */
    protected array $models = [];
}
