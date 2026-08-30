<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Subject extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'code',
        'coefficient',
        'grade_level',
        'description',
    ];

    protected $casts = [
        'coefficient' => 'integer',
    ];

    public function teacherAssignments()
    {
        return $this->hasMany(TeacherClassAssignment::class);
    }

    public function grades()
    {
        return $this->hasMany(Grade::class);
    }

    public function homeworks()
    {
        return $this->hasMany(Homework::class);
    }
}
