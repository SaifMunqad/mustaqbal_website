<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;

#[Name('ShowPost')]
#[IsReadOnly]
#[Description('Read a single post.')]
class ShowPostTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardPostController::class;

    protected string $action = 'show';

    protected string $verb = 'GET';

    /** @var array<int, string> */
    protected array $models = ['post'];

    /**
     * @return array<string, \Illuminate\JsonSchema\Types\Type>
     */
    public function schema(\Illuminate\Contracts\JsonSchema\JsonSchema $schema): array
    {
        return [
            'post' => $schema->integer()->description('The post id.')->required(),
        ];
    }
}
