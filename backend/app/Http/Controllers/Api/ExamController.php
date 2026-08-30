<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExamController extends Controller
{
    /**
     * List exams with role-based filtering
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Exam::with(['schoolClass', 'subject', 'teacher']);

        if ($user && $user->role === 'student' && $user->studentProfile) {
            $query->where('school_class_id', $user->studentProfile->class_id);
        } elseif ($user && $user->role === 'teacher' && $user->teacherProfile) {
            $query->where('teacher_id', $user->teacherProfile->id);
        } elseif ($request->has('class_id')) {
            $query->where('school_class_id', $request->class_id);
        }

        $exams = $query->orderBy('exam_date')->get();

        return response()->json([
            'success' => true,
            'data' => $exams->map(function ($e) {
                return [
                    'id' => (string) $e->id,
                    'classId' => (string) $e->school_class_id,
                    'className' => $e->schoolClass ? $e->schoolClass->name : '',
                    'subjectId' => (string) $e->subject_id,
                    'subjectName' => $e->subject ? $e->subject->title : '',
                    'teacherId' => (string) $e->teacher_id,
                    'teacherName' => $e->teacher ? ($e->teacher->first_name . ' ' . $e->teacher->last_name) : '',
                    'title' => $e->title,
                    'examType' => $e->exam_type,
                    'examDate' => $e->exam_date,
                    'startTime' => substr($e->start_time, 0, 5),
                    'durationMinutes' => (int) $e->duration_minutes,
                    'maxScore' => (float) $e->max_score,
                    'roomNumber' => (int) ($e->room_number ?? 101),
                    'description' => $e->description,
                ];
            }),
        ]);
    }

    /**
     * Store a new exam (Teacher or Admin)
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $teacherId = $request->teacher_id;
        if ($user && $user->role === 'teacher' && $user->teacherProfile) {
            $teacherId = $user->teacherProfile->id;
        }

        $validated = $request->validate([
            'school_class_id' => 'required|exists:school_classes,id',
            'subject_id' => 'required|exists:subjects,id',
            'title' => 'required|string|max:200',
            'exam_type' => 'required|string',
            'exam_date' => 'required|date',
            'start_time' => 'required|string',
            'duration_minutes' => 'nullable|integer|min:15|max:240',
            'max_score' => 'nullable|numeric|min:1|max:100',
            'room_number' => 'nullable|integer',
            'description' => 'nullable|string',
        ]);

        $validated['teacher_id'] = $teacherId ?? 1;

        $exam = Exam::create($validated);
        $exam->load(['schoolClass', 'subject', 'teacher']);

        return response()->json([
            'success' => true,
            'message' => 'آزمون با موفقیت در تقویم آموزشی ثبت شد.',
            'data' => $exam,
        ], 201);
    }

    /**
     * Delete an exam
     */
    public function destroy(int $id): JsonResponse
    {
        $exam = Exam::findOrFail($id);
        $exam->delete();

        return response()->json([
            'success' => true,
            'message' => 'آزمون با موفقیت حذف شد.',
        ]);
    }
}
