import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  User,
  Mail,
  Phone,
  BookOpen,
  Award,
  Layers,
  Calendar,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  GraduationCap,
  ShieldCheck,
  Printer,
  Sparkles,
  Edit3,
  Save,
  Clock,
  History,
  Activity,
  Upload,
  Camera,
  Check,
} from 'lucide-react';
import { toPersianDigits, getCurrentJalaliDate } from '../../utils/persian';

export const TeacherProfileView: React.FC = () => {
  const { currentTeacher, user, currentUser, updatePassword } = useAuth();
  const { classes, subjects, students, grades, homeworks, auditLogs, updateTeacherProfile } = useData();

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
    avatarUrl: user?.avatarUrl || '',
    assignedClassIds: ['c1', 'c2', 'c3'],
    assignedSubjectIds: ['s1', 's2', 's8'],
    isActive: true,
    firstLogin: false,
  };

  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: activeTeacher.firstName,
    lastName: activeTeacher.lastName,
    phone: activeTeacher.phone || '09122222222',
    email: activeTeacher.email || 'teacher@padideh.sch.ir',
    specialty: activeTeacher.specialty || '',
    degree: activeTeacher.degree || '',
    bio: activeTeacher.bio || 'مدرس ارشد دوره اول متوسطه مجتمع استعدادهای درخشان پدیده دانش با بیش از ۱۵ سال سابقه تدریس تخصصی.',
    avatarUrl: activeTeacher.avatarUrl || '',
  });
  const [infoMsg, setInfoMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const assignedClasses = classes.filter((c) =>
    (activeTeacher.assignedClassIds || []).includes(c.id) ||
    (activeTeacher.assignedClassIds || []).includes(c.name)
  );

  const assignedSubjects = subjects.filter((s) =>
    (activeTeacher.assignedSubjectIds || []).includes(s.id) ||
    (activeTeacher.assignedSubjectIds || []).includes(s.title) ||
    s.title.includes(activeTeacher.specialty)
  );

  const totalStudents = assignedClasses.reduce((sum, c) => {
    const count = students.filter((s) => s.classId === c.id || s.className === c.name).length;
    return sum + count;
  }, 0);

  const teacherGradesCount = grades.filter((g) =>
    assignedSubjects.some((s) => s.id === g.subjectId)
  ).length;

  // Filter Teacher's Activity Logs
  const teacherLogs = auditLogs.filter(
    (l) => l.userId === activeTeacher.userId || l.userId === activeTeacher.id || l.userRole === 'teacher'
  ).slice(0, 6);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setInfoMsg({ type: 'error', text: 'حجم تصویر نباید بیشتر از ۲ مگابایت باشد.' });
        return;
      }
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        setProfileForm((prev) => ({ ...prev, avatarUrl: base64 }));
        try {
          await updateTeacherProfile(activeTeacher.id, { avatarUrl: base64 });
          setInfoMsg({ type: 'success', text: 'تصویر پروفایل دبیر با موفقیت به‌روزرسانی شد.' });
        } catch {
          setInfoMsg({ type: 'error', text: 'خطا در بارگذاری تصویر.' });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfileInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setInfoMsg(null);
    try {
      await updateTeacherProfile(activeTeacher.id, profileForm);
      setInfoMsg({ type: 'success', text: 'اطلاعات با موفقیت در پایگاه داده ذخیره شد.' });
      setIsEditingInfo(false);
    } catch {
      setInfoMsg({ type: 'error', text: 'خطا در ذخیره اطلاعات در پایگاه داده.' });
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword.length < 4) {
      setPasswordMsg({ type: 'error', text: 'کلمه عبور جدید باید حداقل ۴ رقم یا کاراکتر باشد.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'تکرار کلمه عبور جدید با آن مطابقت ندارد.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await updatePassword(newPassword);
      if (res.success) {
        setPasswordMsg({ type: 'success', text: 'کلمه عبور با موفقیت به‌روزرسانی شد.' });
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMsg({ type: 'error', text: res.error || 'خطا در تغییر کلمه عبور.' });
      }
    } catch {
      setPasswordMsg({ type: 'error', text: 'خطا در برقراری ارتباط با سامانه.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 text-right max-w-7xl mx-auto"
      dir="rtl"
    >
      {/* Profile Header Hero */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
          
          {/* Avatar with Upload Badge */}
          <div className="relative group">
            {profileForm.avatarUrl ? (
              <img
                src={profileForm.avatarUrl}
                alt={`${profileForm.firstName} ${profileForm.lastName}`}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover shadow-xl shadow-blue-600/20 border-4 border-white dark:border-slate-800 shrink-0"
              />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-3xl sm:text-4xl shadow-xl shadow-blue-600/30 border-4 border-white dark:border-slate-800 shrink-0">
                {profileForm.firstName.charAt(0)}
              </div>
            )}

            <label className="absolute -bottom-2 -left-2 w-9 h-9 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-lg cursor-pointer transition-transform group-hover:scale-105">
              <Camera className="w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex-1 text-center md:text-right space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-200/60 dark:border-blue-800">
              <Sparkles className="w-3.5 h-3.5" />
              <span>هیئت علمی مجتمع استعدادهای درخشان پدیده دانش</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {profileForm.firstName} {profileForm.lastName}
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
              تخصص آموزشی: <strong className="text-slate-700 dark:text-slate-200">{profileForm.specialty || 'مدرس ارشد'}</strong> • مدرک: <strong className="text-slate-700 dark:text-slate-200">{profileForm.degree || 'کارشناسی ارشد'}</strong>
            </p>

            <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-3 text-xs text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                کد ملی: <strong className="font-mono text-slate-900 dark:text-white">{toPersianDigits(activeTeacher.nationalId)}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-blue-600" />
                تلفن همراه: <strong className="font-mono text-slate-900 dark:text-white">{toPersianDigits(profileForm.phone)}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-purple-600" />
                پست الکترونیک: <strong className="font-mono text-slate-900 dark:text-white">{profileForm.email}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-500" />
                آخرین ورود: <strong className="font-mono text-slate-900 dark:text-white">{toPersianDigits(getCurrentJalaliDate())}</strong>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => setIsEditingInfo(!isEditingInfo)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-colors cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>{isEditingInfo ? 'بستن فرم ویرایش' : 'ویرایش مشخصات'}</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>چاپ کارنامه دبیر</span>
            </button>
          </div>
        </div>

        {/* Edit Info Form Dropdown */}
        {isEditingInfo && (
          <form onSubmit={handleSaveProfileInfo} className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-bold">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1">نام:</label>
              <input
                type="text"
                value={profileForm.firstName}
                onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1">نام خانوادگی:</label>
              <input
                type="text"
                value={profileForm.lastName}
                onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1">شماره تماس همراه:</label>
              <input
                type="text"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1">پست الکترونیک:</label>
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1">تخصص آموزشی:</label>
              <input
                type="text"
                value={profileForm.specialty}
                onChange={(e) => setProfileForm({ ...profileForm, specialty: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1">مدرک تحصیلی:</label>
              <input
                type="text"
                value={profileForm.degree}
                onChange={(e) => setProfileForm({ ...profileForm, degree: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-slate-700 dark:text-slate-300 mb-1">معرفی کوتاه و سوابق آموزشی:</label>
              <textarea
                rows={2}
                value={profileForm.bio}
                onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3 flex items-center justify-between pt-2">
              {infoMsg && (
                <span className={`text-xs font-bold ${infoMsg.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {infoMsg.text}
                </span>
              )}
              <button
                type="submit"
                className="mr-auto flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>ذخیره تغییرات مشخصات</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 4 Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">کلاس‌های تدریس</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
            {toPersianDigits(assignedClasses.length)} <span className="text-xs font-normal text-slate-400">کلاس</span>
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">گروه‌های درسی مصوب</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">عناوین درسی</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono">
            {toPersianDigits(assignedSubjects.length)} <span className="text-xs font-normal text-slate-400">عنوان</span>
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">دروس تخصصی</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">دانش‌آموزان</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {toPersianDigits(totalStudents)} <span className="text-xs font-normal text-slate-400">نفر</span>
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">تحت آموزش مستقیم</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">نمرات ثبت‌شده</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
            {toPersianDigits(teacherGradesCount)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">ارزشیابی‌های ثبت‌شده</p>
        </div>
      </div>

      {/* Main Content: Assigned Classes, Security, and Activity Logs */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Assigned Classes Details (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>کلاس‌ها و دروس تخصیص‌یافته در سال تحصیلی ۱۴۰۴–۱۴۰۵</span>
            </h3>

            <div className="space-y-3">
              {assignedClasses.map((cls) => {
                const count = students.filter((s) => s.classId === cls.id || s.className === cls.name).length;
                return (
                  <div
                    key={cls.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{cls.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        پایه تحصیلی: {cls.gradeLevel} • اتاق: {toPersianDigits(cls.roomNumber || '۱۰۱')}
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-xs">
                      {toPersianDigits(count)} دانش‌آموز
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">عناوین درسی مصوب تحت تدریس:</h4>
              <div className="flex flex-wrap gap-2">
                {assignedSubjects.map((s) => (
                  <span
                    key={s.id}
                    className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-bold"
                  >
                    {s.title} (ضریب {toPersianDigits(s.coefficient)})
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Activity Logs (Real LMS Feature) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <History className="w-4 h-4 text-blue-600" />
              <span>گزارش آخرین فعالیت‌ها و رویدادهای آموزشی دبیر</span>
            </h3>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {teacherLogs.length > 0 ? (
                teacherLogs.map((log) => (
                  <div key={log.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Activity className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200">{log.action}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{log.details}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {toPersianDigits(log.timestamp.slice(0, 10))}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  هنوز فعالیتی برای این دوره ثبت نشده است.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Security & Password Settings (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 h-fit">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-500" />
              <span>امنیت و تغییر کلمه عبور</span>
            </h3>
            <button
              onClick={() => setShowPasswordSection(!showPasswordSection)}
              className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
            >
              {showPasswordSection ? 'بستن فرم' : 'تغییر رمز'}
            </button>
          </div>

          {passwordMsg && (
            <div
              className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                passwordMsg.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950 text-rose-700 border border-rose-200'
              }`}
            >
              {passwordMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{passwordMsg.text}</span>
            </div>
          )}

          {showPasswordSection ? (
            <form onSubmit={handlePasswordChange} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  کلمه عبور جدید:
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="حداقل ۴ کاراکتر..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  تکرار کلمه عبور جدید:
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="تکرار دقیق کلمه عبور..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'در حال ذخیره...' : 'ذخیره کلمه عبور جدید'}
              </button>
            </form>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <p>
                برای حفظ امنیت اطلاعات آموزشی دانش‌آموزان و سوابق ثبت نمرات، توصیه می‌شود هر ترم رمز عبور خود را به‌روزرسانی نمایید.
              </p>
              <button
                onClick={() => setShowPasswordSection(true)}
                className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                جهت تغییر کلمه عبور کلیک کنید &larr;
              </button>
            </div>
          )}

          {/* Account Status Badge */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-bold">وضعیت پرونده دبیر:</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] flex items-center gap-1">
                <Check className="w-3 h-3" />
                فعال و مجاز به تدریس
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 dark:text-slate-400">
              <span>کد پرسنلی:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{toPersianDigits(activeTeacher.personnelCode || 'T-8492')}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
