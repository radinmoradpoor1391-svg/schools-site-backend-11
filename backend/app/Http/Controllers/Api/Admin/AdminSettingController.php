<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\SchoolSetting;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminSettingController extends Controller
{
    public function getSettings(): JsonResponse
    {
        $config = SchoolSetting::get('school_config', [
            'schoolName' => 'مجتمع آموزشی و دبیرستان نمونه دانا',
            'managerName' => 'دکتر محمد رضایی',
            'district' => 'منطقه ۳',
            'province' => 'تهران',
            'academicYear' => '۱۴۰۴–۱۴۰۵',
            'phone' => '۰۲۱-۸۸۷۷۶۶۵۵',
            'email' => 'info@dana-school.ir',
            'website' => 'www.dana-school.ir',
            'motto' => 'پیشگام در آموزش هوشمند، پژوهش‌محور و تعالی اخلاقی',
            'address' => 'تهران، خیابان ولیعصر، بالاتر از میدان ونک، بن‌بست دانش، پلاک ۱۲',
            'passGrade' => 10,
            'attendanceThreshold' => 85,
            'logoUrl' => '',
        ]);

        return response()->json([
            'success' => true,
            'data' => $config,
        ]);
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'schoolName' => 'required|string|max:150',
            'managerName' => 'required|string|max:100',
            'district' => 'nullable|string|max:50',
            'province' => 'nullable|string|max:50',
            'academicYear' => 'nullable|string|max:50',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|string|max:100',
            'website' => 'nullable|string|max:100',
            'motto' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:500',
            'passGrade' => 'nullable|numeric|between:0,20',
            'attendanceThreshold' => 'nullable|numeric|between:0,100',
            'logoUrl' => 'nullable|string|max:1000',
        ]);

        SchoolSetting::set('school_config', $validated);

        AuditLogService::log('ویرایش تنظیمات آموزشگاه', 'setting', null, 'به‌روزرسانی تنظیمات و اطلاعات عمومی مدرسه');

        return response()->json([
            'success' => true,
            'message' => 'تنظیمات آموزشگاه با موفقیت ذخیره شد.',
            'data' => $validated,
        ]);
    }
}
