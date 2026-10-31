<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('TestWhatsAppSettings')]
#[Description('Run the dashboard "test connection" check against the WhatsApp Graph API and report whether the stored credentials work. Admin role only.')]
class TestWhatsAppSettingsTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\WhatsAppSettingController::class;

    protected string $action = 'test';

    protected string $verb = 'POST';

    /** @var array<int, string> */
    protected array $models = [];
}
