<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('DeleteEvent')]
#[Description('Delete an event.')]
class DeleteEventTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardEventController::class;

    protected string $action = 'destroy';

    protected string $verb = 'DELETE';

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
