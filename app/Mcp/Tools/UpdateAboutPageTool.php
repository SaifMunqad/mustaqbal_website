<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('UpdateAboutPage')]
#[Description('Publish or unpublish the public About page. This only flips publication; the content itself lives in the page builder (GetPageLayout/section tools with page "about").')]
class UpdateAboutPageTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardAboutController::class;

    protected string $action = 'update';

    protected string $verb = 'PUT';

    /**
     * @return array<string, \Illuminate\JsonSchema\Types\Type>
     */
    public function schema(\Illuminate\Contracts\JsonSchema\JsonSchema $schema): array
    {
        return [
            'is_published' => $schema->boolean()->description('Whether the About page is publicly visible.')->required(),
        ];
    }
}
