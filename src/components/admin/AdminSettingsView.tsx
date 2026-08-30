import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Settings,
  RefreshCw,
  Save,
  School,
  ShieldCheck,
  Database,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  Sparkles,
  BookOpen,
  Bell,
  Palette,
  Lock,
  Smartphone,
  Check,
} from 'lucide-react';
import { toPersianDigits, isStrictNationalIdValidationEnabled } from '../../utils/persian';

type SettingTab = 'school' | 'academic' | 'notifications' | 'appearance' | 'security';

export const AdminSettingsView: React.FC = () => {
  const { schoolConfig, updateSchoolConfig, resetDatabaseToDefault } = useData();
  const { theme, toggleTheme } = useTheme();
  const isStrictValidation = isStrictNationalIdValidationEnabled();

  const [activeTab, setActiveTab] = useState<SettingTab>('school');

  // School fields
  const [schoolName, setSchoolName] = useState(schoolConfig?.schoolName || 'مجتمع آموزشی و دبیرستان استعدادهای درخشان پدیده دانش');
  const [managerName, setManagerName] = useState(schoolConfig?.managerName || 'دکتر محمد رضایی');
  const [district, setDistrict] = useState(schoolConfig?.district || 'منطقه ۶ آموزش و پرورش');
  const [province, setProvince] = useState(schoolConfig?.province || 'تهران');
  const [academicYear, setAcademicYear] = useState(schoolConfig?.academicYear || '۱۴۰۴–۱۴۰۵');
  const [phone, setPhone] = useState(schoolConfig?.phone || '۰۲۱-۸۸۹۹۰۰۱۱');
  const [email, setEmail] = useState(schoolConfig?.email || 'info@padidehdanesh.ir');
  const [website, setWebsite] = useState(schoolConfig?.website || 'www.padidehdanesh.ir');
  const [motto, setMotto] = useState(schoolConfig?.motto || 'پیشگام در آموزش هوشمند، پژوهش‌محور و پرورش استعدادهای درخشان');
  const [address, setAddress] = useState(schoolConfig?.address || 'تهران، خیابان ولیعصر، مجتمع آموزشی پدیده دانش');

  // Academic fields
  const [passGrade, setPassGrade] = useState((schoolConfig?.passGrade ?? 10).toString());
  const [attendanceThreshold, setAttendanceThreshold] = useState((schoolConfig?.attendanceThreshold ?? 85).toString());
  const [maxAbsenceCount, setMaxAbsenceCount] = useState('3');
  const [continuousGradeWeight, setContinuousGradeWeight] = useState('40');
  const [finalGradeWeight, setFinalGradeWeight] = useState('60');

  // Notification fields
  const [smsAbsenceAlert, setSmsAbsenceAlert] = useState(true);
  const [smsReportCardRelease, setSmsReportCardRelease] = useState(true);
  const [smsLowGradeAlert, setSmsLowGradeAlert] = useState(false);
  const [smsApiKey, setSmsApiKey] = useState('kavenegar-padidehdanesh-live-9821');

  // Security fields
  const [sessionTimeout, setSessionTimeout] = useState('60');
  const [forceStrongPassword, setForceStrongPassword] = useState(true);

  useEffect(() => {
    if (schoolConfig) {
      setSchoolName(schoolConfig.schoolName || '');
      setManagerName(schoolConfig.managerName || '');
      setDistrict(schoolConfig.district || '');
      setProvince(schoolConfig.province || '');
      setAcademicYear(schoolConfig.academicYear || '');
      setPhone(schoolConfig.phone || '');
      setEmail(schoolConfig.email || '');
      setWebsite(schoolConfig.website || '');
      setMotto(schoolConfig.motto || '');
      setAddress(schoolConfig.address || '');
      setPassGrade((schoolConfig.passGrade ?? 10).toString());
      setAttendanceThreshold((schoolConfig.attendanceThreshold ?? 85).toString());
    }
  }, [schoolConfig]);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSchoolConfig({
      schoolName,
      managerName,
      district,
      province,
      academicYear,
      phone,
      email,
      website,
      motto,
      address,
      passGrade: parseFloat(passGrade) || 10,
      attendanceThreshold: parseFloat(attendanceThreshold) || 85,
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleReset = async () => {
    try {
      setIsResetting(true);
      await resetDatabaseToDefault();
      setResetConfirm(false);
      setResetSuccessMsg(true);
      setTimeout(() => setResetSuccessMsg(false), 4000);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6 text-right max-w-5xl mx-auto" dir="rtl">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <span>تنظیمات یکپارچه و مرکز کنترل سامانه هوشمند پدیده دانش</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            پیکربندی هویت مدرسه، قوانین آموزشی، درگاه پیامک، ظاهر پرتال و سطوح امنیت
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>تنظیمات سامانه با موفقیت ذخیره شدند و بلافاصله در تمامی پنل‌ها اعمال گردیدند.</span>
        </div>
      )}

      {resetSuccessMsg && (
        <div className="p-3.5 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span>پایگاه داده ابری سامانه با موفقیت به ۱۸۰ دانش‌آموز، ۱۵ دبیر و ۶ کلاس اولیه بازنشانی شد.</span>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('school')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'school'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <School className="w-4 h-4" />
          <span>مشخصات مدرسه</span>
        </button>

        <button
          onClick={() => setActiveTab('academic')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'academic'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>قوانین آموزشی و ارزشیابی</span>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'notifications'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>سامانه پیامک و اعلانات</span>
        </button>

        <button
          onClick={() => setActiveTab('appearance')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'appearance'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>ظاهر و قالب</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'security'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>امنیت و سطوح دسترسی</span>
        </button>
      </div>

      {/* Main Settings Form Container */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
        <form onSubmit={handleSave} className="space-y-6 text-xs">
          {/* Tab 1: School Identity */}
          {activeTab === 'school' && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    نام رسمی مجتمع آموزشی / دبیرستان:
                  </label>
                  <input
                    type="text"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    required
                    className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    نام مدیریت مجتمع:
                  </label>
                  <input
                    type="text"
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    required
                    className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    منطقه آموزش و پرورش:
                  </label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">استان / شهر:</label>
                  <input
                    type="text"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">سال تحصیلی فعال:</label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-center font-bold"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">پست الکترونیک (ایمیل):</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-left"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">آدرس وب‌سایت آموزشگاه:</label>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-left"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">شماره تلفن تماس مدرسه:</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-center"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">شعار و چشم‌انداز آموزشی:</label>
                  <input
                    type="text"
                    value={motto}
                    onChange={(e) => setMotto(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">نشانی پستی کامل مدرسه:</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>
          )}

          {/* Tab 2: Academic Rules */}
          {activeTab === 'academic' && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    کف نمره قبولی در کارنامه رسمی:
                  </label>
                  <input
                    type="number"
                    value={passGrade}
                    onChange={(e) => setPassGrade(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-center font-bold"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">نمرات زیر این عدد در کارنامه قرمز رنگ خواهند شد.</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    آستانه هشدار غیبت کلاسی (درصد):
                  </label>
                  <input
                    type="number"
                    min={50}
                    max={100}
                    value={attendanceThreshold}
                    onChange={(e) => setAttendanceThreshold(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-center font-bold"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">درصد حضور کمتر از این مقدار اخطار آموزشی تولید می‌کند.</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    حداکثر تعداد غیبت مجاز (جلسه):
                  </label>
                  <input
                    type="number"
                    value={maxAbsenceCount}
                    onChange={(e) => setMaxAbsenceCount(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-center font-bold"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">پس از این تعداد غیبت پیامک خودکار به اولیا ارسال می‌شود.</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    وزن ارزشیابی مستمر (درصد):
                  </label>
                  <input
                    type="number"
                    value={continuousGradeWeight}
                    onChange={(e) => setContinuousGradeWeight(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-center font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    وزن آزمون پایانی نوبت (درصد):
                  </label>
                  <input
                    type="number"
                    value={finalGradeWeight}
                    onChange={(e) => setFinalGradeWeight(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-center font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Notification & SMS */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  کلید API وب‌سرویس پیامکی مدرسه (SMS Gateway):
                </label>
                <input
                  type="text"
                  value={smsApiKey}
                  onChange={(e) => setSmsApiKey(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-left"
                />
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={smsAbsenceAlert}
                    onChange={(e) => setSmsAbsenceAlert(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white text-xs">
                      ارسال پیامک لحظه‌ای غیبت دانش‌آموز به تلفن همراه اولیا
                    </span>
                    <p className="text-[11px] text-slate-400">به محض ثبت غیبت در زنگ اول توسط دبیر یا ناظم</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={smsReportCardRelease}
                    onChange={(e) => setSmsReportCardRelease(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white text-xs">
                      اطلاع‌رسانی پیامکی صدور کارنامه‌های ماهانه و نوبت
                    </span>
                    <p className="text-[11px] text-slate-400">همراه با لینک مستقیم مشاهده کارنامه برخط</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={smsLowGradeAlert}
                    onChange={(e) => setSmsLowGradeAlert(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white text-xs">
                      هشدار خودکار افت معدل به مشاور پایه
                    </span>
                    <p className="text-[11px] text-slate-400">در صورت افت بیش از ۱ نمره نسبت به ماه گذشته</p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Tab 4: Appearance & Display */}
          {activeTab === 'appearance' && (
            <div className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2">
                  حالت نمایش و تم پرتال:
                </label>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div
                    onClick={theme === 'dark' ? toggleTheme : undefined}
                    className={`p-4 rounded-2xl border cursor-pointer flex items-center justify-between ${
                      theme === 'light'
                        ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                      ☀️ تم روشن استاندارد (Light Theme)
                    </span>
                    {theme === 'light' && <Check className="w-4 h-4 text-blue-600" />}
                  </div>

                  <div
                    onClick={theme === 'light' ? toggleTheme : undefined}
                    className={`p-4 rounded-2xl border cursor-pointer flex items-center justify-between ${
                      theme === 'dark'
                        ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                      🌙 تم تاریک اداری (Dark Theme)
                    </span>
                    {theme === 'dark' && <Check className="w-4 h-4 text-blue-600" />}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="font-bold text-xs text-slate-900 dark:text-white">
                  فونت و تایپوگرافی رسمی سامانه:
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  سامانه پدیده دانش از فونت Vazirmatn همراه با اعداد کاملاً فارسی و فاصله‌گذاری استاندارد RTL بهره می‌برد.
                </p>
              </div>
            </div>
          )}

          {/* Tab 5: Security & Access */}
          {activeTab === 'security' && (
            <div className="space-y-5">
              {/* National ID validation status */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-blue-600" />
                    الگوریتم اعتبارسنجی کد ملی:
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                    {isStrictValidation ? 'حالت سخت‌گیرانه ثبت‌احوال' : 'حالت توسعه (تست)'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  کنترل رقم دهم بر مبنای باقیمانده تقسیم بر ۱۱.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    مدت زمان انقضای نشست (دقیقه):
                  </label>
                  <input
                    type="number"
                    value={sessionTimeout}
                    onChange={(e) => setSessionTimeout(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-center font-bold"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={forceStrongPassword}
                      onChange={(e) => setForceStrongPassword(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                    />
                    <span>اجبار به گذرواژه قوی برای مدیران و دبیران</span>
                  </label>
                </div>
              </div>

              {/* Danger Zone: Factory Reset */}
              <div className="bg-rose-50/50 dark:bg-rose-950/20 rounded-2xl p-5 border border-rose-200 dark:border-rose-900/60 space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-xs text-rose-900 dark:text-rose-200">
                      بازنشانی پایگاه داده به وضعیت اولیه مدرسه نمونه
                    </h4>
                    <p className="text-[11px] text-rose-700 dark:text-rose-300">
                      بازنشانی کامل اطلاعات ۱۸۰ دانش‌آموز، ۱۵ دبیر و ۶ کلاس به مقادیر اولیه
                    </p>
                  </div>
                </div>

                {resetConfirm ? (
                  <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-rose-300 dark:border-rose-800">
                    <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
                      آیا کاملاً اطمینان دارید؟
                    </span>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer"
                    >
                      بله، بازنشانی کن
                    </button>
                    <button
                      type="button"
                      onClick={() => setResetConfirm(false)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 text-xs cursor-pointer"
                    >
                      انصراف
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setResetConfirm(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>بازنشانی پایگاه داده</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>ذخیره تغییرات بخش {activeTab === 'school' ? 'مشخصات مدرسه' : activeTab === 'academic' ? 'قوانین آموزشی' : activeTab === 'notifications' ? 'پیامک و اعلانات' : activeTab === 'appearance' ? 'ظاهر و قالب' : 'امنیت'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
