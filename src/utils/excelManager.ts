import { Student, Teacher, SchoolClass, Subject, Grade, AttendanceRecord, ReportCard, CSVImportPreviewRow } from '../types';
import { toEnglishDigits, toPersianDigits, validateIranianNationalId } from './persian';
import { calculateStudentGPA } from './gradeCalculations';

/**
 * Downloads a string as a CSV file with UTF-8 BOM so Persian characters open flawlessly in Excel.
 */
export function downloadCSV(filename: string, csvContent: string): void {
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Convert array of objects to CSV format.
 */
export function formatAsCSV(headers: string[], rows: (string | number | undefined | null)[][]): string {
  const escapeCell = (val: string | number | undefined | null): string => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerLine = headers.map(escapeCell).join(',');
  const rowLines = rows.map((row) => row.map(escapeCell).join(',')).join('\n');

  return `${headerLine}\n${rowLines}`;
}

/**
 * 1. Export Students List to Excel/CSV
 */
export function exportStudentsToExcel(
  students: Student[],
  classes: SchoolClass[],
  grades: Grade[],
  subjects: Subject[]
): void {
  const headers = [
    'شناسه',
    'کد دانش‌آموزی',
    'نام',
    'نام خانوادگی',
    'کد ملی',
    'نام پدر',
    'تاریخ تولد',
    'نام کلاس',
    'پایه تحصیلی',
    'رشته تحصیلی',
    'شماره تماس اولیا',
    'معدل کل',
    'نمره انضباط',
    'وضعیت پرونده',
  ];

  const rows = students.map((s) => {
    const classObj = classes.find((c) => c.id === s.classId);
    const { gpa } = calculateStudentGPA(s.id, grades, subjects);
    return [
      s.id,
      s.studentCode || 'ـ',
      s.firstName,
      s.lastName,
      s.nationalId,
      s.fatherName || 'ـ',
      s.birthDate || 'ـ',
      classObj?.name || s.className || 'ـ',
      s.gradeLevel,
      s.fieldOfStudy || 'عمومی',
      s.parentPhone || 'ـ',
      gpa > 0 ? gpa.toString() : 'فاقد نمره',
      s.disciplineScore !== undefined ? s.disciplineScore.toString() : '۲۰',
      s.isActive !== false ? 'فعال' : 'غیرفعال',
    ];
  });

  const dateStr = new Date().toLocaleDateString('fa-IR').replace(/\//g, '-');
  downloadCSV(`فهرست_دانش_آموزان_مدرسه_پدیده_دانش_${dateStr}.csv`, formatAsCSV(headers, rows));
}

/**
 * 2. Export Teachers List to Excel/CSV
 */
export function exportTeachersToExcel(
  teachers: Teacher[],
  classes: SchoolClass[],
  subjects: Subject[]
): void {
  const headers = [
    'شناسه',
    'کد پرسنلی',
    'نام',
    'نام خانوادگی',
    'کد ملی',
    'مدرک تحصیلی',
    'رشته تخصصی',
    'شماره تماس',
    'پست الکترونیک',
    'کلاس‌های تدریس',
    'دروس تخصصی',
    'وضعیت حساب',
  ];

  const rows = teachers.map((t) => {
    const classNames = (t.assignedClassIds || [])
      .map((id) => classes.find((c) => c.id === id)?.name)
      .filter(Boolean)
      .join(' | ');

    const subjectNames = (t.assignedSubjectIds || [])
      .map((id) => subjects.find((s) => s.id === id)?.title)
      .filter(Boolean)
      .join(' | ');

    return [
      t.id,
      t.personnelCode || 'ـ',
      t.firstName,
      t.lastName,
      t.nationalId,
      t.degree || 'ـ',
      t.specialty || 'ـ',
      t.phone || 'ـ',
      t.email || 'ـ',
      classNames || 'تخصیص نیافته',
      subjectNames || 'تخصیص نیافته',
      t.isActive !== false ? 'فعال' : 'غیرفعال',
    ];
  });

  const dateStr = new Date().toLocaleDateString('fa-IR').replace(/\//g, '-');
  downloadCSV(`فهرست_کادر_آموزشی_و_دبیران_${dateStr}.csv`, formatAsCSV(headers, rows));
}

/**
 * 3. Export Classes List
 */
export function exportClassesToExcel(
  classes: SchoolClass[],
  students: Student[],
  teachers: Teacher[]
): void {
  const headers = [
    'شناسه کلاس',
    'نام کلاس',
    'پایه تحصیلی',
    'رشته تحصیلی',
    'شماره اتاق/کلاس',
    'ظرفیت',
    'تعداد دانش‌آموزان ثبت‌نامی',
    'دبیر راهنما (پرورشی)',
  ];

  const rows = classes.map((c) => {
    const classStudentsCount = students.filter((s) => s.classId === c.id).length;
    const homeroom = teachers.find((t) => t.id === c.homeroomTeacherId);
    return [
      c.id,
      c.name,
      c.gradeLevel,
      c.fieldOfStudy || 'عمومی',
      c.roomNumber || 'ـ',
      c.capacity || 30,
      classStudentsCount,
      homeroom ? `${homeroom.firstName} ${homeroom.lastName}` : 'تعیین نشده',
    ];
  });

  const dateStr = new Date().toLocaleDateString('fa-IR').replace(/\//g, '-');
  downloadCSV(`فهرست_کلاس_ها_پدیده_دانش_${dateStr}.csv`, formatAsCSV(headers, rows));
}

/**
 * 4. Export Grades List
 */
export function exportGradesToExcel(
  grades: Grade[],
  students: Student[],
  subjects: Subject[],
  classes: SchoolClass[],
  teachers: Teacher[]
): void {
  const headers = [
    'شناسه نمره',
    'نام و نام خانوادگی دانش‌آموز',
    'کد ملی دانش‌آموز',
    'کلاس',
    'نام درس',
    'ضریب درس',
    'نمره ثبت‌شده',
    'نوع ارزشیابی',
    'ماه ارزشیابی',
    'نوبت تحصیلی',
    'تاریخ ثبت',
    'نام دبیر ثبت‌کننده',
    'توضیحات و بازخورد',
  ];

  const gradeTypeLabels: Record<string, string> = {
    daily: 'مستمر / کلاسی',
    quiz: 'پرسش و آزمونک',
    homework: 'تکلیف و تمرین',
    activity: 'فعالیت و پژوهش',
    midterm: 'میان‌ترم',
    final: 'آزمون پایانی',
    other: 'سایر',
  };

  const rows = grades.map((g) => {
    const std = students.find((s) => s.id === g.studentId);
    const subj = subjects.find((s) => s.id === g.subjectId);
    const cls = classes.find((c) => c.id === g.classId);
    const tch = teachers.find((t) => t.id === g.teacherId);

    return [
      g.id,
      std ? `${std.firstName} ${std.lastName}` : 'دانش‌آموز ناشناس',
      std?.nationalId || 'ـ',
      cls?.name || 'ـ',
      subj?.title || 'ـ',
      subj?.coefficient || 2,
      g.score,
      gradeTypeLabels[g.gradeType] || g.gradeType,
      g.month || 'ـ',
      g.semester === 'semester2' ? 'نوبت دوم' : 'نوبت اول',
      g.date || 'ـ',
      tch ? `${tch.firstName} ${tch.lastName}` : 'دبیر محترم',
      g.description || 'ـ',
    ];
  });

  const dateStr = new Date().toLocaleDateString('fa-IR').replace(/\//g, '-');
  downloadCSV(`ریز_نمرات_آموزشگاه_پدیده_دانش_${dateStr}.csv`, formatAsCSV(headers, rows));
}

/**
 * 5. Export Attendance Records
 */
export function exportAttendanceToExcel(
  attendance: AttendanceRecord[],
  students: Student[],
  classes: SchoolClass[]
): void {
  const headers = [
    'شناسه رکورد',
    'تاریخ حضور و غیاب',
    'نام و نام خانوادگی دانش‌آموز',
    'کد ملی',
    'کلاس',
    'وضعیت حضور',
    'یادداشت انضباطی',
  ];

  const statusLabels: Record<string, string> = {
    present: 'حاضر',
    absent: 'غایب غیرموجه',
    excused: 'غایب موجه',
    late: 'تأخیر ورود',
  };

  const rows = attendance.map((a) => {
    const std = students.find((s) => s.id === a.studentId);
    const cls = classes.find((c) => c.id === a.classId);

    return [
      a.id,
      a.date,
      std ? `${std.firstName} ${std.lastName}` : 'ـ',
      std?.nationalId || 'ـ',
      cls?.name || 'ـ',
      statusLabels[a.status] || a.status,
      a.note || 'ـ',
    ];
  });

  const dateStr = new Date().toLocaleDateString('fa-IR').replace(/\//g, '-');
  downloadCSV(`دفتر_حضور_و_غیاب_${dateStr}.csv`, formatAsCSV(headers, rows));
}

/**
 * 6. Export Report Cards Summary
 */
export function exportReportCardsToExcel(reportCards: ReportCard[]): void {
  const headers = [
    'شناسه کارنامه',
    'نام دانش‌آموز',
    'کد ملی',
    'کلاس',
    'پایه تحصیلی',
    'نوع کارنامه',
    'ماه/نوبت',
    'معدل کل (GPA)',
    'رتبه در کلاس',
    'تعداد دانش‌آموزان کلاس',
    'تعداد غیبت',
    'نمره انضباط',
    'وضعیت انتشار',
  ];

  const rows = reportCards.map((rc) => [
    rc.id,
    rc.studentName,
    rc.nationalId,
    rc.className,
    rc.gradeLevel,
    rc.type === 'monthly' ? 'ماهانه' : (rc.type === 'semester1' ? 'نوبت اول' : 'نوبت دوم'),
    rc.monthName || rc.termName || 'ـ',
    rc.gpa,
    rc.rankInClass,
    rc.totalStudentsInClass,
    rc.attendanceAbsentCount || 0,
    rc.disciplineScore,
    rc.status === 'published' ? 'منتشر شده' : 'پیش‌نویس',
  ]);

  const dateStr = new Date().toLocaleDateString('fa-IR').replace(/\//g, '-');
  downloadCSV(`خلاصه_کارنامه_های_صادر_شده_${dateStr}.csv`, formatAsCSV(headers, rows));
}

/**
 * Excel / CSV Parser with detailed validation & error reports per row.
 */
export function parseAndValidateStudentCSV(
  csvText: string,
  existingStudents: Student[],
  classes: SchoolClass[]
): {
  previewRows: CSVImportPreviewRow[];
  validCount: number;
  invalidCount: number;
  errors: string[];
} {
  const cleanText = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  const lines = cleanText.split('\n').filter((l) => l.trim().length > 0);

  if (lines.length === 0) {
    return { previewRows: [], validCount: 0, invalidCount: 0, errors: ['فایل ورودی خالی است.'] };
  }

  // Skip header if first row contains column names
  let dataLines = lines;
  const firstLine = lines[0].toLowerCase();
  if (
    firstLine.includes('نام') ||
    firstLine.includes('کد ملی') ||
    firstLine.includes('firstname') ||
    firstLine.includes('nationalid')
  ) {
    dataLines = lines.slice(1);
  }

  const previewRows: CSVImportPreviewRow[] = [];
  const errors: string[] = [];
  const nationalIdSetInFile = new Set<string>();

  dataLines.forEach((line, index) => {
    const rowNumber = index + 1;
    // Split by comma or semicolon or tab
    const cols = line
      .split(/[,;\t]/)
      .map((c) => c.replace(/^["']|["']$/g, '').trim());

    if (cols.length < 3) {
      previewRows.push({
        rowNumber,
        firstName: cols[0] || '',
        lastName: cols[1] || '',
        nationalId: cols[2] || '',
        className: cols[3] || '',
        isValid: false,
        errors: ['تعداد ستون‌های این ردیف کمتر از حد استاندارد است.'],
        error: 'تعداد ستون‌های ناکافی',
      });
      errors.push(`ردیف ${rowNumber}: ستون‌های کافی وجود ندارد.`);
      return;
    }

    const firstName = cols[0] || '';
    const lastName = cols[1] || '';
    let nationalId = toEnglishDigits(cols[2] || '').replace(/\D/g, '');
    const className = cols[3] || '';
    const fatherName = cols[4] || 'ـ';
    const parentPhone = cols[5] || '۰۹۱۲۰۰۰۰۰۰۰';

    const rowErrors: string[] = [];

    // Validations
    if (!firstName) rowErrors.push('نام دانش‌آموز الزامی است.');
    if (!lastName) rowErrors.push('نام خانوادگی الزامی است.');
    
    if (!nationalId) {
      rowErrors.push('کد ملی الزامی است.');
    } else if (nationalId.length !== 10) {
      rowErrors.push(`کد ملی باید دقیقا ۱۰ رقم باشد (کد وارده: ${nationalId}).`);
    } else if (!validateIranianNationalId(nationalId).isValid) {
      rowErrors.push(`کد ملی ${nationalId} نامعتبر است (رقم کنترلی ناصحیح).`);
    }

    // Duplicate check within file
    if (nationalId && nationalIdSetInFile.has(nationalId)) {
      rowErrors.push(`کد ملی ${nationalId} در همین فایل تکرار شده است.`);
    } else if (nationalId) {
      nationalIdSetInFile.add(nationalId);
    }

    // Duplicate check with existing database
    const existing = existingStudents.find((s) => toEnglishDigits(s.nationalId) === nationalId);
    if (existing) {
      rowErrors.push(`کد ملی ${nationalId} قبلاً برای دانش‌آموز «${existing.firstName} ${existing.lastName}» در سیستم ثبت شده است.`);
    }

    const isValid = rowErrors.length === 0;
    if (!isValid) {
      errors.push(`ردیف ${rowNumber} (${firstName} ${lastName}): ${rowErrors.join(' | ')}`);
    }

    previewRows.push({
      rowNumber,
      firstName,
      lastName,
      nationalId,
      className,
      fatherName,
      parentPhone,
      isValid,
      errors: rowErrors,
      error: rowErrors.length > 0 ? rowErrors[0] : undefined,
    });
  });

  const validCount = previewRows.filter((r) => r.isValid).length;
  const invalidCount = previewRows.filter((r) => !r.isValid).length;

  return {
    previewRows,
    validCount,
    invalidCount,
    errors,
  };
}

/**
 * Standard CSV Template with Persian headers & example rows.
 */
export function getStandardStudentCSVTemplate(): string {
  const headers = ['نام', 'نام خانوادگی', 'کد ملی', 'نام کلاس', 'نام پدر', 'شماره تماس اولیا'];
  const samples = [
    ['علی', 'احمدی', '0012345678', 'کلاس 101 (هفتم الف)', 'محمدرضا', '09123456789'],
    ['محمد', 'رضایی', '0023456789', 'کلاس 102 (هفتم ب)', 'حسین', '09129876543'],
    ['سارا', 'کریمی', '0034567890', 'کلاس 201 (هشتم الف)', 'جعفر', '09121112233'],
  ];

  return formatAsCSV(headers, samples);
}
