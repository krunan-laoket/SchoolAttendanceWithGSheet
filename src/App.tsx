/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
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
  FileText,
  Link2,
  AlertCircle,
  RefreshCw,
  Menu,
  X
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
import ConfirmModal from './components/ConfirmModal';

export default function App() {
  const initialLoadRef = useRef(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'roster' | 'sections' | 'reports' | 'sheets' | 'settings'>('dashboard');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Default to today's date in local time YYYY-MM-DD
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  }); 
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

  // First-time Url Prompt State
  const [showUrlPrompt, setShowUrlPrompt] = useState(false);
  const [promptUrlInput, setPromptUrlInput] = useState('');
  const [promptSyncing, setPromptSyncing] = useState(false);
  const [promptError, setPromptError] = useState('');

  const currentUser = 'ครูประจำชั้น';

  // Local settings update form state
  const [schoolNameInput, setSchoolNameInput] = useState('');
  const [academicYearInput, setAcademicYearInput] = useState('');
  const [lowAttendanceThresholdInput, setLowAttendanceThresholdInput] = useState(85);
  const [savingSettings, setSavingSettings] = useState(false);
  const [resettingDB, setResettingDB] = useState(false);

  // Initialize and reload sheets dataset
  const refreshAllData = () => {
    initDB();
    const fetchedSections = dbService.getSections();
    const fetchedStudents = dbService.getStudents();
    const fetchedSettings = dbService.getSettings();
    
    // Fetch all logs & attendance records
    const recordsParsed: AttendanceRecord[] = dbService.getAttendanceRecords();
    
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
    if (initialLoadRef.current) return;
    initialLoadRef.current = true;

    const sheetsUrl = dbService.getSheetsUrl();
    if (sheetsUrl) {
      addToast('🔄 กำลังระดมประมวลผลและประสานข้อมูลสถิติจาก Google Sheets ของคุณล่าสุด...', 'info');
      dbService.syncFromSheets(sheetsUrl).then((res) => {
        if (res.success) {
          addToast('✅ ประสานและดึงข้อมูลทะเบียนกับตั้งค่าจาก Google Sheets สำเร็จเรียบร้อย!', 'success');
        } else {
          addToast(`⚠️ ไม่สามารถประสานตารางอัตโนมัติ: ${res.message}`, 'error');
        }
        refreshAllData();
      }).catch((err) => {
        addToast(`⚠️ ประสานตารางล้มเหลว: ${err.message}`, 'error');
        refreshAllData();
      });
    } else {
      refreshAllData();
      setShowUrlPrompt(true);
    }
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

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolNameInput.trim() || !academicYearInput.trim()) {
      addToast('กรุณากรอกข้อมูลตั้งค่าโรงเรียนและปีการศึกษาให้ครบถ้วน', 'error');
      return;
    }

    setSavingSettings(true);
    try {
      const updatedSettings: Settings = {
        school_name: schoolNameInput.trim(),
        academic_year: academicYearInput.trim(),
        default_status: settings.default_status,
        low_attendance_threshold: Number(lowAttendanceThresholdInput),
      };

      const res = await dbService.updateSettings(updatedSettings);
      refreshAllData();
      addToast(res.message, res.success ? 'success' : 'error');
    } catch (err: any) {
      addToast(`บันทึกตั้งค่าล้มเหลว: ${err.message}`, 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleResetAppToDefault = () => {
    setShowResetConfirm(true);
  };

  const confirmResetAppToDefault = async () => {
    setShowResetConfirm(false);
    setResettingDB(true);
    addToast('🔄 กำลังเชื่อมต่อเพื่อเคลียร์ฐานข้อมูลประวัติและล้างสร้างตารางเริ่มแรกบน Google Sheets สักครู่...', 'info');
    try {
      const res = await dbService.resetDBAndSync();
      refreshAllData();
      addToast(res.message, res.success ? 'success' : 'info');
    } catch (err: any) {
      addToast(`เกิดข้อผิดพลาดในการกู้คืนระบบ: ${err.message}`, 'error');
    } finally {
      setResettingDB(false);
    }
  };

  // Safe auto resolution of active student selection to handle modal update backtracks
  const activeStudentInModal = selectedStudent 
    ? students.find(s => s.student_id === selectedStudent.student_id) || selectedStudent
    : null;

  return (
    <div className="min-h-screen bg-natural-bg flex flex-col lg:flex-row scroll-smooth font-sans antialiased text-natural-text print:bg-white pb-24 lg:pb-10">
      
      {/* Mobile Top Header Bar */}
      <div className="flex lg:hidden sticky top-0 z-40 bg-natural-sidebar/95 backdrop-blur-md px-4 py-3 justify-between items-center border-b border-natural-border-dark shadow-xs print:hidden">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-natural-primary rounded-lg text-white flex items-center justify-center">
            <GraduationCap className="w-4.5 h-4.5" />
          </div>
          <div>
            <h1 className="font-extrabold text-xs text-natural-text tracking-wide font-display leading-tight">ระบบเช็กชื่อนักเรียนประถม</h1>
            <span className="text-[10px] text-natural-text-light font-bold truncate max-w-[150px] block leading-none mt-0.5">
              {settings.school_name || 'โรงเรียนประถม'}
            </span>
          </div>
        </div>
        
        {/* Quick Sync & Date Indicators */}
        <div className="flex items-center gap-2">
          {dbService.getSheetsUrl() ? (
            <span className="inline-flex w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="LIVE Connected" />
          ) : (
            <span className="inline-flex w-2 h-2 rounded-full bg-amber-400" title="Sandbox" />
          )}
          <span className="text-[10px] font-mono font-bold bg-[#EDEBE4] px-2 py-0.5 rounded-md text-natural-text border border-natural-border-dark">
            {selectedDate.split('-').reverse().slice(0, 2).join('/')}
          </span>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside className="hidden lg:flex lg:w-72 bg-natural-sidebar text-natural-text flex-shrink-0 flex-col justify-between border-r border-natural-border-dark print:hidden shadow-xs">
        <div className="flex flex-col">
          {/* Header Identity */}
          <div className="p-6 border-b border-natural-border-dark flex items-center gap-3">
            <div className="p-2.5 bg-natural-primary rounded-xl text-white flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm text-natural-text tracking-wide font-display">ระบบเช็กชื่อนักเรียนประถม</h1>
              <span className="text-3s text-natural-primary font-bold uppercase tracking-widest text-[10px] block mt-0.5">
                Google Sheets Database
              </span>
            </div>
          </div>

          <div className="px-4 py-3 border-b border-natural-border-dark bg-natural-primary/5 text-xs flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-natural-text-light">
              <span>สถานศึกษา:</span>
              <span className="text-natural-text font-bold max-w-[120px] truncate" title={settings.school_name}>
                {settings.school_name || 'ยังไม่ระบุสถานศึกษา'}
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
        <div className="p-4 border-t border-natural-border-dark m-4 rounded-xl bg-natural-primary/5 text-xs space-y-3">
          <div>
            <div className="text-natural-text-light mb-1 font-semibold uppercase tracking-wider text-[10px]">สถานะการทำงาน</div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-natural-primary text-white flex items-center justify-center font-bold text-xs shadow-sm">
                ครู
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-natural-text text-xs truncate" title={currentUser}>{currentUser}</p>
                {dbService.getSheetsUrl() ? (
                  <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    เชื่อมต่อ Sheets แล้ว
                  </p>
                ) : (
                  <p className="text-[10px] text-amber-600 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    โหมด Sandbox จำลอง
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 pt-1">
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-2 justify-center py-2 rounded-lg border text-2xs font-extrabold transition cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-natural-primary border-natural-primary text-white'
                  : 'border-natural-border hover:bg-natural-primary/10 text-natural-text-light hover:text-natural-text'
              }`}
            >
              <SettingsIcon className="w-3.5 h-3.5" />
              <span>ปรับแต่งระบบ / รีเซ็ตชีต</span>
            </button>
          </div>
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
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-100">
                      <div>
                        <h3 className="font-extrabold text-slate-800 text-base">การปรับแต่งระบบแผ่นงานสากล</h3>
                        <p className="text-slate-400 text-xs">แก้ไขข้อมูลการระบุตัวตนและข้อกำหนดเกณฑ์ขีดความปลอดภัยของการเข้าเรียน</p>
                      </div>
                      {dbService.getSheetsUrl() ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold border border-emerald-100 self-start sm:self-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          ซิงค์ Google Sheets คลาวด์ทำงานอยู่
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-[10px] font-bold border border-amber-100 self-start sm:self-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                          โหมด Sandbox จำลอง (Local)
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500">ชื่อโรงเรียนประถมศึกษา:</label>
                        <input
                          type="text"
                          required
                          disabled={savingSettings || resettingDB}
                          value={schoolNameInput}
                          onChange={(e) => setSchoolNameInput(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-xs md:text-sm bg-slate-50 disabled:opacity-60"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500">ปีการศึกษา / รุ่นการปกครอง:</label>
                        <input
                          type="text"
                          required
                          disabled={savingSettings || resettingDB}
                          value={academicYearInput}
                          onChange={(e) => setAcademicYearInput(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-xs md:text-sm bg-slate-50 disabled:opacity-60"
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
                          disabled={savingSettings || resettingDB}
                          value={lowAttendanceThresholdInput}
                          onChange={(e) => setLowAttendanceThresholdInput(Number(e.target.value))}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-xs md:text-sm bg-slate-50 disabled:opacity-60"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={savingSettings || resettingDB}
                        className={`px-5 py-3 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-2 ${
                          (savingSettings || resettingDB) ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800'
                        }`}
                      >
                        {savingSettings ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            กำลังบันทึกลงแผ่นงานและฐานข้อมูล...
                          </>
                        ) : (
                          'บันทึกการตั้งค่าระบบ'
                        )}
                      </button>
                    </div>
                  </form>

                  {/* Reset controls */}
                  <div className="bg-rose-50/40 rounded-2xl p-6 border border-rose-100 max-w-2xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-rose-100">
                      <h4 className="font-bold text-rose-800 text-sm flex items-center gap-1.5">
                        <Info className="w-4 h-4" /> ปฏิบัติการกู้คืนฐานข้อมูลโรงเรียนหลัก
                      </h4>
                      {dbService.getSheetsUrl() && (
                        <span className="inline-flex px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded">
                          มีผลกับ Google Sheets ด้วย
                        </span>
                      )}
                    </div>
                    <p className="text-rose-600 text-xs leading-relaxed">
                      หากต้องการลบข้อมูลประจุการเช็กรายวัน ประชาสัมพันธ์ หรือ ย้ายนักเรียนทั้งหมดให้กลับสู่ค่าตัวอย่างจำลองจากไฟล์ Google Sheets Seeding ดั้งเดิม สามารถกดปุ่มด้านล่างเพื่อล้างข้อมูล
                    </p>
                    
                    {dbService.getSheetsUrl() && (
                      <div className="bg-rose-100/35 p-3.5 rounded-xl border border-rose-200/50 text-[11px] text-rose-700 leading-relaxed">
                        <strong>💡 คำแนะนำเพิ่มเติมสำหรับ Google Sheets:</strong> เนื่องจากสิทธิ์ความปลอดภัยคลาวด์ การทำ Reset จะทำงานได้สมบูรณ์หากแอปสคริปต์บนคลาวด์ได้รับการอัปเดต โดยกดยืนยันด้วยเว็บแอปที่ผ่านการตั้งค่าสิทธิ์ให้ถูกต้อง หากติดขัด คุณครูสามารถเข้าไปยังแผ่นงาน Google Sheets และกดย้อนคำสั่งแก้ไขเวอร์ชันประวัติชีต (Version history) แมนนวลได้ทุกเมื่อ
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={resettingDB || savingSettings}
                      onClick={handleResetAppToDefault}
                      className={`px-4 py-2 text-white rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                        (resettingDB || savingSettings) ? 'bg-slate-400 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-700'
                      }`}
                    >
                      {resettingDB ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          กำลังล้างปรับโครงสร้างแผ่นงาน Google Sheets...
                        </>
                      ) : (
                        'ล้างประวัติกลับสู่ค่าเริ่มต้นโรงเรียน'
                      )}
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

      {/* First-time Apps Script URL configuration prompt */}
      <AnimatePresence>
        {showUrlPrompt && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-xl p-6 max-w-md w-full font-sans text-natural-text relative overflow-hidden"
            >
              <div className="text-center space-y-2 mb-6">
                <div className="mx-auto w-12 h-12 bg-natural-primary/10 rounded-full flex items-center justify-center text-natural-primary mb-1">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <h3 className="font-black text-lg text-slate-800 tracking-tight">เริ่มต้นใช้งานระบบ</h3>
                <p className="text-xs text-slate-400">
                  เชื่อมต่อฐานข้อมูล Google Sheets เพื่อทำงานแบบคลาวด์ หรือเลือกโหมดจำลองทดลองใช้งานก่อนได้
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                      <Link2 className="w-3.5 h-3.5 text-natural-primary" />
                      ลิงก์ Google Apps Script URL:
                    </label>
                  </div>
                  <input
                    type="text"
                    value={promptUrlInput}
                    onChange={(e) => {
                      setPromptUrlInput(e.target.value);
                      if (promptError) setPromptError('');
                    }}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-slate-50 focus:outline-none focus:border-natural-primary focus:bg-white transition"
                  />
                  {promptError && (
                    <p className="text-2xs text-rose-500 font-bold flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{promptError}</span>
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <button
                    type="button"
                    disabled={promptSyncing}
                    onClick={async () => {
                      const trimmed = promptUrlInput.trim();
                      if (!trimmed) {
                        setPromptError('กรุณากรอกลิงก์ Web App URL');
                        return;
                      }
                      if (!trimmed.startsWith('https://script.google.com/')) {
                        setPromptError('ลิงก์ต้องขึ้นต้นด้วย https://script.google.com/');
                        return;
                      }

                      setPromptSyncing(true);
                      setPromptError('');
                      addToast('กำลังซิงค์เชื่อมโยง Google Sheets...', 'info');

                      try {
                        const res = await dbService.syncFromSheets(trimmed);
                        if (res.success) {
                          dbService.setSheetsUrl(trimmed);
                          refreshAllData();
                          setShowUrlPrompt(false);
                          addToast('เชื่อมโยงดึงข้อมูลนักเรียนสำเร็จ!', 'success');
                        } else {
                          setPromptError(res.message);
                          addToast(`ซิงค์ข้อมูลไม่สำเร็จ: ${res.message}`, 'error');
                        }
                      } catch (err: any) {
                        const msg = err.message || 'การเชื่อมต่อผิดพลาด';
                        setPromptError(msg);
                        addToast(`ซิงค์ชีตล้มเหลว: ${msg}`, 'error');
                      } finally {
                        setPromptSyncing(false);
                      }
                    }}
                    className="w-full py-3 text-xs font-bold bg-[#2C2A29] hover:bg-slate-800 text-white rounded-xl transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {promptSyncing ? (
                      <>
                        <RefreshCw className="w-4.5 h-4.5 animate-spin" />
                        <span>กำลังซิงค์ข้อมูล...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4.5 h-4.5" />
                        <span>เชื่อมโยงและซิงค์ข้อมูล</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={promptSyncing}
                    onClick={() => {
                      setShowUrlPrompt(false);
                      addToast('ใช้งานโหมดทดลองออฟไลน์ Sandbox เรียบร้อย', 'info');
                    }}
                    className="w-full py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition cursor-pointer border border-transparent hover:border-slate-100 text-center"
                  >
                    ใช้งานแบบจำลอง (Sandbox Mode)
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="flex lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-natural-border-dark z-40 items-center justify-around py-2 px-1 pb-safe-bottom shadow-lg print:hidden">
        <button
          onClick={() => {
            setActiveTab('dashboard');
            setShowMobileMenu(false);
          }}
          className={`flex flex-col items-center gap-1 flex-1 py-1 px-2.5 transition rounded-lg ${
            activeTab === 'dashboard' ? 'text-natural-primary font-boldScale' : 'text-natural-text-light hover:text-natural-text'
          }`}
          style={{ color: activeTab === 'dashboard' ? 'var(--color-natural-primary)' : 'var(--color-natural-text-light)' }}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] tracking-tight truncate font-bold">ภาพรวม</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('roster');
            setShowMobileMenu(false);
          }}
          className={`flex flex-col items-center gap-1 flex-1 py-1 px-2.5 transition rounded-lg ${
            activeTab === 'roster' ? 'text-natural-primary font-boldScale' : 'text-natural-text-light hover:text-natural-text'
          }`}
          style={{ color: activeTab === 'roster' ? 'var(--color-natural-primary)' : 'var(--color-natural-text-light)' }}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px] tracking-tight truncate font-bold">เช็กชื่อ</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('reports');
            setShowMobileMenu(false);
          }}
          className={`flex flex-col items-center gap-1 flex-1 py-1 px-2.5 transition rounded-lg ${
            activeTab === 'reports' ? 'text-natural-primary font-boldScale' : 'text-natural-text-light hover:text-natural-text'
          }`}
          style={{ color: activeTab === 'reports' ? 'var(--color-natural-primary)' : 'var(--color-natural-text-light)' }}
        >
          <FileText className="w-5 h-5" />
          <span className="text-[10px] tracking-tight truncate font-bold">สถิติรายงาน</span>
        </button>

        <button
          onClick={() => {
            setShowMobileMenu(!showMobileMenu);
          }}
          className={`flex flex-col items-center gap-1 flex-1 py-1 px-2.5 transition rounded-lg relative ${
            showMobileMenu || ['sections', 'sheets', 'settings'].includes(activeTab)
              ? 'text-natural-primary font-boldScale'
              : 'text-natural-text-light hover:text-natural-text'
          }`}
          style={{
            color: showMobileMenu || ['sections', 'sheets', 'settings'].includes(activeTab)
              ? 'var(--color-natural-primary)'
              : 'var(--color-natural-text-light)'
          }}
        >
          {['sections', 'sheets', 'settings'].includes(activeTab) && (
            <span className="absolute top-1 right-1/3 w-1.5 h-1.5 bg-natural-primary rounded-full animate-pulse" style={{ backgroundColor: 'var(--color-natural-primary)' }} />
          )}
          <Menu className="w-5 h-5" />
          <span className="text-[10px] tracking-tight truncate font-bold">เมนูเพิ่มเติม</span>
        </button>
      </nav>

      {/* Mobile Bottom Drawer Menu Overlay */}
      <AnimatePresence>
        {showMobileMenu && (
          <>
            {/* Backdrop shade */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileMenu(false)}
              className="fixed inset-0 bg-black z-40 lg:hidden"
            />
            
            {/* Menu Drawer Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 bg-natural-bg rounded-t-3xl border-t border-natural-border-dark z-50 p-6 flex flex-col gap-5 shadow-2xl max-h-[85vh] overflow-y-auto lg:hidden pb-20"
            >
              <div className="flex justify-between items-center border-b border-natural-border-dark pb-3">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-natural-primary" />
                  <h3 className="font-extrabold text-sm font-display text-natural-text">เมนูเครื่องมือทั้งหมด</h3>
                </div>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-1.5 rounded-full bg-[#EDEBE4] hover:bg-natural-border-dark transition cursor-pointer text-natural-text"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Institution information tags */}
              <div className="bg-natural-sidebar p-4 rounded-2xl border border-natural-border-dark/60 text-xs flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-natural-text-light font-semibold">สถานศึกษา:</span>
                  <span className="text-natural-text font-extrabold max-w-[200px] truncate">{settings.school_name || 'ไม่ได้กำหนด'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-natural-text-light font-semibold">ปีการศึกษา:</span>
                  <span className="text-natural-primary font-mono font-extrabold">{settings.academic_year || '2569'}</span>
                </div>
                <div className="flex justify-between items-center mt-1 pt-2 border-t border-natural-border-dark">
                  <span className="text-natural-text-light font-semibold">ครูผู้ใช้งาน:</span>
                  <span className="text-natural-text font-bold">{currentUser}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-natural-text-light font-semibold">สถานะ API:</span>
                  {dbService.getSheetsUrl() ? (
                    <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      LIVE เชื่อมต่อ Sheets แล้ว
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-600 font-extrabold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                      ออฟไลน์ Sandbox
                    </span>
                  )}
                </div>
              </div>

              {/* Navigation list */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    setActiveTab('sections');
                    setShowMobileMenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition cursor-pointer text-left border ${
                    activeTab === 'sections'
                      ? 'bg-natural-primary text-white font-bold border-transparent'
                      : 'bg-white hover:bg-slate-50 text-natural-text border-natural-border hover:border-natural-border-dark'
                  }`}
                  style={{
                    backgroundColor: activeTab === 'sections' ? 'var(--color-natural-primary)' : '#FFF',
                    color: activeTab === 'sections' ? '#FFF' : 'var(--color-natural-text)'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 flex-shrink-0" />
                    <span className="text-xs font-bold">จัดการชั้นเรียน (Sections)</span>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-55" />
                </button>

                <button
                  onClick={() => {
                    setActiveTab('sheets');
                    setShowMobileMenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition cursor-pointer text-left border ${
                    activeTab === 'sheets'
                      ? 'bg-natural-primary text-white font-bold border-transparent'
                      : 'bg-white hover:bg-slate-50 text-natural-text border-natural-border hover:border-natural-border-dark'
                  }`}
                  style={{
                    backgroundColor: activeTab === 'sheets' ? 'var(--color-natural-primary)' : '#FFF',
                    color: activeTab === 'sheets' ? '#FFF' : 'var(--color-natural-text)'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="w-5 h-5 flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">เชื่อมต่อระบบ Sheets API</span>
                      <span className="text-[9px] opacity-75 font-semibold mt-0.5">กู้คืนสคริปต์และตัวรับส่ง webhook</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-55" />
                </button>

                <button
                  onClick={() => {
                    setActiveTab('settings');
                    setShowMobileMenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition cursor-pointer text-left border ${
                    activeTab === 'settings'
                      ? 'bg-natural-primary text-white font-bold border-transparent'
                      : 'bg-white hover:bg-slate-50 text-natural-text border-natural-border hover:border-natural-border-dark'
                  }`}
                  style={{
                    backgroundColor: activeTab === 'settings' ? 'var(--color-natural-primary)' : '#FFF',
                    color: activeTab === 'settings' ? '#FFF' : 'var(--color-natural-text)'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <SettingsIcon className="w-5 h-5 flex-shrink-0" />
                    <span className="text-xs font-bold">ปรับแต่งระบบ / รีเซ็ตชีต</span>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-55" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={showResetConfirm}
        title="ยืนยันการรีเซ็ตหลักสูตรและฐานข้อมูล"
        message={
          dbService.getSheetsUrl()
            ? '⚠️ คุณครูตรวจพบตัวเชื่อม Google Sheets สด! คุณแน่ใจใช่หรือไม่ที่จะย้อนคืนฐานข้อมูลระบบและเขียนทับสร้างตารางพร้อมข้อมูลเด็กนักเรียนตั้งต้นลงในหน้า Google Sheets ของท่านด้วย? ข้อมูลเดิมในแต่ละชีตจะถูกเขียนเพื่อล้างและเริ่มต้นใหม่'
            : '⚠️ คุณครูแน่ใจใช่หรือไม่ที่จะรีเซ็ตล้างแผ่นงานข้อมูล (Reset Sheets) กลับสู่ค่าจำลองจากโรงเรียนเริ่มต้นเดิม? ประวัติการเช็กที่บันทึกใหม่ทั้งหมดจะสูญหายถาวร'
        }
        confirmText="ยืนยันการรีเซ็ต"
        cancelText="ยกเลิก"
        isDestructive={true}
        onConfirm={confirmResetAppToDefault}
        onCancel={() => setShowResetConfirm(false)}
      />

    </div>
  );
}
