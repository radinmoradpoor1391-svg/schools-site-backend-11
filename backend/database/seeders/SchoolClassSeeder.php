<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\SchoolClass;
use Illuminate\Database\Seeder;

class SchoolClassSeeder extends Seeder
{
    /**
     * Run the database seeds for First Secondary School Classes (پایه‌های هفتم، هشتم و نهم).
     */
    public function run(): void
    {
        // 1. Remove old incorrect test classes
        SchoolClass::where('name', 'like', '%دهم%')
            ->orWhere('grade_level', 'دهم')
            ->orWhere('name', 'like', '%یازدهم%')
            ->orWhere('name', 'like', '%دوازدهم%')
            ->delete();

        // 2. Ensure current academic year exists
        $academicYear = AcademicYear::where('is_current', true)->first() ?? AcademicYear::firstOrCreate(
            ['name' => 'سال تحصیلی ۱۴۰۴–۱۴۰۵'],
            [
                'start_date' => '۱۴۰۴/۰۷/۰۱',
                'end_date' => '۱۴۰۵/۰۳/۳۱',
                'is_current' => true,
                'is_archived' => false,
            ]
        );

        // 3. Classes to create
        $classes = [
            [
                'name' => 'هفتم 1',
                'grade_level' => 'هفتم',
                'room_number' => '101',
                'capacity' => 30,
            ],
            [
                'name' => 'هفتم 2',
                'grade_level' => 'هفتم',
                'room_number' => '102',
                'capacity' => 30,
            ],
            [
                'name' => 'هشتم 1',
                'grade_level' => 'هشتم',
                'room_number' => '201',
                'capacity' => 30,
            ],
            [
                'name' => 'هشتم 2',
                'grade_level' => 'هشتم',
                'room_number' => '202',
                'capacity' => 30,
            ],
            [
                'name' => 'نهم 1',
                'grade_level' => 'نهم',
                'room_number' => '301',
                'capacity' => 30,
            ],
            [
                'name' => 'نهم 2',
                'grade_level' => 'نهم',
                'room_number' => '302',
                'capacity' => 30,
            ],
        ];

        foreach ($classes as $cls) {
            SchoolClass::updateOrCreate(
                [
                    'name' => $cls['name'],
                    'academic_year_id' => $academicYear->id,
                ],
                [
                    'grade_level' => $cls['grade_level'],
                    'room_number' => $cls['room_number'],
                    'capacity' => $cls['capacity'],
                    'field_of_study' => 'عمومی',
                ]
            );
        }

        $this->command?->info('SchoolClassSeeder: 6 First Secondary School classes seeded successfully.');
    }
}
