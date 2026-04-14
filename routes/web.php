<?php

use App\Http\Controllers\Dashboard\DashboardArticleController;
use App\Http\Controllers\Dashboard\DashboardContactController;
use App\Http\Controllers\Dashboard\DashboardMessageController;
use App\Http\Controllers\Dashboard\DashboardPostController;
use App\Http\Controllers\Dashboard\DashboardProgramController;
use App\Http\Controllers\Dashboard\DashboardSitePageController;
use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->prefix('dashboard')->group(function () {
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

    Route::prefix('articles')->name('dashboard.articles.')->group(function () {
        Route::get('/', [DashboardArticleController::class, 'index'])->name('index');
        Route::get('/create', [DashboardArticleController::class, 'create'])->name('create');
        Route::get('/{article}/edit', [DashboardArticleController::class, 'edit'])->name('edit');
        Route::get('/{article}', [DashboardArticleController::class, 'show'])->name('show');
        Route::post('/', [DashboardArticleController::class, 'store'])
            ->middleware('role:management')
            ->name('store');
        Route::put('/{article}', [DashboardArticleController::class, 'update'])
            ->middleware('role:management')
            ->name('update');
    });

    Route::prefix('posts')->name('dashboard.posts.')->group(function () {
        Route::get('/', [DashboardPostController::class, 'index'])->name('index');
        Route::get('/create', [DashboardPostController::class, 'create'])->name('create');
        Route::get('/{post}/edit', [DashboardPostController::class, 'edit'])->name('edit');
        Route::get('/{post}', [DashboardPostController::class, 'show'])->name('show');
        Route::post('/', [DashboardPostController::class, 'store'])
            ->middleware('role:management')
            ->name('store');
        Route::put('/{post}', [DashboardPostController::class, 'update'])
            ->middleware('role:management')
            ->name('update');
    });

    Route::prefix('contacts')->name('dashboard.contacts.')->group(function () {
        Route::get('/', [DashboardContactController::class, 'index'])->name('index');
        Route::get('/create', [DashboardContactController::class, 'create'])->name('create');
        Route::get('/{contact}/edit', [DashboardContactController::class, 'edit'])->name('edit');
        Route::post('/', [DashboardContactController::class, 'store'])
            ->middleware('role:management')
            ->name('store');
        Route::put('/{contact}', [DashboardContactController::class, 'update'])
            ->middleware('role:management')
            ->name('update');
    });

    Route::prefix('messages')->name('dashboard.messages.')->group(function () {
        Route::get('/', [DashboardMessageController::class, 'index'])->name('index');
        Route::get('/create', [DashboardMessageController::class, 'create'])->name('create');
        Route::get('/{message}/edit', [DashboardMessageController::class, 'edit'])->name('edit');
        Route::post('/', [DashboardMessageController::class, 'store'])
            ->middleware('role:management')
            ->name('store');
        Route::put('/{message}', [DashboardMessageController::class, 'update'])
            ->middleware('role:management')
            ->name('update');
    });

    Route::prefix('programs')->name('dashboard.programs.')->group(function () {
        Route::get('/', [DashboardProgramController::class, 'index'])->name('index');
        Route::get('/create', [DashboardProgramController::class, 'create'])->name('create');
        Route::get('/{program}/edit', [DashboardProgramController::class, 'edit'])->name('edit');
        Route::post('/', [DashboardProgramController::class, 'store'])
            ->middleware('role:management')
            ->name('store');
        Route::put('/{program}', [DashboardProgramController::class, 'update'])
            ->middleware('role:management')
            ->name('update');
    });

    Route::prefix('site-pages')->name('dashboard.site-pages.')->group(function () {
        Route::get('/', [DashboardSitePageController::class, 'index'])->name('index');
        Route::get('/create', [DashboardSitePageController::class, 'create'])->name('create');
        Route::get('/{sitePage}/edit', [DashboardSitePageController::class, 'edit'])->name('edit');
        Route::post('/', [DashboardSitePageController::class, 'store'])
            ->middleware('role:management')
            ->name('store');
        Route::put('/{sitePage}', [DashboardSitePageController::class, 'update'])
            ->middleware('role:management')
            ->name('update');
    });
});

require __DIR__.'/customer-web.php';
require __DIR__.'/community.php';
require __DIR__.'/settings.php';
