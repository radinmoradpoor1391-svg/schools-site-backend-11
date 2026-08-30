import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { StudentAcademicProgress } from '../common/StudentAcademicProgress';
import { Award, Sparkles, Printer, User, School, Calendar } from 'lucide-react';
import { toPersianDigits } from '../../utils/persian';

export const StudentAcademicProgressView: React.FC = () => {
  const { currentStudent, user, currentUser } = useAuth();
  const { grades, subjects } = useData();

  const activeStudent = currentStudent || {
    id: user?.id || currentUser?.id || 'std-default',
    userId: user?.id || currentUser?.id || 'u-default',
    nationalId: user?.nationalId || '0012345678',
    firstName: user?.firstName || 'دانش‌آموز',
    lastName: user?.lastName || 'عزیز',
    fatherName: 'احمد',
    classId: 'c1',
    className: 'کلاس ۱۰۱ (هفتم الف)',
    gradeLevel: 'هفتم',
    studentCode: '۴۰۳۰۰۱',
    parentPhone: '09120000000',
    isActive: true,
    firstLogin: false,
  };

  return (
    <div className="space-y-6 text-right max-w-7xl mx-auto" dir="rtl">
      {/* Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <Award className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              گزارش جامع پیشرفت تحصیلی و روند ارتقای نمرات
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-2">
            <span className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>
                {activeStudent.firstName} {activeStudent.lastName}
              </span>
            </span>
            <span className="opacity-40">•</span>
            <span className="flex items-center gap-1">
              <School className="w-3.5 h-3.5 text-blue-600" />
              <span>کلاس: {activeStudent.className}</span>
            </span>
            <span className="opacity-40">•</span>
            <span>
              کد دانش‌آموزی: <strong className="font-mono">{toPersianDigits(activeStudent.studentCode)}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>چاپ گزارش نمودار</span>
          </button>
        </div>
      </div>

      <StudentAcademicProgress
        student={activeStudent}
        grades={grades}
        subjects={subjects}
      />
    </div>
  );
};

