import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Calendar, Plus, CheckCircle2, Archive, Sparkles, X, Edit2, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { toPersianDigits } from '../../utils/persian';
import { AcademicYear } from '../../types';
import { AdminConfirmDialog } from './AdminConfirmDialog';

export const AdminAcademicYearManager: React.FC = () => {
  const { academicYears, currentAcademicYear, addAcademicYear, updateAcademicYear, deleteAcademicYear, setActiveAcademicYear } = useData();

  const [showModal, setShowModal] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [yearToDelete, setYearToDelete] = useState<AcademicYear | null>(null);

  const [yearName, setYearName] = useState('۱۴۰۴-۱۴۰۵');
  const [startDate, setStartDate] = useState('۱۴۰۴/۰۷/۰۱');
  const [endDate, setEndDate] = useState('۱۴۰۵/۰۳/۳۱');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleOpenAddModal = () => {
    setEditingYear(null);
    setYearName('۱۴۰۵-۱۴۰۶');
    setStartDate('۱۴۰۵/۰۷/۰۱');
    setEndDate('۱۴۰۶/۰۳/۳۱');
    setShowModal(true);
  };

  const handleOpenEditModal = (year: AcademicYear) => {
    setEditingYear(year);
    setYearName(year.name);
    setStartDate(year.startDate || '۱۴۰۴/۰۷/۰۱');
    setEndDate(year.endDate || '۱۴۰۵/۰۳/۳۱');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!yearName.trim()) {
      setNotification({ type: 'error', message: 'لطفاً نام سال تحصیلی را وارد نمایید.' });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingYear) {
        await updateAcademicYear(editingYear.id, {
          name: yearName.trim(),
          startDate: startDate.trim(),
          endDate: endDate.trim(),
        });
        setNotification({ type: 'success', message: 'اطلاعات سال تحصیلی با موفقیت ویرایش شد.' });
      } else {
        await addAcademicYear({
          name: yearName.trim(),
          startDate: startDate.trim(),
          endDate: endDate.trim(),
        });
        setNotification({ type: 'success', message: 'سال تحصیلی جدید با موفقیت ثبت شد.' });
      }
      setShowModal(false);
      setEditingYear(null);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'خطا در ذخیره‌سازی سال تحصیلی.' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleSetActive = async (year: AcademicYear) => {
    try {
      await setActiveAcademicYear(year.id);
      setNotification({ type: 'success', message: `سال تحصیلی ${year.name} به عنوان سال تحصیلی جاری و فعال سامانه تنظیم گردید.` });
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'خطا در فعال‌سازی سال تحصیلی.' });
    } finally {
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!yearToDelete) return;
    try {
      await deleteAcademicYear(yearToDelete.id);
      setNotification({ type: 'success', message: `سال تحصیلی ${yearToDelete.name} حذف شد.` });
      setYearToDelete(null);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'خطا در حذف سال تحصیلی.' });
    } finally {
      setTimeout(() => setNotification(null), 4000);
    }
  };

  return (
    <div className="space-y-6 text-right">
      {/* Notification */}
      {notification && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold shadow-md animate-in fade-in duration-150 ${
            notification.type === 'success'
              ? 'bg-emerald-500/15 border border-emerald-500 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-500/15 border border-rose-500 text-rose-700 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
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
            <Calendar className="w-5 h-5 text-blue-600" />
            مدیریت سال‌های تحصیلی و دوره‌های آموزشی
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            تعریف دوره‌ها، انتخاب دوره فعال و عملیاتی سامانه، ویرایش و مدیریت بایگانی
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>تعریف سال تحصیلی جدید</span>
        </button>
      </div>

      {/* Cards Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {academicYears.map((ay) => {
          const isActive = ay.id === currentAcademicYear.id;
          return (
            <div
              key={ay.id}
              className={`p-6 rounded-3xl border shadow-sm space-y-4 flex flex-col justify-between ${
                isActive
                  ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditModal(ay)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="ویرایش سال تحصیلی"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {!isActive && (
                      <button
                        onClick={() => setYearToDelete(ay)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                        title="حذف سال تحصیلی"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {isActive ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center gap-1 border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5" /> دوره فعال جاری
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                      بایگانی / غیرفعال
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    سال تحصیلی {toPersianDigits(ay.name)}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                    شروع: {toPersianDigits(ay.startDate || 'نامشخص')} | پایان: {toPersianDigits(ay.endDate || 'نامشخص')}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                {!isActive ? (
                  <button
                    onClick={() => handleSetActive(ay)}
                    className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer active:scale-95"
                  >
                    فعال‌سازی این سال تحصیلی
                  </button>
                ) : (
                  <div className="py-2 text-center text-xs font-bold text-blue-600 dark:text-blue-400">
                    تمام داده‌های نمرات و کلاس‌ها متصل به این سال هستند.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirm Delete Dialog */}
      <AdminConfirmDialog
        isOpen={!!yearToDelete}
        title="حذف دوره سال تحصیلی"
        message={`آیا از حذف دوره سال تحصیلی «${yearToDelete?.name}» از سامانه اطمینان دارید؟`}
        confirmLabel="حذف دوره"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setYearToDelete(null)}
      />

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 text-right space-y-4 animate-in fade-in zoom-in duration-150">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 left-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              {editingYear ? 'ویرایش اطلاعات سال تحصیلی' : 'تعریف سال تحصیلی جدید'}
            </h3>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  عنوان سال تحصیلی: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={yearName}
                  onChange={(e) => setYearName(e.target.value)}
                  required
                  placeholder="مثال: ۱۴۰۴-۱۴۰۵"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">تاریخ آغاز:</label>
                  <input
                    type="text"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-center outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                    placeholder="۱۴۰۴/۰۷/۰۱"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">تاریخ پایان:</label>
                  <input
                    type="text"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-center outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                    placeholder="۱۴۰۵/۰۳/۳۱"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-4 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md cursor-pointer transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'در حال ذخیره...' : editingYear ? 'ذخیره تغییرات' : 'ایجاد سال تحصیلی'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

