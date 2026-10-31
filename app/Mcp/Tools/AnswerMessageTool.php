<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('AnswerMessage')]
#[Description('Reply to an inbox message.')]
class AnswerMessageTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardMessageController::class;

    protected string $action = 'storeAnswer';

    protected string $verb = 'POST';

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
