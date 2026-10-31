<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Enums\EventAudience;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('CreateEvent')]
#[Description('Create an event. Text lives in "translations" per active language code (title is required for the default language); media fields take /storage URLs from UploadMedia.')]
class CreateEventTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardEventController::class;

    protected string $action = 'store';

    protected string $verb = 'POST';

    /** @var array<int, string> */
    protected array $models = [];

    /**
     * @return array<string, \Illuminate\JsonSchema\Types\Type>
     */
    public function schema(\Illuminate\Contracts\JsonSchema\JsonSchema $schema): array
    {
        return [
            'start_at' => $schema->string()->description('Event start (any date/time the dashboard accepts).')->required(),
            'end_at' => $schema->string()->description('Optional end; must not precede start_at.'),
            'audience' => $schema->string()->enum(EventAudience::values())->description('Who the event targets.')->required(),
            'is_published' => $schema->boolean()->description('Publish immediately (default follows the dashboard).'),
            'is_cancelled' => $schema->boolean()->description('Flag the event as cancelled.'),
            'cover_image' => $schema->string()->description('Cover image URL, e.g. /storage/uploads/… from UploadMedia.'),
            'images' => $schema->array()->items($schema->string())->description('Gallery image URLs.'),
            'translations' => $schema->object()->description('Language code => {title, excerpt, body, location}. title is required for the default language.'),
        ];
    }
}
