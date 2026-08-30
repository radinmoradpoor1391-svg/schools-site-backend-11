import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  ClipboardList,
  Plus,
  CheckCircle2,
  MessageSquare,
  HeartHandshake,
  Trash2,
  Sparkles,
  Award,
  AlertTriangle,
} from 'lucide-react';
import { toPersianDigits } from '../../utils/persian';

export const TeacherNotesView: React.FC = () => {
  const { currentTeacher, user, currentUser } = useAuth();
  const { classes, students, teacherNotes, addTeacherNote } = useData();

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
    return classes.filter((c) =>
      (activeTeacher.assignedClassIds || []).includes(c.id) ||
      (activeTeacher.assignedClassIds || []).includes(c.name)
    );
  }, [classes, activeTeacher]);

  const [selectedClassId, setSelectedClassId] = useState<string>(
    teacherClasses[0]?.id || ''
  );

  React.useEffect(() => {
    if (teacherClasses.length > 0 && !teacherClasses.some((c) => c.id === selectedClassId)) {
      setSelectedClassId(teacherClasses[0].id);
    }
  }, [teacherClasses, selectedClassId]);

  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [noteType, setNoteType] = useState<'educational' | 'discipline' | 'encouragement'>('educational');
  const [noteContent, setNoteContent] = useState('');
  const [successMsg, setSuccessMsg] = useState(false);

  const classStudents = useMemo(() => {
    return students.filter(
      (s) => (s.classId === selectedClassId || s.className === teacherClasses.find(c => c.id === selectedClassId)?.name) && s.isActive
    );
  }, [students, selectedClassId, teacherClasses]);

  const activeStudentId = selectedStudentId || classStudents[0]?.id || '';

  const teacherRecordedNotes = useMemo(() => {
    const list = teacherNotes.filter((n) => n.teacherId === activeTeacher.id);
    return list.length > 0 ? list : teacherNotes;
  }, [teacherNotes, activeTeacher]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim() || !activeStudentId) return;

    addTeacherNote({
      teacherId: activeTeacher.id,
      teacherName: `${activeTeacher.firstName} ${activeTeacher.lastName}`,
      studentId: activeStudentId,
      content: noteContent,
      type: noteType,
    });

    setNoteContent('');
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 2500);
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
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs font-bold">
          <ClipboardList className="w-3.5 h-3.5" />
          <span>پرونده رفتاری و مشاوره‌ای</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
          ثبت توصیه‌ها، تشویق‌ها و یادداشت‌های آموزشی
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          ارسال بازخوردهای انفرادی و تربیتی برای دانش‌آموزان و مشاهده در پرونده تحصیلی آنان
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">ارسال یادداشت یا بازخورد جدید</h3>

          {successMsg && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-2xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>یادداشت با موفقیت در پرونده تحصیلی دانش‌آموز ثبت گردید.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">انتخاب کلاس:</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => {
                    setSelectedClassId(e.target.value);
                    setSelectedStudentId('');
                  }}
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
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">دانش‌آموز هدف:</label>
                <select
                  value={activeStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                >
                  {classStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} (کد: {toPersianDigits(s.studentCode)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">نوع بازخورد:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setNoteType('educational')}
                  className={`p-2.5 rounded-2xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    noteType === 'educational'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>مشاوره درسی</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNoteType('encouragement')}
                  className={`p-2.5 rounded-2xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    noteType === 'encouragement'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>تشویق و تقدیر</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNoteType('discipline')}
                  className={`p-2.5 rounded-2xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    noteType === 'discipline'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>تذکر انضباطی</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">متن توصیه یا نظر:</label>
              <textarea
                rows={5}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="توصیه‌های کاربردی جهت بهبود وضعیت درسی، تشویق یا راهنمایی آموزشی دانش‌آموز..."
                required
                className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white leading-relaxed"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-2xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
            >
              ثبت در پرونده دانش‌آموز
            </button>
          </form>
        </div>

        {/* History Column */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            تاریخچه یادداشت‌های ثبت‌شده شما ({toPersianDigits(teacherRecordedNotes.length)} مورد)
          </h3>

          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {teacherRecordedNotes.map((note) => {
              const std = students.find((s) => s.id === note.studentId);
              return (
                <div
                  key={note.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      برای: {std ? `${std.firstName} ${std.lastName} (${std.className})` : 'دانش‌آموز'}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">{toPersianDigits(note.createdAt)}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
