<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        $adminUsername = env('ADMIN_USERNAME', 'admin');
        $adminPassword = env('ADMIN_PASSWORD', '1234');
        $adminNationalId = env('ADMIN_NATIONAL_ID', '3333333333');
        $adminFirstName = env('ADMIN_FIRST_NAME', 'مدیر');
        $adminLastName = env('ADMIN_LAST_NAME', 'سامانه');
        $adminPhone = env('ADMIN_PHONE', '09120000000');

        // Check if admin user already exists
        $existingAdmin = User::where('username', $adminUsername)
            ->orWhere('national_id', $adminNationalId)
            ->first();

        if (!$existingAdmin) {
            User::create([
                'username' => $adminUsername,
                'national_id' => $adminNationalId,
                'first_name' => $adminFirstName,
                'last_name' => $adminLastName,
                'email' => 'admin@dana-school.ir',
                'phone' => $adminPhone,
                'password' => Hash::make($adminPassword),
                'role' => 'admin',
                'is_active' => true,
                'first_login' => false,
                'avatar_url' => null,
            ]);

            $this->command->info("Initial Administrator Account created successfully for development (Username: {$adminUsername}).");
        } else {
            $this->command->info("Administrator Account already exists.");
        }
    }
}
