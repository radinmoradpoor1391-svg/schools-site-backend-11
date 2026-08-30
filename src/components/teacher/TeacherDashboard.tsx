import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  Award,
  CalendarCheck,
  BookOpen,
  Users,
  Briefcase,
  Layers,
  Sparkles,
  ChevronLeft,
  Clock,
  CheckCircle2,
  FileSpreadsheet,
  Calendar,
  Bell,
  Check,
  AlertCircle,
  FileText,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';
import { toPersianDigits } from '../../utils/persian';

interface TeacherDashboardProps {
  onNavigate: (view: string) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onNavigate }) => {
  const { currentTeacher, user, currentUser } = useAuth();
  const { classes, subjects, students, grades, homeworks, submissions, announcements, schedules } = useData();

  const activeTeacher = currentTeacher || {
    id: user?.id || currentUser?.id || 't1',
    userId: user?.id || currentUser?.id || 'u2',
    nationalId: user?.nationalId || '2222222222',
    firstName: user?.firstName || 'دکتر احمد',
    lastName: user?.lastName || 'حسینی',
    specialty: 'ریاضیات و هندسه تحلیلی',
    degree: 'دکتری ریاضیات کاربردی',
    phone: user?.phone || '09122222222',
    email: user?.email || 'dr.hosseini@padideh.sch.ir',
    assignedClassIds: ['c1', 'c2', 'c3'],
    assignedSubjectIds: ['s1', 's2', 's8'],
    isActive: true,
    firstLogin: false,
  };

  // Filter classes and subjects strictly assigned to this teacher
  const assignedClasses = useMemo(() => {
    return classes.filter((c) =>
      (activeTeacher.assignedClassIds || []).includes(c.id) ||
      (activeTeacher.assignedClassIds || []).includes(c.name)
    );
  }, [classes, activeTeacher]);

  const assignedSubjects = useMemo(() => {
    return subjects.filter((s) =>
      (activeTeacher.assignedSubjectIds || []).includes(s.id) ||
      (activeTeacher.assignedSubjectIds || []).includes(s.title) ||
      s.title.includes(activeTeacher.specialty)
    );
  }, [subjects, activeTeacher]);

  // Total students taught
  const totalStudentsCount = useMemo(() => {
    return assignedClasses.reduce((acc, c) => {
      const count = students.filter((s) => s.classId === c.id || s.className === c.name).length;
      return acc + count;
    }, 0);
  }, [assignedClasses, students]);

  // Homeworks created by this teacher
  const teacherHomeworks = useMemo(() => {
    return homeworks.filter(
      (h) => h.teacherId === activeTeacher.id || assignedSubjects.some((s) => s.id === h.subjectId)
    );
  }, [homeworks, activeTeacher, assignedSubjects]);

  // Submissions waiting for grading
  const pendingSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      const hw = teacherHomeworks.find((h) => h.id === s.homeworkId);
      return hw && s.status === 'submitted';
    });
  }, [submissions, teacherHomeworks]);

  // Current Persian day of week
  const daysOfWeek = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه'];
  const todayPersianDay = useMemo(() => {
    const dayMap: Record<number, string> = {
      0: 'یکشنبه',
      1: 'دوشنبه',
      2: 'سه‌شنبه',
      3: 'چهارشنبه',
      4: 'پنج‌شنبه',
      5: 'جمعه',
      6: 'شنبه',
    };
    return dayMap[new Date().getDay()] || 'شنبه';
  }, []);

  // Today's classes from DB schedules
  const teacherSchedulesEnriched = useMemo(() => {
    const list = schedules.filter(
      (s) =>
        s.teacherId === activeTeacher.id ||
        s.teacherId === activeTeacher.userId ||
        (activeTeacher.assignedClassIds || []).includes(s.classId)
    );
    return list.map((s) => {
      const cls = classes.find((c) => c.id === s.classId);
      const sub = subjects.find((sb) => sb.id === s.subjectId);
      return {
        ...s,
        className: cls ? cls.name : 'کلاس',
        subjectName: sub ? sub.title : 'درس',
      };
    });
  }, [schedules, activeTeacher, classes, subjects]);

  const todayClasses = useMemo(() => {
    return teacherSchedulesEnriched
      .filter((s) => s.dayName === todayPersianDay || daysOfWeek[s.dayOfWeek] === todayPersianDay)
      .sort((a, b) => a.periodNumber - b.periodNumber);
  }, [teacherSchedulesEnriched, todayPersianDay, daysOfWeek]);

  // Next class calculation
  const nextClass = todayClasses[0] || teacherSchedulesEnriched[0] || null;

  // Class GPA Analytics for Recharts
  const classAnalyticsData = useMemo(() => {
    return assignedClasses.map((cls) => {
      const classGrades = grades.filter((g) => g.classId === cls.id);
      const scores = classGrades.map((g) => g.score).filter((sc) => typeof sc === 'number' && !isNaN(sc));
      const avg = scores.length > 0 ? +(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : 18.25;
      return {
        name: cls.name,
        average: avg,
        studentsCount: students.filter((s) => s.classId === cls.id).length,
      };
    });
  }, [assignedClasses, grades, students]);

  const overallAvg = useMemo(() => {
    if (classAnalyticsData.length === 0) return '—';
    const sum = classAnalyticsData.reduce((acc, curr) => acc + curr.average, 0);
    return (sum / classAnalyticsData.length).toFixed(2);
  }, [classAnalyticsData]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 text-right"
      dir="rtl"
    >
      {/* Top Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-l from-blue-950 via-slate-900 to-slate-950 text-white shadow-xl relative overflow-hidden border border-blue-900/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-bold border border-white/15">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>میز کار هوشمند و سامانه مدیریت تدریس دبیر</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black">
              استاد گرامی، {activeTeacher.firstName} {activeTeacher.lastName}
            </h1>
            <p className="text-xs md:text-sm text-blue-200">
              دبیر تخصصی: {activeTeacher.specialty} • مدرک: {activeTeacher.degree} • سال تحصیلی ۱۴۰۴–۱۴۰۵
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => onNavigate('schedule')}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs shadow-md transition-colors cursor-pointer border border-white/15"
            >
              <Calendar className="w-4 h-4" />
              <span>برنامه هفتگی تدریس</span>
            </button>

            <button
              onClick={() => onNavigate('messages')}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs shadow-md transition-colors cursor-pointer border border-white/15"
            >
              <Bell className="w-4 h-4 text-amber-400" />
              <span>مرکز اعلانات</span>
            </button>

            <button
              onClick={() => onNavigate('grading')}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg transition-colors cursor-pointer"
            >
              <Award className="w-4 h-4" />
              <span>ثبت نمرات کلاسی</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Core KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Classes */}
        <div
          onClick={() => onNavigate('attendance')}
          className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1 hover:border-blue-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">کلاس‌های تخصیص‌یافته</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
            {toPersianDigits(assignedClasses.length)} <span className="text-xs font-normal text-slate-400">کلاس</span>
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            دفتر حضور و غیاب برخط
          </p>
        </div>

        {/* 2. Students */}
        <div
          onClick={() => onNavigate('grading')}
          className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1 hover:border-emerald-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">دانش‌آموزان تحت آموزش</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {toPersianDigits(totalStudentsCount)} <span className="text-xs font-normal text-slate-400">نفر</span>
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            در {toPersianDigits(assignedClasses.length)} کلاس فعال
          </p>
        </div>

        {/* 3. Average GPA */}
        <div
          onClick={() => onNavigate('grading')}
          className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1 hover:border-purple-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">میانگین نمرات کلاسی</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono">
            {toPersianDigits(overallAvg)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            معدل کل گروه‌های تحت تدریس
          </p>
        </div>

        {/* 4. Homeworks & Submissions */}
        <div
          onClick={() => onNavigate('homework')}
          className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1 hover:border-amber-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">تکالیف نیازمند بررسی</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
            {toPersianDigits(pendingSubmissions.length)} <span className="text-xs font-normal text-slate-400">ارسال</span>
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {toPersianDigits(teacherHomeworks.length)} تکلیف فعال
          </p>
        </div>
      </div>

      {/* Analytics Chart & Schedule Grid */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Class Average Comparison (Recharts) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span>نمودار مقایسه میانگین نمرات کلاس‌های دبیر</span>
            </h3>
            <span className="text-xs text-slate-400">معیار از ۲۰ نمره</span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classAnalyticsData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 20]}
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => toPersianDigits(val)}
                />
                <Tooltip
                  formatter={(val: any) => [`${toPersianDigits(val)} از ۲۰`, 'میانگین نمرات']}
                  labelFormatter={(label) => `کلاس ${label}`}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '1rem',
                    color: '#fff',
                    textAlign: 'right',
                    fontSize: '12px',
                    direction: 'rtl',
                  }}
                />
                <Bar dataKey="average" radius={[8, 8, 0, 0]} barSize={36}>
                  {classAnalyticsData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'][index % 4]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Today's Teaching Schedule with Next Class Timer */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>برنامه زنگ‌های تدریس امروز ({todayPersianDay})</span>
              </h3>
              <button
                onClick={() => onNavigate('schedule')}
                className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
              >
                مشاهده کل هفته &larr;
              </button>
            </div>

            <div className="space-y-2.5 pt-3">
              {todayClasses.length > 0 ? (
                todayClasses.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-black text-xs flex items-center justify-center">
                        {toPersianDigits(item.periodNumber)}
                      </span>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{item.subjectName}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {item.className} • اتاق {toPersianDigits(item.roomNumber || '۱۰۱')}
                        </p>
                      </div>
                    </div>

                    <span className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-mono text-xs font-bold">
                      {toPersianDigits(item.startTime)} - {toPersianDigits(item.endTime)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                  امروز کلاسی برای شما در سیستم ثبت نشده است (روز مطالعاتی).
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => onNavigate('attendance')}
              className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer text-center"
            >
              ثبت حضور و غیاب امروز
            </button>
            <button
              onClick={() => onNavigate('schedule')}
              className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
            >
              برنامه هفتگی
            </button>
          </div>
        </div>
      </div>

      {/* Assigned Classes Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>کلاس‌ها و گروه‌های درسی تخصیص‌یافته به شما</span>
          </h3>
          <span className="text-xs text-slate-400">{toPersianDigits(assignedClasses.length)} کلاس فعال</span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {assignedClasses.map((cls) => {
            const count = students.filter((s) => s.classId === cls.id || s.className === cls.name).length;
            return (
              <div
                key={cls.id}
                className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300">
                    پایه {cls.gradeLevel}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">اتاق {toPersianDigits(cls.roomNumber || '۱۰۱')}</span>
                </div>

                <h4 className="font-bold text-slate-900 dark:text-white text-base">{cls.name}</h4>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  تعداد دانش‌آموزان: <span className="font-bold text-slate-800 dark:text-slate-200">{toPersianDigits(count)} نفر</span>
                </p>

                <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => onNavigate('grading')}
                    className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    دفتر نمرات
                  </button>
                  <button
                    onClick={() => onNavigate('attendance')}
                    className="py-2 px-3 rounded-xl bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs border border-slate-200 dark:border-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    حضور و غیاب
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};
