<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\TeacherClassAssignment;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DefaultAccountsSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Ensure Academic Year
        $academicYear = AcademicYear::firstOrCreate(
            ['is_current' => true],
            [
                'name' => 'سال تحصیلی ۱۴۰۴–۱۴۰۵',
                'start_date' => '۱۴۰۴/۰۷/۰۱',
                'end_date' => '۱۴۰۵/۰۳/۳۱',
                'is_archived' => false,
            ]
        );

        // 2. Default Teacher: username 2222222222, password 1234
        $teacherNationalId = '2222222222';
        $teacherUser = User::where('username', $teacherNationalId)
            ->orWhere('national_id', $teacherNationalId)
            ->first();

        if (!$teacherUser) {
            $teacherUser = User::create([
                'username' => $teacherNationalId,
                'national_id' => $teacherNationalId,
                'first_name' => 'علی',
                'last_name' => 'محمدی',
                'email' => 'mohammadi@padidehdanesh.ir',
                'phone' => '09121112233',
                'password' => Hash::make('1234'),
                'role' => 'teacher',
                'is_active' => true,
                'first_login' => false,
            ]);

            $teacherProfile = Teacher::create([
                'user_id' => $teacherUser->id,
                'personnel_code' => 'T-2222',
                'national_id' => $teacherNationalId,
                'first_name' => 'علی',
                'last_name' => 'محمدی',
                'specialty' => 'ریاضیات و هندسه',
                'degree' => 'کارشناسی ارشد ریاضی',
                'phone' => '09121112233',
                'email' => 'mohammadi@padidehdanesh.ir',
                'bio' => 'مدرس درس ریاضیات و هندسه با بیش از ۱۰ سال سابقه تدریس.',
                'is_active' => true,
                'first_login' => false,
            ]);

            $this->command->info("Default Teacher account created: {$teacherNationalId} / 1234");
        } else {
            $teacherProfile = Teacher::where('user_id', $teacherUser->id)->first();
        }

        // 3. Connect Sample Subject and Class
        $mathSubject = Subject::where('code', 'SUB-RIAZI')->first() ?? Subject::updateOrCreate(
            ['code' => 'SUB-RIAZI'],
            [
                'title' => 'ریاضی',
                'coefficient' => 4,
                'grade_level' => 'مشترک',
                'description' => 'مفاهیم جبری، هندسه، توان، جذر، آمار و احتمال دوره اول متوسطه',
            ]
        );

        $schoolClass = SchoolClass::where('name', 'هفتم 1')->first() ?? SchoolClass::updateOrCreate(
            ['name' => 'هفتم 1', 'academic_year_id' => $academicYear->id],
            [
                'grade_level' => 'هفتم',
                'field_of_study' => 'عمومی',
                'homeroom_teacher_id' => $teacherProfile?->id,
                'room_number' => '101',
                'capacity' => 30,
            ]
        );

        if ($teacherProfile && $schoolClass && $mathSubject) {
            TeacherClassAssignment::firstOrCreate([
                'teacher_id' => $teacherProfile->id,
                'class_id' => $schoolClass->id,
                'subject_id' => $mathSubject->id,
            ]);
        }

        // 4. Default Student: username 1111111111, password 123
        $studentNationalId = '1111111111';
        $studentUser = User::where('username', $studentNationalId)
            ->orWhere('national_id', $studentNationalId)
            ->first();

        if (!$studentUser) {
            $studentUser = User::create([
                'username' => $studentNationalId,
                'national_id' => $studentNationalId,
                'first_name' => 'رضا',
                'last_name' => 'کاظمی',
                'email' => 'kazemi@padidehdanesh.ir',
                'phone' => '09351234567',
                'password' => Hash::make('123'),
                'role' => 'student',
                'is_active' => true,
                'first_login' => false,
            ]);

            $studentProfile = Student::create([
                'user_id' => $studentUser->id,
                'student_code' => 'S-1111',
                'national_id' => $studentNationalId,
                'first_name' => 'رضا',
                'last_name' => 'کاظمی',
                'father_name' => 'حسین',
                'birth_date' => '۱۳۹۰/۰۵/۱۲',
                'current_class_id' => $schoolClass?->id,
                'grade_level' => 'هفتم',
                'field_of_study' => 'عمومی',
                'parent_phone' => '09129876543',
                'address' => 'تهران، خیابان آزادی، کوچه مریم، پلاک ۵',
                'discipline_score' => 20.00,
                'is_active' => true,
                'first_login' => false,
            ]);

            if ($schoolClass) {
                Enrollment::firstOrCreate([
                    'student_id' => $studentProfile->id,
                    'class_id' => $schoolClass->id,
                    'academic_year_id' => $academicYear->id,
                ]);
            }

            $this->command->info("Default Student account created: {$studentNationalId} / 123");
        }
    }
}
