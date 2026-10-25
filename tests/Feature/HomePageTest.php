<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class HomePageTest extends TestCase
{
    use RefreshDatabase;

    public function test_home_page_renders_the_builder_blocks(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('welcome')
                ->has('blocks')
            );
    }

    public function test_shared_site_settings_expose_branding_and_contact(): void
    {
        // With no persisted row, SiteSetting::current() falls back to defaults,
        // which only carry global branding and contact data — the page layout
        // lives in the builder, not in the settings.
        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('site.brand_name')
                ->has('site.theme.palette')
                ->has('site.contact')
                ->has('site.social')
                ->missing('site.home')
                ->missing('site.stats')
                ->missing('site.features')
            );
    }
}
