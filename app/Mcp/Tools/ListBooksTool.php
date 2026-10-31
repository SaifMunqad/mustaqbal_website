<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;

#[Name('ListBooks')]
#[IsReadOnly]
#[Description('List bookstore books (management). Optional: search, page.')]
class ListBooksTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardBookController::class;

    protected string $action = 'index';

    protected string $verb = 'GET';

    /** @var array<int, string> */
    protected array $models = [];
}
