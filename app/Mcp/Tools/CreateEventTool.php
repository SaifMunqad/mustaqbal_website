<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Enums\EventAudience;
use App\Models\Language;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('CreateEvent')]
#[Description('Create an event. You can pass title, location, description/body, and start_at directly, or provide localized text in "translations".')]
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
            'title' => $schema->string()->description('Event title (e.g. "Annual Science Fair").'),
            'location' => $schema->string()->description('Event location or venue.'),
            'description' => $schema->string()->description('Event description or details.'),
            'body' => $schema->string()->description('Full body text (alias for description).'),
            'excerpt' => $schema->string()->description('Short summary for listings.'),
            'start_at' => $schema->string()->description('Event start date/time (e.g. "2026-11-20 09:00:00" or ISO-8601).')->required(),
            'end_at' => $schema->string()->description('Optional event end date/time; must not precede start_at.'),
            'audience' => $schema->string()->enum(EventAudience::values())->description('Target audience: public, families, teachers (default: public).'),
            'is_published' => $schema->boolean()->description('Publish immediately (default: true).'),
            'is_cancelled' => $schema->boolean()->description('Flag the event as cancelled (default: false).'),
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
        $defaultCode = Language::defaultCode();
        $translations = is_array($args['translations'] ?? null) ? $args['translations'] : [];

        // If translations exist but defaultCode is missing, borrow from the first available translation
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

        // Propagate to all active languages so single-language submissions are visible
        $activeCodes = collect(Language::activeList())->pluck('code')->all();
        foreach ($activeCodes as $code) {
            if (! isset($translations[$code]) || ! is_array($translations[$code])) {
                $translations[$code] = $translations[$defaultCode];
            } elseif (empty($translations[$code]['title']) && ! empty($translations[$defaultCode]['title'])) {
                $translations[$code]['title'] = $translations[$defaultCode]['title'];
            }
        }

        // Normalize audience (accept common aliases like students/all/parents)
        $validAudiences = EventAudience::values();
        $audience = $args['audience'] ?? null;
        if (! in_array($audience, $validAudiences, true)) {
            $args['audience'] = match (strtolower((string) $audience)) {
                'families', 'family', 'parents' => EventAudience::Families->value,
                'teachers', 'staff', 'faculty' => EventAudience::Teachers->value,
                default => EventAudience::Public->value,
            };
        }

        // Default is_published to true if omitted
        if (! array_key_exists('is_published', $args)) {
            $args['is_published'] = true;
        }

        $args['translations'] = $translations;

        return $args;
    }
}
