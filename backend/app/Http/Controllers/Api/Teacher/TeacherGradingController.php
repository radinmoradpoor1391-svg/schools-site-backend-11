<?php

namespace App\Http\Controllers\Api\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Grade;
use App\Models\SchoolClass;
use App\Models\Teacher;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TeacherGradingController extends Controller
{
    /**
     * Get grades for teacher's class and subject.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $teacher = $user->teacher;

        $query = Grade::with(['student', 'subject']);

        if ($request->filled('class_id')) {
            $query->where('class_id', $request->input('class_id'));
        }

        if ($request->filled('subject_id')) {
            $query->where('subject_id', $request->input('subject_id'));
        }

        if ($request->filled('month')) {
            $query->where('month', $request->input('month'));
        }

        $grades = $query->get();

        return response()->json([
            'success' => true,
            'data' => $grades,
        ]);
    }

    /**
     * Store or update student grade.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'subject_id' => 'required|exists:subjects,id',
            'class_id' => 'required|exists:school_classes,id',
            'score' => 'required|numeric|between:0,20',
            'grade_type' => 'nullable|string',
            'month' => 'nullable|string',
            'date' => 'nullable|string',
            'description' => 'nullable|string|max:500',
        ]);

        $user = $request->user();
        $teacher = $user->teacher;

        // Authorization check: Verify teacher teaches this class and subject
        $assignment = $teacher->assignments()
            ->where('class_id', $validated['class_id'])
            ->where('subject_id', $validated['subject_id'])
            ->exists();

        if (!$assignment && !$user->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'شما مجاز به ثبت نمره برای این کلاس و درس نیستید.',
            ], 403);
        }

        $grade = Grade::updateOrCreate(
            [
                'student_id' => $validated['student_id'],
                'subject_id' => $validated['subject_id'],
                'class_id' => $validated['class_id'],
                'month' => $validated['month'] ?? 'آبان',
                'grade_type' => $validated['grade_type'] ?? 'continuous',
            ],
            [
                'teacher_id' => $teacher?->id,
                'score' => $validated['score'],
                'max_score' => 20.00,
                'date' => $validated['date'] ?? date('Y/m/d'),
                'description' => $validated['description'] ?? null,
            ]
        );

        AuditLogService::log(
            'ثبت نمره کلاسی',
            'grade',
            (string)$grade->id,
            "ثبت نمره {$grade->score} برای دانش‌آموز شناسه {$grade->student_id} توسط {$teacher?->full_name}"
        );

        return response()->json([
            'success' => true,
            'message' => 'نمره با موفقیت در سامانه ثبت شد.',
            'data' => $grade->load(['student', 'subject']),
        ]);
    }
}
