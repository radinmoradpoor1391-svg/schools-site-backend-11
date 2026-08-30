<?php

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Models\TeacherNote;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentNoteController extends Controller
{
    /**
     * Get educational and behavioral notes for the student (excluding admin-private notes).
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

        $notes = TeacherNote::with(['teacher', 'subject'])
            ->where('student_id', $student->id)
            ->where('is_private_to_admin', false)
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $notes,
        ]);
    }
}
