<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;

#[Name('ListWhatsAppCampaigns')]
#[IsReadOnly]
#[Description('List WhatsApp campaigns (admin).')]
class ListWhatsAppCampaignsTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\WhatsAppCampaignController::class;

    protected string $action = 'index';

    protected string $verb = 'GET';

    /** @var array<int, string> */
    protected array $models = [];
}
