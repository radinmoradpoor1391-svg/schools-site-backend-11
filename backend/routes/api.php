<?php

use App\Http\Controllers\Api\AcademicAnalyticsController;
use App\Http\Controllers\Api\Admin\AdminAcademicYearController;
use App\Http\Controllers\Api\Admin\AdminAnnouncementController;
use App\Http\Controllers\Api\Admin\AdminAuditLogController;
use App\Http\Controllers\Api\Admin\AdminClassController;
use App\Http\Controllers\Api\Admin\AdminGradeController;
use App\Http\Controllers\Api\Admin\AdminReportCardController;
use App\Http\Controllers\Api\Admin\AdminSettingController;
use App\Http\Controllers\Api\Admin\AdminStudentController;
use App\Http\Controllers\Api\Admin\AdminSubjectController;
use App\Http\Controllers\Api\Admin\AdminTeacherController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ExamController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\ScheduleController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\Student\StudentAttendanceController;
use App\Http\Controllers\Api\Student\StudentDashboardController;
use App\Http\Controllers\Api\Student\StudentGradeController;
use App\Http\Controllers\Api\Student\StudentHomeworkController;
use App\Http\Controllers\Api\Student\StudentNoteController;
use App\Http\Controllers\Api\Student\StudentProfileController;
use App\Http\Controllers\Api\Student\StudentReportCardController;
use App\Http\Controllers\Api\SyncController;
use App\Http\Controllers\Api\Teacher\TeacherAttendanceController;
use App\Http\Controllers\Api\Teacher\TeacherDashboardController;
use App\Http\Controllers\Api\Teacher\TeacherGradingController;
use App\Http\Controllers\Api\Teacher\TeacherHomeworkController;
use App\Http\Controllers\Api\Teacher\TeacherNoteController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes for Dana Smart School Management System (Laravel 12 API)
|--------------------------------------------------------------------------
*/

// =========================================================================
// 1. PUBLIC & AUTHENTICATION ENDPOINTS
// =========================================================================
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login'])->name('auth.login');
});

// School Public Settings
Route::get('/settings', [SettingController::class, 'getSettings'])->name('settings.get');

// Aggregated Sync Endpoint (Adapts to guest or authenticated user)
Route::get('/sync/all', [SyncController::class, 'index'])->name('sync.all');

// =========================================================================
// 2. PROTECTED ENDPOINTS (Requires Sanctum Token)
// =========================================================================
Route::middleware('auth:sanctum')->group(function () {
    
    // Shared Auth Management
    Route::prefix('auth')->group(function () {
        Route::get('/me', [AuthController::class, 'me'])->name('auth.me');
        Route::post('/logout', [AuthController::class, 'logout'])->name('auth.logout');
        Route::post('/change-password', [AuthController::class, 'changePassword'])->name('auth.change_password');
    });

    // Public announcements & Messages accessible to authenticated users
    Route::get('/announcements', [AdminAnnouncementController::class, 'index'])->name('shared.announcements');
    
    // Unified Messages API
    Route::get('/messages', [MessageController::class, 'index'])->name('messages.index');
    Route::post('/messages', [MessageController::class, 'store'])->name('messages.store');
    Route::post('/messages/{id}/read', [MessageController::class, 'markAsRead'])->name('messages.read');

    // Unified Timetable Schedule API
    Route::get('/schedules', [ScheduleController::class, 'index'])->name('schedules.index');
    Route::post('/schedules', [ScheduleController::class, 'store'])->name('schedules.store');
    Route::put('/schedules/{id}', [ScheduleController::class, 'update'])->name('schedules.update');
    Route::delete('/schedules/{id}', [ScheduleController::class, 'destroy'])->name('schedules.destroy');

    // Unified Exams API
    Route::get('/exams', [ExamController::class, 'index'])->name('exams.index');
    Route::post('/exams', [ExamController::class, 'store'])->name('exams.store');
    Route::delete('/exams/{id}', [ExamController::class, 'destroy'])->name('exams.destroy');

    // =====================================================================
    // 3. ADMIN ROLE ENDPOINTS
    // =====================================================================
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        // Analytics
        Route::get('/analytics/school', [AcademicAnalyticsController::class, 'schoolProgress']);
        Route::get('/analytics/student/{id}/progress', [AcademicAnalyticsController::class, 'studentProgress']);
        Route::get('/classes/{id}/analytics', [AcademicAnalyticsController::class, 'classAnalytics']);

        // Students
        Route::get('/students', [AdminStudentController::class, 'index']);
        Route::post('/students', [AdminStudentController::class, 'store']);
        Route::post('/students/bulk-import', [AdminStudentController::class, 'bulkImport']);
        Route::get('/students/{student}', [AdminStudentController::class, 'show']);
        Route::put('/students/{student}', [AdminStudentController::class, 'update']);
        Route::delete('/students/{student}', [AdminStudentController::class, 'destroy']);
        Route::post('/students/{student}/toggle-active', [AdminStudentController::class, 'toggleActive']);
        Route::post('/students/{student}/reset-password', [AdminStudentController::class, 'resetPassword']);

        // Teachers
        Route::get('/teachers', [AdminTeacherController::class, 'index']);
        Route::post('/teachers', [AdminTeacherController::class, 'store']);
        Route::get('/teachers/{teacher}', [AdminTeacherController::class, 'show']);
        Route::put('/teachers/{teacher}', [AdminTeacherController::class, 'update']);
        Route::delete('/teachers/{teacher}', [AdminTeacherController::class, 'destroy']);
        Route::post('/teachers/{teacher}/toggle-active', [AdminTeacherController::class, 'toggleActive']);
        Route::post('/teachers/{teacher}/reset-password', [AdminTeacherController::class, 'resetPassword']);

        // Classes
        Route::get('/classes', [AdminClassController::class, 'index']);
        Route::post('/classes', [AdminClassController::class, 'store']);
        Route::get('/classes/{class}', [AdminClassController::class, 'show']);
        Route::put('/classes/{class}', [AdminClassController::class, 'update']);
        Route::delete('/classes/{class}', [AdminClassController::class, 'destroy']);

        // Subjects
        Route::get('/subjects', [AdminSubjectController::class, 'index']);
        Route::post('/subjects', [AdminSubjectController::class, 'store']);
        Route::get('/subjects/{subject}', [AdminSubjectController::class, 'show']);
        Route::put('/subjects/{subject}', [AdminSubjectController::class, 'update']);
        Route::delete('/subjects/{subject}', [AdminSubjectController::class, 'destroy']);

        // Academic Years
        Route::get('/academic-years', [AdminAcademicYearController::class, 'index']);
        Route::post('/academic-years', [AdminAcademicYearController::class, 'store']);
        Route::put('/academic-years/{academicYear}', [AdminAcademicYearController::class, 'update']);
        Route::delete('/academic-years/{academicYear}', [AdminAcademicYearController::class, 'destroy']);
        Route::post('/academic-years/{academicYear}/set-current', [AdminAcademicYearController::class, 'setCurrent']);

        // Grades Oversight & Recording
        Route::get('/grades', [AdminGradeController::class, 'index']);
        Route::post('/grades', [AdminGradeController::class, 'store']);
        Route::put('/grades/{grade}', [AdminGradeController::class, 'update']);
        Route::delete('/grades/{grade}', [AdminGradeController::class, 'destroy']);

        // Report Cards
        Route::get('/report-cards', [AdminReportCardController::class, 'index']);
        Route::post('/report-cards/generate-batch', [AdminReportCardController::class, 'generateBatchMonthly']);
        Route::post('/report-cards/generate-semester', [AdminReportCardController::class, 'generateSemester']);

        // Announcements
        Route::get('/announcements', [AdminAnnouncementController::class, 'index']);
        Route::post('/announcements', [AdminAnnouncementController::class, 'store']);
        Route::put('/announcements/{announcement}', [AdminAnnouncementController::class, 'update']);
        Route::delete('/announcements/{announcement}', [AdminAnnouncementController::class, 'destroy']);

        // Audit Logs
        Route::get('/audit-logs', [AdminAuditLogController::class, 'index']);

        // School Settings
        Route::get('/settings', [SettingController::class, 'getSettings']);
        Route::put('/settings', [SettingController::class, 'updateSettings']);
    });

    // =====================================================================
    // 4. TEACHER ROLE ENDPOINTS
    // =====================================================================
    Route::middleware('role:teacher,admin')->prefix('teacher')->group(function () {
        Route::get('/dashboard', [TeacherDashboardController::class, 'index']);
        
        // Grading
        Route::get('/grades', [TeacherGradingController::class, 'index']);
        Route::post('/grades', [TeacherGradingController::class, 'store']);

        // Attendance
        Route::get('/attendance', [TeacherAttendanceController::class, 'index']);
        Route::post('/attendance/batch', [TeacherAttendanceController::class, 'storeBatch']);

        // Homework
        Route::get('/homeworks', [TeacherHomeworkController::class, 'index']);
        Route::post('/homeworks', [TeacherHomeworkController::class, 'store']);
        Route::post('/homeworks/submissions/{submission}/grade', [TeacherHomeworkController::class, 'gradeSubmission']);
        Route::delete('/homeworks/{homework}', [TeacherHomeworkController::class, 'destroy']);

        // Notes
        Route::get('/notes', [TeacherNoteController::class, 'index']);
        Route::post('/notes', [TeacherNoteController::class, 'store']);
    });

    // =====================================================================
    // 5. STUDENT ROLE ENDPOINTS
    // =====================================================================
    Route::middleware('role:student,admin')->prefix('student')->group(function () {
        Route::get('/dashboard', [StudentDashboardController::class, 'index']);
        Route::get('/progress', [AcademicAnalyticsController::class, 'myProgress']);
        Route::get('/grades', [StudentGradeController::class, 'index']);
        Route::get('/attendance', [StudentAttendanceController::class, 'index']);
        Route::get('/homeworks', [StudentHomeworkController::class, 'index']);
        Route::post('/homeworks/{homework}/submit', [StudentHomeworkController::class, 'submit']);
        Route::get('/report-cards', [StudentReportCardController::class, 'index']);
        Route::get('/report-cards/{reportCard}', [StudentReportCardController::class, 'show']);
        Route::get('/notes', [StudentNoteController::class, 'index']);
        Route::get('/profile', [StudentProfileController::class, 'show']);
        Route::put('/profile', [StudentProfileController::class, 'update']);
    });
});
