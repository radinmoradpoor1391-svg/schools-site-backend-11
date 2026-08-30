<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'student_code',
        'national_id',
        'first_name',
        'last_name',
        'father_name',
        'birth_date',
        'current_class_id',
        'grade_level',
        'field_of_study',
        'parent_phone',
        'address',
        'avatar_url',
        'discipline_score',
        'is_active',
        'first_login',
    ];

    protected $casts = [
        'discipline_score' => 'float',
        'is_active' => 'boolean',
        'first_login' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function currentClass()
    {
        return $this->belongsTo(SchoolClass::class, 'current_class_id');
    }

    public function enrollments()
    {
        return $this->hasMany(Enrollment::class);
    }

    public function classes()
    {
        return $this->belongsToMany(SchoolClass::class, 'enrollments', 'student_id', 'class_id')
                    ->withPivot('academic_year_id')
                    ->withTimestamps();
    }

    public function grades()
    {
        return $this->hasMany(Grade::class);
    }

    public function attendanceRecords()
    {
        return $this->hasMany(AttendanceRecord::class);
    }

    public function submissions()
    {
        return $this->hasMany(HomeworkSubmission::class);
    }

    public function notes()
    {
        return $this->hasMany(TeacherNote::class);
    }

    public function reportCards()
    {
        return $this->hasMany(ReportCard::class);
    }

    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }
}
