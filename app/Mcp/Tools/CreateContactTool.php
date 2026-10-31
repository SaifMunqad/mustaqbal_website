<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('CreateContact')]
#[Description('Create a contact directory entry (management role only), e.g. staff or organisation records used by contacts campaigns.')]
class CreateContactTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardContactController::class;

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
            'name' => $schema->string()->description('Contact name.')->required(),
            'email' => $schema->string()->description('Contact email address.')->required(),
            'phone' => $schema->string()->description('Contact phone (used by WhatsApp campaigns).'),
            'subject' => $schema->string()->description('Free-text role/subject label.'),
            'message' => $schema->string()->description('Notes about this contact.')->required(),
        ];
    }
}
