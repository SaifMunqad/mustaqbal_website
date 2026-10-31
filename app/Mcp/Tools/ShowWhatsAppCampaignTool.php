<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;

#[Name('ShowWhatsAppCampaign')]
#[IsReadOnly]
#[Description('Read a WhatsApp campaign with its delivery results.')]
class ShowWhatsAppCampaignTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\WhatsAppCampaignController::class;

    protected string $action = 'show';

    protected string $verb = 'GET';

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
