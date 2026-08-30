import {
  Student,
  Teacher,
  SchoolClass,
  Subject,
  Grade,
  Announcement,
  ReportCard,
  AcademicYear,
  AttendanceRecord,
  Homework,
  HomeworkSubmission,
  TeacherNote,
  AuditLog,
  SchoolConfig,
  SchedulePeriod,
} from '../types';

export function normalizeAcademicYear(raw: any): AcademicYear {
  if (!raw) return raw;
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    startDate: String(raw.startDate ?? raw.start_date ?? ''),
    endDate: String(raw.endDate ?? raw.end_date ?? ''),
    isCurrent: Boolean(raw.isCurrent ?? raw.is_current ?? false),
    isArchived: Boolean(raw.isArchived ?? raw.is_archived ?? false),
  };
}

export function normalizeStudent(raw: any): Student {
  if (!raw) return raw;
  const classId = raw.classId !== undefined && raw.classId !== null
    ? String(raw.classId)
    : (raw.current_class_id ? String(raw.current_class_id) : (raw.class_id ? String(raw.class_id) : ''));

  return {
    id: String(raw.id ?? ''),
    userId: String(raw.userId ?? raw.user_id ?? ''),
    studentCode: raw.studentCode ?? raw.student_code ?? '',
    nationalId: String(raw.nationalId ?? raw.national_id ?? ''),
    firstName: raw.firstName ?? raw.first_name ?? '',
    lastName: raw.lastName ?? raw.last_name ?? '',
    fatherName: raw.fatherName ?? raw.father_name ?? '',
    birthDate: raw.birthDate ?? raw.birth_date ?? '',
    classId,
    className: raw.className ?? raw.current_class?.name ?? raw.currentClass?.name ?? '',
    gradeLevel: raw.gradeLevel ?? raw.grade_level ?? '',
    fieldOfStudy: raw.fieldOfStudy ?? raw.field_of_study ?? 'عمومی',
    parentPhone: raw.parentPhone ?? raw.parent_phone ?? '',
    address: raw.address ?? '',
    avatarUrl: raw.avatarUrl ?? raw.avatar_url ?? raw.user?.avatar_url,
    disciplineScore: Number(raw.disciplineScore ?? raw.discipline_score ?? 20),
    isActive: Boolean(raw.isActive ?? raw.is_active ?? raw.user?.is_active ?? true),
    firstLogin: Boolean(raw.firstLogin ?? raw.first_login ?? raw.user?.first_login ?? false),
  };
}

export function normalizeTeacher(raw: any): Teacher {
  if (!raw) return raw;
  const classIds = raw.assignedClassIds ?? raw.classIds ?? (raw.assigned_classes ? raw.assigned_classes.map((c: any) => String(c.id)) : []);
  const subjectIds = raw.assignedSubjectIds ?? raw.subjectIds ?? (raw.assigned_subjects ? raw.assigned_subjects.map((s: any) => String(s.id)) : []);

  return {
    id: String(raw.id ?? ''),
    userId: String(raw.userId ?? raw.user_id ?? ''),
    personnelCode: raw.personnelCode ?? raw.personnel_code ?? '',
    nationalId: String(raw.nationalId ?? raw.national_id ?? ''),
    username: raw.username ?? raw.user?.username ?? raw.nationalId ?? raw.national_id ?? '',
    firstName: raw.firstName ?? raw.first_name ?? '',
    lastName: raw.lastName ?? raw.last_name ?? '',
    specialty: raw.specialty ?? raw.specialization ?? 'عمومی',
    degree: raw.degree ?? 'کارشناسی',
    phone: raw.phone ?? '',
    email: raw.email ?? raw.user?.email ?? '',
    bio: raw.bio ?? '',
    assignedClassIds: Array.isArray(classIds) ? classIds.map(String) : [],
    assignedSubjectIds: Array.isArray(subjectIds) ? subjectIds.map(String) : [],
    avatarUrl: raw.avatarUrl ?? raw.avatar_url ?? raw.user?.avatar_url,
    isActive: Boolean(raw.isActive ?? raw.is_active ?? raw.user?.is_active ?? true),
    firstLogin: Boolean(raw.firstLogin ?? raw.first_login ?? raw.user?.first_login ?? false),
  };
}

export function normalizeClass(raw: any): SchoolClass {
  if (!raw) return raw;
  const studentIds = raw.studentIds ?? (raw.students ? raw.students.map((s: any) => String(s.id)) : []);

  return {
    id: String(raw.id ?? ''),
    name: raw.name ?? '',
    gradeLevel: raw.gradeLevel ?? raw.grade_level ?? '',
    academicYearId: String(raw.academicYearId ?? raw.academic_year_id ?? ''),
    roomNumber: raw.roomNumber ?? raw.room_number ?? '',
    capacity: Number(raw.capacity ?? 30),
    fieldOfStudy: raw.fieldOfStudy ?? raw.field_of_study ?? 'عمومی',
    homeroomTeacherId: raw.homeroomTeacherId ? String(raw.homeroomTeacherId) : (raw.homeroom_teacher_id ? String(raw.homeroom_teacher_id) : undefined),
    studentIds: Array.isArray(studentIds) ? studentIds.map(String) : [],
  };
}

export function normalizeSubject(raw: any): Subject {
  if (!raw) return raw;
  return {
    id: String(raw.id ?? ''),
    title: raw.title ?? '',
    code: raw.code ?? '',
    coefficient: Number(raw.coefficient ?? 1),
    gradeLevel: raw.gradeLevel ?? raw.grade_level ?? '',
    description: raw.description ?? '',
  };
}

export function normalizeGrade(raw: any): Grade {
  if (!raw) return raw;
  return {
    id: String(raw.id ?? ''),
    studentId: String(raw.studentId ?? raw.student_id ?? ''),
    studentName: raw.studentName ?? (raw.student ? `${raw.student.first_name || ''} ${raw.student.last_name || ''}`.trim() : ''),
    teacherId: raw.teacherId ? String(raw.teacherId) : (raw.teacher_id ? String(raw.teacher_id) : ''),
    teacherName: raw.teacherName ?? (raw.teacher ? `${raw.teacher.first_name || ''} ${raw.teacher.last_name || ''}`.trim() : ''),
    subjectId: String(raw.subjectId ?? raw.subject_id ?? ''),
    subjectTitle: raw.subjectTitle ?? raw.subject?.title ?? '',
    classId: String(raw.classId ?? raw.class_id ?? ''),
    score: Number(raw.score ?? 0),
    maxScore: Number(raw.maxScore ?? raw.max_score ?? 20),
    gradeType: raw.gradeType ?? raw.grade_type ?? raw.type ?? 'daily',
    date: raw.date ?? '',
    month: raw.month ?? '',
    semester: raw.semester ?? 'semester1',
    academicYearId: String(raw.academicYearId ?? raw.academic_year_id ?? ''),
    description: raw.description ?? '',
    createdAt: raw.createdAt ?? raw.created_at ?? new Date().toISOString(),
  };
}

export function normalizeAnnouncement(raw: any): Announcement {
  if (!raw) return raw;
  return {
    id: String(raw.id ?? ''),
    title: raw.title ?? '',
    content: raw.content ?? '',
    authorName: raw.authorName ?? raw.author_name ?? 'مدیریت آموزشگاه',
    authorRole: raw.authorRole ?? raw.author_role ?? 'admin',
    target: raw.target ?? raw.targetRole ?? raw.target_role ?? 'all',
    targetClassId: raw.targetClassId ? String(raw.targetClassId) : (raw.target_class_id ? String(raw.target_class_id) : undefined),
    priority: raw.priority ?? 'normal',
    expiryDate: raw.expiryDate ?? raw.expiry_date ?? undefined,
    createdAt: raw.createdAt ?? raw.created_at ?? new Date().toISOString(),
    attachmentName: raw.attachmentName ?? raw.attachment_name ?? undefined,
    attachmentUrl: raw.attachmentUrl ?? raw.attachment_url ?? undefined,
    readByUserIds: Array.isArray(raw.readByUserIds) ? raw.readByUserIds : (Array.isArray(raw.read_by_user_ids) ? raw.read_by_user_ids : []),
  };
}

export function normalizeReportCard(raw: any): ReportCard {
  if (!raw) return raw;
  return {
    id: String(raw.id ?? ''),
    studentId: String(raw.studentId ?? raw.student_id ?? ''),
    studentName: raw.studentName ?? (raw.student ? `${raw.student.first_name || ''} ${raw.student.last_name || ''}`.trim() : ''),
    studentCode: raw.studentCode ?? raw.student_code ?? '',
    classId: String(raw.classId ?? raw.class_id ?? ''),
    className: raw.className ?? raw.schoolClass?.name ?? raw.school_class?.name ?? '',
    academicYearId: String(raw.academicYearId ?? raw.academic_year_id ?? ''),
    academicYearName: raw.academicYearName ?? raw.academic_year_name ?? 'سال تحصیلی جاری',
    type: raw.type ?? 'monthly',
    monthName: raw.monthName ?? raw.month_name,
    gpa: Number(raw.gpa ?? 0),
    rankInClass: Number(raw.rankInClass ?? raw.rank_in_class ?? raw.classRank ?? raw.class_rank ?? 1),
    rankInGrade: Number(raw.rankInGrade ?? raw.rank_in_grade ?? 1),
    totalUnits: Number(raw.totalUnits ?? raw.total_units ?? 0),
    totalWeightedScore: Number(raw.totalWeightedScore ?? raw.total_weighted_score ?? 0),
    items: Array.isArray(raw.items) ? raw.items : [],
    attendanceSummary: raw.attendanceSummary ?? raw.attendance_summary ?? {
      totalDays: 30,
      present: 30,
      absent: 0,
      justified: 0,
      tardy: 0,
    },
    disciplineScore: Number(raw.disciplineScore ?? raw.discipline_score ?? 20),
    status: raw.status ?? (raw.isPublished || raw.is_published ? 'published' : 'draft'),
    isPublished: Boolean(raw.isPublished ?? raw.is_published ?? (raw.status === 'published')),
    generatedAt: raw.generatedAt ?? raw.generated_at ?? raw.issueDate ?? raw.issue_date ?? raw.createdAt ?? raw.created_at ?? new Date().toISOString(),
    managerNote: raw.managerNote ?? raw.manager_note ?? raw.principalRemarks ?? raw.principal_remarks ?? '',
    adviserNote: raw.adviserNote ?? raw.adviser_note ?? raw.teacherRemarks ?? raw.teacher_remarks ?? '',
  };
}

export function normalizeAttendanceRecord(raw: any): AttendanceRecord {
  if (!raw) return raw;
  return {
    id: String(raw.id ?? ''),
    studentId: String(raw.studentId ?? raw.student_id ?? ''),
    classId: String(raw.classId ?? raw.class_id ?? ''),
    date: raw.date ?? '',
    status: raw.status ?? 'present',
    note: raw.note ?? '',
  };
}

export function normalizeHomework(raw: any): Homework {
  if (!raw) return raw;
  return {
    id: String(raw.id ?? ''),
    classId: String(raw.classId ?? raw.class_id ?? ''),
    subjectId: String(raw.subjectId ?? raw.subject_id ?? ''),
    teacherId: String(raw.teacherId ?? raw.teacher_id ?? ''),
    title: raw.title ?? '',
    description: raw.description ?? '',
    dueDate: raw.dueDate ?? raw.due_date ?? '',
    attachmentUrl: raw.attachmentUrl ?? raw.attachment_url ?? undefined,
    createdAt: raw.createdAt ?? raw.created_at ?? new Date().toISOString(),
  };
}

export function normalizeSubmission(raw: any): HomeworkSubmission {
  if (!raw) return raw;
  return {
    id: String(raw.id ?? ''),
    homeworkId: String(raw.homeworkId ?? raw.homework_id ?? ''),
    studentId: String(raw.studentId ?? raw.student_id ?? ''),
    studentName: raw.studentName ?? '',
    answerText: raw.answerText ?? raw.answer_text ?? '',
    fileUrl: raw.fileUrl ?? raw.file_url ?? undefined,
    fileName: raw.fileName ?? raw.file_name ?? undefined,
    fileType: raw.fileType ?? raw.file_type ?? undefined,
    submittedAt: raw.submittedAt ?? raw.submitted_at ?? new Date().toISOString(),
    grade: raw.grade !== undefined && raw.grade !== null ? Number(raw.grade) : undefined,
    teacherFeedback: raw.teacherFeedback ?? raw.teacher_feedback ?? undefined,
    status: raw.status ?? 'submitted',
  };
}

export function normalizeTeacherNote(raw: any): TeacherNote {
  if (!raw) return raw;
  return {
    id: String(raw.id ?? ''),
    studentId: String(raw.studentId ?? raw.student_id ?? ''),
    studentName: raw.studentName ?? '',
    teacherId: String(raw.teacherId ?? raw.teacher_id ?? ''),
    teacherName: raw.teacherName ?? '',
    type: raw.type ?? 'consultation',
    title: raw.title ?? 'یادداشت',
    content: raw.content ?? '',
    isPrivateToAdmin: Boolean(raw.isPrivateToAdmin ?? raw.is_private_to_admin ?? false),
    date: raw.date ?? '',
    createdAt: raw.createdAt ?? raw.created_at ?? new Date().toISOString(),
  };
}

export function normalizeAuditLog(raw: any): AuditLog {
  if (!raw) return raw;
  return {
    id: String(raw.id ?? ''),
    action: raw.action ?? '',
    entityType: raw.entityType ?? raw.entity_type ?? '',
    entityId: raw.entityId ? String(raw.entityId) : (raw.entity_id ? String(raw.entity_id) : undefined),
    userId: String(raw.userId ?? raw.user_id ?? ''),
    userName: raw.userName ?? raw.user_name ?? 'سیستم',
    userRole: raw.userRole ?? raw.user_role ?? 'admin',
    timestamp: raw.timestamp ?? raw.created_at ?? new Date().toISOString(),
    details: raw.details ?? '',
    ipAddress: raw.ipAddress ?? raw.ip_address ?? '',
  };
}

export function normalizeSchedulePeriod(raw: any): SchedulePeriod {
  if (!raw) return raw;
  const dayOfWeekNumber = Number(raw.dayOfWeek ?? raw.day_of_week_num ?? (raw.day_of_week === 'saturday' ? 0 : raw.day_of_week === 'sunday' ? 1 : raw.day_of_week === 'monday' ? 2 : raw.day_of_week === 'tuesday' ? 3 : raw.day_of_week === 'wednesday' ? 4 : 0));
  const dayNames = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه'];
  
  return {
    id: String(raw.id ?? ''),
    dayOfWeek: (dayOfWeekNumber >= 0 && dayOfWeekNumber <= 4 ? dayOfWeekNumber : 0) as 0 | 1 | 2 | 3 | 4,
    dayName: raw.dayName ?? raw.day_name ?? dayNames[dayOfWeekNumber] ?? 'شنبه',
    periodNumber: Number(raw.periodNumber ?? raw.period_number ?? 1),
    startTime: raw.startTime ?? raw.start_time ?? '08:00',
    endTime: raw.endTime ?? raw.end_time ?? '09:20',
    classId: String(raw.classId ?? raw.school_class_id ?? raw.class_id ?? ''),
    className: raw.className ?? raw.school_class?.name ?? raw.schoolClass?.name ?? '',
    subjectId: String(raw.subjectId ?? raw.subject_id ?? ''),
    subjectTitle: raw.subjectTitle ?? raw.subject?.title ?? '',
    teacherId: String(raw.teacherId ?? raw.teacher_id ?? ''),
    teacherName: raw.teacherName ?? (raw.teacher ? `${raw.teacher.first_name || ''} ${raw.teacher.last_name || ''}`.trim() : ''),
    roomNumber: raw.roomNumber ? String(raw.roomNumber) : (raw.room_number ? String(raw.room_number) : undefined),
  };
}

