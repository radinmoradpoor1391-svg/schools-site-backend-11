<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\Grade;
use App\Models\Student;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminGradeController extends Controller
{
    private function formatGrade(Grade $g): array
    {
        return [
            'id' => (string) $g->id,
            'studentId' => (string) $g->student_id,
            'studentName' => $g->student ? ($g->student->first_name . ' ' . $g->student->last_name) : '',
            'teacherId' => $g->teacher_id ? (string) $g->teacher_id : '',
            'teacherName' => $g->teacher ? ($g->teacher->first_name . ' ' . $g->teacher->last_name) : '',
            'subjectId' => (string) $g->subject_id,
            'subjectTitle' => $g->subject?->title ?? '',
            'classId' => (string) ($g->class_id ?? $g->student?->current_class_id ?? ''),
            'score' => (float) $g->score,
            'maxScore' => (float) ($g->max_score ?? 20.00),
            'gradeType' => $g->grade_type ?? 'daily',
            'date' => $g->date ?? '',
            'month' => $g->month ?? '',
            'semester' => $g->semester ?? 'semester1',
            'academicYearId' => (string) ($g->academic_year_id ?? ''),
            'description' => $g->description ?? '',
            'createdAt' => (string) $g->created_at,
        ];
    }

    /**
     * Complete grade oversight and search with comprehensive filters.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Grade::with(['student', 'teacher', 'subject', 'schoolClass']);

        $studentId = $request->input('student_id', $request->input('studentId'));
        if ($studentId) {
            $query->where('student_id', $studentId);
        }

        $classId = $request->input('class_id', $request->input('classId'));
        if ($classId) {
            $query->where('class_id', $classId);
        }

        $subjectId = $request->input('subject_id', $request->input('subjectId'));
        if ($subjectId) {
            $query->where('subject_id', $subjectId);
        }

        $teacherId = $request->input('teacher_id', $request->input('teacherId'));
        if ($teacherId) {
            $query->where('teacher_id', $teacherId);
        }

        if ($request->filled('date')) {
            $query->where('date', $request->input('date'));
        }

        if ($request->filled('month')) {
            $query->where('month', $request->input('month'));
        }

        $gradeType = $request->input('grade_type', $request->input('gradeType'));
        if ($gradeType) {
            $query->where('grade_type', $gradeType);
        }

        $grades = $query->latest('id')->get()->map(function ($g) {
            return $this->formatGrade($g);
        });

        return response()->json([
            'success' => true,
            'data' => $grades,
            'count' => $grades->count(),
        ]);
    }

    /**
     * Admin records or registers a grade directly.
     */
    public function store(Request $request): JsonResponse
    {
        $studentId = $request->input('student_id', $request->input('studentId'));
        $subjectId = $request->input('subject_id', $request->input('subjectId'));
        $teacherId = $request->input('teacher_id', $request->input('teacherId'));
        $classId = $request->input('class_id', $request->input('classId'));
        $score = $request->input('score');
        $maxScore = $request->input('max_score', $request->input('maxScore', 20.00));
        $gradeType = $request->input('grade_type', $request->input('gradeType', 'daily'));
        $date = $request->input('date', date('Y/m/d'));
        $month = $request->input('month', 'مهر');
        $semester = $request->input('semester', 'semester1');
        $description = $request->input('description', '');

        $student = Student::findOrFail($studentId);

        if (empty($classId)) {
            $classId = $student->current_class_id;
        }

        $activeYear = AcademicYear::where('is_current', true)->first();

        $grade = Grade::create([
            'student_id' => $studentId,
            'subject_id' => $subjectId,
            'teacher_id' => $teacherId,
            'class_id' => $classId,
            'score' => $score,
            'max_score' => $maxScore,
            'grade_type' => $gradeType,
            'date' => $date,
            'month' => $month,
            'semester' => $semester,
            'academic_year_id' => $activeYear?->id,
            'description' => $description,
        ]);

        AuditLogService::log(
            'ثبت نمره توسط مدیر',
            'grade',
            (string)$grade->id,
            "ثبت نمره {$grade->score} برای دانش‌آموز {$student->full_name} در درس شناسه {$grade->subject_id}"
        );

        return response()->json([
            'success' => true,
            'message' => 'نمره با موفقیت ثبت شد.',
            'data' => $this->formatGrade($grade->load(['student', 'teacher', 'subject', 'schoolClass'])),
        ], 201);
    }

    /**
     * Update an existing grade.
     */
    public function update(Request $request, Grade $grade): JsonResponse
    {
        $data = [];
        if ($request->has('score')) $data['score'] = $request->input('score');
        if ($request->has('maxScore') || $request->has('max_score')) {
            $data['max_score'] = $request->input('maxScore', $request->input('max_score'));
        }
        if ($request->has('gradeType') || $request->has('grade_type')) {
            $data['grade_type'] = $request->input('gradeType', $request->input('grade_type'));
        }
        if ($request->has('date')) $data['date'] = $request->input('date');
        if ($request->has('month')) $data['month'] = $request->input('month');
        if ($request->has('semester')) $data['semester'] = $request->input('semester');
        if ($request->has('description')) $data['description'] = $request->input('description');

        $grade->update($data);

        AuditLogService::log(
            'ویرایش نمره',
            'grade',
            (string)$grade->id,
            "به‌روزرسانی نمره شناسه {$grade->id}"
        );

        return response()->json([
            'success' => true,
            'message' => 'نمره با موفقیت به‌روزرسانی شد.',
            'data' => $this->formatGrade($grade->fresh(['student', 'teacher', 'subject', 'schoolClass'])),
        ]);
    }

    /**
     * Delete a grade.
     */
    public function destroy(Grade $grade): JsonResponse
    {
        $id = $grade->id;
        $grade->delete();

        AuditLogService::log('حذف نمره', 'grade', (string)$id, "حذف نمره شناسه {$id}");

        return response()->json([
            'success' => true,
            'message' => 'نمره با موفقیت حذف گردید.',
        ]);
    }
}
