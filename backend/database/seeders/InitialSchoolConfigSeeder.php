<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\SchoolSetting;
use Illuminate\Database\Seeder;

class InitialSchoolConfigSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Initial Academic Year if none exists
        if (AcademicYear::count() === 0) {
            AcademicYear::create([
                'name' => 'سال تحصیلی ۱۴۰۴–۱۴۰۵',
                'start_date' => '۱۴۰۴/۰۷/۰۱',
                'end_date' => '۱۴۰۵/۰۳/۳۱',
                'is_current' => true,
                'is_archived' => false,
            ]);
        }

        // 2. Default School Config
        if (!SchoolSetting::where('key', 'school_config')->exists()) {
            SchoolSetting::set('school_config', [
                'schoolName' => 'دبیرستان دوره اول پدیده دانش',
                'managerName' => 'دکتر محمد رضایی',
                'district' => 'منطقه ۳',
                'province' => 'تهران',
                'academicYear' => '۱۴۰۴–۱۴۰۵',
                'phone' => '۰۲۱-۸۸۷۷۶۶۵۵',
                'address' => 'تهران، خیابان ولیعصر، بالاتر از میدان ونک، بن‌بست دانش، پلاک ۱۲',
                'passGrade' => 10,
            ]);
        }
    }
}
