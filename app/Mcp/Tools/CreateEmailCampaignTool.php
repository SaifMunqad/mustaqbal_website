<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('CreateEmailCampaign')]
#[Description('Create and queue a bulk email campaign (admin role only). recipient_source selects the audience: users, contacts, users_contacts, custom (with custom_emails, one address per line) or selected_applicants (with job_filter).')]
class CreateEmailCampaignTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\EmailCampaignController::class;

    protected string $action = 'store';

    protected string $verb = 'POST';

    /** @var array<int, string> */
    protected array $models = [];

    /**
     * @return array<string, \Illuminate\JsonSchema\Types\Type>
     */
    public function schema(\Illuminate\Contracts\JsonSchema\JsonSchema $schema): array
    {
        return [
            'subject' => $schema->string()->description('Email subject.')->required(),
            'body' => $schema->string()->description('Message body.')->required(),
            'recipient_source' => $schema->string()->enum(['users', 'contacts', 'users_contacts', 'custom', 'selected_applicants'])->description('Which audience receives the campaign.')->required(),
            'custom_emails' => $schema->string()->description('Newline-separated addresses; required when recipient_source is custom.'),
            'job_filter' => $schema->integer()->description('Job id whose applicants receive the campaign (selected_applicants).'),
        ];
    }
}
