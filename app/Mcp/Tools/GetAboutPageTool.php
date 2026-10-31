<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;

#[Name('GetAboutPage')]
#[IsReadOnly]
#[Description('Read the public About page publishing state (id, slug, is_published). Its content is edited through the builder: GetPageLayout with page "about".')]
class GetAboutPageTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardAboutController::class;

    protected string $action = 'edit';

    protected string $verb = 'GET';
}
