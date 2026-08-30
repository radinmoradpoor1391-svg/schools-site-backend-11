<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class AuditLogService
{
    /**
     * Record an audit log entry.
     */
    public static function log(string $action, ?string $targetType = null, ?string $targetId = null, ?string $details = null): AuditLog
    {
        $user = Auth::user();

        return AuditLog::create([
            'user_id' => $user?->id,
            'user_name' => $user ? ($user->first_name . ' ' . $user->last_name) : 'سیستم خودکار',
            'user_role' => $user?->role ?? 'admin',
            'action' => $action,
            'target_type' => $targetType,
            'target_id' => $targetId ? (string) $targetId : null,
            'details' => $details,
            'ip_address' => Request::ip(),
        ]);
    }
}
