<?php

namespace App\Http\Middleware;

use App\Models\Language;
use App\Support\Cart;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use App\Models\SiteSetting;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'flash' => [
                'toast' => $request->session()->get('toast'),
            ],
            'auth' => [
                'user' => $request->user(),
            ],
            'cart' => fn () => app(Cart::class)->summary(),
            'site' => fn () => $this->siteSettings(),
            'languages' => fn () => [
                'available' => Language::activeList(),
                'current' => app()->getLocale(),
                'default' => Language::defaultCode(),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }

    /**
     * Global, DB-driven site content shared with every page. Falls back to the
     * model defaults if the settings table is not available yet, so the frontend
     * always receives a complete shape.
     *
     * @return array<string, mixed>
     */
    private function siteSettings(): array
    {
        try {
            return SiteSetting::current()->toShared();
        } catch (\Throwable) {
            return (new SiteSetting(SiteSetting::defaults()))->toShared();
        }
    }
}
