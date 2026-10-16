<?php

namespace App\Providers;

use App\Enums\UserRole;
use App\Models\Article;
use App\Models\Event;
use App\Models\Post;
use App\Models\User;
use App\Policies\ArticlePolicy;
use App\Policies\EventPolicy;
use App\Policies\PostPolicy;
use App\Policies\UserPolicy;
use App\Support\Admin\EnsureAdminAccount;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\ImageManager;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Icon generation runs on the GD driver (always available here); bound as
        // a stateless manager so FaviconService can resolve it via the container.
        $this->app->singleton(ImageManager::class, fn (): ImageManager => new ImageManager(new Driver));
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Schema::defaultStringLength(191);

        // Public form submissions are rate limited per IP (per authenticated
        // user when logged in) to protect forms and the guest checkout flow.
        RateLimiter::for('public-forms', function (Request $request) {
            $key = $request->user() ? 'user:'.$request->user()->id : $request->ip();

            return Limit::perMinute(10)->by($key);
        });

        RateLimiter::for('checkout', function (Request $request) {
            $key = $request->user() ? 'user:'.$request->user()->id : $request->ip();

            return Limit::perMinute(5)->by($key);
        });

        Gate::policy(Post::class, PostPolicy::class);
        Gate::policy(User::class, UserPolicy::class);
        Gate::policy(Article::class, ArticlePolicy::class);
        Gate::policy(Event::class, EventPolicy::class);

        // Restrict Pulse dashboard to Management and Admin roles.
        Gate::define('viewPulse', function (User $user) {
            return $user->role?->atLeast(UserRole::Management) ?? false;
        });

        // Guarantee the configured admin account exists on boot, so no seeder
        // run is required. Skipped while testing (keeps test DBs isolated) and
        // disable via ADMIN_AUTO_ENSURE=false. The call is safe/no-op when the
        // credentials are unset or the users table is not ready yet.
        if (config('admin.auto_ensure') && ! $this->app->environment('testing')) {
            EnsureAdminAccount::handle();
        }
    }
}
