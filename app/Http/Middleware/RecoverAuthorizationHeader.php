<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Guarantees the bearer token is visible to the auth guards regardless of how
 * the underlying web server delivered (or mangled) the Authorization header.
 *
 * Apache with PHP-FPM/LiteSpeed frequently strips the `Authorization` header
 * from the PHP superglobals, or re-exposes it only as `REDIRECT_HTTP_AUTHORIZATION`
 * / `HTTP_AUTHORIZATION` in the environment after the front-controller rewrite.
 * Laravel's own request builder covers the common cases, but this closes the
 * remaining gaps so Sanctum's `bearerToken()` always finds the token on shared
 * hosting that we cannot reconfigure.
 */
class RecoverAuthorizationHeader
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->bearerToken()) {
            foreach ($this->candidates() as $value) {
                if (is_string($value) && $value !== '') {
                    // Make it visible both as a header and in $_SERVER so any
                    // downstream Symfony/Sanctum lookup path can read it.
                    $request->headers->set('Authorization', $value);
                    $request->server->set('Authorization', $value);

                    break;
                }
            }
        }

        return $next($request);
    }

    /**
     * Every place a token might still be hiding, ordered by likelihood.
     *
     * @return array<int, string|null>
     */
    private function candidates(): array
    {
        $headers = function_exists('apache_request_headers') ? apache_request_headers() : [];

        return [
            $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? null,
            $_SERVER['HTTP_AUTHORIZATION'] ?? null,
            $_SERVER['Authorization'] ?? null,
            $headers['Authorization'] ?? $headers['authorization'] ?? null,
            getenv('HTTP_AUTHORIZATION') ?: null,
            getenv('REDIRECT_HTTP_AUTHORIZATION') ?: null,
        ];
    }
}
