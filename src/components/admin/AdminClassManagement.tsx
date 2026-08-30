import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import {
  Layers,
  BookOpen,
  Edit2,
  X,
  Users,
  GraduationCap,
  Briefcase,
  Calendar,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  School,
  CheckCircle2,
  Clock,
  Eye,
  Award,
} from 'lucide-react';
import { toPersianDigits, formatScore } from '../../utils/persian';
import { SchoolClass, Subject, Teacher, Student } from '../../types';
import { calculateClassOverallGPA, calculateStudentGPA } from '../../utils/academicCalculations';

export const AdminClassManagement: React.FC = () => {
  const { classes, subjects, students, teachers, grades, attendance, updateClass } = useData();

  const [activeTab, setActiveTab] = useState<'classes' | 'subjects'>('classes');

  // Selected Class for Details Dashboard
  const [selectedClassForDashboard, setSelectedClassForDashboard] = useState<SchoolClass | null>(null);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);
  const [className, setClassName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [mentorTeacherId, setMentorTeacherId] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const handleOpenEditClass = (c: SchoolClass, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingClass(c);
    setClassName(c.name);
    setRoomNumber(c.roomNumber || '۱۰۱');
    // Find supervisor if assigned or find teacher assigned to this class
    const assignedTeachers = teachers.filter((t) => (t.assignedClassIds || []).includes(c.id));
    setMentorTeacherId(assignedTeachers[0]?.id || '');
    setShowEditModal(true);
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass) return;

    try {
      await updateClass(editingClass.id, {
        name: className.trim(),
        roomNumber: roomNumber.trim(),
      });
      setActionSuccessMsg(`اطلاعات کلاس «${className}» با موفقیت به‌روزرسانی شد.`);
      setShowEditModal(false);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'خطا در ویرایش کلاس');
    }
  };

  // Helper to compute class attendance rate
  const getClassAttendanceStats = (classId: string, classStudents: Student[]) => {
    const studentIds = classStudents.map((s) => s.id);
    const classRecords = attendance.filter(
      (a) => a.classId === classId || studentIds.includes(a.studentId)
    );

    if (classRecords.length === 0) {
      return { rate: 0, total: 0, present: 0, absent: 0 };
    }

    const presentCount = classRecords.filter((a) => a.status === 'present').length;
    const rate = +( (presentCount / classRecords.length) * 100 ).toFixed(1);
    return {
      rate,
      total: classRecords.length,
      present: presentCount,
      absent: classRecords.length - presentCount,
    };
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <School className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            مدیریت کلاس‌ها و برنامه آموزشی دوره اول متوسطه
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            ساختار ۶ کلاسه مصوب (پایه‌های هفتم، هشتم و نهم)، تخصیص دبیران، آمار تحصیلی و شاخص‌های کلاسی
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>ظرفیت ثابت: ۶ کلاس مصوب</span>
          </div>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('classes')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'classes'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>داشبورد و کلاس‌های آموزشی ({toPersianDigits(classes.length)})</span>
        </button>

        <button
          onClick={() => setActiveTab('subjects')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'subjects'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>بانک دروس مصوب متوسطه ({toPersianDigits(subjects.length)})</span>
        </button>
      </div>

      {/* Tab 1: Classes Grid */}
      {activeTab === 'classes' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {classes.map((cls) => {
            const classStudents = students.filter(
              (s) => s.classId === cls.id || s.className === cls.name
            );
            const classGPA = calculateClassOverallGPA(grades, subjects, classStudents);
            const attendanceStats = getClassAttendanceStats(cls.id, classStudents);
            const assignedTeachers = teachers.filter((t) =>
              (t.assignedClassIds || []).includes(cls.id)
            );

            return (
              <div
                key={cls.id}
                onClick={() => setSelectedClassForDashboard(cls)}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:border-blue-400 dark:hover:border-blue-600 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-xl text-xs font-black bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900">
                      پایه {cls.gradeLevel}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      اتاق {toPersianDigits(cls.roomNumber || '۱۰۱')}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                      {cls.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      دوره اول متوسطه • {cls.fieldOfStudy || 'آموزش عمومی'}
                    </p>
                  </div>

                  {/* Quick Dynamic Stats */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-2xl text-center">
                      <p className="text-[10px] text-slate-400">دانش‌آموزان</p>
                      <p className="text-xs font-black text-slate-900 dark:text-white font-mono mt-0.5">
                        {toPersianDigits(classStudents.length)}
                      </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-2xl text-center">
                      <p className="text-[10px] text-slate-400">معدل کلاسی</p>
                      <p className="text-xs font-black text-blue-600 dark:text-blue-400 font-mono mt-0.5">
                        {classGPA > 0 ? formatScore(classGPA) : '۰'}
                      </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-2xl text-center">
                      <p className="text-[10px] text-slate-400">حضور و غیاب</p>
                      <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                        {attendanceStats.rate > 0 ? `${toPersianDigits(attendanceStats.rate)}٪` : '۰٪'}
                      </p>
                    </div>
                  </div>

                  {/* Assigned Teachers Summary */}
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1">
                    <span className="flex items-center gap-1.5 text-[11px]">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                      اساتید تخصیص‌یافته:
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {toPersianDigits(assignedTeachers.length)} دبیر
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                  <button
                    onClick={() => setSelectedClassForDashboard(cls)}
                    className="flex-1 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>داشبورد جامع کلاس</span>
                  </button>

                  <button
                    onClick={(e) => handleOpenEditClass(cls, e)}
                    className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                    title="ویرایش نام و اتاق کلاس"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Tab 2: Predefined Middle School Subjects Table */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                فهرست ۱۳ عنوان درسی مصوب دوره اول متوسطه (پایه‌های ۷، ۸ و ۹)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                ضرایب استاندارد طبق مصوبات شورای عالی آموزش و پرورش جهت محاسبه معدل وزنی و صدور کارنامه
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">ردیف</th>
                  <th className="py-3 px-4">عنوان کتاب و سرفصل درسی</th>
                  <th className="py-3 px-4">کد درسی</th>
                  <th className="py-3 px-4 text-center">ضریب وزنی</th>
                  <th className="py-3 px-4">پایه تحصیلی</th>
                  <th className="py-3 px-4">نوع درس</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {subjects.map((sub, idx) => (
                  <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 text-center text-slate-400">{toPersianDigits(idx + 1)}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>{sub.title}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">{toPersianDigits(sub.code)}</td>
                    <td className="py-3 px-4 text-center font-black text-blue-600 font-mono text-sm">
                      {toPersianDigits(sub.coefficient || 2)}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{sub.gradeLevel || 'مشترک'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {sub.gradeLevel === 'نهم' ? 'تخصصی پایه نهم' : 'عمومی مشترک'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Class Details Dashboard Modal */}
      {selectedClassForDashboard && (() => {
        const cls = selectedClassForDashboard;
        const classStudents = students.filter(
          (s) => s.classId === cls.id || s.className === cls.name
        );
        const classGPA = calculateClassOverallGPA(grades, subjects, classStudents);
        const attendanceStats = getClassAttendanceStats(cls.id, classStudents);
        const assignedTeachers = teachers.filter((t) =>
          (t.assignedClassIds || []).includes(cls.id)
        );

        return (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 text-right space-y-6 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setSelectedClassForDashboard(null)}
                className="absolute top-6 left-6 p-2 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Dashboard Header */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-xl border border-blue-100 dark:border-blue-900">
                  <School className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>داشبورد تحلیلی: {cls.name}</span>
                    <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      پایه {cls.gradeLevel}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    اتاق آموزشی: {toPersianDigits(cls.roomNumber || '۱۰۱')} • شاخه: {cls.fieldOfStudy || 'عمومی'}
                  </p>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span>تعداد دانش‌آموزان:</span>
                  </p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-2">
                    {toPersianDigits(classStudents.length)} <span className="text-xs font-normal">نفر</span>
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span>میانگین معدل کلاسی:</span>
                  </p>
                  <p className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono mt-2">
                    {classGPA > 0 ? formatScore(classGPA) : '۰.۰۰'}
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-4 h-4 text-emerald-500" />
                    <span>نرخ حضور و غیاب:</span>
                  </p>
                  <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-2">
                    {attendanceStats.rate > 0 ? `${toPersianDigits(attendanceStats.rate)}٪` : '۰٪'}
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <Briefcase className="w-4 h-4 text-blue-500" />
                    <span>تعداد اساتید کلاس:</span>
                  </p>
                  <p className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono mt-2">
                    {toPersianDigits(assignedTeachers.length)} <span className="text-xs font-normal">دبیر</span>
                  </p>
                </div>
              </div>

              {/* Assigned Teachers and Subjects in this class */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  دبیران و دروس تدریس‌شده در این کلاس:
                </h4>

                {assignedTeachers.length === 0 ? (
                  <p className="text-xs text-slate-400">هنوز دبیری به این کلاس تخصیص داده نشده است.</p>
                ) : (
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {assignedTeachers.map((t) => {
                      const tSubjects = (t.assignedSubjectIds || []).map((sId) => {
                        const fromState = subjects.find((s) => s.id === sId || s.title === sId);
                        return fromState ? fromState.title : 'درس مصوب';
                      });

                      return (
                        <div
                          key={t.id}
                          className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-xs text-slate-900 dark:text-white">
                              {t.firstName} {t.lastName}
                            </p>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {toPersianDigits(t.nationalId)}
                            </span>
                          </div>
                          <p className="text-[11px] text-blue-600 dark:text-blue-400">
                            {t.specialty}
                          </p>
                          <div className="flex flex-wrap gap-1 pt-1">
                            {tSubjects.map((s, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Student Roster Table */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                  فهرست دانش‌آموزان ثبت‌نام‌شده ({toPersianDigits(classStudents.length)} نفر):
                </h4>

                {classStudents.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 font-bold">دانش‌آموزی در این کلاس ثبت‌نام نکرده است.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      می‌توانید از بخش «مدیریت دانش‌آموزان» دانش‌آموز جدید به این کلاس بیفزایید.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                        <tr>
                          <th className="py-2.5 px-3 w-10 text-center">ردیف</th>
                          <th className="py-2.5 px-3">نام و نام خانوادگی</th>
                          <th className="py-2.5 px-3">کد ملی</th>
                          <th className="py-2.5 px-3">نام پدر</th>
                          <th className="py-2.5 px-3 text-center">معدل کل</th>
                          <th className="py-2.5 px-3">وضعیت حساب</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {classStudents.map((std, idx) => {
                          const stdGPA = calculateStudentGPA(grades, subjects, std.id);
                          return (
                            <tr key={std.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <td className="py-2.5 px-3 text-center text-slate-400">{toPersianDigits(idx + 1)}</td>
                              <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                                {std.firstName} {std.lastName}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-300">
                                {toPersianDigits(std.nationalId)}
                              </td>
                              <td className="py-2.5 px-3 text-slate-500">{std.fatherName || 'ـ'}</td>
                              <td className="py-2.5 px-3 text-center font-mono font-bold text-blue-600 dark:text-blue-400">
                                {stdGPA.hasGrades ? formatScore(stdGPA.gpa) : 'بدون نمره'}
                              </td>
                              <td className="py-2.5 px-3">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    std.isActive !== false
                                      ? 'bg-emerald-50 text-emerald-600'
                                      : 'bg-rose-50 text-rose-600'
                                  }`}
                                >
                                  {std.isActive !== false ? 'فعال' : 'غیرفعال'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Close Button */}
              <div className="pt-2">
                <button
                  onClick={() => setSelectedClassForDashboard(null)}
                  className="w-full py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
                >
                  بستن پنجره داشبورد
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Edit Class Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 text-right space-y-4 animate-in fade-in zoom-in duration-150">
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-5 left-5 p-2 rounded-xl text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-blue-600" />
              <span>ویرایش مشخصات کلاس {editingClass?.name}</span>
            </h3>

            <form onSubmit={handleSaveClass} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">نام کلاس:</label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  required
                  placeholder="مثال: هفتم ۱"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">شماره اتاق / فضا:</label>
                <input
                  type="text"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="مثال: ۱۰۱"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-center text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">پایه تحصیلی:</label>
                <input
                  type="text"
                  disabled
                  value={`پایه ${editingClass?.gradeLevel || 'هفتم'}`}
                  className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-500 font-bold"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 cursor-pointer transition-all"
                >
                  ذخیره تغییرات کلاس
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="py-3 px-5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 transition-colors cursor-pointer"
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

export default AdminClassManagement;
