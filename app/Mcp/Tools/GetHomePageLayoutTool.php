<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;

#[Name('GetHomePageLayout')]
#[IsReadOnly]
#[Description('Read the editable home page layout, including ordered sections, translations, configuration and available builder items.')]
class GetHomePageLayoutTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardPageBuilderController::class;

    protected string $action = 'visual';

    protected string $verb = 'GET';
}
