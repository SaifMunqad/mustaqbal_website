<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;

#[Name('ShowEmailCampaign')]
#[IsReadOnly]
#[Description('Read an email campaign with its per-recipient delivery.')]
class ShowEmailCampaignTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\EmailCampaignController::class;

    protected string $action = 'show';

    protected string $verb = 'GET';

    /** @var array<int, string> */
    protected array $models = ['emailCampaign'];

    /**
     * @return array<string, \Illuminate\JsonSchema\Types\Type>
     */
    public function schema(\Illuminate\Contracts\JsonSchema\JsonSchema $schema): array
    {
        return [
            'emailCampaign' => $schema->integer()->description('The email campaign id.')->required(),
        ];
    }
}
