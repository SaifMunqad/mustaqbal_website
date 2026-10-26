<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_screen_is_not_available(): void
    {
        $this->assertFalse(Route::has('register'));
    }

    public function test_public_user_registration_is_not_available(): void
    {
        $this->assertFalse(Route::has('register.store'));
    }
}
