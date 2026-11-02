<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Enums\SectionType;
use App\Mcp\Support\PageSectionEditor;
use App\Support\Home\BuilderPages;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Tool;

#[Name('AddPageSection')]
#[Description('Add one block to a builder page (home, about or contact) without resending the whole layout. Choose a section_type from the available section types; set the same value in section.section_type. The section object uses the same fields GetPageLayout returns per section (section_type required; optional zone, is_active, limit, columns, image_path, cta_url, tone, spans, config, translations per language code, items, lists).')]
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
            'section_type' => $schema->string()->enum(SectionType::values())->description('Type of section to add. When provided, this overrides section.section_type.'),
            'section' => $schema->object()->description('The new block, shaped like a GetPageLayout section. Its section_type must match the top-level section_type choice.')->required(),
            'position' => $schema->integer()->description('Zero-based insertion index; appends to the end when omitted.'),
        ];
    }

    public function handle(Request $request): Response|ResponseFactory
    {
        $validated = $request->validate([
            'page' => ['nullable', 'string'],
            'section_type' => ['nullable', 'string', 'in:'.implode(',', SectionType::values())],
            'section' => ['required', 'array'],
            'position' => ['nullable', 'integer', 'min:0'],
        ]);

        $sectionType = $validated['section_type'] ?? $validated['section']['section_type'] ?? null;

        if (! is_string($sectionType) || ! in_array($sectionType, SectionType::values(), true)) {
            return Response::error('A valid "section_type" is required. Choose one from the section_type field or provide section.section_type.');
        }

        return $this->editor->add(
            $validated['page'] ?? BuilderPages::default(),
            array_merge($validated['section'], ['section_type' => $sectionType]),
            isset($validated['position']) ? (int) $validated['position'] : null,
        );
    }
}
