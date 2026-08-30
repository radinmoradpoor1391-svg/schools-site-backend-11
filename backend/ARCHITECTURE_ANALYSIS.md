# Architecture Analysis: Laravel 12 + MySQL Backend for School Management System

## 1. Current Frontend Structure
The application is a full-featured Persian RTL School Management Web App built with React 19, TypeScript, and Tailwind CSS.
It serves three primary roles:
- **Admin**: Complete school oversight, student and teacher management, class and subject configuration, academic year management, grade oversight, automated report card batch generation, announcements, audit logs, and school settings.
- **Teacher**: Personalized workspace, class and student grading, batch daily attendance recording, homework assignments and submission grading, educational and behavioral notes.
- **Student**: Academic dashboard, grade records by month/subject with trends, monthly and semester report cards, attendance records, homework submissions with file attachments, teacher advice notes, and profile view.

## 2. Required Entities & Data Models
1. **User**: Authentication, role (`admin`, `teacher`, `student`), status, credential management.
2. **Student**: Academic dossier (student_code, national_id, names, father_name, class_id, grade_level, field_of_study, parent_phone, discipline_score).
3. **Teacher**: Faculty profile (personnel_code, national_id, names, specialty, degree, phone, assigned classes, assigned subjects).
4. **SchoolClass**: Classrooms (name, grade_level, room_number, field_of_study, capacity, academic_year_id, homeroom_teacher_id).
5. **Subject**: Curriculum courses (title, code, coefficient, grade_level, description).
6. **AcademicYear**: Academic sessions (name, start_date, end_date, is_current, is_archived).
7. **Enrollment**: Many-to-many relationship linking Student to Class and Academic Year.
8. **TeacherClassAssignment**: Subject-Class-Teacher assignment mapping.
9. **Grade**: Evaluative marks (student_id, teacher_id, subject_id, class_id, academic_year_id, score [0-20], max_score [20], grade_type, month, semester, description).
10. **AttendanceRecord**: Daily attendance per student/class/date (status: present, absent, late, excused, note).
11. **Homework**: Assignments created by teachers for classes/subjects (due_date, attachment_url, description).
12. **HomeworkSubmission**: Student homework answers, file uploads, teacher grades, and feedback.
13. **Announcement**: Targeted communications (target: all, students, teachers, class, admin; priority: low, normal, high, urgent; read receipts).
14. **TeacherNote**: Academic or behavioral remarks by teachers for students.
15. **ReportCard**: Official report cards (monthly, semester1, semester2, yearly) with GPA, class rank, weighted subject items, attendance summary, teacher remarks, and principal approval.
16. **AuditLog**: Immutable action log recording actor, action, target entity, timestamp, and details.
17. **SchoolSetting**: Configuration for school name, principal name, district, province, pass grade, etc.

## 3. Database Schema Design (MySQL 8+)
- Primary keys: UUIDs or auto-incrementing big integers with indexed unique business keys (`national_id`, `student_code`, `personnel_code`).
- Foreign keys with strict referential integrity. Academic historical records (grades, report cards, audit logs) are protected from accidental cascade deletions (`onDelete('restrict')` or soft deletes).
- Normalized relations: `enrollments` table connects students to classes per academic year; `teacher_class_assignments` connects teachers to class and subject pairs.

## 4. Required API Endpoints
### Authentication (Laravel Sanctum)
- `POST /api/auth/login` - Username/National ID + password authentication.
- `POST /api/auth/logout` - Revoke current token.
- `GET /api/auth/me` - Authenticated user profile and role details.
- `POST /api/auth/change-password` - Update password.

### Admin APIs
- `GET /api/admin/dashboard/stats` - High-level metrics.
- `GET|POST /api/admin/students` - List & create students.
- `GET|PUT|DELETE /api/admin/students/{id}` - Show, update, delete student.
- `POST /api/admin/students/bulk-import` - CSV batch import.
- `POST /api/admin/students/{id}/toggle-active` - Enable/disable account.
- `POST /api/admin/students/{id}/reset-password` - Reset password to default.
- `GET|POST /api/admin/teachers` - Faculty management.
- `GET|PUT|DELETE /api/admin/teachers/{id}` - Show, update, delete teacher.
- `POST /api/admin/teachers/{id}/toggle-active` - Enable/disable teacher.
- `GET|POST /api/admin/classes` - Class management.
- `PUT|DELETE /api/admin/classes/{id}` - Update/delete class.
- `GET|POST /api/admin/subjects` - Subject curriculum.
- `PUT|DELETE /api/admin/subjects/{id}` - Update/delete subject.
- `GET|POST /api/admin/academic-years` - Academic years.
- `POST /api/admin/academic-years/{id}/set-current` - Set active year.
- `GET|POST /api/admin/report-cards/generate-batch` - Server-side batch report calculation.
- `GET /api/admin/grades` - Oversight and audit of all entered grades.
- `GET|POST|DELETE /api/admin/announcements` - School announcements.
- `GET /api/admin/audit-logs` - System audit log viewer.
- `GET|PUT /api/admin/settings` - School configuration.

### Teacher APIs
- `GET /api/teacher/dashboard` - Teacher's classes, subjects, pending items.
- `GET /api/teacher/classes` - Authorized classes for current teacher.
- `GET /api/teacher/classes/{id}/students` - Students in teacher's class.
- `GET|POST|PUT|DELETE /api/teacher/grades` - Grade entry for assigned subjects/classes.
- `POST /api/teacher/attendance/batch` - Record class attendance.
- `GET|POST|PUT|DELETE /api/teacher/homeworks` - Homework creation and management.
- `POST /api/teacher/homeworks/submissions/{id}/grade` - Grade submission.
- `GET|POST /api/teacher/notes` - Create and view teacher notes.

### Student APIs
- `GET /api/student/dashboard` - Student overview, latest grades, attendance stats, homeworks.
- `GET /api/student/grades` - Private grade sheet scoped to authenticated student.
- `GET /api/student/attendance` - Private attendance records.
- `GET /api/student/homeworks` - Homework list for student's class.
- `POST /api/student/homeworks/{id}/submit` - Submit homework with answers/attachments.
- `GET /api/student/report-cards` - Published monthly and semester report cards.
- `GET /api/student/notes` - Feedback and notes from teachers.
- `GET /api/student/profile` - Profile details.
- `GET /api/student/announcements` - Relevant announcements.

## 5. Security & Authorization
- **Initial State**: Only one Admin user exists (`username: admin`, `password: 1234` in dev).
- **Sanctum Token Authentication**: Bearer token authentication with proper token expiration.
- **Authorization Policies**:
  - Students cannot access or tamper with other students' IDs.
  - Teachers can only grade and view attendance for classes/subjects explicitly assigned to them.
  - Audit logging automatically records critical operations without logging sensitive secrets.
