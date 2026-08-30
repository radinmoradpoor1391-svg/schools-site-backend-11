<?php

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Models\Homework;
use App\Models\HomeworkSubmission;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentHomeworkController extends Controller
{
    /**
     * Get homeworks for student's current class along with student's submissions.
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

        $homeworks = Homework::with(['subject', 'teacher', 'submissions' => function($q) use ($student) {
            $q->where('student_id', $student->id);
        }])
        ->where('class_id', $student->current_class_id)
        ->latest()
        ->get();

        return response()->json([
            'success' => true,
            'data' => $homeworks,
        ]);
    }

    /**
     * Submit homework answer or attachment.
     */
    public function submit(Request $request, Homework $homework): JsonResponse
    {
        $student = $request->user()->student;

        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => 'پروفایل دانش‌آموز یافت نشد.',
            ], 404);
        }

        $validated = $request->validate([
            'answer_text' => 'nullable|string',
            'file_url' => 'nullable|string',
            'file_name' => 'nullable|string',
            'file_type' => 'nullable|string',
        ]);

        $submission = HomeworkSubmission::updateOrCreate(
            [
                'homework_id' => $homework->id,
                'student_id' => $student->id,
            ],
            [
                'answer_text' => $validated['answer_text'] ?? null,
                'file_url' => $validated['file_url'] ?? null,
                'file_name' => $validated['file_name'] ?? null,
                'file_type' => $validated['file_type'] ?? null,
                'status' => 'submitted',
                'submitted_at' => date('Y/m/d H:i'),
            ]
        );

        AuditLogService::log(
            'ارسال پاسخ تکلیف',
            'homework_submission',
            (string)$submission->id,
            "ارسال پاسخ تکلیف {$homework->title} توسط دانش‌آموز {$student->full_name}"
        );

        return response()->json([
            'success' => true,
            'message' => 'پاسخ و فایل تکلیف با موفقیت ارسال شد.',
            'data' => $submission,
        ]);
    }
}
