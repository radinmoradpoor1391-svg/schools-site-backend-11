<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AcademicYear extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'start_date',
        'end_date',
        'is_current',
        'is_archived',
    ];

    protected $casts = [
        'is_current' => 'boolean',
        'is_archived' => 'boolean',
    ];

    public function classes()
    {
        return $this->hasMany(SchoolClass::class);
    }

    public function grades()
    {
        return $this->hasMany(Grade::class);
    }

    public function reportCards()
    {
        return $this->hasMany(ReportCard::class);
    }

    public function enrollments()
    {
        return $this->hasMany(Enrollment::class);
    }
}
