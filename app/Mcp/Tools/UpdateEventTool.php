<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('UpdateEvent')]
#[Description('Update an event.')]
class UpdateEventTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardEventController::class;

    protected string $action = 'update';

    protected string $verb = 'PUT';

    /** @var array<int, string> */
    protected array $models = ['event'];

    /**
     * @return array<string, \Illuminate\JsonSchema\Types\Type>
     */
    public function schema(\Illuminate\Contracts\JsonSchema\JsonSchema $schema): array
    {
        return [
            'event' => $schema->integer()->description('The event id.')->required(),
        ];
    }
}
