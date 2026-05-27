/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Section, Student, AttendanceRecord, ReportRecord, Settings, AttendanceStatus, DBLogEntry, UndoAction } from './types';

// Constants
export const STORAGE_KEYS = {
  SECTIONS: 'school_attendance_sections',
  STUDENTS: 'school_attendance_students',
  ATTENDANCE: 'school_attendance_records',
  REPORTS: 'school_attendance_reports',
  SETTINGS: 'school_attendance_settings',
  LOGS: 'school_attendance_logs',
  SHEETS_URL: 'school_attendance_sheets_url',
};

// Help generate unique IDs
const genId = (prefix: string) => `${prefix}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

// Mock Thai student names and properties for primary school
const MOCK_SECTIONS: Section[] = [
  { section_id: 'SEC-A1', grade_level: 'ประถมศึกษาปีที่ 1', section_name: 'ห้อง 1/1', teacher_name: 'ครูสมศรี ใจดี', student_count: 8, active: true },
  { section_id: 'SEC-A2', grade_level: 'ประถมศึกษาปีที่ 1', section_name: 'ห้อง 1/2', teacher_name: 'ครูสุรพล เก่งกล้า', student_count: 6, active: true },
  { section_id: 'SEC-B1', grade_level: 'ประถมศึกษาปีที่ 2', section_name: 'ห้อง 2/1', teacher_name: 'ครูวิภา พรหมมา', student_count: 6, active: true },
];

const MOCK_STUDENTS: Student[] = [
  // Section 1/1 (SEC-A1)
  { student_id: 'STU-101', first_name: 'พิชญุตม์', last_name: 'เมธาอัครเดช', section_id: 'SEC-A1', grade_level: 'ประถมศึกษาปีที่ 1', status_today: '', attendance_rate: 96.0, last_updated: '2026-05-25T16:00:00.000Z', notes: 'แพ้ถั่วลิสงรุนแรง', active: true },
  { student_id: 'STU-102', first_name: 'ณิชชา', last_name: 'ปัญญาวงศ์', section_id: 'SEC-A1', grade_level: 'ประถมศึกษาปีที่ 1', status_today: '', attendance_rate: 100.0, last_updated: '2026-05-25T16:00:00.000Z', notes: '', active: true },
  { student_id: 'STU-103', first_name: 'กิตติพศ', last_name: 'ศรีสว่าง', section_id: 'SEC-A1', grade_level: 'ประถมศึกษาปีที่ 1', status_today: '', attendance_rate: 88.0, last_updated: '2026-05-25T16:00:00.000Z', notes: 'รถรับส่งชอบมาสาย', active: true },
  { student_id: 'STU-104', first_name: 'ชัญญา', last_name: 'เรืองโรจน์', section_id: 'SEC-A1', grade_level: 'ประถมศึกษาปีที่ 1', status_today: '', attendance_rate: 76.0, last_updated: '2026-05-25T16:00:00.000Z', notes: 'สุขภาพไม่ค่อยแข็งแรง คลื่นไส้ง่าย', active: true },
  { student_id: 'STU-105', first_name: 'ปภังกร', last_name: 'สุวรรณศรี', section_id: 'SEC-A1', grade_level: 'ประถมศึกษาปีที่ 1', status_today: '', attendance_rate: 92.0, last_updated: '2026-05-25T16:00:00.000Z', notes: '', active: true },
  { student_id: 'STU-106', first_name: 'รัญชิดา', last_name: 'เกียรติไพบูลย์', section_id: 'SEC-A1', grade_level: 'ประถมศึกษาปีที่ 1', status_today: '', attendance_rate: 100.0, last_updated: '2026-05-25T16:00:00.000Z', notes: '', active: true },
  { student_id: 'STU-107', first_name: 'พลสิทธิ์', last_name: 'ทองอำไพ', section_id: 'SEC-A1', grade_level: 'ประถมศึกษาปีที่ 1', status_today: '', attendance_rate: 96.0, last_updated: '2026-05-25T16:00:00.000Z', notes: '', active: true },
  { student_id: 'STU-108', first_name: 'ธัญลักษณ์', last_name: 'ดีเลิศ', section_id: 'SEC-A1', grade_level: 'ประถมศึกษาปีที่ 1', status_today: '', attendance_rate: 100.0, last_updated: '2026-05-25T16:00:00.000Z', notes: '', active: true },

  // Section 1/2 (SEC-A2)
  { student_id: 'STU-201', first_name: 'คุณากร', last_name: 'พุ่มแก้ว', section_id: 'SEC-A2', grade_level: 'ประถมศึกษาปีที่ 1', status_today: '', attendance_rate: 91.6, last_updated: '2026-05-25T16:00:00.000Z', notes: '', active: true },
  { student_id: 'STU-202', first_name: 'อภิสรา', last_name: 'วงศ์ตระกูล', section_id: 'SEC-A2', grade_level: 'ประถมศึกษาปีที่ 1', status_today: '', attendance_rate: 100.0, last_updated: '2026-05-25T16:00:00.000Z', notes: '', active: true },
  { student_id: 'STU-203', first_name: 'จิรภัทร', last_name: 'บุญเหลือ', section_id: 'SEC-A2', grade_level: 'ประถมศึกษาปีที่ 1', status_today: '', attendance_rate: 83.3, last_updated: '2026-05-25T16:00:00.000Z', notes: 'ผู้ปกครองต้องทำงานกะกลางคืน', active: true },
  { student_id: 'STU-204', first_name: 'แพรวพรรณ', last_name: 'อนันต์ชัย', section_id: 'SEC-A2', grade_level: 'ประถมศึกษาปีที่ 1', status_today: '', attendance_rate: 95.8, last_updated: '2026-05-25T16:00:00.000Z', notes: '', active: true },
  { student_id: 'STU-205', first_name: 'นนทพัทธ์', last_name: 'แสงเงิน', section_id: 'SEC-A2', grade_level: 'ประถมศึกษาปีที่ 1', status_today: '', attendance_rate: 100.0, last_updated: '2026-05-25T16:00:00.000Z', notes: '', active: true },
  { student_id: 'STU-206', first_name: 'กรวรรณ', last_name: 'รักษ์วงศา', section_id: 'SEC-A2', grade_level: 'ประถมศึกษาปีที่ 1', status_today: '', attendance_rate: 91.6, last_updated: '2026-05-25T16:00:00.000Z', notes: '', active: true },

  // Section 2/1 (SEC-B1)
  { student_id: 'STU-301', first_name: 'วรินทร', last_name: 'มีสีสรร', section_id: 'SEC-B1', grade_level: 'ประถมศึกษาปีที่ 2', status_today: '', attendance_rate: 100.0, last_updated: '2026-05-25T16:00:00.000Z', notes: '', active: true },
  { student_id: 'STU-302', first_name: 'นลิน', last_name: 'ฉัตรชัยเวช', section_id: 'SEC-B1', grade_level: 'ประถมศึกษาปีที่ 2', status_today: '', attendance_rate: 95.8, last_updated: '2026-05-25T16:00:00.000Z', notes: 'สายตาสั้น ต้องนั่งหน้าห้อง', active: true },
  { student_id: 'STU-303', first_name: 'จิรายุ', last_name: 'นพคุณ', section_id: 'SEC-B1', grade_level: 'ประถมศึกษาปีที่ 2', status_today: '', attendance_rate: 79.1, last_updated: '2026-05-25T16:00:00.000Z', notes: 'มีปัญหาหูอักเสบเรื้อรัง', active: true },
  { student_id: 'STU-304', first_name: 'เขมิกา', last_name: 'ประเสริฐสุข', section_id: 'SEC-B1', grade_level: 'ประถมศึกษาปีที่ 2', status_today: '', attendance_rate: 100.0, last_updated: '2026-05-25T16:00:00.000Z', notes: '', active: true },
  { student_id: 'STU-305', first_name: 'พงศกร', last_name: 'แก้วสมพร', section_id: 'SEC-B1', grade_level: 'ประถมศึกษาปีที่ 2', status_today: '', attendance_rate: 87.5, last_updated: '2026-05-25T16:00:00.000Z', notes: '', active: true },
  { student_id: 'STU-306', first_name: 'กรวิภา', last_name: 'ไชยสิทธิ์', section_id: 'SEC-B1', grade_level: 'ประถมศึกษาปีที่ 2', status_today: '', attendance_rate: 100.0, last_updated: '2026-05-25T16:00:00.000Z', notes: '', active: true },
];

const MOCK_SETTINGS: Settings = {
  school_name: 'โรงเรียนอนุบาลบ้านรักเรียนประถมศึกษา',
  academic_year: '2569 (2026)',
  default_status: 'Present',
  low_attendance_threshold: 85,
};

// Generate 5 days of history for each student
const generateMockAttendanceHistory = (): AttendanceRecord[] => {
  const dates = ['2026-05-18', '2026-05-19', '2026-05-20', '2026-05-21', '2026-05-22', '2026-05-25'];
  const records: AttendanceRecord[] = [];

  MOCK_STUDENTS.forEach((student) => {
    dates.forEach((date) => {
      // Determine random status based on student rating to keep it realistic
      let status: AttendanceStatus = 'Present';
      const rand = Math.random() * 100;

      if (student.student_id === 'STU-104') { // Low att
        if (rand < 65) status = 'Present';
        else if (rand < 85) status = 'Absent';
        else if (rand < 95) status = 'Late';
        else status = 'Excused';
      } else if (student.student_id === 'STU-303') { // Low att
        if (rand < 70) status = 'Present';
        else if (rand < 88) status = 'Absent';
        else status = 'Late';
      } else { // Standard high att
        if (rand < 93) status = 'Present';
        else if (rand < 96) status = 'Late';
        else if (rand < 98) status = 'Excused';
        else status = 'Absent';
      }

      records.push({
        attendance_id: `ATT-${student.student_id}-${date.replace(/-/g, '')}`,
        date,
        student_id: student.student_id,
        section_id: student.section_id,
        status,
        updated_by: 'ระบบประมวลผล',
        updated_at: `${date}T08:15:00.000Z`,
        note: status === 'Excused' ? 'แจ้งลาป่วยผ่านผู้ปกครอง' : status === 'Late' && Math.random() > 0.5 ? 'รถติด' : undefined,
      });
    });
  });

  return records;
};

// Internal cache state
let sections: Section[] = [];
let students: Student[] = [];
let attendance: AttendanceRecord[] = [];
let reports: ReportRecord[] = [];
let settings: Settings = MOCK_SETTINGS;
let logs: DBLogEntry[] = [];
const undoStack: UndoAction[] = [];

// Save to localStorage
const saveToStorage = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Append to operations logs
const addLog = (action: DBLogEntry['action'], targetTable: DBLogEntry['targetTable'], details: string) => {
  const newLog: DBLogEntry = {
    id: genId('LOG'),
    timestamp: new Date().toISOString(),
    action,
    targetTable,
    details,
  };
  logs.unshift(newLog);
  if (logs.length > 100) logs.pop(); // limit size
  saveToStorage(STORAGE_KEYS.LOGS, logs);
};

// Initialize database
export const initDB = (forceReset = false) => {
  const cachedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  const cachedSections = localStorage.getItem(STORAGE_KEYS.SECTIONS);
  const cachedStudents = localStorage.getItem(STORAGE_KEYS.STUDENTS);
  const cachedAttendance = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
  const cachedReports = localStorage.getItem(STORAGE_KEYS.REPORTS);
  const cachedLogs = localStorage.getItem(STORAGE_KEYS.LOGS);

  if (forceReset || !cachedSettings || !cachedSections || !cachedStudents) {
    // Fresh seed
    settings = MOCK_SETTINGS;
    sections = [...MOCK_SECTIONS];
    students = [...MOCK_STUDENTS];
    attendance = generateMockAttendanceHistory();
    reports = [];
    logs = [];

    // Recalculate historical rates
    recalculateAllRates();

    saveToStorage(STORAGE_KEYS.SETTINGS, settings);
    saveToStorage(STORAGE_KEYS.SECTIONS, sections);
    saveToStorage(STORAGE_KEYS.STUDENTS, students);
    saveToStorage(STORAGE_KEYS.ATTENDANCE, attendance);
    saveToStorage(STORAGE_KEYS.REPORTS, reports);
    saveToStorage(STORAGE_KEYS.LOGS, logs);

    addLog('CREATE', 'Settings', 'เริ่มต้นระบบและโหลดฐานข้อมูลจำลอง (Sheet: Settings, Sections, Students, Attendance) สำเร็จ');
  } else {
    settings = JSON.parse(cachedSettings);
    sections = JSON.parse(cachedSections);
    students = JSON.parse(cachedStudents);
    attendance = JSON.parse(cachedAttendance);
    reports = JSON.parse(cachedReports || '[]');
    logs = JSON.parse(cachedLogs || '[]');
  }
};

// Re-calculate attendance rate for a single student
export const calculateStudentAttendanceRate = (studentId: string): number => {
  const studentRecords = attendance.filter((r) => r.student_id === studentId);
  const totalDays = studentRecords.length;
  const attendedDays = studentRecords.filter((r) => r.status === 'Present' || r.status === 'Late' || r.status === 'Excused').length;

  if (totalDays === 0) return 100;
  return Math.round((attendedDays / totalDays) * 1000) / 10;
};

// Recalculate rates of all active students
const recalculateAllRates = () => {
  students.forEach((s) => {
    s.attendance_rate = calculateStudentAttendanceRate(s.student_id);
  });
  // Update section headcounts too
  sections.forEach((sec) => {
    sec.student_count = students.filter((s) => s.section_id === sec.section_id && s.active).length;
  });
};

// Helper to push update states onto Undo stack
export const pushToUndoStack = (action: UndoAction) => {
  undoStack.push(action);
  if (undoStack.length > 20) undoStack.shift(); // Keep top 20
};

// Perform Undo
export const performUndo = (): { success: boolean; message: string; sectionId?: string } => {
  const lastAction = undoStack.pop();
  if (!lastAction) {
    return { success: false, message: 'ไม่มีประวัติคำสั่งที่จะเลิกทำ (Undo stack is empty)' };
  }

  try {
    if (lastAction.type === 'UPDATE_STATUS' || lastAction.type === 'BULK_STATUS') {
      lastAction.studentIds.forEach((studentId, i) => {
        const studentIndex = students.findIndex((s) => s.student_id === studentId);
        if (studentIndex > -1) {
          // Restore student today_status
          students[studentIndex].status_today = lastAction.previousStatuses[i];
          students[studentIndex].last_updated = lastAction.previousUpdatedDates[i];

          // Restore or purge historical record matching this date in Attendance
          const dateStr = lastAction.date;
          const recordIndex = attendance.findIndex(
            (r) => r.student_id === studentId && r.date === dateStr
          );

          if (recordIndex > -1) {
            if (lastAction.previousStatuses[i] === '') {
              // Purge record
              attendance.splice(recordIndex, 1);
            } else {
              // Restore previous status
              attendance[recordIndex].status = lastAction.previousStatuses[i] as AttendanceStatus;
              attendance[recordIndex].updated_at = lastAction.previousUpdatedDates[i];
            }
          }
        }
      });

      // Recalculate rates
      recalculateAllRates();

      // Save changes
      saveToStorage(STORAGE_KEYS.STUDENTS, students);
      saveToStorage(STORAGE_KEYS.ATTENDANCE, attendance);
      saveToStorage(STORAGE_KEYS.SECTIONS, sections);

      addLog(
        'BULK_UPDATE',
        'Attendance',
        `ยกเลิกการเช็กชื่อ (Undo) จำนวน ${lastAction.studentIds.length} คน ในห้องเรียน ${
          sections.find((s) => s.section_id === lastAction.sectionId)?.section_name || ''
        }`
      );

      // Background push undo status to Sheets if configured
      const sheetsUrl = getSheetsUrl();
      if (sheetsUrl) {
        const recordsToUpdate = lastAction.studentIds.map(sid => {
          const rec = attendance.find(r => r.student_id === sid && r.date === lastAction.date);
          return {
            student_id: sid,
            date: lastAction.date,
            section_id: lastAction.sectionId,
            status: (rec?.status || '') as AttendanceStatus,
            updated_by: 'ระบบย้อนกลับ (Undo)',
            updated_at: new Date().toISOString()
          };
        });

        fetch(sheetsUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'update_attendance',
            records: recordsToUpdate
          })
        }).catch(err => console.error("Sheets undo sync failed:", err));
      }

      return {
        success: true,
        message: `ย้อนการบันทึกสถานะของนักเรียน ${lastAction.studentIds.length} ราย เรียบร้อยแล้ว`,
        sectionId: lastAction.sectionId,
      };
    }
  } catch (error) {
    console.error('Undo failed:', error);
    return { success: false, message: 'เกิดข้อผิดพลาดในการคืนสถานะ (Undo error)' };
  }

  return { success: false, message: 'การดำเนินการยกเลิกไม่รองรับ' };
};

// Support for Google Sheets API Integrations
export const getSheetsUrl = (): string => {
  return localStorage.getItem(STORAGE_KEYS.SHEETS_URL) || '';
};

export const setSheetsUrl = (url: string) => {
  if (!url) {
    localStorage.removeItem(STORAGE_KEYS.SHEETS_URL);
  } else {
    localStorage.setItem(STORAGE_KEYS.SHEETS_URL, url.trim());
  }
};

// DATABASE SIMULATOR ENGINE (READ/WRITE APIS simulating GAS responses)
export const simulateNetworkDelay = () => new Promise((resolve) => setTimeout(resolve, 600));

export const dbService = {
  // Config accessors
  getSheetsUrl,
  setSheetsUrl,

  // Sync Live Data From Google Sheets Apps Script Web App
  syncFromSheets: async (url: string): Promise<{ success: boolean; sectionsCount: number; studentsCount: number; message: string }> => {
    try {
      const gUrl = url.trim();
      if (!gUrl) {
        throw new Error('กรุณาระบุ Web App URL ตัวเชื่อมโยงชีต');
      }

      const response = await fetch(`${gUrl}?action=get_all`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`การตอบสนองจากเซิร์ฟเวอร์ผิดพลาด: HTTP Status ${response.status}`);
      }

      const resData = await response.json();
      if (!resData.success) {
        throw new Error(resData.error || 'แอปสคริปต์ส่งคืนข้อผิดพลาดในการดึงข้อมูล');
      }

      const { sections: sheetsSections, students: sheetsStudents, settings: sheetsSettings } = resData.data;

      // Validate sheets format
      if (!Array.isArray(sheetsSections) || !Array.isArray(sheetsStudents)) {
        throw new Error('สคริปต์ดึงข้อมูลชั้นเรียนหรือรายชื่อสำเร็จ แต่โครงสร้างชีตไม่ตรงกับสเปคหลัก (โปรดเช็กหัวข้อคอลัมน์ในข้อ 1)');
      }

      // 1. Process and save Sections
      const parsedSections: Section[] = sheetsSections.map((s: any) => ({
        section_id: String(s.section_id || ''),
        grade_level: String(s.grade_level || ''),
        section_name: String(s.section_name || ''),
        teacher_name: String(s.teacher_name || ''),
        student_count: Number(s.student_count || 0),
        active: s.active === true || s.active === 'true' || s.active === 1 || s.active === 'TRUE' || s.active === 'TRUE' || s.active === '',
      })).filter(s => s.section_id);

      // 2. Process and save Students
      const parsedStudents: Student[] = sheetsStudents.map((s: any) => ({
        student_id: String(s.student_id || ''),
        first_name: String(s.first_name || ''),
        last_name: String(s.last_name || ''),
        section_id: String(s.section_id || ''),
        grade_level: String(s.grade_level || ''),
        status_today: ((s.status_today || '') as string) as any,
        attendance_rate: Number(s.attendance_rate || 100),
        last_updated: String(s.last_updated || new Date().toISOString()),
        notes: String(s.notes || ''),
        active: s.active === true || s.active === 'true' || s.active === 1 || s.active === 'TRUE' || s.active === 'TRUE' || s.active === '',
      })).filter(s => s.student_id);

      // 3. Process and save Settings
      let parsedSettings = settings;
      if (sheetsSettings && sheetsSettings.school_name) {
        parsedSettings = {
          school_name: String(sheetsSettings.school_name),
          academic_year: String(sheetsSettings.academic_year || '2569'),
          default_status: (sheetsSettings.default_status || 'Present') as any,
          low_attendance_threshold: Number(sheetsSettings.low_attendance_threshold || 85),
        };
      }

      // Update Local cache
      sections = parsedSections;
      students = parsedStudents;
      settings = parsedSettings;

      saveToStorage(STORAGE_KEYS.SECTIONS, sections);
      saveToStorage(STORAGE_KEYS.STUDENTS, students);
      saveToStorage(STORAGE_KEYS.SETTINGS, settings);

      // Try reading history from Attendance logging sheet
      try {
        const attResponse = await fetch(`${gUrl}?action=get_records`, { method: 'GET' });
        if (attResponse.ok) {
          const attRes = await attResponse.json();
          if (attRes.success && Array.isArray(attRes.data)) {
            const parsedAtt: AttendanceRecord[] = attRes.data.map((r: any) => ({
              attendance_id: String(r.attendance_id || ''),
              date: String(r.date || '').split('T')[0],
              student_id: String(r.student_id || ''),
              section_id: String(r.section_id || ''),
              status: String(r.status || 'Present') as any,
              updated_by: String(r.updated_by || 'ระบบแผ่นงาน'),
              updated_at: String(r.updated_at || new Date().toISOString()),
              note: r.note ? String(r.note) : undefined,
            })).filter(r => r.student_id && r.date);

            attendance = parsedAtt;
            saveToStorage(STORAGE_KEYS.ATTENDANCE, attendance);
          }
        }
      } catch (attErr) {
        console.warn('Unable to get Attendance list from sheets:', attErr);
      }

      // Recalculate based on fetched data
      recalculateAllRates();

      addLog('SYNC', 'Settings', `ดึงข้อมูลสดสำเร็จ: ซิงค์วิชาเรียน ${parsedSections.length} รายการ และเด็กนักเรียน ${parsedStudents.length} รายชื่อ จากแผ่นงานหลัก`);

      return {
        success: true,
        sectionsCount: parsedSections.length,
        studentsCount: parsedStudents.length,
        message: 'เชื่อมต่อและซิงค์ข้อมูลกับ Google Sheets สำเร็จแล้ว!',
      };
    } catch (err: any) {
      console.error("Fetch Google Sheets Error:", err);
      return {
        success: false,
        sectionsCount: 0,
        studentsCount: 0,
        message: err.message || 'การดึงข้อมูลจาก Google Sheets ขัดข้อง',
      };
    }
  },

  // SECTIONS
  getSections: (): Section[] => {
    return sections.filter((s) => s.active);
  },

  addSection: (newSec: Omit<Section, 'student_count' | 'active'>): Section => {
    const fullSec: Section = {
      ...newSec,
      student_count: 0,
      active: true,
    };
    sections.push(fullSec);
    saveToStorage(STORAGE_KEYS.SECTIONS, sections);
    addLog('CREATE', 'Sections', `เพิ่มระดับชั้น/ห้องเรียนใหม่: ${fullSec.grade_level} ${fullSec.section_name} (ครูผู้ดูแล: ${fullSec.teacher_name})`);

    // Live Sync to Google Sheets if configured
    const sheetsUrl = getSheetsUrl();
    if (sheetsUrl) {
      fetch(sheetsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'add_section',
          section: fullSec
        })
      })
      .then(res => res.json())
      .then(data => addLog('SYNC', 'Sections', `อัปโหลดห้องเรียนใหม่สำเร็จ: ${fullSec.section_name}`))
      .catch(err => console.error("Sheets sync error adding section:", err));
    }

    return fullSec;
  },

  updateSection: (updatedSec: Section): Section => {
    const idx = sections.findIndex((s) => s.section_id === updatedSec.section_id);
    if (idx === -1) throw new Error('Section details not found in Google Sheets schema');
    sections[idx] = { ...updatedSec };
    saveToStorage(STORAGE_KEYS.SECTIONS, sections);
    addLog('UPDATE', 'Sections', `แก้ไขข้อมูลห้องเรียน: ${updatedSec.section_name} (ผู้แทนครูประจำชั้น: ${updatedSec.teacher_name})`);

    // Live Sync: update or add row can use standard API
    const sheetsUrl = getSheetsUrl();
    if (sheetsUrl) {
      fetch(sheetsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'add_section', // Apps Script code handles addition (can overwrite or append depending on key checks)
          section: updatedSec
        })
      }).catch(err => console.error(err));
    }

    return updatedSec;
  },

  deleteSection: (sectionId: string): boolean => {
    const idx = sections.findIndex((s) => s.section_id === sectionId);
    if (idx === -1) return false;

    // Check if students are bound to it
    const activeStudents = students.filter((s) => s.section_id === sectionId && s.active);
    if (activeStudents.length > 0) {
      throw new Error(`ไม่สามารถลบห้องเรียนนี้ได้ เนื่องจากยังมีรายชื่อนักเรียนที่ใช้งานอยู่จำนวน ${activeStudents.length} คน (กรุณาย้ายนักเรียนออกก่อนลบห้องเรียน)`);
    }

    sections[idx].active = false;
    saveToStorage(STORAGE_KEYS.SECTIONS, sections);
    addLog('DELETE', 'Sections', `ลบระดับห้องเรียน: ID ${sectionId} (Soft deleted จาก Google Sheets)`);
    return true;
  },

  // STUDENTS
  getStudents: (): Student[] => {
    return students.filter((s) => s.active);
  },

  addStudent: (newStu: Omit<Student, 'student_id' | 'status_today' | 'attendance_rate' | 'last_updated' | 'active'>): Student => {
    const count = students.length + 1;
    const student_id = `STU-${100 + count}`;

    const fullStu: Student = {
      ...newStu,
      student_id,
      status_today: '',
      attendance_rate: 100.0,
      last_updated: new Date().toISOString(),
      active: true,
    };

    students.push(fullStu);
    recalculateAllRates();

    saveToStorage(STORAGE_KEYS.STUDENTS, students);
    saveToStorage(STORAGE_KEYS.SECTIONS, sections);

    addLog('CREATE', 'Students', `เพิ่มนักเรียนใหม่ลงทะเบียนเรียน: ${fullStu.student_id} - ด.ช./ด.ญ. ${fullStu.first_name} ${fullStu.last_name}`);

    // Sync child register live to Google Sheets
    const sheetsUrl = getSheetsUrl();
    if (sheetsUrl) {
      fetch(sheetsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'add_student',
          student: fullStu
        })
      })
      .then(res => res.json())
      .then(data => addLog('SYNC', 'Students', `อัปโหลดใบทะเบียนเด็กสำเร็จ [${fullStu.student_id}]`))
      .catch(err => console.error("Sheets sync error adding student:", err));
    }

    return fullStu;
  },

  updateStudent: (updatedStu: Student): Student => {
    const idx = students.findIndex((s) => s.student_id === updatedStu.student_id);
    if (idx === -1) throw new Error('Student records not found in database');
    students[idx] = { ...updatedStu, last_updated: new Date().toISOString() };

    recalculateAllRates();

    saveToStorage(STORAGE_KEYS.STUDENTS, students);
    saveToStorage(STORAGE_KEYS.SECTIONS, sections);

    addLog('UPDATE', 'Students', `อัปเดตข้อมูลทะเบียนนักเรียน: [${updatedStu.student_id}] ${updatedStu.first_name} ${updatedStu.last_name}`);

    // Update to Google Sheets if configured
    const sheetsUrl = getSheetsUrl();
    if (sheetsUrl) {
      fetch(sheetsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'add_student',
          student: students[idx]
        })
      }).catch(err => console.error(err));
    }

    return students[idx];
  },

  deleteStudent: (studentId: string): boolean => {
    const idx = students.findIndex((s) => s.student_id === studentId);
    if (idx === -1) return false;

    students[idx].active = false;
    recalculateAllRates();

    saveToStorage(STORAGE_KEYS.STUDENTS, students);
    saveToStorage(STORAGE_KEYS.SECTIONS, sections);

    addLog('DELETE', 'Students', `จำหน่ายออก/ลบชื่อนักเรียน: ID ${studentId} (Soft delete ใน Google Sheets)`);
    return true;
  },

  // ATTENDANCE DAILY RECORDING
  getAttendanceForDateAndSection: (date: string, sectionId: string): AttendanceRecord[] => {
    return attendance.filter((r) => r.date === date && r.section_id === sectionId);
  },

  updateAttendanceStatus: (
    studentId: string,
    sectionId: string,
    status: AttendanceStatus,
    date: string,
    updatedBy: string,
    note = ''
  ): { student: Student; record: AttendanceRecord } => {
    const studentIdx = students.findIndex((s) => s.student_id === studentId);
    if (studentIdx === -1) throw new Error('ไม่พบข้อมูลนักเรียนในการเช็กชื่อ');

    const previousStatus = students[studentIdx].status_today;
    const previousDate = students[studentIdx].last_updated;

    pushToUndoStack({
      type: 'UPDATE_STATUS',
      studentIds: [studentId],
      previousStatuses: [previousStatus],
      previousUpdatedDates: [previousDate],
      sectionId,
      date,
    });

    const recordIndex = attendance.findIndex((r) => r.student_id === studentId && r.date === date);
    const timestampISO = new Date().toISOString();

    let savedRecord: AttendanceRecord;

    if (recordIndex > -1) {
      attendance[recordIndex] = {
        ...attendance[recordIndex],
        status,
        updated_by: updatedBy,
        updated_at: timestampISO,
        note: note || undefined,
      };
      savedRecord = attendance[recordIndex];
    } else {
      const newRec: AttendanceRecord = {
        attendance_id: `ATT-${studentId}-${date.replace(/-/g, '')}`,
        date,
        student_id: studentId,
        section_id: sectionId,
        status,
        updated_by: updatedBy,
        updated_at: timestampISO,
        note: note || undefined,
      };
      attendance.push(newRec);
      savedRecord = newRec;
    }

    students[studentIdx].status_today = status;
    students[studentIdx].last_updated = timestampISO;
    if (note) students[studentIdx].notes = note;

    students[studentIdx].attendance_rate = calculateStudentAttendanceRate(studentId);

    saveToStorage(STORAGE_KEYS.STUDENTS, students);
    saveToStorage(STORAGE_KEYS.ATTENDANCE, attendance);

    addLog('UPDATE', 'Attendance', `เช็กสถานะ [${status}] ของ ด.ช./ด.ญ. ${students[studentIdx].first_name} เรียนอยู่ชั้น ${sections.find(s => s.section_id === sectionId)?.section_name}`);

    // Sync to Google Sheets if configured
    const sheetsUrl = getSheetsUrl();
    if (sheetsUrl) {
      fetch(sheetsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'update_attendance',
          records: [savedRecord]
        })
      })
      .then(res => res.json())
      .then(data => addLog('SYNC', 'Attendance', `บันทึกเข้า Google Sheets (นักเรียนรายคน) สำเร็จ`))
      .catch(err => console.error("Sheets update_attendance sync failed:", err));
    }

    return {
      student: students[studentIdx],
      record: savedRecord,
    };
  },

  bulkUpdateAttendance: (
    sectionId: string,
    status: AttendanceStatus,
    date: string,
    updatedBy: string
  ): Student[] => {
    const sectionStudents = students.filter((s) => s.section_id === sectionId && s.active);
    if (sectionStudents.length === 0) return [];

    const studentIds: string[] = [];
    const previousStatuses: (AttendanceStatus | '')[] = [];
    const previousUpdatedDates: string[] = [];

    sectionStudents.forEach((student) => {
      studentIds.push(student.student_id);
      previousStatuses.push(student.status_today);
      previousUpdatedDates.push(student.last_updated);
    });

    pushToUndoStack({
      type: 'BULK_STATUS',
      studentIds,
      previousStatuses,
      previousUpdatedDates,
      sectionId,
      date,
    });

    const timestampISO = new Date().toISOString();
    const updatedRecords: AttendanceRecord[] = [];

    sectionStudents.forEach((student) => {
      const studentIdx = students.findIndex((s) => s.student_id === student.student_id);
      const recordIdx = attendance.findIndex((r) => r.student_id === student.student_id && r.date === date);

      let record: AttendanceRecord;

      if (recordIdx > -1) {
        attendance[recordIdx] = {
          ...attendance[recordIdx],
          status,
          updated_by: updatedBy,
          updated_at: timestampISO,
        };
        record = attendance[recordIdx];
      } else {
        const newRecord = {
          attendance_id: `ATT-${student.student_id}-${date.replace(/-/g, '')}`,
          date,
          student_id: student.student_id,
          section_id: sectionId,
          status,
          updated_by: updatedBy,
          updated_at: timestampISO,
        };
        attendance.push(newRecord);
        record = newRecord;
      }

      updatedRecords.push(record);
      students[studentIdx].status_today = status;
      students[studentIdx].last_updated = timestampISO;
      students[studentIdx].attendance_rate = calculateStudentAttendanceRate(student.student_id);
    });

    saveToStorage(STORAGE_KEYS.STUDENTS, students);
    saveToStorage(STORAGE_KEYS.ATTENDANCE, attendance);

    addLog('BULK_UPDATE', 'Attendance', `เซ็ตสถานะนักเรียนทั้งหมด ${sectionStudents.length} คน ในห้องเป็น [${status}] ประจำวันที่ ${date}`);

    // Sync Bulk Attendance to Google Sheets
    const sheetsUrl = getSheetsUrl();
    if (sheetsUrl) {
      fetch(sheetsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'update_attendance',
          records: updatedRecords
        })
      })
      .then(res => res.json())
      .then(data => addLog('SYNC', 'Attendance', `อัปโหลดบันทึกกลุ่มฝั่ง Google Sheets (รวมทั้งหมด ${updatedRecords.length} คน) สำเร็จ`))
      .catch(err => console.error("Sheets update_attendance sync failed:", err));
    }

    return students.filter((s) => s.section_id === sectionId && s.active);
  },

  // REPORTS
  getReportsByPeriod: (period: string): ReportRecord[] => {
    return reports.filter((r) => r.period === period);
  },

  generateSectionReport: (period: string, sectionId: string): ReportRecord => {
    const sectionStudents = students.filter((s) => s.section_id === sectionId && s.active);
    const stuIds = sectionStudents.map((s) => s.student_id);

    let targetRecords = attendance.filter((r) => stuIds.includes(r.student_id));

    if (period.startsWith('Daily')) {
      const datePart = period.replace('Daily (', '').replace(')', '');
      targetRecords = targetRecords.filter((r) => r.date === datePart);
    }

    const present_count = targetRecords.filter((r) => r.status === 'Present').length;
    const absent_count = targetRecords.filter((r) => r.status === 'Absent').length;
    const late_count = targetRecords.filter((r) => r.status === 'Late').length;
    const excused_count = targetRecords.filter((r) => r.status === 'Excused').length;

    const total = present_count + absent_count + late_count + excused_count;
    const rate = total > 0 ? ((present_count + late_count + excused_count) / total) * 100 : 100;

    const newReport: ReportRecord = {
      report_id: genId('REP'),
      period,
      section_id: sectionId,
      present_count,
      absent_count,
      late_count,
      excused_count,
      attendance_rate: Math.round(rate * 10) / 10,
      generated_at: new Date().toISOString(),
    };

    reports.unshift(newReport);
    if (reports.length > 50) reports.pop();
    saveToStorage(STORAGE_KEYS.REPORTS, reports);

    addLog('CREATE', 'Reports', `สร้างรายงานสถิติห้องเรียน ${sections.find((s) => s.section_id === sectionId)?.section_name || ''} รอบ: ${period}`);

    return newReport;
  },

  // GET ATTENDANCE AUDIT LOGS
  getDBLogs: (): DBLogEntry[] => {
    return logs;
  },

  // SETTINGS
  getSettings: (): Settings => {
    return settings;
  },

  updateSettings: (newSettings: Settings): Settings => {
    settings = { ...newSettings };
    saveToStorage(STORAGE_KEYS.SETTINGS, settings);
    addLog('UPDATE', 'Settings', `อัปเดตการตั้งค่าระบบ: ปีการศึกษา ${settings.academic_year}, โรงเรียน: ${settings.school_name}`);
    return settings;
  },

  resetDB: () => {
    initDB(true);
  }
};
