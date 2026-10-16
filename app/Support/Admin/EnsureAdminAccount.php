<?php

namespace App\Support\Admin;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Support\Facades\Schema;
use Throwable;

class EnsureAdminAccount
{
    /**
     * Whether the check already ran in this process. Boot-time invocation uses
     * this so long-running processes (queue workers, Octane) do not repeat the
     * lookup on every job or sub-request. Pass $force to bypass the guard.
     */
    protected static bool $processed = false;

    /**
     * Guarantee the configured admin account exists.
     *
     * Safe to call from anywhere: it never throws and silently skips when the
     * account is not configured (empty email/password) or when the users table
     * is not available yet (e.g. before migrations have run). Uses
     * firstOrCreate so an existing account is left untouched — a renamed or
     * re-passworded admin is never overwritten, while a deleted account is
     * re-created on the next call.
     */
    public static function handle(bool $force = false): ?User
    {
        if (self::$processed && ! $force) {
            return null;
        }

        self::$processed = true;

        $email = config('admin.email');
        $password = config('admin.password');

        if (blank($email) || blank($password)) {
            return null;
        }

        try {
            if (! Schema::hasTable('users')) {
                return null;
            }

            return User::firstOrCreate(
                ['email' => $email],
                [
                    'name' => config('admin.name', 'Site Admin'),
                    'role' => UserRole::Admin->value,
                    'password' => $password,
                    'email_verified_at' => now(),
                ],
            );
        } catch (Throwable) {
            // Never let admin-account bootstrapping break the application
            // (e.g. database unavailable or a mid-migration state).
            return null;
        }
    }
}
