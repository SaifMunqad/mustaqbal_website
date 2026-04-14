<?php

use App\Http\Controllers\CommentController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\ConversationController;
use App\Http\Controllers\EnrollmentController;
use App\Http\Controllers\LikeController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\PostController;
use Illuminate\Support\Facades\Route;

Route::prefix('community')->group(function () {
    Route::get('/posts', [PostController::class, 'index'])->name('community.posts.index');
    Route::get('/posts/{post}', [PostController::class, 'show'])->name('community.posts.show');

    Route::post('/contact', [ContactController::class, 'store'])->name('community.contact.store');
    Route::post('/enrollments', [EnrollmentController::class, 'store'])->name('community.enrollments.store');
    Route::post('/enrollments/resend-email', [EnrollmentController::class, 'resendEmail'])
        ->name('community.enrollments.resend-email');

    Route::middleware(['auth', 'verified'])->group(function () {
        Route::post('/posts', [PostController::class, 'store'])
            ->middleware('role:teacher,management')
            ->name('community.posts.store');

        Route::post('/posts/{post}/comments', [CommentController::class, 'store'])
            ->name('community.posts.comments.store');

        Route::post('/posts/{post}/likes', [LikeController::class, 'store'])
            ->name('community.posts.likes.store');

        Route::delete('/posts/{post}/likes', [LikeController::class, 'destroy'])
            ->name('community.posts.likes.destroy');

        Route::get('/conversations', [ConversationController::class, 'index'])
            ->name('community.conversations.index');

        Route::post('/conversations', [ConversationController::class, 'store'])
            ->name('community.conversations.store');

        Route::post('/conversations/{conversation}/messages', [MessageController::class, 'store'])
            ->name('community.conversations.messages.store');
    });
});


