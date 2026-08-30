import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import {
  TrendingUp,
  BarChart3,
  Award,
  AlertTriangle,
  Users,
  CheckCircle2,
  Calendar,
  BookOpen,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Sparkles,
  Layers,
  GraduationCap,
  HeartHandshake,
  TrendingDown,
} from 'lucide-react';
import { toPersianDigits, formatScore, getGradeColorClass, MONTH_NAMES } from '../../utils/persian';
import { calculateStudentGPA, calculateClassOverallGPA } from '../../utils/academicCalculations';

export const AdminSchoolAnalytics: React.FC = () => {
  const { students, teachers, classes, subjects, grades, attendance } = useData();
  const [activeTab, setActiveTab] = useState<'academic' | 'growth' | 'subjects' | 'attendance'>('academic');

  // 1. DYNAMIC CLASS GPA STATS
  const classAverages = useMemo(() => {
    return classes.map((cls) => {
      const clsStudents = students.filter((s) => s.classId === cls.id || s.className === cls.name);
      const clsGrades = grades.filter((g) => g.classId === cls.id || clsStudents.some(cs => cs.id === g.studentId));
      const avg = clsGrades.length > 0
        ? +(clsGrades.reduce((acc, curr) => acc + curr.score, 0) / clsGrades.length).toFixed(2)
        : 0;

      return {
        class: cls,
        average: avg,
        studentsCount: clsStudents.length,
        gradesCount: clsGrades.length,
      };
    }).sort((a, b) => b.average - a.average);
  }, [classes, grades, students]);

  // 2. ACADEMIC GROWTH & ATTENTION NEEDED ANALYSIS (DYNAMIC)
  const growthAnalytics = useMemo(() => {
    const studentInsights = students.map((std) => {
      const stdGrades = grades.filter((g) => g.studentId === std.id);
      const gpaResult = calculateStudentGPA(grades, subjects, std.id);
      const currentGPA = gpaResult.hasGrades ? gpaResult.gpa : 0;

      // Group grades by month to calculate real trend
      const monthlyScores = new Map<string, number[]>();
      stdGrades.forEach((g) => {
        const m = g.month || 'مهر';
        const arr = monthlyScores.get(m) || [];
        arr.push(g.score);
        monthlyScores.set(m, arr);
      });

      const schoolMonths = ['مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند', 'فروردین', 'اردیبهشت', 'خرداد'];
      const recordedMonths = schoolMonths.filter((m) => monthlyScores.has(m));
      
      let growthDelta = 0;
      let earliestAvg = 0;
      let latestAvg = 0;

      if (recordedMonths.length >= 2) {
        const firstMonthScores = monthlyScores.get(recordedMonths[0]) || [];
        const lastMonthScores = monthlyScores.get(recordedMonths[recordedMonths.length - 1]) || [];
        earliestAvg = firstMonthScores.length > 0 ? firstMonthScores.reduce((a, b) => a + b, 0) / firstMonthScores.length : 0;
        latestAvg = lastMonthScores.length > 0 ? lastMonthScores.reduce((a, b) => a + b, 0) / lastMonthScores.length : 0;
        growthDelta = +(latestAvg - earliestAvg).toFixed(2);
      }

      // Count failing subjects (< 10)
      const failingSubjects: string[] = [];
      subjects.forEach((sub) => {
        const subGrades = stdGrades.filter((g) => g.subjectId === sub.id);
        if (subGrades.length > 0) {
          const subAvg = subGrades.reduce((a, b) => a + b, 0) / subGrades.length;
          if (subAvg < 10) {
            failingSubjects.push(sub.title);
          }
        }
      });

      const needsAttention = currentGPA > 0 && (currentGPA < 12 || failingSubjects.length > 0 || growthDelta < -1);

      return {
        student: std,
        currentGPA,
        growthDelta,
        earliestAvg,
        latestAvg,
        gradesCount: stdGrades.length,
        failingSubjects,
        needsAttention,
      };
    });

    // Top Growth Students (growthDelta > 0, sorted descending)
    const topGrowth = studentInsights
      .filter((si) => si.growthDelta > 0 && si.gradesCount >= 2)
      .sort((a, b) => b.growthDelta - a.growthDelta)
      .slice(0, 10);

    // Students Needing Attention (GPA < 12, failing subjects or severe drop)
    const needingAttention = studentInsights
      .filter((si) => si.needsAttention)
      .sort((a, b) => a.currentGPA - b.currentGPA)
      .slice(0, 10);

    return { topGrowth, needingAttention };
  }, [students, grades, subjects]);

  // 3. DYNAMIC SUBJECT ANALYSIS
  const subjectStats = useMemo(() => {
    const list = subjects.map((sub) => {
      const subGrades = grades.filter((g) => g.subjectId === sub.id);
      const avg = subGrades.length > 0
        ? +(subGrades.reduce((acc, curr) => acc + curr.score, 0) / subGrades.length).toFixed(2)
        : 0;

      // Count struggling students (avg in this subject < 12)
      const studentAvgInSub = new Map<string, number[]>();
      subGrades.forEach((g) => {
        const arr = studentAvgInSub.get(g.studentId) || [];
        arr.push(g.score);
        studentAvgInSub.set(g.studentId, arr);
      });

      let strugglingCount = 0;
      studentAvgInSub.forEach((scores) => {
        const studentSubAvg = scores.reduce((a, b) => a + b, 0) / scores.length;
        if (studentSubAvg < 12) strugglingCount++;
      });

      const teacher = teachers.find((t) => (t.assignedSubjectIds || []).includes(sub.id));

      return {
        subject: sub,
        average: avg,
        totalGrades: subGrades.length,
        strugglingCount,
        teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : 'دبیر تخصصی پایه',
      };
    });

    const activeList = list.filter((s) => s.totalGrades > 0);
    list.sort((a, b) => b.average - a.average);
    const bestSubject = activeList.length > 0 ? [...activeList].sort((a, b) => b.average - a.average)[0] : list[0] || null;
    const lowestSubject = activeList.length > 0 ? [...activeList].sort((a, b) => a.average - b.average)[0] : list[list.length - 1] || null;

    return { list, bestSubject, lowestSubject };
  }, [subjects, grades, teachers]);

  // 4. DYNAMIC MONTHLY PROGRESSION STATS
  const monthlyTrends = useMemo(() => {
    const schoolMonths = ['مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند', 'فروردین', 'اردیبهشت', 'خرداد'];

    return schoolMonths.map((month) => {
      const monthGrades = grades.filter((g) => g.month === month);
      const avg = monthGrades.length > 0
        ? +(monthGrades.reduce((acc, curr) => acc + curr.score, 0) / monthGrades.length).toFixed(2)
        : 0;

      return { month, avg, count: monthGrades.length };
    });
  }, [grades]);

  // 5. DYNAMIC ATTENDANCE ANALYTICS
  const attendanceAnalytics = useMemo(() => {
    const totalRecords = attendance.length;
    const presentCount = attendance.filter((a) => a.status === 'present' || a.status === 'excused').length;
    const absentCount = attendance.filter((a) => a.status === 'absent').length;
    const lateCount = attendance.filter((a) => a.status === 'late').length;
    const overallRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;

    // Absences per class
    const classAbsences = classes.map((cls) => {
      const clsStudents = students.filter((s) => s.classId === cls.id || s.className === cls.name);
      const clsStudentIds = clsStudents.map((s) => s.id);
      const clsAtt = attendance.filter((a) => a.classId === cls.id || clsStudentIds.includes(a.studentId));
      const abs = clsAtt.filter((a) => a.status === 'absent').length;
      const total = clsAtt.length;
      const rate = total > 0 ? Math.round(((total - abs) / total) * 100) : 0;
      return { class: cls, abs, rate, totalRecords: total };
    }).sort((a, b) => b.abs - a.abs);

    return { overallRate, absentCount, lateCount, classAbsences, totalRecords };
  }, [attendance, classes, students]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 text-right" dir="rtl">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-base md:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
            مرکز تحلیل و آمار عملکرد آموزشی مدرسه
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            محاسبه زنده بر مبنای داده‌های واقعی دیتابیس (نمرات، شاخص‌های رشد، دروس و حضور و غیاب)
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl text-xs font-bold overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('academic')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'academic'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            عملکرد تحصیلی و کلاس‌ها
          </button>

          <button
            onClick={() => setActiveTab('growth')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'growth'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            تحلیل رشد و هدایت تحصیلی
          </button>

          <button
            onClick={() => setActiveTab('subjects')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'subjects'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            تحلیل دروس
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'attendance'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            حضور و غیاب
          </button>
        </div>
      </div>

      {/* TAB 1: ACADEMIC PERFORMANCE */}
      {activeTab === 'academic' && (
        <div className="space-y-6">
          {/* Class Averages Visual Grid */}
          <div className="space-y-3">
            <h3 className="font-bold text-xs md:text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              میانگین معدل و رتبه‌بندی کلاس‌ها (محاسبه از نمرات واقعی)
            </h3>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {classAverages.map((ca, idx) => (
                <div
                  key={ca.class.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2 text-xs hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-black text-[10px]">
                        {toPersianDigits(idx + 1)}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">{ca.class.name}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                      پایه {ca.class.gradeLevel}
                    </span>
                  </div>

                  <div className="flex items-end justify-between pt-1">
                    <span className="text-[11px] text-slate-400">میانگین کل نمرات:</span>
                    <span className="text-xl font-black text-blue-600 dark:text-blue-400">
                      {ca.average > 0 ? formatScore(ca.average) : '۰'}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${ca.average > 0 ? (ca.average / 20) * 100 : 0}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
                    <span>{toPersianDigits(ca.studentsCount)} دانش‌آموز</span>
                    <span>اتاق {toPersianDigits(ca.class.roomNumber || '۱۰۱')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Trend Progress */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs md:text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                میانگین نمرات ثبت‌شده به تفکیک ماه‌های تحصیلی
              </h3>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-9 gap-2">
              {monthlyTrends.map((mt) => (
                <div
                  key={mt.month}
                  className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-center space-y-1"
                >
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{mt.month}</span>
                  <p className="text-base font-black text-slate-900 dark:text-white">
                    {mt.avg > 0 ? formatScore(mt.avg) : '—'}
                  </p>
                  <span className="inline-block text-[9px] text-slate-400">
                    {mt.count > 0 ? `${toPersianDigits(mt.count)} نمره` : 'بدون ثبت'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACADEMIC GROWTH & ATTENTION NEEDED */}
      {activeTab === 'growth' && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Highest Growth Students */}
            <div className="p-5 rounded-3xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-sm text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  دانش‌آموزان با بالاترین رشد تحصیلی
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                  رشد مثبت
                </span>
              </div>

              {growthAnalytics.topGrowth.length === 0 ? (
                <div className="p-8 text-center bg-white/60 dark:bg-slate-900/60 rounded-2xl border border-emerald-100 dark:border-emerald-900/40">
                  <Sparkles className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    داده کافی برای محاسبه شاخص رشد وجود ندارد
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    با ثبت نمرات متوالی در ماه‌های مختلف، تغییرات و رشد تحصیلی محاسبه خواهد شد.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {growthAnalytics.topGrowth.map((si, idx) => (
                    <div
                      key={si.student.id}
                      className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between text-xs shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-black text-xs flex items-center justify-center">
                          {toPersianDigits(idx + 1)}
                        </span>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">
                            {si.student.firstName} {si.student.lastName}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            کلاس {si.student.className} • معدل فعلی: {formatScore(si.currentGPA)}
                          </p>
                        </div>
                      </div>

                      <div className="text-left">
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-black text-xs font-mono">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          +{toPersianDigits(si.growthDelta)} نمره
                        </span>
                        <span className="block text-[9px] text-slate-400 mt-0.5">
                          رشد نسبت به ماه آغازین
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Students Needing Academic Attention */}
            <div className="p-5 rounded-3xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-sm text-amber-900 dark:text-amber-200 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  دانش‌آموزان نیازمند توجه و راهنمایی آموزشی
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-600 text-white">
                  پایش ویژه
                </span>
              </div>

              {growthAnalytics.needingAttention.length === 0 ? (
                <div className="p-8 text-center bg-white/60 dark:bg-slate-900/60 rounded-2xl border border-amber-100 dark:border-amber-900/40">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    مورد بحرانی یا نیازمند توجه ثبت نشده است
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    همه دانش‌آموزان دارای نمرات مطلوب و بالای حد نصاب قبولی هستند.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {growthAnalytics.needingAttention.map((si, idx) => (
                    <div
                      key={si.student.id}
                      className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-amber-100 dark:border-amber-900/40 flex items-center justify-between text-xs shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-black text-xs flex items-center justify-center">
                          {toPersianDigits(idx + 1)}
                        </span>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">
                            {si.student.firstName} {si.student.lastName}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            کلاس {si.student.className} • معدل: {formatScore(si.currentGPA)}
                          </p>
                        </div>
                      </div>

                      <div className="text-left space-y-0.5">
                        {si.failingSubjects.length > 0 ? (
                          <span className="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-600 font-bold text-[10px]">
                            ضعف در: {si.failingSubjects.slice(0, 2).join('، ')}
                          </span>
                        ) : si.growthDelta < 0 ? (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-rose-50 text-rose-600 font-bold text-[10px] font-mono">
                            <TrendingDown className="w-3.5 h-3.5" />
                            {toPersianDigits(si.growthDelta)} نمره افت
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 font-bold text-[10px]">
                            معدل زیر ۱۲
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SUBJECT ANALYSIS */}
      {activeTab === 'subjects' && (
        <div className="space-y-6">
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                <tr>
                  <th className="py-3 px-4">عنوان درس</th>
                  <th className="py-3 px-4">ضریب وزنی</th>
                  <th className="py-3 px-4">دبیر تخصصی</th>
                  <th className="py-3 px-4 text-center">میانگین کل نمرات</th>
                  <th className="py-3 px-4 text-center">تعداد نمرات ثبت‌شده</th>
                  <th className="py-3 px-4 text-center">دانش‌آموزان زیر ۱۲</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {subjectStats.list.map((st) => (
                  <tr key={st.subject.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {st.subject.title}
                    </td>
                    <td className="py-3.5 px-4 font-mono">{toPersianDigits(st.subject.coefficient)}</td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">{st.teacherName}</td>
                    <td className="py-3.5 px-4 text-center font-black">
                      <span className={`text-sm ${getGradeColorClass(st.average)}`}>
                        {st.average > 0 ? formatScore(st.average) : '—'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-500">
                      {toPersianDigits(st.totalGrades)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          st.strugglingCount === 0
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-amber-50 text-amber-600'
                        }`}
                      >
                        {st.strugglingCount === 0 ? 'بدون مورد ضعیف' : `${toPersianDigits(st.strugglingCount)} نفر`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: ATTENDANCE ANALYTICS */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60 space-y-1">
              <span className="text-[11px] font-bold text-slate-500">میانگین حضور کل مدرسه</span>
              <p className="text-2xl font-black text-emerald-600">
                {toPersianDigits(attendanceAnalytics.overallRate)}٪
              </p>
              <p className="text-[10px] text-slate-400">انضباط تحصیلی پایدار</p>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/60 space-y-1">
              <span className="text-[11px] font-bold text-slate-500">مجموع غیبت‌های ثبت‌شده</span>
              <p className="text-2xl font-black text-rose-600">
                {toPersianDigits(attendanceAnalytics.absentCount)}
              </p>
              <p className="text-[10px] text-slate-400">نفر-روز در سامانه</p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/60 space-y-1">
              <span className="text-[11px] font-bold text-slate-500">تاخیرهای ورودی</span>
              <p className="text-2xl font-black text-amber-600">
                {toPersianDigits(attendanceAnalytics.lateCount)}
              </p>
              <p className="text-[10px] text-slate-400">ثبت انضباطی روزانه</p>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 space-y-1">
              <span className="text-[11px] font-bold text-slate-500">پایش هوشمند کلاس‌ها</span>
              <p className="text-2xl font-black text-blue-600">
                {toPersianDigits(classes.length)} کلاس
              </p>
              <p className="text-[10px] text-slate-400">ثبت دفاتر الکترونیکی روزانه</p>
            </div>
          </div>

          {/* Classes Absence Breakdown */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-4">
            <h3 className="font-bold text-xs md:text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              توزیع حضور و غیاب به تفکیک کلاس‌ها
            </h3>

            <div className="space-y-3">
              {attendanceAnalytics.classAbsences.map((ca) => (
                <div
                  key={ca.class.id}
                  className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-4 text-xs"
                >
                  <div className="min-w-[140px]">
                    <p className="font-bold text-slate-900 dark:text-white">{ca.class.name}</p>
                    <p className="text-[10px] text-slate-400">پایه {ca.class.gradeLevel}</p>
                  </div>

                  <div className="flex-1 max-w-sm">
                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          ca.rate >= 95 ? 'bg-emerald-500' : ca.rate >= 90 ? 'bg-blue-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${ca.rate}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-left shrink-0">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {ca.totalRecords > 0 ? `${toPersianDigits(ca.rate)}٪ حضور` : 'بدون ثبت'}
                    </span>
                    <span className="block text-[10px] text-rose-500">
                      {toPersianDigits(ca.abs)} مورد غیبت
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSchoolAnalytics;
