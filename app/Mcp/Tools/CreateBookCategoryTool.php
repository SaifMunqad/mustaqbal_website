<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('CreateBookCategory')]
#[Description('Create a book category. Provide the dashboard category fields.')]
class CreateBookCategoryTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardBookCategoryController::class;

    protected string $action = 'store';

    protected string $verb = 'POST';

    /** @var array<int, string> */
    protected array $models = [];

    /**
     * @return array<string, \Illuminate\JsonSchema\Types\Type>
     */
    public function schema(\Illuminate\Contracts\JsonSchema\JsonSchema $schema): array
    {
        return [
            'name' => $schema->string()->description('Category name; per-language rows follow the web form.')->required(),
        ];
    }
}
