<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;

#[Name('ShowArticle')]
#[IsReadOnly]
#[Description('Read a single article with its body and author.')]
class ShowArticleTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardArticleController::class;

    protected string $action = 'show';

    protected string $verb = 'GET';

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
