<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreStudentRequest;
use App\Http\Requests\Admin\UpdateStudentRequest;
use App\Models\Enrollment;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\User;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AdminStudentController extends Controller
{
    private function formatStudent(Student $st): array
    {
        return [
            'id' => (string) $st->id,
            'userId' => (string) $st->user_id,
            'studentCode' => $st->student_code ?? '',
            'nationalId' => $st->national_id,
            'firstName' => $st->first_name,
            'lastName' => $st->last_name,
            'fatherName' => $st->father_name ?? '',
            'birthDate' => $st->birth_date ?? '',
            'classId' => $st->current_class_id ? (string) $st->current_class_id : '',
            'className' => $st->currentClass?->name ?? '',
            'gradeLevel' => $st->grade_level ?? '',
            'fieldOfStudy' => $st->field_of_study ?? 'عمومی',
            'parentPhone' => $st->parent_phone ?? '',
            'address' => $st->address ?? '',
            'disciplineScore' => (float) ($st->discipline_score ?? 20),
            'isActive' => (bool) ($st->user?->is_active ?? $st->is_active),
            'firstLogin' => (bool) ($st->user?->first_login ?? $st->first_login),
            'avatarUrl' => $st->user?->avatar_url ?? $st->avatar_url,
        ];
    }

    /**
     * List all students with class information and filters.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Student::with(['currentClass', 'user']);

        if ($request->filled('class_id') || $request->filled('classId')) {
            $classId = $request->input('class_id', $request->input('classId'));
            $query->where('current_class_id', $classId);
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('national_id', 'like', "%{$search}%")
                  ->orWhere('student_code', 'like', "%{$search}%");
            });
        }

        $students = $query->orderBy('last_name')->get()->map(function ($st) {
            return $this->formatStudent($st);
        });

        return response()->json([
            'success' => true,
            'data' => $students,
            'count' => $students->count(),
        ]);
    }

    /**
     * Create a new student and its matching User account.
     */
    public function store(StoreStudentRequest $request): JsonResponse
    {
        return DB::transaction(function () use ($request) {
            $nationalId = $request->input('national_id');
            $username = $request->input('username') ?: $nationalId;
            $password = $request->input('password') ?: $nationalId;

            // 1. Create User account
            $user = User::create([
                'username' => $username,
                'national_id' => $nationalId,
                'first_name' => $request->input('first_name'),
                'last_name' => $request->input('last_name'),
                'phone' => $request->input('parent_phone'),
                'password' => Hash::make($password),
                'role' => 'student',
                'is_active' => true,
                'first_login' => false,
            ]);

            // 2. Determine class details
            $classId = $request->input('class_id');
            $gradeLevel = $request->input('grade_level');
            $fieldOfStudy = $request->input('field_of_study', 'عمومی');

            if ($classId) {
                $schoolClass = SchoolClass::find($classId);
                if ($schoolClass) {
                    $gradeLevel = $schoolClass->grade_level;
                    $fieldOfStudy = $schoolClass->field_of_study ?? $fieldOfStudy;
                }
            }

            // 3. Create Student profile
            $student = Student::create([
                'user_id' => $user->id,
                'student_code' => $request->input('student_code') ?: ('STD-' . rand(1000, 9999)),
                'national_id' => $nationalId,
                'first_name' => $request->input('first_name'),
                'last_name' => $request->input('last_name'),
                'father_name' => $request->input('father_name', 'ـ'),
                'birth_date' => $request->input('birth_date', '۱۳۸۸/۰۵/۱۵'),
                'current_class_id' => $classId,
                'grade_level' => $gradeLevel ?? 'هفتم',
                'field_of_study' => $fieldOfStudy,
                'parent_phone' => $request->input('parent_phone', '۰۹۱۲۰۰۰۰۰۰۰'),
                'address' => $request->input('address', 'ـ'),
                'discipline_score' => $request->input('discipline_score', 20.00),
                'is_active' => true,
                'first_login' => true,
            ]);

            // 4. Enroll in class if provided
            if ($classId) {
                Enrollment::create([
                    'student_id' => $student->id,
                    'class_id' => $classId,
                ]);
            }

            AuditLogService::log(
                'افزودن دانش‌آموز جدید',
                'student',
                (string) $student->id,
                "ثبت پرونده دانش‌آموز {$student->full_name} با کد ملی {$nationalId}"
            );

            return response()->json([
                'success' => true,
                'message' => 'دانش‌آموز با موفقیت ثبت شد.',
                'data' => $this->formatStudent($student->load(['currentClass', 'user'])),
            ], 201);
        });
    }

    /**
     * Show single student dossier.
     */
    public function show(Student $student): JsonResponse
    {
        $student->load(['currentClass', 'user', 'grades', 'attendanceRecords', 'reportCards', 'notes']);

        return response()->json([
            'success' => true,
            'data' => $this->formatStudent($student),
        ]);
    }

    /**
     * Update student details.
     */
    public function update(UpdateStudentRequest $request, Student $student): JsonResponse
    {
        return DB::transaction(function () use ($request, $student) {
            $data = $request->validated();
            if (isset($data['class_id'])) {
                $data['current_class_id'] = $data['class_id'];
            }
            $student->update($data);

            // Also synchronize with User table
            if ($student->user) {
                $student->user->update([
                    'first_name' => $student->first_name,
                    'last_name' => $student->last_name,
                    'national_id' => $student->national_id,
                    'phone' => $student->parent_phone,
                    'is_active' => $student->is_active,
                ]);
            }

            AuditLogService::log(
                'ویرایش اطلاعات دانش‌آموز',
                'student',
                (string) $student->id,
                "به‌روزرسانی مشخصات پرونده دانش‌آموز {$student->full_name}"
            );

            return response()->json([
                'success' => true,
                'message' => 'اطلاعات دانش‌آموز با موفقیت به‌روزرسانی شد.',
                'data' => $this->formatStudent($student->fresh(['currentClass', 'user'])),
            ]);
        });
    }

    /**
     * Delete student and linked records.
     */
    public function destroy(Student $student): JsonResponse
    {
        return DB::transaction(function () use ($student) {
            $name = $student->full_name;
            $userId = $student->user_id;

            $student->delete();
            if ($userId) {
                User::find($userId)?->delete();
            }

            AuditLogService::log(
                'حذف دانش‌آموز',
                'student',
                (string) $student->id,
                "حذف پرونده و حساب کاربری دانش‌آموز {$name}"
            );

            return response()->json([
                'success' => true,
                'message' => 'پرونده دانش‌آموز با موفقیت حذف گردید.',
            ]);
        });
    }

    /**
     * Toggle active/inactive status.
     */
    public function toggleActive(Student $student): JsonResponse
    {
        $newStatus = !$student->is_active;
        $student->update(['is_active' => $newStatus]);
        if ($student->user) {
            $student->user->update(['is_active' => $newStatus]);
        }

        $label = $newStatus ? 'فعال' : 'غیرفعال';
        AuditLogService::log('تغییر وضعیت دانش‌آموز', 'student', (string)$student->id, "تغییر وضعیت دانش‌آموز {$student->full_name} به {$label}");

        return response()->json([
            'success' => true,
            'message' => "وضعیت دانش‌آموز به {$label} تغییر یافت.",
            'data' => ['isActive' => $newStatus],
        ]);
    }

    /**
     * Reset student password to default (national_id).
     */
    public function resetPassword(Student $student): JsonResponse
    {
        if ($student->user) {
            $student->user->update([
                'password' => Hash::make($student->national_id),
                'first_login' => true,
            ]);
            $student->update(['first_login' => true]);
        }

        AuditLogService::log('بازنشانی رمز دانش‌آموز', 'student', (string)$student->id, "بازنشانی کلمه عبور به کد ملی برای {$student->full_name}");

        return response()->json([
            'success' => true,
            'message' => 'رمز عبور دانش‌آموز با موفقیت به کد ملی بازنشانی شد.',
        ]);
    }

    /**
     * Bulk import students from JSON/CSV/Excel payload.
     */
    public function bulkImport(Request $request): JsonResponse
    {
        $request->validate([
            'students' => 'required|array|min:1',
        ]);

        $importedCount = 0;
        $errors = [];
        $existingClasses = SchoolClass::all();

        DB::transaction(function () use ($request, &$importedCount, &$errors, $existingClasses) {
            $seenNationalIds = [];

            foreach ($request->input('students') as $index => $row) {
                $rowNum = $index + 1;
                $natId = $row['nationalId'] ?? $row['national_id'] ?? null;
                $firstName = $row['firstName'] ?? $row['first_name'] ?? null;
                $lastName = $row['lastName'] ?? $row['last_name'] ?? null;
                $classId = $row['classId'] ?? $row['class_id'] ?? null;
                $className = $row['className'] ?? $row['class_name'] ?? null;

                if (!$natId || !$firstName || !$lastName) {
                    $errors[] = "ردیف {$rowNum}: نام، نام خانوادگی یا کد ملی خالی است.";
                    continue;
                }

                if (in_array($natId, $seenNationalIds)) {
                    $errors[] = "ردیف {$rowNum}: کد ملی {$natId} در همین فایل تکرار شده است.";
                    continue;
                }
                $seenNationalIds[] = $natId;

                if (Student::where('national_id', $natId)->exists() || User::where('national_id', $natId)->exists()) {
                    $errors[] = "ردیف {$rowNum}: کد ملی {$natId} قبلاً در پایگاه داده ثبت شده است.";
                    continue;
                }

                // Match class by ID or Name
                $matchedClass = null;
                if ($classId) {
                    $matchedClass = $existingClasses->firstWhere('id', $classId);
                }
                if (!$matchedClass && $className) {
                    $matchedClass = $existingClasses->first(function ($c) use ($className) {
                        return str_contains($c->name, $className) || str_contains($className, $c->name);
                    });
                }
                if (!$matchedClass) {
                    $matchedClass = $existingClasses->first();
                }

                // Construct birth date
                $birthYear = $row['birthYear'] ?? $row['birth_year'] ?? null;
                $birthMonth = $row['birthMonth'] ?? $row['birth_month'] ?? null;
                $birthDay = $row['birthDay'] ?? $row['birth_day'] ?? null;
                $birthDate = $row['birthDate'] ?? $row['birth_date'] ?? null;

                if ($birthYear && $birthMonth && $birthDay) {
                    $birthDate = sprintf('%04d/%02d/%02d', (int)$birthYear, (int)$birthMonth, (int)$birthDay);
                } elseif (!$birthDate) {
                    $birthDate = '۱۳۹۱/۰۳/۱۵';
                }

                $username = $row['username'] ?? $natId;
                $password = $row['password'] ?? $natId;

                $user = User::create([
                    'username' => $username,
                    'national_id' => $natId,
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'phone' => $row['parentPhone'] ?? $row['parent_phone'] ?? '۰۹۱۲۰۰۰۰۰۰۰',
                    'password' => Hash::make($password),
                    'role' => 'student',
                    'is_active' => true,
                    'first_login' => true,
                ]);

                $student = Student::create([
                    'user_id' => $user->id,
                    'student_code' => $row['studentCode'] ?? $row['student_code'] ?? ('STD-' . rand(1000, 9999)),
                    'national_id' => $natId,
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'father_name' => $row['fatherName'] ?? $row['father_name'] ?? 'ـ',
                    'birth_date' => $birthDate,
                    'current_class_id' => $matchedClass?->id,
                    'grade_level' => $matchedClass?->grade_level ?? ($row['gradeLevel'] ?? 'هفتم'),
                    'field_of_study' => $matchedClass?->field_of_study ?? ($row['fieldOfStudy'] ?? 'عمومی'),
                    'parent_phone' => $row['parentPhone'] ?? $row['parent_phone'] ?? '۰۹۱۲۰۰۰۰۰۰۰',
                    'address' => $row['address'] ?? 'تهران، خیابان ولیعصر',
                    'discipline_score' => 20.00,
                    'is_active' => true,
                    'first_login' => true,
                ]);

                if ($matchedClass) {
                    Enrollment::firstOrCreate([
                        'student_id' => $student->id,
                        'class_id' => $matchedClass->id,
                    ]);
                }

                $importedCount++;
            }
        });

        AuditLogService::log('بارگذاری گروهی دانش‌آموزان', 'student', null, "ورود دسته جمعی {$importedCount} دانش‌آموز از طریق اکسل/CSV");

        return response()->json([
            'success' => true,
            'message' => "تعداد {$importedCount} دانش‌آموز با موفقیت در سیستم ثبت شدند.",
            'importedCount' => $importedCount,
            'errors' => $errors,
        ]);
    }
}
