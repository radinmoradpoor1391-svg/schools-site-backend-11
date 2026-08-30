<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\Announcement;
use App\Models\AttendanceRecord;
use App\Models\AuditLog;
use App\Models\Grade;
use App\Models\Homework;
use App\Models\HomeworkSubmission;
use App\Models\ReportCard;
use App\Models\SchoolClass;
use App\Models\SchoolSetting;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\TeacherNote;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SyncController extends Controller
{
    /**
     * Aggregated sync endpoint for school data tailored to authenticated user role.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user('sanctum');

        $academicYears = AcademicYear::orderByDesc('is_current')->orderBy('id', 'desc')->get()->map(function ($y) {
            return [
                'id' => (string) $y->id,
                'name' => $y->name,
                'startDate' => $y->start_date ?? '',
                'endDate' => $y->end_date ?? '',
                'isCurrent' => (bool) $y->is_current,
                'isArchived' => (bool) $y->is_archived,
            ];
        });

        $schoolConfig = SchoolSetting::get('school_config', [
            'schoolName' => 'دبیرستان دوره اول پدیده دانش',
            'managerName' => 'دکتر محمد رضایی',
            'district' => 'منطقه ۳',
            'province' => 'تهران',
            'academicYear' => '۱۴۰۴–۱۴۰۵',
            'phone' => '۰۲۱-۸۸۷۷۶۶۵۵',
            'address' => 'تهران، خیابان ولیعصر، بالاتر از میدان ونک، بن‌بست دانش، پلاک ۱۲',
            'passGrade' => 10,
        ]);

        $classes = SchoolClass::with(['homeroomTeacher', 'students'])->get()->map(function ($c) {
            return [
                'id' => (string) $c->id,
                'name' => $c->name,
                'gradeLevel' => $c->grade_level,
                'roomNumber' => $c->room_number ?? '',
                'fieldOfStudy' => $c->field_of_study ?? 'عمومی',
                'capacity' => (int) ($c->capacity ?? 30),
                'academicYearId' => (string) ($c->academic_year_id ?? ''),
                'homeroomTeacherId' => $c->homeroom_teacher_id ? (string) $c->homeroom_teacher_id : null,
                'studentIds' => $c->students ? $c->students->pluck('id')->map(fn($id) => (string)$id)->toArray() : [],
            ];
        });

        $subjects = Subject::all()->map(function ($s) {
            return [
                'id' => (string) $s->id,
                'title' => $s->title,
                'code' => $s->code,
                'coefficient' => (int) $s->coefficient,
                'gradeLevel' => $s->grade_level ?? '',
                'description' => $s->description ?? '',
            ];
        });

        // 1. Unauthenticated or Guest
        if (!$user) {
            return response()->json([
                'success' => true,
                'data' => [
                    'students' => [],
                    'teachers' => [],
                    'classes' => $classes,
                    'subjects' => $subjects,
                    'grades' => [],
                    'attendance' => [],
                    'homeworks' => [],
                    'submissions' => [],
                    'announcements' => Announcement::whereIn('target', ['all'])->orWhereNull('target')->latest()->get()->map(function ($an) {
                        return [
                            'id' => (string) $an->id,
                            'title' => $an->title,
                            'content' => $an->content,
                            'authorName' => $an->author_name ?? 'مدیریت آموزشگاه',
                            'authorRole' => $an->author_role ?? 'admin',
                            'target' => $an->target ?? 'all',
                            'targetClassId' => $an->target_class_id ? (string) $an->target_class_id : null,
                            'priority' => $an->priority ?? 'normal',
                            'expiryDate' => $an->expiry_date,
                            'createdAt' => (string) $an->created_at,
                            'attachmentName' => $an->attachment_name,
                            'attachmentUrl' => $an->attachment_url,
                            'readByUserIds' => $an->read_by_user_ids ?? [],
                        ];
                    }),
                    'reportCards' => [],
                    'teacherNotes' => [],
                    'auditLogs' => [],
                    'academicYears' => $academicYears,
                    'schoolConfig' => $schoolConfig,
                ],
            ]);
        }

        // 2. Admin Role - Full Data Access
        if ($user->isAdmin()) {
            $students = Student::with(['user', 'currentClass'])->orderBy('last_name')->get()->map(function ($st) {
                return [
                    'id' => (string) $st->id,
                    'userId' => (string) $st->user_id,
                    'studentCode' => $st->student_code ?? '',
                    'nationalId' => $st->national_id,
                    'firstName' => $st->first_name,
                    'lastName' => $st->last_name,
                    'fatherName' => $st->father_name ?? '',
                    'birthDate' => $st->birth_date ?? '',
                    'classId' => $st->current_class_id ? (string) $st->current_class_id : '',
                    'className' => $st->currentClass?->name ?? '',
                    'gradeLevel' => $st->grade_level ?? '',
                    'fieldOfStudy' => $st->field_of_study ?? 'عمومی',
                    'parentPhone' => $st->parent_phone ?? '',
                    'address' => $st->address ?? '',
                    'disciplineScore' => (float) ($st->discipline_score ?? 20.00),
                    'isActive' => (bool) ($st->user?->is_active ?? $st->is_active),
                    'firstLogin' => (bool) ($st->user?->first_login ?? $st->first_login),
                    'avatarUrl' => $st->user?->avatar_url ?? $st->avatar_url,
                ];
            });

            $teachers = Teacher::with(['user', 'assignedClasses', 'assignedSubjects'])->orderBy('last_name')->get()->map(function ($tc) {
                return [
                    'id' => (string) $tc->id,
                    'userId' => (string) $tc->user_id,
                    'personnelCode' => $tc->personnel_code ?? '',
                    'nationalId' => $tc->national_id,
                    'firstName' => $tc->first_name,
                    'lastName' => $tc->last_name,
                    'specialty' => $tc->specialty ?? 'عمومی',
                    'degree' => $tc->degree ?? 'کارشناسی',
                    'phone' => $tc->phone ?? '',
                    'email' => $tc->email ?? ($tc->user?->email ?? ''),
                    'bio' => $tc->bio ?? '',
                    'assignedClassIds' => $tc->assignedClasses ? $tc->assignedClasses->pluck('id')->map(fn($id) => (string)$id)->unique()->values()->toArray() : [],
                    'assignedSubjectIds' => $tc->assignedSubjects ? $tc->assignedSubjects->pluck('id')->map(fn($id) => (string)$id)->unique()->values()->toArray() : [],
                    'isActive' => (bool) ($tc->user?->is_active ?? $tc->is_active),
                    'firstLogin' => (bool) ($tc->user?->first_login ?? $tc->first_login),
                    'avatarUrl' => $tc->user?->avatar_url ?? $tc->avatar_url,
                ];
            });

            $grades = Grade::with(['student', 'teacher', 'subject', 'schoolClass'])->latest('id')->get()->map(function ($g) {
                return [
                    'id' => (string) $g->id,
                    'studentId' => (string) $g->student_id,
                    'studentName' => $g->student ? ($g->student->first_name . ' ' . $g->student->last_name) : '',
                    'teacherId' => $g->teacher_id ? (string) $g->teacher_id : '',
                    'teacherName' => $g->teacher ? ($g->teacher->first_name . ' ' . $g->teacher->last_name) : '',
                    'subjectId' => (string) $g->subject_id,
                    'subjectTitle' => $g->subject?->title ?? '',
                    'classId' => (string) ($g->class_id ?? $g->student?->current_class_id ?? ''),
                    'academicYearId' => (string) ($g->academic_year_id ?? ''),
                    'score' => (float) $g->score,
                    'maxScore' => (float) ($g->max_score ?? 20.00),
                    'gradeType' => $g->grade_type ?? 'daily',
                    'date' => $g->date ?? '',
                    'month' => $g->month ?? '',
                    'semester' => $g->semester ?? 'semester1',
                    'description' => $g->description ?? '',
                    'createdAt' => (string) $g->created_at,
                ];
            });

            $attendance = AttendanceRecord::with('student')->latest('date')->get()->map(function ($a) {
                return [
                    'id' => (string) $a->id,
                    'studentId' => (string) $a->student_id,
                    'classId' => (string) $a->class_id,
                    'date' => $a->date,
                    'status' => $a->status,
                    'note' => $a->note,
                ];
            });

            $homeworks = Homework::with(['subject', 'schoolClass', 'teacher'])->latest('id')->get()->map(function ($h) {
                return [
                    'id' => (string) $h->id,
                    'classId' => (string) $h->class_id,
                    'subjectId' => (string) $h->subject_id,
                    'teacherId' => (string) $h->teacher_id,
                    'title' => $h->title,
                    'description' => $h->description,
                    'dueDate' => $h->due_date,
                    'attachmentUrl' => $h->attachment_url,
                    'createdAt' => (string) $h->created_at,
                ];
            });

            $submissions = HomeworkSubmission::latest('id')->get()->map(function ($s) {
                return [
                    'id' => (string) $s->id,
                    'homeworkId' => (string) $s->homework_id,
                    'studentId' => (string) $s->student_id,
                    'studentName' => $s->student ? ($s->student->first_name . ' ' . $s->student->last_name) : '',
                    'answerText' => $s->answer_text,
                    'fileUrl' => $s->file_url,
                    'fileName' => $s->file_name,
                    'fileType' => $s->file_type,
                    'submittedAt' => (string) $s->submitted_at,
                    'grade' => $s->grade !== null ? (float) $s->grade : null,
                    'teacherFeedback' => $s->teacher_feedback,
                    'status' => $s->status,
                ];
            });

            $announcements = Announcement::orderByDesc('created_at')->get()->map(function ($an) {
                return [
                    'id' => (string) $an->id,
                    'title' => $an->title,
                    'content' => $an->content,
                    'authorName' => $an->author_name ?? 'مدیریت آموزشگاه',
                    'authorRole' => $an->author_role ?? 'admin',
                    'target' => $an->target ?? $an->target_role ?? 'all',
                    'targetClassId' => $an->target_class_id ? (string) $an->target_class_id : null,
                    'priority' => $an->priority ?? 'normal',
                    'expiryDate' => $an->expiry_date,
                    'createdAt' => (string) $an->created_at,
                    'attachmentName' => $an->attachment_name,
                    'attachmentUrl' => $an->attachment_url,
                    'readByUserIds' => $an->read_by_user_ids ?? [],
                ];
            });

            $reportCards = ReportCard::with(['student', 'schoolClass', 'academicYear'])->get()->map(function ($rc) {
                return [
                    'id' => (string) $rc->id,
                    'studentId' => (string) $rc->student_id,
                    'studentName' => $rc->student ? ($rc->student->first_name . ' ' . $rc->student->last_name) : '',
                    'studentCode' => $rc->student?->student_code ?? '',
                    'classId' => (string) $rc->class_id,
                    'className' => $rc->schoolClass?->name ?? '',
                    'academicYearId' => (string) ($rc->academic_year_id ?? ''),
                    'academicYearName' => $rc->academicYear?->name ?? 'سال تحصیلی جاری',
                    'type' => $rc->type,
                    'monthName' => $rc->month_name,
                    'gpa' => (float) $rc->gpa,
                    'rankInClass' => (int) ($rc->rank_in_class ?? 1),
                    'rankInGrade' => (int) ($rc->rank_in_grade ?? 1),
                    'totalUnits' => (int) ($rc->total_units ?? 0),
                    'totalWeightedScore' => (float) ($rc->total_weighted_score ?? 0),
                    'items' => $rc->items ?? [],
                    'attendanceSummary' => $rc->attendance_summary ?? [
                        'totalDays' => 30,
                        'present' => 30,
                        'absent' => 0,
                        'justified' => 0,
                        'tardy' => 0,
                    ],
                    'disciplineScore' => (float) ($rc->discipline_score ?? 20.00),
                    'status' => $rc->is_published ? 'published' : 'draft',
                    'isPublished' => (bool) $rc->is_published,
                    'generatedAt' => (string) ($rc->issue_date ?? $rc->created_at),
                    'managerNote' => $rc->manager_note ?? '',
                    'adviserNote' => $rc->adviser_note ?? '',
                ];
            });

            $teacherNotes = TeacherNote::with(['teacher', 'student'])->latest('id')->get()->map(function ($tn) {
                return [
                    'id' => (string) $tn->id,
                    'studentId' => (string) $tn->student_id,
                    'studentName' => $tn->student ? ($tn->student->first_name . ' ' . $tn->student->last_name) : '',
                    'teacherId' => (string) $tn->teacher_id,
                    'teacherName' => $tn->teacher ? ($tn->teacher->first_name . ' ' . $tn->teacher->last_name) : '',
                    'type' => $tn->type ?? 'consultation',
                    'title' => $tn->title ?? 'یادداشت',
                    'content' => $tn->content,
                    'isPrivateToAdmin' => (bool) ($tn->is_private_to_admin ?? false),
                    'date' => $tn->date ?? date('Y/m/d'),
                    'createdAt' => (string) $tn->created_at,
                ];
            });

            $auditLogs = AuditLog::with('user')->orderByDesc('created_at')->limit(150)->get()->map(function ($l) {
                return [
                    'id' => (string) $l->id,
                    'action' => $l->action,
                    'entityType' => $l->entity_type,
                    'entityId' => $l->entity_id,
                    'userId' => (string) $l->user_id,
                    'userName' => $l->user ? ($l->user->first_name . ' ' . $l->user->last_name) : 'سیستم',
                    'userRole' => $l->user?->role ?? 'admin',
                    'timestamp' => (string) $l->created_at,
                    'details' => $l->details,
                    'ipAddress' => $l->ip_address,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'students' => $students,
                    'teachers' => $teachers,
                    'classes' => $classes,
                    'subjects' => $subjects,
                    'grades' => $grades,
                    'attendance' => $attendance,
                    'homeworks' => $homeworks,
                    'submissions' => $submissions,
                    'announcements' => $announcements,
                    'reportCards' => $reportCards,
                    'teacherNotes' => $teacherNotes,
                    'auditLogs' => $auditLogs,
                    'academicYears' => $academicYears,
                    'schoolConfig' => $schoolConfig,
                ],
            ]);
        }

        // 3. Teacher Role Access
        if ($user->isTeacher()) {
            $teacher = $user->teacher;
            $teacherClassIds = $teacher ? $teacher->assignedClasses()->pluck('school_classes.id')->toArray() : [];

            $students = Student::whereIn('current_class_id', $teacherClassIds)->with(['user', 'currentClass'])->get()->map(function ($st) {
                return [
                    'id' => (string) $st->id,
                    'userId' => (string) $st->user_id,
                    'studentCode' => $st->student_code ?? '',
                    'nationalId' => $st->national_id,
                    'firstName' => $st->first_name,
                    'lastName' => $st->last_name,
                    'fatherName' => $st->father_name ?? '',
                    'birthDate' => $st->birth_date ?? '',
                    'classId' => $st->current_class_id ? (string) $st->current_class_id : '',
                    'className' => $st->currentClass?->name ?? '',
                    'gradeLevel' => $st->grade_level ?? '',
                    'fieldOfStudy' => $st->field_of_study ?? 'عمومی',
                    'parentPhone' => $st->parent_phone ?? '',
                    'disciplineScore' => (float) ($st->discipline_score ?? 20.00),
                    'isActive' => (bool) ($st->user?->is_active ?? $st->is_active),
                    'firstLogin' => (bool) ($st->user?->first_login ?? $st->first_login),
                    'avatarUrl' => $st->user?->avatar_url ?? $st->avatar_url,
                ];
            });

            $teacherGrades = Grade::where('teacher_id', $teacher?->id)->with(['student', 'subject', 'schoolClass'])->latest('id')->get()->map(function ($g) {
                return [
                    'id' => (string) $g->id,
                    'studentId' => (string) $g->student_id,
                    'studentName' => $g->student ? ($g->student->first_name . ' ' . $g->student->last_name) : '',
                    'teacherId' => (string) $g->teacher_id,
                    'subjectId' => (string) $g->subject_id,
                    'subjectTitle' => $g->subject?->title ?? '',
                    'classId' => (string) $g->class_id,
                    'academicYearId' => (string) ($g->academic_year_id ?? ''),
                    'score' => (float) $g->score,
                    'maxScore' => (float) ($g->max_score ?? 20.00),
                    'gradeType' => $g->grade_type ?? 'daily',
                    'date' => $g->date ?? '',
                    'month' => $g->month ?? '',
                    'semester' => $g->semester ?? 'semester1',
                    'description' => $g->description ?? '',
                    'createdAt' => (string) $g->created_at,
                ];
            });

            $teacherHomeworks = Homework::where('teacher_id', $teacher?->id)->latest('id')->get()->map(function ($h) {
                return [
                    'id' => (string) $h->id,
                    'classId' => (string) $h->class_id,
                    'subjectId' => (string) $h->subject_id,
                    'teacherId' => (string) $h->teacher_id,
                    'title' => $h->title,
                    'description' => $h->description,
                    'dueDate' => $h->due_date,
                    'attachmentUrl' => $h->attachment_url,
                    'createdAt' => (string) $h->created_at,
                ];
            });

            $teacherNotes = TeacherNote::where('teacher_id', $teacher?->id)->latest('id')->get()->map(function ($tn) {
                return [
                    'id' => (string) $tn->id,
                    'studentId' => (string) $tn->student_id,
                    'teacherId' => (string) $tn->teacher_id,
                    'type' => $tn->type ?? 'consultation',
                    'title' => $tn->title ?? 'یادداشت',
                    'content' => $tn->content,
                    'isPrivateToAdmin' => (bool) ($tn->is_private_to_admin ?? false),
                    'date' => $tn->date ?? date('Y/m/d'),
                    'createdAt' => (string) $tn->created_at,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'students' => $students,
                    'teachers' => $teacher ? [[
                        'id' => (string) $teacher->id,
                        'userId' => (string) $teacher->user_id,
                        'personnelCode' => $teacher->personnel_code ?? '',
                        'nationalId' => $teacher->national_id,
                        'firstName' => $teacher->first_name,
                        'lastName' => $teacher->last_name,
                        'specialty' => $teacher->specialty ?? 'عمومی',
                        'degree' => $teacher->degree ?? 'کارشناسی',
                        'phone' => $teacher->phone ?? '',
                        'email' => $teacher->email ?? ($teacher->user?->email ?? ''),
                        'bio' => $teacher->bio ?? '',
                        'assignedClassIds' => array_map('strval', $teacherClassIds),
                        'assignedSubjectIds' => $teacher->assignedSubjects ? $teacher->assignedSubjects->pluck('id')->map(fn($id) => (string)$id)->toArray() : [],
                        'isActive' => (bool) ($teacher->user?->is_active ?? $teacher->is_active),
                        'firstLogin' => (bool) ($teacher->user?->first_login ?? $teacher->first_login),
                        'avatarUrl' => $teacher->user?->avatar_url ?? $teacher->avatar_url,
                    ]] : [],
                    'classes' => $classes->whereIn('id', array_map('strval', $teacherClassIds))->values(),
                    'subjects' => $subjects,
                    'grades' => $teacherGrades,
                    'attendance' => AttendanceRecord::whereIn('class_id', $teacherClassIds)->get(),
                    'homeworks' => $teacherHomeworks,
                    'submissions' => HomeworkSubmission::whereIn('homework_id', collect($teacherHomeworks)->pluck('id'))->get(),
                    'announcements' => Announcement::whereIn('target', ['all', 'teachers'])->latest()->get()->map(function ($an) {
                        return [
                            'id' => (string) $an->id,
                            'title' => $an->title,
                            'content' => $an->content,
                            'authorName' => $an->author_name ?? 'مدیریت آموزشگاه',
                            'authorRole' => $an->author_role ?? 'admin',
                            'target' => $an->target ?? 'all',
                            'targetClassId' => $an->target_class_id ? (string) $an->target_class_id : null,
                            'priority' => $an->priority ?? 'normal',
                            'expiryDate' => $an->expiry_date,
                            'createdAt' => (string) $an->created_at,
                            'attachmentName' => $an->attachment_name,
                            'attachmentUrl' => $an->attachment_url,
                            'readByUserIds' => $an->read_by_user_ids ?? [],
                        ];
                    }),
                    'reportCards' => [],
                    'teacherNotes' => $teacherNotes,
                    'auditLogs' => [],
                    'academicYears' => $academicYears,
                    'schoolConfig' => $schoolConfig,
                ],
            ]);
        }

        // 4. Student Role Access
        if ($user->isStudent()) {
            $student = $user->student;
            $studentClassId = $student?->current_class_id;

            return response()->json([
                'success' => true,
                'data' => [
                    'students' => $student ? [[
                        'id' => (string) $student->id,
                        'userId' => (string) $student->user_id,
                        'studentCode' => $student->student_code ?? '',
                        'nationalId' => $student->national_id,
                        'firstName' => $student->first_name,
                        'lastName' => $student->last_name,
                        'fatherName' => $student->father_name ?? '',
                        'birthDate' => $student->birth_date ?? '',
                        'classId' => $student->current_class_id ? (string) $student->current_class_id : '',
                        'className' => $student->currentClass?->name ?? '',
                        'gradeLevel' => $student->grade_level ?? '',
                        'fieldOfStudy' => $student->field_of_study ?? 'عمومی',
                        'parentPhone' => $student->parent_phone ?? '',
                        'address' => $student->address ?? '',
                        'disciplineScore' => (float) ($student->discipline_score ?? 20.00),
                        'isActive' => (bool) ($student->user?->is_active ?? $student->is_active),
                        'firstLogin' => (bool) ($student->user?->first_login ?? $student->first_login),
                        'avatarUrl' => $student->user?->avatar_url ?? $student->avatar_url,
                    ]] : [],
                    'teachers' => [],
                    'classes' => $classes->where('id', (string) $studentClassId)->values(),
                    'subjects' => $subjects,
                    'grades' => Grade::where('student_id', $student?->id)->with(['subject'])->latest('id')->get()->map(function ($g) {
                        return [
                            'id' => (string) $g->id,
                            'studentId' => (string) $g->student_id,
                            'subjectId' => (string) $g->subject_id,
                            'subjectTitle' => $g->subject?->title ?? '',
                            'classId' => (string) $g->class_id,
                            'academicYearId' => (string) ($g->academic_year_id ?? ''),
                            'score' => (float) $g->score,
                            'maxScore' => (float) ($g->max_score ?? 20.00),
                            'gradeType' => $g->grade_type ?? 'daily',
                            'date' => $g->date ?? '',
                            'month' => $g->month ?? '',
                            'semester' => $g->semester ?? 'semester1',
                            'description' => $g->description ?? '',
                            'createdAt' => (string) $g->created_at,
                        ];
                    }),
                    'attendance' => AttendanceRecord::where('student_id', $student?->id)->latest('date')->get(),
                    'homeworks' => Homework::where('class_id', $studentClassId)->latest('id')->get(),
                    'submissions' => HomeworkSubmission::where('student_id', $student?->id)->get(),
                    'announcements' => Announcement::whereIn('target', ['all', 'students'])
                        ->orWhere('target_class_id', $studentClassId)
                        ->latest()
                        ->get()
                        ->map(function ($an) {
                            return [
                                'id' => (string) $an->id,
                                'title' => $an->title,
                                'content' => $an->content,
                                'authorName' => $an->author_name ?? 'مدیریت آموزشگاه',
                                'authorRole' => $an->author_role ?? 'admin',
                                'target' => $an->target ?? 'all',
                                'targetClassId' => $an->target_class_id ? (string) $an->target_class_id : null,
                                'priority' => $an->priority ?? 'normal',
                                'expiryDate' => $an->expiry_date,
                                'createdAt' => (string) $an->created_at,
                                'attachmentName' => $an->attachment_name,
                                'attachmentUrl' => $an->attachment_url,
                                'readByUserIds' => $an->read_by_user_ids ?? [],
                            ];
                        }),
                    'reportCards' => ReportCard::where('student_id', $student?->id)->where('is_published', true)->get()->map(function ($rc) {
                        return [
                            'id' => (string) $rc->id,
                            'studentId' => (string) $rc->student_id,
                            'classId' => (string) $rc->class_id,
                            'academicYearId' => (string) ($rc->academic_year_id ?? ''),
                            'type' => $rc->type,
                            'monthName' => $rc->month_name,
                            'gpa' => (float) $rc->gpa,
                            'rankInClass' => (int) ($rc->rank_in_class ?? 1),
                            'rankInGrade' => (int) ($rc->rank_in_grade ?? 1),
                            'totalUnits' => (int) ($rc->total_units ?? 0),
                            'totalWeightedScore' => (float) ($rc->total_weighted_score ?? 0),
                            'items' => $rc->items ?? [],
                            'disciplineScore' => (float) ($rc->discipline_score ?? 20.00),
                            'status' => 'published',
                            'isPublished' => true,
                            'generatedAt' => (string) ($rc->issue_date ?? $rc->created_at),
                        ];
                    }),
                    'teacherNotes' => TeacherNote::where('student_id', $student?->id)->where('is_private_to_admin', false)->get(),
                    'auditLogs' => [],
                    'academicYears' => $academicYears,
                    'schoolConfig' => $schoolConfig,
                ],
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'students' => [],
                'teachers' => [],
                'classes' => $classes,
                'subjects' => $subjects,
                'grades' => [],
                'attendance' => [],
                'homeworks' => [],
                'submissions' => [],
                'announcements' => [],
                'reportCards' => [],
                'teacherNotes' => [],
                'auditLogs' => [],
                'academicYears' => $academicYears,
                'schoolConfig' => $schoolConfig,
            ],
        ]);
    }
}
