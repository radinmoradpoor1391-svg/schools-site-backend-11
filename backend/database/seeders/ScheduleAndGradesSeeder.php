<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\AttendanceRecord;
use App\Models\Grade;
use App\Models\ReportCard;
use App\Models\SchedulePeriod;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\TeacherClassAssignment;
use App\Models\TeacherNote;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ScheduleAndGradesSeeder extends Seeder
{
    public function run(): void
    {
        $academicYear = AcademicYear::where('is_current', true)->first();
        if (!$academicYear) {
            $academicYear = AcademicYear::first();
        }

        $class7_1 = SchoolClass::where('name', 'هفتم 1')->first();
        if (!$class7_1) {
            return;
        }

        // 1. Ensure Teachers
        $teachersData = [
            [
                'national_id' => '2222222222',
                'first_name' => 'علی',
                'last_name' => 'محمدی',
                'specialty' => 'ریاضیات و هندسه',
                'subject_code' => 'SUB-RIAZI',
            ],
            [
                'national_id' => '3333333333',
                'first_name' => 'سعید',
                'last_name' => 'رضایی',
                'specialty' => 'علوم تجربی و فیزیک',
                'subject_code' => 'SUB-OLOOM',
            ],
            [
                'national_id' => '4444444444',
                'first_name' => 'امیر',
                'last_name' => 'کریمی',
                'specialty' => 'ادبیات و زبان فارسی',
                'subject_code' => 'SUB-FARSI',
            ],
            [
                'national_id' => '5555555555',
                'first_name' => 'محمد',
                'last_name' => 'حسینی',
                'specialty' => 'زبان انگلیسی',
                'subject_code' => 'SUB-ENGLISI',
            ],
            [
                'national_id' => '6666666666',
                'first_name' => 'مهدی',
                'last_name' => 'احمدی',
                'specialty' => 'پیام‌های آسمان و قرآن',
                'subject_code' => 'SUB-PAYAM',
            ],
        ];

        $teacherProfiles = [];

        foreach ($teachersData as $tData) {
            $user = User::where('national_id', $tData['national_id'])->first();
            if (!$user) {
                $user = User::create([
                    'username' => $tData['national_id'],
                    'national_id' => $tData['national_id'],
                    'first_name' => $tData['first_name'],
                    'last_name' => $tData['last_name'],
                    'email' => $tData['national_id'] . '@padidehdanesh.ir',
                    'phone' => '0912' . rand(1000000, 9999999),
                    'password' => Hash::make('1234'),
                    'role' => 'teacher',
                    'is_active' => true,
                    'first_login' => false,
                ]);
            }

            $teacher = Teacher::where('user_id', $user->id)->first();
            if (!$teacher) {
                $teacher = Teacher::create([
                    'user_id' => $user->id,
                    'personnel_code' => 'T-' . substr($tData['national_id'], 0, 4),
                    'national_id' => $tData['national_id'],
                    'first_name' => $tData['first_name'],
                    'last_name' => $tData['last_name'],
                    'specialty' => $tData['specialty'],
                    'degree' => 'کارشناسی ارشد',
                    'phone' => $user->phone,
                    'email' => $user->email,
                    'bio' => 'مدرس درس ' . $tData['specialty'] . ' در دبیرستان استعدادهای درخشان پدیده دانش.',
                    'is_active' => true,
                    'first_login' => false,
                ]);
            }

            $teacherProfiles[$tData['subject_code']] = $teacher;

            // Link subject
            $subj = Subject::where('code', $tData['subject_code'])->first();
            if ($subj && $class7_1) {
                TeacherClassAssignment::firstOrCreate([
                    'teacher_id' => $teacher->id,
                    'class_id' => $class7_1->id,
                    'subject_id' => $subj->id,
                ]);
            }
        }

        // 2. Weekly Schedule for Class 7-1 (شنبه تا چهارشنبه، زنگ‌های ۱ تا ۳)
        $scheduleMatrix = [
            // شنبه
            ['day' => 'شنبه', 'period' => 1, 'subject' => 'SUB-RIAZI', 'start' => '07:45:00', 'end' => '09:15:00'],
            ['day' => 'شنبه', 'period' => 2, 'subject' => 'SUB-OLOOM', 'start' => '09:45:00', 'end' => '11:15:00'],
            ['day' => 'شنبه', 'period' => 3, 'subject' => 'SUB-FARSI', 'start' => '11:30:00', 'end' => '13:00:00'],

            // یکشنبه
            ['day' => 'یکشنبه', 'period' => 1, 'subject' => 'SUB-ENGLISI', 'start' => '07:45:00', 'end' => '09:15:00'],
            ['day' => 'یکشنبه', 'period' => 2, 'subject' => 'SUB-RIAZI', 'start' => '09:45:00', 'end' => '11:15:00'],
            ['day' => 'یکشنبه', 'period' => 3, 'subject' => 'SUB-PAYAM', 'start' => '11:30:00', 'end' => '13:00:00'],

            // دوشنبه
            ['day' => 'دوشنبه', 'period' => 1, 'subject' => 'SUB-OLOOM', 'start' => '07:45:00', 'end' => '09:15:00'],
            ['day' => 'دوشنبه', 'period' => 2, 'subject' => 'SUB-FARSI', 'start' => '09:45:00', 'end' => '11:15:00'],
            ['day' => 'دوشنبه', 'period' => 3, 'subject' => 'SUB-ENGLISI', 'start' => '11:30:00', 'end' => '13:00:00'],

            // سه‌شنبه
            ['day' => 'سه‌شنبه', 'period' => 1, 'subject' => 'SUB-RIAZI', 'start' => '07:45:00', 'end' => '09:15:00'],
            ['day' => 'سه‌شنبه', 'period' => 2, 'subject' => 'SUB-PAYAM', 'start' => '09:45:00', 'end' => '11:15:00'],
            ['day' => 'سه‌شنبه', 'period' => 3, 'subject' => 'SUB-OLOOM', 'start' => '11:30:00', 'end' => '13:00:00'],

            // چهارشنبه
            ['day' => 'چهارشنبه', 'period' => 1, 'subject' => 'SUB-FARSI', 'start' => '07:45:00', 'end' => '09:15:00'],
            ['day' => 'چهارشنبه', 'period' => 2, 'subject' => 'SUB-ENGLISI', 'start' => '09:45:00', 'end' => '11:15:00'],
            ['day' => 'چهارشنبه', 'period' => 3, 'subject' => 'SUB-RIAZI', 'start' => '11:30:00', 'end' => '13:00:00'],
        ];

        foreach ($scheduleMatrix as $item) {
            $subj = Subject::where('code', $item['subject'])->first();
            $teacher = $teacherProfiles[$item['subject']] ?? $teacherProfiles['SUB-RIAZI'];

            if ($subj && $teacher) {
                SchedulePeriod::updateOrCreate(
                    [
                        'school_class_id' => $class7_1->id,
                        'day_of_week' => $item['day'],
                        'period_number' => $item['period'],
                    ],
                    [
                        'subject_id' => $subj->id,
                        'teacher_id' => $teacher->id,
                        'academic_year_id' => $academicYear ? $academicYear->id : null,
                        'start_time' => $item['start'],
                        'end_time' => $item['end'],
                        'room_number' => 101,
                    ]
                );
            }
        }

        // 3. Seed Realistic Grades for Default Student (رضا کاظمی - 1111111111)
        $student = Student::where('national_id', '1111111111')->first();
        if ($student) {
            $subjectsMap = Subject::all()->keyBy('code');

            $gradesData = [
                // مهر
                ['month' => 'مهر', 'code' => 'SUB-RIAZI', 'score' => 18.5, 'type' => 'monthly', 'date' => '۱۴۰۴/۰۷/۲۸', 'desc' => 'آزمون ماهانه مهر - فصل اول راهبردهای حل مسئله'],
                ['month' => 'مهر', 'code' => 'SUB-OLOOM', 'score' => 19.0, 'type' => 'monthly', 'date' => '۱۴۰۴/۰۷/۲۹', 'desc' => 'آزمون ماهانه مهر - تجربه و تفکر'],
                ['month' => 'مهر', 'code' => 'SUB-FARSI', 'score' => 18.0, 'type' => 'monthly', 'date' => '۱۴۰۴/۰۷/۳۰', 'desc' => 'ارزشیابی مستمر ادبیات فارسی'],
                ['month' => 'مهر', 'code' => 'SUB-ENGLISI', 'score' => 19.5, 'type' => 'monthly', 'date' => '۱۴۰۴/۰۷/۲۵', 'desc' => 'آزمون لغات و مکالمه درس ۱'],

                // آبان
                ['month' => 'آبان', 'code' => 'SUB-RIAZI', 'score' => 19.0, 'type' => 'monthly', 'date' => '۱۴۰۴/۰۸/۲۸', 'desc' => 'آزمون ماهانه آبان - اعداد صحیح'],
                ['month' => 'آبان', 'code' => 'SUB-OLOOM', 'score' => 19.25, 'type' => 'monthly', 'date' => '۱۴۰۴/۰۸/۲۹', 'desc' => 'آزمون آزمایشگاهی علوم'],
                ['month' => 'آبان', 'code' => 'SUB-FARSI', 'score' => 18.5, 'type' => 'monthly', 'date' => '۱۴۰۴/۰۸/۲۷', 'desc' => 'انشا و نگارش خلاقانه'],
                ['month' => 'آبان', 'code' => 'SUB-ENGLISI', 'score' => 20.0, 'type' => 'monthly', 'date' => '۱۴۰۴/۰۸/۲۶', 'desc' => 'ارزیابی مهارت شنیداری و گرامر'],

                // آذر
                ['month' => 'آذر', 'code' => 'SUB-RIAZI', 'score' => 19.5, 'type' => 'monthly', 'date' => '۱۴۰۴/۰۹/۲۵', 'desc' => 'آزمون جامع جبر و معادله'],
                ['month' => 'آذر', 'code' => 'SUB-OLOOM', 'score' => 19.75, 'type' => 'monthly', 'date' => '۱۴۰۴/۰۹/۲۶', 'desc' => 'آزمون فیزیک و مواد پیرامون ما'],
                ['month' => 'آذر', 'code' => 'SUB-FARSI', 'score' => 19.0, 'type' => 'monthly', 'date' => '۱۴۰۴/۰۹/۲۴', 'desc' => 'دستور زبان و آرایه‌های ادبی'],
                ['month' => 'آذر', 'code' => 'SUB-ENGLISI', 'score' => 20.0, 'type' => 'monthly', 'date' => '۱۴۰۴/۰۹/۲۳', 'desc' => 'آزمون جامع نیم‌فصل اول'],

                // دی (نوبت اول)
                ['month' => 'دی', 'code' => 'SUB-RIAZI', 'score' => 19.25, 'type' => 'first_semester', 'date' => '۱۴۰۴/۱۰/۱۵', 'desc' => 'امتحان هماهنگ نوبت اول ریاضی'],
                ['month' => 'دی', 'code' => 'SUB-OLOOM', 'score' => 19.5, 'type' => 'first_semester', 'date' => '۱۴۰۴/۱۰/۱۸', 'desc' => 'امتحان هماهنگ نوبت اول علوم تجربی'],
                ['month' => 'دی', 'code' => 'SUB-FARSI', 'score' => 19.0, 'type' => 'first_semester', 'date' => '۱۴۰۴/۱۰/۲۰', 'desc' => 'امتحان کتبی نوبت اول زبان و ادبیات فارسی'],
                ['month' => 'دی', 'code' => 'SUB-ENGLISI', 'score' => 20.0, 'type' => 'first_semester', 'date' => '۱۴۰۴/۱۰/۲۲', 'desc' => 'امتحان نوبت اول زبان انگلیسی'],

                // بهمن
                ['month' => 'بهمن', 'code' => 'SUB-RIAZI', 'score' => 19.75, 'type' => 'monthly', 'date' => '۱۴۰۴/۱۱/۲۸', 'desc' => 'آزمون هندسه و استدلال ریاضی'],
                ['month' => 'بهمن', 'code' => 'SUB-OLOOM', 'score' => 20.0, 'type' => 'monthly', 'date' => '۱۴۰۴/۱۱/۲۹', 'desc' => 'آزمون زیست‌شناسی سلولی'],
                ['month' => 'بهمن', 'code' => 'SUB-FARSI', 'score' => 19.25, 'type' => 'monthly', 'date' => '۱۴۰۴/۱۱/۲۶', 'desc' => 'درک مطلب و نگارش'],
                ['month' => 'بهمن', 'code' => 'SUB-ENGLISI', 'score' => 20.0, 'type' => 'monthly', 'date' => '۱۴۰۴/۱۱/۲۵', 'desc' => 'آزمون واژگان و اصطلاحات درس ۴'],

                // اسفند
                ['month' => 'اسفند', 'code' => 'SUB-RIAZI', 'score' => 20.0, 'type' => 'monthly', 'date' => '۱۴۰۴/۱۲/۲۰', 'desc' => 'آزمون توان و جذر و بردار'],
                ['month' => 'اسفند', 'code' => 'SUB-OLOOM', 'score' => 19.75, 'type' => 'monthly', 'date' => '۱۴۰۴/۱۲/۲۲', 'desc' => 'آزمون جامع علوم قبل از عید نوروز'],
                ['month' => 'اسفند', 'code' => 'SUB-FARSI', 'score' => 19.5, 'type' => 'monthly', 'date' => '۱۴۰۴/۱۲/۱۹', 'desc' => 'ارزشیابی پایانی اسفند ادبیات'],
                ['month' => 'اسفند', 'code' => 'SUB-ENGLISI', 'score' => 20.0, 'type' => 'monthly', 'date' => '۱۴۰۴/۱۲/۱۸', 'desc' => 'آزمون جامع گرامر و ریدینگ'],
            ];

            foreach ($gradesData as $g) {
                $sub = $subjectsMap[$g['code']] ?? null;
                $tch = $teacherProfiles[$g['code']] ?? $teacherProfiles['SUB-RIAZI'];

                if ($sub && $tch) {
                    Grade::updateOrCreate(
                        [
                            'student_id' => $student->id,
                            'subject_id' => $sub->id,
                            'month' => $g['month'],
                            'grade_type' => $g['type'],
                        ],
                        [
                            'teacher_id' => $tch->id,
                            'class_id' => $class7_1->id,
                            'academic_year_id' => $academicYear ? $academicYear->id : null,
                            'score' => $g['score'],
                            'max_score' => 20.0,
                            'date' => $g['date'],
                            'description' => $g['desc'],
                        ]
                    );
                }
            }

            // 4. Seed Attendance records for Student
            $attDates = [
                ['date' => '۱۴۰۴/۰۸/۰۵', 'status' => 'present', 'note' => null],
                ['date' => '۱۴۰۴/۰۸/۰۶', 'status' => 'present', 'note' => null],
                ['date' => '۱۴۰۴/۰۸/۰۷', 'status' => 'present', 'note' => null],
                ['date' => '۱۴۰۴/۰۸/۰۸', 'status' => 'present', 'note' => null],
                ['date' => '۱۴۰۴/۰۸/۰۹', 'status' => 'present', 'note' => null],
                ['date' => '۱۴۰۴/۰۸/۱۲', 'status' => 'late', 'note' => '۱۰ دقیقه تأخیر موجه'],
                ['date' => '۱۴۰۴/۰۸/۱۳', 'status' => 'present', 'note' => null],
                ['date' => '۱۴۰۴/۰۸/۱۴', 'status' => 'present', 'note' => null],
                ['date' => '۱۴۰۴/۰۸/۱۵', 'status' => 'present', 'note' => null],
                ['date' => '۱۴۰۴/۰۸/۱۹', 'status' => 'present', 'note' => null],
            ];

            foreach ($attDates as $att) {
                AttendanceRecord::updateOrCreate(
                    [
                        'student_id' => $student->id,
                        'date' => $att['date'],
                    ],
                    [
                        'class_id' => $class7_1->id,
                        'academic_year_id' => $academicYear ? $academicYear->id : null,
                        'status' => $att['status'],
                        'session_number' => 1,
                        'note' => $att['note'],
                    ]
                );
            }

            // 5. Teacher Notes
            TeacherNote::updateOrCreate(
                [
                    'student_id' => $student->id,
                    'title' => 'تقدیر از پیشرفت چشمگیر در ریاضیات',
                ],
                [
                    'teacher_id' => $teacherProfiles['SUB-RIAZI']->id,
                    'class_id' => $class7_1->id,
                    'academic_year_id' => $academicYear ? $academicYear->id : null,
                    'content' => 'دانش‌آموز رضا کاظمی در حل مسائل هندسه و آزمون‌های تحلیلی عملکرد بسیار درخشانی داشته است. ادامه این روند پیشنهاد می‌گردد.',
                    'date' => '۱۴۰۴/۰۹/۱۰',
                    'category' => 'academic',
                    'is_private' => false,
                ]
            );

            // 6. Generate Official Report Cards
            $reportCardsData = [
                [
                    'title' => 'کارنامه ارزشیابی ماهانه مهر ۱۴۰۴',
                    'type' => 'monthly',
                    'period_name' => 'مهر ۱۴۰۴',
                    'issue_date' => '۱۴۰۴/۰۸/۰۱',
                    'gpa' => 18.75,
                    'rank_in_class' => 3,
                    'rank_in_grade' => 8,
                    'discipline_score' => 20.0,
                ],
                [
                    'title' => 'کارنامه ارزشیابی ماهانه آبان ۱۴۰۴',
                    'type' => 'monthly',
                    'period_name' => 'آبان ۱۴۰۴',
                    'issue_date' => '۱۴۰۴/۰۹/۰۱',
                    'gpa' => 19.18,
                    'rank_in_class' => 2,
                    'rank_in_grade' => 4,
                    'discipline_score' => 20.0,
                ],
                [
                    'title' => 'کارنامه ارزشیابی ماهانه آذر ۱۴۰۴',
                    'type' => 'monthly',
                    'period_name' => 'آذر ۱۴۰۴',
                    'issue_date' => '۱۴۰۴/۱۰/۰۱',
                    'gpa' => 19.56,
                    'rank_in_class' => 1,
                    'rank_in_grade' => 2,
                    'discipline_score' => 20.0,
                ],
                [
                    'title' => 'کارنامه رسمی نوبت اول (دی‌ماه ۱۴۰۴)',
                    'type' => 'first_semester',
                    'period_name' => 'نوبت اول ۱۴۰۴',
                    'issue_date' => '۱۴۰۴/۱۰/۲۸',
                    'gpa' => 19.43,
                    'rank_in_class' => 1,
                    'rank_in_grade' => 2,
                    'discipline_score' => 20.0,
                ],
            ];

            foreach ($reportCardsData as $rc) {
                ReportCard::updateOrCreate(
                    [
                        'student_id' => $student->id,
                        'period_name' => $rc['period_name'],
                        'report_type' => $rc['type'],
                    ],
                    [
                        'school_class_id' => $class7_1->id,
                        'academic_year_id' => $academicYear ? $academicYear->id : null,
                        'title' => $rc['title'],
                        'issue_date' => $rc['issue_date'],
                        'gpa' => $rc['gpa'],
                        'rank_in_class' => $rc['rank_in_class'],
                        'rank_in_grade' => $rc['rank_in_grade'],
                        'discipline_score' => $rc['discipline_score'],
                        'status' => 'published',
                        'is_published' => true,
                        'principal_note' => 'عملکرد تحصیلی ممتاز و اخلاق شایسته. با آرزوی تداوم موفقیت‌ها در مجتمع استعدادهای درخشان پدیده دانش.',
                    ]
                );
            }
        }
    }
}
