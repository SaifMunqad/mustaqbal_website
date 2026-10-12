<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\User;

class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role->atLeast(UserRole::Management);
    }

    public function create(User $user): bool
    {
        return $this->viewAny($user);
    }

    /**
     * Roles the actor is allowed to grant to other accounts.
     *
     * @return list<UserRole>
     */
    public function assignableRoles(User $user): array
    {
        return match (true) {
            $user->role === UserRole::Admin => UserRole::cases(),
            $user->role === UserRole::Management => [UserRole::Teacher, UserRole::Family],
            default => [],
        };
    }

    public function update(User $user, User $target): bool
    {
        if ($user->role === UserRole::Admin) {
            return true;
        }

        // Management may only manage staff below their own rank (teachers, families).
        return $user->role === UserRole::Management
            && $target->role->level() < UserRole::Management->level();
    }

    public function delete(User $user, User $target): bool
    {
        if ($target->is($user)) {
            return false;
        }

        return $this->update($user, $target);
    }
}
