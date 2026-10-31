<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;

#[Name('ListMails')]
#[IsReadOnly]
#[Description('List the outbound mail log (management). Optional: search, page.')]
class ListMailsTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\MailLogController::class;

    protected string $action = 'index';

    protected string $verb = 'GET';

    /** @var array<int, string> */
    protected array $models = [];
}
