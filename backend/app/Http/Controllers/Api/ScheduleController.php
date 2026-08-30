<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SchedulePeriod;
use App\Models\SchoolClass;
use App\Models\Teacher;
use App\Services\TimetableConflictService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ScheduleController extends Controller
{
    protected TimetableConflictService $conflictService;

    public function __construct(TimetableConflictService $conflictService)
    {
        $this->conflictService = $conflictService;
    }

    /**
     * Get timetable schedule periods with optional filters: class_id, teacher_id, day_of_week
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = SchedulePeriod::with(['schoolClass', 'subject', 'teacher']);

        // Role-based restrictions
        $student = $user?->student;
        $teacher = $user?->teacher;

        if ($user && $user->role === 'student' && $student) {
            if ($student->current_class_id) {
                $query->where('school_class_id', $student->current_class_id);
            }
        } elseif ($user && $user->role === 'teacher' && $teacher) {
            if ($request->has('view_all') && $request->view_all === 'true') {
                // allow full view if requested
            } else {
                $query->where('teacher_id', $teacher->id);
            }
        } elseif ($request->has('class_id')) {
            $query->where('school_class_id', $request->class_id);
        } elseif ($request->has('teacher_id')) {
            $query->where('teacher_id', $request->teacher_id);
        }

        if ($request->has('day_of_week')) {
            $query->where('day_of_week', $request->day_of_week);
        }

        $schedules = $query->orderBy('period_number')->get();

        $dayMap = [
            'شنبه' => 0,
            'یکشنبه' => 1,
            'دوشنبه' => 2,
            'سه‌شنبه' => 3,
            'چهارشنبه' => 4,
            'پنج‌شنبه' => 5,
        ];

        return response()->json([
            'success' => true,
            'data' => $schedules->map(function ($s) use ($dayMap) {
                return [
                    'id' => (string) $s->id,
                    'classId' => (string) $s->school_class_id,
                    'className' => $s->schoolClass ? $s->schoolClass->name : '',
                    'gradeLevel' => $s->schoolClass ? $s->schoolClass->grade_level : '',
                    'teacherId' => (string) $s->teacher_id,
                    'teacherName' => $s->teacher ? ($s->teacher->first_name . ' ' . $s->teacher->last_name) : '',
                    'subjectId' => (string) $s->subject_id,
                    'subjectTitle' => $s->subject ? $s->subject->title : '',
                    'subjectName' => $s->subject ? $s->subject->title : '',
                    'dayOfWeek' => $dayMap[$s->day_of_week] ?? 0,
                    'dayName' => $s->day_of_week,
                    'periodNumber' => (int) $s->period_number,
                    'startTime' => substr($s->start_time, 0, 5),
                    'endTime' => substr($s->end_time, 0, 5),
                    'roomNumber' => (string) ($s->room_number ?? ($s->schoolClass->room_number ?? '101')),
                ];
            }),
        ]);
    }

    /**
     * Store a newly created schedule period (Admin only)
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'school_class_id' => 'required|exists:school_classes,id',
            'subject_id' => 'required|exists:subjects,id',
            'teacher_id' => 'required|exists:teachers,id',
            'day_of_week' => 'required|in:شنبه,یکشنبه,دوشنبه,سه‌شنبه,چهارشنبه,پنج‌شنبه',
            'period_number' => 'required|integer|min:1|max:6',
            'start_time' => 'required|string',
            'end_time' => 'required|string',
            'room_number' => 'nullable|integer',
        ]);

        $this->conflictService->validateNoConflict($validated);

        $period = SchedulePeriod::create($validated);
        $period->load(['schoolClass', 'subject', 'teacher']);

        return response()->json([
            'success' => true,
            'message' => 'زنگ آموزشی با موفقیت در برنامه هفتگی ثبت شد.',
            'data' => $period,
        ], 201);
    }

    /**
     * Update an existing schedule period
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $period = SchedulePeriod::findOrFail($id);

        $validated = $request->validate([
            'school_class_id' => 'sometimes|exists:school_classes,id',
            'subject_id' => 'sometimes|exists:subjects,id',
            'teacher_id' => 'sometimes|exists:teachers,id',
            'day_of_week' => 'sometimes|in:شنبه,یکشنبه,دوشنبه,سه‌شنبه,چهارشنبه,پنج‌شنبه',
            'period_number' => 'sometimes|integer|min:1|max:6',
            'start_time' => 'sometimes|string',
            'end_time' => 'sometimes|string',
            'room_number' => 'nullable|integer',
        ]);

        $mergedData = array_merge($period->toArray(), $validated);
        $this->conflictService->validateNoConflict($mergedData, $period->id);

        $period->update($validated);
        $period->load(['schoolClass', 'subject', 'teacher']);

        return response()->json([
            'success' => true,
            'message' => 'زنگ آموزشی با موفقیت ویرایش شد.',
            'data' => $period,
        ]);
    }

    /**
     * Remove a schedule period
     */
    public function destroy(int $id): JsonResponse
    {
        $period = SchedulePeriod::findOrFail($id);
        $period->delete();

        return response()->json([
            'success' => true,
            'message' => 'زنگ آموزشی با موفقیت از برنامه حذف شد.',
        ]);
    }
}
