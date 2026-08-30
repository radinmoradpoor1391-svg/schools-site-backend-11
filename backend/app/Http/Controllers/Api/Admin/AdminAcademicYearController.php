<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminAcademicYearController extends Controller
{
    private function formatYear(AcademicYear $year): array
    {
        return [
            'id' => (string) $year->id,
            'name' => $year->name,
            'startDate' => $year->start_date ?? '',
            'endDate' => $year->end_date ?? '',
            'isCurrent' => (bool) $year->is_current,
            'isArchived' => (bool) $year->is_archived,
        ];
    }

    public function index(): JsonResponse
    {
        $years = AcademicYear::orderByDesc('is_current')->orderBy('id', 'desc')->get()->map(function ($y) {
            return $this->formatYear($y);
        });

        return response()->json([
            'success' => true,
            'data' => $years,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $startDate = $request->input('startDate', $request->input('start_date'));
        $endDate = $request->input('endDate', $request->input('end_date'));
        $isCurrent = $request->boolean('isCurrent', $request->boolean('is_current', false));
        $isArchived = $request->boolean('isArchived', $request->boolean('is_archived', false));

        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:academic_years,name',
        ]);

        if ($isCurrent) {
            AcademicYear::where('is_current', true)->update(['is_current' => false]);
        }

        $year = AcademicYear::create([
            'name' => $validated['name'],
            'start_date' => $startDate,
            'end_date' => $endDate,
            'is_current' => $isCurrent,
            'is_archived' => $isArchived,
        ]);

        AuditLogService::log('ایجاد سال تحصیلی', 'academic_year', (string)$year->id, "ایجاد سال تحصیلی {$year->name}");

        return response()->json([
            'success' => true,
            'message' => 'سال تحصیلی با موفقیت ایجاد شد.',
            'data' => $this->formatYear($year),
        ], 201);
    }

    public function update(Request $request, AcademicYear $academicYear): JsonResponse
    {
        $startDate = $request->input('startDate', $request->input('start_date', $academicYear->start_date));
        $endDate = $request->input('endDate', $request->input('end_date', $academicYear->end_date));
        $isCurrent = $request->has('isCurrent') || $request->has('is_current')
            ? $request->boolean('isCurrent', $request->boolean('is_current', false))
            : $academicYear->is_current;
        $isArchived = $request->has('isArchived') || $request->has('is_archived')
            ? $request->boolean('isArchived', $request->boolean('is_archived', false))
            : $academicYear->is_archived;

        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:academic_years,name,' . $academicYear->id,
        ]);

        if ($isCurrent && !$academicYear->is_current) {
            AcademicYear::where('id', '!=', $academicYear->id)->update(['is_current' => false]);
        }

        $academicYear->update([
            'name' => $validated['name'],
            'start_date' => $startDate,
            'end_date' => $endDate,
            'is_current' => $isCurrent,
            'is_archived' => $isArchived,
        ]);

        AuditLogService::log('ویرایش سال تحصیلی', 'academic_year', (string)$academicYear->id, "ویرایش اطلاعات سال تحصیلی {$academicYear->name}");

        return response()->json([
            'success' => true,
            'message' => 'سال تحصیلی با موفقیت به‌روزرسانی شد.',
            'data' => $this->formatYear($academicYear),
        ]);
    }

    public function destroy(AcademicYear $academicYear): JsonResponse
    {
        if ($academicYear->is_current) {
            return response()->json([
                'success' => false,
                'message' => 'سال تحصیلی جاری قابل حذف نیست. لطفاً ابتدا سال دیگری را فعال کنید.',
            ], 422);
        }

        $name = $academicYear->name;
        $id = $academicYear->id;
        $academicYear->delete();

        AuditLogService::log('حذف سال تحصیلی', 'academic_year', (string)$id, "حذف سال تحصیلی {$name}");

        return response()->json([
            'success' => true,
            'message' => "سال تحصیلی {$name} حذف گردید.",
        ]);
    }

    public function setCurrent(AcademicYear $academicYear): JsonResponse
    {
        AcademicYear::where('id', '!=', $academicYear->id)->update(['is_current' => false]);
        $academicYear->update(['is_current' => true, 'is_archived' => false]);

        AuditLogService::log('فعال‌سازی سال تحصیلی', 'academic_year', (string)$academicYear->id, "تنظیم {$academicYear->name} به عنوان سال تحصیلی جاری");

        return response()->json([
            'success' => true,
            'message' => "سال تحصیلی {$academicYear->name} به عنوان سال فعال سامانه تنظیم گردید.",
            'data' => $this->formatYear($academicYear),
        ]);
    }
}
