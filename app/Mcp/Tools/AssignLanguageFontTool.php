<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('AssignLanguageFont')]
#[Description('Point a language at a typeface through the dashboard typography screen. Selection is one opaque value: "default" (built-in Noto Naskh stack), "google:{key}" (keys listed by GetSiteSettings under googleFonts), or "font:{id}" (uploaded family, listed under fonts).')]
class AssignLanguageFontTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardFontController::class;

    protected string $action = 'assign';

    protected string $verb = 'PUT';

    /** @var array<int, string> */
    protected array $models = ['language'];

    /**
     * @return array<string, \Illuminate\JsonSchema\Types\Type>
     */
    public function schema(\Illuminate\Contracts\JsonSchema\JsonSchema $schema): array
    {
        return [
            'language' => $schema->integer()->description('The language id (from ListLanguages).')->required(),
            'selection' => $schema->string()->description('"default", "google:{key}" or "font:{id}".')->required(),
        ];
    }
}
