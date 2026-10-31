<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('CreateJob')]
#[Description('Create a job opening. Provide the dashboard job fields.')]
class CreateJobTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardJobController::class;

    protected string $action = 'store';

    protected string $verb = 'POST';

    /** @var array<int, string> */
    protected array $models = [];
}
