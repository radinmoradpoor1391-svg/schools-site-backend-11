<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreTeacherRequest;
use App\Http\Requests\Admin\UpdateTeacherRequest;
use App\Models\Teacher;
use App\Models\TeacherClassAssignment;
use App\Models\User;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AdminTeacherController extends Controller
{
    private function formatTeacher(Teacher $tc): array
    {
        return [
            'id' => (string) $tc->id,
            'userId' => (string) $tc->user_id,
            'username' => $tc->user?->username ?? $tc->national_id,
            'personnelCode' => $tc->personnel_code ?? '',
            'nationalId' => $tc->national_id,
            'firstName' => $tc->first_name,
            'lastName' => $tc->last_name,
            'specialty' => $tc->specialty ?? 'عمومی',
            'degree' => $tc->degree ?? 'کارشناسی',
            'phone' => $tc->phone ?? '',
            'email' => $tc->email ?? ($tc->user?->email ?? ''),
            'bio' => $tc->bio ?? '',
            'assignedClassIds' => $tc->assignedClasses ? $tc->assignedClasses->pluck('id')->map(fn($id) => (string)$id)->unique()->values()->toArray() : [],
            'assignedSubjectIds' => $tc->assignedSubjects ? $tc->assignedSubjects->pluck('id')->map(fn($id) => (string)$id)->unique()->values()->toArray() : [],
            'isActive' => (bool) ($tc->user?->is_active ?? $tc->is_active),
            'firstLogin' => (bool) ($tc->user?->first_login ?? $tc->first_login),
            'avatarUrl' => $tc->user?->avatar_url ?? $tc->avatar_url,
        ];
    }

    /**
     * List all teachers with assigned classes and subjects.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Teacher::with(['assignedClasses', 'assignedSubjects', 'user']);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('national_id', 'like', "%{$search}%")
                  ->orWhere('personnel_code', 'like', "%{$search}%")
                  ->orWhere('specialty', 'like', "%{$search}%");
            });
        }

        $teachers = $query->orderBy('last_name')->get()->map(function ($tc) {
            return $this->formatTeacher($tc);
        });

        return response()->json([
            'success' => true,
            'data' => $teachers,
            'count' => $teachers->count(),
        ]);
    }

    /**
     * Store new teacher.
     */
    public function store(StoreTeacherRequest $request): JsonResponse
    {
        return DB::transaction(function () use ($request) {
            $nationalId = $request->input('national_id');
            $username = $request->input('username') ?: $nationalId;
            $password = $request->input('password') ?: $nationalId;

            // 1. Create User
            $user = User::create([
                'username' => $username,
                'national_id' => $nationalId,
                'first_name' => $request->input('first_name'),
                'last_name' => $request->input('last_name'),
                'email' => $request->input('email'),
                'phone' => $request->input('phone', '۰۹۱۲۰۰۰۰۰۰۰'),
                'password' => Hash::make($password),
                'role' => 'teacher',
                'is_active' => true,
                'first_login' => false,
            ]);

            // 2. Create Teacher
            $teacher = Teacher::create([
                'user_id' => $user->id,
                'personnel_code' => $request->input('personnel_code', 'T-' . rand(100, 999)),
                'national_id' => $nationalId,
                'first_name' => $request->input('first_name'),
                'last_name' => $request->input('last_name'),
                'specialty' => $request->input('specialty', 'عمومی'),
                'degree' => $request->input('degree', 'کارشناسی ارشد'),
                'phone' => $request->input('phone', '۰۹۱۲۰۰۰۰۰۰۰'),
                'email' => $request->input('email'),
                'bio' => $request->input('bio'),
                'is_active' => true,
                'first_login' => true,
            ]);

            // 3. Attach assignments
            $classIds = $request->input('assigned_class_ids', []);
            $subjectIds = $request->input('assigned_subject_ids', []);

            if (!empty($classIds) && !empty($subjectIds)) {
                foreach ($classIds as $cId) {
                    foreach ($subjectIds as $sId) {
                        TeacherClassAssignment::firstOrCreate([
                            'teacher_id' => $teacher->id,
                            'class_id' => $cId,
                            'subject_id' => $sId,
                        ]);
                    }
                }
            }

            AuditLogService::log(
                'ثبت دبیر جدید',
                'teacher',
                (string) $teacher->id,
                "افزودن دبیر {$teacher->full_name} به کادر آموزشی"
            );

            return response()->json([
                'success' => true,
                'message' => 'دبیر با موفقیت ثبت شد.',
                'data' => $this->formatTeacher($teacher->fresh(['assignedClasses', 'assignedSubjects', 'user'])),
            ], 201);
        });
    }

    /**
     * Show teacher details.
     */
    public function show(Teacher $teacher): JsonResponse
    {
        $teacher->load(['assignedClasses', 'assignedSubjects', 'user', 'gradesGiven']);

        return response()->json([
            'success' => true,
            'data' => $this->formatTeacher($teacher),
        ]);
    }

    /**
     * Update teacher details.
     */
    public function update(UpdateTeacherRequest $request, Teacher $teacher): JsonResponse
    {
        return DB::transaction(function () use ($request, $teacher) {
            $teacher->update($request->validated());

            if ($teacher->user) {
                $userUpdates = [
                    'first_name' => $teacher->first_name,
                    'last_name' => $teacher->last_name,
                    'national_id' => $teacher->national_id,
                    'phone' => $teacher->phone,
                    'email' => $teacher->email,
                    'is_active' => $teacher->is_active,
                ];
                if ($request->filled('username')) {
                    $userUpdates['username'] = $request->input('username');
                }
                if ($request->filled('password')) {
                    $userUpdates['password'] = Hash::make($request->input('password'));
                }
                $teacher->user->update($userUpdates);
            } else {
                $user = User::create([
                    'username' => $request->input('username', $teacher->national_id),
                    'national_id' => $teacher->national_id,
                    'first_name' => $teacher->first_name,
                    'last_name' => $teacher->last_name,
                    'email' => $teacher->email,
                    'phone' => $teacher->phone,
                    'password' => Hash::make($request->input('password', $teacher->national_id)),
                    'role' => 'teacher',
                    'is_active' => $teacher->is_active ?? true,
                    'first_login' => false,
                ]);
                $teacher->update(['user_id' => $user->id]);
            }

            // Sync assignments if provided
            if ($request->has('assigned_class_ids') || $request->has('assigned_subject_ids')) {
                $classIds = $request->input('assigned_class_ids', []);
                $subjectIds = $request->input('assigned_subject_ids', []);

                TeacherClassAssignment::where('teacher_id', $teacher->id)->delete();

                if (!empty($classIds) && !empty($subjectIds)) {
                    foreach ($classIds as $cId) {
                        foreach ($subjectIds as $sId) {
                            TeacherClassAssignment::firstOrCreate([
                                'teacher_id' => $teacher->id,
                                'class_id' => $cId,
                                'subject_id' => $sId,
                            ]);
                        }
                    }
                }
            }

            AuditLogService::log(
                'ویرایش اطلاعات دبیر',
                'teacher',
                (string) $teacher->id,
                "به‌روزرسانی اطلاعات پرونده دبیر {$teacher->full_name}"
            );

            return response()->json([
                'success' => true,
                'message' => 'اطلاعات دبیر با موفقیت به‌روزرسانی شد.',
                'data' => $this->formatTeacher($teacher->fresh(['assignedClasses', 'assignedSubjects', 'user'])),
            ]);
        });
    }

    /**
     * Delete teacher.
     */
    public function destroy(Teacher $teacher): JsonResponse
    {
        return DB::transaction(function () use ($teacher) {
            $name = $teacher->full_name;
            $userId = $teacher->user_id;

            TeacherClassAssignment::where('teacher_id', $teacher->id)->delete();
            $teacher->delete();
            if ($userId) {
                User::find($userId)?->delete();
            }

            AuditLogService::log(
                'حذف دبیر',
                'teacher',
                (string) $teacher->id,
                "حذف پرونده و حساب کاربری دبیر {$name}"
            );

            return response()->json([
                'success' => true,
                'message' => 'پرونده دبیر با موفقیت حذف گردید.',
            ]);
        });
    }

    /**
     * Toggle active status.
     */
    public function toggleActive(Teacher $teacher): JsonResponse
    {
        $newStatus = !$teacher->is_active;
        $teacher->update(['is_active' => $newStatus]);
        if ($teacher->user) {
            $teacher->user->update(['is_active' => $newStatus]);
        }

        $label = $newStatus ? 'فعال' : 'غیرفعال';
        AuditLogService::log('تغییر وضعیت دبیر', 'teacher', (string)$teacher->id, "تغییر وضعیت دبیر {$teacher->full_name} به {$label}");

        return response()->json([
            'success' => true,
            'message' => "وضعیت دبیر به {$label} تغییر یافت.",
            'data' => ['isActive' => $newStatus],
        ]);
    }

    /**
     * Reset teacher password to national ID.
     */
    public function resetPassword(Teacher $teacher): JsonResponse
    {
        if ($teacher->user) {
            $teacher->user->update([
                'password' => Hash::make($teacher->national_id),
                'first_login' => true,
            ]);
            $teacher->update(['first_login' => true]);
        }

        AuditLogService::log('بازنشانی رمز عبور دبیر', 'teacher', (string)$teacher->id, "بازنشانی کلمه عبور دبیر {$teacher->full_name} به کد ملی");

        return response()->json([
            'success' => true,
            'message' => 'رمز عبور دبیر به کد ملی بازنشانی شد.',
        ]);
    }
}
