<?php

namespace App\Http\Controllers\Api\Teacher;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use App\Models\SchoolClass;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TeacherAttendanceController extends Controller
{
    /**
     * Get attendance records for a class and date.
     */
    public function index(Request $request): JsonResponse
    {
        $query = AttendanceRecord::with('student');

        if ($request->filled('class_id')) {
            $query->where('class_id', $request->input('class_id'));
        }

        if ($request->filled('date')) {
            $query->where('date', $request->input('date'));
        }

        $records = $query->get();

        return response()->json([
            'success' => true,
            'data' => $records,
        ]);
    }

    /**
     * Batch save daily attendance for a class.
     */
    public function storeBatch(Request $request): JsonResponse
    {
        $request->validate([
            'class_id' => 'required|exists:school_classes,id',
            'date' => 'required|string',
            'records' => 'required|array',
            'records.*.student_id' => 'required|exists:students,id',
            'records.*.status' => 'required|in:present,absent,excused,late',
            'records.*.note' => 'nullable|string|max:255',
        ]);

        $user = $request->user();
        $teacher = $user->teacher;
        $classId = $request->input('class_id');
        $date = $request->input('date');

        DB::transaction(function () use ($request, $teacher, $classId, $date) {
            foreach ($request->input('records') as $rec) {
                AttendanceRecord::updateOrCreate(
                    [
                        'student_id' => $rec['student_id'],
                        'class_id' => $classId,
                        'date' => $date,
                    ],
                    [
                        'recorded_by_teacher_id' => $teacher?->id,
                        'status' => $rec['status'],
                        'note' => $rec['note'] ?? null,
                    ]
                );
            }
        });

        AuditLogService::log(
            'ثبت حضور و غیاب کلاسی',
            'attendance',
            (string)$classId,
            "ثبت حضور و غیاب تاریخ {$date} برای کلاس شناسه {$classId}"
        );

        return response()->json([
            'success' => true,
            'message' => 'دفتر حضور و غیاب برای تاریخ انتخاب‌شده با موفقیت ثبت شد.',
        ]);
    }
}
