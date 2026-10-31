<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('ReorderLanguages')]
#[Description('Reorder languages by passing their ids in the desired display order (admin role only).')]
class ReorderLanguagesTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardLanguageController::class;

    protected string $action = 'reorder';

    protected string $verb = 'PUT';

    /** @var array<int, string> */
    protected array $models = [];

    /**
     * @return array<string, \Illuminate\JsonSchema\Types\Type>
     */
    public function schema(\Illuminate\Contracts\JsonSchema\JsonSchema $schema): array
    {
        return [
            'order' => $schema->array()->items($schema->integer())->description('Language ids in the desired display order.')->required(),
        ];
    }
}
