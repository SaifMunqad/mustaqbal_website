<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;

#[Name('ShowEvent')]
#[IsReadOnly]
#[Description('Read a single event with its full editable fields (the dashboard edit screen data).')]
class ShowEventTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardEventController::class;

    protected string $action = 'edit';

    protected string $verb = 'GET';

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
