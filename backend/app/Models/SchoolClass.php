<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SchoolClass extends Model
{
    use HasFactory;

    protected $table = 'school_classes';

    protected $fillable = [
        'name',
        'grade_level',
        'academic_year_id',
        'homeroom_teacher_id',
        'room_number',
        'capacity',
        'field_of_study',
    ];

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function homeroomTeacher()
    {
        return $this->belongsTo(Teacher::class, 'homeroom_teacher_id');
    }

    public function enrollments()
    {
        return $this->hasMany(Enrollment::class, 'class_id');
    }

    public function students()
    {
        return $this->belongsToMany(Student::class, 'enrollments', 'class_id', 'student_id')
                    ->withPivot('academic_year_id')
                    ->withTimestamps();
    }

    public function teacherAssignments()
    {
        return $this->hasMany(TeacherClassAssignment::class, 'class_id');
    }

    public function teachers()
    {
        return $this->belongsToMany(Teacher::class, 'teacher_class_assignments', 'class_id', 'teacher_id')
                    ->withPivot('subject_id')
                    ->withTimestamps();
    }

    public function grades()
    {
        return $this->hasMany(Grade::class, 'class_id');
    }

    public function attendanceRecords()
    {
        return $this->hasMany(AttendanceRecord::class, 'class_id');
    }

    public function homeworks()
    {
        return $this->hasMany(Homework::class, 'class_id');
    }
}
