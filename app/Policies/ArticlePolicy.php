<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Article;
use App\Models\User;

class ArticlePolicy
{
    public function create(User $user): bool
    {
        return $user->role->atLeast(UserRole::Management);
    }

    public function update(User $user, Article $article): bool
    {
        return $this->create($user);
    }

    public function delete(User $user, Article $article): bool
    {
        return $this->create($user);
    }
}
