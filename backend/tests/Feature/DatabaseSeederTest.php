<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DatabaseSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeder_creates_only_one_admin_and_no_students_or_teachers(): void
    {
        $this->seed(DatabaseSeeder::class);

        // 1. Exactly 1 user must exist
        $this->assertEquals(1, User::count());

        $admin = User::first();
        $this->assertEquals('admin', $admin->username);
        $this->assertEquals('admin', $admin->role);

        // 2. Zero students and zero teachers by default
        $this->assertEquals(0, Student::count());
        $this->assertEquals(0, Teacher::count());

        // 3. Initial academic year exists
        $this->assertGreaterThanOrEqual(1, AcademicYear::count());
    }
}
