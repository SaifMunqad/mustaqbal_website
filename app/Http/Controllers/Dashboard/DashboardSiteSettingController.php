<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
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
            'logo_url' => ['nullable', 'url', 'max:2048'],
            'home_title' => ['nullable', 'string', 'max:255'],
            'home_subtitle' => ['nullable', 'string', 'max:2000'],
            'home_cta_primary' => ['nullable', 'string', 'max:255'],
            'home_cta_secondary' => ['nullable', 'string', 'max:255'],
            'home_hero_image' => ['nullable', 'url', 'max:2048'],
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

        SiteSetting::resolved()->update($validated);

        return redirect()
            ->route('dashboard.site-settings.edit')
            ->with('success', 'Site settings updated successfully.');
    }
}
