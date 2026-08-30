<?php

namespace App\Http\Controllers\Api\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Homework;
use App\Models\HomeworkSubmission;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TeacherHomeworkController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $teacher = $user->teacher;

        $query = Homework::with(['schoolClass', 'subject', 'submissions.student']);

        if ($teacher) {
            $query->where('teacher_id', $teacher->id);
        }

        $homeworks = $query->latest()->get();

        return response()->json([
            'success' => true,
            'data' => $homeworks,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'class_id' => 'required|exists:school_classes,id',
            'subject_id' => 'required|exists:subjects,id',
            'title' => 'required|string|max:200',
            'description' => 'required|string',
            'due_date' => 'required|string',
            'attachment_name' => 'nullable|string',
            'attachment_url' => 'nullable|string',
        ]);

        $user = $request->user();
        $validated['teacher_id'] = $user->teacher?->id ?? 1;

        $homework = Homework::create($validated);

        AuditLogService::log('تعریف تکلیف جدید', 'homework', (string)$homework->id, "ثبت تکلیف: {$homework->title}");

        return response()->json([
            'success' => true,
            'message' => 'تکلیف با موفقیت تعریف شد.',
            'data' => $homework->load(['schoolClass', 'subject']),
        ], 201);
    }

    public function gradeSubmission(Request $request, HomeworkSubmission $submission): JsonResponse
    {
        $validated = $request->validate([
            'grade' => 'required|numeric|between:0,20',
            'feedback' => 'nullable|string|max:500',
        ]);

        $submission->update([
            'grade' => $validated['grade'],
            'feedback' => $validated['feedback'] ?? null,
            'status' => 'graded',
        ]);

        AuditLogService::log('نمره‌دهی تکلیف', 'submission', (string)$submission->id, "ثبت نمره تکلیف برای دانش‌آموز شناسه {$submission->student_id}");

        return response()->json([
            'success' => true,
            'message' => 'نمره و بازخورد تکلیف با موفقیت ثبت شد.',
            'data' => $submission->load('student'),
        ]);
    }

    public function destroy(Homework $homework): JsonResponse
    {
        $title = $homework->title;
        $homework->delete();

        AuditLogService::log('حذف تکلیف', 'homework', (string)$homework->id, "حذف تکلیف: {$title}");

        return response()->json([
            'success' => true,
            'message' => 'تکلیف با موفقیت حذف گردید.',
        ]);
    }
}
