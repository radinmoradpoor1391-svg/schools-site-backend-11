import { apiClient } from './axios';

export interface StudentAcademicProgressResponse {
  student_id: number | string;
  student_name: string;
  student_code: string;
  class_name: string;
  grade_level: string;
  overall_gpa: number;
  baseline_gpa: number;
  current_gpa: number;
  improvement_percentage: number;
  trend: 'improving' | 'declining' | 'stable';
  monthly_series: {
    month: string;
    gpa: number;
    subjects_count: number;
    subjects: {
      subject_id: number;
      subject_title: string;
      score: number;
      grade_type: string;
    }[];
  }[];
}

export interface ClassAnalyticsResponse {
  class_id: number | string;
  class_name: string;
  grade_level: string;
  student_count: number;
  class_average: number;
  attendance_rate: number;
  top_students: {
    student_id: number | string;
    student_name: string;
    student_code: string;
    gpa: number;
    attendance_rate: number;
  }[];
  students_at_risk: {
    student_id: number | string;
    student_name: string;
    student_code: string;
    gpa: number;
    attendance_rate: number;
    reasons: string[];
  }[];
  all_students_ranked: {
    student_id: number | string;
    student_name: string;
    student_code: string;
    gpa: number;
    attendance_rate: number;
  }[];
}

export interface SchoolProgressResponse {
  school_average: number;
  total_students: number;
  total_classes: number;
  class_comparisons: {
    class_id: number | string;
    class_name: string;
    grade_level: string;
    class_average: number;
    student_count: number;
    attendance_rate: number;
    at_risk_count: number;
  }[];
  academic_months: string[];
}

export const analyticsApi = {
  /**
   * Get school-wide analytics (Admin)
   */
  async getSchoolProgress(): Promise<SchoolProgressResponse> {
    const res = await apiClient.get<{ success: boolean; data: SchoolProgressResponse }>('/admin/analytics/school');
    return res.data.data;
  },

  /**
   * Get student academic progress by ID (Admin / Teacher)
   */
  async getStudentProgress(studentId: string | number): Promise<StudentAcademicProgressResponse> {
    const res = await apiClient.get<{ success: boolean; data: StudentAcademicProgressResponse }>(`/admin/analytics/student/${studentId}/progress`);
    return res.data.data;
  },

  /**
   * Get class analytics by ID (Admin)
   */
  async getClassAnalytics(classId: string | number): Promise<ClassAnalyticsResponse> {
    const res = await apiClient.get<{ success: boolean; data: ClassAnalyticsResponse }>(`/admin/classes/${classId}/analytics`);
    return res.data.data;
  },

  /**
   * Get current authenticated student's academic progress
   */
  async getMyStudentProgress(): Promise<StudentAcademicProgressResponse> {
    const res = await apiClient.get<{ success: boolean; data: StudentAcademicProgressResponse }>('/student/progress');
    return res.data.data;
  },
};
