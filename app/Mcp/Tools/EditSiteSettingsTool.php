<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Http\Controllers\Dashboard\DashboardSiteSettingController;
use App\Http\Requests\Dashboard\UpdateSiteSettingRequest;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('EditSiteSettings')]
#[Description('Partially edit one site settings group. Provide section as identity, appearance, contact or social, then include only the fields to change; for localized identity text use translations as language code => fields. This does not replace unrelated settings.')]
class EditSiteSettingsTool extends DashboardTool
{
    protected string $controller = DashboardSiteSettingController::class;

    protected string $action = 'update';

    protected string $verb = 'PUT';

    /** @var array<int, string> */
    protected array $models = [];

    /** @return array<string, \Illuminate\JsonSchema\Types\Type> */
    public function schema(\Illuminate\Contracts\JsonSchema\JsonSchema $schema): array
    {
        $fields = [
            'section' => $schema->string()->enum(array_keys(UpdateSiteSettingRequest::SECTIONS))->required()->description('The settings group being edited.'),
            'translations' => $schema->object()->description('Changed localized fields, shaped as language code => {brand_name, brand_short_name, tagline, footer_text}; only valid for identity.'),
        ];

        foreach (array_unique(array_merge(...array_values(UpdateSiteSettingRequest::SECTIONS))) as $field) {
            if (in_array($field, UpdateSiteSettingRequest::LOCALIZED, true)) {
                continue;
            }

            $fields[$field] = in_array($field, ['map_latitude', 'map_longitude', 'map_zoom', 'tint_depth'], true)
                ? $schema->number()->description("New value for {$field}; include only when changing it.")
                : $schema->string()->description("New value for {$field}; include only when changing it.");
        }

        return $fields;
    }
}