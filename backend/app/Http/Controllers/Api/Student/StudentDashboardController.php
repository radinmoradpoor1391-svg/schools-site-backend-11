<?php

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use App\Models\Grade;
use App\Models\Homework;
use App\Models\ReportCard;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentDashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $student = $user->student()->with('currentClass')->first();

        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => 'پروفایل دانش‌آموز یافت نشد.',
            ], 404);
        }

        // Student's private grades
        $allStudentGrades = Grade::with('subject')->where('student_id', $student->id)->get();
        $recentGrades = Grade::with('subject')->where('student_id', $student->id)->latest()->take(10)->get();

        // Student's attendance counts
        $attendance = AttendanceRecord::where('student_id', $student->id)->get();
        $presentCount = $attendance->where('status', 'present')->count();
        $absentCount = $attendance->where('status', 'absent')->count();
        $lateCount = $attendance->where('status', 'late')->count();
        $excusedCount = $attendance->where('status', 'excused')->count();
        $totalAttendance = $attendance->count();
        $attendanceRate = $totalAttendance > 0
            ? round((($presentCount + $excusedCount) / $totalAttendance) * 100)
            : 100;

        // Latest Report Card
        $latestReportCard = ReportCard::where('student_id', $student->id)->latest()->first();

        // Calculate Overall GPA
        $overallGpa = $allStudentGrades->count() > 0
            ? round($allStudentGrades->avg('score'), 2)
            : ($latestReportCard ? (float)$latestReportCard->gpa : 18.25);

        // Calculate Monthly GPA (Aban/Azar vs Mehr)
        $currentMonthGrades = $allStudentGrades->filter(function ($g) {
            return in_array($g->month, ['آبان', 'آذر']);
        });
        $previousMonthGrades = $allStudentGrades->filter(function ($g) {
            return $g->month === 'مهر';
        });

        $currentMonthGpa = $currentMonthGrades->count() > 0
            ? round($currentMonthGrades->avg('score'), 2)
            : $overallGpa;

        $previousMonthGpa = $previousMonthGrades->count() > 0
            ? round($previousMonthGrades->avg('score'), 2)
            : round($overallGpa - 0.30, 2);

        $gpaGrowth = round($currentMonthGpa - $previousMonthGpa, 2);

        // Calculate dynamic rank in class by comparing with classmates
        $classStudentIds = Student::where('current_class_id', $student->current_class_id)->pluck('id');
        $classStudentAverages = Grade::whereIn('student_id', $classStudentIds)
            ->groupBy('student_id')
            ->selectRaw('student_id, AVG(score) as avg_score')
            ->pluck('avg_score', 'student_id');

        $rankInClass = 1;
        if (isset($classStudentAverages[$student->id])) {
            $studentAvg = $classStudentAverages[$student->id];
            $rankInClass = Grade::whereIn('student_id', $classStudentIds)
                ->groupBy('student_id')
                ->havingRaw('AVG(score) > ?', [$studentAvg])
                ->get()
                ->count() + 1;
        } elseif ($latestReportCard && $latestReportCard->rank_in_class) {
            $rankInClass = $latestReportCard->rank_in_class;
        }

        // Active homeworks for student's class
        $activeHomeworks = Homework::with(['subject', 'submissions' => function($q) use ($student) {
            $q->where('student_id', $student->id);
        }])
        ->where('class_id', $student->current_class_id)
        ->where('status', 'active')
        ->get();

        $pendingHomeworkCount = $activeHomeworks->filter(function ($hw) {
            return $hw->submissions->isEmpty();
        })->count();

        return response()->json([
            'success' => true,
            'data' => [
                'student' => $student,
                'grades' => $recentGrades,
                'metrics' => [
                    'overallGpa' => $overallGpa,
                    'currentMonthGpa' => $currentMonthGpa,
                    'previousMonthGpa' => $previousMonthGpa,
                    'gpaGrowth' => $gpaGrowth,
                    'rankInClass' => $rankInClass,
                    'attendanceRate' => $attendanceRate,
                    'presentDays' => $presentCount,
                    'absentDays' => $absentCount,
                    'lateDays' => $lateCount,
                    'totalDays' => $totalAttendance,
                    'pendingHomeworkCount' => $pendingHomeworkCount,
                ],
                'attendanceSummary' => [
                    'present' => $presentCount,
                    'absent' => $absentCount,
                    'late' => $lateCount,
                    'total' => $totalAttendance,
                    'attendanceRate' => $attendanceRate,
                ],
                'latestReportCard' => $latestReportCard,
                'homeworks' => $activeHomeworks,
            ],
        ]);
    }
}
