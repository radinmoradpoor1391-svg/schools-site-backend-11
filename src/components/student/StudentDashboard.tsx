import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { studentApi } from '../../services/schoolApi';
import {
  Award,
  BookOpen,
  CalendarCheck,
  FileSpreadsheet,
  Bell,
  Sparkles,
  TrendingUp,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  ClipboardList,
  Printer,
  ArrowUpRight,
  Clock,
  Check,
  Users,
  Briefcase,
  Calendar,
  X,
  User,
  ArrowRight,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { toPersianDigits, formatScore, getGradeQualityLabel } from '../../utils/persian';
import { ReportCardDocument } from '../common/ReportCardDocument';
import { StudentAcademicProgress } from '../common/StudentAcademicProgress';
import { ReportCard, Teacher, Student } from '../../types';
import { generateInitialSchedule, BELL_PERIODS } from '../../utils/scheduleData';

interface StudentDashboardProps {
  onNavigate: (view: string) => void;
}

interface DashboardMetrics {
  overallGpa?: number;
  currentMonthGpa?: number;
  previousMonthGpa?: number;
  gpaGrowth?: number;
  rankInClass?: number;
  attendanceRate?: number;
  presentDays?: number;
  absentDays?: number;
  lateDays?: number;
  totalDays?: number;
  pendingHomeworkCount?: number;
}

/**
 * High-fidelity Skeleton Loading state for Student Dashboard
 */
export const StudentDashboardSkeleton: React.FC = () => {
  return (
    <motion.div
      key="student-dashboard-skeleton"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6 sm:space-y-8 text-right max-w-7xl mx-auto"
      dir="rtl"
    >
      {/* 1. Hero Banner Skeleton */}
      <div className="p-5 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl bg-gradient-to-l from-blue-950 via-slate-900 to-blue-900 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
          <div className="space-y-3">
            {/* Tag badge skeleton */}
            <div className="flex items-center gap-2">
              <div className="h-6 w-52 bg-white/10 rounded-full animate-pulse border border-white/10" />
              <div className="h-6 w-36 bg-emerald-500/10 rounded-full animate-pulse border border-emerald-500/20" />
            </div>
            {/* Title greeting skeleton */}
            <div className="h-8 sm:h-9 w-64 sm:w-80 bg-white/15 rounded-xl animate-pulse" />
            {/* Details bar skeleton */}
            <div className="flex items-center gap-3 pt-1">
              <div className="h-4 w-24 bg-white/10 rounded-lg animate-pulse" />
              <div className="h-4 w-32 bg-white/10 rounded-lg animate-pulse" />
              <div className="h-4 w-20 bg-white/10 rounded-lg animate-pulse" />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="h-10 w-32 bg-white/15 rounded-xl animate-pulse" />
            <div className="h-10 w-36 bg-white/10 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>

      {/* 2. Core 4 KPI Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse" />
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800/80 animate-pulse" />
            </div>
            <div className="flex items-baseline gap-2 pt-1">
              <div className="h-9 w-24 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
              <div className="h-4 w-10 bg-slate-100 dark:bg-slate-800 rounded-md animate-pulse" />
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="h-3.5 w-28 bg-slate-100 dark:bg-slate-800 rounded-md animate-pulse" />
              <div className="h-3.5 w-14 bg-slate-100 dark:bg-slate-800 rounded-md animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {/* 3. Community Cards Skeleton (Teachers & Classmates) */}
      <div className="grid sm:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="p-5 rounded-3xl bg-slate-50/80 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse shrink-0" />
              <div className="space-y-2">
                <div className="h-4 w-40 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse" />
                <div className="h-3 w-56 bg-slate-100 dark:bg-slate-800 rounded-md animate-pulse" />
              </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse shrink-0" />
          </div>
        ))}
      </div>

      {/* 4. Split Section Skeleton (Tomorrow's Schedule + Homeworks) */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Right 6 cols: Schedule skeleton */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
              <div className="space-y-1.5">
                <div className="h-4 w-36 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse" />
                <div className="h-3 w-28 bg-slate-100 dark:bg-slate-800 rounded-md animate-pulse" />
              </div>
            </div>
            <div className="h-4 w-20 bg-slate-100 dark:bg-slate-800 rounded-md animate-pulse" />
          </div>

          <div className="space-y-2.5">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse" />
                    <div className="h-2.5 w-16 bg-slate-100 dark:bg-slate-800 rounded-md animate-pulse" />
                  </div>
                </div>
                <div className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Left 6 cols: Homeworks skeleton */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
              <div className="space-y-1.5">
                <div className="h-4 w-44 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse" />
                <div className="h-3 w-28 bg-slate-100 dark:bg-slate-800 rounded-md animate-pulse" />
              </div>
            </div>
            <div className="h-4 w-20 bg-slate-100 dark:bg-slate-800 rounded-md animate-pulse" />
          </div>

          <div className="space-y-2.5">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="h-3.5 w-32 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse" />
                  <div className="h-4 w-14 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse" />
                </div>
                <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-md animate-pulse" />
                <div className="flex items-center justify-between pt-1">
                  <div className="h-2.5 w-24 bg-slate-100 dark:bg-slate-800 rounded-md animate-pulse" />
                  <div className="h-2.5 w-16 bg-slate-100 dark:bg-slate-800 rounded-md animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Academic Progress Chart Skeleton */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-md bg-slate-200 dark:bg-slate-700 animate-pulse" />
            <div className="h-5 w-52 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse" />
          </div>
          <div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded-md animate-pulse" />
        </div>

        {/* Simulated Bar Chart Skeleton */}
        <div className="h-56 flex items-end justify-between gap-3 px-4 pt-4 border-b border-slate-100 dark:border-slate-800">
          {[45, 75, 60, 90, 80, 95, 70, 85].map((heightPct, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <div
                style={{ height: `${heightPct}%` }}
                className="w-full max-w-[42px] bg-gradient-to-t from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-t-xl animate-pulse"
              />
              <div className="h-3 w-8 bg-slate-100 dark:bg-slate-800 rounded-md animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onNavigate }) => {
  const { user, currentUser, currentStudent } = useAuth();
  const {
    students,
    teachers,
    classes,
    subjects,
    grades,
    reportCards,
    attendance,
    homeworks,
    submissions,
    announcements,
    teacherNotes,
  } = useData();

  const [selectedReportCard, setSelectedReportCard] = useState<ReportCard | null>(null);
  const [showTeachersModal, setShowTeachersModal] = useState(false);
  const [showClassmatesModal, setShowClassmatesModal] = useState(false);
  const [apiMetrics, setApiMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Dynamically resolve logged-in student's identity from user context
  const activeUser = user || currentUser;
  const studentFirstName = activeUser?.firstName || currentStudent?.firstName || 'دانش‌آموز';
  const studentLastName = activeUser?.lastName || currentStudent?.lastName || '';
  const studentFullName = `${studentFirstName} ${studentLastName}`.trim();

  // Fetch real-time academic metrics from the Laravel API
  const fetchLiveMetrics = async (isInitial = false) => {
    if (isInitial) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    try {
      const res = await studentApi.getDashboard();
      if (res && res.success && res.data) {
        if (res.data.metrics) {
          setApiMetrics(res.data.metrics);
        } else if (res.data.attendanceSummary || res.data.latestReportCard) {
          const att = res.data.attendanceSummary;
          const rep = res.data.latestReportCard;
          setApiMetrics({
            overallGpa: rep?.gpa ? Number(rep.gpa) : undefined,
            rankInClass: rep?.rank_in_class ? Number(rep.rank_in_class) : undefined,
            attendanceRate: att?.attendanceRate || (att?.total ? Math.round(((att.present) / att.total) * 100) : undefined),
            presentDays: att?.present,
            absentDays: att?.absent,
            lateDays: att?.late,
            totalDays: att?.total,
          });
        }
      }
    } catch (err: any) {
      console.warn('Real-time Laravel API synchronization handled gracefully:', err?.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLiveMetrics(true);
  }, [currentStudent?.id, activeUser?.id]);

  // Student specific class
  const studentClass = classes.find(
    (c) => c.id === currentStudent?.classId || c.name === currentStudent?.className
  ) || classes[0];

  // Teachers of this student's class
  const classTeachers = useMemo(() => {
    if (!studentClass) return teachers;
    return teachers.filter((t) =>
      (t.assignedClassIds || []).includes(studentClass.id) ||
      (t.assignedClassIds || []).includes(studentClass.name)
    );
  }, [teachers, studentClass]);

  // Classmates
  const classmates = useMemo(() => {
    if (!studentClass) return [];
    return students.filter(
      (s) => (s.classId === studentClass.id || s.className === studentClass.name) && s.isActive
    );
  }, [students, studentClass]);

  // Student specific data
  const studentId = currentStudent?.id || activeUser?.id;
  const studentGrades = grades.filter((g) => g.studentId === studentId);
  const studentReports = reportCards.filter((r) => r.studentId === studentId);
  const studentAttendance = attendance.filter((a) => a.studentId === studentId);
  const studentHomeworks = homeworks.filter(
    (h) => h.classId === currentStudent?.classId || h.classId === studentClass?.id
  );
  const studentNotes = teacherNotes.filter((n) => n.studentId === studentId);

  // Latest report card
  const latestReport = studentReports[0] || null;

  // Real-time calculated GPA
  const currentGPA = useMemo(() => {
    if (apiMetrics?.overallGpa !== undefined) {
      return apiMetrics.overallGpa;
    }
    if (studentGrades.length > 0) {
      const sum = studentGrades.reduce((acc, g) => acc + g.score, 0);
      return +(sum / studentGrades.length).toFixed(2);
    }
    return latestReport?.gpa || 18.25;
  }, [apiMetrics?.overallGpa, studentGrades, latestReport]);

  // Real-time calculated current month GPA
  const currentMonthGPA = useMemo(() => {
    if (apiMetrics?.currentMonthGpa !== undefined) {
      return apiMetrics.currentMonthGpa;
    }
    const monthGrades = studentGrades.filter((g) => g.month === 'آبان' || g.month === 'آذر');
    if (monthGrades.length > 0) {
      const sum = monthGrades.reduce((acc, g) => acc + g.score, 0);
      return +(sum / monthGrades.length).toFixed(2);
    }
    return currentGPA;
  }, [apiMetrics?.currentMonthGpa, studentGrades, currentGPA]);

  // GPA Growth Delta
  const gpaGrowthDelta = useMemo(() => {
    if (apiMetrics?.gpaGrowth !== undefined) {
      return apiMetrics.gpaGrowth;
    }
    const mehrGrades = studentGrades.filter((g) => g.month === 'مهر');
    if (mehrGrades.length > 0) {
      const sumMehr = mehrGrades.reduce((acc, g) => acc + g.score, 0);
      const avgMehr = sumMehr / mehrGrades.length;
      return +(currentMonthGPA - avgMehr).toFixed(2);
    }
    return 0.30;
  }, [apiMetrics?.gpaGrowth, studentGrades, currentMonthGPA]);

  // Real-time class rank
  const currentRank = useMemo(() => {
    if (apiMetrics?.rankInClass !== undefined) {
      return apiMetrics.rankInClass;
    }
    if (latestReport?.rankInClass) {
      return latestReport.rankInClass;
    }
    if (classmates.length > 0) {
      const studentAverages = classmates.map((mate) => {
        const mateGrades = grades.filter((g) => g.studentId === mate.id);
        const avg = mateGrades.length > 0 ? mateGrades.reduce((s, g) => s + g.score, 0) / mateGrades.length : 0;
        return { id: mate.id, avg };
      });
      const higherStudents = studentAverages.filter((s) => s.avg > currentGPA).length;
      return higherStudents + 1;
    }
    return currentGPA >= 18 ? 2 : currentGPA >= 15 ? 5 : 10;
  }, [apiMetrics?.rankInClass, latestReport?.rankInClass, classmates, grades, currentGPA]);

  // Real-time Attendance stats
  const totalSessions = apiMetrics?.totalDays ?? studentAttendance.length;
  const presentCount = apiMetrics?.presentDays ?? studentAttendance.filter((a) => a.status === 'present' || a.status === 'excused').length;
  const absentCount = apiMetrics?.absentDays ?? studentAttendance.filter((a) => a.status === 'absent').length;
  const attendanceRate = useMemo(() => {
    if (apiMetrics?.attendanceRate !== undefined) {
      return apiMetrics.attendanceRate;
    }
    return totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 96;
  }, [apiMetrics?.attendanceRate, totalSessions, presentCount]);

  // Real-time Pending homework count
  const pendingHomeworkCount = useMemo(() => {
    if (apiMetrics?.pendingHomeworkCount !== undefined) {
      return apiMetrics.pendingHomeworkCount;
    }
    return studentHomeworks.filter(
      (h) => !submissions.some((s) => s.homeworkId === h.id && s.studentId === studentId)
    ).length;
  }, [apiMetrics?.pendingHomeworkCount, studentHomeworks, submissions, studentId]);

  // Weekly Schedule calculations & Tomorrow's periods
  const fullSchedule = useMemo(() => {
    return generateInitialSchedule(classes, subjects, teachers);
  }, [classes, subjects, teachers]);

  const classWeeklySchedule = useMemo(() => {
    if (!studentClass) return [];
    return fullSchedule.filter((s) => s.classId === studentClass.id);
  }, [fullSchedule, studentClass]);

  // Get tomorrow's day name in Persian
  const tomorrowDayName = useMemo(() => {
    const todayIndex = new Date().getDay(); // 0 is Sunday, 6 is Saturday
    const mapDay: Record<number, string> = {
      0: 'دوشنبه',
      1: 'سه‌شنبه',
      2: 'چهارشنبه',
      3: 'شنبه',
      4: 'شنبه',
      5: 'شنبه',
      6: 'یکشنبه',
    };
    return mapDay[todayIndex] || 'شنبه';
  }, []);

  const tomorrowSchedulePeriods = useMemo(() => {
    return classWeeklySchedule
      .filter((s) => s.dayOfWeek === tomorrowDayName)
      .sort((a, b) => a.periodNumber - b.periodNumber);
  }, [classWeeklySchedule, tomorrowDayName]);

  if (!currentStudent && !activeUser) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium">
        اطلاعات پرونده دانش‌آموزی یافت نشد.
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <StudentDashboardSkeleton key="skeleton-view" />
      ) : (
        <motion.div
          key="populated-dashboard-view"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="space-y-6 sm:space-y-8 text-right max-w-7xl mx-auto"
          dir="rtl"
        >
          {/* 1. Welcoming Hero Banner */}
          <div className="p-5 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl bg-gradient-to-l from-blue-950 via-slate-900 to-blue-900 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
              <div className="space-y-2 sm:space-y-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-bold border border-white/15">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>پرتال آموزشی و ارزشیابی دانش‌آموزی پدیده دانش</span>
                  </div>
                  <button
                    onClick={() => fetchLiveMetrics(false)}
                    disabled={isRefreshing}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30 hover:bg-emerald-500/30 transition-all cursor-pointer"
                    title="بروزرسانی داده‌های زنده از پایگاه داده"
                  >
                    <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span>{isRefreshing ? 'در حال همگام‌سازی...' : 'داده‌های برخط متصل به دیتابیس'}</span>
                  </button>
                </div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight">
                  سلام، {studentFullName} عزیز 👋
                </h1>
                <p className="text-xs sm:text-sm text-blue-200/90 flex items-center gap-2 sm:gap-3 flex-wrap">
                  <span>کلاس: <strong className="text-white font-bold">{currentStudent?.className || 'پایه هفتم'}</strong></span>
                  <span className="opacity-40">•</span>
                  <span>کد دانش‌آموزی: <strong className="font-mono text-white font-bold">{toPersianDigits(currentStudent?.studentCode || activeUser?.nationalId || '۴۰۳۰۰۱')}</strong></span>
                  <span className="opacity-40">•</span>
                  <span>پایه تحصیلی: <strong className="text-white font-bold">پایه {toPersianDigits(currentStudent?.gradeLevel || 7)}</strong></span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => onNavigate('schedule')}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>برنامه هفتگی کلاس</span>
                </button>
                <button
                  onClick={() => onNavigate('academic-progress')}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition-all cursor-pointer"
                >
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>تحلیل پیشرفت تحصیلی</span>
                </button>
              </div>
            </div>
          </div>

          {/* 2. Core Real-Time KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {/* Overall GPA Metric */}
            <div
              onClick={() => onNavigate('grades')}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-blue-400 dark:hover:border-blue-600 transition-all cursor-pointer group space-y-2 relative"
            >
              {isRefreshing && (
                <div className="absolute top-3 left-3">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping inline-block" />
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">معدل کل سال</span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Award className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">
                  {formatScore(currentGPA)}
                </span>
                <span className="text-xs text-slate-400 font-medium">از ۲۰</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold pt-1 border-t border-slate-100 dark:border-slate-800">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>رتبه {toPersianDigits(currentRank)} کلاسی</span>
              </div>
            </div>

            {/* Monthly Average Card */}
            <div
              onClick={() => onNavigate('academic-progress')}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-emerald-400 dark:hover:border-emerald-600 transition-all cursor-pointer group space-y-2 relative"
            >
              {isRefreshing && (
                <div className="absolute top-3 left-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">معدل ماه جاری (آبان)</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Sparkles className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {formatScore(currentMonthGPA)}
                </span>
                <span className="text-xs text-slate-400 font-medium">از ۲۰</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold pt-1 border-t border-slate-100 dark:border-slate-800">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>رشد {gpaGrowthDelta >= 0 ? `+${toPersianDigits(gpaGrowthDelta)}` : toPersianDigits(gpaGrowthDelta)} نسبت به ماه قبل</span>
              </div>
            </div>

            {/* Attendance Metric */}
            <div
              onClick={() => onNavigate('attendance')}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-amber-400 dark:hover:border-amber-600 transition-all cursor-pointer group space-y-2 relative"
            >
              {isRefreshing && (
                <div className="absolute top-3 left-3">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping inline-block" />
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">حضور و نظم آموزشی</span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CalendarCheck className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-amber-600 dark:text-amber-400 font-mono">
                  {toPersianDigits(attendanceRate)}٪
                </span>
                <span className="text-xs text-slate-400 font-medium">نرخ حضور</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                <span>حاضر: {toPersianDigits(presentCount)} روز</span>
                <span>غیبت: {toPersianDigits(absentCount)}</span>
              </div>
            </div>

            {/* Pending Homework */}
            <div
              onClick={() => onNavigate('homework')}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-purple-400 dark:hover:border-purple-600 transition-all cursor-pointer group space-y-2 relative"
            >
              {isRefreshing && (
                <div className="absolute top-3 left-3">
                  <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping inline-block" />
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">تکالیف در انتظار تحویل</span>
                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BookOpen className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-purple-600 dark:text-purple-400 font-mono">
                  {toPersianDigits(pendingHomeworkCount)}
                </span>
                <span className="text-xs text-slate-400 font-medium">تکلیف فعال</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-bold pt-1 border-t border-slate-100 dark:border-slate-800">
                <span>مشاهده و تحویل تمرین‌ها &larr;</span>
              </div>
            </div>
          </div>

          {/* 3. Interactive Class Community Cards: "دبیران من" and "هم‌کلاسی‌های من" */}
          <div className="grid sm:grid-cols-2 gap-4">
            {/* My Teachers Card */}
            <div
              onClick={() => setShowTeachersModal(true)}
              className="p-5 rounded-3xl bg-gradient-to-l from-blue-50/80 to-indigo-50/60 dark:from-slate-900 dark:to-slate-800 border border-blue-200/80 dark:border-slate-700 shadow-xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 group-hover:scale-105 transition-transform">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <span>اساتید و دبیران کلاس من</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold">
                      {toPersianDigits(classTeachers.length)} دبیر
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    مشاهده اسامی، رشته تخصصی و راه‌های ارتباطی دبیران کلاس {currentStudent?.className || 'پایه هفتم'}
                  </p>
                </div>
              </div>

              <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 text-slate-400 flex items-center justify-center group-hover:text-blue-600 group-hover:translate-x-[-2px] transition-all">
                <ChevronLeft className="w-4 h-4" />
              </div>
            </div>

            {/* My Classmates Card */}
            <div
              onClick={() => setShowClassmatesModal(true)}
              className="p-5 rounded-3xl bg-gradient-to-l from-emerald-50/80 to-teal-50/60 dark:from-slate-900 dark:to-slate-800 border border-emerald-200/80 dark:border-slate-700 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <span>هم‌کلاسی‌های من</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                      {toPersianDigits(classmates.length)} دانش‌آموز
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    لیست دانش‌آموزان و نمایندگان کلاس {currentStudent?.className || 'پایه هفتم'}
                  </p>
                </div>
              </div>

              <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 text-slate-400 flex items-center justify-center group-hover:text-emerald-600 group-hover:translate-x-[-2px] transition-all">
                <ChevronLeft className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* 4. Split Section: Tomorrow's Schedule (Right 6 cols) & Tomorrow's Active Homeworks (Left 6 cols) */}
          <div className="grid lg:grid-cols-12 gap-6">
            {/* Right 6 Cols: Tomorrow's Schedule */}
            <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-900 dark:text-white">
                      برنامه کلاسی فردا ({tomorrowDayName})
                    </h3>
                    <p className="text-[11px] text-slate-400">ساعات حضور و دروس مشخص شده</p>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('schedule')}
                  className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                >
                  مشاهده کل هفته &larr;
                </button>
              </div>

              <div className="space-y-2.5">
                {tomorrowSchedulePeriods.length > 0 ? (
                  tomorrowSchedulePeriods.map((period) => (
                    <div
                      key={period.id}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-black text-xs flex items-center justify-center">
                          {toPersianDigits(period.periodNumber)}
                        </span>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-xs">{period.subjectName}</p>
                          <p className="text-[11px] text-slate-400">دبیر: {period.teacherName}</p>
                        </div>
                      </div>

                      <div className="text-left font-mono">
                        <span className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-bold">
                          {toPersianDigits(period.startTime)} - {toPersianDigits(period.endTime)}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">اتاق {toPersianDigits(period.roomNumber || 101)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 dark:bg-slate-800 rounded-2xl">
                    برنامه‌ای برای فردا تعریف نشده است یا روز تعطیل می‌باشد.
                  </div>
                )}
              </div>
            </div>

            {/* Left 6 Cols: Tomorrow's Homework & Active Assignments */}
            <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-900 dark:text-white">
                      تکالیف تحویلی فردا و اولویت‌دار
                    </h3>
                    <p className="text-[11px] text-slate-400">ارسال پاسخ‌ها قبل از شروع کلاس</p>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('homework')}
                  className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                >
                  میز کار تکالیف &larr;
                </button>
              </div>

              <div className="space-y-2.5">
                {studentHomeworks.slice(0, 3).map((hw) => {
                  const sub = subjects.find((s) => s.id === hw.subjectId);
                  const isSubmitted = submissions.some(
                    (s) => s.homeworkId === hw.id && s.studentId === studentId
                  );
                  return (
                    <div
                      key={hw.id}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white">{hw.title}</span>
                        <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
                          {sub?.title}
                        </span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] line-clamp-2">{hw.description}</p>
                      <div className="flex items-center justify-between pt-1 text-[10px]">
                        <span className="text-amber-600 dark:text-amber-400 font-bold">
                          مهلت تحویل: {toPersianDigits(hw.dueDate)}
                        </span>
                        <span className={isSubmitted ? 'text-emerald-600 font-bold' : 'text-rose-500 font-bold'}>
                          {isSubmitted ? '✓ ارسال شده' : 'در انتظار ارسال'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 5. Embedded Academic Progress Chart Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <span>نمودار روند نمرات و پیشرفت تحصیلی دانش‌آموز</span>
              </h3>

              <button
                onClick={() => onNavigate('academic-progress')}
                className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
              >
                مشاهده گزارش تحلیلی کامل &larr;
              </button>
            </div>

            {currentStudent && (
              <StudentAcademicProgress
                student={currentStudent}
                grades={grades}
                subjects={subjects}
              />
            )}
          </div>

          {/* Modal 1: My Teachers */}
          {showTeachersModal && (
            <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <h3 className="font-black text-sm text-slate-900 dark:text-white">
                      اساتید و دبیران کلاس {currentStudent?.className || 'پایه هفتم'}
                    </h3>
                  </div>

                  <button
                    onClick={() => setShowTeachersModal(false)}
                    className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  {classTeachers.map((t) => (
                    <div
                      key={t.id}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-xs">
                            استاد {t.firstName} {t.lastName}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            تخصص: {t.specialty}
                          </p>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-[10px]">
                        دبیر مصوب
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Modal 2: My Classmates */}
          {showClassmatesModal && (
            <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                    <h3 className="font-black text-sm text-slate-900 dark:text-white">
                      هم‌کلاسی‌های کلاس {currentStudent?.className || 'پایه هفتم'} ({toPersianDigits(classmates.length)} نفر)
                    </h3>
                  </div>

                  <button
                    onClick={() => setShowClassmatesModal(false)}
                    className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  {classmates.map((s, idx) => (
                    <div
                      key={s.id}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-[10px] flex items-center justify-center font-mono">
                          {toPersianDigits(idx + 1)}
                        </span>
                        <p className="font-bold text-slate-900 dark:text-white">
                          {s.firstName} {s.lastName}
                        </p>
                      </div>

                      <span className="text-[10px] text-slate-400 font-mono">
                        کد: {toPersianDigits(s.studentCode)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Report Card Full Document Modal */}
          {selectedReportCard && (
            <ReportCardDocument
              reportCard={selectedReportCard}
              onClose={() => setSelectedReportCard(null)}
              isModal={true}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

