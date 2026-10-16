<?php

use App\Http\Controllers\Dashboard\DashboardAboutController;
use App\Http\Controllers\Dashboard\DashboardArticleController;
use App\Http\Controllers\Dashboard\DashboardBookCategoryController;
use App\Http\Controllers\Dashboard\DashboardBookController;
use App\Http\Controllers\Dashboard\DashboardContactController;
use App\Http\Controllers\Dashboard\DashboardEventController;
use App\Http\Controllers\Dashboard\DashboardHomeSectionController;
use App\Http\Controllers\Dashboard\DashboardJobController;
use App\Http\Controllers\Dashboard\DashboardLanguageController;
use App\Http\Controllers\Dashboard\DashboardMessageController;
use App\Http\Controllers\Dashboard\DashboardPostController;
use App\Http\Controllers\Dashboard\DashboardProgramController;
use App\Http\Controllers\Dashboard\DashboardSiteSettingController;
use App\Http\Controllers\Dashboard\DashboardUserController;
use App\Http\Controllers\Dashboard\EmailCampaignController;
use App\Http\Controllers\Dashboard\UploadController;
use App\Http\Controllers\Dashboard\WhatsAppCampaignController;
use App\Http\Controllers\Dashboard\WhatsAppSettingController;
use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'active'])->prefix('dashboard')->group(function () {
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

    Route::post('/upload', [UploadController::class, 'store'])->name('dashboard.upload');
    Route::post('/upload-pdf', [UploadController::class, 'pdf'])->name('dashboard.upload-pdf');

    Route::prefix('users')->name('dashboard.users.')->group(function () {
        Route::get('/', [DashboardUserController::class, 'index'])->name('index');
        Route::get('/create', [DashboardUserController::class, 'create'])->name('create');
        Route::post('/', [DashboardUserController::class, 'store'])->name('store');
        Route::get('/{user}/edit', [DashboardUserController::class, 'edit'])->name('edit');
        Route::patch('/{user}', [DashboardUserController::class, 'update'])->name('update');
        Route::delete('/{user}', [DashboardUserController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('articles')->name('dashboard.articles.')->group(function () {
        Route::get('/', [DashboardArticleController::class, 'index'])->name('index');
        Route::get('/create', [DashboardArticleController::class, 'create'])->name('create');
        Route::get('/{article}/edit', [DashboardArticleController::class, 'edit'])->name('edit');
        Route::get('/{article}', [DashboardArticleController::class, 'show'])->name('show');
        Route::post('/', [DashboardArticleController::class, 'store'])->name('store');
        Route::put('/{article}', [DashboardArticleController::class, 'update'])->name('update');
    });

    Route::prefix('posts')->name('dashboard.posts.')->group(function () {
        Route::get('/', [DashboardPostController::class, 'index'])->name('index');
        Route::get('/create', [DashboardPostController::class, 'create'])->name('create');
        Route::get('/{post}/edit', [DashboardPostController::class, 'edit'])->name('edit');
        Route::get('/{post}', [DashboardPostController::class, 'show'])->name('show');
        Route::post('/', [DashboardPostController::class, 'store'])->name('store');
        Route::put('/{post}', [DashboardPostController::class, 'update'])->name('update');
    });

    Route::prefix('events')->name('dashboard.events.')->group(function () {
        Route::get('/', [DashboardEventController::class, 'index'])->name('index');
        Route::get('/create', [DashboardEventController::class, 'create'])->name('create');
        Route::post('/', [DashboardEventController::class, 'store'])->name('store');
        Route::get('/{event}/edit', [DashboardEventController::class, 'edit'])->name('edit');
        Route::put('/{event}', [DashboardEventController::class, 'update'])->name('update');
        Route::delete('/{event}', [DashboardEventController::class, 'destroy'])->name('destroy');
    });

    Route::middleware('role:management')->group(function () {
        Route::prefix('books')->name('dashboard.books.')->group(function () {
            Route::get('/', [DashboardBookController::class, 'index'])->name('index');
            Route::get('/create', [DashboardBookController::class, 'create'])->name('create');
            Route::post('/', [DashboardBookController::class, 'store'])->name('store');
            Route::get('/{book}/edit', [DashboardBookController::class, 'edit'])->name('edit');
            Route::put('/{book}', [DashboardBookController::class, 'update'])->name('update');
            Route::delete('/{book}', [DashboardBookController::class, 'destroy'])->name('destroy');
        });

        Route::prefix('categories')->name('dashboard.categories.')->group(function () {
            Route::get('/', [DashboardBookCategoryController::class, 'index'])->name('index');
            Route::get('/create', [DashboardBookCategoryController::class, 'create'])->name('create');
            Route::post('/', [DashboardBookCategoryController::class, 'store'])->name('store');
            Route::get('/{category}/edit', [DashboardBookCategoryController::class, 'edit'])->name('edit');
            Route::put('/{category}', [DashboardBookCategoryController::class, 'update'])->name('update');
            Route::delete('/{category}', [DashboardBookCategoryController::class, 'destroy'])->name('destroy');
        });
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
        Route::get('/{message}', [DashboardMessageController::class, 'show'])->name('show');
        Route::post('/', [DashboardMessageController::class, 'store'])
            ->middleware('role:management')
            ->name('store');
        Route::put('/{message}', [DashboardMessageController::class, 'update'])
            ->middleware('role:management')
            ->name('update');
        Route::post('/{message}/answers', [DashboardMessageController::class, 'storeAnswer'])
            ->middleware('role:management')
            ->name('answers.store');
    });

    Route::prefix('email-campaigns')->name('dashboard.email-campaigns.')->middleware('role:admin')->group(function () {
        Route::get('/', [EmailCampaignController::class, 'index'])->name('index');
        Route::get('/create', [EmailCampaignController::class, 'create'])->name('create');
        Route::post('/', [EmailCampaignController::class, 'store'])->name('store');
        Route::get('/{email_campaign}', [EmailCampaignController::class, 'show'])->name('show');
        Route::post('/{email_campaign}/retry', [EmailCampaignController::class, 'retry'])->name('retry');
    });

    Route::prefix('whatsapp-campaigns')->name('dashboard.whatsapp-campaigns.')->middleware('role:admin')->group(function () {
        Route::get('/', [WhatsAppCampaignController::class, 'index'])->name('index');
        Route::get('/create', [WhatsAppCampaignController::class, 'create'])->name('create');
        Route::post('/', [WhatsAppCampaignController::class, 'store'])->name('store');
        Route::get('/{whatsapp_campaign}', [WhatsAppCampaignController::class, 'show'])->name('show');
        Route::post('/{whatsapp_campaign}/retry', [WhatsAppCampaignController::class, 'retry'])->name('retry');
    });

    Route::prefix('whatsapp-settings')->name('dashboard.whatsapp-settings.')->middleware('role:admin')->group(function () {
        Route::get('/', [WhatsAppSettingController::class, 'edit'])->name('edit');
        Route::put('/', [WhatsAppSettingController::class, 'update'])->name('update');
        Route::post('/test', [WhatsAppSettingController::class, 'test'])->name('test');
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

    Route::prefix('languages')->name('dashboard.languages.')->middleware('role:admin')->group(function () {
        Route::get('/', [DashboardLanguageController::class, 'index'])->name('index');
        Route::post('/', [DashboardLanguageController::class, 'store'])->name('store');
        Route::put('/reorder', [DashboardLanguageController::class, 'reorder'])->name('reorder');
        Route::put('/{language}', [DashboardLanguageController::class, 'update'])->name('update');
        Route::delete('/{language}', [DashboardLanguageController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('about')->name('dashboard.about.')->middleware('role:management')->group(function () {
        Route::get('/', [DashboardAboutController::class, 'edit'])->name('edit');
        Route::get('/visual', [DashboardAboutController::class, 'visual'])->name('visual');
        Route::put('/', [DashboardAboutController::class, 'update'])->name('update');
    });

    Route::prefix('site-settings')->name('dashboard.site-settings.')->group(function () {
        Route::get('/', [DashboardSiteSettingController::class, 'edit'])
            ->middleware('role:management')
            ->name('edit');
        Route::put('/', [DashboardSiteSettingController::class, 'update'])
            ->middleware('role:management')
            ->name('update');
    });

    Route::prefix('jobs')->name('dashboard.jobs.')->middleware('role:management')->group(function () {
        Route::get('/', [DashboardJobController::class, 'index'])->name('index');
        Route::get('/create', [DashboardJobController::class, 'create'])->name('create');
        Route::post('/', [DashboardJobController::class, 'store'])->name('store');
        Route::get('/{job}/edit', [DashboardJobController::class, 'edit'])->name('edit');
        Route::put('/{job}', [DashboardJobController::class, 'update'])->name('update');
        Route::delete('/{job}', [DashboardJobController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('home-sections')->name('dashboard.home-sections.')->middleware('role:management')->group(function () {
        Route::get('/', [DashboardHomeSectionController::class, 'index'])->name('index');
        Route::get('/visual', [DashboardHomeSectionController::class, 'visual'])->name('visual');
        Route::put('/visual', [DashboardHomeSectionController::class, 'saveLayout'])->name('visual.save');
        Route::get('/create', [DashboardHomeSectionController::class, 'create'])->name('create');
        Route::post('/', [DashboardHomeSectionController::class, 'store'])->name('store');
        Route::put('/reorder', [DashboardHomeSectionController::class, 'reorder'])->name('reorder');
        Route::get('/{homeSection}/edit', [DashboardHomeSectionController::class, 'edit'])->name('edit');
        Route::put('/{homeSection}', [DashboardHomeSectionController::class, 'update'])->name('update');
        Route::delete('/{homeSection}', [DashboardHomeSectionController::class, 'destroy'])->name('destroy');
    });
});

require __DIR__.'/customer-web.php';
require __DIR__.'/community.php';
require __DIR__.'/settings.php';
