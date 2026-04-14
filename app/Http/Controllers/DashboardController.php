<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Models\Contact;
use App\Models\Message;
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
            ],
        ]);
    }
}
