<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ReportCard;
use App\Services\ReportCardCalculationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminReportCardController extends Controller
{
    protected ReportCardCalculationService $calculator;

    public function __construct(ReportCardCalculationService $calculator)
    {
        $this->calculator = $calculator;
    }

    private function formatReportCard(ReportCard $rc): array
    {
        return [
            'id' => (string) $rc->id,
            'studentId' => (string) $rc->student_id,
            'studentName' => $rc->student ? ($rc->student->first_name . ' ' . $rc->student->last_name) : '',
            'studentCode' => $rc->student?->student_code ?? '',
            'classId' => (string) $rc->class_id,
            'className' => $rc->schoolClass?->name ?? '',
            'academicYearId' => (string) ($rc->academic_year_id ?? ''),
            'academicYearName' => $rc->academicYear?->name ?? 'سال تحصیلی جاری',
            'type' => $rc->type,
            'monthName' => $rc->month_name,
            'gpa' => (float) $rc->gpa,
            'rankInClass' => (int) ($rc->rank_in_class ?? 1),
            'rankInGrade' => (int) ($rc->rank_in_grade ?? 1),
            'totalUnits' => (int) ($rc->total_units ?? 0),
            'totalWeightedScore' => (float) ($rc->total_weighted_score ?? 0),
            'items' => $rc->items ?? [],
            'attendanceSummary' => $rc->attendance_summary ?? [
                'totalDays' => 30,
                'present' => 30,
                'absent' => 0,
                'justified' => 0,
                'tardy' => 0,
            ],
            'disciplineScore' => (float) ($rc->discipline_score ?? 20.00),
            'status' => $rc->is_published ? 'published' : 'draft',
            'isPublished' => (bool) $rc->is_published,
            'generatedAt' => (string) ($rc->issue_date ?? $rc->created_at),
            'managerNote' => $rc->manager_note ?? '',
            'adviserNote' => $rc->adviser_note ?? '',
        ];
    }

    public function index(Request $request): JsonResponse
    {
        $query = ReportCard::with(['student', 'schoolClass', 'academicYear']);

        $classId = $request->input('class_id', $request->input('classId'));
        if ($classId) {
            $query->where('class_id', $classId);
        }

        if ($request->filled('type')) {
            $query->where('type', $request->input('type'));
        }

        $monthName = $request->input('month_name', $request->input('monthName'));
        if ($monthName) {
            $query->where('month_name', $monthName);
        }

        $reports = $query->orderBy('rank_in_class')->get()->map(function ($rc) {
            return $this->formatReportCard($rc);
        });

        return response()->json([
            'success' => true,
            'data' => $reports,
        ]);
    }

    /**
     * Batch generation of monthly report cards for a class.
     */
    public function generateBatchMonthly(Request $request): JsonResponse
    {
        $classId = $request->input('class_id', $request->input('classId'));
        $monthName = $request->input('month_name', $request->input('monthName'));
        $academicYearId = $request->input('academic_year_id', $request->input('academicYearId'));

        if (!$classId || !$monthName) {
            return response()->json([
                'success' => false,
                'message' => 'شناسه کلاس و نام ماه الزامی است.',
            ], 422);
        }

        $reports = $this->calculator->generateBatchMonthly(
            (int) $classId,
            $monthName,
            $academicYearId ? (int) $academicYearId : null
        );

        $formatted = $reports->map(function ($rc) {
            return $this->formatReportCard($rc);
        });

        return response()->json([
            'success' => true,
            'message' => 'کارنامه‌های ماهانه برای کلیه دانش‌آموزان کلاس با موفقیت صادر و رتبه‌بندی شد.',
            'count' => $reports->count(),
            'data' => $formatted,
        ]);
    }

    /**
     * Generate semester report card for a single student.
     */
    public function generateSemester(Request $request): JsonResponse
    {
        $studentId = $request->input('student_id', $request->input('studentId'));
        $type = $request->input('type');
        $academicYearId = $request->input('academic_year_id', $request->input('academicYearId'));

        if (!$studentId || !$type) {
            return response()->json([
                'success' => false,
                'message' => 'شناسه دانش‌آموز و نوع نوبت الزامی است.',
            ], 422);
        }

        $report = $this->calculator->generateSemester(
            (int) $studentId,
            $type,
            $academicYearId ? (int) $academicYearId : null
        );

        return response()->json([
            'success' => true,
            'message' => 'کارنامه نوبت تحصیلی با موفقیت محاسبه و صادر گردید.',
            'data' => $this->formatReportCard($report),
        ]);
    }
}
