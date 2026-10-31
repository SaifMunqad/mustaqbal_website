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

#[Name('UpdatePageSection')]
#[Description('Patch one block on a builder page by section id, leaving every field you do not mention untouched. Scalars overwrite; translations merge per language code and field; items/lists replace when provided.')]
class UpdatePageSectionTool extends Tool
{
    public function __construct(private readonly PageSectionEditor $editor) {}

    /**
     * @return array<string, \Illuminate\JsonSchema\Types\Type>
     */
    public function schema(\Illuminate\Contracts\JsonSchema\JsonSchema $schema): array
    {
        return [
            'page' => $schema->string()->enum(BuilderPages::keys())->description('Builder page key. Defaults to home.'),
            'id' => $schema->integer()->description('The existing section id (from GetPageLayout).')->required(),
            'patch' => $schema->object()->description('Fields to change on the section.')->required(),
        ];
    }

    public function handle(Request $request): Response|ResponseFactory
    {
        $validated = $request->validate([
            'page' => ['nullable', 'string'],
            'id' => ['required', 'integer', 'min:1'],
            'patch' => ['required', 'array'],
        ]);

        return $this->editor->update(
            $validated['page'] ?? BuilderPages::default(),
            (int) $validated['id'],
            $validated['patch'],
        );
    }
}
