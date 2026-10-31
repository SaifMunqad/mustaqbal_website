<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('CreateEvent')]
#[Description('Create an event. Provide the dashboard event fields.')]
class CreateEventTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardEventController::class;

    protected string $action = 'store';

    protected string $verb = 'POST';

    /** @var array<int, string> */
    protected array $models = [];
}
