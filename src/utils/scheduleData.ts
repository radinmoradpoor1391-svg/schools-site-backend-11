import { SchedulePeriod, SchoolClass, Subject, Teacher, Exam } from '../types';
import { PREDEFINED_MIDDLE_SCHOOL_SUBJECTS } from '../data/predefinedCurriculum';

export const BELL_PERIODS = [
  { periodNumber: 1, name: 'زنگ اول', startTime: '08:00', endTime: '09:20', label: '۰۸:۰۰ الی ۰۹:۲۰' },
  { periodNumber: 2, name: 'زنگ دوم', startTime: '09:30', endTime: '11:00', label: '۰۹:۳۰ الی ۱۱:۰۰' },
  { periodNumber: 3, name: 'زنگ سوم', startTime: '11:10', endTime: '12:20', label: '۱۱:۱۰ الی ۱۲:۲۰' },
  { periodNumber: 4, name: 'زنگ چهارم', startTime: '12:30', endTime: '13:30', label: '۱۲:۳۰ الی ۱۳:۳۰' },
];

export const DAYS_OF_WEEK: { dayOfWeek: 0 | 1 | 2 | 3 | 4; name: string; englishKey: string }[] = [
  { dayOfWeek: 0, name: 'شنبه', englishKey: 'saturday' },
  { dayOfWeek: 1, name: 'یکشنبه', englishKey: 'sunday' },
  { dayOfWeek: 2, name: 'دوشنبه', englishKey: 'monday' },
  { dayOfWeek: 3, name: 'سه‌شنبه', englishKey: 'tuesday' },
  { dayOfWeek: 4, name: 'چهارشنبه', englishKey: 'wednesday' },
];

// Helper to determine the current active period or next period
export function getCurrentPeriodStatus(currentTimeStr?: string): {
  isSchoolHours: boolean;
  activePeriodNumber: number | null;
  nextPeriodNumber: number | null;
  timeUntilNextMinutes: number | null;
  statusText: string;
} {
  const now = new Date();
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentTotalMin = currentHours * 60 + currentMinutes;

  const periodsInMin = BELL_PERIODS.map((p) => {
    const [sH, sM] = p.startTime.split(':').map(Number);
    const [eH, eM] = p.endTime.split(':').map(Number);
    return {
      periodNumber: p.periodNumber,
      startMin: sH * 60 + sM,
      endMin: eH * 60 + eM,
    };
  });

  const active = periodsInMin.find((p) => currentTotalMin >= p.startMin && currentTotalMin <= p.endMin);
  if (active) {
    const end = active.endMin;
    const remaining = end - currentTotalMin;
    return {
      isSchoolHours: true,
      activePeriodNumber: active.periodNumber,
      nextPeriodNumber: active.periodNumber < 4 ? active.periodNumber + 1 : null,
      timeUntilNextMinutes: remaining,
      statusText: `زنگ ${active.periodNumber} در حال برگزاری (${remaining} دقیقه تا پایان زنگ)`,
    };
  }

  const next = periodsInMin.find((p) => currentTotalMin < p.startMin);
  if (next) {
    const diff = next.startMin - currentTotalMin;
    return {
      isSchoolHours: currentTotalMin >= 7 * 60 + 30 && currentTotalMin <= 14 * 60,
      activePeriodNumber: null,
      nextPeriodNumber: next.periodNumber,
      timeUntilNextMinutes: diff,
      statusText: `زنگ ${next.periodNumber} در ${diff} دقیقه دیگر آغاز می‌شود`,
    };
  }

  return {
    isSchoolHours: false,
    activePeriodNumber: null,
    nextPeriodNumber: 1,
    timeUntilNextMinutes: null,
    statusText: 'خارج از ساعات رسمی مدرسه',
  };
}

/**
 * Generate default weekly schedule for all classes
 */
export function generateInitialSchedule(
  classes: SchoolClass[],
  subjects: Subject[],
  teachers: Teacher[]
): SchedulePeriod[] {
  const schedule: SchedulePeriod[] = [];

  const subjectMapping: Record<string, string> = {
    'sub-riazi': 'ریاضی',
    'sub-oloom': 'علوم تجربی',
    'sub-farsi': 'فارسی',
    'sub-english': 'زبان انگلیسی',
    'sub-arabi': 'عربی',
    'sub-motaleat': 'مطالعات اجتماعی',
    'sub-quran': 'قرآن',
    'sub-payam': 'پیام‌های آسمان',
    'sub-varzesh': 'تربیت بدنی',
    'sub-kar': 'کار و فناوری',
    'sub-honar': 'فرهنگ و هنر',
    'sub-negaresh': 'نگارش',
    'sub-tafakor': 'تفکر و سبک زندگی',
  };

  const daySubjectMatrix: { [day: number]: string[] } = {
    0: ['sub-riazi', 'sub-oloom', 'sub-farsi', 'sub-quran'],
    1: ['sub-english', 'sub-motaleat', 'sub-riazi', 'sub-kar'],
    2: ['sub-oloom', 'sub-farsi', 'sub-arabi', 'sub-varzesh'],
    3: ['sub-riazi', 'sub-payam', 'sub-english', 'sub-honar'],
    4: ['sub-motaleat', 'sub-oloom', 'sub-negaresh', 'sub-tafakor'],
  };

  classes.forEach((cls, cIdx) => {
    DAYS_OF_WEEK.forEach(({ dayOfWeek, name: dayName }) => {
      BELL_PERIODS.forEach((period) => {
        // Shift subjects slightly per class index for variety
        const rawList = daySubjectMatrix[dayOfWeek];
        const subKey = rawList[(period.periodNumber - 1 + cIdx) % rawList.length];

        const matchedSubject =
          subjects.find((s) => s.id === subKey || s.title.includes(subjectMapping[subKey])) ||
          PREDEFINED_MIDDLE_SCHOOL_SUBJECTS.find((ps) => ps.id === subKey);

        const subTitle = matchedSubject?.title || subjectMapping[subKey] || 'درس عمومی';
        const subId = matchedSubject?.id || subKey;

        // Find assigned teacher for this subject and class
        const assignedTeacher =
          teachers.find((t) => (t.assignedSubjectIds || []).includes(subId)) ||
          teachers[cIdx % (teachers.length || 1)] || {
            id: 't-default',
            firstName: 'استاد',
            lastName: 'دبیر',
          };

        schedule.push({
          id: `sch-${cls.id}-${dayOfWeek}-${period.periodNumber}`,
          dayOfWeek,
          dayName,
          periodNumber: period.periodNumber,
          startTime: period.startTime,
          endTime: period.endTime,
          classId: cls.id,
          className: cls.name,
          subjectId: subId,
          subjectTitle: subTitle,
          teacherId: assignedTeacher.id,
          teacherName: `${assignedTeacher.firstName} ${assignedTeacher.lastName}`,
          roomNumber: cls.roomNumber || '۱۰۱',
        });
      });
    });
  });

  return schedule;
}

/**
 * Predefined sample Exams for smart school platform
 */
export function generateInitialExams(
  classes: SchoolClass[],
  subjects: Subject[],
  teachers: Teacher[]
): Exam[] {
  return [
    {
      id: 'ex-101',
      title: 'آزمون میان‌ترم ریاضی و هندسه فصل ۱ و ۲',
      subjectId: 'sub-riazi',
      subjectTitle: 'ریاضیات',
      classId: classes[0]?.id || 'cls-7-1',
      className: classes[0]?.name || 'هفتم ۱',
      teacherId: teachers[0]?.id || 't1',
      teacherName: teachers[0] ? `${teachers[0].firstName} ${teachers[0].lastName}` : 'استاد علیرضا احمدی',
      date: '۱۴۰۴/۰۹/۱۰',
      time: '۰۸:۳۰',
      durationMinutes: 75,
      roomNumber: '۱۰۱',
      totalScore: 20,
      type: 'midterm',
      description: 'همراه داشتن خط‌کش و ماشین حساب ساده مجاز است. بارم‌بندی شامل ۸ نمره جبر و ۱۲ نمره هندسه.',
      createdAt: '۱۴۰۴/۰۸/۲۵',
    },
    {
      id: 'ex-102',
      title: 'کوییز ماهانه علوم تجربی (فیزیک و زیست‌شناسی)',
      subjectId: 'sub-oloom',
      subjectTitle: 'علوم تجربی',
      classId: classes[0]?.id || 'cls-7-1',
      className: classes[0]?.name || 'هفتم ۱',
      teacherId: teachers[1]?.id || 't2',
      teacherName: teachers[1] ? `${teachers[1].firstName} ${teachers[1].lastName}` : 'دکتر مریم حسینی',
      date: '۱۴۰۴/۰۹/۱۴',
      time: '۱۰:۰۰',
      durationMinutes: 45,
      roomNumber: '۱۰۱',
      totalScore: 20,
      type: 'quiz',
      description: 'آزمون تستی و تشریحی از فصل‌های ۱ تا ۳ کتاب علوم تجربی.',
      createdAt: '۱۴۰۴/۰۸/۲۸',
    },
    {
      id: 'ex-103',
      title: 'ارزشیابی نوبت اول زبان انگلیسی (Prospect 1)',
      subjectId: 'sub-english',
      subjectTitle: 'زبان انگلیسی',
      classId: classes[1]?.id || 'cls-7-2',
      className: classes[1]?.name || 'هفتم ۲',
      teacherId: teachers[2]?.id || 't3',
      teacherName: teachers[2] ? `${teachers[2].firstName} ${teachers[2].lastName}` : 'مهندس سهراب رحیمی',
      date: '۱۴۰۴/۰۹/۱۸',
      time: '۰۹:۳۰',
      durationMinutes: 60,
      roomNumber: '۱۰۲',
      totalScore: 20,
      type: 'monthly',
      description: 'بخش شنیداری (Listening) و بخش خواندن و درک مطلب (Reading & Writing).',
      createdAt: '۱۴۰۴/۰۹/۰۱',
    },
    {
      id: 'ex-104',
      title: 'آزمون جامع هماهنگ پایه‌ای ادبیات و نگارش فارسی',
      subjectId: 'sub-farsi',
      subjectTitle: 'ادبیات فارسی',
      classId: classes[2]?.id || 'cls-8-1',
      className: classes[2]?.name || 'هشتم ۱',
      teacherId: teachers[3]?.id || 't4',
      teacherName: teachers[3] ? `${teachers[3].firstName} ${teachers[3].lastName}` : 'استاد کیانوش کاظمی',
      date: '۱۴۰۴/۰۹/۲۲',
      time: '۰۸:۰۰',
      durationMinutes: 80,
      roomNumber: '۲۰۱',
      totalScore: 20,
      type: 'final',
      description: 'شامل واژگان، آرایه‌های ادبی، درک مفهوم، املا و انشای کاربردی.',
      createdAt: '۱۴۰۴/۰۹/۰۲',
    },
  ];
}

export const SAMPLE_EXAMS: Exam[] = generateInitialExams([], [], []);

