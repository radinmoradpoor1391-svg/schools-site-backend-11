<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SchedulePeriod extends Model
{
    use HasFactory;

    protected $table = 'schedule_periods';

    protected $fillable = [
        'school_class_id',
        'subject_id',
        'teacher_id',
        'academic_year_id',
        'day_of_week',
        'period_number',
        'start_time',
        'end_time',
        'room_number',
    ];

    protected $casts = [
        'period_number' => 'integer',
        'room_number' => 'integer',
    ];

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'school_class_id');
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class, 'subject_id');
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class, 'teacher_id');
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class, 'academic_year_id');
    }
}
