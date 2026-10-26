<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\UpdateAboutPageRequest;
use App\Models\SitePage;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Settings screen for the public About page.
 *
 * The page's content — hero, story, stats, mission, values, message, FAQ and
 * everything else — is authored in the unified page builder
 * ({@see DashboardPageBuilderController}, `about` page key). This screen only
 * owns publishing, so there is exactly one place that writes content and no
 * chance of the old JSON editor overwriting builder blocks.
 */
class DashboardAboutController extends Controller
{
    private const ABOUT_SLUG = 'about';

    public function edit(): Response
    {
        $page = $this->page();

        return Inertia::render('dashboard/about/dashboard-about-edit', [
            'page' => [
                'id' => $page->id,
                'slug' => $page->slug,
                'is_published' => $page->is_published,
            ],
            'visualUrl' => route('dashboard.pages.about'),
        ]);
    }

    public function update(UpdateAboutPageRequest $request): RedirectResponse
    {
        $this->page()->update([
            'is_published' => (bool) $request->input('is_published'),
        ]);

        return redirect()
            ->route('dashboard.about.edit')
            ->with('success', 'flash.aboutUpdated');
    }

    /**
     * Resolve the About page, creating a blank published row when the seed has
     * not run yet so the dashboard is always available.
     */
    private function page(): SitePage
    {
        return SitePage::query()->firstOrCreate(
            ['slug' => self::ABOUT_SLUG],
            [
                'is_published' => true,
                'content' => ['video_embed' => ''],
            ],
        );
    }
}
