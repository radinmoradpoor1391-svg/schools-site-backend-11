<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\SchoolClass;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminClassController extends Controller
{
    private function formatClass(SchoolClass $c): array
    {
        return [
            'id' => (string) $c->id,
            'name' => $c->name,
            'gradeLevel' => $c->grade_level,
            'roomNumber' => $c->room_number ?? '',
            'fieldOfStudy' => $c->field_of_study ?? 'عمومی',
            'capacity' => (int) ($c->capacity ?? 30),
            'academicYearId' => (string) ($c->academic_year_id ?? ''),
            'homeroomTeacherId' => $c->homeroom_teacher_id ? (string) $c->homeroom_teacher_id : null,
            'studentIds' => $c->students ? $c->students->pluck('id')->map(fn($id) => (string)$id)->toArray() : [],
        ];
    }

    public function index(): JsonResponse
    {
        $classes = SchoolClass::with(['students', 'teachers', 'academicYear'])
            ->orderBy('grade_level')
            ->get()
            ->map(function ($c) {
                return $this->formatClass($c);
            });

        return response()->json([
            'success' => true,
            'data' => $classes,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $gradeLevel = $request->input('gradeLevel', $request->input('grade_level'));
        $roomNumber = $request->input('roomNumber', $request->input('room_number', ''));
        $fieldOfStudy = $request->input('fieldOfStudy', $request->input('field_of_study', 'عمومی'));
        $academicYearId = $request->input('academicYearId', $request->input('academic_year_id'));
        $homeroomTeacherId = $request->input('homeroomTeacherId', $request->input('homeroom_teacher_id'));

        if (!$academicYearId) {
            $activeYear = AcademicYear::where('is_current', true)->first();
            $academicYearId = $activeYear?->id;
        }

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'capacity' => 'nullable|integer|min:1|max:100',
        ]);

        $class = SchoolClass::create([
            'name' => $validated['name'],
            'grade_level' => $gradeLevel ?? 'هفتم',
            'room_number' => $roomNumber,
            'capacity' => $request->input('capacity', 30),
            'field_of_study' => $fieldOfStudy,
            'academic_year_id' => $academicYearId,
            'homeroom_teacher_id' => $homeroomTeacherId,
        ]);

        AuditLogService::log('ایجاد کلاس درس', 'class', (string)$class->id, "ایجاد کلاس جدید {$class->name} پایه {$class->grade_level}");

        return response()->json([
            'success' => true,
            'message' => 'کلاس با موفقیت ایجاد گردید.',
            'data' => $this->formatClass($class->load('students')),
        ], 201);
    }

    public function show(SchoolClass $class): JsonResponse
    {
        $class->load(['students', 'teachers', 'grades', 'academicYear']);

        return response()->json([
            'success' => true,
            'data' => $this->formatClass($class),
        ]);
    }

    public function update(Request $request, SchoolClass $class): JsonResponse
    {
        $data = [];
        if ($request->has('name')) $data['name'] = $request->input('name');
        if ($request->has('gradeLevel') || $request->has('grade_level')) {
            $data['grade_level'] = $request->input('gradeLevel', $request->input('grade_level'));
        }
        if ($request->has('roomNumber') || $request->has('room_number')) {
            $data['room_number'] = $request->input('roomNumber', $request->input('room_number'));
        }
        if ($request->has('capacity')) $data['capacity'] = $request->input('capacity');
        if ($request->has('fieldOfStudy') || $request->has('field_of_study')) {
            $data['field_of_study'] = $request->input('fieldOfStudy', $request->input('field_of_study'));
        }
        if ($request->has('academicYearId') || $request->has('academic_year_id')) {
            $data['academic_year_id'] = $request->input('academicYearId', $request->input('academic_year_id'));
        }
        if ($request->has('homeroomTeacherId') || $request->has('homeroom_teacher_id')) {
            $data['homeroom_teacher_id'] = $request->input('homeroomTeacherId', $request->input('homeroom_teacher_id'));
        }

        $class->update($data);

        AuditLogService::log('ویرایش کلاس درس', 'class', (string)$class->id, "به‌روزرسانی اطلاعات کلاس {$class->name}");

        return response()->json([
            'success' => true,
            'message' => 'اطلاعات کلاس با موفقیت به‌روزرسانی شد.',
            'data' => $this->formatClass($class->fresh('students')),
        ]);
    }

    public function destroy(SchoolClass $class): JsonResponse
    {
        $name = $class->name;
        $class->delete();

        AuditLogService::log('حذف کلاس درس', 'class', (string)$class->id, "حذف کلاس {$name}");

        return response()->json([
            'success' => true,
            'message' => 'کلاس با موفقیت حذف گردید.',
        ]);
    }
}
