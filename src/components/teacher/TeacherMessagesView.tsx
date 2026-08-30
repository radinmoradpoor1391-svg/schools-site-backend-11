import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  Bell,
  MessageSquare,
  Send,
  User,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertCircle,
  Plus,
  ShieldCheck,
  ChevronLeft,
  CornerDownLeft,
} from 'lucide-react';
import { toPersianDigits } from '../../utils/persian';

export const TeacherMessagesView: React.FC = () => {
  const { currentTeacher, user, currentUser } = useAuth();
  const { announcements, classes, students } = useData();

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

  const teacherClasses = useMemo(() => {
    const list = classes.filter((c) =>
      (activeTeacher.assignedClassIds || []).includes(c.id) ||
      (activeTeacher.assignedClassIds || []).includes(c.name)
    );
    return list.length > 0 ? list : classes;
  }, [classes, activeTeacher]);

  const [activeTab, setActiveTab] = useState<'inbox' | 'school_alerts' | 'send'>('inbox');
  const [targetClassId, setTargetClassId] = useState(teacherClasses[0]?.id || classes[0]?.id || 'c1');
  const [messageTitle, setMessageTitle] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Quick reply modal / state
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const [replyText, setReplyText] = useState('');

  // Sample real communications
  const [studentMessages, setStudentMessages] = useState([
    {
      id: 'm1',
      senderName: 'امیررضا رضایی (نماینده کلاس دهم ۱)',
      role: 'دانش‌آموز',
      className: 'دهم ۱',
      title: 'پرسش در رابطه با تمرین‌های فصل ۲ ریاضی',
      content: 'استاد گرامی، در حل تمرین شماره ۴ صفحه ۳۸ ابهامی وجود داشت که در صورت امکان در جلسه آینده مرور فرمایید.',
      time: 'امروز، ۱۰:۱۵',
      isRead: false,
    },
    {
      id: 'm2',
      senderName: 'ولی دانش‌آموز محمد صادقی',
      role: 'اولیا',
      className: 'دهم ۲',
      title: 'هماهنگی جلسه مشاوره تحصیلی و پیشرفت درسی',
      content: 'با سلام و احترام، جهت بررسی روند نمرات آبان ماه فرزندم، آیا امکان حضور در زنگ تفریح دوم روز دوشنبه میسر است؟',
      time: 'دیروز، ۱۲:۳۰',
      isRead: true,
    },
    {
      id: 'm3',
      senderName: 'سهراب احمدی (کلاس دوازدهم ریاضی)',
      role: 'دانش‌آموز',
      className: 'دوازدهم ریاضی',
      title: 'ارسال فایل تکمیلی پروژه پژوهشی درس هندسه تحلیلی',
      content: 'استاد، فایل تحقیق و محاسبات تکمیلی در سامانه تکالیف ثبت گردید.',
      time: '۲ روز پیش',
      isRead: true,
    },
  ]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageTitle.trim() || !messageContent.trim()) return;

    setSuccessMsg('پیام و اطلاعیه شما با موفقیت برای دانش‌آموزان و اولیای کلاس ارسال گردید.');
    setMessageTitle('');
    setMessageContent('');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !replyingTo) return;

    setSuccessMsg(`پاسخ شما برای "${replyingTo.senderName}" ارسال گردید.`);
    setReplyingTo(null);
    setReplyText('');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 text-right max-w-7xl mx-auto"
      dir="rtl"
    >
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs font-bold">
            <Bell className="w-3.5 h-3.5" />
            <span>سامانه پیام‌ها و تعاملات آموزشی</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            مرکز پیام‌ها، اعلانات و ارتباط با اولیا و دانش‌آموزان
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            ارسال پیام‌های کلاسی، پاسخ به سوالات درسی دانش‌آموزان و مشاهده بخشنامه‌های مدیریت
          </p>
        </div>

        <button
          onClick={() => setActiveTab('send')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-600/25 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>ارسال اطلاعیه کلاسی جدید</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('inbox')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'inbox'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>پیام‌های دریافتی ({toPersianDigits(studentMessages.length)})</span>
        </button>

        <button
          onClick={() => setActiveTab('school_alerts')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'school_alerts'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>بخشنامه‌های مدرسه ({toPersianDigits(announcements.length)})</span>
        </button>

        <button
          onClick={() => setActiveTab('send')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'send'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>ارسال پیام یا اطلاعیه جدید</span>
        </button>
      </div>

      {/* Tab 1: Inbox */}
      {activeTab === 'inbox' && (
        <div className="space-y-3">
          {studentMessages.map((msg) => (
            <div
              key={msg.id}
              className={`p-6 rounded-3xl bg-white dark:bg-slate-900 border transition-all space-y-3 ${
                !msg.isRead
                  ? 'border-blue-300 dark:border-blue-700 shadow-sm bg-blue-50/20'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold text-xs">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{msg.senderName}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {msg.role}
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400">کلاس: {msg.className}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-mono">{msg.time}</span>
                  <button
                    onClick={() => setReplyingTo(msg)}
                    className="px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 text-xs font-bold hover:bg-blue-100 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <CornerDownLeft className="w-3 h-3" />
                    <span>پاسخ</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <h5 className="font-bold text-xs text-slate-800 dark:text-slate-200">{msg.title}</h5>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{msg.content}</p>
              </div>

              {replyingTo?.id === msg.id && (
                <form onSubmit={handleSendReply} className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    پاسخ شما به {msg.senderName}:
                  </label>
                  <textarea
                    rows={3}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="متن پاسخ خود را بنویسید..."
                    required
                    className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs cursor-pointer"
                    >
                      ارسال پاسخ
                    </button>
                    <button
                      type="button"
                      onClick={() => setReplyingTo(null)}
                      className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs cursor-pointer"
                    >
                      انصراف
                    </button>
                  </div>
                </form>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: School Alerts */}
      {activeTab === 'school_alerts' && (
        <div className="space-y-3">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  بخشنامه رسمی مدیریت
                </span>
                <span className="text-[11px] text-slate-400 font-mono">{toPersianDigits(ann.createdAt)}</span>
              </div>

              <h4 className="font-bold text-sm text-slate-900 dark:text-white">{ann.title}</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{ann.content}</p>
              <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                صادرکننده: {ann.authorName} ({ann.authorRole})
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Send New Message */}
      {activeTab === 'send' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
          <form onSubmit={handleSendMessage} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                کلاس درس مقصد (مخاطبان اطلاعیه):
              </label>
              <select
                value={targetClassId}
                onChange={(e) => setTargetClassId(e.target.value)}
                className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
              >
                {teacherClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (پایه {c.gradeLevel})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                موضوع پیام یا عنوان اطلاعیه:
              </label>
              <input
                type="text"
                value={messageTitle}
                onChange={(e) => setMessageTitle(e.target.value)}
                placeholder="مثال: یادآوری تحویل تکالیف ریاضی و سرفصل‌های آزمون"
                required
                className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">متن کامل پیام:</label>
              <textarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                rows={5}
                placeholder="متن پیام خود را برای دانش‌آموزان و اولیا وارد نمایید..."
                required
                className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 leading-relaxed"
              />
            </div>

            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>ارسال سراسری به کلاس</span>
            </button>
          </form>
        </div>
      )}
    </motion.div>
  );
};
