<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('UpdateBook')]
#[Description('Update an existing book. Provide the book id plus the fields to change; use UploadBookPdf first to attach a new PDF.')]
class UpdateBookTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardBookController::class;

    protected string $action = 'update';

    protected string $verb = 'PUT';

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
