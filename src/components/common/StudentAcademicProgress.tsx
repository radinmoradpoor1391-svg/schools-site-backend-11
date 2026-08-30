import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Award,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  BookOpen,
  BarChart3,
  Target,
  Layers,
  Compass,
  Zap,
  Activity,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';
import { Student, Grade, Subject } from '../../types';
import { toPersianDigits, formatScore } from '../../utils/persian';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';

interface StudentAcademicProgressProps {
  student: Student;
  grades: Grade[];
  subjects: Subject[];
  compact?: boolean;
}

type TimeframeFilter = 'current_month' | 'last_2_months' | 'last_3_months' | 'term1' | 'full_year';
type ChartViewMode = 'gpa_trend' | 'subject_bars' | 'skills_radar' | 'assessment_types';

export const StudentAcademicProgress: React.FC<StudentAcademicProgressProps> = ({
  student,
  grades,
  subjects,
  compact = false,
}) => {
  const { grades: allGrades, students: allStudents } = useData();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [timeframe, setTimeframe] = useState<TimeframeFilter>('last_3_months');
  const [chartMode, setChartViewMode] = useState<ChartViewMode>('gpa_trend');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');

  // Iranian academic months order
  const academicMonths = useMemo(
    () => ['مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند', 'فروردین', 'اردیبهشت', 'خرداد'],
    []
  );

  // Filter grades for this specific student
  const studentGrades = useMemo(() => {
    return grades.filter((g) => g.studentId === student.id);
  }, [grades, student.id]);

  // Classmates grades for computing class average benchmarks
  const classGrades = useMemo(() => {
    return allGrades.filter(
      (g) => g.classId === student.classId || g.classId === student.className
    );
  }, [allGrades, student.classId, student.className]);

  // Determine active months according to timeframe selection
  const activeMonthsList = useMemo(() => {
    switch (timeframe) {
      case 'current_month':
        return ['آبان'];
      case 'last_2_months':
        return ['مهر', 'آبان'];
      case 'last_3_months':
        return ['مهر', 'آبان', 'آذر'];
      case 'term1':
        return ['مهر', 'آبان', 'آذر', 'دی'];
      case 'full_year':
      default:
        return academicMonths;
    }
  }, [timeframe, academicMonths]);

  // 1. Monthly GPA Trend & Progression Data for Recharts
  const monthlyChartData = useMemo(() => {
    return activeMonthsList.map((m) => {
      // Student grades in this month (or filtered by selected subject)
      let sGrades = studentGrades.filter((g) => g.month === m);
      if (selectedSubjectFilter !== 'all') {
        sGrades = sGrades.filter((g) => g.subjectId === selectedSubjectFilter);
      }

      const studentAvg =
        sGrades.length > 0
          ? +(sGrades.reduce((sum, g) => sum + g.score, 0) / sGrades.length).toFixed(2)
          : null;

      // Class grades in this month
      let cGrades = classGrades.filter((g) => g.month === m);
      if (selectedSubjectFilter !== 'all') {
        cGrades = cGrades.filter((g) => g.subjectId === selectedSubjectFilter);
      }

      const classAvg =
        cGrades.length > 0
          ? +(cGrades.reduce((sum, g) => sum + g.score, 0) / cGrades.length).toFixed(2)
          : null;

      return {
        month: m,
        gpa: studentAvg,
        classGpa: classAvg,
        gradesCount: sGrades.length,
      };
    });
  }, [activeMonthsList, studentGrades, classGrades, selectedSubjectFilter]);

  // Calculate Overall Improvement / Decline Delta
  const validMonthlyData = useMemo(
    () => monthlyChartData.filter((d) => d.gpa !== null),
    [monthlyChartData]
  );

  const { currentGPA, previousGPA, delta, percentChange, isImprovement } = useMemo(() => {
    if (validMonthlyData.length === 0) {
      // Baseline defaults
      const stdAvg =
        studentGrades.length > 0
          ? +(studentGrades.reduce((a, b) => a + b.score, 0) / studentGrades.length).toFixed(2)
          : 18.5;
      return { currentGPA: stdAvg, previousGPA: stdAvg, delta: 0, percentChange: 0, isImprovement: true };
    }
    const current = validMonthlyData[validMonthlyData.length - 1]?.gpa || 0;
    const prev = validMonthlyData.length > 1 ? validMonthlyData[0]?.gpa || current : current;
    const diff = +(current - prev).toFixed(2);
    const pct = prev > 0 ? +((diff / prev) * 100).toFixed(1) : 0;
    return {
      currentGPA: current,
      previousGPA: prev,
      delta: diff,
      percentChange: pct,
      isImprovement: diff >= 0,
    };
  }, [validMonthlyData, studentGrades]);

  // 2. Subject-level performance comparison (Student vs Class Average)
  const subjectComparisonData = useMemo(() => {
    return subjects
      .map((sub) => {
        const subGrades = studentGrades.filter((g) => g.subjectId === sub.id);
        const subClassGrades = classGrades.filter((g) => g.subjectId === sub.id);

        if (subGrades.length === 0) return null;

        const scores = subGrades.map((g) => g.score);
        const studentAvg = +(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2);
        const classAvg =
          subClassGrades.length > 0
            ? +(subClassGrades.reduce((a, b) => a + b.score, 0) / subClassGrades.length).toFixed(2)
            : 16.5;

        const latest = scores[scores.length - 1];
        const oldest = scores[0];
        const subDelta = +(latest - oldest).toFixed(2);

        return {
          subjectId: sub.id,
          title: sub.title,
          shortTitle: sub.title.length > 12 ? `${sub.title.slice(0, 10)}...` : sub.title,
          studentScore: studentAvg,
          classScore: classAvg,
          delta: subDelta,
          scoresCount: scores.length,
          coefficient: sub.coefficient,
          isRising: subDelta >= 0,
        };
      })
      .filter(Boolean) as {
      subjectId: string;
      title: string;
      shortTitle: string;
      studentScore: number;
      classScore: number;
      delta: number;
      scoresCount: number;
      coefficient: number;
      isRising: boolean;
    }[];
  }, [subjects, studentGrades, classGrades]);

  // 3. Domain Radar Analysis (حوزه‌های یادگیری و مهارت‌ها)
  const radarCompetencyData = useMemo(() => {
    const categories = [
      {
        name: 'ریاضیات و منطق',
        keywords: ['ریاضی', 'هندسه', 'حساب'],
      },
      {
        name: 'ادبیات و زبان فارسی',
        keywords: ['فارسی', 'نگارش', 'املا', 'ادبیات'],
      },
      {
        name: 'علوم تجربی و پژوهش',
        keywords: ['علوم', 'زیست', 'شیمی', 'فیزیک', 'آزمایشگاه'],
      },
      {
        name: 'زبان‌های بین‌المللی',
        keywords: ['انگلیسی', 'عربی', 'زبان'],
      },
      {
        name: 'علوم اجتماعی و تمدن',
        keywords: ['مطالعات', 'تاریخ', 'جغرافیا', 'اجتماعی'],
      },
      {
        name: 'معارف، هنر و مهارت',
        keywords: ['قرآن', 'پیام', 'دینی', 'فرهنگ', 'هنر', 'کار و فناوری', 'تربیت بدنی'],
      },
    ];

    return categories.map((cat) => {
      // Find matching subjects
      const matchedSubjects = subjects.filter((s) =>
        cat.keywords.some((kw) => s.title.includes(kw))
      );
      const subIds = new Set(matchedSubjects.map((s) => s.id));

      const sGrades = studentGrades.filter((g) => subIds.has(g.subjectId));
      const cGrades = classGrades.filter((g) => subIds.has(g.subjectId));

      const sAvg =
        sGrades.length > 0
          ? +(sGrades.reduce((a, b) => a + b.score, 0) / sGrades.length).toFixed(2)
          : 17.5;

      const cAvg =
        cGrades.length > 0
          ? +(cGrades.reduce((a, b) => a + b.score, 0) / cGrades.length).toFixed(2)
          : 16.0;

      return {
        dimension: cat.name,
        studentScore: sAvg,
        classScore: cAvg,
        fullMark: 20,
      };
    });
  }, [subjects, studentGrades, classGrades]);

  // 4. Assessment Types Breakdown
  const gradeTypeBreakdown = useMemo(() => {
    const typeLabels: Record<string, string> = {
      daily: 'مستمر و کلاسی',
      quiz: 'پرسش و آزمونک',
      homework: 'تکالیف و تمرین',
      activity: 'فعالیت کلاسی و پژوهش',
      midterm: 'آزمون میان‌ترم',
      final: 'آزمون پایانی',
      other: 'سایر ارزیابی‌ها',
    };

    const typeGroups: Record<string, number[]> = {};

    studentGrades.forEach((g) => {
      const type = g.gradeType || 'daily';
      if (!typeGroups[type]) typeGroups[type] = [];
      typeGroups[type].push(g.score);
    });

    return Object.entries(typeGroups).map(([typeKey, scores]) => {
      const avg = +(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2);
      return {
        typeName: typeLabels[typeKey] || typeKey,
        average: avg,
        count: scores.length,
      };
    });
  }, [studentGrades]);

  // Key Diagnostic Insights
  const fastestImprovingSubject = useMemo(() => {
    if (subjectComparisonData.length === 0) return null;
    return [...subjectComparisonData].sort((a, b) => b.delta - a.delta)[0];
  }, [subjectComparisonData]);

  const topPerformingSubject = useMemo(() => {
    if (subjectComparisonData.length === 0) return null;
    return [...subjectComparisonData].sort((a, b) => b.studentScore - a.studentScore)[0];
  }, [subjectComparisonData]);

  const focusAreaSubject = useMemo(() => {
    if (subjectComparisonData.length === 0) return null;
    return [...subjectComparisonData].sort((a, b) => a.studentScore - b.studentScore)[0];
  }, [subjectComparisonData]);

  // Custom Recharts Persian Tooltip
  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 text-right text-xs space-y-2 min-w-[170px]" dir="rtl">
        <p className="font-black text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1.5 flex items-center justify-between">
          <span>{label}</span>
          <span className="text-[10px] text-slate-400 font-normal">ارزیابی آموزشی</span>
        </p>

        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => {
            const isStudent =
              entry.dataKey === 'gpa' ||
              entry.dataKey === 'studentScore' ||
              entry.dataKey === 'average';

            return (
              <div key={index} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span>{entry.name}:</span>
                </span>
                <span className="font-black font-mono text-slate-900 dark:text-white">
                  {entry.value !== null && entry.value !== undefined
                    ? formatScore(entry.value)
                    : '-'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5 text-right" dir="rtl">
      {/* Top Filter & Metric Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            تحلیل هوشمند و بصری پیشرفت تحصیلی دانش‌آموز
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            روند رشد معدل بر پایه نمودارهای تعاملی Recharts، مقایسه با میانگین کلاس و تحلیل ابعاد یادگیری
          </p>
        </div>

        {/* Timeframe Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setTimeframe('current_month')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              timeframe === 'current_month'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            این ماه
          </button>
          <button
            onClick={() => setTimeframe('last_2_months')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              timeframe === 'last_2_months'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            ۲ ماه اخیر
          </button>
          <button
            onClick={() => setTimeframe('last_3_months')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              timeframe === 'last_3_months'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            ۳ ماه اخیر
          </button>
          <button
            onClick={() => setTimeframe('term1')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              timeframe === 'term1'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            نیم‌سال اول
          </button>
          <button
            onClick={() => setTimeframe('full_year')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              timeframe === 'full_year'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            کل سال
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1 hover:border-blue-300 transition-colors">
          <span className="text-[11px] font-bold text-slate-400">معدل دوره انتخابی</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {formatScore(currentGPA)}
          </p>
          <p className="text-[11px] text-slate-500">از سقف نمره ۲۰</p>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1 hover:border-emerald-300 transition-colors">
          <span className="text-[11px] font-bold text-slate-400">نرخ رشد و تغییر</span>
          <div className="flex items-center gap-1.5">
            {isImprovement ? (
              <ArrowUpRight className="w-5 h-5 text-emerald-500 shrink-0" />
            ) : (
              <ArrowDownRight className="w-5 h-5 text-rose-500 shrink-0" />
            )}
            <p
              className={`text-2xl font-black font-mono ${
                isImprovement
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {delta > 0 ? `+${toPersianDigits(delta)}` : toPersianDigits(delta)}
            </p>
          </div>
          <p className="text-[11px] text-slate-500 font-mono">
            {percentChange > 0
              ? `+${toPersianDigits(percentChange)}٪`
              : `${toPersianDigits(percentChange)}٪`}{' '}
            نسبت به شروع دوره
          </p>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1 hover:border-blue-300 transition-colors">
          <span className="text-[11px] font-bold text-slate-400">وضعیت تحصیلی</span>
          <p className="text-xl font-black text-blue-600 dark:text-blue-400">
            {currentGPA >= 19
              ? 'دانش‌آموز ممتاز'
              : currentGPA >= 17
              ? 'دانش‌آموز کوشا'
              : currentGPA >= 14
              ? 'وضعیت مطلوب'
              : 'نیازمند همراهی'}
          </p>
          <p className="text-[11px] text-slate-500">
            {currentGPA >= 18 ? 'بالاتر از میانگین مدرسه' : 'همگام با برنامه آموزشی'}
          </p>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1 hover:border-purple-300 transition-colors">
          <span className="text-[11px] font-bold text-slate-400">تعداد ارزیابی‌ها</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {toPersianDigits(studentGrades.length)}
          </p>
          <p className="text-[11px] text-slate-500">ارزشیابی ثبت‌شده در کارنامه</p>
        </div>
      </div>

      {/* Main Interactive Recharts Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        {/* Navigation Tabs for Chart View Modes */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-black text-sm text-slate-900 dark:text-white">
                تصویرسازی تعاملی عملکرد تحصیلی با Recharts
              </h4>
              <p className="text-[11px] text-slate-400">
                پیمایش در روند معدل زمانی، دروس و ابعاد شایستگی‌های تحصیلی
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-800/90 p-1 rounded-2xl">
            <button
              onClick={() => setChartViewMode('gpa_trend')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                chartMode === 'gpa_trend'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>روند زمانی معدل</span>
            </button>

            <button
              onClick={() => setChartViewMode('subject_bars')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                chartMode === 'subject_bars'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>مقایسه دروس</span>
            </button>

            <button
              onClick={() => setChartViewMode('skills_radar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                chartMode === 'skills_radar'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>رادار مهارت‌ها</span>
            </button>

            <button
              onClick={() => setChartViewMode('assessment_types')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                chartMode === 'assessment_types'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>انواع ارزشیابی</span>
            </button>
          </div>
        </div>

        {/* Dynamic Controls Bar per Chart Mode */}
        {chartMode === 'gpa_trend' && (
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-500">فیلتر درس خاص:</span>
              <select
                value={selectedSubjectFilter}
                onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                className="p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-xs cursor-pointer focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">معدل کل کلیه دروس</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-4 text-[11px] font-bold">
              <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                <span className="w-3 h-1 bg-blue-600 rounded-full inline-block" />
                <span>نمره دانش‌آموز</span>
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-3 h-0.5 border-t border-dashed border-slate-400 inline-block" />
                <span>میانگین کلاس</span>
              </span>
              <span className="flex items-center gap-1.5 text-emerald-500">
                <span className="w-3 h-0.5 border-t border-emerald-500 inline-block" />
                <span>سطح ممتاز (۱۸)</span>
              </span>
            </div>
          </div>
        )}

        {/* 1. Mode: GPA Trend Chart (Area / Line Recharts) */}
        {chartMode === 'gpa_trend' && (
          <div className="w-full h-72 sm:h-80 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={monthlyChartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="studentGpaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="classGpaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={isDark ? '#334155' : '#f1f5f9'}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: isDark ? '#334155' : '#e2e8f0' }}
                />
                <YAxis
                  domain={[10, 20]}
                  ticks={[10, 12, 14, 16, 18, 20]}
                  tickFormatter={(val) => toPersianDigits(val)}
                  tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11, fontFamily: 'monospace' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <ReferenceLine
                  y={18}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  label={{
                    value: 'سطح ممتاز',
                    fill: '#10b981',
                    fontSize: 10,
                    position: 'insideTopRight',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="classGpa"
                  name="میانگین کلاس"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#classGpaGradient)"
                  connectNulls
                />
                <Area
                  type="monotone"
                  dataKey="gpa"
                  name="نمره دانش‌آموز"
                  stroke="#2563eb"
                  strokeWidth={3.5}
                  fillOpacity={1}
                  fill="url(#studentGpaGradient)"
                  dot={{ r: 5, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 7, fill: '#3b82f6', stroke: '#fff', strokeWidth: 3 }}
                  connectNulls
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 2. Mode: Subject Comparison Bar Chart (Student vs Class) */}
        {chartMode === 'subject_bars' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>مقایسه نمرات دانش‌آموز در دروس با میانگین کلاس</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold">
                  <span className="w-3 h-3 bg-blue-600 rounded-sm inline-block" />
                  <span>نمره دانش‌آموز</span>
                </span>
                <span className="flex items-center gap-1 text-slate-400 font-bold">
                  <span className="w-3 h-3 bg-slate-300 dark:bg-slate-700 rounded-sm inline-block" />
                  <span>میانگین کلاس</span>
                </span>
              </div>
            </div>

            <div className="w-full h-80 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={subjectComparisonData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke={isDark ? '#334155' : '#f1f5f9'}
                  />
                  <XAxis
                    dataKey="shortTitle"
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: isDark ? '#334155' : '#e2e8f0' }}
                  />
                  <YAxis
                    domain={[10, 20]}
                    ticks={[10, 12, 14, 16, 18, 20]}
                    tickFormatter={(val) => toPersianDigits(val)}
                    tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11, fontFamily: 'monospace' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <ReferenceLine y={18} stroke="#10b981" strokeDasharray="3 3" />
                  <Bar
                    dataKey="classScore"
                    name="میانگین کلاس"
                    fill={isDark ? '#334155' : '#cbd5e1'}
                    radius={[6, 6, 0, 0]}
                    barSize={14}
                  />
                  <Bar
                    dataKey="studentScore"
                    name="نمره دانش‌آموز"
                    fill="#2563eb"
                    radius={[6, 6, 0, 0]}
                    barSize={14}
                  >
                    {subjectComparisonData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.studentScore >= 18
                            ? '#10b981'
                            : entry.studentScore >= 15
                            ? '#3b82f6'
                            : entry.studentScore >= 12
                            ? '#f59e0b'
                            : '#ef4444'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* 3. Mode: Radar Competency Chart (حوزه‌های شش‌گانه یادگیری) */}
        {chartMode === 'skills_radar' && (
          <div className="grid md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-8 w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart
                  cx="50%"
                  cy="50%"
                  outerRadius="75%"
                  data={radarCompetencyData}
                >
                  <PolarGrid stroke={isDark ? '#334155' : '#e2e8f0'} />
                  <PolarAngleAxis
                    dataKey="dimension"
                    tick={{ fill: isDark ? '#cbd5e1' : '#475569', fontSize: 11, fontWeight: 'bold' }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 20]}
                    tick={{ fill: isDark ? '#94a3b8' : '#94a3b8', fontSize: 10 }}
                    tickFormatter={(v) => toPersianDigits(v)}
                  />
                  <Radar
                    name="میانگین کلاس"
                    dataKey="classScore"
                    stroke="#94a3b8"
                    fill="#94a3b8"
                    fillOpacity={0.2}
                  />
                  <Radar
                    name="نمره دانش‌آموز"
                    dataKey="studentScore"
                    stroke="#2563eb"
                    fill="#3b82f6"
                    fillOpacity={0.45}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Legend
                    formatter={(val) => <span className="text-xs font-bold">{val}</span>}
                    wrapperStyle={{ paddingTop: 10 }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Radar Insights Summary */}
            <div className="md:col-span-4 space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 text-xs">
              <h5 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>تحلیل تعادل شایستگی‌ها</span>
              </h5>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                این نمودار تعادل رشد تحصیلی دانش‌آموز را در ۶ حوزه مهارتی نسبت به میانگین هم‌کلاسی‌ها نشان می‌دهد.
              </p>
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                {radarCompetencyData.map((dim, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-600 dark:text-slate-300">{dim.dimension}:</span>
                    <span className="font-bold font-mono text-blue-600 dark:text-blue-400">
                      {formatScore(dim.studentScore)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 4. Mode: Assessment Types Breakdown (BarChart) */}
        {chartMode === 'assessment_types' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>توزیع عملکرد نمرات در انواع مختلف ارزیابی آموزشی</span>
              <span className="text-[11px] text-slate-400">میانگین هر قالب ارزیابی</span>
            </div>

            <div className="w-full h-72 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={gradeTypeBreakdown}
                  margin={{ top: 10, right: 10, left: -20, bottom: 10 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke={isDark ? '#334155' : '#f1f5f9'}
                  />
                  <XAxis
                    dataKey="typeName"
                    tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: isDark ? '#334155' : '#e2e8f0' }}
                  />
                  <YAxis
                    domain={[10, 20]}
                    ticks={[10, 12, 14, 16, 18, 20]}
                    tickFormatter={(val) => toPersianDigits(val)}
                    tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11, fontFamily: 'monospace' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Bar
                    dataKey="average"
                    name="میانگین نمره"
                    fill="#3b82f6"
                    radius={[8, 8, 0, 0]}
                    barSize={32}
                  >
                    {gradeTypeBreakdown.map((entry, index) => (
                      <Cell
                        key={`cell-type-${index}`}
                        fill={
                          entry.average >= 18
                            ? '#10b981'
                            : entry.average >= 15
                            ? '#2563eb'
                            : '#f59e0b'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* 3 Diagnostic Callout Cards: Top Strength, Fastest Improver, Focus Area */}
      <div className="grid sm:grid-cols-3 gap-3.5">
        {fastestImprovingSubject && (
          <div className="p-4 rounded-3xl bg-gradient-to-l from-emerald-50 to-teal-50 dark:from-slate-900 dark:to-slate-800/90 border border-emerald-200 dark:border-emerald-900/40 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-emerald-500" />
                <span>بیشترین نرخ ارتقا</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-black">
                +{toPersianDigits(fastestImprovingSubject.delta)} نمره
              </span>
            </div>
            <p className="font-black text-sm text-slate-900 dark:text-white">
              {fastestImprovingSubject.title}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              میانگین جاری: <strong className="font-mono text-emerald-600 font-bold">{formatScore(fastestImprovingSubject.studentScore)}</strong>
            </p>
          </div>
        )}

        {topPerformingSubject && (
          <div className="p-4 rounded-3xl bg-gradient-to-l from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800/90 border border-blue-200 dark:border-blue-900/40 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-blue-500" />
                <span>نقطه قوت اصلی</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono text-[10px] font-black">
                {formatScore(topPerformingSubject.studentScore)} از ۲۰
              </span>
            </div>
            <p className="font-black text-sm text-slate-900 dark:text-white">
              {topPerformingSubject.title}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              اختلاف با کلاس: <strong className="font-mono text-blue-600 font-bold">+{toPersianDigits(+(topPerformingSubject.studentScore - topPerformingSubject.classScore).toFixed(2))}</strong>
            </p>
          </div>
        )}

        {focusAreaSubject && (
          <div className="p-4 rounded-3xl bg-gradient-to-l from-amber-50 to-orange-50 dark:from-slate-900 dark:to-slate-800/90 border border-amber-200 dark:border-amber-900/40 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-amber-500" />
                <span>فرصت بهبود و تمرکز</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-mono text-[10px] font-black">
                {formatScore(focusAreaSubject.studentScore)}
              </span>
            </div>
            <p className="font-black text-sm text-slate-900 dark:text-white">
              {focusAreaSubject.title}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              نیازمند تمرین بیشتر برای رسیدن به سطح عالی
            </p>
          </div>
        )}
      </div>

      {/* Subject Detailed Progression Grid */}
      {!compact && subjectComparisonData.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              کارت‌های تحلیل جزئی دروس و روند تغییر نمرات
            </h4>
            <span className="text-[11px] text-slate-400">
              {toPersianDigits(subjectComparisonData.length)} درس ارزیابی‌شده
            </span>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {subjectComparisonData.map((st) => (
              <div
                key={st.subjectId}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2 hover:border-blue-400 dark:hover:border-blue-600 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                    {st.title}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-black font-mono flex items-center gap-0.5 ${
                      st.isRising
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {st.isRising ? '+' : ''}
                    {toPersianDigits(st.delta)}
                  </span>
                </div>

                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-[11px] text-slate-400">میانگین نمره:</span>
                  <span className="text-sm font-black font-mono text-slate-900 dark:text-white">
                    {formatScore(st.studentScore)}
                    <span className="text-[10px] text-slate-400 font-normal mr-1">
                      (کلاس: {formatScore(st.classScore)})
                    </span>
                  </span>
                </div>

                {/* Progress bar comparison */}
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    style={{ width: `${(st.studentScore / 20) * 100}%` }}
                    className={`h-full rounded-full transition-all duration-500 ${
                      st.studentScore >= 18
                        ? 'bg-emerald-500'
                        : st.studentScore >= 15
                        ? 'bg-blue-500'
                        : st.studentScore >= 12
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

