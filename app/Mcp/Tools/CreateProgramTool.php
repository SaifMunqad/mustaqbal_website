<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('CreateProgram')]
#[Description('Create a program. Provide the dashboard program fields.')]
class CreateProgramTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardProgramController::class;

    protected string $action = 'store';

    protected string $verb = 'POST';

    /** @var array<int, string> */
    protected array $models = [];
}
