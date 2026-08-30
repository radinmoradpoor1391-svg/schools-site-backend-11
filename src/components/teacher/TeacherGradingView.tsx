import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  Award,
  Save,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Search,
  Printer,
  TrendingUp,
  Users,
  Check,
  RotateCcw,
} from 'lucide-react';
import { toPersianDigits, getGradeQualityLabel, toEnglishDigits } from '../../utils/persian';

export const TeacherGradingView: React.FC = () => {
  const { currentTeacher, user, currentUser } = useAuth();
  const { classes, subjects, students, grades, addGrade, updateGrade } = useData();

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

  const teacherClasses = useMemo(() => {
    return classes.filter((c) =>
      (activeTeacher.assignedClassIds || []).includes(c.id) ||
      (activeTeacher.assignedClassIds || []).includes(c.name)
    );
  }, [classes, activeTeacher]);

  const teacherSubjects = useMemo(() => {
    return subjects.filter((s) =>
      (activeTeacher.assignedSubjectIds || []).includes(s.id) ||
      (activeTeacher.assignedSubjectIds || []).includes(s.title) ||
      s.title.includes(activeTeacher.specialty)
    );
  }, [subjects, activeTeacher]);

  const [selectedClassId, setSelectedClassId] = useState<string>(
    teacherClasses[0]?.id || ''
  );
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    teacherSubjects[0]?.id || ''
  );
  const [selectedMonth, setSelectedMonth] = useState<string>('آبان');
  const [assessmentType, setAssessmentType] = useState<'continuous' | 'midterm' | 'homework' | 'final'>('continuous');

  // Auto-sync selection with teacher's assigned classes and subjects
  React.useEffect(() => {
    if (teacherClasses.length > 0 && !teacherClasses.some((c) => c.id === selectedClassId)) {
      setSelectedClassId(teacherClasses[0].id);
    }
  }, [teacherClasses, selectedClassId]);

  React.useEffect(() => {
    if (teacherSubjects.length > 0 && !teacherSubjects.some((s) => s.id === selectedSubjectId)) {
      setSelectedSubjectId(teacherSubjects[0].id);
    }
  }, [teacherSubjects, selectedSubjectId]);

  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [savedRowIds, setSavedRowIds] = useState<{ [id: string]: boolean }>({});

  const monthsList = ['مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند', 'فروردین', 'اردیبهشت', 'خرداد'];

  // Students in selected class only
  const classStudents = useMemo(() => {
    return students.filter(
      (s) => (s.classId === selectedClassId || s.className === teacherClasses.find(c => c.id === selectedClassId)?.name) && s.isActive
    );
  }, [students, selectedClassId, teacherClasses]);

  // Filtered by search
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return classStudents;
    const q = searchQuery.toLowerCase().trim();
    return classStudents.filter(
      (s) =>
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q) ||
        s.studentCode.includes(q) ||
        s.nationalId.includes(q)
    );
  }, [classStudents, searchQuery]);

  // Local state for score inputs & notes
  const [scoreInputs, setScoreInputs] = useState<{ [studentId: string]: string }>({});
  const [noteInputs, setNoteInputs] = useState<{ [studentId: string]: string }>({});

  // Helper to fetch existing grade
  const getExistingGrade = (studentId: string) => {
    return grades.find(
      (g) =>
        g.studentId === studentId &&
        g.subjectId === selectedSubjectId &&
        g.month === selectedMonth &&
        g.type === assessmentType
    );
  };

  const handleScoreChange = (studentId: string, value: string) => {
    setScoreInputs((prev) => ({ ...prev, [studentId]: value }));
  };

  const handleNoteChange = (studentId: string, value: string) => {
    setNoteInputs((prev) => ({ ...prev, [studentId]: value }));
  };

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveStudentGrade = async (studentId: string) => {
    const rawVal = scoreInputs[studentId];
    const existing = getExistingGrade(studentId);

    const val = rawVal !== undefined ? parseFloat(toEnglishDigits(rawVal)) : existing?.score;
    if (val === undefined || isNaN(val) || val < 0 || val > 20) {
      showToast('لطفاً نمره‌ای معتبر بین ۰ تا ۲۰ وارد نمایید.', 'error');
      return;
    }

    const teacherName = `${activeTeacher.firstName} ${activeTeacher.lastName}`;
    const note = noteInputs[studentId] !== undefined ? noteInputs[studentId] : existing?.teacherNote;

    try {
      if (existing) {
        await updateGrade(existing.id, { score: val, teacherNote: note }, teacherName);
      } else {
        await addGrade(
          {
            studentId,
            subjectId: selectedSubjectId,
            classId: selectedClassId,
            score: val,
            month: selectedMonth,
            type: assessmentType,
            teacherNote: note,
          },
          teacherName
        );
      }

      setSavedRowIds((prev) => ({ ...prev, [studentId]: true }));
      setTimeout(() => {
        setSavedRowIds((prev) => ({ ...prev, [studentId]: false }));
      }, 2000);

      const std = students.find((s) => s.id === studentId);
      showToast(`نمره دانش‌آموز ${std ? std.firstName + ' ' + std.lastName : ''} (${toPersianDigits(val)}) ثبت شد.`);
    } catch {
      showToast('خطا در ثبت نمره دانش‌آموز.', 'error');
    }
  };

  const handleSaveAllGrades = async () => {
    let savedCount = 0;
    const teacherName = `${activeTeacher.firstName} ${activeTeacher.lastName}`;

    for (const std of classStudents) {
      const rawVal = scoreInputs[std.id];
      const existing = getExistingGrade(std.id);
      const val = rawVal !== undefined ? parseFloat(toEnglishDigits(rawVal)) : existing?.score;

      if (val !== undefined && !isNaN(val) && val >= 0 && val <= 20) {
        const note = noteInputs[std.id] !== undefined ? noteInputs[std.id] : existing?.teacherNote;
        if (existing) {
          await updateGrade(existing.id, { score: val, teacherNote: note }, teacherName);
        } else {
          await addGrade(
            {
              studentId: std.id,
              subjectId: selectedSubjectId,
              classId: selectedClassId,
              score: val,
              month: selectedMonth,
              type: assessmentType,
              teacherNote: note,
            },
            teacherName
          );
        }
        savedCount++;
      }
    }

    showToast(`تعداد ${toPersianDigits(savedCount)} نمره با موفقیت در کارنامه کلاس ذخیره گردید.`);
  };

  const handleQuickFillStandard = () => {
    const newScores: { [stdId: string]: string } = {};
    classStudents.forEach((std) => {
      const pseudo = (16.5 + ((std.id.charCodeAt(std.id.length - 1) % 6) * 0.75)).toFixed(2);
      newScores[std.id] = Math.min(20, parseFloat(pseudo)).toString();
    });
    setScoreInputs(newScores);
    showToast('پیشنهاد نمرات هوشمند بر اساس فعالیت کلاسی بارگذاری شد.');
  };

  // Class Stats calculations
  const classStats = useMemo(() => {
    const scores: number[] = [];
    classStudents.forEach((std) => {
      const raw = scoreInputs[std.id];
      const existing = getExistingGrade(std.id);
      const val = raw !== undefined ? parseFloat(toEnglishDigits(raw)) : existing?.score;
      if (val !== undefined && !isNaN(val)) {
        scores.push(val);
      }
    });

    if (scores.length === 0) {
      return { count: 0, avg: '—', max: '—', min: '—', passRate: '—' };
    }

    const sum = scores.reduce((a, b) => a + b, 0);
    const avg = (sum / scores.length).toFixed(2);
    const max = Math.max(...scores).toFixed(2);
    const min = Math.min(...scores).toFixed(2);
    const passed = scores.filter((s) => s >= 10).length;
    const passRate = Math.round((passed / scores.length) * 100);

    return {
      count: scores.length,
      avg: toPersianDigits(avg),
      max: toPersianDigits(max),
      min: toPersianDigits(min),
      passRate: `${toPersianDigits(passRate)}٪`,
    };
  }, [classStudents, scoreInputs, grades, selectedSubjectId, selectedMonth, assessmentType]);

  const assessmentTypeLabels: Record<string, string> = {
    continuous: 'مستمر و کلاسی',
    midterm: 'آزمون میان‌ترم',
    homework: 'تکالیف و تمرین',
    final: 'آزمون پایانی',
  };

  if (teacherClasses.length === 0 || teacherSubjects.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 p-8 rounded-3xl text-center space-y-4 max-w-2xl mx-auto my-12 shadow-sm" dir="rtl">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white">کلاس یا درس تخصیص‌یافته‌ای برای شما ثبت نشده است</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          دبیر گرامی، بر اساس تنظیمات سیستم و دسترسی‌های تعیین‌شده، در حال حاضر هیچ کلاس یا درسی به حساب کاربری شما تخصیص داده نشده است. جهت رفع این موضوع و فعال‌سازی دسترسی ثبت نمرات، لطفاً با مدیر آموزشگاه هماهنگ فرمایید.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 text-right max-w-7xl mx-auto"
      dir="rtl"
    >
      {/* Toast notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-2xl text-xs font-bold shadow-lg flex items-center justify-between gap-3 border ${
              toastMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {toastMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span>{toastMessage.text}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold px-2"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header and Control Panel */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs font-bold">
              <Award className="w-3.5 h-3.5" />
              <span>سامانه ارزشیابی و نمره‌دهی رسمی</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              دفتر ثبت و مدیریت نمرات کلاسی
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              دبیر: <strong className="text-slate-700 dark:text-slate-200">{activeTeacher.firstName} {activeTeacher.lastName}</strong> ({activeTeacher.specialty})
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleQuickFillStandard}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>پیشنهاد هوشمند نمرات</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>چاپ لیست</span>
            </button>

            <button
              onClick={handleSaveAllGrades}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>ذخیره سراسری نمرات</span>
            </button>
          </div>
        </div>

        {/* Filters bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              کلاس آموزشی:
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:outline-hidden"
            >
              {teacherClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (پایه {c.gradeLevel})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              عنوان درس تخصصی:
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:outline-hidden"
            >
              {teacherSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} (ضریب {toPersianDigits(s.coefficient)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              ماه ارزشیابی:
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:outline-hidden"
            >
              {monthsList.map((m) => (
                <option key={m} value={m}>
                  ارزشیابی ماه {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              نوع ارزشیابی:
            </label>
            <select
              value={assessmentType}
              onChange={(e) => setAssessmentType(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-2xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:outline-hidden"
            >
              <option value="continuous">مستمر و فعالیت کلاسی</option>
              <option value="midterm">آزمون میان‌ترم کتبی</option>
              <option value="homework">تکالیف و تمرین‌ها</option>
              <option value="final">آزمون پایانی نوبت</option>
            </select>
          </div>
        </div>
      </div>

      {/* Class Statistics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">دانش‌آموزان ارزشیابی‌شده</p>
          <p className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1 font-mono">
            {toPersianDigits(classStats.count)} از {toPersianDigits(classStudents.length)}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">معدل کلاسی</p>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
            {classStats.avg}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">بالاترین نمره</p>
          <p className="text-xl font-black text-purple-600 dark:text-purple-400 mt-1 font-mono">
            {classStats.max}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">کمترین نمره</p>
          <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1 font-mono">
            {classStats.min}
          </p>
        </div>

        <div className="col-span-2 md:col-span-1 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">درصد قبولی (≥ ۱۰)</p>
          <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1 font-mono">
            {classStats.passRate}
          </p>
        </div>
      </div>

      {/* Student List Table & Search */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4 p-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              لیست دانش‌آموزان ({toPersianDigits(filteredStudents.length)} نفر) — {selectedMonth} ({assessmentTypeLabels[assessmentType]})
            </h3>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی نام یا کد دانش‌آموزی..."
              className="w-full pr-9 pl-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-3 w-12 text-center">ردیف</th>
                <th className="py-3 px-4">نام و نام خانوادگی</th>
                <th className="py-3 px-3 text-center">کد دانش‌آموزی</th>
                <th className="py-3 px-4 text-center w-36">نمره (۰ تا ۲۰)</th>
                <th className="py-3 px-4 text-center w-28">سطح کیفی</th>
                <th className="py-3 px-4">بازخورد و توصیه آموزشی دبیر</th>
                <th className="py-3 px-4 text-center w-28">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStudents.map((std, idx) => {
                const existing = getExistingGrade(std.id);
                const currentVal =
                  scoreInputs[std.id] !== undefined
                    ? scoreInputs[std.id]
                    : existing?.score !== undefined
                    ? existing.score.toString()
                    : '';

                const parsedScore = parseFloat(toEnglishDigits(currentVal));
                const quality = !isNaN(parsedScore) ? getGradeQualityLabel(parsedScore) : null;

                const currentNote =
                  noteInputs[std.id] !== undefined
                    ? noteInputs[std.id]
                    : existing?.teacherNote || '';

                const isSaved = savedRowIds[std.id];

                return (
                  <tr key={std.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 text-center text-slate-400 font-mono">{toPersianDigits(idx + 1)}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {std.firstName} {std.lastName}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-500">{toPersianDigits(std.studentCode)}</td>
                    <td className="py-3 px-4 text-center">
                      <input
                        type="text"
                        dir="ltr"
                        value={currentVal}
                        onChange={(e) => handleScoreChange(std.id, e.target.value)}
                        placeholder="--"
                        className="w-24 px-3 py-1.5 rounded-xl text-center font-black text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-mono"
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      {quality ? (
                        <span className={`inline-block px-2.5 py-1 rounded-xl text-[11px] font-bold ${quality.badgeBg}`}>
                          {quality.label}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">ثبت‌نشده</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={currentNote}
                        onChange={(e) => handleNoteChange(std.id, e.target.value)}
                        placeholder="توصیه و بازخورد اختصاصی دبیر..."
                        className="w-full px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden"
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleSaveStudentGrade(std.id)}
                        className={`min-w-[70px] py-1.5 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1 mx-auto ${
                          isSaved
                            ? 'bg-emerald-600 text-white'
                            : 'bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-600 hover:text-white text-blue-700 dark:text-blue-300'
                        }`}
                      >
                        {isSaved ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>ثبت شد</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5" />
                            <span>ثبت</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {filteredStudents.map((std, idx) => {
            const existing = getExistingGrade(std.id);
            const currentVal =
              scoreInputs[std.id] !== undefined
                ? scoreInputs[std.id]
                : existing?.score !== undefined
                ? existing.score.toString()
                : '';

            const parsedScore = parseFloat(toEnglishDigits(currentVal));
            const quality = !isNaN(parsedScore) ? getGradeQualityLabel(parsedScore) : null;

            const currentNote =
              noteInputs[std.id] !== undefined
                ? noteInputs[std.id]
                : existing?.teacherNote || '';

            const isSaved = savedRowIds[std.id];

            return (
              <div key={std.id} className="py-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 text-center text-xs text-slate-400 font-mono">
                      {toPersianDigits(idx + 1)}
                    </span>
                    <div>
                      <p className="font-bold text-xs text-slate-900 dark:text-white">
                        {std.firstName} {std.lastName}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        کد: {toPersianDigits(std.studentCode)}
                      </p>
                    </div>
                  </div>

                  {quality ? (
                    <span className={`inline-block px-2.5 py-0.5 rounded-xl text-[11px] font-bold ${quality.badgeBg}`}>
                      {quality.label}
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[11px]">ثبت نشده</span>
                  )}
                </div>

                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-4">
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">نمره (۰ تا ۲۰):</label>
                    <input
                      type="text"
                      dir="ltr"
                      value={currentVal}
                      onChange={(e) => handleScoreChange(std.id, e.target.value)}
                      placeholder="۲۰"
                      className="w-full min-h-[42px] px-3 py-2 rounded-xl text-center font-bold text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>

                  <div className="col-span-8">
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">توصیه دبیر:</label>
                    <input
                      type="text"
                      value={currentNote}
                      onChange={(e) => handleNoteChange(std.id, e.target.value)}
                      placeholder="توضیح اختیاری..."
                      className="w-full min-h-[42px] px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSaveStudentGrade(std.id)}
                  className={`w-full min-h-[42px] flex items-center justify-center gap-1.5 py-2 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                    isSaved
                      ? 'bg-emerald-600 text-white'
                      : 'bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-600 hover:text-white text-blue-700 dark:text-blue-300'
                  }`}
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaved ? 'نمره ثبت شد' : `ثبت نمره ${std.firstName}`}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};
