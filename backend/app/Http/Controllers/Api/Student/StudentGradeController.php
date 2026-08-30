<?php

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Models\Grade;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentGradeController extends Controller
{
    /**
     * Get private grades exclusively for the authenticated student.
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

        $query = Grade::with(['subject', 'teacher'])
            ->where('student_id', $student->id);

        if ($request->filled('subject_id') && $request->input('subject_id') !== 'all') {
            $query->where('subject_id', $request->input('subject_id'));
        }

        if ($request->filled('month') && $request->input('month') !== 'all') {
            $query->where('month', $request->input('month'));
        }

        if ($request->filled('type') && $request->input('type') !== 'all') {
            $query->where('grade_type', $request->input('type'));
        }

        $grades = $query->latest()->get();

        return response()->json([
            'success' => true,
            'data' => $grades,
        ]);
    }
}
