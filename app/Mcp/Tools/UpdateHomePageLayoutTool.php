<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('UpdateHomePageLayout')]
#[Description('Upsert the home page layout. Pass sections as an ordered array using the same fields returned by GetHomePageLayout; sections you omit are KEPT (merged behind the submitted ones) unless you explicitly pass remove_missing=true, which replaces the whole layout and deletes omitted sections. Prefer UpdatePageLayout with page "home" instead.')]
class UpdateHomePageLayoutTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardPageBuilderController::class;

    protected string $action = 'save';

    protected string $verb = 'PUT';

    /** @return array<string, \Illuminate\JsonSchema\Types\Type> */
    public function schema(\Illuminate\Contracts\JsonSchema\JsonSchema $schema): array
    {
        return [
            'sections' => $schema->array()->items($schema->object())->description('Ordered array of home page section objects, matching GetHomePageLayout.')->required(),
            'remove_missing' => $schema->boolean()->description('DESTRUCTIVE: true deletes existing sections omitted from sections. Default false keeps them.'),
        ];
    }
}
