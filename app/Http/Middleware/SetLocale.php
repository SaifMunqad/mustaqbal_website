<?php

namespace App\Http\Middleware;

use App\Models\Language;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    /**
     * Cookie used to remember the language a visitor picked in the switcher.
     */
    public const COOKIE = 'mustaqbal_locale';

    /**
     * Remember the visitor's language for a year.
     */
    private const COOKIE_MINUTES = 525600;

    public function handle(Request $request, Closure $next): Response
    {
        $active = collect(Language::activeList())->pluck('code')->all();

        $cookieLocale = $request->cookie(self::COOKIE);

        // A first-time visitor (or one whose saved language was disabled/removed)
        // gets the highest-priority active language, which we then cache on their
        // browser so the choice sticks across future visits.
        $isNewVisitor = ! $cookieLocale || ! in_array($cookieLocale, $active, true);

        $locale = $isNewVisitor
            ? Language::firstActiveCode()
            : $cookieLocale;

        app()->setLocale($locale);

        $response = $next($request);

        if ($isNewVisitor && in_array($locale, $active, true)) {
            $response->headers->setCookie(Cookie::make(
                self::COOKIE,
                $locale,
                time() + (self::COOKIE_MINUTES * 60),
                '/',
                null,
                $request->secure(),
                false,
                false,
                'Lax',
            ));
        }

        return $response;
    }
}
