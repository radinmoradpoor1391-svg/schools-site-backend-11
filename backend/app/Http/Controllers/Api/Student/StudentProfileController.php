<?php

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        $student = $user->student()->with(['currentClass', 'enrollments.academicYear'])->first();

        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => 'پروفایل دانش‌آموز یافت نشد.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $user,
                'student' => $student,
            ],
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $student = $request->user()->student;

        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => 'پروفایل دانش‌آموز یافت نشد.',
            ], 404);
        }

        $validated = $request->validate([
            'avatar_url' => 'nullable|string',
            'phone' => 'nullable|string|max:20',
        ]);

        if (isset($validated['avatar_url'])) {
            $student->update(['avatar_url' => $validated['avatar_url']]);
            $student->user?->update(['avatar_url' => $validated['avatar_url']]);
        }

        return response()->json([
            'success' => true,
            'message' => 'تصویر و مشخصات با موفقیت به‌روزرسانی شد.',
            'data' => $student,
        ]);
    }
}
