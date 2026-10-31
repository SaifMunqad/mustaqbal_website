<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('UpdateSiteSettings')]
#[Description('Update site settings. Provide the fields to change.')]
class UpdateSiteSettingsTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardSiteSettingController::class;

    protected string $action = 'update';

    protected string $verb = 'PUT';

    /** @var array<int, string> */
    protected array $models = [];
}
