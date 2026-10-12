<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Event;
use App\Models\User;

class EventPolicy
{
    /**
     * Anyone at teacher level or above may create events; the controller forces
     * teacher-created events to start as unpublished drafts.
     */
    public function create(User $user): bool
    {
        return $user->role->atLeast(UserRole::Teacher);
    }

    public function update(User $user, Event $event): bool
    {
        if ($user->role->atLeast(UserRole::Management)) {
            return true;
        }

        // Teachers may revise their own unpublished drafts.
        return $user->isTeacher()
            && $event->user_id === $user->id
            && ! $event->is_published;
    }

    public function delete(User $user, Event $event): bool
    {
        return $this->update($user, $event);
    }

    /**
     * Whether the given user is allowed to publish (rather than keep as a draft).
     */
    public function publish(User $user): bool
    {
        return $user->role->atLeast(UserRole::Management);
    }
}
