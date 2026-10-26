<?php

namespace App\Http\Controllers\Dashboard;

use App\Enums\EventAudience;
use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\StoreEventRequest;
use App\Http\Requests\Dashboard\UpdateEventRequest;
use App\Models\Event;
use App\Support\Translation\TranslationPayload;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class DashboardEventController extends Controller
{
    /**
     * @var list<string>
     */
    private const TRANSLATED = ['title', 'excerpt', 'body', 'location'];

    public function index(Request $request): Response
    {
        $events = Event::query()
            ->with(['author:id,name', 'translations.language'])
            ->search($request->string('search')->toString())
            ->orderByDesc('start_at')
            ->paginate(15)
            ->through(fn (Event $event): array => [
                'id' => $event->id,
                'title' => $event->title,
                'start_at' => $event->start_at?->toIso8601String(),
                'audience' => $event->audience?->value,
                'status' => $event->status()->value,
                'is_published' => $event->is_published,
                'is_cancelled' => $event->is_cancelled,
                'author' => $event->author?->name,
            ]);

        return Inertia::render('dashboard/events/dashboard-events-index', [
            'events' => $events,
            'filters' => ['search' => $request->string('search')->toString()],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('dashboard/events/dashboard-events-create', [
            'audienceOptions' => $this->audienceOptions(),
            'canPublish' => request()->user()->can('publish', Event::class),
        ]);
    }

    public function store(StoreEventRequest $request): RedirectResponse
    {
        $payload = TranslationPayload::extract($request, self::TRANSLATED);
        $defaultTitle = TranslationPayload::defaultAttributes($payload)['title'] ?? '';

        $canPublish = $request->user()->can('publish', Event::class);
        $isPublished = $canPublish && ! empty($request->input('is_published'));

        $event = Event::query()->create([
            ...Arr::only($request->only($this->parentFields()), $this->parentFields()),
            'images' => $this->cleanImages((array) $request->input('images', [])),
            'slug' => Str::slug($defaultTitle).'-'.Str::lower(Str::random(4)),
            'user_id' => $request->user()->id,
            'is_published' => $isPublished,
            'is_cancelled' => (bool) $request->input('is_cancelled'),
        ]);

        TranslationPayload::apply($event->translations(), $payload);

        return redirect()
            ->route('dashboard.events.index')
            ->with('success', $canPublish ? 'flash.eventCreated' : 'flash.eventDraft');
    }

    public function edit(Request $request, Event $event): Response
    {
        $this->authorize('update', $event);

        $event->load(['translations.language']);

        return Inertia::render('dashboard/events/dashboard-events-edit', [
            'event' => $event,
            'translations' => $this->existingTranslations($event),
            'audienceOptions' => $this->audienceOptions(),
            'canPublish' => $request->user()->can('publish', Event::class),
            'canDelete' => $request->user()->can('delete', $event),
        ]);
    }

    public function update(UpdateEventRequest $request, Event $event): RedirectResponse
    {
        $canPublish = $request->user()->can('publish', Event::class);

        $event->update([
            ...Arr::only($request->only($this->parentFields()), $this->parentFields()),
            'images' => $this->cleanImages((array) $request->input('images', [])),
            'is_published' => $canPublish ? ! empty($request->input('is_published')) : $event->is_published,
            'is_cancelled' => (bool) $request->input('is_cancelled'),
        ]);

        TranslationPayload::apply($event->translations(), TranslationPayload::extract($request, self::TRANSLATED));

        return redirect()
            ->route('dashboard.events.index')
            ->with('success', 'flash.eventUpdated');
    }

    public function destroy(Request $request, Event $event): RedirectResponse
    {
        $this->authorize('delete', $event);

        $event->delete();

        return redirect()
            ->route('dashboard.events.index')
            ->with('success', 'flash.eventDeleted');
    }

    /**
     * Non-translatable parent columns submitted by the form.
     *
     * @return list<string>
     */
    private function parentFields(): array
    {
        return ['cover_image', 'images', 'start_at', 'end_at', 'audience', 'is_cancelled', 'is_published'];
    }

    /**
     * @return list<array{value: string, label: string, labelKey: string}>
     */
    private function audienceOptions(): array
    {
        return array_map(
            static fn (EventAudience $audience): array => [
                'value' => $audience->value,
                'label' => $audience->label(),
                'labelKey' => $audience->labelKey(),
            ],
            EventAudience::cases(),
        );
    }

    /**
     * @param  array<int, mixed>  $images
     * @return list<string>
     */
    private function cleanImages(array $images): array
    {
        return array_values(array_filter($images, static fn ($image) => filled($image)));
    }

    /**
     * @return array<string, array<string, string>>
     */
    private function existingTranslations(Event $event): array
    {
        return $event->translations
            ->filter(fn ($translation) => $translation->language)
            ->mapWithKeys(fn ($translation): array => [
                $translation->language->code => [
                    'title' => (string) $translation->title,
                    'excerpt' => (string) $translation->excerpt,
                    'body' => (string) $translation->body,
                    'location' => (string) $translation->location,
                ],
            ])
            ->all();
    }
}
