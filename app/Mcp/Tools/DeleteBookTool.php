<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('DeleteBook')]
#[Description('Delete a book and its stored files.')]
class DeleteBookTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardBookController::class;

    protected string $action = 'destroy';

    protected string $verb = 'DELETE';

    /** @var array<int, string> */
    protected array $models = ['book'];

    /**
     * @return array<string, \Illuminate\JsonSchema\Types\Type>
     */
    public function schema(\Illuminate\Contracts\JsonSchema\JsonSchema $schema): array
    {
        return [
            'book' => $schema->integer()->description('The book id.')->required(),
        ];
    }
}
