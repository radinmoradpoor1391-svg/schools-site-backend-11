import { Subject, SchoolClass } from '../types';

export interface PredefinedSubject {
  id: string;
  title: string;
  code: string;
  coefficient: number;
  gradeLevel: 'هفتم' | 'هشتم' | 'نهم' | 'عمومی';
  description: string;
  color: string;
}

export const PREDEFINED_MIDDLE_SCHOOL_SUBJECTS: PredefinedSubject[] = [
  {
    id: 'sub-farsi',
    title: 'فارسی',
    code: 'FA-789',
    coefficient: 4,
    gradeLevel: 'عمومی',
    description: 'ادبیات، دستور زبان، شعر و متون کهن فارسی دوره اول متوسطه',
    color: 'emerald',
  },
  {
    id: 'sub-negaresh',
    title: 'نگارش',
    code: 'WR-789',
    coefficient: 2,
    gradeLevel: 'عمومی',
    description: 'آموزش اصول نگارش، انشا و مهارت‌های نوشتاری',
    color: 'teal',
  },
  {
    id: 'sub-riazi',
    title: 'ریاضی',
    code: 'MATH-789',
    coefficient: 4,
    gradeLevel: 'عمومی',
    description: 'مفاهیم جبری، هندسه، توان و ریشه، آمار و احتمال دوره اول متوسطه',
    color: 'blue',
  },
  {
    id: 'sub-oloom',
    title: 'علوم تجربی',
    code: 'SCI-789',
    coefficient: 3,
    gradeLevel: 'عمومی',
    description: 'فیزیک، شیمی، زیست‌شناسی و زمین‌شناسی پایه دوره اول متوسطه',
    color: 'cyan',
  },
  {
    id: 'sub-motaleat',
    title: 'مطالعات اجتماعی',
    code: 'SOC-789',
    coefficient: 3,
    gradeLevel: 'عمومی',
    description: 'تاریخ ایران و جهان، جغرافیا، مدنی و مهارت‌های شهروندی',
    color: 'amber',
  },
  {
    id: 'sub-arabi',
    title: 'عربی',
    code: 'AR-789',
    coefficient: 2,
    gradeLevel: 'عمومی',
    description: 'آموزش زبان و قواعد عربی، ترجمه آیات و متون کاربردی',
    color: 'orange',
  },
  {
    id: 'sub-english',
    title: 'زبان انگلیسی',
    code: 'ENG-789',
    coefficient: 2,
    gradeLevel: 'عمومی',
    description: 'مهارت‌های شنیداری، گفتاری، خواندن و گرامر زبان انگلیسی (Prospect)',
    color: 'blue',
  },
  {
    id: 'sub-quran',
    title: 'قرآن',
    code: 'QURAN-789',
    coefficient: 2,
    gradeLevel: 'عمومی',
    description: 'روخوانی، روان‌خوانی، تجوید، مفاهیم و انس با قرآن کریم',
    color: 'green',
  },
  {
    id: 'sub-payam',
    title: 'پیام‌های آسمان',
    code: 'PAYAM-789',
    coefficient: 2,
    gradeLevel: 'عمومی',
    description: 'تعلیم و تربیت اسلامی، احکام، عقاید و اخلاق دینی',
    color: 'lime',
  },
  {
    id: 'sub-tafakor',
    title: 'تفکر و سبک زندگی',
    code: 'THINK-789',
    coefficient: 2,
    gradeLevel: 'عمومی',
    description: 'تفکر نقادانه، خلاق، تصمیم‌گیری و مهارت‌های زندگی فردی و اجتماعی',
    color: 'purple',
  },
  {
    id: 'sub-kar',
    title: 'کار و فناوری',
    code: 'TECH-789',
    coefficient: 2,
    gradeLevel: 'عمومی',
    description: 'پودمان‌های مهارتی، کارآفرینی، فناوری اطلاعات و ارتباطات و ابزارشناسی',
    color: 'violet',
  },
  {
    id: 'sub-honar',
    title: 'فرهنگ و هنر',
    code: 'ART-789',
    coefficient: 2,
    gradeLevel: 'عمومی',
    description: 'هنرهای تجسمی، خوشنویسی، عکاسی و میراث فرهنگی ایران',
    color: 'rose',
  },
  {
    id: 'sub-defa',
    title: 'آمادگی دفاعی',
    code: 'DEFENSE-9',
    coefficient: 2,
    gradeLevel: 'نهم',
    description: 'آشنایی با مهارت‌های امداد و نجات، دفاع غیرنظامی و امنیت ملی (مختص پایه نهم)',
    color: 'red',
  },
];

export interface DefaultClassConfig {
  id: string;
  name: string;
  gradeLevel: 'هفتم' | 'هشتم' | 'نهم';
  roomNumber: string;
  capacity: number;
  fieldOfStudy: string;
}

export const DEFAULT_MIDDLE_SCHOOL_CLASSES: DefaultClassConfig[] = [
  {
    id: 'cls-7-1',
    name: 'هفتم ۱',
    gradeLevel: 'هفتم',
    roomNumber: '۱۰۱',
    capacity: 30,
    fieldOfStudy: 'عمومی',
  },
  {
    id: 'cls-7-2',
    name: 'هفتم ۲',
    gradeLevel: 'هفتم',
    roomNumber: '۱۰۲',
    capacity: 30,
    fieldOfStudy: 'عمومی',
  },
  {
    id: 'cls-8-1',
    name: 'هشتم ۱',
    gradeLevel: 'هشتم',
    roomNumber: '۲۰۱',
    capacity: 30,
    fieldOfStudy: 'عمومی',
  },
  {
    id: 'cls-8-2',
    name: 'هشتم ۲',
    gradeLevel: 'هشتم',
    roomNumber: '۲۰۲',
    capacity: 30,
    fieldOfStudy: 'عمومی',
  },
  {
    id: 'cls-9-1',
    name: 'نهم ۱',
    gradeLevel: 'نهم',
    roomNumber: '۳۰۱',
    capacity: 30,
    fieldOfStudy: 'عمومی',
  },
  {
    id: 'cls-9-2',
    name: 'نهم ۲',
    gradeLevel: 'نهم',
    roomNumber: '۳۰۲',
    capacity: 30,
    fieldOfStudy: 'عمومی',
  },
];

/**
 * Categorize student academic status based on exact GPA
 */
export function getStudentAcademicStatus(gpa: number, hasGrades: boolean): {
  label: string;
  badgeClass: string;
  color: string;
} {
  if (!hasGrades || gpa === 0) {
    return {
      label: 'بدون نمره',
      badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700',
      color: 'slate',
    };
  }
  if (gpa >= 19.0) {
    return {
      label: 'ممتاز',
      badgeClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
      color: 'emerald',
    };
  }
  if (gpa >= 17.0) {
    return {
      label: 'عالی',
      badgeClass: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
      color: 'blue',
    };
  }
  if (gpa >= 14.0) {
    return {
      label: 'خوب',
      badgeClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
      color: 'amber',
    };
  }
  if (gpa >= 10.0) {
    return {
      label: 'قابل قبول',
      badgeClass: 'bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800',
      color: 'orange',
    };
  }
  return {
    label: 'نیازمند تلاش',
    badgeClass: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
    color: 'rose',
  };
}
