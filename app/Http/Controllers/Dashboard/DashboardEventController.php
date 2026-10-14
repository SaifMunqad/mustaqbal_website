<?php

namespace App\Http\Controllers\Dashboard;

use App\Enums\EventAudience;
use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Support\Rules\ImageLocation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DashboardEventController extends Controller
{
    public function index(Request $request): Response
    {
        $events = Event::query()
            ->with('author:id,name')
            ->when($request->string('search')->toString(), function ($query, string $search): void {
                $query->where('title', 'like', "%{$search}%");
            })
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

        return Inertia::render('dashboard/events/index', [
            'events' => $events,
            'filters' => ['search' => $request->string('search')->toString()],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('dashboard/events/create', [
            'audienceOptions' => $this->audienceOptions(),
            'canPublish' => request()->user()->can('publish', Event::class),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Event::class);

        $validated = $this->validateEvent($request);

        $canPublish = $request->user()->can('publish', Event::class);
        $isPublished = $canPublish && ! empty($validated['is_published']);

        Event::query()->create([
            ...$validated,
            'images' => $this->cleanImages($validated['images'] ?? []),
            'slug' => Str::slug($validated['title']).'-'.Str::lower(Str::random(4)),
            'user_id' => $request->user()->id,
            'is_published' => $isPublished,
            'is_cancelled' => (bool) ($validated['is_cancelled'] ?? false),
        ]);

        return redirect()
            ->route('dashboard.events.index')
            ->with('success', $canPublish ? 'Event created.' : 'Event saved as a draft for review.');
    }

    public function edit(Request $request, Event $event): Response
    {
        $this->authorize('update', $event);

        return Inertia::render('dashboard/events/edit', [
            'event' => $event,
            'audienceOptions' => $this->audienceOptions(),
            'canPublish' => $request->user()->can('publish', Event::class),
            'canDelete' => $request->user()->can('delete', $event),
        ]);
    }

    public function update(Request $request, Event $event): RedirectResponse
    {
        $this->authorize('update', $event);

        $validated = $this->validateEvent($request);

        $canPublish = $request->user()->can('publish', Event::class);

        $event->update([
            ...$validated,
            'images' => $this->cleanImages($validated['images'] ?? []),
            'is_published' => $canPublish ? ! empty($validated['is_published']) : $event->is_published,
            'is_cancelled' => (bool) ($validated['is_cancelled'] ?? false),
        ]);

        return redirect()
            ->route('dashboard.events.index')
            ->with('success', 'Event updated.');
    }

    public function destroy(Request $request, Event $event): RedirectResponse
    {
        $this->authorize('delete', $event);

        $event->delete();

        return redirect()
            ->route('dashboard.events.index')
            ->with('success', 'Event deleted.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validateEvent(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'excerpt' => ['nullable', 'string', 'max:1000'],
            'body' => ['nullable', 'string'],
            'cover_image' => ['nullable', new ImageLocation, 'max:2048'],
            'images' => ['nullable', 'array'],
            'images.*' => ['nullable', new ImageLocation, 'max:2048'],
            'location' => ['nullable', 'string', 'max:255'],
            'start_at' => ['required', 'date'],
            'end_at' => ['nullable', 'date', 'after_or_equal:start_at'],
            'audience' => ['required', Rule::in(EventAudience::values())],
            'is_cancelled' => ['nullable', 'boolean'],
            'is_published' => ['nullable', 'boolean'],
        ]);
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
}
