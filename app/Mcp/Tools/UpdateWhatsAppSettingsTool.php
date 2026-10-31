<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('UpdateWhatsAppSettings')]
#[Description('Update WhatsApp integration settings: phone_number_id, business_account_id, graph_version, is_active, and access_token (a blank or omitted token keeps the stored secret, exactly like the dashboard form). Admin role only.')]
class UpdateWhatsAppSettingsTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\WhatsAppSettingController::class;

    protected string $action = 'update';

    protected string $verb = 'PUT';

    /** @var array<int, string> */
    protected array $models = [];
}
