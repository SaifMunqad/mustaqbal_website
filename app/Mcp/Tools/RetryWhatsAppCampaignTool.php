<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('RetryWhatsAppCampaign')]
#[Description('Re-dispatch a WhatsApp campaign, retrying only the failed recipients exactly as the dashboard retry button does. Admin role only.')]
class RetryWhatsAppCampaignTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\WhatsAppCampaignController::class;

    protected string $action = 'retry';

    protected string $verb = 'POST';

    /** @var array<int, string> */
    protected array $models = ['whatsappCampaign'];

    /**
     * @return array<string, \Illuminate\JsonSchema\Types\Type>
     */
    public function schema(\Illuminate\Contracts\JsonSchema\JsonSchema $schema): array
    {
        return [
            'whatsappCampaign' => $schema->integer()->description('The WhatsApp campaign id.')->required(),
        ];
    }
}
