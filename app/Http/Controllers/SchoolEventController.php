<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SchoolEventController extends Controller
{
    public function index(Request $request): Response
    {
        $events = Event::query()
            ->visibleTo($request->user())
            ->with('author:id,name')
            ->orderBy('start_at')
            ->paginate(12);

        $upcoming = Event::query()
            ->visibleTo($request->user())
            ->upcoming()
            ->with('author:id,name')
            ->limit(5)
            ->get();

        return Inertia::render('school/events/index', [
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

        $event->load('author:id,name');

        $related = Event::query()
            ->visibleTo($request->user())
            ->whereKeyNot($event->id)
            ->upcoming()
            ->limit(3)
            ->get();

        return Inertia::render('school/events/show', [
            'event' => $event,
            'related' => $related,
        ]);
    }
}
