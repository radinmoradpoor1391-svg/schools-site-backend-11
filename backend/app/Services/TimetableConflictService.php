<?php

namespace App\Services;

use App\Models\SchedulePeriod;
use Illuminate\Validation\ValidationException;

class TimetableConflictService
{
    /**
     * Validate potential timetable collision before saving a schedule period
     * 
     * @throws ValidationException
     */
    public function validateNoConflict(array $data, ?int $ignoreId = null): void
    {
        $teacherId = $data['teacher_id'];
        $classId = $data['school_class_id'];
        $dayOfWeek = $data['day_of_week'];
        $periodNumber = $data['period_number'];
        $roomNumber = $data['room_number'] ?? null;

        // 1. Check Teacher Collision
        $teacherQuery = SchedulePeriod::where('teacher_id', $teacherId)
            ->where('day_of_week', $dayOfWeek)
            ->where('period_number', $periodNumber);

        if ($ignoreId) {
            $teacherQuery->where('id', '!=', $ignoreId);
        }

        if ($teacherQuery->exists()) {
            $conflict = $teacherQuery->with('schoolClass')->first();
            throw ValidationException::withMessages([
                'teacher_id' => [
                    "تداخل دبیر: دبیر انتخابی در روز {$dayOfWeek} و زنگ {$periodNumber} در کلاس {$conflict->schoolClass->name} مشغول تدریس می‌باشد."
                ]
            ]);
        }

        // 2. Check Class Collision
        $classQuery = SchedulePeriod::where('school_class_id', $classId)
            ->where('day_of_week', $dayOfWeek)
            ->where('period_number', $periodNumber);

        if ($ignoreId) {
            $classQuery->where('id', '!=', $ignoreId);
        }

        if ($classQuery->exists()) {
            $conflict = $classQuery->with('subject')->first();
            throw ValidationException::withMessages([
                'period_number' => [
                    "تداخل کلاسی: برای این کلاس در روز {$dayOfWeek} و زنگ {$periodNumber} درس {$conflict->subject->title} از قبل برنامه‌ریزی شده است."
                ]
            ]);
        }

        // 3. Check Room Collision (if room is specified)
        if ($roomNumber) {
            $roomQuery = SchedulePeriod::where('room_number', $roomNumber)
                ->where('day_of_week', $dayOfWeek)
                ->where('period_number', $periodNumber);

            if ($ignoreId) {
                $roomQuery->where('id', '!=', $ignoreId);
            }

            if ($roomQuery->exists()) {
                $conflict = $roomQuery->with('schoolClass')->first();
                throw ValidationException::withMessages([
                    'room_number' => [
                        "تداخل فضا: اتاق شماره {$roomNumber} در روز {$dayOfWeek} و زنگ {$periodNumber} توسط کلاس {$conflict->schoolClass->name} اشغال است."
                    ]
                ]);
            }
        }
    }
}
