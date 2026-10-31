<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;

#[Name('ListEvents')]
#[IsReadOnly]
#[Description('List school events. Optional argument: page.')]
class ListEventsTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardEventController::class;

    protected string $action = 'index';

    protected string $verb = 'GET';

    /** @var array<int, string> */
    protected array $models = [];
}
