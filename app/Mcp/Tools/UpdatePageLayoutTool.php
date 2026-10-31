<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Support\Home\BuilderPages;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('UpdatePageLayout')]
#[Description('Replace the complete layout of any builder page (home, about or contact). Pass sections as an ordered array using the same fields returned by GetPageLayout; omitted sections are removed. For editing one block prefer AddPageSection/UpdatePageSection/RemovePageSection/ReorderPageSections.')]
class UpdatePageLayoutTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardPageBuilderController::class;

    protected string $action = 'save';

    protected string $verb = 'PUT';

    /** @return array<string, \Illuminate\JsonSchema\Types\Type> */
    public function schema(\Illuminate\Contracts\JsonSchema\JsonSchema $schema): array
    {
        return [
            'page' => $schema->string()->enum(BuilderPages::keys())->description('Builder page key: home, about or contact. Defaults to home.'),
            'sections' => $schema->array()->items($schema->object())->description('Complete ordered array of section objects, matching GetPageLayout.')->required(),
            'expected_revision' => $schema->string()->description('The page.revision stamp from GetPageLayout. When sent, the save is refused if the layout changed since it was read (optimistic lock). Section-level tools always send it.'),
        ];
    }
}
