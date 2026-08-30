<?php

namespace Tests\Feature;

use App\Models\Grade;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class StudentDataIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_only_see_their_own_grades(): void
    {
        // 1. Create Class & Subject
        $class = SchoolClass::create(['name' => 'کلاس دهم الف', 'grade_level' => 'دهم']);
        $subject = Subject::create(['title' => 'ریاضی', 'code' => 'MATH-10', 'coefficient' => 4]);

        // 2. Create Student 1
        $user1 = User::create([
            'username' => '0011223344',
            'national_id' => '0011223344',
            'password' => Hash::make('1234'),
            'role' => 'student',
            'is_active' => true,
        ]);
        $student1 = Student::create([
            'user_id' => $user1->id,
            'national_id' => '0011223344',
            'first_name' => 'علی',
            'last_name' => 'محمدی',
            'current_class_id' => $class->id,
        ]);

        // 3. Create Student 2
        $user2 = User::create([
            'username' => '0022334455',
            'national_id' => '0022334455',
            'password' => Hash::make('1234'),
            'role' => 'student',
            'is_active' => true,
        ]);
        $student2 = Student::create([
            'user_id' => $user2->id,
            'national_id' => '0022334455',
            'first_name' => 'رضا',
            'last_name' => 'کریمی',
            'current_class_id' => $class->id,
        ]);

        // Grade for Student 1
        Grade::create([
            'student_id' => $student1->id,
            'subject_id' => $subject->id,
            'class_id' => $class->id,
            'score' => 19.5,
            'grade_type' => 'continuous',
            'month' => 'آبان',
        ]);

        // Grade for Student 2
        Grade::create([
            'student_id' => $student2->id,
            'subject_id' => $subject->id,
            'class_id' => $class->id,
            'score' => 14.0,
            'grade_type' => 'continuous',
            'month' => 'آبان',
        ]);

        // Query as Student 1
        $response = $this->actingAs($user1, 'sanctum')->getJson('/api/student/grades');

        $response->assertStatus(200);
        $data = $response->json('data');

        // Must only contain Student 1's grade
        $this->assertCount(1, $data);
        $this->assertEquals(19.5, $data[0]['score']);
    }

    public function test_student_cannot_access_admin_endpoints(): void
    {
        $user = User::create([
            'username' => 'student_user',
            'national_id' => '9999999999',
            'password' => Hash::make('1234'),
            'role' => 'student',
            'is_active' => true,
        ]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/admin/students');
        $response->assertStatus(403);
    }
}
