import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  Calendar,
  Clock,
  MapPin,
  BookOpen,
  Layers,
  Printer,
  Sparkles,
  CheckCircle2,
  Filter,
  Plus,
  Trash2,
  Edit2,
  X,
  AlertCircle,
} from 'lucide-react';
import { toPersianDigits } from '../../utils/persian';
import { SchedulePeriod } from '../../types';

export const TeacherScheduleView: React.FC = () => {
  const { currentTeacher, user, currentUser } = useAuth();
  const { classes, subjects, schedules, addSchedule, updateSchedule, deleteSchedule } = useData();

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

  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<SchedulePeriod | null>(null);

  // Form states for schedule modal
  const [formData, setFormData] = useState({
    dayOfWeek: 0,
    periodNumber: 1,
    startTime: '08:00',
    endTime: '09:20',
    classId: '',
    subjectId: '',
    roomNumber: '۱۰۱',
  });

  const daysOfWeek = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه'];

  // Teacher's assigned classes & subjects
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

  // Combine database schedules with teacher matching
  const teacherSchedules = useMemo(() => {
    const dbTeacherSchedules = schedules.filter(
      (s) =>
        s.teacherId === activeTeacher.id ||
        s.teacherId === activeTeacher.userId ||
        (activeTeacher.assignedClassIds || []).includes(s.classId)
    );

    // Map each item to enriched object with class/subject title
    return dbTeacherSchedules.map((s) => {
      const cls = classes.find((c) => c.id === s.classId);
      const sub = subjects.find((sb) => sb.id === s.subjectId);
      return {
        ...s,
        className: cls ? cls.name : 'کلاس عمومی',
        subjectName: sub ? sub.title : 'درس تخصصی',
      };
    });
  }, [schedules, activeTeacher, classes, subjects]);

  // Filtered schedule
  const filteredSchedule = useMemo(() => {
    return teacherSchedules.filter((item) => {
      const matchDay =
        selectedDay === 'all' ||
        item.dayName === selectedDay ||
        daysOfWeek[item.dayOfWeek] === selectedDay;
      const matchClass =
        selectedClassFilter === 'all' || item.classId === selectedClassFilter;
      return matchDay && matchClass;
    });
  }, [teacherSchedules, selectedDay, selectedClassFilter, daysOfWeek]);

  // Summary statistics
  const distinctClasses = useMemo(() => {
    return Array.from(new Set(teacherSchedules.map((s) => s.className)));
  }, [teacherSchedules]);

  const distinctSubjects = useMemo(() => {
    return Array.from(new Set(teacherSchedules.map((s) => s.subjectName)));
  }, [teacherSchedules]);

  const totalWeeklyHours = teacherSchedules.length * 1.5;

  const handleOpenAddModal = () => {
    setEditingPeriod(null);
    setFormData({
      dayOfWeek: 0,
      periodNumber: 1,
      startTime: '08:00',
      endTime: '09:20',
      classId: teacherClasses[0]?.id || classes[0]?.id || 'c1',
      subjectId: teacherSubjects[0]?.id || subjects[0]?.id || 's1',
      roomNumber: '۱۰۱',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (period: SchedulePeriod & { className?: string; subjectName?: string }) => {
    setEditingPeriod(period);
    setFormData({
      dayOfWeek: period.dayOfWeek,
      periodNumber: period.periodNumber,
      startTime: period.startTime,
      endTime: period.endTime,
      classId: period.classId,
      subjectId: period.subjectId,
      roomNumber: String(period.roomNumber || '۱۰۱'),
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('آیا از حذف این زنگ از برنامه تدریس اطمینان دارید؟')) {
      await deleteSchedule(id);
    }
  };

  const handleSavePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    const periodPayload = {
      dayOfWeek: Number(formData.dayOfWeek),
      dayName: daysOfWeek[Number(formData.dayOfWeek)] || 'شنبه',
      periodNumber: Number(formData.periodNumber),
      startTime: formData.startTime,
      endTime: formData.endTime,
      classId: formData.classId,
      subjectId: formData.subjectId,
      teacherId: activeTeacher.id,
      roomNumber: formData.roomNumber,
    };

    if (editingPeriod) {
      await updateSchedule(editingPeriod.id, periodPayload);
    } else {
      await addSchedule(periodPayload);
    }
    setIsModalOpen(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 text-right max-w-7xl mx-auto"
      dir="rtl"
    >
      {/* Hero Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-200/60 dark:border-blue-800">
              <Calendar className="w-3.5 h-3.5" />
              <span>سامانه تقویم آموزشی و برنامه هفتگی تدریس</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              برنامه هفتگی تدریس — {activeTeacher.firstName} {activeTeacher.lastName}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              رشته تخصصی: <strong className="text-slate-700 dark:text-slate-300">{activeTeacher.specialty}</strong> • سال تحصیلی ۱۴۰۴–۱۴۰۵
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن زنگ تدریس</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>چاپ برنامه هفتگی</span>
            </button>
          </div>
        </div>

        {/* 3 Metric Badges */}
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 text-center">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">مجموع زنگ‌های تدریس</p>
            <p className="text-lg sm:text-xl font-black text-blue-600 dark:text-blue-400 mt-0.5 font-mono">
              {toPersianDigits(teacherSchedules.length)} زنگ ({toPersianDigits(totalWeeklyHours)} ساعت)
            </p>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 text-center">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">کلاس‌های تحت پوشش</p>
            <p className="text-lg sm:text-xl font-black text-purple-600 dark:text-purple-400 mt-0.5 font-mono">
              {toPersianDigits(distinctClasses.length)} کلاس فعال
            </p>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 text-center">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">عناوین درسی تخصصی</p>
            <p className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">
              {toPersianDigits(distinctSubjects.length)} عنوان درس
            </p>
          </div>
        </div>
      </div>

      {/* Weekday Filter Tabs & Class selector */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setSelectedDay('all')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              selectedDay === 'all'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            همه روزهای هفته
          </button>
          {daysOfWeek.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                selectedDay === day
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {day}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 rounded-2xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:outline-hidden"
          >
            <option value="all">همه کلاس‌ها</option>
            {teacherClasses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Schedule Grid View */}
      {selectedDay === 'all' ? (
        <div className="space-y-6">
          {daysOfWeek.map((day, dayIndex) => {
            const dayPeriods = filteredSchedule
              .filter((s) => s.dayName === day || s.dayOfWeek === dayIndex)
              .sort((a, b) => a.periodNumber - b.periodNumber);

            return (
              <div
                key={day}
                className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                      {toPersianDigits(dayIndex + 1)}
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      برنامه روز {day}
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {toPersianDigits(dayPeriods.length)} زنگ تدریس
                  </span>
                </div>

                {dayPeriods.length > 0 ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {dayPeriods.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3 relative group hover:border-blue-400 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-1 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-xs">
                            زنگ {toPersianDigits(item.periodNumber)}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono font-bold">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {toPersianDigits(item.startTime)} - {toPersianDigits(item.endTime)}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                            {item.subjectName}
                          </h4>
                          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-0.5">
                            {item.className}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-amber-500" />
                            <span>اتاق {toPersianDigits(item.roomNumber || '۱۰۱')}</span>
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                              title="ویرایش"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                              title="حذف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                    در روز {day} کلاسی برای این دبیر ثبت نشده است.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>برنامه زنگ‌های تدریس روز {selectedDay}</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">
              {toPersianDigits(filteredSchedule.length)} زنگ کلاسی
            </span>
          </div>

          {filteredSchedule.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredSchedule
                .sort((a, b) => a.periodNumber - b.periodNumber)
                .map((item) => (
                  <div
                    key={item.id}
                    className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3.5 hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-black text-xs">
                        زنگ {toPersianDigits(item.periodNumber)}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-mono font-bold">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {toPersianDigits(item.startTime)} - {toPersianDigits(item.endTime)}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-base">
                        {item.subjectName}
                      </h4>
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-bold mt-1">
                        کلاس: {item.className}
                      </p>
                    </div>

                    <div className="pt-2.5 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-500" />
                        <span>اتاق {toPersianDigits(item.roomNumber || '۱۰۱')}</span>
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                          title="ویرایش"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
              در روز {selectedDay} هیچ کلاسی برای این دبیر ثبت نشده است.
            </div>
          )}
        </div>
      )}

      {/* Schedule Period Modal (Add / Edit) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="font-black text-lg text-slate-900 dark:text-white">
                  {editingPeriod ? 'ویرایش زنگ کلاسی' : 'افزودن زنگ جدید به برنامه هفتگی'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSavePeriod} className="space-y-4 text-xs font-bold">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 mb-1">روز هفته:</label>
                    <select
                      value={formData.dayOfWeek}
                      onChange={(e) => setFormData({ ...formData, dayOfWeek: Number(e.target.value) })}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    >
                      {daysOfWeek.map((d, idx) => (
                        <option key={d} value={idx}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 mb-1">شماره زنگ:</label>
                    <select
                      value={formData.periodNumber}
                      onChange={(e) => setFormData({ ...formData, periodNumber: Number(e.target.value) })}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    >
                      <option value={1}>زنگ اول</option>
                      <option value={2}>زنگ دوم</option>
                      <option value={3}>زنگ سوم</option>
                      <option value={4}>زنگ چهارم</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 mb-1">ساعت شروع:</label>
                    <input
                      type="text"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      placeholder="08:00"
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 mb-1">ساعت پایان:</label>
                    <input
                      type="text"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      placeholder="09:20"
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">کلاس آموزشی:</label>
                  <select
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    required
                  >
                    {teacherClasses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (پایه {c.gradeLevel})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">درس تخصصی:</label>
                  <select
                    value={formData.subjectId}
                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    required
                  >
                    {teacherSubjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title} (ضریب {toPersianDigits(s.coefficient)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">شماره یا نام اتاق/کارگاه:</label>
                  <input
                    type="text"
                    value={formData.roomNumber}
                    onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                    placeholder="۱۰۱"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-600/25"
                  >
                    {editingPeriod ? 'ذخیره تغییرات' : 'ثبت در برنامه'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
