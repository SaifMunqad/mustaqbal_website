<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;

#[Name('PreviewPalette')]
#[IsReadOnly]
#[Description('Derive the candidate brand palette (OKLab tints, contrast-checked) the settings live preview uses, for a given brand_color/accent_color/tint_depth before committing it via UpdateSiteSettings.')]
class PreviewPaletteTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardSiteSettingController::class;

    protected string $action = 'palette';

    protected string $verb = 'POST';
}
