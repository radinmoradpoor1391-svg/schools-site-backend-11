import React, { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { WeeklyTimetable } from '../common/WeeklyTimetable';
import { generateInitialSchedule } from '../../utils/scheduleData';

export const StudentScheduleView: React.FC = () => {
  const { currentStudent } = useAuth();
  const { classes, subjects, teachers } = useData();

  if (!currentStudent) return null;

  const targetClass = classes.find(
    (c) => c.id === currentStudent.classId || c.name === currentStudent.className
  ) || classes[0];

  const allSchedules = useMemo(() => {
    return generateInitialSchedule(classes, subjects, teachers);
  }, [classes, subjects, teachers]);

  const studentSchedule = useMemo(() => {
    if (!targetClass) return allSchedules;
    return allSchedules.filter((s) => s.classId === targetClass.id);
  }, [allSchedules, targetClass]);

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <WeeklyTimetable
        schedule={studentSchedule}
        title={`برنامه هفتگی کلاس ${currentStudent.className}`}
        subtitle={`دانش‌آموز: ${currentStudent.firstName} ${currentStudent.lastName} • پایه ${currentStudent.gradeLevel}`}
        mode="student"
        targetName={`کلاس ${currentStudent.className}`}
      />
    </div>
  );
};
