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

#[Name('EditPageSection')]
#[Description('Edit a builder page section selected by its zero-based position and exact displayed section name. For translated text, provide translations as language code => fields, allowing multiple languages in one call; alternatively use the legacy language, field and value arguments for a single translation. Only supplied fields are changed.')]
class EditPageSectionTool extends Tool
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
            'section_name' => $schema->string()->description('Exact section name/type_label shown at this position in GetPageLayout; prevents editing the wrong block if the order changed.')->required(),
            'field' => $schema->string()->description('Optional for multi-language edits; otherwise the single section or translation field to change, such as tone or heading.'),
            'value' => $schema->string()->description('New value for the selected field; use with language for one translated field.'),
            'language' => $schema->string()->description('Language code for a translated field, for example en. Required for title, heading, body and cta_label.'),
            'translations' => $schema->object()->description('Optional multiple translations: language code => {title, heading, body, cta_label}. Only supplied language fields are changed.'),
        ];
    }

    public function handle(Request $request): Response|ResponseFactory
    {
        $validated = $request->validate([
            'page' => ['nullable', 'string'],
            'position' => ['required', 'integer', 'min:0'],
            'section_name' => ['required', 'string'],
            'field' => ['nullable', 'string'],
            'value' => ['nullable', 'string'],
            'language' => ['nullable', 'string'],
            'translations' => ['nullable', 'array'],
            'translations.*' => ['array'],
            'translations.*.*' => ['string'],
        ]);

        $translationFields = ['title', 'heading', 'body', 'cta_label'];
        $patch = [];

        if (isset($validated['translations'])) {
            foreach ($validated['translations'] as $language => $fields) {
                $unsupportedFields = array_diff(array_keys($fields), $translationFields);

                if ($unsupportedFields !== []) {
                    return Response::error('Unsupported translated fields: '.implode(', ', $unsupportedFields).'. Use: '.implode(', ', $translationFields).'.');
                }

                $patch['translations'][$language] = $fields;
            }
        }

        $field = $validated['field'] ?? null;

        if ($field !== null && in_array($field, $translationFields, true)) {
            if (empty($validated['language'])) {
                return Response::error('A language code is required when editing a translated field.');
            }

            if (! isset($validated['value'])) {
                return Response::error('A value is required when editing a translated field.');
            }

            $patch['translations'][$validated['language']][$field] = $validated['value'];
        } elseif ($field !== null && in_array($field, ['zone', 'is_active', 'limit', 'columns', 'image_path', 'cta_url', 'tone', 'span_lg', 'span_md', 'span_sm'], true)) {
            if (! isset($validated['value'])) {
                return Response::error('A value is required when editing a section field.');
            }

            $value = match ($field) {
                'is_active' => filter_var($validated['value'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE),
                'limit', 'columns', 'span_lg', 'span_md', 'span_sm' => filter_var($validated['value'], FILTER_VALIDATE_INT, FILTER_NULL_ON_FAILURE),
                default => $validated['value'],
            };

            if ($value === null && in_array($field, ['is_active', 'limit', 'columns', 'span_lg', 'span_md', 'span_sm'], true)) {
                return Response::error("The value for [{$field}] must be a valid ".($field === 'is_active' ? 'boolean' : 'integer').'.');
            }

            $patch[$field] = $value;
        } elseif ($field !== null) {
            return Response::error('Unsupported field. Use a section scalar field or one of: '.implode(', ', $translationFields).'.');
        }

        if ($patch === []) {
            return Response::error('Provide translations or a field/value pair to edit.');
        }

        return $this->editor->updateAtPosition(
            $validated['page'] ?? BuilderPages::default(),
            (int) $validated['position'],
            $validated['section_name'],
            $patch,
        );
    }
}
