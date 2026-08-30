import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Student, Teacher, UserRole } from '../types';
import { authApi } from '../services/schoolApi';
import { toEnglishDigits } from '../utils/persian';

interface AuthContextType {
  user: User | null;
  currentUser: User | null;
  currentStudent: Student | null;
  currentTeacher: Teacher | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  login: (
    nationalId: string,
    password: string,
    expectedRole?: UserRole
  ) => Promise<{ success: boolean; error?: string; requiresPasswordChange?: boolean }>;
  logout: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  switchDemoUser: (role: UserRole, targetId?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to normalize User object from backend API responses
const normalizeUser = (raw: any): User | null => {
  if (!raw) return null;
  const role = (raw.role || 'student').toString().toLowerCase() as UserRole;
  return {
    id: String(raw.id || ''),
    nationalId: raw.nationalId || raw.national_id || raw.username || '',
    firstName: raw.firstName || raw.first_name || (role === 'admin' ? 'مدیر' : 'کاربر'),
    lastName: raw.lastName || raw.last_name || (role === 'admin' ? 'سامانه' : ''),
    role: role,
    email: raw.email || undefined,
    phone: raw.phone || undefined,
    avatarUrl: raw.avatarUrl || raw.avatar_url || undefined,
    isActive: raw.isActive !== undefined ? Boolean(raw.isActive) : (raw.is_active !== undefined ? Boolean(raw.is_active) : true),
    firstLogin: raw.firstLogin !== undefined ? Boolean(raw.firstLogin) : Boolean(raw.first_login),
    createdAt: raw.createdAt || raw.created_at || new Date().toISOString(),
    updatedAt: raw.updatedAt || raw.updated_at || undefined,
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Authenticate and fetch current user profile via Sanctum token on load
  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setCurrentUser(null);
      setCurrentStudent(null);
      setCurrentTeacher(null);
      setIsInitializing(false);
      return;
    }

    try {
      const res = await authApi.getMe();
      if (res.success && res.user) {
        const user = normalizeUser(res.user);
        setCurrentUser(user);
        if (user && user.role === 'student') {
          const studentProfile: Student = (res.profile as Student) || {
            id: user.id || 'std-default',
            userId: user.id,
            nationalId: user.nationalId,
            firstName: user.firstName,
            lastName: user.lastName,
            fatherName: 'احمد',
            classId: 'c1',
            className: 'کلاس ۱۰۱ (هفتم الف)',
            gradeLevel: 'هفتم',
            studentCode: '۴۰۳۰۰۱',
            parentPhone: user.phone || '09120000000',
            isActive: true,
            firstLogin: false,
          };
          setCurrentStudent(studentProfile);
          setCurrentTeacher(null);
        } else if (user && user.role === 'teacher') {
          const teacherProfile: Teacher = (res.profile as Teacher) || {
            id: user.id || 't1',
            userId: user.id,
            nationalId: user.nationalId || '2222222222',
            firstName: user.firstName || 'دکتر احمد',
            lastName: user.lastName || 'حسینی',
            specialty: 'ریاضیات و هندسه تحلیلی',
            degree: 'دکتری ریاضیات کاربردی',
            phone: user.phone || '09122222222',
            email: user.email || 'dr.hosseini@padideh.sch.ir',
            assignedClassIds: ['c1', 'c2', 'c3'],
            assignedSubjectIds: ['s1', 's2', 's8'],
            isActive: true,
            firstLogin: false,
          };
          setCurrentTeacher(teacherProfile);
          setCurrentStudent(null);
        } else {
          setCurrentStudent(null);
          setCurrentTeacher(null);
        }
      } else {
        localStorage.removeItem('auth_token');
        setCurrentUser(null);
      }
    } catch {
      localStorage.removeItem('auth_token');
      setCurrentUser(null);
      setCurrentStudent(null);
      setCurrentTeacher(null);
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();

    const handleUnauthorized = () => {
      setCurrentUser(null);
      setCurrentStudent(null);
      setCurrentTeacher(null);
    };

    window.addEventListener('auth_unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth_unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (
    nationalIdInput: string,
    passwordInput: string,
    expectedRole?: UserRole
  ): Promise<{ success: boolean; error?: string; requiresPasswordChange?: boolean }> => {
    const username = toEnglishDigits(nationalIdInput).trim();
    const password = toEnglishDigits(passwordInput).trim();

    if (!username || !password) {
      return { success: false, error: 'لطفاً کد ملی و رمز عبور را وارد نمایید.' };
    }

    try {
      const res = await authApi.login({ username, password });

      if (res.success && res.token && res.user) {
        const normalized = normalizeUser(res.user);
        if (!normalized) {
          return { success: false, error: 'پاسخ نامعتبر از سرور.' };
        }

        const userRole = (normalized.role || '').toLowerCase();
        const targetRole = expectedRole ? expectedRole.toLowerCase() : undefined;

        if (targetRole && userRole !== targetRole) {
          const roleLabels: Record<string, string> = {
            admin: 'مدیریت',
            teacher: 'دبیران',
            student: 'دانش‌آموزان',
          };
          return {
            success: false,
            error: `این حساب متعلق به سطح دسترسی ${roleLabels[userRole] || userRole} است؛ لطفاً از زبانه مربوطه وارد شوید.`,
          };
        }

        localStorage.setItem('auth_token', res.token);
        setCurrentUser(normalized);

        if (userRole === 'student') {
          const studentProfile: Student = (res.profile as Student) || {
            id: normalized.id || 'std-default',
            userId: normalized.id,
            nationalId: normalized.nationalId,
            firstName: normalized.firstName,
            lastName: normalized.lastName,
            fatherName: 'احمد',
            classId: 'c1',
            className: 'کلاس ۱۰۱ (هفتم الف)',
            gradeLevel: 'هفتم',
            studentCode: '۴۰۳۰۰۱',
            parentPhone: normalized.phone || '09120000000',
            isActive: true,
            firstLogin: false,
          };
          setCurrentStudent(studentProfile);
          setCurrentTeacher(null);
        } else if (userRole === 'teacher') {
          const teacherProfile: Teacher = (res.profile as Teacher) || {
            id: normalized.id || 't1',
            userId: normalized.id,
            nationalId: normalized.nationalId || '2222222222',
            firstName: normalized.firstName || 'دکتر احمد',
            lastName: normalized.lastName || 'حسینی',
            specialty: 'ریاضیات و هندسه تحلیلی',
            degree: 'دکتری ریاضیات کاربردی',
            phone: normalized.phone || '09122222222',
            email: normalized.email || 'dr.hosseini@padideh.sch.ir',
            assignedClassIds: ['c1', 'c2', 'c3'],
            assignedSubjectIds: ['s1', 's2', 's8'],
            isActive: true,
            firstLogin: false,
          };
          setCurrentTeacher(teacherProfile);
          setCurrentStudent(null);
        } else {
          setCurrentStudent(null);
          setCurrentTeacher(null);
        }

        window.dispatchEvent(new Event('auth_state_changed'));

        return {
          success: true,
          requiresPasswordChange: normalized.firstLogin,
        };
      }

      return {
        success: false,
        error: res.message || 'نام کاربری یا رمز عبور اشتباه است.',
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'خطا در برقراری ارتباط با سامانه احراز هویت.',
      };
    }
  };

  const updatePassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!newPassword || newPassword.length < 4) {
      return { success: false, error: 'رمز عبور جدید باید حداقل ۴ کاراکتر باشد.' };
    }

    try {
      const res = await authApi.changePassword({ newPassword, new_password: newPassword });
      if (res.success) {
        if (currentUser) {
          setCurrentUser({ ...currentUser, firstLogin: false });
        }
        return { success: true };
      }
      return { success: false, error: res.message || 'خطا در تغییر کلمه عبور.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'خطا در تغییر رمز عبور.' };
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore network errors during logout
    } finally {
      localStorage.removeItem('auth_token');
      setCurrentUser(null);
      setCurrentStudent(null);
      setCurrentTeacher(null);
      window.dispatchEvent(new Event('auth_state_changed'));
    }
  };

  const switchDemoUser = async (targetRole: UserRole, targetId?: string) => {
    if (targetRole === 'admin') {
      await login('admin', '1234', 'admin');
    } else if (targetRole === 'teacher') {
      await login('2222222222', '1234', 'teacher');
    } else if (targetRole === 'student') {
      await login('1111111111', '1234', 'student');
    }
  };

  if (isInitializing) {
    return null;
  }

  return (
    <AuthContext.Provider
      value={{
        user: currentUser,
        currentUser,
        currentStudent,
        currentTeacher,
        role: currentUser?.role || null,
        isAuthenticated: !!currentUser,
        login,
        logout,
        updatePassword,
        switchDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
