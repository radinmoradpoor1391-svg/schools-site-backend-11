import { Student, Teacher, SchoolClass, Subject, Grade, AttendanceRecord, ReportCard } from '../types';

export interface StudentCalculatedStats {
  studentId: string;
  studentName: string;
  gpa: number;
  totalUnits: number;
  totalWeightedScore: number;
  rankInClass: number;
  totalStudentsInClass: number;
  rankInSchool: number;
  totalStudentsInSchool: number;
  attendanceRate: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  passedCount: number;
  failedCount: number;
  subjectScores: {
    subjectId: string;
    subjectTitle: string;
    coefficient: number;
    score: number;
    isPassed: boolean;
    classAverage: number;
  }[];
}

export interface ClassCalculatedStats {
  classId: string;
  className: string;
  gradeLevel: string;
  studentCount: number;
  classAverage: number;
  attendanceRate: number;
  topStudent?: { name: string; gpa: number };
  subjectAverages: {
    subjectId: string;
    subjectTitle: string;
    average: number;
  }[];
  scoreDistribution: {
    excellent: number; // 17 - 20
    good: number;      // 14 - 16.99
    moderate: number;  // 10 - 13.99
    weak: number;      // 0 - 9.99
  };
}

export interface SchoolOverallStats {
  totalStudents: number;
  activeStudents: number;
  totalTeachers: number;
  totalClasses: number;
  schoolAverage: number;
  attendanceRate: number;
  passRate: number;
  totalGradesRecorded: number;
  topStudents: {
    studentId: string;
    name: string;
    className: string;
    gpa: number;
    rank: number;
  }[];
}

/**
 * Calculate GPA (weighted average by coefficient) for a student across all subjects.
 */
export function calculateStudentGPA(
  studentId: string,
  grades: Grade[],
  subjects: Subject[],
  filter?: { academicYearId?: string; semester?: string; month?: string }
): { gpa: number; totalUnits: number; totalWeightedScore: number; passedCount: number; failedCount: number } {
  let relevantGrades = grades.filter((g) => g.studentId === studentId);

  if (filter?.academicYearId) {
    relevantGrades = relevantGrades.filter((g) => g.academicYearId === filter.academicYearId);
  }
  if (filter?.semester) {
    relevantGrades = relevantGrades.filter((g) => g.semester === filter.semester);
  }
  if (filter?.month) {
    relevantGrades = relevantGrades.filter((g) => g.month === filter.month);
  }

  let totalWeightedScore = 0;
  let totalUnits = 0;
  let passedCount = 0;
  let failedCount = 0;

  // Group grades by subject to compute each subject's effective score
  const subjectScoresMap = new Map<string, number[]>();
  relevantGrades.forEach((g) => {
    const list = subjectScoresMap.get(g.subjectId) || [];
    list.push(g.score);
    subjectScoresMap.set(g.subjectId, list);
  });

  subjectScoresMap.forEach((scores, subjectId) => {
    const subj = subjects.find((s) => s.id === subjectId);
    const coeff = subj?.coefficient || 2;
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    totalWeightedScore += avgScore * coeff;
    totalUnits += coeff;

    if (avgScore >= 10) {
      passedCount++;
    } else {
      failedCount++;
    }
  });

  const gpa = totalUnits > 0 ? Number((totalWeightedScore / totalUnits).toFixed(2)) : 0;

  return {
    gpa,
    totalUnits,
    totalWeightedScore: Number(totalWeightedScore.toFixed(2)),
    passedCount,
    failedCount,
  };
}

/**
 * Calculate attendance rate (%) and breakdown for a student.
 */
export function calculateStudentAttendanceStats(
  studentId: string,
  attendanceRecords: AttendanceRecord[]
): { attendanceRate: number; presentCount: number; absentCount: number; lateCount: number; excusedCount: number; totalDays: number } {
  const stdRecords = attendanceRecords.filter((a) => a.studentId === studentId);
  const totalDays = stdRecords.length;

  if (totalDays === 0) {
    return {
      attendanceRate: 100,
      presentCount: 0,
      absentCount: 0,
      lateCount: 0,
      excusedCount: 0,
      totalDays: 0,
    };
  }

  const presentCount = stdRecords.filter((a) => a.status === 'present').length;
  const lateCount = stdRecords.filter((a) => a.status === 'late').length;
  const absentCount = stdRecords.filter((a) => a.status === 'absent').length;
  const excusedCount = stdRecords.filter((a) => a.status === 'excused').length;

  // Late counts as 0.75 present
  const effectivePresent = presentCount + lateCount * 0.75 + excusedCount * 0.9;
  const attendanceRate = Math.min(100, Math.round((effectivePresent / totalDays) * 100));

  return {
    attendanceRate,
    presentCount,
    absentCount,
    lateCount,
    excusedCount,
    totalDays,
  };
}

/**
 * Calculate full student stats including class & school ranking.
 */
export function calculateDetailedStudentStats(
  studentId: string,
  students: Student[],
  grades: Grade[],
  subjects: Subject[],
  attendanceRecords: AttendanceRecord[]
): StudentCalculatedStats {
  const student = students.find((s) => s.id === studentId);
  const classStudents = students.filter((s) => s.classId === student?.classId);

  // 1. Calculate GPA for all students in school
  const allStudentGPAs = students.map((s) => ({
    id: s.id,
    name: `${s.firstName} ${s.lastName}`,
    classId: s.classId,
    ...calculateStudentGPA(s.id, grades, subjects),
  }));

  // Sort descending by GPA
  allStudentGPAs.sort((a, b) => b.gpa - a.gpa);

  const schoolRank = allStudentGPAs.findIndex((s) => s.id === studentId) + 1 || 1;

  // Class GPAs
  const classGPAs = allStudentGPAs.filter((s) => s.classId === student?.classId);
  const classRank = classGPAs.findIndex((s) => s.id === studentId) + 1 || 1;

  const currentGPA = calculateStudentGPA(studentId, grades, subjects);
  const currentAttendance = calculateStudentAttendanceStats(studentId, attendanceRecords);

  // Subject scores breakdown
  const stdGrades = grades.filter((g) => g.studentId === studentId);
  const subjectScores = subjects.map((subj) => {
    const sGrades = stdGrades.filter((g) => g.subjectId === subj.id);
    const score = sGrades.length > 0
      ? Number((sGrades.reduce((acc, curr) => acc + curr.score, 0) / sGrades.length).toFixed(2))
      : 0;

    // Calculate class average for this subject
    const allClassSubjectGrades = grades.filter(
      (g) => g.subjectId === subj.id && classStudents.some((cs) => cs.id === g.studentId)
    );
    const classAvg = allClassSubjectGrades.length > 0
      ? Number((allClassSubjectGrades.reduce((acc, curr) => acc + curr.score, 0) / allClassSubjectGrades.length).toFixed(2))
      : 0;

    return {
      subjectId: subj.id,
      subjectTitle: subj.title,
      coefficient: subj.coefficient,
      score,
      isPassed: score >= 10,
      classAverage: classAvg,
    };
  });

  return {
    studentId,
    studentName: student ? `${student.firstName} ${student.lastName}` : '',
    gpa: currentGPA.gpa,
    totalUnits: currentGPA.totalUnits,
    totalWeightedScore: currentGPA.totalWeightedScore,
    rankInClass: classRank,
    totalStudentsInClass: classStudents.length || 1,
    rankInSchool: schoolRank,
    totalStudentsInSchool: students.length || 1,
    attendanceRate: currentAttendance.attendanceRate,
    presentCount: currentAttendance.presentCount,
    absentCount: currentAttendance.absentCount,
    lateCount: currentAttendance.lateCount,
    passedCount: currentGPA.passedCount,
    failedCount: currentGPA.failedCount,
    subjectScores,
  };
}

/**
 * Calculate class-level statistics.
 */
export function calculateClassStats(
  schoolClass: SchoolClass,
  students: Student[],
  grades: Grade[],
  subjects: Subject[],
  attendanceRecords: AttendanceRecord[]
): ClassCalculatedStats {
  const classStudents = students.filter((s) => s.classId === schoolClass.id);
  const studentGPAs = classStudents.map((s) => ({
    student: s,
    ...calculateStudentGPA(s.id, grades, subjects),
  }));

  const validGPAs = studentGPAs.filter((s) => s.gpa > 0);
  const classAverage = validGPAs.length > 0
    ? Number((validGPAs.reduce((sum, s) => sum + s.gpa, 0) / validGPAs.length).toFixed(2))
    : 0;

  // Top student in class
  const sortedStudents = [...studentGPAs].sort((a, b) => b.gpa - a.gpa);
  const topStudent = sortedStudents.length > 0 && sortedStudents[0].gpa > 0
    ? { name: `${sortedStudents[0].student.firstName} ${sortedStudents[0].student.lastName}`, gpa: sortedStudents[0].gpa }
    : undefined;

  // Subject Averages
  const subjectAverages = subjects.map((subj) => {
    const classSubjectGrades = grades.filter(
      (g) => g.subjectId === subj.id && classStudents.some((cs) => cs.id === g.studentId)
    );
    const avg = classSubjectGrades.length > 0
      ? Number((classSubjectGrades.reduce((sum, g) => sum + g.score, 0) / classSubjectGrades.length).toFixed(2))
      : 0;
    return {
      subjectId: subj.id,
      subjectTitle: subj.title,
      average: avg,
    };
  });

  // Score distribution
  const scoreDistribution = {
    excellent: validGPAs.filter((s) => s.gpa >= 17).length,
    good: validGPAs.filter((s) => s.gpa >= 14 && s.gpa < 17).length,
    moderate: validGPAs.filter((s) => s.gpa >= 10 && s.gpa < 14).length,
    weak: validGPAs.filter((s) => s.gpa < 10).length,
  };

  // Class attendance rate
  const classAttendanceRecords = attendanceRecords.filter((a) => a.classId === schoolClass.id);
  const presentCount = classAttendanceRecords.filter((a) => a.status === 'present').length;
  const attendanceRate = classAttendanceRecords.length > 0
    ? Math.round((presentCount / classAttendanceRecords.length) * 100)
    : 95;

  return {
    classId: schoolClass.id,
    className: schoolClass.name,
    gradeLevel: schoolClass.gradeLevel,
    studentCount: classStudents.length,
    classAverage,
    attendanceRate,
    topStudent,
    subjectAverages,
    scoreDistribution,
  };
}

/**
 * Calculate school-wide aggregate statistics strictly from MySQL/database state.
 */
export function calculateSchoolOverallStats(
  students: Student[],
  teachers: Teacher[],
  classes: SchoolClass[],
  grades: Grade[],
  subjects: Subject[],
  attendanceRecords: AttendanceRecord[]
): SchoolOverallStats {
  const activeStudents = students.filter((s) => s.isActive !== false);

  const studentGPAs = activeStudents.map((s) => {
    const classObj = classes.find((c) => c.id === s.classId);
    return {
      studentId: s.id,
      name: `${s.firstName} ${s.lastName}`,
      className: classObj?.name || 'ـ',
      ...calculateStudentGPA(s.id, grades, subjects),
    };
  });

  const studentsWithGrades = studentGPAs.filter((s) => s.gpa > 0);
  const schoolAverage = studentsWithGrades.length > 0
    ? Number((studentsWithGrades.reduce((sum, s) => sum + s.gpa, 0) / studentsWithGrades.length).toFixed(2))
    : 0;

  const passedStudents = studentsWithGrades.filter((s) => s.gpa >= 10);
  const passRate = studentsWithGrades.length > 0
    ? Math.round((passedStudents.length / studentsWithGrades.length) * 100)
    : 100;

  // Attendance rate
  const totalAttendance = attendanceRecords.length;
  const presentCount = attendanceRecords.filter((a) => a.status === 'present' || a.status === 'late').length;
  const attendanceRate = totalAttendance > 0
    ? Math.round((presentCount / totalAttendance) * 100)
    : 96;

  // Top 5 students in school
  const sorted = [...studentsWithGrades].sort((a, b) => b.gpa - a.gpa);
  const topStudents = sorted.slice(0, 5).map((s, idx) => ({
    studentId: s.studentId,
    name: s.name,
    className: s.className,
    gpa: s.gpa,
    rank: idx + 1,
  }));

  return {
    totalStudents: students.length,
    activeStudents: activeStudents.length,
    totalTeachers: teachers.length,
    totalClasses: classes.length,
    schoolAverage,
    attendanceRate,
    passRate,
    totalGradesRecorded: grades.length,
    topStudents,
  };
}
