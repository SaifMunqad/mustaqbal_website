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
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
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
    }
}
