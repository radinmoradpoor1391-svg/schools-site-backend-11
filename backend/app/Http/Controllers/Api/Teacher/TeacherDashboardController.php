<?php

namespace App\Http\Controllers\Api\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Grade;
use App\Models\Homework;
use App\Models\Teacher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TeacherDashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $teacher = $user->teacher()->with(['assignedClasses.students', 'assignedSubjects'])->first();

        if (!$teacher) {
            return response()->json([
                'success' => false,
                'message' => 'پروفایل دبیر یافت نشد.',
            ], 404);
        }

        $assignedClasses = $teacher->assignedClasses;
        $totalStudents = $assignedClasses->flatMap->students->unique('id')->count();
        $totalGradesGiven = Grade::where('teacher_id', $teacher->id)->count();
        $activeHomeworks = Homework::where('teacher_id', $teacher->id)->where('status', 'active')->count();

        return response()->json([
            'success' => true,
            'data' => [
                'teacher' => $teacher,
                'assignedClasses' => $assignedClasses,
                'assignedSubjects' => $teacher->assignedSubjects,
                'metrics' => [
                    'classesCount' => $assignedClasses->count(),
                    'studentsCount' => $totalStudents,
                    'gradesGivenCount' => $totalGradesGiven,
                    'activeHomeworksCount' => $activeHomeworks,
                ],
            ],
        ]);
    }
}
