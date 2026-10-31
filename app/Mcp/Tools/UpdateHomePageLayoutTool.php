<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('UpdateHomePageLayout')]
#[Description('Replace the complete home page layout. Pass sections as an ordered array using the same fields returned by GetHomePageLayout; omitted sections are removed.')]
class UpdateHomePageLayoutTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardPageBuilderController::class;

    protected string $action = 'save';

    protected string $verb = 'PUT';

    /** @return array<string, \Illuminate\JsonSchema\Types\Type> */
    public function schema(\Illuminate\Contracts\JsonSchema\JsonSchema $schema): array
    {
        return [
            'sections' => $schema->array()->items($schema->object())->description('Complete ordered array of home page section objects, matching GetHomePageLayout.')->required(),
        ];
    }
}