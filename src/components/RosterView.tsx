/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Section, Student, AttendanceStatus, AttendanceRecord } from '../types';
import { dbService, calculateStudentAttendanceRate } from '../db';
import ConfirmModal from './ConfirmModal';
import {
  Search,
  UserCheck,
  UserX,
  Clock,
  Briefcase,
  Undo2,
  Trash2,
  PlusCircle,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  X,
  FileDown,
  Pencil
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  sections: Section[];
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  selectedDate: string;
  onAddToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onRefreshAllData: () => void;
  onUndo: () => void;
  onSelectStudent: (student: Student) => void;
  currentUser: string;
}

export default function RosterView({
  sections,
  students,
  attendanceRecords,
  selectedDate,
  onAddToast,
  onRefreshAllData,
  onUndo,
  onSelectStudent,
  currentUser,
}: Props) {
  const [selectedSectionId, setSelectedSectionId] = useState<string>(
    sections.length > 0 ? sections[0].section_id : ''
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all'); // 'all', 'Present', 'Absent', 'Late', 'Excused', 'unchecked'
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'draft'>('saved');

  // Student creation dialog state
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [studentToDelete, setStudentToDelete] = useState<{ id: string; name: string } | null>(null);

  // Bulk action comment/note modal state
  const [activeNoteStudent, setActiveNoteStudent] = useState<Student | null>(null);
  const [studentNoteText, setStudentNoteText] = useState('');

  useEffect(() => {
    if (sections.length > 0 && !selectedSectionId) {
      setSelectedSectionId(sections[0].section_id);
    }
  }, [sections]);

  // Active section configuration
  const activeSection = sections.find((s) => s.section_id === selectedSectionId);

  // Active students in selected section
  const sectionStudents = students.filter(
    (s) => s.section_id === selectedSectionId && s.active
  );

  // Dynamic filter lists
  const filteredStudents = sectionStudents.filter((stu) => {
    // Name search match
    const fullName = `${stu.first_name} ${stu.last_name}`.toLowerCase();
    const queryMatch = fullName.includes(searchQuery.toLowerCase());

    // Status filter match
    const todayRec = attendanceRecords.find(
      (r) => r.student_id === stu.student_id && r.date === selectedDate
    );
    const currentStatus = todayRec ? todayRec.status : '';

    let statusMatch = true;
    if (statusFilter === 'unchecked') {
      statusMatch = !currentStatus;
    } else if (statusFilter !== 'all') {
      statusMatch = currentStatus === statusFilter;
    }

    return queryMatch && statusMatch;
  });

  // Today's Stats for selected section
  const sectionRecords = attendanceRecords.filter(
    (r) => r.section_id === selectedSectionId && r.date === selectedDate
  );
  const checkedCount = sectionRecords.length;
  const totalCount = sectionStudents.length;

  const handleUpdateStatus = async (studentId: string, status: AttendanceStatus, note = '') => {
    setSaveState('saving');
    try {
      dbService.updateAttendanceStatus(studentId, selectedSectionId, status, selectedDate, currentUser, note);
      onRefreshAllData();

      // Simulate sheets API round-trip writeback confirmation delay
      setTimeout(() => {
        setSaveState('saved');
        onAddToast(`บันทึกสถานะ [${status}] ของนักเรียนลง Sheets สำเร็จ`, 'success');
      }, 500);
    } catch (err: any) {
      setSaveState('draft');
      onAddToast(`เกิดข้อผิดพลาดในการบันทึก: ${err.message}`, 'error');
    }
  };

  const handleBulkMarkStatus = async (status: AttendanceStatus) => {
    if (sectionStudents.length === 0) return;
    setSaveState('saving');
    try {
      dbService.bulkUpdateAttendance(selectedSectionId, status, selectedDate, currentUser);
      onRefreshAllData();

      setTimeout(() => {
        setSaveState('saved');
        onAddToast(`เปลี่ยนสถานะเด็กนักเรียนทั้งหมดเป็น [${status}] ในคราวเดียวเรียบร้อย`, 'success');
      }, 500);
    } catch (err: any) {
      setSaveState('draft');
      onAddToast(`เกิดข้อผิดพลาดในการตรวจสอบยกชุด: ${err.message}`, 'error');
    }
  };

  const handleDeleteStudent = (studentId: string, name: string) => {
    setStudentToDelete({ id: studentId, name });
  };

  const confirmDeleteStudent = () => {
    if (!studentToDelete) return;
    try {
      dbService.deleteStudent(studentToDelete.id);
      onRefreshAllData();
      onAddToast(`ลบประวัติของคุณ ${studentToDelete.name} สำเร็จและเขียนกลับไปยัง Students sheet`, 'success');
    } catch (err: any) {
      onAddToast(`ไม่สามารถลบชื่อได้: ${err.message}`, 'error');
    } finally {
      setStudentToDelete(null);
    }
  };

  const handleStartEditStudent = (stu: Student) => {
    setEditingStudentId(stu.student_id);
    setNewFirstName(stu.first_name);
    setNewLastName(stu.last_name);
    setNewNotes(stu.notes || '');
    setShowAddStudentModal(true);
    setSubmitError('');
  };

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!newFirstName.trim() || !newLastName.trim()) {
      setSubmitError('กรุณากรอกชื่อและนามสกุลให้ครบถ้วนก่อนบันทึก');
      return;
    }

    try {
      if (editingStudentId) {
        // Edit mode
        const currentStudent = students.find((s) => s.student_id === editingStudentId);
        if (!currentStudent) throw new Error('ไม่พบข้อมูลนักเรียนรายนี้');

        dbService.updateStudent({
          ...currentStudent,
          first_name: newFirstName.trim(),
          last_name: newLastName.trim(),
          notes: newNotes.trim(),
        });

        onRefreshAllData();
        onAddToast('อัปเดตข้อมูลนักเรียนรายคนร่วมใน Google Sheets สำเร็จ!', 'success');
      } else {
        // Create mode
        const studentData = {
          first_name: newFirstName.trim(),
          last_name: newLastName.trim(),
          section_id: selectedSectionId,
          grade_level: activeSection?.grade_level || 'ประถมศึกษาปีที่ 1',
          notes: newNotes.trim(),
        };

        dbService.addStudent(studentData);
        onRefreshAllData();
        onAddToast('เพิ่มข้อมูลนักเรียนใหม่และเขียนบันทึกลงวงจร Google Sheets สำเร็จ!', 'success');
      }

      // Reset
      setNewFirstName('');
      setNewLastName('');
      setNewNotes('');
      setEditingStudentId(null);
      setShowAddStudentModal(false);
    } catch (err: any) {
      setSubmitError(err.message || 'บันทึกข้อมูลนักเรียนล้มเหลว');
    }
  };

  const handleOpenNoteEditor = (student: Student) => {
    const rec = attendanceRecords.find(
      (r) => r.student_id === student.student_id && r.date === selectedDate
    );
    setActiveNoteStudent(student);
    setStudentNoteText(rec?.note || student.notes || '');
  };

  const handleSaveStudentNote = () => {
    if (!activeNoteStudent) return;
    const rec = attendanceRecords.find(
      (r) => r.student_id === activeNoteStudent.student_id && r.date === selectedDate
    );
    const activeStatus = rec ? rec.status : 'Present'; // default to Present if not checked but has note

    handleUpdateStatus(activeNoteStudent.student_id, activeStatus, studentNoteText);
    setActiveNoteStudent(null);
    setStudentNoteText('');
  };

  // CSV Exporter for Sheets representation
  const handleExportCSV = () => {
    if (sectionStudents.length === 0) {
      onAddToast('ไม่มีข้อมูลนักเรียนสำหรับการส่งออก', 'info');
      return;
    }

    const headers = ['Student ID', 'First Name', 'Last Name', 'Grade Level', 'Today Status', 'Attendance Rate', 'Notes'];
    const rows = sectionStudents.map((stu) => {
      const todayRec = attendanceRecords.find(
        (r) => r.student_id === stu.student_id && r.date === selectedDate
      );
      return [
        stu.student_id,
        stu.first_name,
        stu.last_name,
        stu.grade_level,
        todayRec ? todayRec.status : 'ยังไม่ได้เช็ก',
        `${stu.attendance_rate}%`,
        stu.notes || '-',
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.map(val => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Roster_${activeSection?.grade_level}_${activeSection?.section_name}_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onAddToast('ส่งออกไฟล์สรุปรายวันสำเร็จสำหรับนำไปป้อนลงฐานข้อมูลหลัก', 'success');
  };

  return (
    <div className="space-y-5 font-sans">
      
      {/* Search and Settings Filter Row */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between overflow-hidden">
        
        {/* Sections Selection Buttons dropdown or pills with horizontal swiping on mobile */}
        <div className="flex overflow-x-auto md:flex-wrap items-center gap-1 bg-natural-sidebar p-1 rounded-xl w-full md:w-fit border border-natural-border-dark/60 scrollbar-none">
          {sections.map((sec) => (
            <button
              key={sec.section_id}
              onClick={() => setSelectedSectionId(sec.section_id)}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer whitespace-nowrap flex-shrink-0 ${
                selectedSectionId === sec.section_id
                  ? 'bg-natural-card text-natural-text shadow-xs border border-[#E2DFD3]'
                  : 'text-natural-text-light hover:text-natural-text hover:bg-natural-card/50'
              }`}
            >
              {sec.grade_level} ({sec.section_name})
            </button>
          ))}
        </div>

        {/* Sync Save State Indicators */}
        <div id="save-sync-monitor" className="flex items-center gap-2 self-end md:self-auto text-xs font-mono">
          {saveState === 'saving' && (
            <span className="flex items-center gap-1.5 text-natural-late bg-natural-late/10 px-3 py-1 rounded-full font-bold animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-natural-late animate-ping"></span>
              กำลังเขียนข้อมูลลง Google Sheets... (Autosave)
            </span>
          )}
          {saveState === 'saved' && (
            <span className="flex items-center gap-1.5 text-natural-present bg-natural-present/10 px-3 py-1 rounded-full font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              เชื่อมฐานข้อมูล Sheets ตลอดเวลา
            </span>
          )}
          {saveState === 'draft' && (
            <span className="flex items-center gap-1.5 text-natural-text-light bg-natural-sidebar px-3 py-1 rounded-full font-bold">
              <AlertCircle className="w-3.5 h-3.5 text-natural-text-light" />
              ออฟไลน์ (เซฟเก็บข้อมูลในเครื่องชั่วคราว)
            </span>
          )}
        </div>
      </div>

      <div className="bg-natural-card rounded-2xl border border-natural-border shadow-sm overflow-hidden flex flex-col justify-between">
        
        {/* Bulk tools bar */}
        <div className="p-5 border-b border-natural-border bg-natural-bg/50 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <div className="flex flex-col gap-1">
            <h3 className="font-extrabold text-natural-text text-base flex items-center gap-2">
              <span>เช็กชื่อห้องเรียน: {activeSection?.grade_level} {activeSection?.section_name}</span>
              <span className="text-2xs bg-natural-primary/10 text-natural-primary px-2.5 py-0.5 rounded-full font-bold">
                ครูผู้ดูแล: {activeSection?.teacher_name}
              </span>
            </h3>
            <p className="text-xs text-natural-text-light">
              ความคืบหน้าการเช็กวันนี้: <strong className="text-natural-text">{checkedCount} จากสมาชิกทั้งหมด {totalCount} คน</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
            {/* Rapid Bulk actions */}
            <button
              onClick={() => handleBulkMarkStatus('Present')}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-natural-present/10 hover:bg-natural-present/20 text-natural-present rounded-xl text-xs font-bold transition border border-natural-present/20 cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              มาเรียนทุกคน
            </button>
            <button
              onClick={onUndo}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-natural-sidebar hover:bg-natural-sidebar/85 text-natural-text rounded-xl text-xs font-bold transition cursor-pointer"
              title="ย้อนรอยคำสั่งเช็กชื่อล่าสุด"
            >
              <Undo2 className="w-4 h-4" />
              เลิกทำ (Undo)
            </button>
            
            <div className="h-4 w-px bg-natural-border-dark hidden md:block"></div>

            <button
              onClick={() => {
                setEditingStudentId(null);
                setNewFirstName('');
                setNewLastName('');
                setNewNotes('');
                setSubmitError('');
                setShowAddStudentModal(true);
              }}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-natural-primary hover:bg-natural-primary/90 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              เพิ่มนักเรียน
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-natural-card hover:bg-natural-bg text-natural-text rounded-xl text-xs font-bold border border-natural-border transition cursor-pointer"
              title="ออกใบรายชื่อเป็นเครื่องมือวิเคราะห์"
            >
              <FileDown className="w-4.5 h-4.5 text-natural-text-light" />
              <span>ส่งออก CSV</span>
            </button>
          </div>
        </div>

        {/* Filters and search options */}
        <div className="px-5 py-4 border-b border-[#ECE9E0] bg-natural-card grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-natural-text-light absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="ค้นหาชื่อหรือนามสกุลนักเรียน..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-natural-border focus:border-natural-primary focus:outline-none text-xs md:text-sm bg-natural-bg text-natural-text"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center md:col-span-2 overflow-hidden w-full">
            <span className="text-natural-text-light text-xs font-semibold whitespace-nowrap">ตัวกรองสิทธิ์:</span>
            <div className="flex overflow-x-auto pb-1 sm:pb-0 sm:flex-wrap gap-1.5 w-full scrollbar-none">
              {[
                { label: 'ทั้งหมด', value: 'all' },
                { label: 'มาเรียน', value: 'Present' },
                { label: 'สาย', value: 'Late' },
                { label: 'ลาป่วย/กิจ', value: 'Excused' },
                { label: 'ขาดเรียน', value: 'Absent' },
                { label: 'ยังไม่เช็ก', value: 'unchecked' },
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setStatusFilter(filter.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap flex-shrink-0 ${
                    statusFilter === filter.value
                      ? 'bg-natural-primary text-white'
                      : 'bg-natural-sidebar text-natural-text hover:text-natural-text hover:bg-natural-sidebar/80'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Student Check-list Grid Table */}
        <div className="overflow-x-auto">
          {filteredStudents.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
              <AlertCircle className="w-10 h-10 text-natural-text-light/40 animate-pulse" />
              <div className="space-y-1">
                <p className="font-bold text-natural-text text-base">ไม่พบนักเรียนตามเงื่อนไขที่กำหนด</p>
                <p className="text-natural-text-light text-xs">กรุณากรอกใหม่อีกครั้ง หรือเพิ่มนักเรียนลงในชั้นเรียนนี้</p>
              </div>
            </div>
          ) : (
            <>
              {/* Desktop and Tablet Roster Table */}
              <table className="min-w-full divide-y divide-[#ECE9E0] text-left hidden md:table">
                <thead className="bg-[#EDEBE4]/40 text-natural-text-light text-2xs font-bold uppercase tracking-wider whitespace-nowrap">
                  <tr>
                    <th className="px-6 py-4 w-12 text-center whitespace-nowrap">รหัส</th>
                    <th className="px-6 py-4 whitespace-nowrap">ชื่อ - นามสกุล</th>
                    <th className="px-4 py-4 text-center whitespace-nowrap">การมาเรียนสะสม</th>
                    <th className="px-6 py-4 text-center whitespace-nowrap">เลือกเช็กสถานะวันนี้</th>
                    <th className="px-6 py-4 text-right whitespace-nowrap">ดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECE9E0] font-sans text-xs md:text-sm">
                  {filteredStudents.map((stu, i) => {
                    const todayRec = attendanceRecords.find(
                      (r) => r.student_id === stu.student_id && r.date === selectedDate
                    );
                    const activeStatus = todayRec ? todayRec.status : '';

                    const attendanceThreshold = stu.attendance_rate < 85;

                    return (
                      <motion.tr
                        key={stu.student_id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`hover:bg-[#EDEBE4]/20 transition duration-150 ${
                          activeStatus === 'Absent' ? 'bg-[#C04000]/5' : ''
                        }`}
                      >
                        {/* ID */}
                        <td className="px-6 py-3 font-mono text-xs text-natural-text-light text-center font-semibold">
                          {stu.student_id.replace('STU-', '')}
                        </td>

                        {/* Name & Note Indicator */}
                        <td className="px-6 py-3">
                          <div className="font-bold text-natural-text flex items-center gap-1.5">
                            <button
                              onClick={() => onSelectStudent(stu)}
                              className="hover:underline text-left cursor-pointer transition text-natural-text"
                            >
                              {stu.first_name} {stu.last_name}
                            </button>
                            {todayRec?.note && (
                              <span
                                className="text-2xs bg-natural-primary/10 border border-natural-primary/20 text-natural-primary px-2 py-0.5 rounded-md cursor-pointer block max-w-[140px] truncate"
                                title={todayRec.note}
                              >
                                โน้ต: {todayRec.note}
                              </span>
                            )}
                          </div>
                          {stu.notes && !todayRec?.note && (
                            <p className="text-2xs text-[#D99330] font-semibold block mt-0.5 truncate max-w-sm">
                              ⚠️ หมายเหตุ: {stu.notes}
                            </p>
                          )}
                        </td>

                        {/* Cumulative attendance rate bar style */}
                        <td className="px-4 py-3 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className={`text-xs font-extrabold ${
                              attendanceThreshold ? 'text-natural-absent' : 'text-natural-present'
                            }`}>
                              {stu.attendance_rate}%
                            </span>
                            <div className="w-14 bg-natural-bg h-1.5 rounded-full mt-1 overflow-hidden border border-[#ECE9E0]">
                              <div
                                className={`h-full rounded-full ${
                                  attendanceThreshold ? 'bg-natural-absent' : 'bg-natural-present'
                                }`}
                                style={{ width: `${stu.attendance_rate}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>

                        {/* One Touch Click Status updates */}
                        <td className="px-6 py-3">
                          <div className="flex items-center justify-center gap-1">
                            {/* Present button */}
                            <button
                              onClick={() => handleUpdateStatus(stu.student_id, 'Present')}
                              className={`p-2 font-bold rounded-xl text-2xs md:text-xs transition flex flex-col items-center gap-1 min-w-16 cursor-pointer border ${
                                activeStatus === 'Present'
                                  ? 'bg-[#4F7942] text-white border-transparent shadow-xs'
                                  : 'bg-natural-card hover:bg-natural-bg text-natural-text-light border-[#ECE9E0]'
                              }`}
                            >
                              <span className="text-3xs block uppercase tracking-wider">Present</span>
                              <span>มาเรียน</span>
                            </button>

                            {/* Late button */}
                            <button
                              onClick={() => handleUpdateStatus(stu.student_id, 'Late')}
                              className={`p-2 font-bold rounded-xl text-2xs md:text-xs transition flex flex-col items-center gap-1 min-w-16 cursor-pointer border ${
                                activeStatus === 'Late'
                                  ? 'bg-[#D99330] text-white border-transparent shadow-xs'
                                  : 'bg-natural-card hover:bg-natural-bg text-natural-text-light border-[#ECE9E0]'
                              }`}
                            >
                              <span className="text-3xs block uppercase tracking-wider">Late</span>
                              <span>สาย</span>
                            </button>

                            {/* Excused Button */}
                            <button
                              onClick={() => handleUpdateStatus(stu.student_id, 'Excused')}
                              className={`p-2 font-bold rounded-xl text-2xs md:text-xs transition flex flex-col items-center gap-1 min-w-16 cursor-pointer border ${
                                activeStatus === 'Excused'
                                  ? 'bg-[#4682B4] text-white border-transparent shadow-xs'
                                  : 'bg-natural-card hover:bg-natural-bg text-natural-text-light border-[#ECE9E0]'
                              }`}
                            >
                              <span className="text-3xs block uppercase tracking-wider">Excused</span>
                              <span>ลาออก/ป่วย</span>
                            </button>

                            {/* Absent button */}
                            <button
                              onClick={() => handleUpdateStatus(stu.student_id, 'Absent')}
                              className={`p-2 font-bold rounded-xl text-2xs md:text-xs transition flex flex-col items-center gap-1 min-w-16 cursor-pointer border ${
                                activeStatus === 'Absent'
                                  ? 'bg-[#C04000] text-white border-transparent shadow-xs'
                                  : 'bg-natural-card hover:bg-natural-bg text-natural-text-light border-[#ECE9E0]'
                              }`}
                            >
                              <span className="text-3xs block uppercase tracking-wider">Absent</span>
                              <span>ขาดเรียน</span>
                            </button>
                          </div>
                        </td>

                        {/* Manual modification actions & Notes editing */}
                        <td className="px-6 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenNoteEditor(stu)}
                              className="text-natural-primary hover:text-natural-primary/80 text-xs font-semibold px-2.5 py-1 bg-[#5A6B5D]/10 rounded-lg transition cursor-pointer"
                            >
                              เพิ่มโน้ต
                            </button>
                            <button
                              onClick={() => handleStartEditStudent(stu)}
                              className="p-1 text-natural-text-light/50 hover:text-natural-primary hover:bg-[#EDEBE4]/60 rounded-lg transition cursor-pointer"
                              title="แก้ไขข้อมูลนักเรียน"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(stu.student_id, `${stu.first_name} ${stu.last_name}`)}
                              className="p-1.5 text-natural-absent hover:bg-[#C04000]/10 rounded-lg transition cursor-pointer"
                              title="ลบออกจากระบบห้องนี้"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Mobile Comfortable Card Layout */}
              <div className="block md:hidden divide-y divide-natural-border-light bg-natural-card">
                {filteredStudents.map((stu, i) => {
                  const todayRec = attendanceRecords.find(
                    (r) => r.student_id === stu.student_id && r.date === selectedDate
                  );
                  const activeStatus = todayRec ? todayRec.status : '';

                  const attendanceThreshold = stu.attendance_rate < 85;

                  return (
                    <motion.div
                      key={stu.student_id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 flex flex-col gap-3 transition duration-150 ${
                        activeStatus === 'Absent' ? 'bg-[#C04000]/5' : ''
                      }`}
                    >
                      {/* Avatar, Name, ID & Attendance summary rate */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <button
                            type="button"
                            onClick={() => onSelectStudent(stu)}
                            className="w-9 h-9 flex-shrink-0 bg-natural-sidebar rounded-full flex items-center justify-center font-bold text-xs text-natural-text cursor-pointer border border-[#ECE9E0]"
                          >
                            {stu.first_name.slice(0, 1)}
                          </button>
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => onSelectStudent(stu)}
                              className="font-bold text-xs text-natural-text text-left hover:underline block truncate cursor-pointer"
                            >
                              {stu.first_name} {stu.last_name}
                            </button>
                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-natural-text-light font-mono font-bold uppercase">
                                ID: {stu.student_id.replace('STU-', '')}
                              </span>
                              {todayRec?.note && (
                                <span
                                  className="text-[9px] bg-natural-primary/10 border border-natural-primary/25 text-natural-primary px-1.5 py-0.5 rounded font-bold truncate max-w-[120px]"
                                  title={todayRec.note}
                                >
                                  โน้ต: {todayRec.note}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Rate bar pill */}
                        <div className="flex flex-col items-end flex-shrink-0 text-right">
                          <span className={`text-[10px] sm:text-xs font-black ${
                            attendanceThreshold ? 'text-natural-absent' : 'text-natural-present'
                          }`}>
                            สะสม: {stu.attendance_rate}%
                          </span>
                          <div className="w-16 bg-[#EDEBE4] h-1 rounded-full mt-1 overflow-hidden border border-[#ECE9E0]">
                            <div
                              className={`h-full rounded-full ${
                                attendanceThreshold ? 'bg-natural-absent' : 'bg-natural-present'
                              }`}
                              style={{ width: `${stu.attendance_rate}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      {/* Cumulative remarks preview */}
                      {stu.notes && !todayRec?.note && (
                        <p className="text-[10px] text-[#D99330] font-bold bg-[#D99330]/5 px-2.5 py-1 rounded-lg border border-[#D99330]/15 leading-tight">
                          ⚠️ หมายเหตุสะสม: {stu.notes}
                        </p>
                      )}

                      {/* 4 grid quick-touch states buttons */}
                      <div className="grid grid-cols-4 gap-1.5 py-1">
                        {/* Present */}
                        <button
                          onClick={() => handleUpdateStatus(stu.student_id, 'Present')}
                          className={`py-2 px-1 font-bold rounded-xl text-[11px] transition flex flex-col items-center justify-center gap-1 border cursor-pointer active:scale-95 ${
                            activeStatus === 'Present'
                              ? 'bg-[#4F7942] text-white border-transparent shadow-xs'
                              : 'bg-white text-natural-text-light border-[#ECE9E0] hover:bg-natural-bg'
                          }`}
                        >
                          <span className="text-[8px] font-black uppercase tracking-wider block opacity-75">Present</span>
                          <span>มาเรียน</span>
                        </button>

                        {/* Late */}
                        <button
                          onClick={() => handleUpdateStatus(stu.student_id, 'Late')}
                          className={`py-2 px-1 font-bold rounded-xl text-[11px] transition flex flex-col items-center justify-center gap-1 border cursor-pointer active:scale-95 ${
                            activeStatus === 'Late'
                              ? 'bg-[#D99330] text-white border-transparent shadow-xs'
                              : 'bg-white text-natural-text-light border-[#ECE9E0] hover:bg-natural-bg'
                          }`}
                        >
                          <span className="text-[8px] font-black uppercase tracking-wider block opacity-75">Late</span>
                          <span>สาย</span>
                        </button>

                        {/* Excused */}
                        <button
                          onClick={() => handleUpdateStatus(stu.student_id, 'Excused')}
                          className={`py-2 px-1 font-bold rounded-xl text-[11px] transition flex flex-col items-center justify-center gap-1 border cursor-pointer active:scale-95 ${
                            activeStatus === 'Excused'
                              ? 'bg-[#4682B4] text-white border-transparent shadow-xs'
                              : 'bg-white text-natural-text-light border-[#ECE9E0] hover:bg-natural-bg'
                          }`}
                        >
                          <span className="text-[8px] font-black uppercase tracking-wider block opacity-75">Excused</span>
                          <span>ลา</span>
                        </button>

                        {/* Absent */}
                        <button
                          onClick={() => handleUpdateStatus(stu.student_id, 'Absent')}
                          className={`py-2 px-1 font-bold rounded-xl text-[11px] transition flex flex-col items-center justify-center gap-1 border cursor-pointer active:scale-95 ${
                            activeStatus === 'Absent'
                              ? 'bg-[#C04000] text-white border-transparent shadow-xs'
                              : 'bg-white text-natural-text-light border-[#ECE9E0] hover:bg-natural-bg'
                          }`}
                        >
                          <span className="text-[8px] font-black uppercase tracking-wider block opacity-75">Absent</span>
                          <span>ขาดเรียน</span>
                        </button>
                      </div>

                      {/* Card Footer actions */}
                      <div className="flex items-center justify-between border-t border-[#ECE9E0] pt-2 text-xs">
                        <button
                          onClick={() => handleOpenNoteEditor(stu)}
                          className="text-natural-primary hover:text-natural-primary/80 font-bold px-3 py-1.5 bg-[#5A6B5D]/10 rounded-lg transition cursor-pointer flex items-center gap-1"
                        >
                          <span>✍️ บันทึกอาการ / โน้ต</span>
                        </button>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleStartEditStudent(stu)}
                            className="px-2.5 py-1.5 text-natural-text hover:bg-natural-sidebar rounded-lg transition cursor-pointer flex items-center gap-1 font-semibold border border-[#ECE9E0]"
                            title="แก้ไขข้อมูลนักเรียน"
                          >
                            <Pencil className="w-3 h-3 text-natural-text-light" />
                            <span>แก้ไข</span>
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(stu.student_id, `${stu.first_name} ${stu.last_name}`)}
                            className="px-3 py-1.5 text-natural-absent hover:bg-[#C04000]/15 rounded-lg transition cursor-pointer flex items-center gap-1 font-semibold border border-natural-absent/25"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>ลบ</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Roster Add Student Modal */}
      <AnimatePresence>
        {showAddStudentModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden p-6 relative flex flex-col gap-4 font-sans border border-slate-100"
            >
              <button
                onClick={() => setShowAddStudentModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-800 text-lg">
                  {editingStudentId ? 'แก้ไขข้อมูลนักเรียน' : 'เพิ่มนักเรียนเข้าชั้นเรียน'}
                </h3>
                <p className="text-slate-400 text-xs">
                  {editingStudentId 
                    ? 'ปรับปรุงรายละเอียดของนักเรียนในแผ่นงานระบบหลักเรียนนี้' 
                    : 'ระบุข้อมูลนักเรียนและบันทึกประวัติล่วงหน้าเพื่อเตรียมพร้อมเข้าห้องเรียน'}
                </p>
              </div>

              {submitError && (
                <div className="p-3 bg-rose-50/85 text-rose-700 font-semibold rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{submitError}</span>
                </div>
              )}

              <form onSubmit={handleCreateStudent} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-600 text-xs font-semibold">ชื่อจริง / คำนำหน้า:</label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น สมชาย หรือ ด.ช. ชวิน"
                      value={newFirstName}
                      onChange={(e) => setNewFirstName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-xs md:text-sm bg-slate-50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-600 text-xs font-semibold">นามสกุล:</label>
                    <input
                      type="text"
                      required
                      placeholder="วิทยเกียรติ"
                      value={newLastName}
                      onChange={(e) => setNewLastName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-xs md:text-sm bg-slate-50"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-600 text-xs font-semibold opacity-90">ห้องเรียนที่เลือก:</label>
                  <input
                    type="text"
                    disabled
                    value={`${activeSection?.grade_level || ''} (${activeSection?.section_name || ''})`}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-100 bg-slate-100/50 text-slate-500 text-xs md:text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-600 text-xs font-semibold">หมายเหตุ / ข้อมูลแพ้อาหารหรือโรคประจำตัว:</label>
                  <textarea
                    rows={3}
                    placeholder="ความเจ็บป่วย ยาประจำตัว หรือหมายเหตุอื่น ๆ เพิ่มเติม..."
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-xs md:text-sm bg-slate-50"
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddStudentModal(false);
                      setEditingStudentId(null);
                    }}
                    className="flex-1 py-3 text-xs font-bold rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition cursor-pointer"
                  >
                    {editingStudentId ? 'บันทึกการแก้ไข' : 'ยืนยันการบันทึก'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Student Daily Notes Dialog */}
      <AnimatePresence>
        {activeNoteStudent && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full relative space-y-4 border border-slate-100"
            >
              <h4 className="font-extrabold text-slate-800 text-sm md:text-base">คุณครูบันทึกสาเหตุรายวันเพิ่มเติม</h4>
              <p className="text-slate-400 text-xs">
                ระบุเหตุผลเพื่อเป็นประวัติลงแผ่นงาน <strong className="text-indigo-600">Attendance Sheet</strong> ให้ {activeNoteStudent.first_name} ในวันที่ {selectedDate.split('-').reverse().join('/')}
              </p>

              <textarea
                rows={3}
                placeholder="ระบุสาเหตุ เช่นลาป่วย ยาพารา , รถยนต์เสียระเบิด หรือ อื่น ๆ..."
                value={studentNoteText}
                onChange={(e) => setStudentNoteText(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-xs md:text-sm bg-slate-50"
              />

              <div className="flex gap-2 mt-4 pt-1">
                <button
                  onClick={() => setActiveNoteStudent(null)}
                  className="flex-1 py-2 text-xs font-bold rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100/50 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSaveStudentNote}
                  className="flex-1 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white cursor-pointer"
                >
                  บันทึกโน้ต
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={!!studentToDelete}
        title="ยืนยันการลบรายชื่อนักเรียน"
        message={`คุณครูต้องการลบ/จำหน่ายรายชื่อ "${studentToDelete?.name}" ออกจากระบบทะเบียนประจำชั้นเรียนหรือไม่? ข้อมูลประวัติการมาเรียนเดิมจะถูกทำเครื่องหมายถาวร`}
        confirmText="ยืนยันการลบ"
        cancelText="ยกเลิก"
        isDestructive={true}
        onConfirm={confirmDeleteStudent}
        onCancel={() => setStudentToDelete(null)}
      />

    </div>
  );
}
