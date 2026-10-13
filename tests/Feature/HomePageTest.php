<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class HomePageTest extends TestCase
{
    use RefreshDatabase;

    public function test_home_page_renders_with_home_sections_props(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('welcome')
                ->has('programs')
                ->has('news')
                ->has('events')
                ->has('sections')
            );
    }

    public function test_shared_site_settings_expose_stats_and_features(): void
    {
        // With no persisted row, SiteSetting::current() falls back to defaults,
        // which now include the admin-editable home stats and features.
        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('site.stats')
                ->has('site.features')
            );
    }
}
