<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$roles
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'دسترسی غیرمجاز. لطفاً وارد سیستم شوید.',
            ], 401);
        }

        if (!$user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'حساب کاربری شما توسط مدیریت غیرفعال شده است.',
            ], 403);
        }

        // Normalize comparison (e.g. 'admin', 'teacher', 'student')
        $userRole = strtolower($user->role);
        $allowedRoles = array_map('strtolower', $roles);

        if (!in_array($userRole, $allowedRoles, true)) {
            return response()->json([
                'success' => false,
                'message' => 'شما مجوز دسترسی به این بخش از سامانه را ندارید.',
            ], 403);
        }

        return $next($request);
    }
}
