<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Support\Home\BuilderPages;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Tool;
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;

#[Name('ListBuilderPages')]
#[IsReadOnly]
#[Description('List the visual page-builder pages an agent can read and edit (key, label). Pass the key to GetPageLayout/UpdatePageLayout and the section-level tools.')]
class ListBuilderPagesTool extends Tool
{
    public function handle(Request $request): Response|ResponseFactory
    {
        return Response::structured([
            'pages' => array_map(fn (string $key): array => [
                'key' => $key,
                'label' => BuilderPages::label($key),
            ], BuilderPages::keys()),
        ]);
    }
}
