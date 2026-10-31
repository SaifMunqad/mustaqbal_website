<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('CreateLanguage')]
#[Description('Register a language (admin role only). It immediately joins every translations payload and the site language switcher.')]
class CreateLanguageTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardLanguageController::class;

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
            'code' => $schema->string()->description('ISO-style language code, unique (e.g. "ps", "en").')->required(),
            'name' => $schema->string()->description('Display name; defaults to the code.'),
            'dir' => $schema->string()->enum(['ltr', 'rtl'])->description('Text direction.'),
            'sort_order' => $schema->integer()->description('Position in the language switcher.'),
        ];
    }
}
