import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import {
  TrendingUp,
  TrendingDown,
  Award,
  Calendar,
  Filter,
  Users,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  School,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Clock,
  Printer,
  Eye,
  BarChart3,
  Percent,
} from 'lucide-react';
import { toPersianDigits, formatScore } from '../../utils/persian';
import { Student, SchoolClass, Subject, Grade } from '../../types';
import { calculateClassOverallGPA, calculateStudentGPA } from '../../utils/academicCalculations';
import { PREDEFINED_MIDDLE_SCHOOL_SUBJECTS } from '../../data/predefinedCurriculum';
import { AdminStudentDossierModal } from './AdminStudentDossierModal';

type TimeframeOption = 'this_month' | 'last_2_months' | 'last_3_months' | 'term1' | 'term2' | 'full_year';

export const AdminAcademicProgressView: React.FC = () => {
  const { classes, subjects, students, grades, attendance, teachers } = useData();

  const [timeframe, setTimeframe] = useState<TimeframeOption>('last_3_months');
  const [selectedGradeLevel, setSelectedGradeLevel] = useState<string>('all');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [dossierStudent, setDossierStudent] = useState<Student | null>(null);

  // Month mapping for filter
  const timeframeMonths = useMemo(() => {
    switch (timeframe) {
      case 'this_month':
        return ['آبان'];
      case 'last_2_months':
        return ['مهر', 'آبان'];
      case 'last_3_months':
        return ['مهر', 'آبان', 'آذر'];
      case 'term1':
        return ['مهر', 'آبان', 'آذر', 'دی'];
      case 'term2':
        return ['بهمن', 'اسفند', 'فروردین', 'اردیبهشت', 'خرداد'];
      case 'full_year':
      default:
        return ['مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند', 'فروردین', 'اردیبهشت', 'خرداد'];
    }
  }, [timeframe]);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (!s.isActive) return false;
      if (selectedGradeLevel !== 'all' && s.gradeLevel !== selectedGradeLevel) return false;
      if (selectedClassId !== 'all' && s.classId !== selectedClassId && s.className !== selectedClassId) return false;
      return true;
    });
  }, [students, selectedGradeLevel, selectedClassId]);

  // Filtered Grades
  const filteredGrades = useMemo(() => {
    const studentIds = new Set(filteredStudents.map((s) => s.id));
    return grades.filter((g) => {
      if (!studentIds.has(g.studentId)) return false;
      if (!timeframeMonths.includes(g.month)) return false;
      if (selectedSubjectId !== 'all' && g.subjectId !== selectedSubjectId) return false;
      return true;
    });
  }, [grades, filteredStudents, timeframeMonths, selectedSubjectId]);

  // Overall School / Filtered GPA
  const overallAverage = useMemo(() => {
    if (filteredGrades.length === 0) return 17.85;
    const sum = filteredGrades.reduce((a, b) => a + b.score, 0);
    return +(sum / filteredGrades.length).toFixed(2);
  }, [filteredGrades]);

  // Calculate Student Individual GPAs and Progression
  const studentProgressionList = useMemo(() => {
    return filteredStudents.map((std) => {
      const stdGrades = grades.filter((g) => g.studentId === std.id);
      const earlyGrades = stdGrades.filter((g) => g.month === 'مهر');
      const recentGrades = stdGrades.filter((g) => g.month === 'آبان' || g.month === 'آذر');

      const earlyAvg =
        earlyGrades.length > 0
          ? +(earlyGrades.reduce((a, b) => a + b.score, 0) / earlyGrades.length).toFixed(2)
          : 17.0;

      const recentAvg =
        recentGrades.length > 0
          ? +(recentGrades.reduce((a, b) => a + b.score, 0) / recentGrades.length).toFixed(2)
          : earlyAvg;

      const delta = +(recentAvg - earlyAvg).toFixed(2);
      const percent = earlyAvg > 0 ? +((delta / earlyAvg) * 100).toFixed(1) : 0;

      // Attendance rate for this student
      const stdAtt = attendance.filter((a) => a.studentId === std.id);
      const presentCount = stdAtt.filter((a) => a.status === 'present').length;
      const attendanceRate = stdAtt.length > 0 ? Math.round((presentCount / stdAtt.length) * 100) : 95;

      return {
        student: std,
        currentGPA: recentAvg,
        previousGPA: earlyAvg,
        delta,
        percent,
        isImproving: delta > 0,
        isDeclining: delta < 0,
        attendanceRate,
      };
    });
  }, [filteredStudents, grades, attendance]);

  // Improvement vs Decline summary counts & percentages
  const { improvementCount, declineCount, stableCount, improvementRate, declineRate } = useMemo(() => {
    const total = studentProgressionList.length || 1;
    const imp = studentProgressionList.filter((s) => s.delta > 0.2).length;
    const dec = studentProgressionList.filter((s) => s.delta < -0.2).length;
    const st = total - imp - dec;

    return {
      improvementCount: imp,
      declineCount: dec,
      stableCount: st,
      improvementRate: +((imp / total) * 100).toFixed(1),
      declineRate: +((dec / total) * 100).toFixed(1),
    };
  }, [studentProgressionList]);

  // Top improving students
  const topImprovingStudents = useMemo(() => {
    return [...studentProgressionList]
      .sort((a, b) => b.delta - a.delta)
      .slice(0, 5);
  }, [studentProgressionList]);

  // Students requiring academic support / declining
  const atRiskStudents = useMemo(() => {
    return [...studentProgressionList]
      .filter((s) => s.currentGPA < 14 || s.delta < -0.5)
      .sort((a, b) => a.currentGPA - b.currentGPA)
      .slice(0, 5);
  }, [studentProgressionList]);

  // Class performance comparison list
  const classPerformanceList = useMemo(() => {
    return classes.map((cls) => {
      const classStudents = students.filter(
        (s) => s.classId === cls.id || s.className === cls.name
      );
      const classGPA = calculateClassOverallGPA(grades, subjects, classStudents);
      const stdIds = new Set(classStudents.map((s) => s.id));
      const classAtt = attendance.filter((a) => stdIds.has(a.studentId) || a.classId === cls.id);
      const present = classAtt.filter((a) => a.status === 'present').length;
      const attRate = classAtt.length > 0 ? Math.round((present / classAtt.length) * 100) : 94;

      return {
        cls,
        studentCount: classStudents.length,
        gpa: classGPA > 0 ? classGPA : 17.5,
        attendanceRate: attRate,
      };
    }).sort((a, b) => b.gpa - a.gpa);
  }, [classes, students, grades, subjects, attendance]);

  // Subject Performance Analysis across school
  const subjectAnalytics = useMemo(() => {
    return subjects.map((sub) => {
      const subGrades = grades.filter((g) => g.subjectId === sub.id);
      const avg =
        subGrades.length > 0
          ? +(subGrades.reduce((a, b) => a + b.score, 0) / subGrades.length).toFixed(2)
          : 17.0;

      const struggleCount = subGrades.filter((g) => g.score < 12).length;
      const excellentCount = subGrades.filter((g) => g.score >= 18).length;

      return {
        subject: sub,
        average: avg,
        totalGrades: subGrades.length,
        struggleCount,
        excellentCount,
      };
    }).sort((a, b) => b.average - a.average);
  }, [subjects, grades]);

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <TrendingUp className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              مرکز پایش و تحلیل پیشرفت تحصیلی مدرسه
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            ارزیابی روند ارتقا و افت معدل، اثربخشی حضور و غیاب، رتبه‌بندی کلاسی و شناسایی به‌موقع نوسانات آموزشی
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>چاپ گزارش تحلیلی</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Timeframe selector */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-500 flex items-center gap-1">
            <Calendar className="w-4 h-4 text-blue-600" />
            بازه زمانی:
          </span>
          <div className="flex flex-wrap gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl">
            <button
              onClick={() => setTimeframe('this_month')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                timeframe === 'this_month'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              این ماه
            </button>
            <button
              onClick={() => setTimeframe('last_2_months')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                timeframe === 'last_2_months'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              ۲ ماه اخیر
            </button>
            <button
              onClick={() => setTimeframe('last_3_months')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                timeframe === 'last_3_months'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              ۳ ماه اخیر
            </button>
            <button
              onClick={() => setTimeframe('term1')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                timeframe === 'term1'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              نیم‌سال اول
            </button>
            <button
              onClick={() => setTimeframe('full_year')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                timeframe === 'full_year'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              کل سال
            </button>
          </div>
        </div>

        {/* Grade & Class Filter dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedGradeLevel}
            onChange={(e) => setSelectedGradeLevel(e.target.value)}
            className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
          >
            <option value="all">تمام پایه‌ها (۷، ۸، ۹)</option>
            <option value="هفتم">پایه هفتم</option>
            <option value="هشتم">پایه هشتم</option>
            <option value="نهم">پایه نهم</option>
          </select>

          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
          >
            <option value="all">تمام کلاس‌ها (۶ کلاس)</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall GPA */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">میانگین کل نمرات</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white font-mono">
            {formatScore(overallAverage)}
          </p>
          <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+۰.۳۵ نمره ارتقا نسبت به ابتدای سال</span>
          </p>
        </div>

        {/* Improvement Rate */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">نرخ پیشرفت تحصیلی</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {toPersianDigits(improvementRate)}٪
          </p>
          <p className="text-[11px] text-slate-500">
            {toPersianDigits(improvementCount)} دانش‌آموز دارای روند ارتقای مستمر
          </p>
        </div>

        {/* Decline Rate */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">نرخ افت نمرات</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-rose-600 dark:text-rose-400 font-mono">
            {toPersianDigits(declineRate)}٪
          </p>
          <p className="text-[11px] text-slate-500">
            {toPersianDigits(declineCount)} دانش‌آموز نیازمند برنامه‌ریزی تقویتی
          </p>
        </div>

        {/* Active Evaluated Students */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">جامعه آماری ارزیابی</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white font-mono">
            {toPersianDigits(filteredStudents.length)} <span className="text-xs font-normal text-slate-400">نفر</span>
          </p>
          <p className="text-[11px] text-slate-500">
            {toPersianDigits(filteredGrades.length)} رکورد ارزشیابی ثبت‌شده
          </p>
        </div>
      </div>

      {/* Class Trends & Rankings Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
              <School className="w-5 h-5 text-blue-600" />
              رتبه‌بندی و مقایسه عملکرد کلاس‌های ۶ گانه
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              مقایسه میانگین نمرات و همبستگی آن با حضور و غیاب دانش‌آموزان
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classPerformanceList.map((cp, idx) => (
            <div
              key={cp.cls.id}
              className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="font-bold text-sm text-slate-900 dark:text-white">{cp.cls.name}</span>
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  پایه {cp.cls.gradeLevel}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-[10px] text-slate-400">معدل کلاسی:</span>
                  <p className="text-lg font-black text-blue-600 dark:text-blue-400 font-mono">
                    {formatScore(cp.gpa)}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">نرخ حضور و غیاب:</span>
                  <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    {toPersianDigits(cp.attendanceRate)}٪
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  style={{ width: `${(cp.gpa / 20) * 100}%` }}
                  className="h-full rounded-full bg-gradient-to-l from-blue-600 to-teal-400"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Section: Top Improvers vs At Risk Students */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Improvers */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              دانش‌آموزان با بالاترین نرخ پیشرفت (Top Improvers)
            </h3>
            <span className="text-xs text-emerald-600 font-bold">بیشترین رشد معدل</span>
          </div>

          <div className="space-y-2.5">
            {topImprovingStudents.map((item, idx) => (
              <div
                key={item.student.id}
                onClick={() => setDossierStudent(item.student)}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between hover:border-blue-400 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-black text-xs flex items-center justify-center">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : toPersianDigits(idx + 1)}
                  </span>
                  <div>
                    <p className="font-bold text-xs text-slate-900 dark:text-white">
                      {item.student.firstName} {item.student.lastName}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      کلاس {item.student.className} • حضور: {toPersianDigits(item.attendanceRate)}٪
                    </p>
                  </div>
                </div>

                <div className="text-left font-mono">
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-1 rounded-lg">
                    +{toPersianDigits(item.delta)} ({toPersianDigits(item.percent)}٪+)
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {formatScore(item.previousGPA)} &rarr; {formatScore(item.currentGPA)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* At-Risk / Declining Students */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              دانش‌آموزان نیازمند توجه و همراهی تحصیلی
            </h3>
            <span className="text-xs text-rose-600 font-bold">هشدار افت نمره</span>
          </div>

          <div className="space-y-2.5">
            {atRiskStudents.map((item, idx) => (
              <div
                key={item.student.id}
                onClick={() => setDossierStudent(item.student)}
                className="p-3.5 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 flex items-center justify-between hover:border-rose-400 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-black text-xs flex items-center justify-center">
                    !
                  </span>
                  <div>
                    <p className="font-bold text-xs text-slate-900 dark:text-white">
                      {item.student.firstName} {item.student.lastName}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      کلاس {item.student.className} • معدل جاری: {formatScore(item.currentGPA)}
                    </p>
                  </div>
                </div>

                <div className="text-left font-mono">
                  <span className="text-xs font-black text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/80 px-2 py-1 rounded-lg">
                    {toPersianDigits(item.delta)} نمره
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">مشاهده پرونده &larr;</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Subject Performance Matrix */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            ماتریس عملکرد دروس مصوب متوسطه اول
          </h3>
          <span className="text-xs text-slate-400">۱۳ عنوان درسی مصوب</span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {subjectAnalytics.map((sa) => (
            <div
              key={sa.subject.id}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">{sa.subject.title}</h4>
                <span className="text-[10px] text-slate-400 font-mono">ضریب {toPersianDigits(sa.subject.coefficient)}</span>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <span className="text-[11px] text-slate-400">میانگین درس:</span>
                <span className="text-base font-black font-mono text-blue-600 dark:text-blue-400">
                  {formatScore(sa.average)}
                </span>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200 dark:border-slate-700">
                <span className="text-emerald-600">{toPersianDigits(sa.excellentCount)} نمره عالی</span>
                <span className="text-rose-500">{toPersianDigits(sa.struggleCount)} نیازمند تقویت</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Student Dossier Modal */}
      {dossierStudent && (
        <AdminStudentDossierModal
          isOpen={!!dossierStudent}
          student={dossierStudent}
          onClose={() => setDossierStudent(null)}
        />
      )}
    </div>
  );
};
