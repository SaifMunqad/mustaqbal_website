<?php

declare(strict_types=1);

namespace App\Mcp\Support;

use App\Enums\SectionType;
use App\Http\Controllers\Dashboard\DashboardPageBuilderController;
use App\Support\Home\BuilderPages;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response as McpResponse;
use Laravel\Mcp\ResponseFactory;

/**
 * Section-level editing on top of the unified page builder, for MCP tools that
 * must not force the caller to resend an entire layout.
 *
 * Every operation is a read-modify-write through the *same* controller actions
 * the visual editor uses — {@see DashboardPageBuilderController::visual()} to
 * fetch the current fallback-free draft and ::save() (via PageLayoutWriter) to
 * commit it — so validation, translation and ordering rules stay in exactly one
 * place. This class only computes the new draft; it never touches models.
 */
class PageSectionEditor
{
    public function __construct(private readonly DashboardDispatcher $dispatcher) {}

    /**
     * Append (or insert) one authored block on a builder page.
     *
     * @param  array<string, mixed>  $section  draft-shaped section fields (section_type required)
     */
    public function add(string $page, array $section, ?int $position = null): McpResponse|ResponseFactory
    {
        $read = $this->read($page);

        if (! is_array($read)) {
            return $read;
        }

        if (! isset($section['section_type']) || ! in_array($section['section_type'], SectionType::values(), true)) {
            return McpResponse::error('A valid "section_type" is required. Use GetPageLayout and read "categories" to see the available block types.');
        }

        $sections = $read['sections'] ?? [];
        $sections[] = $this->newSection($section);

        if ($position !== null) {
            $moved = array_splice($sections, count($sections) - 1, 1);
            array_splice($sections, max(0, min($position, count($sections))), 0, $moved);
        }

        // Merge-mode commit without the page lock: a sibling edit since the
        // read cannot destroy anything here (unknown blocks are kept), so
        // failing an append because someone else added a block elsewhere
        // would be false friction.
        return $this->commit($page, $sections, $read, withRevision: false);
    }

    /**
     * Patch one existing block: scalar fields overwrite, translations merge per
     * language and field, items/lists replace when provided.
     *
     * @param  array<string, mixed>  $patch
     */
    public function update(string $page, int $id, array $patch): McpResponse|ResponseFactory
    {
        $read = $this->read($page);

        if (! is_array($read)) {
            return $read;
        }

        $sections = $read['sections'] ?? [];
        $index = $this->indexOf($sections, $id);

        if ($index === null) {
            return McpResponse::error("No section with id {$id} exists on page [{$page}]. Use GetPageLayout to list sections.");
        }

        $sections[$index] = $this->mergeSection($sections[$index], $patch);

        // The revision stays required here: the patch was computed against the
        // block as read, so a concurrent edit of the same block must fail
        // rather than silently win last-write.
        return $this->commit($page, $sections, $read);
    }

    /** Remove one block and everything authored on it. */
    public function remove(string $page, int $id): McpResponse|ResponseFactory
    {
        $read = $this->read($page);

        if (! is_array($read)) {
            return $read;
        }

        $sections = $read['sections'] ?? [];
        $index = $this->indexOf($sections, $id);

        if ($index === null) {
            return McpResponse::error("No section with id {$id} exists on page [{$page}]. Use GetPageLayout to list sections.");
        }

        array_splice($sections, $index, 1);

        // The only catalogued operation that deletes: prune is intentional
        // here, and the read revision makes a concurrent sibling edit fail
        // instead of silently dropping their block.
        return $this->commit($page, array_values($sections), $read, true);
    }

    /**
     * Reorder existing blocks. Ids not listed keep their relative order at the
     * end, so a partial order never silently deletes content.
     *
     * @param  array<int, int>  $ids
     */
    public function reorder(string $page, array $ids): McpResponse|ResponseFactory
    {
        $read = $this->read($page);

        if (! is_array($read)) {
            return $read;
        }

        $sections = $read['sections'] ?? [];
        $byKey = [];

        foreach ($sections as $section) {
            $byKey[(int) $section['id']] = $section;
        }

        $ordered = [];

        foreach ($ids as $id) {
            $id = (int) $id;

            if (! isset($byKey[$id])) {
                return McpResponse::error("Section id {$id} does not exist on page [{$page}]. Use GetPageLayout to list sections.");
            }

            $ordered[] = $byKey[$id];
            unset($byKey[$id]);
        }

        // Unlisted sections follow in their original relative order — a reorder
        // can never drop a block the caller forgot to mention.
        foreach ($sections as $section) {
            if (isset($byKey[(int) $section['id']])) {
                $ordered[] = $section;
            }
        }

        return $this->commit($page, $ordered, $read, withRevision: false);
    }

    /** Read the page's current draft through the builder controller itself. */
    private function read(string $page): array|McpResponse|ResponseFactory
    {
        if (! BuilderPages::has($page)) {
            return McpResponse::error("Unknown builder page [{$page}]. Choose one of: ".implode(', ', BuilderPages::keys()).'.');
        }

        $props = $this->dispatcher->props(
            new Request(['page' => $page]),
            DashboardPageBuilderController::class,
            'visual',
        );

        // A non-array result is already a translated MCP error (permissions,
        // validation, missing page); hand it to the caller unchanged.
        if (! is_array($props)) {
            return $props;
        }

        if (! array_key_exists('sections', $props)) {
            return McpResponse::error('The builder layout could not be read.');
        }

        return $props;
    }

    /**
     * Commit a complete draft through the builder controller's save action.
     *
     * Merge mode (the default) makes an omitted sibling block impossible to
     * destroy, so only operations whose result depends on the exact state
     * read — a same-block patch, or an intentional delete — send the revision
     * stamp; the rest avoid spurious "layout changed" retries for agents.
     *
     * @param  array<string, mixed>  $read  the props the draft was read from
     */
    private function commit(string $page, array $sections, array $read, bool $removeMissing = false, bool $withRevision = true): McpResponse|ResponseFactory
    {
        $revision = $read['page']['revision'] ?? null;

        return $this->dispatcher->run(
            new Request(array_filter([
                'page' => $page,
                'sections' => $sections,
                'expected_revision' => $withRevision && is_string($revision) ? $revision : null,
                'remove_missing' => $removeMissing ? true : null,
            ], static fn (mixed $v): bool => $v !== null)),
            DashboardPageBuilderController::class,
            'save',
            'PUT',
        );
    }

    /**
     * Turn tool arguments into a draft-shaped section. Display-only keys are
     * absent because the save request filters to validated fields anyway; the
     * writer treats a missing id as "create".
     *
     * @param  array<string, mixed>  $input
     * @return array<string, mixed>
     */
    private function newSection(array $input): array
    {
        return [
            'id' => null,
            'section_type' => $input['section_type'],
            'zone' => $input['zone'] ?? null,
            'is_active' => (bool) ($input['is_active'] ?? true),
            'limit' => $input['limit'] ?? null,
            'columns' => $input['columns'] ?? null,
            'image_path' => (string) ($input['image_path'] ?? ''),
            'cta_url' => (string) ($input['cta_url'] ?? ''),
            'tone' => $input['tone'] ?? null,
            'span_lg' => $input['span_lg'] ?? null,
            'span_md' => $input['span_md'] ?? null,
            'span_sm' => $input['span_sm'] ?? null,
            'config' => $input['config'] ?? [],
            'translations' => $input['translations'] ?? [],
            'items' => $input['items'] ?? [],
            'lists' => $input['lists'] ?? [],
        ];
    }

    /**
     * Overlay a patch on one draft section, keeping every field the patch does
     * not mention exactly as authored.
     *
     * @param  array<string, mixed>  $section
     * @param  array<string, mixed>  $patch
     * @return array<string, mixed>
     */
    private function mergeSection(array $section, array $patch): array
    {
        foreach (['zone', 'is_active', 'limit', 'columns', 'image_path', 'cta_url', 'tone', 'span_lg', 'span_md', 'span_sm', 'config', 'items', 'lists'] as $field) {
            if (array_key_exists($field, $patch)) {
                $section[$field] = $patch[$field];
            }
        }

        if (isset($patch['translations']) && is_array($patch['translations'])) {
            foreach ($patch['translations'] as $code => $fields) {
                foreach ((array) $fields as $key => $value) {
                    $section['translations'][$code][$key] = (string) $value;
                }
            }
        }

        return $section;
    }

    /**
     * @param  array<int, array<string, mixed>>  $sections
     */
    private function indexOf(array $sections, int $id): ?int
    {
        foreach ($sections as $index => $section) {
            if ((int) ($section['id'] ?? 0) === $id) {
                return $index;
            }
        }

        return null;
    }
}
