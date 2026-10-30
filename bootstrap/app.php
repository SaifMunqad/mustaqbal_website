<?php

use App\Http\Middleware\EnsureUserHasRole;
use App\Http\Middleware\EnsureUserIsActive;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\SetLocale;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state', 'school_locale']);

        $middleware->alias([
            'role' => EnsureUserHasRole::class,
            'active' => EnsureUserIsActive::class,
        ]);

        $middleware->web(append: [
            SetLocale::class,
            HandleAppearance::class,
            HandleInertiaRequests::class,
            // AddLinkHeadersForPreloadedAssets is intentionally NOT registered:
            // it mirrors every Vite preloaded chunk into a `Link:` response
            // header. Heavy pages (the page builder pulls in dozens of chunks)
            // push that header past nginx's default 4k `fastcgi_buffer_size`, so
            // a direct load/refresh returns 502 Bad Gateway while SPA navigation
            // (JSON, no such header) is fine. We can't raise nginx buffers on
            // shared hosting, so we drop the redundant header instead — the
            // `@vite` directive still emits the preload <link> tags in the HTML
            // head, so only the optional HTTP/2 preload hint is lost.
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
