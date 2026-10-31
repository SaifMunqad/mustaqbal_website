<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;

#[Name('ListEnrollments')]
#[IsReadOnly]
#[Description('List enrollment enquiries (management/admin). Optional: search, status, page.')]
class ListEnrollmentsTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardEnrollmentController::class;

    protected string $action = 'index';

    protected string $verb = 'GET';

    /** @var array<int, string> */
    protected array $models = [];
}
