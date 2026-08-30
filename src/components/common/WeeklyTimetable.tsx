import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  BookOpen,
  User,
  MapPin,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Printer,
  Download,
  Info,
} from 'lucide-react';
import { SchedulePeriod } from '../../types';
import { BELL_PERIODS, DAYS_OF_WEEK, getCurrentPeriodStatus } from '../../utils/scheduleData';
import { toPersianDigits } from '../../utils/persian';

interface WeeklyTimetableProps {
  schedule: SchedulePeriod[];
  title?: string;
  subtitle?: string;
  mode?: 'class' | 'teacher' | 'student';
  targetName?: string; // e.g. "کلاس هفتم ۱" or "استاد احمدی" or "علی محمدی"
  readOnly?: boolean;
}

export const WeeklyTimetable: React.FC<WeeklyTimetableProps> = ({
  schedule,
  title = 'برنامه هفتگی آموزشی',
  subtitle = 'سامانه هوشمند زمان‌بندی و زنگ‌های کلاسی مجتمع آموزشی و دبیرستان استعدادهای درخشان پدیده دانش',
  mode = 'class',
  targetName,
}) => {
  const [selectedDay, setSelectedDay] = useState<number | 'all'>('all');
  const periodStatus = getCurrentPeriodStatus();

  // Color mapping for subjects
  const getSubjectBadgeStyle = (title: string) => {
    if (title.includes('ریاضی')) return 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    if (title.includes('علوم')) return 'bg-cyan-50 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800';
    if (title.includes('فارسی') || title.includes('نگارش')) return 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    if (title.includes('انگلیسی')) return 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
    if (title.includes('عربی') || title.includes('قرآن') || title.includes('پیام')) return 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
    if (title.includes('ورزش') || title.includes('تربیت')) return 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
    if (title.includes('هنر') || title.includes('کار')) return 'bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
    return 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  };

  const getSlot = (dayOfWeek: number, periodNumber: number) => {
    return schedule.find((s) => s.dayOfWeek === dayOfWeek && s.periodNumber === periodNumber);
  };

  return (
    <div className="space-y-4 text-right" dir="rtl">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <Calendar className="w-5 h-5" />
            </span>
            <h3 className="font-black text-slate-900 dark:text-white text-base md:text-lg">
              {title} {targetName ? `(${targetName})` : ''}
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
        </div>

        {/* Live status badge */}
        <div className="flex items-center gap-2">
          <div className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 border ${
            periodStatus.isSchoolHours
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
          }`}>
            <span className={`w-2 h-2 rounded-full ${periodStatus.isSchoolHours ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            <span>{periodStatus.statusText}</span>
          </div>

          <button
            onClick={() => window.print()}
            className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            title="چاپ برنامه هفتگی"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Day Filter Pills (Mobile friendly) */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedDay('all')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            selectedDay === 'all'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          کل هفته (جدول کامل)
        </button>
        {DAYS_OF_WEEK.map((d) => (
          <button
            key={d.dayOfWeek}
            onClick={() => setSelectedDay(d.dayOfWeek)}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              selectedDay === d.dayOfWeek
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
            }`}
          >
            {d.name}
          </button>
        ))}
      </div>

      {/* Full Weekly Grid (Desktop & Tablet) */}
      {selectedDay === 'all' ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                  <th className="p-4 text-xs font-black text-slate-700 dark:text-slate-300 w-28 text-center border-l border-slate-200 dark:border-slate-700">
                    روز هفته
                  </th>
                  {BELL_PERIODS.map((period) => (
                    <th
                      key={period.periodNumber}
                      className="p-3.5 text-xs font-black text-slate-700 dark:text-slate-300 text-center border-l border-slate-200 dark:border-slate-700 last:border-l-0"
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-blue-600 dark:text-blue-400 font-black">{period.name}</span>
                        <span className="text-[11px] font-mono text-slate-500 font-normal">
                          {toPersianDigits(period.label)}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {DAYS_OF_WEEK.map((day) => (
                  <tr key={day.dayOfWeek} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                    {/* Day Title column */}
                    <td className="p-4 text-center font-black text-xs text-slate-900 dark:text-white bg-slate-50/50 dark:bg-slate-800/40 border-l border-slate-200 dark:border-slate-700">
                      {day.name}
                    </td>

                    {/* Period Slots */}
                    {BELL_PERIODS.map((period) => {
                      const slot = getSlot(day.dayOfWeek, period.periodNumber);
                      const badgeClass = slot ? getSubjectBadgeStyle(slot.subjectTitle || '') : '';

                      return (
                        <td
                          key={period.periodNumber}
                          className="p-3 border-l border-slate-200 dark:border-slate-700 last:border-l-0 align-top"
                        >
                          {slot ? (
                            <div className={`p-3 rounded-2xl border ${badgeClass} space-y-1.5 transition-all hover:scale-[1.02] shadow-xs`}>
                              <div className="flex items-center justify-between">
                                <p className="font-black text-xs">{slot.subjectTitle}</p>
                                <span className="text-[10px] font-mono opacity-70">
                                  {toPersianDigits(slot.roomNumber || '۱۰۱')}
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-[11px] opacity-80 pt-1 border-t border-current/10">
                                <span className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  <span>{slot.teacherName || 'دبیر محترم'}</span>
                                </span>
                                {mode === 'teacher' && slot.className && (
                                  <span className="font-bold">{slot.className}</span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-[11px] text-slate-400">
                              زنگ آزاد / مطالعه
                            </div>
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
      ) : (
        /* Single Day Detailed View */
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {BELL_PERIODS.map((period) => {
            const slot = getSlot(selectedDay, period.periodNumber);
            const badgeClass = slot ? getSubjectBadgeStyle(slot.subjectTitle || '') : '';

            return (
              <div
                key={period.periodNumber}
                className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-xl text-xs font-black bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                    {period.name}
                  </span>
                  <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {toPersianDigits(period.label)}
                  </span>
                </div>

                {slot ? (
                  <div className={`p-4 rounded-2xl border ${badgeClass} space-y-2`}>
                    <h4 className="text-base font-black">{slot.subjectTitle}</h4>
                    <p className="text-xs flex items-center gap-1.5 opacity-90">
                      <User className="w-3.5 h-3.5" />
                      <span>مدرس: {slot.teacherName}</span>
                    </p>
                    <p className="text-xs flex items-center gap-1.5 opacity-80">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>محل برگزاری: کلاس {toPersianDigits(slot.roomNumber || '۱۰۱')}</span>
                    </p>
                  </div>
                ) : (
                  <div className="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                    بدون درس تخصیص‌یافته
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
