<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('UpdateMessage')]
#[Description('Update a contact-box message record. Provide the message id plus the fields to change.')]
class UpdateMessageTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardMessageController::class;

    protected string $action = 'update';

    protected string $verb = 'PUT';

    /** @var array<int, string> */
    protected array $models = ['message'];

    /**
     * @return array<string, \Illuminate\JsonSchema\Types\Type>
     */
    public function schema(\Illuminate\Contracts\JsonSchema\JsonSchema $schema): array
    {
        return [
            'message' => $schema->integer()->description('The message id.')->required(),
        ];
    }
}
