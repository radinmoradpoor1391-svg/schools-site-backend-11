<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AcademicAnalyticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AcademicAnalyticsController extends Controller
{
    protected AcademicAnalyticsService $analyticsService;

    public function __construct(AcademicAnalyticsService $analyticsService)
    {
        $this->analyticsService = $analyticsService;
    }

    /**
     * School-wide academic progress for Admin
     */
    public function schoolProgress(): JsonResponse
    {
        $data = $this->analyticsService->getSchoolWideProgress();
        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * Academic progress for a specific student (Admin / Teacher / Student)
     */
    public function studentProgress(int $id): JsonResponse
    {
        $data = $this->analyticsService->getStudentAcademicProgress($id);
        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * Class analytics and at-risk students for Admin
     */
    public function classAnalytics(int $id): JsonResponse
    {
        $data = $this->analyticsService->getClassAnalytics($id);
        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * Student authenticated user's own academic progress
     */
    public function myProgress(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user || !$user->studentProfile) {
            return response()->json([
                'success' => false,
                'message' => 'پروفایل دانش‌آموزی یافت نشد.',
            ], 404);
        }

        $data = $this->analyticsService->getStudentAcademicProgress($user->studentProfile->id);
        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }
}
