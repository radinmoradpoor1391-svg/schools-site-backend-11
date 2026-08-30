<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SchoolSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    /**
     * Get school settings (accessible to public or authenticated)
     */
    public function getSettings(): JsonResponse
    {
        $settings = SchoolSetting::all()->pluck('setting_value', 'setting_key')->toArray();

        return response()->json([
            'success' => true,
            'data' => [
                'schoolName' => $settings['school_name'] ?? 'مجتمع آموزشی و دبیرستان نمونه دانا',
                'managerName' => $settings['manager_name'] ?? 'دکتر محمد رضایی',
                'district' => $settings['district'] ?? 'منطقه ۶ آموزش و پرورش',
                'province' => $settings['province'] ?? 'تهران',
                'academicYear' => $settings['academic_year'] ?? '۱۴۰۴–۱۴۰۵',
                'phone' => $settings['phone'] ?? '۰۲۱-۸۸۹۹۰۰۱۱',
                'email' => $settings['email'] ?? 'info@dana-school.ir',
                'website' => $settings['website'] ?? 'www.dana-school.ir',
                'motto' => $settings['motto'] ?? 'پیشگام در آموزش هوشمند، پژوهش‌محور و تعالی اخلاقی',
                'address' => $settings['address'] ?? 'تهران، خیابان ولیعصر، نرسیده به میدان ونک، مجتمع آموزشی دانا',
                'passGrade' => (float) ($settings['pass_grade'] ?? 10.0),
                'attendanceThreshold' => (float) ($settings['attendance_threshold'] ?? 85.0),
                'smsApiKey' => $settings['sms_api_key'] ?? 'kavenegar-dana-live-9821',
                'smsAbsenceAlert' => ($settings['sms_absence_alert'] ?? '1') === '1',
                'smsReportCardRelease' => ($settings['sms_report_card_release'] ?? '1') === '1',
                'smsLowGradeAlert' => ($settings['sms_low_grade_alert'] ?? '0') === '1',
            ],
        ]);
    }

    /**
     * Update school settings (Admin only)
     */
    public function updateSettings(Request $request): JsonResponse
    {
        $data = $request->all();

        $keyMap = [
            'schoolName' => 'school_name',
            'managerName' => 'manager_name',
            'district' => 'district',
            'province' => 'province',
            'academicYear' => 'academic_year',
            'phone' => 'phone',
            'email' => 'email',
            'website' => 'website',
            'motto' => 'motto',
            'address' => 'address',
            'passGrade' => 'pass_grade',
            'attendanceThreshold' => 'attendance_threshold',
            'smsApiKey' => 'sms_api_key',
            'smsAbsenceAlert' => 'sms_absence_alert',
            'smsReportCardRelease' => 'sms_report_card_release',
            'smsLowGradeAlert' => 'sms_low_grade_alert',
        ];

        foreach ($data as $camelKey => $val) {
            if (isset($keyMap[$camelKey])) {
                $dbKey = $keyMap[$camelKey];
                $strVal = is_bool($val) ? ($val ? '1' : '0') : (string) $val;
                SchoolSetting::updateOrCreate(
                    ['setting_key' => $dbKey],
                    ['setting_value' => $strVal, 'group_name' => 'general']
                );
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'تنظیمات سامانه با موفقیت در پایگاه داده به‌روزرسانی شد.',
        ]);
    }
}
