<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Support\Home\BuilderPages;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('UpdatePageLayout')]
#[Description('Upsert sections on any builder page (home, about or contact) using the same fields GetPageLayout returns per section. Sections you do not mention are KEPT in place (merged after the submitted ones) — a partial save can never delete content. Pass remove_missing=true only to intentionally replace the whole layout, where omitted sections are deleted. For editing one block prefer AddPageSection/UpdatePageSection/RemovePageSection/ReorderPageSections.')]
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
            'sections' => $schema->array()->items($schema->object())->description('Ordered array of section objects, matching GetPageLayout. These are inserted at the front in this order; unsubmitted existing sections are kept behind them.')->required(),
            'expected_revision' => $schema->string()->description('The page.revision stamp from GetPageLayout. When sent, the save is refused if the layout changed since it was read (optimistic lock). Section-level tools always send it.'),
            'remove_missing' => $schema->boolean()->description('DESTRUCTIVE: set true to replace the whole layout, deleting every existing section not present in sections. Default false keeps them.'),
        ];
    }
}
