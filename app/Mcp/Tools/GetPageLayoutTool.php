<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Support\Home\BuilderPages;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;

#[Name('GetPageLayout')]
#[IsReadOnly]
#[Description('Read the editable visual layout of any builder page (home, about or contact). Returns ordered sections with raw per-language translations, ordered items and localized list rows, plus the block palette, categories and availableItems for the page.')]
class GetPageLayoutTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardPageBuilderController::class;

    protected string $action = 'visual';

    protected string $verb = 'GET';

    /**
     * @return array<string, \Illuminate\JsonSchema\Types\Type>
     */
    public function schema(\Illuminate\Contracts\JsonSchema\JsonSchema $schema): array
    {
        return [
            'page' => $schema->string()->enum(BuilderPages::keys())->description('Builder page key: home, about or contact. Defaults to home.'),
        ];
    }
}
