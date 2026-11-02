<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;

#[Name('GetSiteSettings')]
#[IsReadOnly]
#[Description('Get a compact overview of site settings groups and their editable field names; values are intentionally omitted. Use GetSiteSettingsSection to inspect one group and EditSiteSettings to change only supplied fields.')]
class GetSiteSettingsTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardSiteSettingController::class;

    protected string $action = 'edit';

    protected string $verb = 'GET';

    /** @var array<int, string> */
    protected array $models = [];

    public function handle(Request $request): Response|ResponseFactory
    {
        $props = $this->dispatcher->props($request, $this->controller, $this->action);

        if (! is_array($props)) {
            return $props;
        }

        return Response::structured([
            'groups' => array_map(static fn (string $name, array $fields): array => [
                'name' => $name,
                'fields' => $fields,
            ], array_keys(\App\Http\Requests\Dashboard\UpdateSiteSettingRequest::SECTIONS), \App\Http\Requests\Dashboard\UpdateSiteSettingRequest::SECTIONS),
        ]);
    }
}
