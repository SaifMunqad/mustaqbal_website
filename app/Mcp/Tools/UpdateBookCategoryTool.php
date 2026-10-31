<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('UpdateBookCategory')]
#[Description('Update an existing book category. Provide the category id plus the fields to change.')]
class UpdateBookCategoryTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardBookCategoryController::class;

    protected string $action = 'update';

    protected string $verb = 'PUT';

    /** @var array<int, string> */
    protected array $models = ['category'];

    /**
     * @return array<string, \Illuminate\JsonSchema\Types\Type>
     */
    public function schema(\Illuminate\Contracts\JsonSchema\JsonSchema $schema): array
    {
        return [
            'category' => $schema->integer()->description('The book category id.')->required(),
        ];
    }
}
