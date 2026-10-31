<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('DeleteLanguage')]
#[Description('Delete a language (admin role only). The dashboard refuses languages that still own content.')]
class DeleteLanguageTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardLanguageController::class;

    protected string $action = 'destroy';

    protected string $verb = 'DELETE';

    /** @var array<int, string> */
    protected array $models = ['language'];

    /**
     * @return array<string, \Illuminate\JsonSchema\Types\Type>
     */
    public function schema(\Illuminate\Contracts\JsonSchema\JsonSchema $schema): array
    {
        return [
            'language' => $schema->integer()->description('The language id.')->required(),
        ];
    }
}
