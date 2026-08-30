import React, { useState, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useData } from '../../context/DataContext';
import {
  Users,
  Plus,
  FileSpreadsheet,
  Search,
  KeyRound,
  UserCheck,
  UserX,
  Edit2,
  Trash2,
  Download,
  Upload,
  AlertCircle,
  CheckCircle2,
  X,
  Sparkles,
  Eye,
  ArrowUpDown,
  ChevronRight,
  ChevronLeft,
  GraduationCap,
  Calendar,
  Lock,
  User,
  Phone,
  MapPin,
  RefreshCw,
  Loader2,
  FileText,
  Copy,
  Check,
  HelpCircle,
} from 'lucide-react';
import {
  toPersianDigits,
  validateIranianNationalId,
  isStrictNationalIdValidationEnabled,
  toEnglishDigits,
  formatScore,
  getGradeColorClass,
  calculateJalaliAge,
  validatePersianBirthDate,
  getCurrentJalaliYear,
  PERSIAN_MONTHS,
} from '../../utils/persian';
import { Student, CSVImportPreviewRow } from '../../types';
import { AdminStudentDossierModal } from './AdminStudentDossierModal';
import { AdminConfirmDialog } from './AdminConfirmDialog';
import { PersianDatePicker } from '../common/PersianDatePicker';

export const AdminStudentManagement: React.FC = () => {
  const {
    students,
    classes,
    grades,
    attendance,
    academicYears,
    addStudent,
    updateStudent,
    deleteStudent,
    toggleStudentActive,
    resetStudentPassword,
    bulkImportStudents,
  } = useData();

  // Search, Filters & Sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('all');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [selectedPerformanceTier, setSelectedPerformanceTier] = useState<'all' | 'top' | 'medium' | 'low'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'nationalId' | 'code' | 'gpa' | 'attendance' | 'age'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals & Dialogs state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [dossierStudent, setDossierStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  // Form State
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formNationalId, setFormNationalId] = useState('');
  const [formFatherName, setFormFatherName] = useState('');
  const [formClassId, setFormClassId] = useState(classes[0]?.id || '');
  const [formParentPhone, setFormParentPhone] = useState('۰۹۱۲۰۰۰۰۰۰۰');
  const [formDiscipline, setFormDiscipline] = useState('20');
  const [formAddress, setFormAddress] = useState('تهران، خیابان ولیعصر');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Birth Date Components
  const [birthYear, setBirthYear] = useState<number>(1391);
  const [birthMonth, setBirthMonth] = useState<number>(3);
  const [birthDay, setBirthDay] = useState<number>(15);
  const [formBirthDateFormatted, setFormBirthDateFormatted] = useState('1391/03/15');

  // Concurrency & Lock State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Excel Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importRows, setImportRows] = useState<CSVImportPreviewRow[]>([]);
  const [importFileName, setImportFileName] = useState<string | null>(null);
  const [importFilter, setImportFilter] = useState<'all' | 'valid' | 'invalid'>('all');
  const [importResult, setImportResult] = useState<{
    successCount: number;
    errorCount: number;
    errors: string[];
  } | null>(null);

  // Calculate student GPA & Attendance map for fast lookups
  const studentMetricsMap = useMemo(() => {
    const map = new Map<string, { gpa: number; attendanceRate: number; age: number }>();

    students.forEach((s) => {
      const stdGrades = grades.filter((g) => g.studentId === s.id);
      const gpa =
        stdGrades.length > 0
          ? +(stdGrades.reduce((a, b) => a + b.score, 0) / stdGrades.length).toFixed(2)
          : 0.0;

      const stdAtt = attendance.filter((a) => a.studentId === s.id);
      const totalDays = stdAtt.length;
      const present = stdAtt.filter((a) => a.status === 'present' || a.status === 'excused').length;
      const attendanceRate = totalDays > 0 ? Math.round((present / totalDays) * 100) : 0;

      // Parse birth date for age
      let age = 13;
      if (s.birthDate) {
        const parts = s.birthDate.split(/[/–-]/);
        if (parts.length === 3) {
          const y = parseInt(toEnglishDigits(parts[0]), 10);
          const m = parseInt(toEnglishDigits(parts[1]), 10);
          const d = parseInt(toEnglishDigits(parts[2]), 10);
          if (y) {
            age = calculateJalaliAge(y, m || 1, d || 1).age;
          }
        }
      }

      map.set(s.id, { gpa, attendanceRate, age });
    });

    return map;
  }, [students, grades, attendance]);

  // Filtered & Sorted Students
  const filteredStudents = useMemo(() => {
    return students
      .filter((s) => {
        const q = (searchQuery || '').trim().toLowerCase();
        const engDigits = toEnglishDigits(q);
        const fullName = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase();
        const nationalId = s.nationalId ? toEnglishDigits(s.nationalId) : '';
        const code = s.studentCode ? toEnglishDigits(s.studentCode).toLowerCase() : '';
        const fatherName = (s.fatherName || '').toLowerCase();
        const phone = s.parentPhone ? toEnglishDigits(s.parentPhone) : '';

        const matchesSearch =
          !q ||
          fullName.includes(q) ||
          nationalId.includes(engDigits) ||
          code.includes(engDigits) ||
          fatherName.includes(q) ||
          phone.includes(engDigits) ||
          (s.className || '').toLowerCase().includes(q);

        const matchesClass = selectedClassFilter === 'all' || s.classId === selectedClassFilter;
        const matchesGrade = selectedGradeFilter === 'all' || s.gradeLevel === selectedGradeFilter;
        const matchesStatus =
          selectedStatusFilter === 'all' ||
          (selectedStatusFilter === 'active' && s.isActive) ||
          (selectedStatusFilter === 'inactive' && !s.isActive);

        const metrics = studentMetricsMap.get(s.id) || { gpa: 0, attendanceRate: 0, age: 13 };
        let matchesTier = true;
        if (selectedPerformanceTier === 'top') matchesTier = metrics.gpa >= 18;
        if (selectedPerformanceTier === 'medium') matchesTier = metrics.gpa >= 14 && metrics.gpa < 18;
        if (selectedPerformanceTier === 'low') matchesTier = metrics.gpa < 14;

        return matchesSearch && matchesClass && matchesGrade && matchesStatus && matchesTier;
      })
      .sort((a, b) => {
        const metricsA = studentMetricsMap.get(a.id) || { gpa: 0, attendanceRate: 0, age: 13 };
        const metricsB = studentMetricsMap.get(b.id) || { gpa: 0, attendanceRate: 0, age: 13 };

        let compare = 0;
        if (sortBy === 'name') {
          compare = `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`, 'fa');
        } else if (sortBy === 'nationalId') {
          compare = (a.nationalId || '').localeCompare(b.nationalId || '');
        } else if (sortBy === 'code') {
          compare = (a.studentCode || '').localeCompare(b.studentCode || '');
        } else if (sortBy === 'gpa') {
          compare = metricsA.gpa - metricsB.gpa;
        } else if (sortBy === 'attendance') {
          compare = metricsA.attendanceRate - metricsB.attendanceRate;
        } else if (sortBy === 'age') {
          compare = metricsA.age - metricsB.age;
        }

        return sortOrder === 'asc' ? compare : -compare;
      });
  }, [
    students,
    searchQuery,
    selectedClassFilter,
    selectedGradeFilter,
    selectedStatusFilter,
    selectedPerformanceTier,
    sortBy,
    sortOrder,
    studentMetricsMap,
  ]);

  // Paginated records
  const totalPages = Math.ceil(filteredStudents.length / pageSize) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  // Handlers for Add/Edit Modal Opening
  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormFirstName('');
    setFormLastName('');
    setFormNationalId('');
    setFormFatherName('');
    setFormClassId(classes[0]?.id || '');
    setFormParentPhone('۰۹۱۲۰۰۰۰۰۰۰');
    setFormDiscipline('20');
    setFormAddress('تهران، خیابان ولیعصر');
    setFormUsername('');
    setFormPassword('');
    setShowPassword(false);
    setBirthYear(1391);
    setBirthMonth(3);
    setBirthDay(15);
    setFormBirthDateFormatted('1391/03/15');
    setFormError(null);
    setIsSubmitting(false);
    setShowAddModal(true);
  };

  const handleOpenEdit = (std: Student) => {
    setEditingStudent(std);
    setFormFirstName(std.firstName);
    setFormLastName(std.lastName);
    setFormNationalId(std.nationalId);
    setFormFatherName(std.fatherName);
    setFormClassId(std.classId);
    setFormParentPhone(std.parentPhone || '۰۹۱۲۰۰۰۰۰۰۰');
    setFormDiscipline(std.disciplineScore ? std.disciplineScore.toString() : '20');
    setFormAddress(std.address || 'تهران، خیابان ولیعصر');
    setFormUsername(std.username || std.nationalId);
    setFormPassword('');
    setShowPassword(false);

    // Parse Birth date
    let y = 1391;
    let m = 3;
    let d = 15;
    if (std.birthDate) {
      const parts = std.birthDate.split(/[/–-]/);
      if (parts.length === 3) {
        y = parseInt(toEnglishDigits(parts[0]), 10) || 1391;
        m = parseInt(toEnglishDigits(parts[1]), 10) || 1;
        d = parseInt(toEnglishDigits(parts[2]), 10) || 1;
      }
    }
    setBirthYear(y);
    setBirthMonth(m);
    setBirthDay(d);
    setFormBirthDateFormatted(`${y}/${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}`);
    setFormError(null);
    setIsSubmitting(false);
    setShowAddModal(true);
  };

  // Submit with Duplication Protection & Validation
  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent duplicate rapid submissions immediately
    if (isSubmitting) return;

    setFormError(null);

    const cleanNationalId = toEnglishDigits(formNationalId).trim();
    if (!cleanNationalId || cleanNationalId.length !== 10) {
      setFormError('کد ملی باید دقیقاً ۱۰ رقم عددی باشد.');
      return;
    }

    const nationalIdCheck = validateIranianNationalId(cleanNationalId);
    if (!nationalIdCheck.isValid) {
      setFormError(nationalIdCheck.message || 'کد ملی وارد شده طبق الگوریتم ثبت احوال معتبر نمی‌باشد.');
      return;
    }

    // Check for duplicate national ID in existing student records (for additions)
    if (!editingStudent) {
      const isDuplicate = students.some((s) => s.nationalId === cleanNationalId);
      if (isDuplicate) {
        setFormError(`دانش‌آموزی با کد ملی ${cleanNationalId} قبلاً در سامانه ثبت شده است.`);
        return;
      }
    }

    // Validate Birth Date
    const dateValidation = validatePersianBirthDate(birthYear, birthMonth, birthDay);
    if (!dateValidation.isValid) {
      setFormError(dateValidation.message || 'تاریخ تولد واردشده نامعتبر است.');
      return;
    }

    const targetClass = classes.find((c) => c.id === formClassId) || classes[0];

    try {
      setIsSubmitting(true);

      const computedUsername = (formUsername.trim() || cleanNationalId);
      const computedPassword = (formPassword.trim() || cleanNationalId);

      if (editingStudent) {
        await updateStudent(editingStudent.id, {
          firstName: formFirstName.trim(),
          lastName: formLastName.trim(),
          nationalId: cleanNationalId,
          fatherName: formFatherName.trim(),
          birthDate: formBirthDateFormatted,
          birthYear,
          birthMonth,
          birthDay,
          age: dateValidation.age,
          username: computedUsername,
          classId: targetClass.id,
          className: targetClass.name,
          gradeLevel: targetClass.gradeLevel,
          fieldOfStudy: targetClass.fieldOfStudy || 'عمومی',
          parentPhone: formParentPhone.trim(),
          disciplineScore: parseFloat(formDiscipline) || 20,
          address: formAddress.trim(),
        });
        setActionSuccessMsg(`اطلاعات دانش‌آموز ${formFirstName} ${formLastName} با موفقیت به‌روزرسانی شد.`);
      } else {
        await addStudent({
          firstName: formFirstName.trim(),
          lastName: formLastName.trim(),
          nationalId: cleanNationalId,
          fatherName: formFatherName.trim(),
          birthDate: formBirthDateFormatted,
          birthYear,
          birthMonth,
          birthDay,
          age: dateValidation.age,
          username: computedUsername,
          classId: targetClass.id,
          className: targetClass.name,
          gradeLevel: targetClass.gradeLevel,
          fieldOfStudy: targetClass.fieldOfStudy || 'دوره اول متوسطه',
          parentPhone: formParentPhone.trim(),
          disciplineScore: parseFloat(formDiscipline) || 20,
          address: formAddress.trim(),
          password: computedPassword,
        } as any);
        setActionSuccessMsg(`دانش‌آموز جدید «${formFirstName} ${formLastName}» با موفقیت در پایگاه داده ثبت شد.`);
      }

      setShowAddModal(false);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Error saving student:', err);
      setFormError(err.response?.data?.message || err.message || 'خطا در ثبت اطلاعات دانش‌آموز. لطفاً مجدداً تلاش کنید.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (studentToDelete) {
      try {
        await deleteStudent(studentToDelete.id);
        setActionSuccessMsg(`پرونده دانش‌آموز «${studentToDelete.firstName} ${studentToDelete.lastName}» از سیستم حذف شد.`);
        setStudentToDelete(null);
        setTimeout(() => setActionSuccessMsg(null), 4000);
      } catch (err: any) {
        setActionErrorMsg(err.message || 'خطا در حذف دانش‌آموز');
        setTimeout(() => setActionErrorMsg(null), 4000);
      }
    }
  };

  const handleResetPassword = async (std: Student) => {
    try {
      await resetStudentPassword(std.id);
      setActionSuccessMsg(`رمز عبور دانش‌آموز «${std.firstName} ${std.lastName}» با موفقیت به کد ملی (${toPersianDigits(std.nationalId)}) بازنشانی شد.`);
      setTimeout(() => setActionSuccessMsg(null), 4500);
    } catch (err: any) {
      setActionErrorMsg(err.message || 'خطا در بازنشانی رمز عبور');
      setTimeout(() => setActionErrorMsg(null), 4000);
    }
  };

  const handleToggleStatus = async (std: Student) => {
    try {
      await toggleStudentActive(std.id);
      setActionSuccessMsg(
        std.isActive
          ? `حساب کاربری «${std.firstName} ${std.lastName}» با موفقیت مسدود/غیرفعال گردید.`
          : `حساب کاربری «${std.firstName} ${std.lastName}» مجدداً فعال شد.`
      );
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err: any) {
      setActionErrorMsg(err.message || 'خطا در تغییر وضعیت حساب');
      setTimeout(() => setActionErrorMsg(null), 4000);
    }
  };

  // Export current filtered list to Excel (.xlsx)
  const handleExportExcel = () => {
    const data = filteredStudents.map((s, idx) => {
      const metrics = studentMetricsMap.get(s.id);
      return {
        'ردیف': idx + 1,
        'کد ملی': s.nationalId,
        'کد دانش‌آموزی': s.studentCode,
        'نام': s.firstName,
        'نام خانوادگی': s.lastName,
        'نام پدر': s.fatherName,
        'تاریخ تولد': s.birthDate || '۱۳۹۱/۰۳/۱۵',
        'سن': metrics?.age ? `${metrics.age} سال` : '-',
        'نام کلاس': s.className,
        'پایه تحصیلی': s.gradeLevel,
        'معدل کل': metrics?.gpa ? metrics.gpa.toFixed(2) : '0.00',
        'درصد حضور': `${metrics?.attendanceRate || 0}%`,
        'شماره تماس ولی': s.parentPhone || '',
        'وضعیت حساب': s.isActive ? 'فعال' : 'غیرفعال',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'دانش‌آموزان');
    XLSX.writeFile(workbook, `padideh_danesh_students_export_${Date.now()}.xlsx`);
  };

  // Download Standard Excel Template for Bulk Import
  const handleDownloadSampleExcel = () => {
    const headers = [
      ['کد ملی', 'نام', 'نام خانوادگی', 'نام پدر', 'سال تولد', 'ماه تولد', 'روز تولد', 'شماره همراه ولی', 'نام کلاس'],
      ['0081234567', 'علی', 'رضایی', 'محسن', 1391, 3, 15, '09121112233', classes[0]?.name || 'کلاس ۱۰۱'],
      ['0082345678', 'محمد', 'حسینی', 'علیرضا', 1390, 8, 20, '09122223344', classes[0]?.name || 'کلاس ۱۰۱'],
      ['0083456789', 'امیرحسین', 'محمدی', 'مهدی', 1391, 11, 29, '09123334455', classes[1]?.name || 'کلاس ۱۰۲'],
      ['0084567890', 'سینا', 'کریمی', 'حسین', 1389, 6, 31, '09124445566', classes[1]?.name || 'کلاس ۱۰۲'],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(headers);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'الگوی ورود دانش‌آموزان');
    XLSX.writeFile(workbook, 'الگوی_ورود_گروهی_دانش_آموزان_پدیده_دانش.xlsx');
  };

  // Process Excel File on Drag & Drop or Input Change
  const processExcelFile = async (file: File) => {
    try {
      setIsParsingFile(true);
      setImportFileName(file.name);
      setImportResult(null);

      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      const rawRows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

      if (rawRows.length <= 1) {
        setImportRows([]);
        setIsParsingFile(false);
        return;
      }

      // Find headers mapping
      const headerRow: string[] = rawRows[0].map((h: any) => String(h).trim());

      const getColIndex = (keywords: string[]) => {
        return headerRow.findIndex((h) => keywords.some((k) => h.includes(k)));
      };

      const natIdIdx = getColIndex(['کد ملی', 'کدملی', 'national', 'id', 'melli']);
      const firstNameIdx = getColIndex(['نام', 'first']);
      const lastNameIdx = getColIndex(['خانوادگی', 'فامیل', 'last']);
      const fatherNameIdx = getColIndex(['پدر', 'father']);
      const birthYearIdx = getColIndex(['سال تولد', 'سال', 'birth year']);
      const birthMonthIdx = getColIndex(['ماه تولد', 'ماه', 'month']);
      const birthDayIdx = getColIndex(['روز تولد', 'روز', 'day']);
      const phoneIdx = getColIndex(['همراه', 'تلفن', 'موبایل', 'phone']);
      const classIdx = getColIndex(['کلاس', 'class']);

      const parsed: CSVImportPreviewRow[] = [];
      const seenNationalIdsInFile = new Set<string>();

      for (let i = 1; i < rawRows.length; i++) {
        const row = rawRows[i];
        if (!row || row.every((c: any) => !c || String(c).trim() === '')) continue;

        const natId = natIdIdx !== -1 ? toEnglishDigits(String(row[natIdIdx] || '')).trim() : toEnglishDigits(String(row[0] || '')).trim();
        const firstName = firstNameIdx !== -1 ? String(row[firstNameIdx] || '').trim() : String(row[1] || '').trim();
        const lastName = lastNameIdx !== -1 ? String(row[lastNameIdx] || '').trim() : String(row[2] || '').trim();
        const fatherName = fatherNameIdx !== -1 ? String(row[fatherNameIdx] || '').trim() : (row[3] ? String(row[3]).trim() : 'نامشخص');
        
        let bYear = birthYearIdx !== -1 ? parseInt(toEnglishDigits(String(row[birthYearIdx])), 10) : 1391;
        let bMonth = birthMonthIdx !== -1 ? parseInt(toEnglishDigits(String(row[birthMonthIdx])), 10) : 3;
        let bDay = birthDayIdx !== -1 ? parseInt(toEnglishDigits(String(row[birthDayIdx])), 10) : 15;

        // Fallbacks if year is undefined
        if (isNaN(bYear) || bYear < 1370) bYear = 1391;
        if (isNaN(bMonth) || bMonth < 1 || bMonth > 12) bMonth = 3;
        if (isNaN(bDay) || bDay < 1) bDay = 15;

        const phone = phoneIdx !== -1 ? String(row[phoneIdx] || '').trim() : '۰۹۱۲۰۰۰۰۰۰۰';
        const clsName = classIdx !== -1 ? String(row[classIdx] || '').trim() : (classes[0]?.name || 'کلاس هفتم الف');

        const errors: string[] = [];

        if (!firstName) errors.push('نام دانش‌آموز خالی است');
        if (!lastName) errors.push('نام خانوادگی خالی است');

        if (!natId) {
          errors.push('کد ملی وارد نشده است');
        } else if (natId.length !== 10) {
          errors.push(`کد ملی ۱۰ رقمی نیست (${natId.length} رقم)`);
        } else if (!validateIranianNationalId(natId).isValid) {
          errors.push('کد ملی طبق الگوریتم ثبت احوال نامعتبر است');
        } else if (seenNationalIdsInFile.has(natId)) {
          errors.push('کد ملی در همین فایل تکرار شده است');
        } else if (students.some((s) => s.nationalId === natId)) {
          errors.push('کد ملی قبلاً در پایگاه داده مدرسه ثبت شده است');
        }

        seenNationalIdsInFile.add(natId);

        const dateCheck = validatePersianBirthDate(bYear, bMonth, bDay);
        if (!dateCheck.isValid) {
          errors.push(dateCheck.message || 'تاریخ تولد نامعتبر است');
        }

        const isValid = errors.length === 0;
        const formattedBirth = `${bYear}/${String(bMonth).padStart(2, '0')}/${String(bDay).padStart(2, '0')}`;
        const age = calculateJalaliAge(bYear, bMonth, bDay).age;

        parsed.push({
          rowNumber: i,
          firstName,
          lastName,
          nationalId: natId,
          fatherName,
          birthYear: bYear,
          birthMonth: bMonth,
          birthDay: bDay,
          birthDate: formattedBirth,
          age,
          className: clsName,
          parentPhone: phone,
          username: natId,
          isValid,
          errors,
          error: errors.join(' • '),
        });
      }

      setImportRows(parsed);
    } catch (err: any) {
      console.error('Error parsing Excel:', err);
      setActionErrorMsg('خطا در خواندن فایل اکسل. لطفاً از فرمت استاندارد XLSX استفاده کنید.');
    } finally {
      setIsParsingFile(false);
    }
  };

  const handleExecuteBulkImport = async () => {
    const validRows = importRows.filter((r) => r.isValid);
    if (validRows.length === 0) return;

    try {
      setIsImporting(true);
      const res = await bulkImportStudents(validRows);
      setImportResult(res);

      if (res.successCount > 0) {
        setActionSuccessMsg(`عملیات ورود با موفقیت انجام شد: ${toPersianDigits(res.successCount)} دانش‌آموز به پایگاه داده اضافه شدند.`);
        setTimeout(() => {
          setShowImportModal(false);
          setImportRows([]);
          setImportResult(null);
          setActionSuccessMsg(null);
        }, 2800);
      }
    } catch (err: any) {
      setActionErrorMsg(err.message || 'خطا در ثبت نهایی ردیف‌های اکسل.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadErrorReport = () => {
    const errorRows = importRows.filter((r) => !r.isValid);
    if (errorRows.length === 0) return;

    const data = errorRows.map((r) => ({
      'ردیف در فایل': r.rowNumber,
      'کد ملی': r.nationalId,
      'نام': r.firstName,
      'نام خانوادگی': r.lastName,
      'علت خطا': r.error,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'خطاهای ورود');
    XLSX.writeFile(workbook, `گزارش_خطای_ورود_دانش‌آموزان_${Date.now()}.xlsx`);
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const displayedImportRows = useMemo(() => {
    if (importFilter === 'valid') return importRows.filter((r) => r.isValid);
    if (importFilter === 'invalid') return importRows.filter((r) => !r.isValid);
    return importRows;
  }, [importRows, importFilter]);

  const isStrictValidation = useMemo(() => isStrictNationalIdValidationEnabled(), []);

  return (
    <div className="space-y-6 text-right">
      {/* Top Header & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            سامانه جامع مدیریت و ارزشیابی دانش‌آموزان
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            ثبت پرونده انفرادی و ورود گروهی اکسل با اعتبارسنجی ثبت‌احوال، تاریخ تولد شمسی و محاسبه سن هوشمند
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
            title="خروجی کامل فهرست جاری به صورت فایل اکسل"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>خروجی اکسل ({toPersianDigits(filteredStudents.length)})</span>
          </button>

          <button
            onClick={() => {
              setImportResult(null);
              setImportRows([]);
              setImportFileName(null);
              setShowImportModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 font-bold text-xs transition-colors cursor-pointer border border-emerald-200 dark:border-emerald-800"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>ورود گروهی اکسل (.xlsx)</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>ثبت نام دانش‌آموز جدید</span>
          </button>
        </div>
      </div>

      {/* Development Mode Status Banner for National ID Validation */}
      {!isStrictValidation ? (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 dark:border-amber-500/20 text-slate-800 dark:text-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-xs text-amber-700 dark:text-amber-300">
                  حالت توسعه و آزمایشی (Development Mode)
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-[10px] font-mono font-bold border border-amber-200 dark:border-amber-800">
                  NATIONAL_ID_STRICT_VALIDATION=false
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                اعتبارسنجی سخت‌گیرانه رقم کنترلی ثبت‌احوال برای کد ملی غیرفعال است؛ ثبت و ورود کدهای ملی ۱۰ رقمی آزمایشی و فرضی (مانند ۱۱۱۱۱۱۱۱۱۱ یا ۱۲۳۴۵۶۷۸۹۰) مجاز است.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800 shrink-0 self-start sm:self-center">
            ✓ پذیرش کدهای آزمایشی فعال
          </span>
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="font-bold">
              اعتبارسنجی رسمی ثبت احوال فعال است (NATIONAL_ID_STRICT_VALIDATION=true)
            </span>
          </div>
        </div>
      )}

      {/* Action Success / Error Toasts */}
      {actionSuccessMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {actionErrorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{actionErrorMsg}</span>
        </div>
      )}

      {/* Advanced Filter Toolbar */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search bar */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute right-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو بر اساس نام، کدملی، نام پدر، تلفن یا کلاس..."
              className="w-full pr-10 pl-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Class Filter */}
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold cursor-pointer"
          >
            <option value="all">تمامی کلاس‌ها ({toPersianDigits(classes.length)} کلاس)</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} (پایه {cls.gradeLevel})
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold cursor-pointer"
          >
            <option value="all">وضعیت حساب: همه</option>
            <option value="active">فقط حساب‌های فعال</option>
            <option value="inactive">فقط حساب‌های مسدود</option>
          </select>

          {/* Performance Tier Filter */}
          <select
            value={selectedPerformanceTier}
            onChange={(e) => setSelectedPerformanceTier(e.target.value as any)}
            className="px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold cursor-pointer"
          >
            <option value="all">سطح معدل: همه</option>
            <option value="top">ممتاز (معدل ۱۸ به بالا)</option>
            <option value="medium">مطلوب (معدل ۱۴ تا ۱۸)</option>
            <option value="low">نیازمند تلاش (زیر ۱۴)</option>
          </select>
        </div>

        {/* Quick Sorting & Stats Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 font-bold flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" />
              مرتب‌سازی:
            </span>
            <button
              onClick={() => {
                if (sortBy === 'name') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                else { setSortBy('name'); setSortOrder('asc'); }
              }}
              className={`px-2.5 py-1 rounded-xl font-bold cursor-pointer transition-colors ${
                sortBy === 'name' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              نام و خانوادگی {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => {
                if (sortBy === 'nationalId') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                else { setSortBy('nationalId'); setSortOrder('asc'); }
              }}
              className={`px-2.5 py-1 rounded-xl font-bold cursor-pointer transition-colors ${
                sortBy === 'nationalId' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              کد ملی {sortBy === 'nationalId' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => {
                if (sortBy === 'gpa') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                else { setSortBy('gpa'); setSortOrder('desc'); }
              }}
              className={`px-2.5 py-1 rounded-xl font-bold cursor-pointer transition-colors ${
                sortBy === 'gpa' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              معدل {sortBy === 'gpa' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => {
                if (sortBy === 'attendance') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                else { setSortBy('attendance'); setSortOrder('desc'); }
              }}
              className={`px-2.5 py-1 rounded-xl font-bold cursor-pointer transition-colors ${
                sortBy === 'attendance' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              حضور {sortBy === 'attendance' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => {
                if (sortBy === 'age') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                else { setSortBy('age'); setSortOrder('asc'); }
              }}
              className={`px-2.5 py-1 rounded-xl font-bold cursor-pointer transition-colors ${
                sortBy === 'age' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              سن و تاریخ تولد {sortBy === 'age' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>

          <div className="text-slate-500 font-bold">
            نمایش {toPersianDigits(filteredStudents.length)} دانش‌آموز از مجموع {toPersianDigits(students.length)} پرونده
          </div>
        </div>
      </div>

      {/* Main Student List Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Users className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
              هیچ دانش‌آموزی مطابق معیارهای فیلتر یافت نشد.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedClassFilter('all');
                setSelectedGradeFilter('all');
                setSelectedStatusFilter('all');
                setSelectedPerformanceTier('all');
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer"
            >
              پاکسازی فیلترها
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">مشخصات دانش‌آموز</th>
                    <th className="py-3.5 px-4">کد ملی / شناسه</th>
                    <th className="py-3.5 px-4">تاریخ تولد و سن</th>
                    <th className="py-3.5 px-4">کلاس و پایه</th>
                    <th className="py-3.5 px-4 text-center">معدل پویا</th>
                    <th className="py-3.5 px-4 text-center">درصد حضور</th>
                    <th className="py-3.5 px-4 text-center">وضعیت حساب</th>
                    <th className="py-3.5 px-4 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {paginatedStudents.map((std) => {
                    const metrics = studentMetricsMap.get(std.id) || { gpa: 0, attendanceRate: 0, age: 13 };

                    return (
                      <tr
                        key={std.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                      >
                        {/* Student Name & Father */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black shrink-0 border border-blue-100 dark:border-blue-900">
                              {std.firstName.charAt(0)}
                            </div>
                            <div>
                              <span className="font-black text-slate-900 dark:text-white block text-sm">
                                {std.firstName} {std.lastName}
                              </span>
                              <span className="text-[11px] text-slate-400 font-medium">
                                فرزند {std.fatherName || 'نامشخص'} • همراه: {toPersianDigits(std.parentPhone || '-')}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* National Code */}
                        <td className="py-3.5 px-4 font-mono">
                          <span className="font-bold text-slate-800 dark:text-slate-200 block">
                            {toPersianDigits(std.nationalId)}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            کد: {toPersianDigits(std.studentCode)}
                          </span>
                        </td>

                        {/* Birth Date & Age */}
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                            {std.birthDate ? toPersianDigits(std.birthDate) : '۱۳۹۱/۰۳/۱۵'}
                          </span>
                          <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                            {toPersianDigits(metrics.age)} سال
                          </span>
                        </td>

                        {/* Class & Grade */}
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-800 dark:text-slate-200 block">
                            {std.className}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            پایه {std.gradeLevel}
                          </span>
                        </td>

                        {/* GPA */}
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-xl font-black text-xs ${getGradeColorClass(
                              metrics.gpa
                            )} bg-slate-100 dark:bg-slate-800`}
                          >
                            {formatScore(metrics.gpa)}
                          </span>
                        </td>

                        {/* Attendance */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex flex-col items-center gap-1">
                            <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                              {toPersianDigits(metrics.attendanceRate)}٪
                            </span>
                            <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  metrics.attendanceRate >= 85 ? 'bg-emerald-500' : metrics.attendanceRate > 0 ? 'bg-amber-500' : 'bg-slate-300'
                                }`}
                                style={{ width: `${metrics.attendanceRate}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              std.isActive
                                ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600'
                                : 'bg-rose-50 dark:bg-rose-950 text-rose-600'
                            }`}
                          >
                            {std.isActive ? 'فعال' : 'غیرفعال'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setDossierStudent(std)}
                              className="p-1.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/60 text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                              title="مشاهده پرونده کامل دیجیتال"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleOpenEdit(std)}
                              className="p-1.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/60 text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                              title="ویرایش مشخصات"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleResetPassword(std)}
                              className="p-1.5 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/60 text-slate-500 hover:text-amber-600 transition-colors cursor-pointer"
                              title="بازنشانی رمز عبور به کد ملی"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleToggleStatus(std)}
                              className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                                std.isActive
                                  ? 'hover:bg-rose-50 dark:hover:bg-rose-950/60 text-slate-500 hover:text-rose-600'
                                  : 'hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-slate-500 hover:text-emerald-600'
                              }`}
                              title={std.isActive ? 'غیرفعال‌سازی حساب' : 'فعال‌سازی حساب'}
                            >
                              {std.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                            </button>

                            <button
                              onClick={() => setStudentToDelete(std)}
                              className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/60 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                              title="حذف پرونده دانش‌آموز"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">تعداد ردیف در هر صفحه:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
            >
              <option value={10}>۱۰ مورد</option>
              <option value={25}>۲۵ مورد</option>
              <option value={50}>۵۰ مورد</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <span className="font-bold text-slate-700 dark:text-slate-300">
              صفحه {toPersianDigits(currentPage)} از {toPersianDigits(totalPages)}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Digital Dossier Modal */}
      <AdminStudentDossierModal
        isOpen={!!dossierStudent}
        student={dossierStudent}
        onClose={() => setDossierStudent(null)}
        onEdit={(std) => handleOpenEdit(std)}
      />

      {/* Confirm Delete Dialog */}
      <AdminConfirmDialog
        isOpen={!!studentToDelete}
        title="حذف پرونده دانش‌آموز"
        message={`آیا از حذف پرونده تحصیلی «${studentToDelete?.firstName} ${studentToDelete?.lastName}» به همراه کلیه نمرات و سوابق حضور و غیاب وی از سیستم اطمینان کامل دارید؟ این عمل غیرقابل بازگشت است.`}
        confirmLabel="حذف دائم دانش‌آموز"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setStudentToDelete(null)}
      />

      {/* Add / Edit Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 text-right space-y-4 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
              <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                {editingStudent ? 'ویرایش پرونده دانش‌آموز' : 'ثبت نام دانش‌آموز جدید و صدور حساب'}
              </h3>
              <button
                onClick={() => !isSubmitting && setShowAddModal(false)}
                disabled={isSubmitting}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 cursor-pointer disabled:opacity-40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveStudent} className="space-y-4 text-xs">
              {/* Personal Info */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div className="font-black text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>۱. اطلاعات فردی و شناسنامه‌ای</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                      نام دانش‌آموز: <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formFirstName}
                      onChange={(e) => setFormFirstName(e.target.value)}
                      placeholder="مثال: علی"
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                      نام خانوادگی: <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formLastName}
                      onChange={(e) => setFormLastName(e.target.value)}
                      placeholder="مثال: حسینی"
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                      کد ملی (۱۰ رقم): <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={10}
                      value={formNationalId}
                      onChange={(e) => setFormNationalId(e.target.value)}
                      placeholder="مثال: 0081234567 یا 1111111111"
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-black outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                      {!isStrictValidation ? (
                        <span className="text-amber-600 dark:text-amber-400 font-medium">
                          ⚡ حالت توسعه: هر کد ۱۰ رقمی تستی پذیرفته می‌شود.
                        </span>
                      ) : (
                        <span className="text-blue-600 dark:text-blue-400 font-medium">
                          ✓ اعتبارسنجی رقم کنترلی ثبت احوال فعال است.
                        </span>
                      )}
                    </span>
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                      نام پدر: <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formFatherName}
                      onChange={(e) => setFormFatherName(e.target.value)}
                      placeholder="مثال: محمد"
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Professional Persian Date Picker & Dynamic Age */}
                <div className="pt-1">
                  <PersianDatePicker
                    year={birthYear}
                    month={birthMonth}
                    day={birthDay}
                    onChange={({ year, month, day, formatted }) => {
                      setBirthYear(year);
                      setBirthMonth(month);
                      setBirthDay(day);
                      setFormBirthDateFormatted(formatted);
                    }}
                    showAgeBadge={true}
                  />
                </div>
              </div>

              {/* Class & Contact Info */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div className="font-black text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                  <span>۲. انتساب کلاس و اطلاعات ارتباطی</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                      کلاس تحصیلی: <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formClassId}
                      onChange={(e) => setFormClassId(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold cursor-pointer"
                    >
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name} (پایه {cls.gradeLevel})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                      شماره تماس اولیا:
                    </label>
                    <input
                      type="text"
                      value={formParentPhone}
                      onChange={(e) => setFormParentPhone(e.target.value)}
                      placeholder="۰۹۱۲۰۰۰۰۰۰۰"
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                    آدرس منزل:
                  </label>
                  <input
                    type="text"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    placeholder="تهران، خیابان ولیعصر..."
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
                  />
                </div>
              </div>

              {/* Authentication Credentials */}
              <div className="space-y-3 p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/60">
                <div className="flex items-center justify-between">
                  <div className="font-black text-blue-950 dark:text-blue-200 text-xs flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-blue-600" />
                    <span>۳. مشخصات ورود به سامانه دانش‌آموز</span>
                  </div>
                  <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                    (پیش‌فرض: کد ملی)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                      نام کاربری:
                    </label>
                    <input
                      type="text"
                      value={formUsername}
                      onChange={(e) => setFormUsername(e.target.value)}
                      placeholder={formNationalId ? formNationalId : 'پیش‌فرض: کد ملی'}
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 font-mono font-bold outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-600 dark:text-slate-400 font-bold">
                        کلمه عبور:
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-[10px] text-blue-600 hover:underline cursor-pointer"
                      >
                        {showPassword ? 'مخفی‌سازی' : 'نمایش'}
                      </button>
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder={formNationalId ? formNationalId : 'پیش‌فرض: کد ملی'}
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 font-mono font-bold outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons with Lock & Spinner */}
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-4 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>در حال اعتبارسنجی و ثبت در پایگاه داده...</span>
                    </>
                  ) : (
                    <span>{editingStudent ? 'ذخیره تغییرات پرونده' : 'ثبت نام قطعی و ایجاد حساب کاربری'}</span>
                  )}
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setShowAddModal(false)}
                  className="py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold cursor-pointer disabled:opacity-40"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enterprise Bulk Excel Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 text-right space-y-4 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
              <div>
                <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  سامانه ورود گروهی دانش‌آموزان از طریق اکسل (.xlsx / .xls)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  اعتبارسنجی خودکار ساختار شناسنامه‌ای، تاریخ تولد شمسی و تخصیص کلاس‌ها
                </p>
                {!isStrictValidation && (
                  <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                    <span>⚡ حالت توسعه:</span>
                    <span>کدهای ملی ۱۰ رقمی ساختگی و تستی بدون بررسی رقم کنترلی ثبت‌احوال پذیرفته می‌شوند.</span>
                  </p>
                )}
              </div>
              <button
                onClick={() => !isImporting && setShowImportModal(false)}
                disabled={isImporting}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 cursor-pointer disabled:opacity-40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Template Download & Upload Area */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 space-y-2 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-xs text-blue-950 dark:text-blue-200 flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5 text-blue-600" />
                    دانلود فایل نمونه استاندارد اکسل
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                    شامل ستون‌های کد ملی، نام، نام خانوادگی، نام پدر، سال/ماه/روز تولد و نام کلاس.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadSampleExcel}
                  className="w-full py-2 px-3 rounded-xl bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-bold text-xs hover:bg-blue-50 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>دریافت فایل نمونه (.xlsx)</span>
                </button>
              </div>

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    processExcelFile(e.dataTransfer.files[0]);
                  }
                }}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors cursor-pointer text-center flex flex-col items-center justify-center space-y-1.5"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      processExcelFile(e.target.files[0]);
                    }
                  }}
                />
                <Upload className="w-6 h-6 text-emerald-600" />
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                  {importFileName ? importFileName : 'انتخاب یا رهاسازی فایل اکسل (.xlsx / .csv)'}
                </span>
                <span className="text-[10px] text-slate-400">
                  برای بارگذاری کلیک کنید یا فایل را اینجا بکشید
                </span>
              </div>
            </div>

            {/* Validation Statistics Bar */}
            {importRows.length > 0 && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-600 dark:text-slate-300">
                      مجموع ردیف‌ها: <strong className="font-mono">{toPersianDigits(importRows.length)}</strong>
                    </span>
                    <span className="text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      معتبر: <strong className="font-mono">{toPersianDigits(importRows.filter((r) => r.isValid).length)}</strong>
                    </span>
                    {importRows.some((r) => !r.isValid) && (
                      <span className="text-rose-600 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        دارای خطا: <strong className="font-mono">{toPersianDigits(importRows.filter((r) => !r.isValid).length)}</strong>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex rounded-xl bg-white dark:bg-slate-700 p-0.5 border border-slate-200 dark:border-slate-600 text-[11px]">
                      <button
                        onClick={() => setImportFilter('all')}
                        className={`px-2 py-1 rounded-lg cursor-pointer ${
                          importFilter === 'all' ? 'bg-blue-600 text-white font-bold' : 'text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        همه
                      </button>
                      <button
                        onClick={() => setImportFilter('valid')}
                        className={`px-2 py-1 rounded-lg cursor-pointer ${
                          importFilter === 'valid' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        فقط معتبر
                      </button>
                      <button
                        onClick={() => setImportFilter('invalid')}
                        className={`px-2 py-1 rounded-lg cursor-pointer ${
                          importFilter === 'invalid' ? 'bg-rose-600 text-white font-bold' : 'text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        فقط خطاها
                      </button>
                    </div>

                    {importRows.some((r) => !r.isValid) && (
                      <button
                        type="button"
                        onClick={handleDownloadErrorReport}
                        className="px-2.5 py-1 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[11px] font-bold border border-rose-200 cursor-pointer flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        <span>دانلود گزارش خطاها</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Rows Table */}
                <div className="max-h-64 overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/90 text-slate-500 dark:text-slate-400 font-bold sticky top-0">
                      <tr>
                        <th className="py-2 px-3">ردیف</th>
                        <th className="py-2 px-3">کد ملی</th>
                        <th className="py-2 px-3">نام و خانوادگی</th>
                        <th className="py-2 px-3">نام پدر</th>
                        <th className="py-2 px-3">تاریخ تولد / سن</th>
                        <th className="py-2 px-3">کلاس</th>
                        <th className="py-2 px-3 text-center">وضعیت اعتبارسنجی</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {displayedImportRows.map((row) => (
                        <tr
                          key={row.rowNumber}
                          className={row.isValid ? 'hover:bg-emerald-50/30' : 'bg-rose-50/50 dark:bg-rose-950/20'}
                        >
                          <td className="py-2 px-3 text-slate-400 font-mono">{toPersianDigits(row.rowNumber)}</td>
                          <td className="py-2 px-3 font-mono font-bold">{toPersianDigits(row.nationalId)}</td>
                          <td className="py-2 px-3 font-bold">{row.firstName} {row.lastName}</td>
                          <td className="py-2 px-3 text-slate-500">{row.fatherName}</td>
                          <td className="py-2 px-3">
                            <span className="font-mono text-[11px]">{toPersianDigits(row.birthDate || '')}</span>
                            {row.age !== undefined && (
                              <span className="mr-1 text-[10px] text-slate-400">({toPersianDigits(row.age)} سال)</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-slate-600">{row.className}</td>
                          <td className="py-2 px-3 text-center">
                            {row.isValid ? (
                              <span className="text-emerald-600 font-bold inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> معتبر
                              </span>
                            ) : (
                              <span className="text-rose-600 font-bold inline-flex items-center gap-1" title={row.error}>
                                <AlertCircle className="w-3.5 h-3.5" /> {row.error}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Footer Import Execution Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleExecuteBulkImport}
                disabled={isImporting || importRows.filter((r) => r.isValid).length === 0}
                className="flex-1 py-3 px-4 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>در حال ذخیره دسته‌جمعی در پایگاه داده...</span>
                  </>
                ) : (
                  <span>
                    تایید و ثبت نهایی {toPersianDigits(importRows.filter((r) => r.isValid).length)} دانش‌آموز معتبر در پایگاه داده
                  </span>
                )}
              </button>
              <button
                type="button"
                disabled={isImporting}
                onClick={() => setShowImportModal(false)}
                className="py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold cursor-pointer disabled:opacity-40"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
