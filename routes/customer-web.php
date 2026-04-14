<?php

use App\Http\Controllers\SchoolArticleController;
use App\Http\Controllers\SchoolPageController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::prefix('school')->group(function () {
    Route::get('/about', [SchoolPageController::class, 'about'])->name('school.about');
    Route::get('/programs', [SchoolPageController::class, 'programs'])->name('school.programs');
    Route::get('/contact', [SchoolPageController::class, 'contact'])->name('school.contact');
    Route::get('/enroll', [SchoolPageController::class, 'enrollment'])->name('school.enroll');
    Route::get('/enroll/resend-email', [SchoolPageController::class, 'resendEnrollmentEmail'])
        ->name('school.enroll.resend-email');

    Route::get('/articles', [SchoolArticleController::class, 'index'])->name('school.articles');
    Route::get('/articles/{article:slug}', [SchoolArticleController::class, 'show'])->name('school.articles.show');
});