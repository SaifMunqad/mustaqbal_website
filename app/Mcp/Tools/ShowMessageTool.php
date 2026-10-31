<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;

#[Name('ShowMessage')]
#[IsReadOnly]
#[Description('Read a single message with its answers.')]
class ShowMessageTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardMessageController::class;

    protected string $action = 'show';

    protected string $verb = 'GET';

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
