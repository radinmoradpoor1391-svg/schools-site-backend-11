<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     * Starts with ONLY ONE ADMINISTRATOR ACCOUNT and base school configuration.
     * Students and teachers must NOT exist by default.
     */
    public function run(): void
    {
        $this->call([
            AdminSeeder::class,
            InitialSchoolConfigSeeder::class,
            SubjectSeeder::class,
            SchoolClassSeeder::class,
            DefaultAccountsSeeder::class,
            ScheduleAndGradesSeeder::class,
        ]);
    }
}
