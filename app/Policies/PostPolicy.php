<?php

namespace App\Policies;

use App\Enums\PostType;
use App\Enums\PostVisibility;
use App\Enums\UserRole;
use App\Models\Post;
use App\Models\User;

class PostPolicy
{
    public function view(?User $user, Post $post): bool
    {
        if ($post->visibility === PostVisibility::Public) {
            return true;
        }

        return $user !== null;
    }

    public function create(User $user, string $type): bool
    {
        $postType = PostType::tryFrom($type);

        if (! $postType) {
            return false;
        }

        if ($user->role === UserRole::Admin) {
            return true;
        }

        if ($postType->isManagementOwned()) {
            return $user->role === UserRole::Management;
        }

        if ($postType->isTeacherOwned()) {
            return $user->role === UserRole::Teacher;
        }

        return false;
    }

    public function update(User $user, Post $post): bool
    {
        if ($user->role->atLeast(UserRole::Management)) {
            return true;
        }

        return $post->user_id === $user->id
            && $post->type->isTeacherOwned()
            && $user->isTeacher();
    }

    public function delete(User $user, Post $post): bool
    {
        return $this->update($user, $post);
    }

    public function interact(User $user, Post $post): bool
    {
        return $this->view($user, $post);
    }
}

