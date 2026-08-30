<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReportCard extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'student_name',
        'student_code',
        'national_id',
        'class_id',
        'class_name',
        'grade_level',
        'field_of_study',
        'academic_year_id',
        'academic_year_name',
        'type',
        'month_name',
        'term_name',
        'gpa',
        'total_units',
        'total_weighted_score',
        'rank_in_class',
        'total_students_in_class',
        'discipline_score',
        'attendance_present_count',
        'attendance_absent_count',
        'attendance_late_count',
        'status',
        'items',
        'teacher_remarks',
        'principal_approval',
        'generated_at',
    ];

    protected $casts = [
        'gpa' => 'float',
        'total_units' => 'integer',
        'total_weighted_score' => 'float',
        'rank_in_class' => 'integer',
        'total_students_in_class' => 'integer',
        'discipline_score' => 'float',
        'attendance_present_count' => 'integer',
        'attendance_absent_count' => 'integer',
        'attendance_late_count' => 'integer',
        'principal_approval' => 'boolean',
        'items' => 'array',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function schoolClass()
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }
}
