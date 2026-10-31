<?php

namespace App\Http\Middleware;

use App\Models\Language;
use App\Models\SiteSetting;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
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
                'notification' => fn () => $this->notification($request),
            ],
            'auth' => [
                'user' => $request->user(),
            ],
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
     * Normalize the flashed notification into a single, de-duplicatable payload.
     *
     * Controllers emit a message with the simplest possible form:
     *     return back()->with('success', 'Saved!');
     *     return back()->with('error', "Can't do that");
     *     return back()->with('info', 'translate.contact.form.success');
     *
     * The message may be a plain string or an i18n key (resolved on the client),
     * or an array carrying a `description` and interpolation `params`. A stable
     * id is stamped here so the frontend can show each notification exactly once.
     * Legacy `toast` payloads are still understood during the migration.
     *
     * @return array{id: string, variant: string, title: string, description: string|null, params: array<string, mixed>|null}|null
     */
    private function notification(Request $request): ?array
    {
        $session = $request->session();

        foreach (['success', 'error', 'info'] as $variant) {
            if (! $session->has($variant)) {
                continue;
            }

            $payload = $session->get($variant);

            if (is_array($payload)) {
                $title = (string) ($payload['title'] ?? ($payload['message'] ?? ''));
                $description = isset($payload['description']) ? (string) $payload['description'] : null;
                $params = isset($payload['params']) && is_array($payload['params']) ? $payload['params'] : null;
            } else {
                $title = (string) $payload;
                $description = null;
                $params = null;
            }

            if ($title === '') {
                continue;
            }

            return [
                'id' => (string) Str::uuid(),
                'variant' => $variant,
                'title' => $title,
                'description' => $description,
                'params' => $params,
            ];
        }

        // Legacy support: ->with('toast', ['variant' => ..., 'title' => ...]).
        if ($legacy = $session->get('toast')) {
            $variant = in_array($legacy['variant'] ?? 'info', ['success', 'error', 'info'], true)
                ? $legacy['variant']
                : 'info';

            return [
                'id' => (string) Str::uuid(),
                'variant' => $variant,
                'title' => (string) ($legacy['title'] ?? ''),
                'description' => isset($legacy['description']) ? (string) $legacy['description'] : null,
                'params' => null,
            ];
        }

        return null;
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
