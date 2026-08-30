<?php

namespace App\Policies;

use App\Models\Student;
use App\Models\User;

class StudentPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin() || $user->isTeacher();
    }

    public function view(User $user, Student $student): bool
    {
        if ($user->isAdmin()) return true;

        if ($user->isTeacher()) {
            $teacher = $user->teacher;
            return $teacher && $teacher->assignedClasses->contains('id', $student->current_class_id);
        }

        if ($user->isStudent()) {
            return $user->student && $user->student->id === $student->id;
        }

        return false;
    }

    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    public function update(User $user, Student $student): bool
    {
        return $user->isAdmin();
    }

    public function delete(User $user, Student $student): bool
    {
        return $user->isAdmin();
    }
}
