import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Student,
  Teacher,
  SchoolClass,
  Subject,
  Grade,
  AttendanceRecord,
  Homework,
  HomeworkSubmission,
  Announcement,
  ReportCard,
  TeacherNote,
  AuditLog,
  AcademicYear,
  CSVImportPreviewRow,
  SchoolConfig,
  SchedulePeriod,
} from '../types';
import { toEnglishDigits } from '../utils/persian';
import { syncApi, adminApi, teacherApi, studentApi, scheduleApi } from '../services/schoolApi';
import {
  normalizeAcademicYear,
  normalizeStudent,
  normalizeTeacher,
  normalizeClass,
  normalizeSubject,
  normalizeGrade,
  normalizeAnnouncement,
  normalizeReportCard,
  normalizeAttendanceRecord,
  normalizeHomework,
  normalizeSubmission,
  normalizeTeacherNote,
  normalizeAuditLog,
  normalizeSchedulePeriod,
} from '../utils/normalizers';

const DEFAULT_SCHOOL_CONFIG: SchoolConfig = {
  schoolName: 'دبیرستان دوره اول پدیده دانش',
  managerName: 'دکتر محمد رضایی',
  district: 'منطقه ۳',
  province: 'تهران',
  academicYear: '۱۴۰۴–۱۴۰۵',
  phone: '۰۲۱-۸۸۷۷۶۶۵۵',
  address: 'تهران، خیابان ولیعصر، بالاتر از میدان ونک، بن‌بست دانش، پلاک ۱۲',
  passGrade: 10,
};

const DEFAULT_ACADEMIC_YEAR: AcademicYear = {
  id: '1',
  name: 'سال تحصیلی ۱۴۰۴–۱۴۰۵',
  startDate: '۱۴۰۴/۰۷/۰۱',
  endDate: '۱۴۰۵/۰۳/۳۱',
  isCurrent: true,
  isArchived: false,
};

interface DataContextType {
  students: Student[];
  teachers: Teacher[];
  classes: SchoolClass[];
  subjects: Subject[];
  grades: Grade[];
  attendance: AttendanceRecord[];
  homeworks: Homework[];
  submissions: HomeworkSubmission[];
  announcements: Announcement[];
  reportCards: ReportCard[];
  teacherNotes: TeacherNote[];
  auditLogs: AuditLog[];
  academicYears: AcademicYear[];
  currentAcademicYear: AcademicYear;
  schedules: SchedulePeriod[];
  schoolConfig: SchoolConfig;
  isLoading: boolean;
  refreshData: () => Promise<void>;

  // School config actions
  updateSchoolConfig: (config: Partial<SchoolConfig>) => Promise<void>;

  // Student actions
  addStudent: (student: Omit<Student, 'id' | 'userId' | 'studentCode' | 'isActive' | 'firstLogin'>) => Promise<Student>;
  updateStudent: (id: string, data: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  toggleStudentActive: (id: string) => Promise<void>;
  resetStudentPassword: (id: string) => Promise<void>;
  bulkImportStudents: (rows: CSVImportPreviewRow[]) => Promise<{ successCount: number; errorCount: number; errors: string[] }>;

  // Teacher actions
  addTeacher: (teacher: Omit<Teacher, 'id' | 'userId' | 'isActive' | 'firstLogin'>) => Promise<Teacher>;
  updateTeacher: (id: string, data: Partial<Teacher>) => Promise<void>;
  deleteTeacher: (id: string) => Promise<void>;
  toggleTeacherActive: (id: string) => Promise<void>;
  resetTeacherPassword: (id: string) => Promise<void>;
  updateTeacherProfile: (data: Partial<{
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    specialty: string;
    degree: string;
    bio: string;
    avatarUrl: string;
  }>) => Promise<void>;

  // Class & Subject actions
  addClass: (cls: Omit<SchoolClass, 'id' | 'studentIds'>) => Promise<SchoolClass>;
  updateClass: (id: string, data: Partial<SchoolClass>) => Promise<void>;
  deleteClass: (id: string) => Promise<void>;
  addSubject: (subject: Omit<Subject, 'id'>) => Promise<Subject>;

  // Schedule actions
  addSchedule: (period: Omit<SchedulePeriod, 'id'>) => Promise<SchedulePeriod>;
  updateSchedule: (id: string, data: Partial<SchedulePeriod>) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;

  // Grade actions
  addGrade: (grade: Omit<Grade, 'id' | 'createdAt'>, authorName: string) => Promise<Grade>;
  saveGradesBatch?: (
    classId: string,
    subjectId: string,
    month: string,
    gradeType: string,
    gradesList: Array<{ studentId: string; score: number; teacherNote?: string; date?: string }>,
    teacherName: string
  ) => Promise<void>;
  updateGrade: (id: string, data: Partial<Grade>, authorName: string) => Promise<void>;
  deleteGrade: (id: string, authorName: string) => Promise<void>;

  // Attendance actions
  recordBatchAttendance: (
    classId: string,
    date: string,
    records: { studentId: string; status: 'present' | 'absent' | 'excused' | 'late'; lateMinutes?: number; note?: string }[],
    teacherId: string,
    teacherName: string,
    subjectId?: string,
    time?: string
  ) => Promise<void>;

  // Homework actions
  addHomework: (hw: Omit<Homework, 'id' | 'createdAt'>) => Promise<Homework>;
  deleteHomework: (id: string) => Promise<void>;
  submitHomework: (submission: Omit<HomeworkSubmission, 'id' | 'submittedAt' | 'status'>) => Promise<void>;
  gradeSubmission: (id: string, grade: number, feedback?: string) => Promise<void>;

  // Announcement actions
  addAnnouncement: (announcement: Omit<Announcement, 'id' | 'createdAt' | 'readByUserIds'>) => Promise<Announcement>;
  updateAnnouncement: (id: string, data: Partial<Announcement>) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
  markAnnouncementAsRead: (id: string, userId: string) => Promise<void>;

  // Teacher notes actions
  addTeacherNote: (note: Omit<TeacherNote, 'id' | 'createdAt'>) => Promise<TeacherNote>;

  // Report Card Generation Engine
  generateMonthlyReportCards: (
    classId: string,
    monthName: string,
    academicYearId: string,
    remarksDefault?: string
  ) => Promise<ReportCard[]>;
  generateBatchMonthlyReportCards?: (
    classId: string,
    monthName: string,
    academicYearId: string,
    remarksDefault?: string
  ) => Promise<ReportCard[]>;
  generateSemesterReportCard: (
    studentId: string,
    semester: 'semester1' | 'semester2' | 'yearly',
    academicYearId: string
  ) => Promise<ReportCard>;

  // Academic year management
  setCurrentAcademicYear: (yearId: string) => Promise<void>;
  setActiveAcademicYear: (yearId: string) => Promise<void>;
  addAcademicYear: (year: Omit<AcademicYear, 'id' | 'isCurrent' | 'isArchived'>) => Promise<AcademicYear>;
  updateAcademicYear: (id: string, year: Partial<AcademicYear>) => Promise<void>;
  deleteAcademicYear: (id: string) => Promise<void>;

  // Reset database
  resetDatabaseToInitial: () => Promise<void>;
  resetDatabaseToDefault: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [submissions, setSubmissions] = useState<HomeworkSubmission[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [reportCards, setReportCards] = useState<ReportCard[]>([]);
  const [teacherNotes, setTeacherNotes] = useState<TeacherNote[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [schedules, setSchedules] = useState<SchedulePeriod[]>([]);
  const [schoolConfig, setSchoolConfig] = useState<SchoolConfig>(DEFAULT_SCHOOL_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  // Sync all data from Laravel API backend
  const refreshData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await syncApi.getAll();
      if (res && res.success && res.data) {
        const d = res.data;
        setStudents((d.students || []).map(normalizeStudent));
        setTeachers((d.teachers || []).map(normalizeTeacher));
        setClasses((d.classes || []).map(normalizeClass));
        setSubjects((d.subjects || []).map(normalizeSubject));
        setGrades((d.grades || []).map(normalizeGrade));
        setAttendance((d.attendance || []).map(normalizeAttendanceRecord));
        setHomeworks((d.homeworks || []).map(normalizeHomework));
        setSubmissions((d.submissions || []).map(normalizeSubmission));
        setAnnouncements((d.announcements || []).map(normalizeAnnouncement));
        setReportCards((d.reportCards || []).map(normalizeReportCard));
        setTeacherNotes((d.teacherNotes || []).map(normalizeTeacherNote));
        setAuditLogs((d.auditLogs || []).map(normalizeAuditLog));
        setAcademicYears((d.academicYears || []).map(normalizeAcademicYear));
        if (d.schedules) {
          setSchedules(d.schedules.map(normalizeSchedulePeriod));
        }
        if (d.schoolConfig) setSchoolConfig(d.schoolConfig);
      }
    } catch (err) {
      console.warn('Sync warning:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();

    const handleAuthChange = () => {
      refreshData();
    };

    window.addEventListener('auth_state_changed', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('auth_state_changed', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, [refreshData]);

  const currentAcademicYear =
    academicYears.find((y) => y.isCurrent) || academicYears[0] || DEFAULT_ACADEMIC_YEAR;

  // School Config Actions
  const updateSchoolConfig = async (config: Partial<SchoolConfig>) => {
    const res = await adminApi.updateSettings(config);
    if (res.success && res.data) {
      setSchoolConfig(res.data);
      await refreshData();
    } else {
      throw new Error('خطا در ذخیره تنظیمات مدرسه.');
    }
  };

  // Student Actions
  const addStudent = async (
    studentData: Omit<Student, 'id' | 'userId' | 'studentCode' | 'isActive' | 'firstLogin'>
  ): Promise<Student> => {
    const natId = toEnglishDigits(studentData.nationalId);
    const payload = {
      ...studentData,
      nationalId: natId,
    };

    const res = await adminApi.createStudent(payload);
    if (res.success && res.data) {
      const normalized = normalizeStudent(res.data);
      await refreshData();
      return normalized;
    }
    throw new Error('خطا در ثبت اطلاعات دانش‌آموز جدید.');
  };

  const updateStudent = async (id: string, data: Partial<Student>) => {
    const res = await adminApi.updateStudent(id, data);
    if (res.success && res.data) {
      await refreshData();
    } else {
      throw new Error('خطا در ویرایش مشخصات دانش‌آموز.');
    }
  };

  const deleteStudent = async (id: string) => {
    const res = await adminApi.deleteStudent(id);
    if (res.success) {
      await refreshData();
    } else {
      throw new Error('خطا در حذف دانش‌آموز از سامانه.');
    }
  };

  const toggleStudentActive = async (id: string) => {
    const res = await adminApi.toggleStudentActive(id);
    if (res.success) {
      await refreshData();
    } else {
      throw new Error('خطا در تغییر وضعیت فعالیت دانش‌آموز.');
    }
  };

  const resetStudentPassword = async (id: string) => {
    const res = await adminApi.resetStudentPassword(id);
    if (res.success) {
      await refreshData();
    } else {
      throw new Error('خطا در بازنشانی رمز عبور دانش‌آموز.');
    }
  };

  const bulkImportStudents = async (
    rows: CSVImportPreviewRow[]
  ): Promise<{ successCount: number; errorCount: number; errors: string[] }> => {
    const validRows = rows.filter((r) => r.isValid);
    const newStudents: Partial<Student>[] = validRows.map((r) => {
      const cls = classes.find((c) => c.name.includes(r.className)) || classes[0];
      return {
        nationalId: toEnglishDigits(r.nationalId),
        firstName: r.firstName,
        lastName: r.lastName,
        fatherName: r.fatherName || 'ـ',
        birthDate: '۱۳۸۸/۰۵/۱۵',
        classId: cls ? cls.id : (classes[0]?.id || '1'),
        className: cls ? cls.name : r.className,
        gradeLevel: cls ? cls.gradeLevel : 'هفتم',
        fieldOfStudy: cls ? cls.fieldOfStudy || 'عمومی' : 'عمومی',
        parentPhone: r.parentPhone || '۰۹۱۲۰۰۰۰۰۰۰',
        disciplineScore: 20,
      };
    });

    const res = await adminApi.bulkImportStudents(newStudents);
    if (res.success) {
      await refreshData();
      return {
        successCount: res.importedCount || validRows.length,
        errorCount: rows.length - validRows.length,
        errors: rows.filter((r) => !r.isValid).map((r) => `${r.firstName} ${r.lastName}: ${r.error || 'داده نامعتبر'}`),
      };
    }
    throw new Error('خطا در درون‌ریزی گروهی دانش‌آموزان.');
  };

  // Teacher Actions
  const addTeacher = async (
    teacherData: Omit<Teacher, 'id' | 'userId' | 'isActive' | 'firstLogin'>
  ): Promise<Teacher> => {
    const natId = toEnglishDigits(teacherData.nationalId);
    const payload = {
      ...teacherData,
      nationalId: natId,
    };

    const res = await adminApi.createTeacher(payload);
    if (res.success && res.data) {
      const normalized = normalizeTeacher(res.data);
      await refreshData();
      return normalized;
    }
    throw new Error('خطا در ثبت اطلاعات دبیر جدید.');
  };

  const updateTeacher = async (id: string, data: Partial<Teacher>) => {
    const res = await adminApi.updateTeacher(id, data);
    if (res.success && res.data) {
      await refreshData();
    } else {
      throw new Error('خطا در ویرایش مشخصات دبیر.');
    }
  };

  const deleteTeacher = async (id: string) => {
    const res = await adminApi.deleteTeacher(id);
    if (res.success) {
      await refreshData();
    } else {
      throw new Error('خطا در حذف دبیر از سامانه.');
    }
  };

  const toggleTeacherActive = async (id: string) => {
    const res = await adminApi.toggleTeacherActive(id);
    if (res.success) {
      await refreshData();
    } else {
      throw new Error('خطا در تغییر وضعیت دسترسی دبیر.');
    }
  };

  const resetTeacherPassword = async (id: string) => {
    const res = await adminApi.resetTeacherPassword(id);
    if (res.success) {
      await refreshData();
    } else {
      throw new Error('خطا در بازنشانی رمز عبور دبیر.');
    }
  };

  // Class & Subject Actions
  const addClass = async (clsData: Omit<SchoolClass, 'id' | 'studentIds'>): Promise<SchoolClass> => {
    const res = await adminApi.createClass(clsData);
    if (res.success && res.data) {
      const normalized = normalizeClass(res.data);
      await refreshData();
      return normalized;
    }
    throw new Error('خطا در تعریف کلاس آموزشی جدید.');
  };

  const updateClass = async (id: string, data: Partial<SchoolClass>) => {
    const res = await adminApi.updateClass(id, data);
    if (res.success && res.data) {
      await refreshData();
    } else {
      throw new Error('خطا در ویرایش مشخصات کلاس.');
    }
  };

  const deleteClass = async (id: string) => {
    const res = await adminApi.deleteClass(id);
    if (res.success) {
      await refreshData();
    } else {
      throw new Error('خطا در حذف کلاس از سامانه.');
    }
  };

  const addSubject = async (subjectData: Omit<Subject, 'id'>): Promise<Subject> => {
    const res = await adminApi.createSubject(subjectData);
    if (res.success && res.data) {
      const normalized = normalizeSubject(res.data);
      await refreshData();
      return normalized;
    }
    throw new Error('خطا در تعریف کتاب یا سرفصل درسی.');
  };

  // Grade Actions
  const addGrade = async (
    gradeData: Omit<Grade, 'id' | 'createdAt'>,
    authorName: string
  ): Promise<Grade> => {
    const res = await teacherApi.saveGrade(gradeData);
    if (res.success && res.data) {
      const normalized = normalizeGrade(res.data);
      await refreshData();
      return normalized;
    }
    throw new Error('خطا در ثبت نمره در پایگاه داده مرکزی.');
  };

  const updateGrade = async (id: string, data: Partial<Grade>, authorName: string) => {
    const res = await teacherApi.saveGrade({ id, ...data });
    if (res.success && res.data) {
      await refreshData();
    } else {
      throw new Error('خطا در ویرایش نمره در سامانه.');
    }
  };

  const deleteGrade = async (id: string, authorName: string) => {
    const res = await adminApi.deleteGrade(id);
    if (res.success) {
      await refreshData();
    } else {
      throw new Error('خطا در حذف نمره.');
    }
  };

  const saveGradesBatch = async (
    classId: string,
    subjectId: string,
    month: string,
    gradeType: string,
    gradesList: Array<{ studentId: string; score: number; teacherNote?: string; date?: string }>,
    teacherName: string
  ) => {
    const res = await teacherApi.saveGradesBatch({
      class_id: classId,
      subject_id: subjectId,
      month,
      grade_type: gradeType,
      grades: gradesList.map((g) => ({
        student_id: g.studentId,
        score: g.score,
        teacherNote: g.teacherNote,
        date: g.date,
      })),
    });
    if (res.success) {
      await refreshData();
    } else {
      throw new Error('خطا در ثبت گروهی نمرات.');
    }
  };

  // Attendance Actions
  const recordBatchAttendance = async (
    classId: string,
    date: string,
    records: { studentId: string; status: 'present' | 'absent' | 'excused' | 'late'; lateMinutes?: number; note?: string }[],
    teacherId: string,
    teacherName: string,
    subjectId?: string,
    time?: string
  ) => {
    const res = await teacherApi.saveAttendanceBatch({
      class_id: classId,
      subject_id: subjectId,
      date,
      time,
      records: records.map((r) => ({
        student_id: r.studentId,
        status: r.status,
        late_minutes: r.lateMinutes,
        note: r.note,
      })),
    });

    if (res.success) {
      await refreshData();
    } else {
      throw new Error('خطا در ثبت حضور و غیاب کلاسی.');
    }
  };

  // Homework Actions
  const addHomework = async (hwData: Omit<Homework, 'id' | 'createdAt'>): Promise<Homework> => {
    const res = await teacherApi.createHomework(hwData);
    if (res.success && res.data) {
      const normalized = normalizeHomework(res.data);
      await refreshData();
      return normalized;
    }
    throw new Error('خطا در تعریف تکلیف جدید.');
  };

  const deleteHomework = async (id: string) => {
    const res = await teacherApi.deleteHomework(id);
    if (res.success) {
      await refreshData();
    } else {
      throw new Error('خطا در حذف تکلیف.');
    }
  };

  const submitHomework = async (
    subData: Omit<HomeworkSubmission, 'id' | 'submittedAt' | 'status'>
  ) => {
    const res = await studentApi.submitHomework(subData.homeworkId, subData);
    if (res.success && res.data) {
      await refreshData();
    } else {
      throw new Error('خطا در ارسال پاسخ تکلیف.');
    }
  };

  const gradeSubmission = async (id: string, grade: number, feedback?: string) => {
    const res = await teacherApi.gradeSubmission(id, grade, feedback);
    if (res.success && res.data) {
      await refreshData();
    } else {
      throw new Error('خطا در ثبت نمره و بازخورد تکلیف.');
    }
  };

  // Announcement Actions
  const addAnnouncement = async (
    annData: Omit<Announcement, 'id' | 'createdAt' | 'readByUserIds'>
  ): Promise<Announcement> => {
    const res = await adminApi.createAnnouncement(annData);
    if (res.success && res.data) {
      const normalized = normalizeAnnouncement(res.data);
      await refreshData();
      return normalized;
    }
    throw new Error('خطا در انتشار اطلاعیه.');
  };

  const updateAnnouncement = async (id: string, data: Partial<Announcement>) => {
    const res = await adminApi.updateAnnouncement(id, data);
    if (res.success && res.data) {
      await refreshData();
    } else {
      throw new Error('خطا در ویرایش اطلاعیه.');
    }
  };

  const deleteAnnouncement = async (id: string) => {
    const res = await adminApi.deleteAnnouncement(id);
    if (res.success) {
      await refreshData();
    } else {
      throw new Error('خطا در حذف اطلاعیه.');
    }
  };

  const markAnnouncementAsRead = async (id: string, userId: string) => {
    setAnnouncements((prev) =>
      prev.map((a) =>
        a.id === id && !a.readByUserIds.includes(userId)
          ? { ...a, readByUserIds: [...a.readByUserIds, userId] }
          : a
      )
    );
  };

  // Teacher Note Actions
  const addTeacherNote = async (
    noteData: Omit<TeacherNote, 'id' | 'createdAt'>
  ): Promise<TeacherNote> => {
    const res = await teacherApi.createNote(noteData);
    if (res.success && res.data) {
      const normalized = normalizeTeacherNote(res.data);
      await refreshData();
      return normalized;
    }
    throw new Error('خطا در ثبت یادداشت انضباطی/مشاوره‌ای.');
  };

  // Report Card Generation Actions
  const generateMonthlyReportCards = async (
    classId: string,
    monthName: string,
    academicYearId: string,
    remarksDefault?: string
  ): Promise<ReportCard[]> => {
    const res = await adminApi.generateBatchMonthly({
      classId,
      monthName,
      academicYearId,
      remarksDefault,
    });

    if (res.success && res.data) {
      await refreshData();
      return (res.data || []).map(normalizeReportCard);
    }

    throw new Error('خطا در صدور کارنامه ماهانه.');
  };

  const generateSemesterReportCard = async (
    studentId: string,
    semester: 'semester1' | 'semester2' | 'yearly',
    academicYearId: string
  ): Promise<ReportCard> => {
    const res = await adminApi.generateSemester({
      studentId,
      type: semester,
      academicYearId,
    });

    if (res.success && res.data) {
      await refreshData();
      return normalizeReportCard(res.data);
    }

    throw new Error('عدم امکان صدور کارنامه نوبت تحصیلی.');
  };

  // Academic Year Management
  const setCurrentAcademicYear = async (yearId: string) => {
    const res = await adminApi.setCurrentAcademicYear(yearId);
    if (res.success) {
      await refreshData();
    } else {
      throw new Error('خطا در تغییر سال تحصیلی فعال.');
    }
  };

  const addAcademicYear = async (
    yearData: Omit<AcademicYear, 'id' | 'isCurrent' | 'isArchived'>
  ): Promise<AcademicYear> => {
    const res = await adminApi.createAcademicYear(yearData);
    if (res.success && res.data) {
      const normalized = normalizeAcademicYear(res.data);
      await refreshData();
      return normalized;
    }
    throw new Error('خطا در ثبت سال تحصیلی جدید.');
  };

  const updateAcademicYear = async (id: string, yearData: Partial<AcademicYear>) => {
    const res = await adminApi.updateAcademicYear(id, yearData);
    if (res.success && res.data) {
      await refreshData();
    } else {
      throw new Error('خطا در ویرایش سال تحصیلی.');
    }
  };

  const deleteAcademicYear = async (id: string) => {
    const res = await adminApi.deleteAcademicYear(id);
    if (res.success) {
      await refreshData();
    } else {
      throw new Error(res.message || 'خطا در حذف سال تحصیلی.');
    }
  };

  // Schedule actions
  const addSchedule = async (period: Omit<SchedulePeriod, 'id'>): Promise<SchedulePeriod> => {
    const res = await scheduleApi.createSchedule({
      day_of_week: period.dayOfWeek,
      period_number: period.periodNumber,
      start_time: period.startTime,
      end_time: period.endTime,
      class_id: period.classId,
      subject_id: period.subjectId,
      teacher_id: period.teacherId,
      room_number: period.roomNumber,
    });
    if (res.success && res.data) {
      const normalized = normalizeSchedulePeriod(res.data);
      await refreshData();
      return normalized;
    }
    throw new Error('خطا در ثبت زنگ برنامه هفتگی.');
  };

  const updateSchedule = async (id: string, data: Partial<SchedulePeriod>) => {
    const payload: any = {};
    if (data.dayOfWeek !== undefined) payload.day_of_week = data.dayOfWeek;
    if (data.periodNumber !== undefined) payload.period_number = data.periodNumber;
    if (data.startTime !== undefined) payload.start_time = data.startTime;
    if (data.endTime !== undefined) payload.end_time = data.endTime;
    if (data.classId !== undefined) payload.class_id = data.classId;
    if (data.subjectId !== undefined) payload.subject_id = data.subjectId;
    if (data.teacherId !== undefined) payload.teacher_id = data.teacherId;
    if (data.roomNumber !== undefined) payload.room_number = data.roomNumber;

    const res = await scheduleApi.updateSchedule(id, payload);
    if (res.success) {
      await refreshData();
    } else {
      throw new Error('خطا در ویرایش زنگ برنامه هفتگی.');
    }
  };

  const deleteSchedule = async (id: string) => {
    const res = await scheduleApi.deleteSchedule(id);
    if (res.success) {
      await refreshData();
    } else {
      throw new Error('خطا در حذف زنگ برنامه هفتگی.');
    }
  };

  // Teacher Profile action
  const updateTeacherProfile = async (data: Partial<{
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    specialty: string;
    degree: string;
    bio: string;
    avatarUrl: string;
  }>) => {
    const res = await teacherApi.updateProfile(data);
    if (res.success) {
      await refreshData();
    } else {
      throw new Error(res.message || 'خطا در ویرایش مشخصات دبیر.');
    }
  };

  // Reset database actions
  const resetDatabaseToInitial = async () => {
    await refreshData();
  };

  const resetDatabaseToDefault = async () => {
    await refreshData();
  };

  return (
    <DataContext.Provider
      value={{
        students,
        teachers,
        classes,
        subjects,
        grades,
        attendance,
        homeworks,
        submissions,
        announcements,
        reportCards,
        teacherNotes,
        auditLogs,
        academicYears,
        currentAcademicYear,
        schedules,
        schoolConfig,
        isLoading,
        refreshData,
        updateSchoolConfig,
        addStudent,
        updateStudent,
        deleteStudent,
        toggleStudentActive,
        resetStudentPassword,
        bulkImportStudents,
        addTeacher,
        updateTeacher,
        deleteTeacher,
        toggleTeacherActive,
        resetTeacherPassword,
        updateTeacherProfile,
        addClass,
        updateClass,
        deleteClass,
        addSubject,
        addSchedule,
        updateSchedule,
        deleteSchedule,
        addGrade,
        saveGradesBatch,
        updateGrade,
        deleteGrade,
        recordBatchAttendance,
        addHomework,
        deleteHomework,
        submitHomework,
        gradeSubmission,
        addAnnouncement,
        updateAnnouncement,
        deleteAnnouncement,
        markAnnouncementAsRead,
        addTeacherNote,
        generateMonthlyReportCards,
        generateBatchMonthlyReportCards: generateMonthlyReportCards,
        generateSemesterReportCard,
        setCurrentAcademicYear,
        setActiveAcademicYear: setCurrentAcademicYear,
        addAcademicYear,
        updateAcademicYear,
        deleteAcademicYear,
        resetDatabaseToInitial,
        resetDatabaseToDefault,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
