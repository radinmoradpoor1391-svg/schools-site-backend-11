import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import {
  Award,
  Search,
  Filter,
  Layers,
  BookOpen,
  TrendingUp,
  Download,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  User,
  CheckCircle2,
  X,
  UserCheck,
} from 'lucide-react';
import {
  toPersianDigits,
  formatScore,
  getGradeQualityLabel,
  getCurrentJalaliDate,
} from '../../utils/persian';
import { Grade } from '../../types';
import { AdminConfirmDialog } from './AdminConfirmDialog';

export const AdminGradeOversight: React.FC = () => {
  const { grades, classes, subjects, students, teachers, addGrade, updateGrade, deleteGrade } = useData();

  const [selectedClassFilter, setSelectedClassFilter] = useState('all');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('all');
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState('all');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [gradeToDelete, setGradeToDelete] = useState<Grade | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form states
  const [studentId, setStudentId] = useState('');
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [score, setScore] = useState<string>('20');
  const [gradeType, setGradeType] = useState('daily');
  const [month, setMonth] = useState('مهر');
  const [date, setDate] = useState(getCurrentJalaliDate());
  const [description, setDescription] = useState('');

  const monthsList = ['مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند', 'فروردین', 'اردیبهشت', 'خرداد'];

  // Handle student select: auto-set classId
  const handleStudentSelect = (sId: string) => {
    setStudentId(sId);
    const selectedStd = students.find((s) => s.id === sId);
    if (selectedStd && selectedStd.classId) {
      setClassId(selectedStd.classId);
    }
  };

  const handleOpenAddModal = () => {
    setEditingGrade(null);
    setStudentId(students[0]?.id || '');
    setClassId(students[0]?.classId || classes[0]?.id || '');
    setSubjectId(subjects[0]?.id || '');
    setTeacherId(teachers[0]?.id || '');
    setScore('20');
    setGradeType('daily');
    setMonth('مهر');
    setDate(getCurrentJalaliDate());
    setDescription('');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (g: Grade) => {
    setEditingGrade(g);
    setStudentId(g.studentId);
    setClassId(g.classId);
    setSubjectId(g.subjectId);
    setTeacherId(g.teacherId || '');
    setScore(g.score.toString());
    setGradeType(g.gradeType || 'daily');
    setMonth(g.month || 'مهر');
    setDate(g.date || getCurrentJalaliDate());
    setDescription(g.description || '');
    setIsAddModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numScore = parseFloat(score);
    if (isNaN(numScore) || numScore < 0 || numScore > 20) {
      setNotification({ type: 'error', message: 'نمره باید عددی بین ۰ تا ۲۰ باشد.' });
      return;
    }
    if (!studentId || !subjectId) {
      setNotification({ type: 'error', message: 'لطفاً دانش‌آموز و درس را انتخاب کنید.' });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingGrade) {
        await updateGrade(
          editingGrade.id,
          {
            studentId,
            classId,
            subjectId,
            teacherId: teacherId || undefined,
            score: numScore,
            maxScore: 20,
            gradeType,
            month,
            date,
            teacherNote: description,
            description,
          },
          'مدیریت آموزشگاه'
        );
        setNotification({ type: 'success', message: 'نمره با موفقیت ویرایش شد.' });
      } else {
        await addGrade(
          {
            studentId,
            classId,
            subjectId,
            teacherId: teacherId || undefined,
            score: numScore,
            maxScore: 20,
            gradeType,
            month,
            date,
            teacherNote: description,
            description,
          },
          'مدیریت آموزشگاه'
        );
        setNotification({ type: 'success', message: 'نمره دانش‌آموز با موفقیت در پایگاه داده ثبت شد.' });
      }
      setIsAddModalOpen(false);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'خطا در ثبت نمره.' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleDelete = async () => {
    if (!gradeToDelete) return;
    try {
      await deleteGrade(gradeToDelete.id, 'مدیریت آموزشگاه');
      setNotification({ type: 'success', message: 'نمره با موفقیت حذف گردید.' });
      setGradeToDelete(null);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'خطا در حذف نمره.' });
    }
  };

  const filteredGrades = grades.filter((g) => {
    const std = students.find((s) => s.id === g.studentId);
    const stdName = std ? `${std.firstName} ${std.lastName}` : '';
    const nationalId = std ? std.nationalId : '';

    const matchesSearch =
      !searchQuery ||
      stdName.includes(searchQuery) ||
      nationalId.includes(searchQuery);

    const matchesClass = selectedClassFilter === 'all' || g.classId === selectedClassFilter;
    const matchesSubject = selectedSubjectFilter === 'all' || g.subjectId === selectedSubjectFilter;
    const matchesTeacher = selectedTeacherFilter === 'all' || g.teacherId === selectedTeacherFilter;
    const matchesMonth = selectedMonthFilter === 'all' || g.month === selectedMonthFilter;
    const matchesDate = !selectedDateFilter || (g.date && g.date.includes(selectedDateFilter));

    return matchesSearch && matchesClass && matchesSubject && matchesTeacher && matchesMonth && matchesDate;
  });

  // Calculate statistics
  const totalScores = filteredGrades.reduce((acc, curr) => acc + curr.score, 0);
  const averageGPA = filteredGrades.length > 0 ? +(totalScores / filteredGrades.length).toFixed(2) : 0;
  const excellentCount = filteredGrades.filter((g) => g.score >= 17).length;
  const needHelpCount = filteredGrades.filter((g) => g.score < 12).length;

  return (
    <div className="space-y-6 text-right">
      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold shadow-md animate-in fade-in duration-150 ${
            notification.type === 'success'
              ? 'bg-emerald-500/15 border border-emerald-500 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-500/15 border border-rose-500 text-rose-700 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-600" />
            نظارت و مدیریت ثبت نمرات دانش‌آموزان
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            دفتر کل نمرات ثبت‌شده روزانه و مستمر توسط دبیران و مدیریت آموزشگاه با امکان فیلتر بر اساس تاریخ، درس و دبیر
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-lg shadow-blue-600/20 cursor-pointer transition-all active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>ثبت نمره جدید توسط مدیر</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">تعداد کل ارزیابی‌های فیلترشده</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{toPersianDigits(filteredGrades.length)}</p>
          <p className="text-[11px] text-slate-400">رکورد نمره ثبت‌شده</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">میانگین نمرات</span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{formatScore(averageGPA)}</p>
          <p className="text-[11px] text-emerald-600">از سقف نمره ۲۰</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">سطح خیلی خوب و عالی (&ge; ۱۷)</span>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{toPersianDigits(excellentCount)}</p>
          <p className="text-[11px] text-blue-500">نمره برتر</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">نیازمند تلاش و جبران (&lt; ۱۲)</span>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400">{toPersianDigits(needHelpCount)}</p>
          <p className="text-[11px] text-rose-500">دانش‌آموز نیازمند ارجاع به مشاور</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-3">
        <div className="relative w-full lg:w-64">
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی نام یا کد ملی..."
            className="w-full pr-10 pl-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto text-xs">
          {/* Class filter */}
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
          >
            <option value="all">همه کلاس‌ها</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Subject filter */}
          <select
            value={selectedSubjectFilter}
            onChange={(e) => setSelectedSubjectFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
          >
            <option value="all">همه دروس</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>

          {/* Teacher filter */}
          <select
            value={selectedTeacherFilter}
            onChange={(e) => setSelectedTeacherFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
          >
            <option value="all">همه دبیران</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                استاد {t.firstName} {t.lastName}
              </option>
            ))}
          </select>

          {/* Month filter */}
          <select
            value={selectedMonthFilter}
            onChange={(e) => setSelectedMonthFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
          >
            <option value="all">همه ماه‌ها</option>
            {monthsList.map((m) => (
              <option key={m} value={m}>
                ماه {m}
              </option>
            ))}
          </select>

          {/* Date search input */}
          <input
            type="text"
            value={selectedDateFilter}
            onChange={(e) => setSelectedDateFilter(e.target.value)}
            placeholder="فیلتر بر اساس تاریخ..."
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs w-32 font-mono"
          />
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-100/70 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4 w-12 text-center">ردیف</th>
                <th className="py-3 px-4">دانش‌آموز</th>
                <th className="py-3 px-4">کلاس</th>
                <th className="py-3 px-4">درس</th>
                <th className="py-3 px-4">دبیر</th>
                <th className="py-3 px-4">تاریخ / دوره</th>
                <th className="py-3 px-4 text-center">نمره (از ۲۰)</th>
                <th className="py-3 px-4 text-center">ارزیابی کیفی</th>
                <th className="py-3 px-4">توضیحات</th>
                <th className="py-3 px-4 text-center w-24">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredGrades.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    هیچ نمره‌ای با مشخصات فیلترشده یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredGrades.map((g, idx) => {
                  const std = students.find((s) => s.id === g.studentId);
                  const sub = subjects.find((s) => s.id === g.subjectId);
                  const cls = classes.find((c) => c.id === g.classId);
                  const tch = teachers.find((t) => t.id === g.teacherId);
                  const quality = getGradeQualityLabel(g.score);

                  return (
                    <tr key={g.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 text-center text-slate-400 font-mono">{toPersianDigits(idx + 1)}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {std ? `${std.firstName} ${std.lastName}` : 'نامشخص'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{cls?.name || '—'}</td>
                      <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">{sub?.title || '—'}</td>
                      <td className="py-3 px-4 text-slate-500">
                        {tch ? `${tch.firstName} ${tch.lastName}` : 'مدیریت'}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {g.date ? toPersianDigits(g.date) : `ماه ${g.month}`}
                      </td>
                      <td className="py-3 px-4 text-center font-black font-mono text-sm text-blue-600 dark:text-blue-400">
                        {formatScore(g.score)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold ${quality.badgeBg}`}>
                          {quality.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px] max-w-xs truncate">
                        {g.teacherNote || g.description || '—'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(g)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="ویرایش نمره"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setGradeToDelete(g)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                            title="حذف نمره"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm Delete Modal */}
      <AdminConfirmDialog
        isOpen={!!gradeToDelete}
        title="حذف نمره دانش‌آموز"
        message="آیا از حذف این رکورد نمره از پایگاه داده اطمینان دارید؟ این عملیات در لاگ‌های سیستم ثبت خواهد شد."
        confirmLabel="حذف نمره"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setGradeToDelete(null)}
      />

      {/* Add / Edit Grade Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 text-right space-y-4 animate-in fade-in zoom-in duration-150">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-5 left-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-600" />
              {editingGrade ? 'ویرایش نمره ثبت‌شده' : 'ثبت نمره ارزیابی جدید توسط مدیر'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    انتخاب دانش‌آموز: <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={studentId}
                    onChange={(e) => handleStudentSelect(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                    required
                  >
                    <option value="">-- انتخاب کنید --</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.firstName} {s.lastName} ({s.nationalId})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    درس مربوطه: <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                    required
                  >
                    <option value="">-- انتخاب کنید --</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title} (ضریب {s.coefficient})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    دبیر ارزیاب (اختیاری):
                  </label>
                  <select
                    value={teacherId}
                    onChange={(e) => setTeacherId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="">مدیریت آموزشگاه</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        استاد {t.firstName} {t.lastName} ({t.specialty || 'دبیر'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    کلاس آموزشی:
                  </label>
                  <select
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    مقدار نمره (۰ تا ۲۰): <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    max="20"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    تاریخ ثبت (جلالی):
                  </label>
                  <input
                    type="text"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-center"
                    placeholder="۱۴۰۴/۰۸/۱۵"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ماه ارزیابی:
                  </label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    {monthsList.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  نوع ارزیابی:
                </label>
                <select
                  value={gradeType}
                  onChange={(e) => setGradeType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="daily">ارزیابی کلاسی و روزانه</option>
                  <option value="quiz">کوییز و پرسش شفاهی</option>
                  <option value="homework">تکلیف و فعالیت منزل</option>
                  <option value="midterm">آزمون میان‌ترم (ماهانه)</option>
                  <option value="final">امتحان پایانی ترم</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  توضیحات و بازخورد ارزیابی:
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  placeholder="مثال: تسلط عالی بر حل تمرینات فصل دوم ریاضی..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-md cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? 'در حال ثبت در MySQL...' : editingGrade ? 'ذخیره تغییرات' : 'ثبت نمره در سامانه'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

