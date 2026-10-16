<?php

namespace App\Http\Middleware;

use App\Models\Language;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    /**
     * Cookie used to remember the language a visitor picked in the switcher.
     */
    public const COOKIE = 'school_locale';

    /**
     * Remember the visitor's language for a year.
     */
    private const COOKIE_MINUTES = 525600;

    public function handle(Request $request, Closure $next): Response
    {
        $active = collect(Language::activeList())->pluck('code')->all();

        $cookieLocale = $request->cookie(self::COOKIE);

        error_log('SETLOCALE_DEBUG cookie=' . var_export($cookieLocale, true) . ' active=' . json_encode($active));

        // A first-time visitor (or one whose saved language was disabled/removed)
        // gets the site's default language — the row flagged `is_default` — which we
        // then cache on their browser so the choice sticks across future visits. If
        // the default language is not itself active, we fall back to the
        // highest-priority active language.
        $isNewVisitor = ! $cookieLocale || ! in_array($cookieLocale, $active, true);

        $default = Language::defaultCode();
        $fallback = in_array($default, $active, true) ? $default : Language::firstActiveCode();

        $locale = $isNewVisitor
            ? $fallback
            : $cookieLocale;

        app()->setLocale($locale);

        $response = $next($request);

        if ($isNewVisitor && in_array($locale, $active, true)) {
            // Use Laravel's cookie helper (the Symfony Cookie class has no static
            // factory). The cookie is excluded from encryption elsewhere.
            $response->headers->setCookie(
                cookie(self::COOKIE, $locale, self::COOKIE_MINUTES, '/', null, $request->secure(), false, false, 'Lax')
            );
        }

        return $response;
    }
}
