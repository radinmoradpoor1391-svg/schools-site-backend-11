<?php

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentAttendanceController extends Controller
{
    /**
     * Get attendance records exclusively for the authenticated student.
     */
    public function index(Request $request): JsonResponse
    {
        $student = $request->user()->student;

        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => 'پروفایل دانش‌آموز یافت نشد.',
            ], 404);
        }

        $records = AttendanceRecord::where('student_id', $student->id)->orderBy('date', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $records,
            'summary' => [
                'present' => $records->where('status', 'present')->count(),
                'absent' => $records->where('status', 'absent')->count(),
                'excused' => $records->where('status', 'excused')->count(),
                'late' => $records->where('status', 'late')->count(),
                'total' => $records->count(),
            ],
        ]);
    }
}
