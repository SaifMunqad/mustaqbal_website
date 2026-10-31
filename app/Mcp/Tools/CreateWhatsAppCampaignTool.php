<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('CreateWhatsAppCampaign')]
#[Description('Create and dispatch a WhatsApp campaign through the dashboard. recipient_source: "contacts" (addressed contacts) or "custom" (with custom_numbers, one per line). mode: "text" (with message) or "template" (with template_name, template_language, optional template_variables). Admin role only, like the web form.')]
class CreateWhatsAppCampaignTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\WhatsAppCampaignController::class;

    protected string $action = 'store';

    protected string $verb = 'POST';

    /** @var array<int, string> */
    protected array $models = [];
}
