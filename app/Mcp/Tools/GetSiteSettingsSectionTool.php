<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Http\Requests\Dashboard\UpdateSiteSettingRequest;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Tool;
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;

#[Name('GetSiteSettingsSection')]
#[IsReadOnly]
#[Description('Read values for one site settings group only. Use GetSiteSettings first for valid group names; pass the group to EditSiteSettings to change only that group.')]
class GetSiteSettingsSectionTool extends Tool
{
    public function __construct(private readonly \App\Mcp\Support\DashboardDispatcher $dispatcher) {}

    /** @return array<string, \Illuminate\JsonSchema\Types\Type> */
    public function schema(\Illuminate\Contracts\JsonSchema\JsonSchema $schema): array
    {
        return [
            'section' => $schema->string()->enum(array_keys(UpdateSiteSettingRequest::SECTIONS))->required()->description('Settings group: identity, appearance, contact or social.'),
        ];
    }

    public function handle(Request $request): Response|ResponseFactory
    {
        $validated = $request->validate(['section' => ['required', 'string', 'in:'.implode(',', array_keys(UpdateSiteSettingRequest::SECTIONS))]]);
        $section = $validated['section'];
        $props = $this->dispatcher->props($request, \App\Http\Controllers\Dashboard\DashboardSiteSettingController::class, 'edit');

        if (! is_array($props)) {
            return $props;
        }

        $fields = UpdateSiteSettingRequest::SECTIONS[$section];
        $localized = array_intersect($fields, UpdateSiteSettingRequest::LOCALIZED);
        $settings = array_intersect_key((array) ($props['settings'] ?? []), array_flip($fields));
        $translations = [];
        foreach (($props['translations'] ?? []) as $language => $values) {
            $translations[$language] = array_intersect_key((array) $values, array_flip($localized));
        }

        return Response::structured(['section' => $section, 'fields' => $settings, 'translations' => $translations]);
    }
}