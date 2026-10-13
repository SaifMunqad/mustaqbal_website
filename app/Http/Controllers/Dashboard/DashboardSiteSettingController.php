<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use App\Support\Rules\ImageLocation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardSiteSettingController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('dashboard/site-settings/edit', [
            'settings' => SiteSetting::current(),
            'mapsKey' => config('services.google.maps_key'),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'brand_name' => ['required', 'string', 'max:255'],
            'brand_short_name' => ['required', 'string', 'max:100'],
            'tagline' => ['nullable', 'string', 'max:255'],
            'logo_url' => ['nullable', new ImageLocation, 'max:2048'],
            'favicon_url' => ['nullable', new ImageLocation, 'max:2048'],
            'home_title' => ['nullable', 'string', 'max:255'],
            'home_subtitle' => ['nullable', 'string', 'max:2000'],
            'home_cta_primary' => ['nullable', 'string', 'max:255'],
            'home_cta_secondary' => ['nullable', 'string', 'max:255'],
            'home_hero_image' => ['nullable', new ImageLocation, 'max:2048'],
            'home_stats' => ['nullable', 'array'],
            'home_stats.*.value' => ['nullable', 'string', 'max:60'],
            'home_stats.*.label' => ['nullable', 'string', 'max:120'],
            'home_features' => ['nullable', 'array'],
            'home_features.*.icon' => ['nullable', 'string', 'max:40'],
            'home_features.*.title' => ['nullable', 'string', 'max:120'],
            'home_features.*.description' => ['nullable', 'string', 'max:500'],
            'contact_email' => ['nullable', 'email', 'max:255'],
            'contact_phone_primary' => ['nullable', 'string', 'max:100'],
            'contact_phone_secondary' => ['nullable', 'string', 'max:100'],
            'address' => ['nullable', 'string', 'max:255'],
            'map_latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'map_longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'map_zoom' => ['nullable', 'integer', 'between:1,21'],
            'map_embed_url' => ['nullable', 'url', 'max:2048'],
            'social_facebook' => ['nullable', 'url', 'max:2048'],
            'social_instagram' => ['nullable', 'url', 'max:2048'],
            'social_twitter' => ['nullable', 'url', 'max:2048'],
            'social_youtube' => ['nullable', 'url', 'max:2048'],
            'social_whatsapp' => ['nullable', 'string', 'max:255'],
            'footer_text' => ['nullable', 'string', 'max:255'],
        ]);

        // Drop fully-empty stats/features rows so blank template rows an admin
        // left behind never render as empty tiles on the public home page.
        $validated['home_stats'] = collect($validated['home_stats'] ?? [])
            ->filter(fn (array $row): bool => filled($row['value'] ?? null) || filled($row['label'] ?? null))
            ->values()
            ->all();

        $validated['home_features'] = collect($validated['home_features'] ?? [])
            ->filter(fn (array $row): bool => filled($row['title'] ?? null) || filled($row['description'] ?? null))
            ->values()
            ->all();

        SiteSetting::resolved()->update($validated);

        return redirect()
            ->route('dashboard.site-settings.edit')
            ->with('success', 'Site settings updated successfully.');
    }
}
