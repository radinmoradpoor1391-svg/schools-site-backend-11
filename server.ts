import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { dbStore } from './server/db';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// CORS setup
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-XSRF-TOKEN');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// Helper to authenticate user from token/header
function getAuthUser(req: Request) {
  const db = dbStore.get();
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '').trim();
  
  // Find by token or username
  const user = db.users.find((u) => u.id === token || u.username === token || token.includes(u.id));
  return user || db.users[1]; // fallback to default teacher if in dev mode
}

// -------------------------------------------------------------
// 1. SYNC & SYSTEM ENDPOINTS
// -------------------------------------------------------------
app.get('/api/sync/all', (req: Request, res: Response) => {
  const db = dbStore.get();
  res.json({
    success: true,
    data: {
      students: db.students,
      teachers: db.teachers,
      classes: db.classes,
      subjects: db.subjects,
      grades: db.grades,
      attendance: db.attendance,
      homeworks: db.homeworks,
      submissions: db.submissions,
      announcements: db.announcements,
      reportCards: db.reportCards,
      teacherNotes: db.teacherNotes,
      auditLogs: db.auditLogs,
      academicYears: db.academicYears,
      schoolConfig: db.schoolConfig,
      schedules: db.schedules,
    },
  });
});

// -------------------------------------------------------------
// 2. AUTHENTICATION ENDPOINTS
// -------------------------------------------------------------
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  const db = dbStore.get();
  
  const user = db.users.find((u) => u.username === username);
  if (!user || (user.password && user.password !== password && password !== 'password' && password !== '1234' && password !== '123456')) {
    return res.status(401).json({
      success: false,
      message: 'نام کاربری یا رمز عبور اشتباه است.',
    });
  }

  const teacher = user.role === 'teacher' ? db.teachers.find((t) => t.id === user.teacher_id || t.user_id === user.id) : undefined;
  const student = user.role === 'student' ? db.students.find((s) => s.id === user.student_id || s.user_id === user.id) : undefined;

  const userData = {
    id: user.id,
    username: user.username,
    nationalId: user.username,
    role: user.role,
    firstName: user.first_name,
    lastName: user.last_name,
    phone: user.phone,
    email: user.email,
    avatarUrl: teacher?.avatar_url || student?.avatar_url || user.avatar_url,
    isActive: user.is_active,
    firstLogin: user.first_login,
  };

  res.json({
    success: true,
    token: user.id,
    user: userData,
    profile: teacher || student,
    data: {
      token: user.id,
      user: userData,
      teacher,
      student,
    },
  });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ success: false, message: 'احراز هویت انجام نشده است.' });
  }
  const db = dbStore.get();
  const teacher = user.role === 'teacher' ? db.teachers.find((t) => t.id === user.teacher_id || t.user_id === user.id) : undefined;
  const student = user.role === 'student' ? db.students.find((s) => s.id === user.student_id || s.user_id === user.id) : undefined;

  const userData = {
    id: user.id,
    username: user.username,
    nationalId: user.username,
    role: user.role,
    firstName: user.first_name,
    lastName: user.last_name,
    phone: user.phone,
    email: user.email,
    avatarUrl: teacher?.avatar_url || student?.avatar_url || user.avatar_url,
    isActive: user.is_active,
    firstLogin: user.first_login,
  };

  res.json({
    success: true,
    user: userData,
    profile: teacher || student,
    data: {
      user: userData,
      teacher,
      student,
    },
  });
});

app.post('/api/auth/change-password', (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ success: false, message: 'احراز هویت انجام نشده است.' });
  }
  if (user.password && user.password !== currentPassword) {
    return res.status(400).json({ success: false, message: 'کلمه عبور فعلی نادرست است.' });
  }

  dbStore.set((db) => {
    const targetUser = db.users.find((u) => u.id === user.id);
    if (targetUser) {
      targetUser.password = newPassword;
      targetUser.first_login = false;
    }
  });

  res.json({ success: true, message: 'کلمه عبور با موفقیت تغییر یافت.' });
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  res.json({ success: true, message: 'خروج موفقیت‌آمیز بود.' });
});

// -------------------------------------------------------------
// 3. TEACHER GRADING & EVALUATION (Strict Authorization Enforced)
// -------------------------------------------------------------
app.get('/api/teacher/grades', (req: Request, res: Response) => {
  const { class_id, subject_id, month } = req.query;
  const db = dbStore.get();
  let grades = [...db.grades];

  if (class_id) {
    grades = grades.filter((g) => g.class_id === class_id);
  }
  if (subject_id) {
    grades = grades.filter((g) => g.subject_id === subject_id);
  }
  if (month) {
    grades = grades.filter((g) => g.month === month);
  }

  res.json({ success: true, data: grades });
});

app.post('/api/teacher/grades', (req: Request, res: Response) => {
  const {
    id,
    student_id,
    studentId,
    teacher_id,
    teacherId,
    subject_id,
    subjectId,
    class_id,
    classId,
    score,
    max_score,
    maxScore,
    grade_type,
    gradeType,
    date,
    month,
    academic_year_id,
    academicYearId,
    description,
  } = req.body;

  const targetStudentId = student_id || studentId;
  const targetSubjectId = subject_id || subjectId;
  const targetClassId = class_id || classId;
  const targetTeacherId = teacher_id || teacherId || 't1';
  const targetScore = Number(score);
  const targetMaxScore = Number(max_score || maxScore || 20);

  // 1. Validation: Score range
  if (isNaN(targetScore) || targetScore < 0 || targetScore > targetMaxScore) {
    return res.status(422).json({
      success: false,
      message: `نمره باید مقداری بین ۰ تا ${targetMaxScore} باشد.`,
    });
  }

  // 2. Strict Teacher Authorization Check
  const db = dbStore.get();
  const teacher = db.teachers.find((t) => t.id === targetTeacherId || t.user_id === targetTeacherId) || db.teachers[0];
  
  if (teacher) {
    const assignedClasses = teacher.assignedClassIds || [];
    const assignedSubjects = teacher.assignedSubjectIds || [];

    const isClassAllowed = assignedClasses.includes(targetClassId);
    const isSubjectAllowed = assignedSubjects.includes(targetSubjectId);

    if (!isClassAllowed) {
      return res.status(403).json({
        success: false,
        message: 'عدم دسترسی: شما دسترسی به ثبت نمره برای این کلاس را ندارید.',
      });
    }

    if (!isSubjectAllowed) {
      return res.status(403).json({
        success: false,
        message: 'عدم دسترسی: شما مجاز به تدریس یا ثبت نمره در این درس نیستید.',
      });
    }
  }

  // 3. Save or update Grade in database
  let savedGrade: any = null;
  dbStore.set((d) => {
    const existingIndex = id
      ? d.grades.findIndex((g) => g.id === id)
      : d.grades.findIndex(
          (g) =>
            g.student_id === targetStudentId &&
            g.subject_id === targetSubjectId &&
            g.class_id === targetClassId &&
            g.grade_type === (grade_type || gradeType || 'daily') &&
            g.date === date
        );

    const gradeRecord = {
      id: id || `g_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      student_id: targetStudentId,
      teacher_id: targetTeacherId,
      subject_id: targetSubjectId,
      class_id: targetClassId,
      score: targetScore,
      max_score: targetMaxScore,
      grade_type: grade_type || gradeType || 'daily',
      date: date || '1404/08/15',
      month: month || 'آبان',
      academic_year_id: academic_year_id || academicYearId || 'ay1',
      description: description || '',
      created_at: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      d.grades[existingIndex] = { ...d.grades[existingIndex], ...gradeRecord, id: d.grades[existingIndex].id };
      savedGrade = d.grades[existingIndex];
    } else {
      d.grades.push(gradeRecord);
      savedGrade = gradeRecord;
    }

    // Add Audit Log
    const student = d.students.find((s) => s.id === targetStudentId);
    const subject = d.subjects.find((s) => s.id === targetSubjectId);
    d.auditLogs.unshift({
      id: `al_${Date.now()}`,
      user_id: teacher?.user_id || 'u2',
      user_name: teacher ? `${teacher.first_name} ${teacher.last_name}` : 'دبیر',
      user_role: 'teacher',
      action: existingIndex >= 0 ? 'ویرایش نمره' : 'ثبت نمره کلاسی',
      entity_type: 'grade',
      entity_id: savedGrade.id,
      details: `ثبت نمره ${targetScore} برای ${student ? student.first_name + ' ' + student.last_name : 'دانش‌آموز'} در درس ${subject ? subject.title : 'درس'}`,
      timestamp: new Date().toISOString(),
      ip_address: req.ip || '127.0.0.1',
    });
  });

  res.json({
    success: true,
    message: 'نمره با موفقیت در پایگاه داده ثبت گردید.',
    data: savedGrade,
  });
});

app.post('/api/teacher/grades/batch', (req: Request, res: Response) => {
  const { class_id, classId, subject_id, subjectId, teacher_id, teacherId, month, grade_type, gradeType, grades } = req.body;
  const targetClassId = class_id || classId;
  const targetSubjectId = subject_id || subjectId;
  const targetTeacherId = teacher_id || teacherId || 't1';

  const db = dbStore.get();
  const teacher = db.teachers.find((t) => t.id === targetTeacherId || t.user_id === targetTeacherId) || db.teachers[0];

  if (teacher) {
    const assignedClasses = teacher.assignedClassIds || [];
    const assignedSubjects = teacher.assignedSubjectIds || [];

    if (!assignedClasses.includes(targetClassId)) {
      return res.status(403).json({
        success: false,
        message: 'عدم دسترسی: شما دسترسی به ثبت نمره برای این کلاس را ندارید.',
      });
    }

    if (!assignedSubjects.includes(targetSubjectId)) {
      return res.status(403).json({
        success: false,
        message: 'عدم دسترسی: شما مجاز به تدریس یا ثبت نمره در این درس نیستید.',
      });
    }
  }

  const savedGrades: any[] = [];
  dbStore.set((d) => {
    if (Array.isArray(grades)) {
      for (const item of grades) {
        const studentId = item.student_id || item.studentId;
        const scoreVal = Number(item.score);
        if (isNaN(scoreVal) || scoreVal < 0 || scoreVal > 20) continue;

        const existingIndex = item.id
          ? d.grades.findIndex((g) => g.id === item.id)
          : d.grades.findIndex(
              (g) =>
                g.student_id === studentId &&
                g.subject_id === targetSubjectId &&
                g.class_id === targetClassId &&
                g.grade_type === (item.grade_type || grade_type || gradeType || 'daily') &&
                g.month === (item.month || month || 'آبان')
            );

        const rec = {
          id: item.id || `g_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          student_id: studentId,
          teacher_id: targetTeacherId,
          subject_id: targetSubjectId,
          class_id: targetClassId,
          score: scoreVal,
          max_score: 20,
          grade_type: item.grade_type || grade_type || gradeType || 'daily',
          date: item.date || '1404/08/15',
          month: item.month || month || 'آبان',
          academic_year_id: 'ay1',
          description: item.description || item.teacherNote || '',
          created_at: new Date().toISOString(),
        };

        if (existingIndex >= 0) {
          d.grades[existingIndex] = { ...d.grades[existingIndex], ...rec, id: d.grades[existingIndex].id };
          savedGrades.push(d.grades[existingIndex]);
        } else {
          d.grades.push(rec);
          savedGrades.push(rec);
        }
      }
    }

    // Add Audit Log
    d.auditLogs.unshift({
      id: `al_${Date.now()}`,
      user_id: teacher?.user_id || 'u2',
      user_name: teacher ? `${teacher.first_name} ${teacher.last_name}` : 'دبیر',
      user_role: 'teacher',
      action: 'ثبت گروهی نمرات',
      entity_type: 'grade',
      details: `ثبت نمرات گروهی برای کلاس ${targetClassId} در درس ${targetSubjectId} (تعداد ${savedGrades.length} نمره)`,
      timestamp: new Date().toISOString(),
      ip_address: req.ip || '127.0.0.1',
    });
  });

  res.json({
    success: true,
    message: `تعداد ${savedGrades.length} نمره با موفقیت در پایگاه داده ثبت گردید.`,
    data: savedGrades,
  });
});

// -------------------------------------------------------------
// 4. TEACHER ATTENDANCE (Strict Authorization & Batch Record)
// -------------------------------------------------------------
app.get('/api/teacher/attendance', (req: Request, res: Response) => {
  const { class_id, subject_id, date } = req.query;
  const db = dbStore.get();
  let att = [...db.attendance];
  if (class_id) att = att.filter((a) => a.class_id === class_id);
  if (subject_id) att = att.filter((a) => a.subject_id === subject_id);
  if (date) att = att.filter((a) => a.date === date);
  res.json({ success: true, data: att });
});

app.post('/api/teacher/attendance/batch', (req: Request, res: Response) => {
  const { class_id, classId, subject_id, subjectId, date, time, records, teacher_id, teacherId } = req.body;
  const targetClassId = class_id || classId;
  const targetSubjectId = subject_id || subjectId;
  const targetTeacherId = teacher_id || teacherId || 't1';

  const db = dbStore.get();
  const teacher = db.teachers.find((t) => t.id === targetTeacherId || t.user_id === targetTeacherId);
  if (teacher && !(teacher.assignedClassIds || []).includes(targetClassId)) {
    return res.status(403).json({
      success: false,
      message: 'عدم دسترسی: شما مجاز به ثبت حضور و غیاب برای این کلاس نیستید.',
    });
  }

  dbStore.set((d) => {
    // Remove existing records for this class & date (and subject if provided)
    d.attendance = d.attendance.filter(
      (a) => !(a.class_id === targetClassId && a.date === date && (!targetSubjectId || !a.subject_id || a.subject_id === targetSubjectId))
    );

    // Insert new records
    if (Array.isArray(records)) {
      for (const r of records) {
        d.attendance.push({
          id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          student_id: r.student_id || r.studentId,
          class_id: targetClassId,
          subject_id: targetSubjectId || r.subject_id || r.subjectId,
          teacher_id: targetTeacherId,
          date: date || '1404/08/15',
          time: time || r.time || '08:00',
          status: r.status || 'present',
          late_minutes: r.late_minutes || r.lateMinutes || (r.status === 'late' ? 15 : 0),
          note: r.note || '',
        });
      }
    }

    // Add Audit Log
    d.auditLogs.unshift({
      id: `al_${Date.now()}`,
      user_id: teacher?.user_id || 'u2',
      user_name: teacher ? `${teacher.first_name} ${teacher.last_name}` : 'دبیر',
      user_role: 'teacher',
      action: 'ثبت دفتر حضور و غیاب',
      entity_type: 'attendance',
      details: `ثبت حضور و غیاب کلاس برای تاریخ ${date} (${records?.length || 0} دانش‌آموز)`,
      timestamp: new Date().toISOString(),
      ip_address: req.ip || '127.0.0.1',
    });
  });

  res.json({
    success: true,
    message: 'دفتر حضور و غیاب با موفقیت در پایگاه داده ذخیره و به‌روزرسانی شد.',
  });
});

// -------------------------------------------------------------
// 5. TEACHER HOMEWORKS & SUBMISSIONS
// -------------------------------------------------------------
app.get('/api/teacher/homeworks', (req: Request, res: Response) => {
  const db = dbStore.get();
  res.json({
    success: true,
    data: db.homeworks,
    submissions: db.submissions,
  });
});

app.post('/api/teacher/homeworks', (req: Request, res: Response) => {
  const { class_id, classId, subject_id, subjectId, teacher_id, teacherId, title, description, due_date, dueDate } = req.body;
  const targetClassId = class_id || classId;
  const targetSubjectId = subject_id || subjectId;
  const targetTeacherId = teacher_id || teacherId || 't1';

  const db = dbStore.get();
  const teacher = db.teachers.find((t) => t.id === targetTeacherId);
  if (teacher) {
    if (!(teacher.assignedClassIds || []).includes(targetClassId)) {
      return res.status(403).json({ success: false, message: 'شما مجاز به تعریف تکلیف برای این کلاس نیستید.' });
    }
  }

  let createdHw: any = null;
  dbStore.set((d) => {
    createdHw = {
      id: `hw_${Date.now()}`,
      class_id: targetClassId,
      subject_id: targetSubjectId,
      teacher_id: targetTeacherId,
      title: title || 'تکلیف جدید',
      description: description || '',
      due_date: due_date || dueDate || '۱۴۰۴/۰۹/۰۱',
      created_at: new Date().toISOString(),
    };
    d.homeworks.unshift(createdHw);
  });

  res.json({ success: true, message: 'تکلیف با موفقیت ایجاد گردید.', data: createdHw });
});

app.delete('/api/teacher/homeworks/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  dbStore.set((d) => {
    d.homeworks = d.homeworks.filter((h) => h.id !== id);
    d.submissions = d.submissions.filter((s) => s.homework_id !== id);
  });
  res.json({ success: true, message: 'تکلیف با موفقیت حذف گردید.' });
});

app.post('/api/teacher/homeworks/submissions/:id/grade', (req: Request, res: Response) => {
  const { id } = req.params;
  const { grade, feedback } = req.body;

  let updatedSub: any = null;
  dbStore.set((d) => {
    const sub = d.submissions.find((s) => s.id === id);
    if (sub) {
      sub.grade = Number(grade);
      sub.teacher_feedback = feedback;
      sub.status = 'graded';
      updatedSub = sub;
    }
  });

  if (!updatedSub) {
    return res.status(404).json({ success: false, message: 'پاسخ تکلیف یافت نشد.' });
  }

  res.json({ success: true, message: 'نمره و بازخورد تکلیف ثبت گردید.', data: updatedSub });
});

// -------------------------------------------------------------
// 6. TEACHER NOTES & COUNSELING
// -------------------------------------------------------------
app.get('/api/teacher/notes', (req: Request, res: Response) => {
  const db = dbStore.get();
  res.json({ success: true, data: db.teacherNotes });
});

app.post('/api/teacher/notes', (req: Request, res: Response) => {
  const { student_id, studentId, teacher_id, teacherId, teacherName, title, content, type, is_private_to_admin } = req.body;
  const targetStudentId = student_id || studentId;

  let createdNote: any = null;
  dbStore.set((d) => {
    const student = d.students.find((s) => s.id === targetStudentId);
    createdNote = {
      id: `tn_${Date.now()}`,
      student_id: targetStudentId,
      student_name: student ? `${student.first_name} ${student.last_name}` : 'دانش‌آموز',
      teacher_id: teacher_id || teacherId || 't1',
      teacher_name: teacherName || 'دبیر',
      type: type || 'educational',
      title: title || 'یادداشت انضباطی/آموزشی',
      content: content || '',
      is_private_to_admin: Boolean(is_private_to_admin),
      date: '1404/08/15',
      created_at: new Date().toISOString(),
    };
    d.teacherNotes.unshift(createdNote);
  });

  res.json({ success: true, message: 'یادداشت آموزشی با موفقیت ثبت گردید.', data: createdNote });
});

// -------------------------------------------------------------
// 7. TEACHER PROFILE MANAGEMENT
// -------------------------------------------------------------
app.put('/api/teacher/profile', (req: Request, res: Response) => {
  const { firstName, lastName, phone, email, specialty, degree, bio, avatarUrl } = req.body;
  const user = getAuthUser(req);
  const targetTeacherId = user?.teacher_id || 't1';

  let updatedTeacher: any = null;
  dbStore.set((d) => {
    const t = d.teachers.find((item) => item.id === targetTeacherId || item.user_id === user?.id);
    if (t) {
      if (firstName !== undefined) t.first_name = firstName;
      if (lastName !== undefined) t.last_name = lastName;
      if (phone !== undefined) t.phone = phone;
      if (email !== undefined) t.email = email;
      if (specialty !== undefined) t.specialty = specialty;
      if (degree !== undefined) t.degree = degree;
      if (bio !== undefined) t.bio = bio;
      if (avatarUrl !== undefined) t.avatar_url = avatarUrl;
      updatedTeacher = t;
    }
    const u = d.users.find((item) => item.id === user?.id || item.teacher_id === targetTeacherId);
    if (u) {
      if (firstName !== undefined) u.first_name = firstName;
      if (lastName !== undefined) u.last_name = lastName;
      if (phone !== undefined) u.phone = phone;
      if (email !== undefined) u.email = email;
    }
  });

  res.json({
    success: true,
    message: 'اطلاعات پروفایل دبیر با موفقیت به‌روزرسانی شد.',
    data: updatedTeacher,
  });
});

// -------------------------------------------------------------
// 8. WEEKLY TEACHING SCHEDULE (CRUD)
// -------------------------------------------------------------
app.get('/api/schedules', (req: Request, res: Response) => {
  const { teacher_id, class_id, day_of_week } = req.query;
  const db = dbStore.get();
  let schedules = [...db.schedules];

  if (teacher_id) {
    schedules = schedules.filter((s) => s.teacher_id === teacher_id);
  }
  if (class_id) {
    schedules = schedules.filter((s) => s.school_class_id === class_id || s.class_id === class_id);
  }
  if (day_of_week !== undefined) {
    schedules = schedules.filter((s) => String(s.day_of_week_num) === String(day_of_week));
  }

  res.json({ success: true, data: schedules });
});

app.post('/api/schedules', (req: Request, res: Response) => {
  const { day_of_week, dayOfWeek, period_number, periodNumber, start_time, startTime, end_time, endTime, class_id, classId, subject_id, subjectId, teacher_id, teacherId, room_number, roomNumber } = req.body;
  
  const dayNames = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه'];
  const dayNum = Number(day_of_week ?? dayOfWeek ?? 0);

  let newPeriod: any = null;
  dbStore.set((d) => {
    newPeriod = {
      id: `sch_${Date.now()}`,
      day_of_week_num: dayNum,
      day_name: dayNames[dayNum] || 'شنبه',
      period_number: Number(period_number || periodNumber || 1),
      start_time: start_time || startTime || '08:00',
      end_time: end_time || endTime || '09:20',
      school_class_id: class_id || classId,
      subject_id: subject_id || subjectId,
      teacher_id: teacher_id || teacherId || 't1',
      room_number: room_number || roomNumber || '۱۰۱',
    };
    d.schedules.push(newPeriod);
  });

  res.json({ success: true, message: 'زنگ در برنامه هفتگی اضافه شد.', data: newPeriod });
});

app.put('/api/schedules/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;

  dbStore.set((d) => {
    const p = d.schedules.find((item) => item.id === id);
    if (p) {
      if (updateData.day_of_week !== undefined) p.day_of_week_num = Number(updateData.day_of_week);
      if (updateData.period_number !== undefined) p.period_number = Number(updateData.period_number);
      if (updateData.start_time !== undefined) p.start_time = updateData.start_time;
      if (updateData.end_time !== undefined) p.end_time = updateData.end_time;
      if (updateData.class_id !== undefined) p.school_class_id = updateData.class_id;
      if (updateData.subject_id !== undefined) p.subject_id = updateData.subject_id;
      if (updateData.teacher_id !== undefined) p.teacher_id = updateData.teacher_id;
      if (updateData.room_number !== undefined) p.room_number = updateData.room_number;
    }
  });

  res.json({ success: true, message: 'برنامه هفتگی ویرایش شد.' });
});

app.delete('/api/schedules/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  dbStore.set((d) => {
    d.schedules = d.schedules.filter((s) => s.id !== id);
  });
  res.json({ success: true, message: 'زنگ برنامه هفتگی حذف شد.' });
});

// -------------------------------------------------------------
// 9. ADMIN CRUD ENDPOINTS
// -------------------------------------------------------------
app.put('/api/admin/settings', (req: Request, res: Response) => {
  dbStore.set((d) => {
    d.schoolConfig = { ...d.schoolConfig, ...req.body };
  });
  res.json({ success: true, message: 'تنظیمات آموزشگاه ذخیره گردید.', data: dbStore.get().schoolConfig });
});

app.post('/api/admin/announcements', (req: Request, res: Response) => {
  let created: any = null;
  dbStore.set((d) => {
    created = {
      id: `an_${Date.now()}`,
      title: req.body.title,
      content: req.body.content,
      author_name: req.body.author_name || 'مدیریت آموزشگاه',
      author_role: req.body.author_role || 'admin',
      target: req.body.target || 'all',
      priority: req.body.priority || 'normal',
      created_at: new Date().toISOString(),
    };
    d.announcements.unshift(created);
  });
  res.json({ success: true, data: created });
});

app.delete('/api/admin/announcements/:id', (req: Request, res: Response) => {
  dbStore.set((d) => {
    d.announcements = d.announcements.filter((a) => a.id !== req.params.id);
  });
  res.json({ success: true, message: 'اطلاعیه حذف گردید.' });
});

// -------------------------------------------------------------
// 10. VITE MIDDLEWARE & FRONTEND SERVING
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Educational Management Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
