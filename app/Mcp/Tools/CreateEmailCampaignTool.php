<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('CreateEmailCampaign')]
#[Description('Create and dispatch an email campaign. Provide subject, body and audience.')]
class CreateEmailCampaignTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\EmailCampaignController::class;

    protected string $action = 'store';

    protected string $verb = 'POST';

    /** @var array<int, string> */
    protected array $models = [];
}
