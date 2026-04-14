<?php

namespace App\Http\Controllers;

use App\Models\Article;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SchoolArticleController extends Controller
{
    public function index(): Response
    {
        $articles = Article::query()
            ->with('author:id,name')
            ->where('is_published', true)
            ->whereNotNull('published_at')
            ->latest('published_at')
            ->paginate(9);

        return Inertia::render('school/articles/index', [
            'articles' => $articles,
        ]);
    }

    public function show(Request $request, Article $article): Response
    {
        abort_unless($article->is_published && $article->published_at !== null, 404);

        $article->load('author:id,name');

        return Inertia::render('school/articles/show', [
            'article' => $article,
        ]);
    }
}

