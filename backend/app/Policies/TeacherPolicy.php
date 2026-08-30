<?php

namespace App\Policies;

use App\Models\Teacher;
use App\Models\User;

class TeacherPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Teacher $teacher): bool
    {
        if ($user->isAdmin()) return true;
        if ($user->isTeacher()) return true;
        return true;
    }

    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    public function update(User $user, Teacher $teacher): bool
    {
        return $user->isAdmin();
    }

    public function delete(User $user, Teacher $teacher): bool
    {
        return $user->isAdmin();
    }
}
