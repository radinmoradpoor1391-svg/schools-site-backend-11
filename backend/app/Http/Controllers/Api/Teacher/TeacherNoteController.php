<?php

namespace App\Http\Controllers\Api\Teacher;

use App\Http\Controllers\Controller;
use App\Models\TeacherNote;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TeacherNoteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $teacher = $user->teacher;

        $notes = TeacherNote::with(['student', 'subject'])
            ->when($teacher, fn($q) => $q->where('teacher_id', $teacher->id))
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $notes,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'subject_id' => 'nullable|exists:subjects,id',
            'category' => 'required|in:behavior,academic,strength,improvement',
            'content' => 'required|string',
            'date' => 'nullable|string',
            'is_private_to_admin' => 'nullable|boolean',
        ]);

        $user = $request->user();
        $validated['teacher_id'] = $user->teacher?->id ?? 1;
        $validated['date'] = $validated['date'] ?? date('Y/m/d');

        $note = TeacherNote::create($validated);

        AuditLogService::log('ثبت یادداشت آموزشی/انضباطی', 'teacher_note', (string)$note->id, "ثبت یادداشت برای دانش‌آموز شناسه {$note->student_id}");

        return response()->json([
            'success' => true,
            'message' => 'یادداشت آموزشی با موفقیت ثبت گردید.',
            'data' => $note->load(['student', 'subject']),
        ], 201);
    }
}
