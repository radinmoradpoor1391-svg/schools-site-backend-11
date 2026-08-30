<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ChangePasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\User;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    /**
     * Authenticate user (Admin, Teacher, Student) using username or national_id.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $username = trim($request->input('username'));
        $password = $request->input('password');

        // Look up user by username or national_id
        $user = User::where('username', $username)
            ->orWhere('national_id', $username)
            ->first();

        if (!$user || !Hash::check($password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'نام کاربری یا رمز عبور اشتباه است.',
            ], 401);
        }

        if (!$user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'حساب کاربری شما مسدود یا غیرفعال شده است. لطفاً با مدیریت تماس بگیرید.',
            ], 403);
        }

        // Generate Sanctum Token
        $token = $user->createToken('auth_token')->plainTextToken;

        // Load associated profile based on role
        $profile = null;
        if ($user->isStudent()) {
            $profile = $user->student()->with('currentClass')->first();
        } elseif ($user->isTeacher()) {
            $profile = $user->teacher()->with(['assignedClasses', 'assignedSubjects'])->first();
        }

        AuditLogService::log(
            'ورود به سامانه',
            'user',
            (string) $user->id,
            "ورود کاربر {$user->username} با نقش {$user->role}"
        );

        return response()->json([
            'success' => true,
            'message' => 'ورود با موفقیت انجام شد.',
            'token' => $token,
            'user' => [
                'id' => (string) $user->id,
                'username' => $user->username,
                'nationalId' => $user->national_id,
                'firstName' => $user->first_name,
                'lastName' => $user->last_name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'isActive' => (bool) $user->is_active,
                'firstLogin' => (bool) $user->first_login,
                'avatarUrl' => $user->avatar_url,
            ],
            'profile' => $profile,
        ]);
    }

    /**
     * Log out current user and revoke token.
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user) {
            $user->currentAccessToken()?->delete();
            AuditLogService::log('خروج از سامانه', 'user', (string) $user->id, "خروج کاربر {$user->username}");
        }

        return response()->json([
            'success' => true,
            'message' => 'با موفقیت از سامانه خارج شدید.',
        ]);
    }

    /**
     * Get authenticated user details and profile.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        $profile = null;
        if ($user->isStudent()) {
            $profile = $user->student()->with('currentClass')->first();
        } elseif ($user->isTeacher()) {
            $profile = $user->teacher()->with(['assignedClasses', 'assignedSubjects'])->first();
        }

        return response()->json([
            'success' => true,
            'user' => [
                'id' => (string) $user->id,
                'username' => $user->username,
                'nationalId' => $user->national_id,
                'firstName' => $user->first_name,
                'lastName' => $user->last_name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'isActive' => (bool) $user->is_active,
                'firstLogin' => (bool) $user->first_login,
                'avatarUrl' => $user->avatar_url,
            ],
            'profile' => $profile,
        ]);
    }

    /**
     * Update password for the current authenticated user.
     */
    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $user = $request->user();

        if (!Hash::check($request->input('current_password'), $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'رمز عبور فعلی نادرست است.',
            ], 422);
        }

        $user->update([
            'password' => Hash::make($request->input('new_password')),
            'first_login' => false,
        ]);

        AuditLogService::log('تغییر رمز عبور', 'user', (string) $user->id, "تغییر موفقیت‌آمیز رمز عبور توسط کاربر");

        return response()->json([
            'success' => true,
            'message' => 'کلمه عبور با موفقیت به‌روزرسانی شد.',
        ]);
    }
}
