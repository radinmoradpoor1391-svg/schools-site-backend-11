import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Edit2,
  BookOpen,
  User,
  Layers,
  School,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Printer,
  Check,
} from 'lucide-react';
import { toPersianDigits } from '../../utils/persian';
import { SchedulePeriod } from '../../types';

export const AdminScheduleManager: React.FC = () => {
  const { classes, subjects, teachers, schedules, addSchedule, updateSchedule, deleteSchedule } = useData();

  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [selectedDay, setSelectedDay] = useState<number | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<SchedulePeriod | null>(null);

  // Form states
  const [formDayOfWeek, setFormDayOfWeek] = useState<number>(0);
  const [formPeriodNumber, setFormPeriodNumber] = useState<number>(1);
  const [formStartTime, setFormStartTime] = useState('08:00');
  const [formEndTime, setFormEndTime] = useState('09:20');
  const [formClassId, setFormClassId] = useState(classes[0]?.id || '');
  const [formSubjectId, setFormSubjectId] = useState(subjects[0]?.id || '');
  const [formTeacherId, setFormTeacherId] = useState(teachers[0]?.id || '');
  const [formRoomNumber, setFormRoomNumber] = useState('۱۰۱');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const days = [
    { id: 0, name: 'شنبه' },
    { id: 1, name: 'یکشنبه' },
    { id: 2, name: 'دوشنبه' },
    { id: 3, name: 'سه‌شنبه' },
    { id: 4, name: 'چهارشنبه' },
  ];

  const periodTimeSlots: Record<number, { start: string; end: string; label: string }> = {
    1: { start: '08:00', end: '09:20', label: 'زنگ اول' },
    2: { start: '09:40', end: '11:00', label: 'زنگ دوم' },
    3: { start: '11:20', end: '12:40', label: 'زنگ سوم' },
    4: { start: '13:00', end: '14:20', label: 'زنگ چهارم' },
  };

  const handleOpenAdd = (dayNum = 0, periodNum = 1) => {
    setEditingPeriod(null);
    setFormDayOfWeek(dayNum);
    setFormPeriodNumber(periodNum);
    setFormStartTime(periodTimeSlots[periodNum]?.start || '08:00');
    setFormEndTime(periodTimeSlots[periodNum]?.end || '09:20');
    setFormClassId(selectedClassId || classes[0]?.id || '');
    setFormSubjectId(subjects[0]?.id || '');
    setFormTeacherId(teachers[0]?.id || '');
    const currentClass = classes.find((c) => c.id === (selectedClassId || classes[0]?.id));
    setFormRoomNumber(currentClass?.roomNumber || '۱۰۱');
    setFormError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (period: SchedulePeriod) => {
    setEditingPeriod(period);
    setFormDayOfWeek(period.dayOfWeek);
    setFormPeriodNumber(period.periodNumber);
    setFormStartTime(period.startTime);
    setFormEndTime(period.endTime);
    setFormClassId(period.classId);
    setFormSubjectId(period.subjectId);
    setFormTeacherId(period.teacherId);
    setFormRoomNumber(period.roomNumber || '۱۰۱');
    setFormError(null);
    setShowModal(true);
  };

  const handlePeriodNumberChange = (pNum: number) => {
    setFormPeriodNumber(pNum);
    if (periodTimeSlots[pNum]) {
      setFormStartTime(periodTimeSlots[pNum].start);
      setFormEndTime(periodTimeSlots[pNum].end);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formClassId) {
      setFormError('لطفاً کلاس درسی را انتخاب نمایید.');
      return;
    }
    if (!formSubjectId) {
      setFormError('لطفاً عنوان کتاب یا درس را انتخاب نمایید.');
      return;
    }
    if (!formTeacherId) {
      setFormError('لطفاً دبیر مربوطه را انتخاب فرمایید.');
      return;
    }

    try {
      setIsSubmitting(true);
      const selectedSub = subjects.find((s) => s.id === formSubjectId);
      const selectedTeach = teachers.find((t) => t.id === formTeacherId);
      const selectedCls = classes.find((c) => c.id === formClassId);
      const dayName = days.find((d) => d.id === formDayOfWeek)?.name || 'شنبه';

      if (editingPeriod) {
        await updateSchedule(editingPeriod.id, {
          dayOfWeek: formDayOfWeek as 0 | 1 | 2 | 3 | 4,
          dayName,
          periodNumber: formPeriodNumber,
          startTime: formStartTime,
          endTime: formEndTime,
          classId: formClassId,
          className: selectedCls?.name,
          subjectId: formSubjectId,
          subjectTitle: selectedSub?.title,
          teacherId: formTeacherId,
          teacherName: selectedTeach ? `${selectedTeach.firstName} ${selectedTeach.lastName}` : '',
          roomNumber: formRoomNumber,
        });
        setActionMsg({ type: 'success', text: 'زنگ با موفقیت در برنامه هفتگی ویرایش گردید.' });
      } else {
        await addSchedule({
          dayOfWeek: formDayOfWeek as 0 | 1 | 2 | 3 | 4,
          dayName,
          periodNumber: formPeriodNumber,
          startTime: formStartTime,
          endTime: formEndTime,
          classId: formClassId,
          className: selectedCls?.name,
          subjectId: formSubjectId,
          subjectTitle: selectedSub?.title,
          teacherId: formTeacherId,
          teacherName: selectedTeach ? `${selectedTeach.firstName} ${selectedTeach.lastName}` : '',
          roomNumber: formRoomNumber,
        });
        setActionMsg({ type: 'success', text: 'زنگ درسی جدید با موفقیت به برنامه هفتگی اضافه شد.' });
      }
      setShowModal(false);
      setTimeout(() => setActionMsg(null), 4000);
    } catch (err: any) {
      setFormError(err.message || 'خطا در ثبت برنامه هفتگی.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('آیا از حذف این جلسه درسی از برنامه هفتگی اطمینان دارید؟')) {
      try {
        await deleteSchedule(id);
        setActionMsg({ type: 'success', text: 'جلسه درسی از برنامه حذف شد.' });
        setTimeout(() => setActionMsg(null), 3000);
      } catch (err: any) {
        setActionMsg({ type: 'error', text: err.message || 'خطا در حذف برنامه.' });
      }
    }
  };

  // Filtered schedules for selected class
  const classSchedules = schedules.filter((s) => s.classId === selectedClassId);

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            تنظیم و مدیریت برنامه هفتگی کلاس‌ها
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            تعیین ساعات کلاسی، تخصیص دبیران و دروس به زنگ‌های آموزشی پایه‌های هفتم، هشتم و نهم
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>چاپ برنامه هفتگی</span>
          </button>
          <button
            onClick={() => handleOpenAdd(0, 1)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن زنگ جدید</span>
          </button>
        </div>
      </div>

      {actionMsg && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 ${
            actionMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
          }`}
        >
          {actionMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{actionMsg.text}</span>
        </div>
      )}

      {/* Class Selector Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">کلاس هدف:</span>
          {classes.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedClassId(c.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                selectedClassId === c.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {c.name} (پایه {c.gradeLevel})
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">فیلتر روز:</span>
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
          >
            <option value="all">تمام روزهای هفته</option>
            {days.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Weekly Grid Schedule Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-black text-slate-500 dark:text-slate-400 pb-3">
                <th className="py-3 px-4 w-28">روز هفته</th>
                {[1, 2, 3, 4].map((pNum) => (
                  <th key={pNum} className="py-3 px-4 text-center">
                    <div className="font-bold text-slate-800 dark:text-white">
                      {periodTimeSlots[pNum].label}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {periodTimeSlots[pNum].start} تا {periodTimeSlots[pNum].end}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {days
                .filter((d) => selectedDay === 'all' || d.id === selectedDay)
                .map((day) => (
                  <tr key={day.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-4 font-black text-sm text-slate-900 dark:text-white border-l border-slate-100 dark:border-slate-800/60">
                      {day.name}
                    </td>

                    {[1, 2, 3, 4].map((pNum) => {
                      const period = classSchedules.find(
                        (s) => s.dayOfWeek === day.id && s.periodNumber === pNum
                      );

                      return (
                        <td key={pNum} className="p-2.5 text-center align-top">
                          {period ? (
                            <div className="p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 text-right space-y-1.5 relative group shadow-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-black text-xs text-blue-950 dark:text-blue-200">
                                  {period.subjectTitle || 'درس نامشخص'}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-200/60 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-bold">
                                  اتاق {toPersianDigits(period.roomNumber || '۱۰۱')}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                                <User className="w-3.5 h-3.5 text-blue-600" />
                                <span>دبیر: {period.teacherName || 'نامشخص'}</span>
                              </div>

                              {/* Hover Action Buttons */}
                              <div className="pt-2 border-t border-blue-200/50 dark:border-blue-900/50 flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenEdit(period)}
                                  className="p-1 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-100/60 dark:hover:bg-blue-900/60 transition-colors cursor-pointer"
                                  title="ویرایش زنگ"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(period.id)}
                                  className="p-1 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-100/60 dark:hover:bg-rose-950 transition-colors cursor-pointer"
                                  title="حذف زنگ"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleOpenAdd(day.id, pNum)}
                              className="w-full h-24 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/20 text-slate-400 hover:text-blue-600 flex flex-col items-center justify-center gap-1 text-xs transition-all cursor-pointer group"
                            >
                              <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                              <span className="text-[10px] font-bold">تخصیص درس</span>
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                {editingPeriod ? 'ویرایش زنگ برنامه هفتگی' : 'افزودن جلسه درسی جدید'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-xs font-bold rounded-2xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs font-bold">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">روز هفته:</label>
                  <select
                    value={formDayOfWeek}
                    onChange={(e) => setFormDayOfWeek(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    {days.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">زنگ آموزشی:</label>
                  <select
                    value={formPeriodNumber}
                    onChange={(e) => handlePeriodNumberChange(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    {[1, 2, 3, 4].map((pNum) => (
                      <option key={pNum} value={pNum}>
                        {periodTimeSlots[pNum].label} ({periodTimeSlots[pNum].start} - {periodTimeSlots[pNum].end})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">کلاس درس:</label>
                  <select
                    value={formClassId}
                    onChange={(e) => setFormClassId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (پایه {c.gradeLevel})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">شماره کلاس / اتاق:</label>
                  <input
                    type="text"
                    value={formRoomNumber}
                    onChange={(e) => setFormRoomNumber(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    placeholder="۱۰۱"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">کتاب / عنوان درسی:</label>
                <select
                  value={formSubjectId}
                  onChange={(e) => setFormSubjectId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} (پایه {s.gradeLevel} - ضریب {toPersianDigits(s.coefficient)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">دبیر تدریس‌کننده:</label>
                <select
                  value={formTeacherId}
                  onChange={(e) => setFormTeacherId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.firstName} {t.lastName} ({t.specialty || 'عمومی'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'در حال ثبت...' : editingPeriod ? 'ویرایش زنگ' : 'ثبت در برنامه'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
