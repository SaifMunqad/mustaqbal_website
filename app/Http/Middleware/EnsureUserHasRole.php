<?php

namespace App\Http\Middleware;

use App\Enums\UserRole;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    /**
     * @param  string  ...$roles
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            abort(401);
        }

        $allowedRoles = array_filter($roles, static fn (string $role): bool => in_array($role, UserRole::values(), true));

        if ($allowedRoles === []) {
            return $next($request);
        }

        if (! in_array($user->role->value, $allowedRoles, true)) {
            abort(403, 'You are not allowed to access this resource.');
        }

        return $next($request);
    }
}

