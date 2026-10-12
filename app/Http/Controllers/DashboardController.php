<?php

namespace App\Http\Controllers;

use App\Enums\OrderStatus;
use App\Models\Article;
use App\Models\Contact;
use App\Models\Enrollment;
use App\Models\Event;
use App\Models\Message;
use App\Models\Order;
use App\Models\Post;
use App\Models\Program;
use App\Models\SitePage;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('dashboard', [
            'stats' => [
                'articles' => Article::query()->count(),
                'posts' => Post::query()->count(),
                'contacts' => Contact::query()->count(),
                'messages' => Message::query()->count(),
                'programs' => Program::query()->count(),
                'pages' => SitePage::query()->count(),
                'events' => Event::query()->upcoming()->count(),
                'enrollments' => Enrollment::query()->count(),
                'orders' => Order::query()->count(),
                'pending_orders' => Order::query()->where('status', OrderStatus::Pending->value)->count(),
            ],
        ]);
    }
}
