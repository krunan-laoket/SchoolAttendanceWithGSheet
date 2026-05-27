/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Excused';

export interface Section {
  section_id: string;      // Unique Identifier
  grade_level: string;     // Grade Level (e.g. "Grade 1", "Grade 2")
  section_name: string;    // Section Name (e.g. "Room A", "Room B", "Prathom 1/1")
  teacher_name: string;    // Appointed Class Teacher
  student_count: number;   // Calculated Student count
  active: boolean;         // Section Status
}

export interface Student {
  student_id: string;      // Unique Student ID (e.g. STU-001)
  first_name: string;      // First Name in Thai/English
  last_name: string;       // Last Name in Thai/English
  section_id: string;      // Link to Section ID
  grade_level: string;     // Redundant Grade Level for easy filtering
  status_today: AttendanceStatus | ''; // Attendance status checked today
  attendance_rate: number; // Historical attendance rate (%)
  last_updated: string;    // ISO Date of the last updated status
  notes: string;           // Optional medical or parent note
  active: boolean;         // Active status in school registry
}

export interface AttendanceRecord {
  attendance_id: string;   // Unique Record ID
  date: string;            // Date of check (YYYY-MM-DD)
  student_id: string;      // Link to Student ID
  section_id: string;      // Link to Section ID
  status: AttendanceStatus; // Checked status
  updated_by: string;      // Teacher or Operator name who updated
  updated_at: string;      // ISO Timestamp
  note?: string;           // Optional comment
}

export interface ReportRecord {
  report_id: string;       // Unique Report ID
  period: string;          // E.g. "Daily (2026-05-26)", "Weekly (W22)", "Monthly (May 2026)"
  section_id: string;      // Link to Section ID
  present_count: number;   // Calculated present students
  absent_count: number;    // Calculated absent students
  late_count: number;      // Calculated late students
  excused_count: number;   // Calculated excused students
  attendance_rate: number; // Overall percentage attendance rate
  generated_at: string;    // ISO Timestamp when calculated
}

export interface Settings {
  school_name: string;     // Name of school (e.g. "โรงเรียนบ้านรักเรียน")
  academic_year: string;   // Academic year (e.g. "2569 / 2026")
  default_status: AttendanceStatus; // Default state for roster ("Present")
  low_attendance_threshold: number; // Percentage threshold below which attendance is considered critical (e.g. 80%)
}

export interface DBLogEntry {
  id: string;
  timestamp: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'SYNC' | 'BULK_UPDATE';
  targetTable: 'Sections' | 'Students' | 'Attendance' | 'Reports' | 'Settings';
  details: string;
}

export interface UndoAction {
  type: 'UPDATE_STATUS' | 'BULK_STATUS';
  studentIds: string[];
  previousStatuses: (AttendanceStatus | '')[];
  previousUpdatedDates: string[];
  sectionId: string;
  date: string;
}
