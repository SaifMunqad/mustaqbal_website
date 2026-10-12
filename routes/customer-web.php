<?php

use App\Http\Controllers\BookstoreController;
use App\Http\Controllers\SchoolArticleController;
use App\Http\Controllers\SchoolEventController;
use App\Http\Controllers\SchoolPageController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\ShowcaseController;
use Illuminate\Support\Facades\Route;

Route::get('/', [ShowcaseController::class, 'home'])->name('home');

Route::get('/school/search', [SearchController::class, 'index'])->name('school.search');

Route::prefix('school')->group(function () {
    Route::get('/about', [SchoolPageController::class, 'about'])->name('school.about');
    Route::get('/programs', [SchoolPageController::class, 'programs'])->name('school.programs');
    Route::get('/contact', [SchoolPageController::class, 'contact'])->name('school.contact');
    Route::get('/showcase', [ShowcaseController::class, 'index'])->name('school.showcase');
    Route::get('/events', [SchoolEventController::class, 'index'])->name('school.events');
    Route::get('/events/{event:slug}', [SchoolEventController::class, 'show'])->name('school.events.show');
    Route::get('/enroll', [SchoolPageController::class, 'enrollment'])->name('school.enroll');
    Route::get('/enroll/resend-email', [SchoolPageController::class, 'resendEnrollmentEmail'])
        ->name('school.enroll.resend-email');

    Route::get('/articles', [SchoolArticleController::class, 'index'])->name('school.articles');
    Route::get('/articles/{article:slug}', [SchoolArticleController::class, 'show'])->name('school.articles.show');
});

Route::prefix('store')->name('store.')->group(function () {
    Route::get('/', [BookstoreController::class, 'index'])->name('index');
    Route::get('/books/{book:slug}', [BookstoreController::class, 'show'])->name('books.show');
    // Books are offered for free and downloaded directly from the site.
    Route::get('/books/{book:slug}/download', [BookstoreController::class, 'download'])->name('books.download');
});