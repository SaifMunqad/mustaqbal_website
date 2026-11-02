<?php

namespace App\Providers;

use App\Support\OAuth\FlexibleBridgeClientRepository;
use Illuminate\Support\ServiceProvider;
use Laravel\Passport\Bridge\ClientRepository as PassportBridgeClientRepository;
use Laravel\Passport\Passport;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Bind our flexible client repository so dynamic subpaths (e.g. Gemini Spark's
        // dynamic relay path under oauth-redirect.googleusercontent.com) validate cleanly
        // against registered Google OAuth URIs.
        $this->app->bind(PassportBridgeClientRepository::class, FlexibleBridgeClientRepository::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Passport v13 auto-registers OAuth routes at /oauth — no manual call needed.

        // Passport v13 is headless by default; bind the authorization consent screen view.
        Passport::authorizationView('auth.oauth.authorize');

        // Enable password grant so clients (e.g., Gemini) can exchange
        // username/password for an access token via POST /oauth/token.
        Passport::enablePasswordGrant();

        // Token expiration settings.
        Passport::tokensExpireIn(now()->addDays(7));
        Passport::refreshTokensExpireIn(now()->addDays(7));
        Passport::personalAccessTokensExpireIn(now()->addDays(7));
    }
}
