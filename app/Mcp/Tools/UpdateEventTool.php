<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Enums\EventAudience;
use App\Models\Event;
use App\Models\Language;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('UpdateEvent')]
#[Description('Update an event. You can pass title, location, description/body, start_at, and audience directly, or provide localized text in "translations".')]
class UpdateEventTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardEventController::class;

    protected string $action = 'update';

    protected string $verb = 'PUT';

    /** @var array<int, string> */
    protected array $models = ['event'];

    /**
     * @return array<string, \Illuminate\JsonSchema\Types\Type>
     */
    public function schema(\Illuminate\Contracts\JsonSchema\JsonSchema $schema): array
    {
        return [
            'event' => $schema->integer()->description('The event id.')->required(),
            'title' => $schema->string()->description('Event title.'),
            'location' => $schema->string()->description('Event location or venue.'),
            'description' => $schema->string()->description('Event description or details.'),
            'body' => $schema->string()->description('Full body text (alias for description).'),
            'excerpt' => $schema->string()->description('Short summary for listings.'),
            'start_at' => $schema->string()->description('Event start date/time (e.g. "2026-11-20 09:00:00" or ISO-8601).'),
            'end_at' => $schema->string()->description('Optional event end date/time; must not precede start_at.'),
            'audience' => $schema->string()->enum(EventAudience::values())->description('Target audience: public, families, teachers.'),
            'is_published' => $schema->boolean()->description('Publish status.'),
            'is_cancelled' => $schema->boolean()->description('Flag the event as cancelled.'),
            'cover_image' => $schema->string()->description('Cover image URL, e.g. /storage/uploads/… from UploadMedia.'),
            'images' => $schema->array()->items($schema->string())->description('Gallery image URLs.'),
            'translations' => $schema->object()->description('Optional language-specific translations: code => {title, excerpt, body, location}.'),
        ];
    }

    public function handle(Request $request): Response|ResponseFactory
    {
        $args = $this->normalizePayload($request->all());

        return $this->dispatcher->run(new Request($args), $this->controller, $this->action, $this->verb, $this->models);
    }

    /**
     * @param  array<string, mixed>  $args
     * @return array<string, mixed>
     */
    protected function normalizePayload(array $args): array
    {
        $eventId = $args['event'] ?? null;
        $existing = is_numeric($eventId) ? Event::with('translations.language')->find((int) $eventId) : null;

        $translations = is_array($args['translations'] ?? null) ? $args['translations'] : [];

        if ($existing) {
            if (! isset($args['start_at']) && $existing->start_at) {
                $args['start_at'] = $existing->start_at->format('Y-m-d H:i:s');
            }
            if (! isset($args['audience']) && $existing->audience) {
                $args['audience'] = $existing->audience->value;
            }
            if (! isset($args['end_at']) && $existing->end_at) {
                $args['end_at'] = $existing->end_at->format('Y-m-d H:i:s');
            }
            if (! array_key_exists('is_published', $args)) {
                $args['is_published'] = (bool) $existing->is_published;
            }
            if (! array_key_exists('is_cancelled', $args)) {
                $args['is_cancelled'] = (bool) $existing->is_cancelled;
            }
            if (! array_key_exists('cover_image', $args)) {
                $args['cover_image'] = $existing->cover_image;
            }
            if (! array_key_exists('images', $args) && is_array($existing->images)) {
                $args['images'] = $existing->images;
            }

            foreach ($existing->translations as $t) {
                if ($t->language && ! isset($translations[$t->language->code])) {
                    $translations[$t->language->code] = [
                        'title' => (string) $t->title,
                        'excerpt' => (string) $t->excerpt,
                        'body' => (string) $t->body,
                        'location' => (string) $t->location,
                    ];
                }
            }
        }

        $defaultCode = Language::defaultCode();

        if (! isset($translations[$defaultCode]) && ! empty($translations)) {
            $firstLang = reset($translations);
            if (is_array($firstLang)) {
                $translations[$defaultCode] = $firstLang;
            }
        }

        if (! isset($translations[$defaultCode]) || ! is_array($translations[$defaultCode])) {
            $translations[$defaultCode] = [];
        }

        if (! empty($args['title'])) {
            $translations[$defaultCode]['title'] = (string) $args['title'];
        }

        if (! empty($args['location'])) {
            $translations[$defaultCode]['location'] = (string) $args['location'];
        }

        if (! empty($args['excerpt'])) {
            $translations[$defaultCode]['excerpt'] = (string) $args['excerpt'];
        }

        $bodyText = $args['body'] ?? $args['description'] ?? null;
        if (! empty($bodyText)) {
            $translations[$defaultCode]['body'] = (string) $bodyText;
        }

        if (isset($args['audience'])) {
            $validAudiences = EventAudience::values();
            if (! in_array($args['audience'], $validAudiences, true)) {
                $args['audience'] = match (strtolower((string) $args['audience'])) {
                    'families', 'family', 'parents' => EventAudience::Families->value,
                    'teachers', 'staff', 'faculty' => EventAudience::Teachers->value,
                    default => EventAudience::Public->value,
                };
            }
        }

        if (! empty($translations[$defaultCode])) {
            $args['translations'] = $translations;
        }

        return $args;
    }
}
