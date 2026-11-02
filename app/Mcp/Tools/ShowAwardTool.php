<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;

#[Name('ShowAward')]
#[IsReadOnly]
#[Description('Read the full details of one award by its database id.')]
class ShowAwardTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardAwardController::class;

    protected string $action = 'edit';

    protected string $verb = 'GET';

    /** @var array<int, string> */
    protected array $models = ['award'];

    /**
     * @return array<string, \Illuminate\JsonSchema\Types\Type>
     */
    public function schema(\Illuminate\Contracts\JsonSchema\JsonSchema $schema): array
    {
        return [
            'award' => $schema->integer()->description('The award database id.')->required(),
        ];
    }
}