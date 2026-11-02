<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Support\Home\BuilderPages;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;

#[Name('GetPageLayout')]
#[IsReadOnly]
#[Description('Get a compact structural overview of one builder page. Returns ordered section positions, IDs, types, labels, zones and active status only. Use GetPageSection for one section’s values, EditPageSection to change it, or AddPageSection to add one; do not load the full page to make a focused edit.')]
class GetPageLayoutTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardPageBuilderController::class;

    protected string $action = 'visual';

    protected string $verb = 'GET';

    public function handle(Request $request): Response|ResponseFactory
    {
        $page = $request->all()['page'] ?? BuilderPages::default();
        $props = $this->dispatcher->props($request, $this->controller, $this->action);

        if (! is_array($props)) {
            return $props;
        }

        return Response::structured([
            'page' => array_intersect_key($props['page'] ?? ['key' => $page], array_flip(['key', 'label'])),
            'sections' => array_map(static fn (int $position, array $section): array => [
                'position' => $position,
                'id' => $section['id'],
                'section_type' => $section['section_type'],
                'type_label' => $section['type_label'],
                'zone' => $section['zone'],
                'is_active' => $section['is_active'],
            ], array_keys($props['sections'] ?? []), $props['sections'] ?? []),
        ]);
    }

    /**
     * @return array<string, \Illuminate\JsonSchema\Types\Type>
     */
    public function schema(\Illuminate\Contracts\JsonSchema\JsonSchema $schema): array
    {
        return [
            'page' => $schema->string()->enum(BuilderPages::keys())->description('Builder page key: home, about or contact. Defaults to home.'),
        ];
    }
}
