<?php

namespace Database\Seeders;

use App\Models\Subject;
use Illuminate\Database\Seeder;

class SubjectSeeder extends Seeder
{
    /**
     * Run the database seeds for First Secondary School (پایه‌های هفتم، هشتم و نهم).
     */
    public function run(): void
    {
        // 1. Remove old incorrect high school test data
        Subject::where('title', 'like', '%دهم%')
            ->orWhere('title', 'like', '%یازدهم%')
            ->orWhere('title', 'like', '%دوازدهم%')
            ->orWhere('code', 'like', '%MATH-10%')
            ->orWhere('title', 'ریاضی (۱) دهم')
            ->orWhere('title', 'ریاضی (۱)')
            ->delete();

        // 2. Official Middle School Subjects (دوره اول متوسطه)
        $subjects = [
            [
                'title' => 'فارسی',
                'code' => 'SUB-FARSI',
                'coefficient' => 4,
                'grade_level' => 'مشترک',
                'description' => 'ادبیات فارسی، دستور زبان، شعر و متون کهن پایه اول متوسطه',
            ],
            [
                'title' => 'نگارش',
                'code' => 'SUB-NEGARESH',
                'coefficient' => 2,
                'grade_level' => 'مشترک',
                'description' => 'آموزش اصول نگارش، انشا و مهارت‌های نوشتاری',
            ],
            [
                'title' => 'ریاضی',
                'code' => 'SUB-RIAZI',
                'coefficient' => 4,
                'grade_level' => 'مشترک',
                'description' => 'مفاهیم جبری، هندسه، توان، جذر، آمار و احتمال دوره اول متوسطه',
            ],
            [
                'title' => 'علوم تجربی',
                'code' => 'SUB-OLOOM',
                'coefficient' => 3,
                'grade_level' => 'مشترک',
                'description' => 'مباحث فیزیک، شیمی، زیست‌شناسی و زمین‌شناسی',
            ],
            [
                'title' => 'مطالعات اجتماعی',
                'code' => 'SUB-MOTALEAT',
                'coefficient' => 3,
                'grade_level' => 'مشترک',
                'description' => 'تاریخ، جغرافیا، مدنی و مهارت‌های اجتماعی و شهروندی',
            ],
            [
                'title' => 'عربی',
                'code' => 'SUB-ARABI',
                'coefficient' => 2,
                'grade_level' => 'مشترک',
                'description' => 'آموزش زبان و قواعد عربی و درک متون کاربردی',
            ],
            [
                'title' => 'زبان انگلیسی',
                'code' => 'SUB-ENGLISH',
                'coefficient' => 2,
                'grade_level' => 'مشترک',
                'description' => 'مهارت‌های چهارگانه شنیداری، گفتاری، خواندن و نوشتاری زبان انگلیسی',
            ],
            [
                'title' => 'قرآن',
                'code' => 'SUB-QURAN',
                'coefficient' => 2,
                'grade_level' => 'مشترک',
                'description' => 'روخوانی، روان‌خوانی، مفاهیم و انس با کلام‌الله مجید',
            ],
            [
                'title' => 'پیامهای آسمان',
                'code' => 'SUB-PAYAM',
                'coefficient' => 2,
                'grade_level' => 'مشترک',
                'description' => 'تعلیم و تربیت اسلامی، احکام، معارف و اخلاق دینی',
            ],
            [
                'title' => 'تفکر و سبک زندگی',
                'code' => 'SUB-TAFAKOR',
                'coefficient' => 2,
                'grade_level' => 'مشترک',
                'description' => 'تفکر نقادانه و خلاق، تصمیم‌گیری و مهارت‌های فردی و اجتماعی',
            ],
            [
                'title' => 'کار و فناوری',
                'code' => 'SUB-KAR',
                'coefficient' => 2,
                'grade_level' => 'مشترک',
                'description' => 'پودمان‌های مهارتی، کارآفرینی، فناوری اطلاعات و ارتباطات',
            ],
            [
                'title' => 'فرهنگ و هنر',
                'code' => 'SUB-HONAR',
                'coefficient' => 2,
                'grade_level' => 'مشترک',
                'description' => 'هنرهای تجسمی، خوشنویسی، تصویرسازی و میراث فرهنگی',
            ],
            [
                'title' => 'آمادگی دفاعی',
                'code' => 'SUB-DEFA',
                'coefficient' => 2,
                'grade_level' => 'نهم',
                'description' => 'مهارت‌های امداد و نجات، دفاع غیرنظامی و امنیت ملی مختص پایه نهم',
            ],
        ];

        foreach ($subjects as $sub) {
            Subject::updateOrCreate(
                ['code' => $sub['code']],
                [
                    'title' => $sub['title'],
                    'coefficient' => $sub['coefficient'],
                    'grade_level' => $sub['grade_level'],
                    'description' => $sub['description'],
                ]
            );
        }

        $this->command?->info('SubjectSeeder: 13 First Secondary School subjects seeded successfully.');
    }
}
