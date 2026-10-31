<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('UpdateArticle')]
#[Description('Update an existing article. Provide the article id plus the fields to change.')]
class UpdateArticleTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardArticleController::class;

    protected string $action = 'update';

    protected string $verb = 'PUT';

    /** @var array<int, string> */
    protected array $models = ['article'];

    /**
     * @return array<string, \Illuminate\JsonSchema\Types\Type>
     */
    public function schema(\Illuminate\Contracts\JsonSchema\JsonSchema $schema): array
    {
        return [
            'article' => $schema->integer()->description('The article id.')->required(),
        ];
    }
}
