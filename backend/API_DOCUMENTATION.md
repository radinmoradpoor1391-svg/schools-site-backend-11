# مستندات کامل API سامانه مدیریت هوشمند مدرسه دانا (Laravel 12 REST API)

کلیه درخواست‌های محافظت‌شده نیازمند هدر Authorization با توکن Bearer لاگین هستند:
```http
Authorization: Bearer <SANCTUM_TOKEN>
Accept: application/json
```

---

## ۱. احراز هویت (Authentication)

### `POST /api/auth/login`
- **ورودی:** `username` (نام کاربری یا کد ملی ۱۰ رقمی), `password` (رمز عبور).
- **خروجی:** توکن Sanctum، اطلاعات کاربر (`id`, `username`, `role`, `isActive`, ...) و پروفایل متصل (دبیر/دانش‌آموز).

### `GET /api/auth/me`
- **خروجی:** اطلاعات کاربر جاری و پروفایل مرتبط.

### `POST /api/auth/logout`
- **توضیح:** ابطال توکن جاری و ثبت لاگ خروج.

### `POST /api/auth/change-password`
- **ورودی:** `current_password`, `new_password`.

---

## ۲. پنل مدیریت (Admin Endpoints)

| متد | آدرس | شرح |
|---|---|---|
| `GET` | `/api/admin/students` | دریافت لیست دانش‌آموزان با امکان جستجو و فیلتر کلاس |
| `POST` | `/api/admin/students` | ثبت پرونده دانش‌آموز و ایجاد خودکار حساب کاربری |
| `GET` | `/api/admin/students/{id}` | مشاهده پرونده کامل، کارنامه‌ها و وضعیت تحصیلی |
| `PUT` | `/api/admin/students/{id}` | ویرایش مشخصات دانش‌آموز |
| `DELETE` | `/api/admin/students/{id}` | حذف دانش‌آموز و پرونده‌های وابسته |
| `POST` | `/api/admin/students/{id}/toggle-active` | فعال‌سازی / مسدودسازی حساب دانش‌آموز |
| `POST` | `/api/admin/students/{id}/reset-password` | بازنشانی کلمه عبور به کد ملی پیش‌فرض |
| `POST` | `/api/admin/students/bulk-import` | ورود دسته‌جمعی دانش‌آموزان از طریق CSV/JSON |
| `GET` | `/api/admin/teachers` | لیست دبیران و اساتید همراه با کلاس‌ها و دروس تخصیص‌یافته |
| `POST` | `/api/admin/teachers` | افزودن دبیر جدید و انتساب دروس و کلاس‌ها |
| `PUT` | `/api/admin/teachers/{id}` | ویرایش اطلاعات و انتساب‌های دبیر |
| `DELETE` | `/api/admin/teachers/{id}` | حذف حساب دبیر |
| `GET` | `/api/admin/classes` | لیست کلاس‌های درس، پایه‌ها، ظرفیت و آمار دانش‌آموزان |
| `POST` | `/api/admin/classes` | ایجاد کلاس درس جدید |
| `GET` | `/api/admin/subjects` | برنامه درسی، کد دروس و ضرایب واحدهای درسی |
| `POST` | `/api/admin/subjects` | تعریف درس جدید در سامانه |
| `GET` | `/api/admin/academic-years` | سال‌های تحصیلی آموزشگاه |
| `POST` | `/api/admin/academic-years/{id}/set-current` | فعال‌سازی سال تحصیلی جاری |
| `GET` | `/api/admin/grades` | داشبورد نظارت بر کلیه نمرات ثبت‌شده دبیران |
| `POST` | `/api/admin/report-cards/generate-batch` | موتور پردازش و صدور دسته‌جمعی کارنامه ماهانه کلاس و رتبه‌بندی |
| `POST` | `/api/admin/report-cards/generate-semester` | محاسبه و صدور کارنامه نوبت اول، دوم یا جامع سالانه |
| `GET` | `/api/admin/announcements` | مشاهده کلیه اطلاعیه‌ها و بخشنامه‌ها |
| `POST` | `/api/admin/announcements` | انتشار اطلاعیه جدید با تعیین جامعه هدف و اولویت |
| `GET` | `/api/admin/audit-logs` | گزارش غیرقابل تغییر رویدادها، ورودها و عملیات سامانه |
| `GET` | `/api/admin/settings` | دریافت مشخصات و تنظیمات عمومی آموزشگاه |
| `PUT` | `/api/admin/settings` | به‌روزرسانی مشخصات آموزشگاه و نمره قبولی |

---

## ۳. پنل دبیران (Teacher Endpoints)

| متد | آدرس | شرح |
|---|---|---|
| `GET` | `/api/teacher/dashboard` | خلاصه آمار، کلاس‌های تحت تدریس و تکالیف فعال |
| `GET` | `/api/teacher/grades` | نمرات ثبت‌شده برای کلاس‌ها و دروس مرتبط با دبیر |
| `POST` | `/api/teacher/grades` | ثبت یا ویرایش نمره کلاسی/مستمر/پایانی برای دانش‌آموز |
| `GET` | `/api/teacher/attendance` | مشاهده سوابق حضور و غیاب کلاس |
| `POST` | `/api/teacher/attendance/batch` | ثبت دفتر حضور و غیاب روزانه برای تمام دانش‌آموزان کلاس |
| `GET` | `/api/teacher/homeworks` | مدیریت تکالیف تعریف‌شده |
| `POST` | `/api/teacher/homeworks` | تعریف تکلیف جدید با پیوست و تاریخ مهلت |
| `POST` | `/api/teacher/homeworks/submissions/{id}/grade` | نمره‌دهی و ثبت بازخورد به پاسخ تکلیف دانش‌آموز |
| `POST` | `/api/teacher/notes` | ثبت یادداشت‌های آموزشی، انضباطی و نقاط قوت |

---

## ۴. پنل دانش‌آموزان (Student Endpoints)

| متد | آدرس | شرح |
|---|---|---|
| `GET` | `/api/student/dashboard` | خلاصه وضعیت، آخرین نمرات، آمار غیبت و تکالیف فعال |
| `GET` | `/api/student/grades` | ریز نمرات تحصیلی به تفکیک درس، ماه و نوع آزمون |
| `GET` | `/api/student/attendance` | گزارش کامل حضور، غیبت‌ها و تاخیرها |
| `GET` | `/api/student/homeworks` | لیست تکالیف کلاسی همراه با وضعیت ارسال پاسخ |
| `POST` | `/api/student/homeworks/{id}/submit` | ارسال پاسخ تکلیف متنی یا پیوست تصویر/فایل |
| `GET` | `/api/student/report-cards` | کارنامه‌های رسمی صادرشده ماهانه و نوبت اول/دوم با معدل و رتبه |
| `GET` | `/api/student/notes` | توصیه‌ها و بازخوردهای آموزشی ثبت‌شده توسط دبیران |
| `GET` | `/api/student/profile` | مشاهده مشخصات فردی و تحصیلی |
| `PUT` | `/api/student/profile` | به‌روزرسانی تصویر آواتار |
