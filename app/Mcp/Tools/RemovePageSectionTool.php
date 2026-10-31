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

#[Name('RemovePageSection')]
#[Description('Delete one block (and its authored content) from a builder page by section id. Other sections are untouched.')]
class RemovePageSectionTool extends Tool
{
    public function __construct(private readonly PageSectionEditor $editor) {}

    /**
     * @return array<string, \Illuminate\JsonSchema\Types\Type>
     */
    public function schema(\Illuminate\Contracts\JsonSchema\JsonSchema $schema): array
    {
        return [
            'page' => $schema->string()->enum(BuilderPages::keys())->description('Builder page key. Defaults to home.'),
            'id' => $schema->integer()->description('The section id to remove (from GetPageLayout).')->required(),
        ];
    }

    public function handle(Request $request): Response|ResponseFactory
    {
        $validated = $request->validate([
            'page' => ['nullable', 'string'],
            'id' => ['required', 'integer', 'min:1'],
        ]);

        return $this->editor->remove(
            $validated['page'] ?? BuilderPages::default(),
            (int) $validated['id'],
        );
    }
}
