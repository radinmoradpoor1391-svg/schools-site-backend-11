import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import {
  Briefcase,
  Plus,
  Search,
  KeyRound,
  UserCheck,
  UserX,
  Edit2,
  Trash2,
  X,
  BookOpen,
  Layers,
  Sparkles,
  CheckCircle2,
  Phone,
  GraduationCap,
  Eye,
  EyeOff,
  ShieldCheck,
  School,
  Check,
} from 'lucide-react';
import { toPersianDigits, toEnglishDigits } from '../../utils/persian';
import { Teacher } from '../../types';
import { AdminConfirmDialog } from './AdminConfirmDialog';

export const AdminTeacherManagement: React.FC = () => {
  const {
    teachers,
    classes,
    subjects,
    addTeacher,
    updateTeacher,
    deleteTeacher,
    toggleTeacherActive,
    resetTeacherPassword,
  } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [specialty, setSpecialty] = useState('ادبیات فارسی و نگارش');
  const [degree, setDegree] = useState('کارشناسی ارشد');
  const [personnelCode, setPersonnelCode] = useState('');
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered teachers list
  const filteredTeachers = teachers.filter((t) => {
    const q = (searchQuery || '').trim().toLowerCase();
    const matchesSearch =
      !q ||
      (t.firstName?.toLowerCase() || '').includes(q) ||
      (t.lastName?.toLowerCase() || '').includes(q) ||
      (t.specialty?.toLowerCase() || '').includes(q) ||
      (t.personnelCode?.toLowerCase() || '').includes(q) ||
      (t.nationalId || '').includes(toEnglishDigits(q)) ||
      (t.phone || '').includes(toEnglishDigits(q));

    const matchesSubject =
      selectedSubjectFilter === 'all' ||
      (t.assignedSubjectIds || []).includes(selectedSubjectFilter) ||
      (t.assignedSubjectIds || []).some((subId) => {
        const sub = subjects.find((s) => s.id === subId);
        return sub && (sub.id === selectedSubjectFilter || sub.title === selectedSubjectFilter);
      });

    const matchesClass =
      selectedClassFilter === 'all' ||
      (t.assignedClassIds || []).includes(selectedClassFilter);

    return matchesSearch && matchesSubject && matchesClass;
  });

  const handleOpenAdd = () => {
    setEditingTeacher(null);
    setFirstName('');
    setLastName('');
    setNationalId('');
    setUsername('');
    setPassword('123456');
    setShowPassword(false);
    setPhone('');
    setSpecialty('ادبیات فارسی و نگارش');
    setDegree('کارشناسی ارشد');
    setPersonnelCode(`T-${Math.floor(1000 + Math.random() * 9000)}`);
    setSelectedClassIds(classes.slice(0, 2).map((c) => c.id));
    setSelectedSubjectIds(subjects.slice(0, 2).map((s) => s.id));
    setFormError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (t: Teacher) => {
    setEditingTeacher(t);
    setFirstName(t.firstName || '');
    setLastName(t.lastName || '');
    setNationalId(t.nationalId || '');
    setUsername(t.username || t.nationalId || '');
    setPassword('');
    setShowPassword(false);
    setPhone(t.phone || '');
    setSpecialty(t.specialty || 'عمومی');
    setDegree(t.degree || 'کارشناسی ارشد');
    setPersonnelCode(t.personnelCode || `T-${Math.floor(1000 + Math.random() * 9000)}`);
    setSelectedClassIds(t.assignedClassIds || []);

    // Resolve subject IDs from teacher's subject IDs or match subject titles
    const currentSubjectIds: string[] = [];
    (t.assignedSubjectIds || []).forEach((sId) => {
      const foundSub = subjects.find((s) => s.id === sId || s.title === sId);
      if (foundSub) {
        currentSubjectIds.push(foundSub.id);
      } else {
        currentSubjectIds.push(sId);
      }
    });
    setSelectedSubjectIds(
      currentSubjectIds.length > 0
        ? currentSubjectIds
        : (subjects.slice(0, 1).map((s) => s.id))
    );

    setFormError(null);
    setShowModal(true);
  };

  const handleToggleSubject = (subjectId: string) => {
    if (selectedSubjectIds.includes(subjectId)) {
      setSelectedSubjectIds(selectedSubjectIds.filter((id) => id !== subjectId));
    } else {
      setSelectedSubjectIds([...selectedSubjectIds, subjectId]);
    }
  };

  const handleToggleClass = (classId: string) => {
    if (selectedClassIds.includes(classId)) {
      setSelectedClassIds(selectedClassIds.filter((id) => id !== classId));
    } else {
      setSelectedClassIds([...selectedClassIds, classId]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanNationalId = toEnglishDigits(nationalId).trim();
    const cleanPhone = toEnglishDigits(phone).trim();
    const cleanUsername = toEnglishDigits(username).trim() || cleanNationalId;

    if (!firstName.trim() || !lastName.trim()) {
      setFormError('لطفاً نام و نام خانوادگی دبیر را وارد نمایید.');
      return;
    }

    if (!cleanNationalId || cleanNationalId.length !== 10) {
      setFormError('کد ملی باید دقیقاً ۱۰ رقم باشد.');
      return;
    }

    if (selectedSubjectIds.length === 0) {
      setFormError('لطفاً حداقل یک عنوان درسی را برای تدریس دبیر از لیست انتخاب فرمایید.');
      return;
    }

    if (selectedClassIds.length === 0) {
      setFormError('لطفاً حداقل یک کلاس درسی را به دبیر انتساب دهید.');
      return;
    }

    const firstSubTitle = subjects.find((s) => s.id === selectedSubjectIds[0])?.title || 'عمومی';

    try {
      setIsSubmitting(true);
      if (editingTeacher) {
        const updatePayload: any = {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          nationalId: cleanNationalId,
          username: cleanUsername,
          personnelCode: personnelCode.trim(),
          specialty: specialty.trim() || firstSubTitle,
          degree,
          phone: cleanPhone,
          assignedClassIds: selectedClassIds,
          assignedSubjectIds: selectedSubjectIds,
        };
        if (password.trim()) {
          updatePayload.password = password.trim();
        }
        await updateTeacher(editingTeacher.id, updatePayload);
        setActionSuccessMsg(`اطلاعات دبیر ارجمند «${firstName} ${lastName}» با موفقیت به‌روزرسانی شد.`);
      } else {
        await addTeacher({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          nationalId: cleanNationalId,
          username: cleanUsername,
          password: password.trim() || '123456',
          personnelCode: personnelCode.trim(),
          specialty: specialty.trim() || firstSubTitle,
          degree,
          phone: cleanPhone,
          assignedClassIds: selectedClassIds,
          assignedSubjectIds: selectedSubjectIds,
        });
        setActionSuccessMsg(`دبیر جدید «${firstName} ${lastName}» با نام کاربری ${toPersianDigits(cleanUsername)} با موفقیت در سامانه ثبت گردید.`);
      }
      setShowModal(false);
      setTimeout(() => setActionSuccessMsg(null), 5000);
    } catch (err: any) {
      setFormError(err.message || 'خطا در ذخیره اطلاعات دبیر.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (teacherToDelete) {
      try {
        await deleteTeacher(teacherToDelete.id);
        setActionSuccessMsg(`پرونده دبیر «${teacherToDelete.firstName} ${teacherToDelete.lastName}» از سامانه حذف شد.`);
        setTeacherToDelete(null);
        setTimeout(() => setActionSuccessMsg(null), 4000);
      } catch (err: any) {
        setActionErrorMsg(err.message || 'خطا در حذف دبیر.');
        setTimeout(() => setActionErrorMsg(null), 4000);
      }
    }
  };

  const handleResetPassword = async (t: Teacher) => {
    try {
      await resetTeacherPassword(t.id);
      setActionSuccessMsg(
        `رمز عبور دبیر «${t.firstName} ${t.lastName}» با موفقیت به کد ملی (${toPersianDigits(t.nationalId)}) بازنشانی شد.`
      );
      setTimeout(() => setActionSuccessMsg(null), 5000);
    } catch (err: any) {
      setActionErrorMsg(err.message || 'خطا در بازنشانی کلمه عبور.');
      setTimeout(() => setActionErrorMsg(null), 4000);
    }
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            مدیریت دبیران و تخصیص دروس
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            ثبت اساتید با دروس مصوب دوره اول متوسطه (پایه‌های هفتم، هشتم و نهم)، تخصیص کلاس‌ها و کنترل دسترسی‌ها
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>افزودن دبیر جدید</span>
        </button>
      </div>

      {/* Success / Error Alerts */}
      {actionSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {actionErrorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
          <X className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{actionErrorMsg}</span>
        </div>
      )}

      {/* Search & Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 absolute right-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در نام دبیر، کد پرسنلی، کد ملی، شماره موبایل..."
            className="w-full pr-10 pl-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100 placeholder-slate-400"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={selectedSubjectFilter}
            onChange={(e) => setSelectedSubjectFilter(e.target.value)}
            className="w-full py-2 px-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
          >
            <option value="all">همه عناوین درسی</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                درس {s.title} ({s.gradeLevel || 'مشترک'})
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="w-full py-2 px-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
          >
            <option value="all">همه کلاس‌های درس</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                کلاس {c.name} (پایه {c.gradeLevel})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Teachers Grid */}
      {filteredTeachers.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800">
          <Briefcase className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">دبیری با این مشخصات یافت نشد</h3>
          <p className="text-xs text-slate-400 mt-1">
            می‌توانید با دکمه «افزودن دبیر جدید» مشخصات دبیر جدید را وارد نمایید.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeachers.map((t) => {
            const tClasses = classes.filter((c) => (t.assignedClassIds || []).includes(c.id));
            const tSubjectTitles = (t.assignedSubjectIds || []).map((sId) => {
              const found = subjects.find((s) => s.id === sId || s.title === sId);
              return found ? found.title : 'درس مصوب';
            });

            return (
              <div
                key={t.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-black text-sm border border-blue-100 dark:border-blue-900">
                        {t.firstName?.[0] || 'د'}
                        {t.lastName?.[0] || 'ب'}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                          {t.firstName} {t.lastName}
                        </h3>
                        <p className="text-[11px] text-blue-600 dark:text-blue-400 font-bold">
                          {t.specialty || 'دبیر دوره اول متوسطه'}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        t.isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                      }`}
                    >
                      {t.isActive ? 'فعال' : 'غیرفعال'}
                    </span>
                  </div>

                  {/* Specs */}
                  <div className="text-xs space-y-1.5 text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between">
                      <span>کد ملی:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {toPersianDigits(t.nationalId)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>نام کاربری:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {toPersianDigits(t.username || t.nationalId)}
                      </span>
                    </div>
                    {t.phone && (
                      <div className="flex justify-between">
                        <span>شماره تماس:</span>
                        <span className="font-mono text-slate-800 dark:text-slate-200">
                          {toPersianDigits(t.phone)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>کلاس‌های تخصیص‌یافته:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {tClasses.length > 0
                          ? tClasses.map((c) => c.name).join('، ')
                          : 'هنوز کلاسی تخصیص نیافته'}
                      </span>
                    </div>
                  </div>

                  {/* Badges of Predefined Subjects */}
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] text-slate-400 block">دروس تدریس مصوب:</span>
                    <div className="flex flex-wrap gap-1">
                      {tSubjectTitles.map((title, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900"
                        >
                          {title}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <button
                    onClick={() => handleOpenEdit(t)}
                    className="flex-1 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold transition-colors cursor-pointer text-center"
                  >
                    ویرایش پرونده
                  </button>

                  <button
                    onClick={() => handleResetPassword(t)}
                    className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900 text-amber-600 dark:text-amber-300 cursor-pointer"
                    title="بازنشانی رمز عبور به کد ملی"
                  >
                    <KeyRound className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => toggleTeacherActive(t.id)}
                    className={`p-2 rounded-xl cursor-pointer transition-colors ${
                      t.isActive
                        ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100'
                        : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100'
                    }`}
                    title={t.isActive ? 'تعلیق حساب' : 'فعال‌سازی حساب'}
                  >
                    {t.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => setTeacherToDelete(t)}
                    className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 cursor-pointer"
                    title="حذف دبیر"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <AdminConfirmDialog
        isOpen={!!teacherToDelete}
        title="حذف دبیر"
        message={`آیا از حذف پرونده همکار گرامی «${teacherToDelete?.firstName} ${teacherToDelete?.lastName}» از سامانه مدرسه اطمینان دارید؟`}
        confirmLabel="حذف دائم دبیر"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setTeacherToDelete(null)}
      />

      {/* Add / Edit Teacher Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 text-right space-y-4 animate-in fade-in zoom-in duration-150">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 left-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              {editingTeacher ? `ویرایش پرونده دبیر: ${editingTeacher.firstName} ${editingTeacher.lastName}` : 'ثبت نام دبیر جدید در سامانه'}
            </h3>

            {formError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold rounded-xl">
                {formError}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* Personal Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">نام:</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    placeholder="مثال: علی"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">نام خانوادگی:</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    placeholder="مثال: محمدی"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* National ID, Username, Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">کد ملی (۱۰ رقم):</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={nationalId}
                    onChange={(e) => {
                      setNationalId(e.target.value);
                      if (!username) setUsername(e.target.value);
                    }}
                    required
                    maxLength={10}
                    placeholder="2222222222"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-center text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">نام کاربری:</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="پیش‌فرض: کد ملی"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-center text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">شماره موبایل:</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="09120000000"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-center text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Password & Specialty */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {editingTeacher ? 'تغییر رمز عبور (اختیاری):' : 'کلمه عبور دبیر:'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      dir="ltr"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={editingTeacher ? 'در صورت عدم تغییر خالی بگذارید' : 'پیش‌فرض: 123456'}
                      className="w-full p-2.5 pl-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-left text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">رشته تخصصی / تخصص:</label>
                  <input
                    type="text"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    placeholder="مثال: ریاضیات، ادبیات، علوم تجربی"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Subjects Multi-Select from Database */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    انتخاب دروس تدریس از عناوین درسی ثبت شده در سامانه:
                  </label>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                    {toPersianDigits(selectedSubjectIds.length)} درس انتخاب شده
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  عناوین مصوب دوره اول متوسطه (پایه‌های هفتم، هشتم و نهم):
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-1 max-h-56 overflow-y-auto pr-1">
                  {subjects.map((sub) => {
                    const isSelected = selectedSubjectIds.includes(sub.id);
                    return (
                      <button
                        type="button"
                        key={sub.id}
                        onClick={() => handleToggleSubject(sub.id)}
                        className={`flex items-center justify-between p-2 rounded-xl text-right transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-300'
                        }`}
                      >
                        <div>
                          <p className="font-bold text-xs">{sub.title}</p>
                          <p className={`text-[10px] ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                            ضریب {toPersianDigits(sub.coefficient || 2)} ({sub.gradeLevel || 'مشترک'})
                          </p>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Assigned Classes (Middle School Classes) */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <School className="w-4 h-4 text-blue-600" />
                    انتساب کلاس‌های درس (پایه‌های هفتم، هشتم و نهم):
                  </label>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                    {toPersianDigits(selectedClassIds.length)} کلاس انتخاب شده
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 max-h-48 overflow-y-auto pr-1">
                  {classes.map((cls) => {
                    const isSelected = selectedClassIds.includes(cls.id);
                    return (
                      <button
                        type="button"
                        key={cls.id}
                        onClick={() => handleToggleClass(cls.id)}
                        className={`flex items-center justify-between p-2.5 rounded-xl text-right transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-300'
                        }`}
                      >
                        <div>
                          <p className="font-bold text-xs">{cls.name}</p>
                          <p className={`text-[10px] ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                            پایه {cls.gradeLevel} (اتاق {toPersianDigits(cls.roomNumber || '۱۰۱')})
                          </p>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-4 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white shadow-md shadow-blue-600/20 cursor-pointer transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : editingTeacher ? (
                    'ذخیره تغییرات دبیر'
                  ) : (
                    'ثبت دبیر در سامانه'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="py-3 px-5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
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

export default AdminTeacherManagement;
