<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('RetryEmailCampaign')]
#[Description('Re-dispatch an email campaign, retrying only the failed recipients exactly as the dashboard retry button does. Admin role only.')]
class RetryEmailCampaignTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\EmailCampaignController::class;

    protected string $action = 'retry';

    protected string $verb = 'POST';

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
