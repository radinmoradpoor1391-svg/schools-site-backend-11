<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Exam extends Model
{
    use HasFactory;

    protected $table = 'exams';

    protected $fillable = [
        'school_class_id',
        'subject_id',
        'teacher_id',
        'title',
        'exam_type',
        'exam_date',
        'start_time',
        'duration_minutes',
        'max_score',
        'room_number',
        'description',
    ];

    protected $casts = [
        'duration_minutes' => 'integer',
        'max_score' => 'float',
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
}
