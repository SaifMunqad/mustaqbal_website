<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('UpdateAward')]
#[Description('Update an existing award record. Provide the award id plus the fields to change.')]
class UpdateAwardTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardAwardController::class;

    protected string $action = 'update';

    protected string $verb = 'PUT';

    /** @var array<int, string> */
    protected array $models = ['award'];

    /**
     * @return array<string, \Illuminate\JsonSchema\Types\Type>
     */
    public function schema(\Illuminate\Contracts\JsonSchema\JsonSchema $schema): array
    {
        return [
            'award' => $schema->integer()->description('The award id.')->required(),
        ];
    }
}
