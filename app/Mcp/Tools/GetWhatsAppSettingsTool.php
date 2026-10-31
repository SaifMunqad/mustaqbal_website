<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;

#[Name('GetWhatsAppSettings')]
#[IsReadOnly]
#[Description('Read the WhatsApp integration settings (admin).')]
class GetWhatsAppSettingsTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\WhatsAppSettingController::class;

    protected string $action = 'edit';

    protected string $verb = 'GET';

    /** @var array<int, string> */
    protected array $models = [];
}
