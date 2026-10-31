<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('DeleteBookCategory')]
#[Description('Delete a book category. The dashboard refuses categories that still contain books.')]
class DeleteBookCategoryTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardBookCategoryController::class;

    protected string $action = 'destroy';

    protected string $verb = 'DELETE';

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
