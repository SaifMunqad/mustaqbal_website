<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('CreateBook')]
#[Description('Create a book. Text lives in "translations" per active language code (title required for the default language). Attach a PDF via UploadBookPdf first and pass its returned paths as file_path/thumbnail_path.')]
class CreateBookTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardBookController::class;

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
            'author' => $schema->string()->description('Author name (not localized).'),
            'isbn' => $schema->string()->description('ISBN identifier.'),
            'published_year' => $schema->integer()->description('Publication year, 1000-2100.'),
            'book_category_id' => $schema->integer()->description('Category id from ListBookCategories.'),
            'file_path' => $schema->string()->description('Disk-relative PDF path returned by UploadBookPdf.'),
            'thumbnail_path' => $schema->string()->description('Disk-relative thumbnail path returned by UploadBookPdf.'),
            'images' => $schema->array()->items($schema->string())->description('Cover/gallery image URLs from UploadMedia.'),
            'translations' => $schema->object()->description('Language code => {title, publisher, description}. title is required for the default language.'),
        ];
    }
}
