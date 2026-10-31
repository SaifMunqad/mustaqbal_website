<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('UpdateLanguage')]
#[Description('Update a language: name, code, direction, active flag, default flag or sort order (admin role only).')]
class UpdateLanguageTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardLanguageController::class;

    protected string $action = 'update';

    protected string $verb = 'PUT';

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
