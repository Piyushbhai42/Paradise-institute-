export interface Teacher {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  subject?: string;
  qualification?: string;
  experience?: string;
  username?: string;
  password?: string;
}

export interface Class {
  id: number;
  name: string;
}

export interface Student {
  id: number;
  name: string;
  classId: number;
  className?: string;
  phone?: string;
  fatherName?: string;
  motherName?: string;
  brotherName?: string;
  brotherClass?: string;
  sisterName?: string;
  sisterClass?: string;
}

export interface TeacherAttendanceRecord {
  teacherId: number;
  status: 'present' | 'absent';
}

export interface AttendanceRecord {
  studentId: number;
  status: 'present' | 'absent';
}

export interface HomeworkRecord {
  studentId: number;
  status: 'done' | 'not done' | 'well done';
}

export interface TestMarkRecord {
  studentId: number;
  marks: number;
}

export interface PerformanceSummary {
  attendance: { status: string; count: number }[];
  homework: { status: string; count: number }[];
  tests: { test_name: string; marks: number; max_marks: number; date: string }[];
}

export interface Stats {
  teachers: number;
  classes: number;
  students: number;
}
