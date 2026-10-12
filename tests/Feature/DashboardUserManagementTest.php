<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class DashboardUserManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_from_user_management(): void
    {
        $this->get(route('dashboard.users.index'))->assertRedirect(route('login'));
    }

    public function test_family_accounts_cannot_access_user_management(): void
    {
        $this->actingAs(User::factory()->create(['role' => UserRole::Family->value]))
            ->get(route('dashboard.users.index'))
            ->assertForbidden();
    }

    public function test_management_can_list_accounts(): void
    {
        $this->actingAs(User::factory()->create(['role' => UserRole::Management->value]))
            ->get(route('dashboard.users.index'))
            ->assertOk();
    }

    public function test_management_can_create_teacher_accounts(): void
    {
        Mail::fake();

        $this->actingAs(User::factory()->create(['role' => UserRole::Management->value]))
            ->post(route('dashboard.users.store'), [
                'name' => 'New Teacher',
                'email' => 'teacher@example.com',
                'role' => UserRole::Teacher->value,
                'status' => UserStatus::Active->value,
                'password' => 'secret-password',
                'password_confirmation' => 'secret-password',
            ])
            ->assertRedirect(route('dashboard.users.index'));

        $this->assertDatabaseHas('users', [
            'email' => 'teacher@example.com',
            'role' => UserRole::Teacher->value,
        ]);
    }

    public function test_management_cannot_create_admin_accounts(): void
    {
        Mail::fake();

        $this->actingAs(User::factory()->create(['role' => UserRole::Management->value]))
            ->post(route('dashboard.users.store'), [
                'name' => 'Sneaky Admin',
                'email' => 'sneaky@example.com',
                'role' => UserRole::Admin->value,
                'status' => UserStatus::Active->value,
                'password' => 'secret-password',
                'password_confirmation' => 'secret-password',
            ])
            ->assertSessionHasErrors('role');

        $this->assertDatabaseMissing('users', ['email' => 'sneaky@example.com']);
    }

    public function test_admin_can_create_admin_accounts(): void
    {
        Mail::fake();

        $this->actingAs(User::factory()->create(['role' => UserRole::Admin->value]))
            ->post(route('dashboard.users.store'), [
                'name' => 'Another Admin',
                'email' => 'admin2@example.com',
                'role' => UserRole::Admin->value,
                'status' => UserStatus::Active->value,
                'password' => 'secret-password',
                'password_confirmation' => 'secret-password',
            ])
            ->assertRedirect(route('dashboard.users.index'));

        $this->assertDatabaseHas('users', [
            'email' => 'admin2@example.com',
            'role' => UserRole::Admin->value,
        ]);
    }

    public function test_management_cannot_edit_admin_accounts(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin->value]);

        $this->actingAs(User::factory()->create(['role' => UserRole::Management->value]))
            ->put(route('dashboard.users.update', $admin), [
                'name' => 'Hacked',
                'email' => $admin->email,
                'role' => UserRole::Teacher->value,
                'status' => UserStatus::Active->value,
            ])
            ->assertForbidden();
    }

    public function test_management_cannot_delete_other_staff_above_rank(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin->value]);

        $this->actingAs(User::factory()->create(['role' => UserRole::Management->value]))
            ->delete(route('dashboard.users.destroy', $admin))
            ->assertForbidden();
    }

    public function test_suspended_users_are_logged_out(): void
    {
        $suspended = User::factory()->create(['status' => UserStatus::Suspended->value]);

        $this->actingAs($suspended)
            ->get(route('dashboard'))
            ->assertRedirect(route('login'));

        $this->assertGuest();
    }
}
