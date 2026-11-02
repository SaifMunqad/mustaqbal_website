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
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;

#[Name('GetPageSection')]
#[IsReadOnly]
#[Description('Get one section from a builder page by its zero-based position and section_type. Call GetPageLayout first to see the current ordered positions and section types. Returns the selected section including its raw per-language translations, settings, items and list rows.')]
class GetPageSectionTool extends Tool
{
    public function __construct(private readonly PageSectionEditor $editor) {}

    /**
     * @return array<string, \Illuminate\JsonSchema\Types\Type>
     */
    public function schema(\Illuminate\Contracts\JsonSchema\JsonSchema $schema): array
    {
        return [
            'page' => $schema->string()->enum(BuilderPages::keys())->description('Builder page key. Defaults to home.'),
            'position' => $schema->integer()->description('Zero-based position from the ordered sections returned by GetPageLayout.')->required(),
            'section_type' => $schema->string()->description('Exact machine section_type shown at this position in GetPageLayout; prevents reading the wrong block if the order changed.')->required(),
        ];
    }

    public function handle(Request $request): Response|ResponseFactory
    {
        $validated = $request->validate([
            'page' => ['nullable', 'string'],
            'position' => ['required', 'integer', 'min:0'],
            'section_type' => ['required', 'string'],
        ]);

        return $this->editor->getAtPosition(
            $validated['page'] ?? BuilderPages::default(),
            (int) $validated['position'],
            $validated['section_type'],
        );
    }
}
