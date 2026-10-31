<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Mcp\Support\PageSectionEditor;
use App\Support\Home\BuilderPages;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Tool;

#[Name('ReorderPageSections')]
#[Description('Reorder the blocks on a builder page by passing section ids in the desired order. Ids you omit keep their relative order at the end, so nothing is ever dropped.')]
class ReorderPageSectionsTool extends Tool
{
    public function __construct(private readonly PageSectionEditor $editor) {}

    /**
     * @return array<string, \Illuminate\JsonSchema\Types\Type>
     */
    public function schema(\Illuminate\Contracts\JsonSchema\JsonSchema $schema): array
    {
        return [
            'page' => $schema->string()->enum(BuilderPages::keys())->description('Builder page key. Defaults to home.'),
            'ids' => $schema->array()->items($schema->integer())->description('Section ids in the desired display order.')->required(),
        ];
    }

    public function handle(Request $request): Response|ResponseFactory
    {
        $validated = $request->validate([
            'page' => ['nullable', 'string'],
            'ids' => ['required', 'array'],
            'ids.*' => ['required', 'integer', 'min:1'],
        ]);

        return $this->editor->reorder(
            $validated['page'] ?? BuilderPages::default(),
            $validated['ids'],
        );
    }
}
