<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateMcp
{
    public function handle(Request $request, Closure $next): Response
    {
        if (app()->environment('local') && config('app.debug') === true) {
            $user = User::query()
                ->where('role', 'admin')
                ->where('status', 'active')
                ->whereNotNull('email_verified_at')
                ->first();

            if ($user) {
                app('auth')->shouldUse('web');
                app('auth')->guard('web')->setUser($user);
                app('auth')->setUser($user);
            }

            return $next($request);
        }

        $guard = app('auth')->guard('api');

        if (! $guard->check()) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        app('auth')->shouldUse('api');
        app('auth')->setUser($guard->user());

        return $next($request);
    }
}