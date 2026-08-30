<?php

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Models\ReportCard;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentReportCardController extends Controller
{
    /**
     * Get published report cards for the authenticated student.
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

        $query = ReportCard::where('student_id', $student->id)
            ->where('status', 'published');

        if ($request->filled('type')) {
            $query->where('type', $request->input('type'));
        }

        if ($request->filled('month_name')) {
            $query->where('month_name', $request->input('month_name'));
        }

        $reportCards = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $reportCards,
        ]);
    }

    public function show(ReportCard $reportCard, Request $request): JsonResponse
    {
        $student = $request->user()->student;

        if (!$student || $reportCard->student_id !== $student->id) {
            return response()->json([
                'success' => false,
                'message' => 'شما مجوز دسترسی به این کارنامه را ندارید.',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $reportCard,
        ]);
    }
}
