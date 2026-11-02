<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Laravel\Passport\Passport;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Passport v13 auto-registers OAuth routes at /oauth — no manual call needed.

        // Enable password grant so clients (e.g., Gemini) can exchange
        // username/password for an access token via POST /oauth/token.
        Passport::enablePasswordGrant();

        // Token expiration settings.
        Passport::tokensExpireIn(now()->addDays(7));
        Passport::refreshTokensExpireIn(now()->addDays(7));
        Passport::personalAccessTokensExpireIn(now()->addDays(7));
    }
}
