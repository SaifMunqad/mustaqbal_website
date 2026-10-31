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

#[Name('AddPageSection')]
#[Description('Add one block to a builder page (home, about or contact) without resending the whole layout. The section object uses the same fields GetPageLayout returns per section (section_type required; optional zone, is_active, limit, columns, image_path, cta_url, tone, spans, config, translations per language code, items, lists).')]
class AddPageSectionTool extends Tool
{
    public function __construct(private readonly PageSectionEditor $editor) {}

    /**
     * @return array<string, \Illuminate\JsonSchema\Types\Type>
     */
    public function schema(\Illuminate\Contracts\JsonSchema\JsonSchema $schema): array
    {
        return [
            'page' => $schema->string()->enum(BuilderPages::keys())->description('Builder page key. Defaults to home.'),
            'section' => $schema->object()->description('The new block, shaped like a GetPageLayout section.')->required(),
            'position' => $schema->integer()->description('Zero-based insertion index; appends to the end when omitted.'),
        ];
    }

    public function handle(Request $request): Response|ResponseFactory
    {
        $validated = $request->validate([
            'page' => ['nullable', 'string'],
            'section' => ['required', 'array'],
            'position' => ['nullable', 'integer', 'min:0'],
        ]);

        return $this->editor->add(
            $validated['page'] ?? BuilderPages::default(),
            $validated['section'],
            isset($validated['position']) ? (int) $validated['position'] : null,
        );
    }
}
