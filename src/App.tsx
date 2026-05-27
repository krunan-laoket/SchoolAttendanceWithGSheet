/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  initDB,
  dbService,
  performUndo,
  STORAGE_KEYS
} from './db';
import { Section, Student, AttendanceRecord, Settings, DBLogEntry } from './types';
import {
  LayoutDashboard,
  Users,
  Settings as SettingsIcon,
  FileSpreadsheet,
  Calendar,
  HelpCircle,
  GraduationCap,
  Sparkles,
  Info,
  ChevronRight,
  PlusCircle,
  TrendingUp,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Subcomponents
import Toast, { ToastMessage } from './components/Toast';
import SheetsIntegrationPanel from './components/SheetsIntegrationPanel';
import DashboardView from './components/DashboardView';
import RosterView from './components/RosterView';
import StudentDetailModal from './components/StudentDetailModal';
import SectionManager from './components/SectionManager';
import ReportView from './components/ReportView';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'roster' | 'sections' | 'reports' | 'sheets' | 'settings'>('dashboard');
  const [selectedDate, setSelectedDate] = useState<string>('2026-05-26'); 
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Core sheets state
  const [sections, setSections] = useState<Section[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [settings, setSettings] = useState<Settings>({
    school_name: '',
    academic_year: '',
    default_status: 'Present',
    low_attendance_threshold: 85,
  });

  // Toast State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // User State info
  const [currentUser] = useState('ครูประจำชั้น (ระบบกลาง)');

  // Local settings update form state
  const [schoolNameInput, setSchoolNameInput] = useState('');
  const [academicYearInput, setAcademicYearInput] = useState('');
  const [lowAttendanceThresholdInput, setLowAttendanceThresholdInput] = useState(85);

  // Initialize and reload sheets dataset
  const refreshAllData = () => {
    initDB();
    const fetchedSections = dbService.getSections();
    const fetchedStudents = dbService.getStudents();
    const fetchedSettings = dbService.getSettings();
    
    // Fetch all logs & attendance records
    const storedRecords = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    const recordsParsed: AttendanceRecord[] = storedRecords ? JSON.parse(storedRecords) : [];
    
    setSections(fetchedSections);
    setStudents(fetchedStudents);
    setSettings(fetchedSettings);
    setAttendanceRecords(recordsParsed);

    // Sync input states
    setSchoolNameInput(fetchedSettings.school_name);
    setAcademicYearInput(fetchedSettings.academic_year);
    setLowAttendanceThresholdInput(fetchedSettings.low_attendance_threshold);
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleGlobalUndo = () => {
    const res = performUndo();
    if (res.success) {
      addToast(res.message, 'success');
      refreshAllData();
    } else {
      addToast(res.message, 'info');
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolNameInput.trim() || !academicYearInput.trim()) {
      addToast('กรุณากรอกข้อมูลตั้งค่าโรงเรียนและปีการศึกษาให้ครบถ้วน', 'error');
      return;
    }

    try {
      const updatedSettings: Settings = {
        school_name: schoolNameInput.trim(),
        academic_year: academicYearInput.trim(),
        default_status: settings.default_status,
        low_attendance_threshold: Number(lowAttendanceThresholdInput),
      };

      dbService.updateSettings(updatedSettings);
      refreshAllData();
      addToast('อัปเดตแผ่นงานตั้งค่าระบบ (Settings sheet) เรียบร้อยแล้ว!', 'success');
    } catch (err: any) {
      addToast(`บันทึกตั้งค่าล้มเหลว: ${err.message}`, 'error');
    }
  };

  const handleResetAppToDefault = () => {
    const isConfirmed = window.confirm(
      '⚠️ คุณครูแน่ใจใช่หรือไม่ที่จะรีเซ็ตล้างแผ่นงานข้อมูล (Reset Sheets) กลับสู่ค่าจำลองจากโรงเรียนเริ่มต้นเดิม? ประวัติการเช็กที่บันทึกใหม่ทั้งหมดจะสูญหายถาวร'
    );
    if (!isConfirmed) return;

    dbService.resetDB();
    refreshAllData();
    addToast('ทำการรีเซ็ตข้อมูลแผ่นงาน (Google Sheets database) กลับสู่ค่าดั้งเดิมสำเร็จ', 'success');
  };

  // Safe auto resolution of active student selection to handle modal update backtracks
  const activeStudentInModal = selectedStudent 
    ? students.find(s => s.student_id === selectedStudent.student_id) || selectedStudent
    : null;

  return (
    <div className="min-h-screen bg-natural-bg flex flex-col lg:flex-row scroll-smooth font-sans antialiased text-natural-text print:bg-white pb-10">
      
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-72 bg-natural-sidebar text-natural-text flex-shrink-0 flex flex-col justify-between border-r border-natural-border-dark print:hidden shadow-xs">
        <div className="flex flex-col">
          {/* Header Identity */}
          <div className="p-6 border-b border-natural-border-dark flex items-center gap-3">
            <div className="p-2.5 bg-natural-primary rounded-xl text-white flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm text-natural-text tracking-wide font-display">Baan Pratom Portal</h1>
              <span className="text-3s text-natural-primary font-bold uppercase tracking-widest text-[10px] block mt-0.5">
                Google Sheets Database
              </span>
            </div>
          </div>

          <div className="px-4 py-3 border-b border-natural-border-dark bg-natural-primary/5 text-xs flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-natural-text-light">
              <span>สถานศึกษา:</span>
              <span className="text-natural-text font-bold max-w-[120px] truncate" title={settings.school_name}>
                {settings.school_name || 'อนุบาลสตรีวิทยาลัย'}
              </span>
            </div>
            <div className="flex justify-between items-center text-natural-text-light">
              <span>ปีการศึกษา:</span>
              <span className="text-natural-primary font-mono font-bold">
                {settings.academic_year || '2569'}
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1 text-sm font-semibold">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition cursor-pointer text-left ${
                activeTab === 'dashboard'
                  ? 'bg-natural-primary text-white font-bold'
                  : 'hover:bg-natural-primary/10 text-natural-text-light hover:text-natural-text'
              }`}
            >
              <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
              <span>ภาพรวมแผงควบคุม (วันนี้)</span>
            </button>

            <button
              onClick={() => setActiveTab('roster')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition cursor-pointer text-left ${
                activeTab === 'roster'
                  ? 'bg-natural-primary text-white font-bold'
                  : 'hover:bg-natural-primary/10 text-natural-text-light hover:text-natural-text'
              }`}
            >
              <Calendar className="w-5 h-5 flex-shrink-0" />
              <span>สมุดเช็กชื่อเด็กนักเรียน</span>
            </button>

            <button
              onClick={() => setActiveTab('sections')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition cursor-pointer text-left ${
                activeTab === 'sections'
                  ? 'bg-natural-primary text-white font-bold'
                  : 'hover:bg-natural-primary/10 text-natural-text-light hover:text-natural-text'
              }`}
            >
              <Users className="w-5 h-5 flex-shrink-0" />
              <span>จัดการชั้นเรียน (Sections)</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition cursor-pointer text-left ${
                activeTab === 'reports'
                  ? 'bg-natural-primary text-white font-bold'
                  : 'hover:bg-natural-primary/10 text-natural-text-light hover:text-natural-text'
              }`}
            >
              <FileText className="w-5 h-5 flex-shrink-0" />
              <span>รายงานส่งออกสถิติ</span>
            </button>

            <button
              onClick={() => setActiveTab('sheets')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition cursor-pointer text-left ${
                activeTab === 'sheets'
                  ? 'bg-natural-primary text-white font-bold'
                  : 'hover:bg-natural-primary/10 text-natural-primary hover:text-natural-primary/80'
              }`}
            >
              <FileSpreadsheet className="w-5 h-5 flex-shrink-0" />
              <span className="flex items-center gap-1">
                เชื่อมต่อระบบ Sheets
                <span className="bg-natural-primary/10 text-natural-primary border border-natural-primary/20 text-3xs px-1.5 py-0.5 rounded-full font-bold">API</span>
              </span>
            </button>
          </nav>
        </div>

        {/* User context footer */}
        <div className="p-4 border-t border-natural-border-dark m-4 rounded-xl bg-natural-primary/5 text-xs">
          <div className="text-natural-text-light mb-1 font-semibold uppercase">ชื่อล็อกอินผู้ใช้งาน</div>
          <p className="font-bold text-natural-text text-xs">{currentUser}</p>
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full mt-3 flex items-center gap-2 justify-center py-2 rounded-lg border text-2xs font-extrabold transition cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-natural-primary border-natural-primary text-white'
                : 'border-natural-border hover:bg-natural-primary/10 text-natural-text-light hover:text-natural-text'
            }`}
          >
            <SettingsIcon className="w-3.5 h-3.5" />
            <span>ปรับแต่งระบบ / รีเซ็ตชีต</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col overflow-hidden px-4 md:px-8 py-6">
        
        {/* Header Block  */}
        <header className="border-b border-natural-border pb-5 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
          <div>
            <h2 className="text-lg md:text-xl font-black text-natural-text font-display flex items-center gap-1.5">
              <span>{settings.school_name || 'ระบบเช็กชื่อเข้าเรียนประถมศึกษา'}</span>
              <Sparkles className="w-4.5 h-4.5 text-natural-late fill-natural-late" />
            </h2>
            <p className="text-xs text-natural-text-light font-medium">
              วันเปิดเรียนประจําปีการศึกษา คัดลอกและประมวลผลข้อมูลผ่าน Google Sheets Ecosystem
            </p>
          </div>

          <div className="flex items-center gap-2.5 bg-natural-card p-2.5 rounded-2xl border border-natural-border shadow-xs self-stretch md:self-auto justify-between">
            <span className="text-natural-text font-semibold text-xs flex items-center gap-1">
              <Calendar className="w-4.5 h-4.5 text-natural-text-light" />
              เลือกวันที่ทําเช็กชื่อ:
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                addToast(`เปลี่ยนเป้าหมายวันตรวจสอบหลักเป็น ${e.target.value.split('-').reverse().join('/')}`, 'info');
              }}
              className="px-2 py-1 bg-natural-bg border border-natural-border rounded-lg text-xs font-bold text-natural-text focus:outline-none"
            />
          </div>
        </header>

        {/* Tab Router Switch */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab + selectedDate}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
            >
              {activeTab === 'dashboard' && (
                <DashboardView
                  sections={sections}
                  students={students}
                  attendanceRecords={attendanceRecords}
                  settings={settings}
                  selectedDate={selectedDate}
                  onSelectSection={(secId) => {
                    setActiveTab('roster');
                  }}
                  onSelectStudent={(stu) => setSelectedStudent(stu)}
                />
              )}

              {activeTab === 'roster' && (
                <RosterView
                  sections={sections}
                  students={students}
                  attendanceRecords={attendanceRecords}
                  selectedDate={selectedDate}
                  onAddToast={addToast}
                  onRefreshAllData={refreshAllData}
                  onUndo={handleGlobalUndo}
                  onSelectStudent={(stu) => setSelectedStudent(stu)}
                  currentUser={currentUser}
                />
              )}

              {activeTab === 'sections' && (
                <SectionManager
                  sections={sections}
                  students={students}
                  onAddToast={addToast}
                  onRefreshAllData={refreshAllData}
                />
              )}

              {activeTab === 'reports' && (
                <ReportView
                  sections={sections}
                  students={students}
                  attendanceRecords={attendanceRecords}
                  settings={settings}
                  onAddToast={addToast}
                />
              )}

              {activeTab === 'sheets' && (
                <SheetsIntegrationPanel
                  onAddToast={addToast}
                  onRefreshAllData={refreshAllData}
                />
              )}

              {activeTab === 'settings' && (
                <div className="space-y-6">
                  {/* General Config Cards */}
                  <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4 max-w-2xl">
                    <h3 className="font-extrabold text-slate-800 text-base">การปรับแต่งระบบแผ่นงานสากล</h3>
                    <p className="text-slate-400 text-xs">แก้ไขข้อมูลการระบุตัวตนและข้อกำหนดเกณฑ์ขีดความปลอดภัยของการเข้าเรียน</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500">ชื่อโรงเรียนประถมศึกษา:</label>
                        <input
                          type="text"
                          required
                          value={schoolNameInput}
                          onChange={(e) => setSchoolNameInput(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-xs md:text-sm bg-slate-50"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500">ปีการศึกษา / รุ่นการปกครอง:</label>
                        <input
                          type="text"
                          required
                          value={academicYearInput}
                          onChange={(e) => setAcademicYearInput(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-xs md:text-sm bg-slate-50"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500">ขีดเกณฑ์เตือนเฝ้าระวังต่ำสุด (%):</label>
                        <input
                          type="number"
                          min={50}
                          max={99}
                          required
                          value={lowAttendanceThresholdInput}
                          onChange={(e) => setLowAttendanceThresholdInput(Number(e.target.value))}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-xs md:text-sm bg-slate-50"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                      >
                        บันทึกการตั้งค่าระบบ
                      </button>
                    </div>
                  </form>

                  {/* Reset controls */}
                  <div className="bg-rose-50/40 rounded-2xl p-6 border border-rose-100 max-w-2xl space-y-3">
                    <h4 className="font-bold text-rose-800 text-sm flex items-center gap-1">
                      <Info className="w-4 h-4" /> ปฏิบัติการกู้คืนฐานข้อมูลโรงเรียนหลัก
                    </h4>
                    <p className="text-rose-600 text-xs leading-relaxed">
                      หากต้องการลบข้อมูลประจุการเช็กรายวัน ประชาสัมพันธ์ หรือ ย้ายนักเรียนทั้งหมดให้กลับสู่ค่าตัวอย่างจำลองจากไฟล์ Google Sheets Seeding ดั้งเดิม สามารถกดปุ่มด้านล่างเพื่อล้างข้อมูล
                    </p>
                    <button
                      type="button"
                      onClick={handleResetAppToDefault}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      ล้างประวัติกลับสู่ค่าเริ่มต้นโรงเรียน
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Global Toast Monitor alerts */}
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* Student Details modal slideover */}
      <AnimatePresence>
        {activeStudentInModal && (
          <StudentDetailModal
            student={activeStudentInModal}
            sections={sections}
            attendanceRecords={attendanceRecords}
            onClose={() => setSelectedStudent(null)}
            onAddToast={addToast}
            onRefreshAllData={refreshAllData}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
