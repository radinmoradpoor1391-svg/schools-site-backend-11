import React, { useMemo } from 'react';
import {
  PERSIAN_MONTHS,
  toPersianDigits,
  getJalaliMonthDays,
  calculateJalaliAge,
  getCurrentJalaliYear,
} from '../../utils/persian';
import { Calendar, User, CheckCircle2, AlertCircle } from 'lucide-react';

interface PersianDatePickerProps {
  year: number;
  month: number;
  day: number;
  onChange: (date: { year: number; month: number; day: number; formatted: string; age: number }) => void;
  minYear?: number;
  maxYear?: number;
  label?: string;
  required?: boolean;
  showAgeBadge?: boolean;
  disabled?: boolean;
  className?: string;
}

export const PersianDatePicker: React.FC<PersianDatePickerProps> = ({
  year,
  month,
  day,
  onChange,
  minYear = 1375,
  maxYear,
  label = 'تاریخ تولد دانش‌آموز (شمسی)',
  required = true,
  showAgeBadge = true,
  disabled = false,
  className = '',
}) => {
  const currentJalaliYear = useMemo(() => getCurrentJalaliYear(), []);
  const effectiveMaxYear = maxYear || currentJalaliYear;

  // Generate Year options
  const yearOptions = useMemo(() => {
    const years: number[] = [];
    for (let y = effectiveMaxYear; y >= minYear; y--) {
      years.push(y);
    }
    return years;
  }, [minYear, effectiveMaxYear]);

  // Determine max days in current selected year & month
  const maxDays = useMemo(() => {
    return getJalaliMonthDays(year || 1390, month || 1);
  }, [year, month]);

  // Adjust day if selected day exceeds max days of the month
  const effectiveDay = Math.min(day || 1, maxDays);

  // Calculate age
  const { age, exactText } = useMemo(() => {
    return calculateJalaliAge(year, month, effectiveDay);
  }, [year, month, effectiveDay]);

  const handleYearChange = (newYear: number) => {
    const newMaxDays = getJalaliMonthDays(newYear, month);
    const adjustedDay = Math.min(day, newMaxDays);
    const formatted = `${newYear}/${String(month).padStart(2, '0')}/${String(adjustedDay).padStart(2, '0')}`;
    const newAge = calculateJalaliAge(newYear, month, adjustedDay).age;
    onChange({ year: newYear, month, day: adjustedDay, formatted, age: newAge });
  };

  const handleMonthChange = (newMonth: number) => {
    const newMaxDays = getJalaliMonthDays(year, newMonth);
    const adjustedDay = Math.min(day, newMaxDays);
    const formatted = `${year}/${String(newMonth).padStart(2, '0')}/${String(adjustedDay).padStart(2, '0')}`;
    const newAge = calculateJalaliAge(year, newMonth, adjustedDay).age;
    onChange({ year, month: newMonth, day: adjustedDay, formatted, age: newAge });
  };

  const handleDayChange = (newDay: number) => {
    const formatted = `${year}/${String(month).padStart(2, '0')}/${String(newDay).padStart(2, '0')}`;
    const newAge = calculateJalaliAge(year, month, newDay).age;
    onChange({ year, month, day: newDay, formatted, age: newAge });
  };

  return (
    <div className={`space-y-1.5 text-right ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>{label}</span>
          {required && <span className="text-rose-500">*</span>}
        </label>

        {showAgeBadge && year > 0 && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/80 text-blue-700 dark:text-blue-300 text-[11px] font-bold">
            <User className="w-3 h-3 text-blue-500" />
            <span>سن محاسبه‌شده: <strong className="font-bold">{exactText}</strong></span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {/* Day Selector */}
        <div>
          <span className="block text-[10px] text-slate-400 font-medium mb-0.5">روز</span>
          <select
            value={effectiveDay}
            disabled={disabled}
            onChange={(e) => handleDayChange(parseInt(e.target.value, 10))}
            className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
          >
            {Array.from({ length: maxDays }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>
                {toPersianDigits(d)}
              </option>
            ))}
          </select>
        </div>

        {/* Month Selector */}
        <div>
          <span className="block text-[10px] text-slate-400 font-medium mb-0.5">ماه</span>
          <select
            value={month}
            disabled={disabled}
            onChange={(e) => handleMonthChange(parseInt(e.target.value, 10))}
            className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
          >
            {PERSIAN_MONTHS.map((mName, idx) => (
              <option key={idx + 1} value={idx + 1}>
                {toPersianDigits(idx + 1)} - {mName}
              </option>
            ))}
          </select>
        </div>

        {/* Year Selector */}
        <div>
          <span className="block text-[10px] text-slate-400 font-medium mb-0.5">سال</span>
          <select
            value={year}
            disabled={disabled}
            onChange={(e) => handleYearChange(parseInt(e.target.value, 10))}
            className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs font-bold font-mono text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {toPersianDigits(y)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
