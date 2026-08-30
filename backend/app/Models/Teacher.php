<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Teacher extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'personnel_code',
        'national_id',
        'first_name',
        'last_name',
        'specialty',
        'degree',
        'phone',
        'email',
        'bio',
        'avatar_url',
        'is_active',
        'first_login',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'first_login' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function assignments()
    {
        return $this->hasMany(TeacherClassAssignment::class);
    }

    public function assignedClasses()
    {
        return $this->belongsToMany(SchoolClass::class, 'teacher_class_assignments', 'teacher_id', 'class_id')
                    ->withPivot('subject_id')
                    ->withTimestamps();
    }

    public function assignedSubjects()
    {
        return $this->belongsToMany(Subject::class, 'teacher_class_assignments', 'teacher_id', 'subject_id')
                    ->withPivot('class_id')
                    ->withTimestamps();
    }

    public function gradesGiven()
    {
        return $this->hasMany(Grade::class);
    }

    public function homeworks()
    {
        return $this->hasMany(Homework::class);
    }

    public function notes()
    {
        return $this->hasMany(TeacherNote::class);
    }

    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }
}
