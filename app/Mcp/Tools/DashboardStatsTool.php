<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;

#[Name('DashboardStats')]
#[IsReadOnly]
#[Description('Return the school dashboard summary counters (articles, posts, contacts, messages, programs, pages, events, enrollments, jobs, books).')]
class DashboardStatsTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\DashboardController::class;

    protected string $action = 'index';

    protected string $verb = 'GET';

    /** @var array<int, string> */
    protected array $models = [];
}
