<?php

namespace App\Services;

use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Grade;
use App\Models\AttendanceRecord;
use App\Models\Subject;
use Illuminate\Support\Collection;

class AcademicAnalyticsService
{
    /**
     * Persian month order for standard academic progress tracking
     */
    const PERSIAN_MONTHS = [
        'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند', 'فروردین', 'اردیبهشت', 'خرداد'
    ];

    /**
     * Calculate 9-month academic progress for a single student
     */
    public function getStudentAcademicProgress(int $studentId): array
    {
        $student = Student::with(['schoolClass', 'grades.subject'])->findOrFail($studentId);
        $allGrades = $student->grades;

        $monthlySeries = [];
        $previousGpa = null;
        $firstGpa = null;
        $lastGpa = null;

        foreach (self::PERSIAN_MONTHS as $month) {
            $monthGrades = $allGrades->filter(function ($g) use ($month) {
                return $g->month === $month;
            });

            if ($monthGrades->isEmpty()) {
                continue;
            }

            $totalWeightedScore = 0;
            $totalUnits = 0;
            $subjectBreakdown = [];

            foreach ($monthGrades as $g) {
                $units = $g->subject ? $g->subject->units : 2;
                $score = (float) $g->score;
                $totalWeightedScore += ($score * $units);
                $totalUnits += $units;

                $subjectBreakdown[] = [
                    'subject_id' => $g->subject_id,
                    'subject_title' => $g->subject ? $g->subject->title : 'نامشخص',
                    'score' => $score,
                    'grade_type' => $g->grade_type,
                ];
            }

            $gpa = $totalUnits > 0 ? round($totalWeightedScore / $totalUnits, 2) : 0;

            if ($firstGpa === null) {
                $firstGpa = $gpa;
            }
            $lastGpa = $gpa;

            $monthlySeries[] = [
                'month' => $month,
                'gpa' => $gpa,
                'subjects_count' => $monthGrades->count(),
                'subjects' => $subjectBreakdown,
            ];
        }

        // Calculate improvement or decline
        $improvementPercent = 0.0;
        $trend = 'stable';
        if ($firstGpa !== null && $lastGpa !== null && $firstGpa > 0) {
            $diff = $lastGpa - $firstGpa;
            $improvementPercent = round(($diff / $firstGpa) * 100, 1);
            if ($diff >= 0.2) {
                $trend = 'improving';
            } elseif ($diff <= -0.2) {
                $trend = 'declining';
            }
        }

        // Overall GPA
        $overallWeighted = 0;
        $overallUnits = 0;
        foreach ($allGrades as $g) {
            $units = $g->subject ? $g->subject->units : 2;
            $overallWeighted += ((float) $g->score * $units);
            $overallUnits += $units;
        }
        $overallGpa = $overallUnits > 0 ? round($overallWeighted / $overallUnits, 2) : 0;

        return [
            'student_id' => $student->id,
            'student_name' => $student->first_name . ' ' . $student->last_name,
            'student_code' => $student->student_code,
            'class_name' => $student->schoolClass ? $student->schoolClass->name : '',
            'grade_level' => $student->schoolClass ? $student->schoolClass->grade_level : '',
            'overall_gpa' => $overallGpa,
            'baseline_gpa' => $firstGpa ?? $overallGpa,
            'current_gpa' => $lastGpa ?? $overallGpa,
            'improvement_percentage' => $improvementPercent,
            'trend' => $trend,
            'monthly_series' => $monthlySeries,
        ];
    }

    /**
     * Calculate comprehensive analytics for a specific class
     */
    public function getClassAnalytics(int $classId): array
    {
        $schoolClass = SchoolClass::with([
            'students.grades.subject',
            'students.attendanceRecords',
        ])->findOrFail($classId);

        $students = $schoolClass->students;
        $studentCount = $students->count();

        $studentSummaries = [];
        $totalClassWeightedScore = 0;
        $totalClassUnits = 0;
        $totalPresentCount = 0;
        $totalAttendanceRecords = 0;
        $atRiskStudents = [];

        foreach ($students as $student) {
            $studentWeighted = 0;
            $studentUnits = 0;
            foreach ($student->grades as $g) {
                $units = $g->subject ? $g->subject->units : 2;
                $score = (float) $g->score;
                $studentWeighted += ($score * $units);
                $studentUnits += $units;
            }
            $studentGpa = $studentUnits > 0 ? round($studentWeighted / $studentUnits, 2) : 0;
            $totalClassWeightedScore += $studentWeighted;
            $totalClassUnits += $studentUnits;

            // Attendance rate
            $attendanceCount = $student->attendanceRecords->count();
            $presentCount = $student->attendanceRecords->where('status', 'present')->count();
            $attendanceRate = $attendanceCount > 0 ? round(($presentCount / $attendanceCount) * 100, 1) : 100.0;

            $totalPresentCount += $presentCount;
            $totalAttendanceRecords += $attendanceCount;

            $summary = [
                'student_id' => $student->id,
                'student_name' => $student->first_name . ' ' . $student->last_name,
                'student_code' => $student->student_code,
                'gpa' => $studentGpa,
                'attendance_rate' => $attendanceRate,
            ];

            $studentSummaries[] = $summary;

            // Risk condition: GPA < 12 or Attendance < 85%
            if ($studentGpa < 12.0 || $attendanceRate < 85.0) {
                $reasons = [];
                if ($studentGpa < 12.0) $reasons[] = 'افت معدل کلاسی زیر ۱۲';
                if ($attendanceRate < 85.0) $reasons[] = 'نرخ حضور کمتر از ۸۵٪';
                $atRiskStudents[] = array_merge($summary, ['reasons' => $reasons]);
            }
        }

        // Sort students for ranking
        usort($studentSummaries, fn($a, $b) => $b['gpa'] <=> $a['gpa']);
        $topStudents = array_slice($studentSummaries, 0, 5);

        $classAverage = $totalClassUnits > 0 ? round($totalClassWeightedScore / $totalClassUnits, 2) : 0;
        $classAttendanceRate = $totalAttendanceRecords > 0 ? round(($totalPresentCount / $totalAttendanceRecords) * 100, 1) : 95.0;

        return [
            'class_id' => $schoolClass->id,
            'class_name' => $schoolClass->name,
            'grade_level' => $schoolClass->grade_level,
            'student_count' => $studentCount,
            'class_average' => $classAverage,
            'attendance_rate' => $classAttendanceRate,
            'top_students' => $topStudents,
            'students_at_risk' => $atRiskStudents,
            'all_students_ranked' => $studentSummaries,
        ];
    }

    /**
     * Calculate school-wide academic progress summary for Admin
     */
    public function getSchoolWideProgress(): array
    {
        $classes = SchoolClass::with(['students.grades.subject'])->get();
        $classComparisons = [];

        $allSchoolWeighted = 0;
        $allSchoolUnits = 0;
        $improvingCount = 0;
        $decliningCount = 0;
        $totalStudents = 0;

        foreach ($classes as $cls) {
            $classData = $this->getClassAnalytics($cls->id);
            $classComparisons[] = [
                'class_id' => $cls->id,
                'class_name' => $cls->name,
                'grade_level' => $cls->grade_level,
                'class_average' => $classData['class_average'],
                'student_count' => $classData['student_count'],
                'attendance_rate' => $classData['attendance_rate'],
                'at_risk_count' => count($classData['students_at_risk']),
            ];

            $totalStudents += $classData['student_count'];
        }

        // Overall school GPA
        $schoolAverage = count($classComparisons) > 0
            ? round(array_sum(array_column($classComparisons, 'class_average')) / count($classComparisons), 2)
            : 0;

        return [
            'school_average' => $schoolAverage,
            'total_students' => $totalStudents,
            'total_classes' => $classes->count(),
            'class_comparisons' => $classComparisons,
            'academic_months' => self::PERSIAN_MONTHS,
        ];
    }
}
