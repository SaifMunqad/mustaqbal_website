<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Mews\Purifier\Facades\Purifier as Purify;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SchoolEventController extends Controller
{
    public function index(Request $request): Response
    {
        $events = Event::query()
            ->visibleTo($request->user())
            ->with(['author:id,name', 'translations.language'])
            ->orderBy('start_at')
            ->paginate(12)
            ->withQueryString();

        $upcoming = Event::query()
            ->visibleTo($request->user())
            ->upcoming()
            ->with(['author:id,name', 'translations.language'])
            ->limit(5)
            ->get();

        return Inertia::render('school/events/school-events-index', [
            'events' => $events,
            'upcoming' => $upcoming,
        ]);
    }

    public function show(Request $request, Event $event): Response
    {
        abort_unless(
            Event::query()->visibleTo($request->user())->whereKey($event->id)->exists(),
            404
        );

        $event->load(['author:id,name', 'translations.language']);

        $related = Event::query()
            ->visibleTo($request->user())
            ->whereKeyNot($event->id)
            ->upcoming()
            ->with('translations.language')
            ->limit(3)
            ->get();

        return Inertia::render('school/events/school-events-show', [
            'event' => array_replace($event->toArray(), [
                'body' => Purify::clean($event->body ?? ''),
            ]),
            'related' => $related,
        ]);
    }
}
