<?php

namespace App\Policies;

use App\Models\Grade;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;

class GradePolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Grade $grade): bool
    {
        if ($user->isAdmin()) return true;

        if ($user->isTeacher()) {
            $teacher = $user->teacher;
            return $teacher && ($grade->teacher_id === $teacher->id || $teacher->assignedClasses->contains('id', $grade->class_id));
        }

        if ($user->isStudent()) {
            return $user->student && $grade->student_id === $user->student->id;
        }

        return false;
    }

    public function create(User $user): bool
    {
        return $user->isAdmin() || $user->isTeacher();
    }

    public function update(User $user, Grade $grade): bool
    {
        if ($user->isAdmin()) return true;

        if ($user->isTeacher()) {
            $teacher = $user->teacher;
            return $teacher && $grade->teacher_id === $teacher->id;
        }

        return false;
    }

    public function delete(User $user, Grade $grade): bool
    {
        return $user->isAdmin();
    }
}
