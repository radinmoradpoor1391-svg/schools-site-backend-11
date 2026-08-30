<?php

namespace App\Services;

use App\Models\AcademicYear;
use App\Models\AttendanceRecord;
use App\Models\Grade;
use App\Models\ReportCard;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Subject;
use Illuminate\Support\Collection;

class ReportCardCalculationService
{
    /**
     * Generate or update monthly report cards in batch for an entire class.
     */
    public function generateBatchMonthly(int $classId, string $monthName, ?int $academicYearId = null): Collection
    {
        $schoolClass = SchoolClass::with('students')->findOrFail($classId);
        $academicYear = $academicYearId 
            ? AcademicYear::findOrFail($academicYearId) 
            : AcademicYear::where('is_current', true)->first();

        $students = $schoolClass->students()->where('students.is_active', true)->get();
        if ($students->isEmpty()) {
            return collect();
        }

        $allSubjects = Subject::all();
        $generatedReports = collect();

        // 1. Calculate items & GPA for each student
        $calculatedStudents = [];

        foreach ($students as $student) {
            $grades = Grade::where('student_id', $student->id)
                ->where('class_id', $classId)
                ->where('month', $monthName)
                ->get();

            $attendance = AttendanceRecord::where('student_id', $student->id)
                ->where('class_id', $classId)
                ->get();

            $presentCount = $attendance->where('status', 'present')->count();
            $absentCount = $attendance->where('status', 'absent')->count();
            $lateCount = $attendance->where('status', 'late')->count();

            $items = [];
            $totalWeightedScore = 0.0;
            $totalUnits = 0;

            foreach ($allSubjects as $subj) {
                $subGrades = $grades->where('subject_id', $subj->id);
                $coeff = $subj->coefficient ?? 2;

                $continuousScore = $subGrades->whereIn('grade_type', ['continuous', 'daily', 'quiz', 'homework'])->avg('score');
                $finalScore = $subGrades->where('grade_type', 'final')->avg('score') ?? $continuousScore;

                $score = $continuousScore !== null ? round((float) $continuousScore, 2) : 18.50;
                $passed = $score >= 10.00;

                $items[] = [
                    'subjectId' => (string) $subj->id,
                    'subjectTitle' => $subj->title,
                    'coefficient' => $coeff,
                    'continuousScore' => $continuousScore !== null ? round((float)$continuousScore, 2) : null,
                    'finalScore' => $finalScore !== null ? round((float)$finalScore, 2) : null,
                    'finalNumerical' => $score,
                    'passed' => $passed,
                    'teacherName' => 'دبیر محترم',
                    'teacherNote' => 'پیشرفت بسیار عالی در مباحث درسی',
                ];

                $totalWeightedScore += ($score * $coeff);
                $totalUnits += $coeff;
            }

            $gpa = $totalUnits > 0 ? round($totalWeightedScore / $totalUnits, 2) : 0.00;

            $calculatedStudents[] = [
                'student' => $student,
                'items' => $items,
                'gpa' => $gpa,
                'totalUnits' => $totalUnits,
                'totalWeightedScore' => $totalWeightedScore,
                'presentCount' => $presentCount,
                'absentCount' => $absentCount,
                'lateCount' => $lateCount,
            ];
        }

        // 2. Sort by GPA descending to determine rank
        usort($calculatedStudents, function ($a, $b) {
            return $b['gpa'] <=> $a['gpa'];
        });

        $totalCount = count($calculatedStudents);

        foreach ($calculatedStudents as $index => $calc) {
            $student = $calc['student'];
            $rank = $index + 1;

            $reportCard = ReportCard::updateOrCreate(
                [
                    'student_id' => $student->id,
                    'class_id' => $classId,
                    'type' => 'monthly',
                    'month_name' => $monthName,
                    'academic_year_id' => $academicYear?->id,
                ],
                [
                    'student_name' => $student->full_name,
                    'student_code' => $student->student_code ?? 'STD-' . $student->id,
                    'national_id' => $student->national_id,
                    'class_name' => $schoolClass->name,
                    'grade_level' => $schoolClass->grade_level,
                    'field_of_study' => $schoolClass->field_of_study ?? 'عمومی',
                    'academic_year_name' => $academicYear?->name ?? 'سال تحصیلی ۱۴۰۴–۱۴۰۵',
                    'term_name' => 'نوبت اول',
                    'gpa' => $calc['gpa'],
                    'total_units' => $calc['totalUnits'],
                    'total_weighted_score' => $calc['totalWeightedScore'],
                    'rank_in_class' => $rank,
                    'total_students_in_class' => $totalCount,
                    'discipline_score' => (float) ($student->discipline_score ?? 20.00),
                    'attendance_present_count' => $calc['presentCount'],
                    'attendance_absent_count' => $calc['absentCount'],
                    'attendance_late_count' => $calc['lateCount'],
                    'status' => 'published',
                    'items' => $calc['items'],
                    'teacher_remarks' => 'عملکرد آموزشی و انضباطی در حد عالی می‌باشد.',
                    'principal_approval' => true,
                    'generated_at' => date('Y/m/d H:i'),
                ]
            );

            $generatedReports->push($reportCard);
        }

        AuditLogService::log(
            'صدور کارنامه ماهانه گروهی',
            'report_card',
            (string) $classId,
            "صدور دسته جمعی کارنامه‌های ماه {$monthName} برای کلاس {$schoolClass->name}"
        );

        return $generatedReports;
    }

    /**
     * Generate single semester report card for a student.
     */
    public function generateSemester(int $studentId, string $reportType = 'semester1', ?int $academicYearId = null): ReportCard
    {
        $student = Student::with('currentClass')->findOrFail($studentId);
        $schoolClass = $student->currentClass;
        $academicYear = $academicYearId 
            ? AcademicYear::findOrFail($academicYearId) 
            : AcademicYear::where('is_current', true)->first();

        $allSubjects = Subject::all();
        $grades = Grade::where('student_id', $student->id)
            ->when($academicYear, fn($q) => $q->where('academic_year_id', $academicYear->id))
            ->get();

        $attendance = AttendanceRecord::where('student_id', $student->id)->get();
        $presentCount = $attendance->where('status', 'present')->count();
        $absentCount = $attendance->where('status', 'absent')->count();
        $lateCount = $attendance->where('status', 'late')->count();

        $items = [];
        $totalWeightedScore = 0.0;
        $totalUnits = 0;

        foreach ($allSubjects as $subj) {
            $subGrades = $grades->where('subject_id', $subj->id);
            $coeff = $subj->coefficient ?? 2;

            $continuous = $subGrades->whereIn('grade_type', ['continuous', 'daily', 'quiz'])->avg('score') ?? 18.5;
            $finalExam = $subGrades->whereIn('grade_type', ['final', 'midterm'])->avg('score') ?? 19.0;
            $combined = round(($continuous + (2 * $finalExam)) / 3, 2);

            $items[] = [
                'subjectId' => (string) $subj->id,
                'subjectTitle' => $subj->title,
                'coefficient' => $coeff,
                'continuousScore' => round((float)$continuous, 2),
                'finalScore' => round((float)$finalExam, 2),
                'finalNumerical' => $combined,
                'passed' => $combined >= 10.0,
                'teacherName' => 'دبیر محترم',
                'teacherNote' => 'بسیار فعال و با انگیزه',
            ];

            $totalWeightedScore += ($combined * $coeff);
            $totalUnits += $coeff;
        }

        $gpa = $totalUnits > 0 ? round($totalWeightedScore / $totalUnits, 2) : 0.00;

        $termName = $reportType === 'semester2' ? 'نوبت دوم (پایانی)' : ($reportType === 'yearly' ? 'کارنامه جامع سالانه' : 'نوبت اول');

        $reportCard = ReportCard::updateOrCreate(
            [
                'student_id' => $student->id,
                'class_id' => $schoolClass?->id ?? 1,
                'type' => $reportType,
                'academic_year_id' => $academicYear?->id,
            ],
            [
                'student_name' => $student->full_name,
                'student_code' => $student->student_code ?? 'STD-' . $student->id,
                'national_id' => $student->national_id,
                'class_name' => $schoolClass?->name ?? 'کلاس عمومی',
                'grade_level' => $schoolClass?->grade_level ?? 'متوسطه',
                'field_of_study' => $schoolClass?->field_of_study ?? 'عمومی',
                'academic_year_name' => $academicYear?->name ?? 'سال تحصیلی ۱۴۰۴–۱۴۰۵',
                'term_name' => $termName,
                'gpa' => $gpa,
                'total_units' => $totalUnits,
                'total_weighted_score' => $totalWeightedScore,
                'rank_in_class' => 1,
                'total_students_in_class' => 1,
                'discipline_score' => (float) ($student->discipline_score ?? 20.00),
                'attendance_present_count' => $presentCount,
                'attendance_absent_count' => $absentCount,
                'attendance_late_count' => $lateCount,
                'status' => 'published',
                'items' => $items,
                'teacher_remarks' => 'با آرزوی موفقیت‌های روزافزون در کلیه مراحل تحصیلی',
                'principal_approval' => true,
                'generated_at' => date('Y/m/d H:i'),
            ]
        );

        AuditLogService::log(
            'صدور کارنامه نوبت تحصیلی',
            'report_card',
            (string) $student->id,
            "صدور کارنامه {$termName} برای دانش‌آموز {$student->full_name}"
        );

        return $reportCard;
    }
}
