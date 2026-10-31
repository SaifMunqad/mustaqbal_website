<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;

#[Name('ListContacts')]
#[IsReadOnly]
#[Description('List contact submissions.')]
class ListContactsTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardContactController::class;

    protected string $action = 'index';

    protected string $verb = 'GET';

    /** @var array<int, string> */
    protected array $models = [];
}
