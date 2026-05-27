/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Section, Student } from '../types';
import { dbService } from '../db';
import { PlusCircle, Trash2, ArrowRightLeft, BookOpen, User, Users, AlertCircle, Edit2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  sections: Section[];
  students: Student[];
  onAddToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onRefreshAllData: () => void;
}

export default function SectionManager({ sections, students, onAddToast, onRefreshAllData }: Props) {
  const [showAddSection, setShowAddSection] = useState(false);
  const [gradeLevel, setGradeLevel] = useState('ประถมศึกษาปีที่ 1');
  const [sectionName, setSectionName] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [validationError, setValidationError] = useState('');

  // Edit classroom states
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [editGradeLevel, setEditGradeLevel] = useState('');
  const [editSectionName, setEditSectionName] = useState('');
  const [editTeacherName, setEditTeacherName] = useState('');

  const handleOpenEdit = (sec: Section) => {
    setEditingSection(sec);
    setEditGradeLevel(sec.grade_level);
    setEditSectionName(sec.section_name);
    setEditTeacherName(sec.teacher_name);
  };

  const handleSaveEditSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSection) return;
    if (!editSectionName.trim()) {
      onAddToast('กรุณาระบุชื่อห้องเรียน', 'error');
      return;
    }
    if (!editTeacherName.trim()) {
      onAddToast('กรุณาระบุชื่อครูที่ปรึกษาประจำชั้นเรียน', 'error');
      return;
    }

    try {
      dbService.updateSection({
        ...editingSection,
        grade_level: editGradeLevel,
        section_name: editSectionName.trim(),
        teacher_name: editTeacherName.trim(),
      });
      onRefreshAllData();
      setEditingSection(null);
      onAddToast('แก้ไขข้อมูลชั้นเรียนสำเร็จเสร็จสิ้น', 'success');
    } catch (err: any) {
      onAddToast(`ล้มเหลวในการแก้ไขห้องเรียน: ${err.message}`, 'error');
    }
  };

  const activeStudents = students.filter((s) => s.active);

  const handleAddSection = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!sectionName.trim()) {
      setValidationError('กรุณาระบุชื่อห้องเรียน เช่น "ห้อง 1/3" หรือ "ห้อง 2/2"');
      return;
    }
    if (!teacherName.trim()) {
      setValidationError('กรุณาระบุชื่อครูที่ปรึกษาประจำชั้นเรียน');
      return;
    }

    try {
      dbService.addSection({
        section_id: `SEC-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        grade_level: gradeLevel,
        section_name: sectionName.trim(),
        teacher_name: teacherName.trim(),
      });

      onRefreshAllData();
      setSectionName('');
      setTeacherName('');
      setShowAddSection(false);
      onAddToast('บันทึกระดับห้องเรียนใหม่สำเร็จเรียบร้อยและอัปเดตลง Sections sheet แล้ว!', 'success');
    } catch (err: any) {
      setValidationError(err.message || 'บันทึกห้องเรียนใหม่ล้มเหลว');
    }
  };

  const [deleteConfirmSection, setDeleteConfirmSection] = useState<{ id: string; name: string } | null>(null);

  const handleDeleteSection = (sectionId: string, name: string) => {
    const activeKids = activeStudents.filter((s) => s.section_id === sectionId);
    
    // Safety verification before delete
    if (activeKids.length > 0) {
      onAddToast(
        `ไม่สามารถลบ "${name}" ได้: เนื่องจากห้องนี้ยังมีนักเรียนที่กำลังเรียนอยู่ ${activeKids.length} คน กรุณาย้ายนักเรียนออกเสียก่อน`,
        'error'
      );
      return;
    }

    setDeleteConfirmSection({ id: sectionId, name });
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-extrabold text-natural-text text-lg">การจัดการระดับชั้นเรียนและห้องดูแล</h3>
          <p className="text-natural-text-light text-xs mt-0.5">เพิ่ม แก้ไข หรือลบระดับชั้นและแต่งตั้งครูที่ปรึกษาประจำห้องดูแลระบบ</p>
        </div>

        <button
          onClick={() => setShowAddSection(!showAddSection)}
          className="px-4 py-2.5 bg-natural-primary hover:bg-[#4F7942] text-white rounded-xl text-xs font-bold font-sans transition flex items-center gap-1.5 cursor-pointer self-start sm:sm:self-auto shadow-xs"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{showAddSection ? 'ปิดแผงกรอกข้อมูล' : 'เพิ่มห้องประจำชั้น'}</span>
        </button>
      </div>

      {/* Add section Collapsible Row */}
      <AnimatePresence>
        {showAddSection && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleAddSection} className="bg-[#EDEBE4]/40 border border-natural-border p-5 rounded-2xl space-y-4 shadow-2xs">
              <h4 className="font-bold text-natural-text text-sm">ระบุข้อมูลเพื่อบันทึกลงชีต Sections Sheet</h4>
              
              {validationError && (
                <div className="p-3 bg-natural-absent/15 border border-natural-absent/25 text-natural-absent font-bold rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{validationError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-natural-text-light">ระดับชั้นเรียนประถม:</label>
                  <select
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-natural-border bg-white text-natural-text text-xs md:text-sm focus:outline-none"
                  >
                    <option value="ประถมศึกษาปีที่ 1">ประถมศึกษาปีที่ 1</option>
                    <option value="ประถมศึกษาปีที่ 2">ประถมศึกษาปีที่ 2</option>
                    <option value="ประถมศึกษาปีที่ 3">ประถมศึกษาปีที่ 3</option>
                    <option value="ประถมศึกษาปีที่ 4">ประถมศึกษาปีที่ 4</option>
                    <option value="ประถมศึกษาปีที่ 5">ประถมศึกษาปีที่ 5</option>
                    <option value="ประถมศึกษาปีที่ 6">ประถมศึกษาปีที่ 6</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-natural-text-light">ชื่อห้องเรียน / บัญชีรายชื่อ:</label>
                  <input
                    type="text"
                    required
                    placeholder="ห้อง 1/3 (หรือ ห้องเรียนพิเศษ)"
                    value={sectionName}
                    onChange={(e) => setSectionName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-natural-border bg-white text-natural-text text-xs md:text-sm focus:outline-none focus:border-natural-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-natural-text-light">ชื่อ-สกุลครูที่ปรึกษา:</label>
                  <input
                    type="text"
                    required
                    placeholder="คุณครูสมหวัง รักษาดี"
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-natural-border bg-white text-natural-text text-xs md:text-sm focus:outline-none focus:border-natural-primary"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSection(false)}
                  className="px-4 py-2.5 text-xs font-bold rounded-xl border border-natural-border bg-white text-natural-text-light hover:bg-[#EDEBE4]/40 transition cursor-pointer"
                >
                  ย้อนกลับ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 text-xs font-bold rounded-xl bg-natural-primary hover:bg-[#4F7942] text-white transition cursor-pointer shadow-xs"
                >
                  บันทึกห้องเรียนใหม่
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid displays */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sections.map((sec) => {
          const registeredKids = activeStudents.filter((s) => s.section_id === sec.section_id);
          const lowAttendanceKids = registeredKids.filter((s) => s.attendance_rate < 85);

          return (
            <div
              key={sec.section_id}
              className="bg-natural-card rounded-2xl p-5 border border-natural-border shadow-xs flex flex-col justify-between gap-5 hover:border-natural-primary/30 hover:shadow-2xs transition"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="p-2.5 bg-[#EDEBE4]/40 rounded-xl text-natural-primary">
                    <BookOpen className="w-5.5 h-5.5" />
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(sec)}
                      className="p-1 px-1.5 text-natural-text-light hover:text-natural-primary hover:bg-natural-primary/10 rounded-lg transition cursor-pointer"
                      title="แก้ไขชั้นเรียน"
                    >
                      <Edit2 className="w-4.5 h-4.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteSection(sec.section_id, `${sec.grade_level} ${sec.section_name}`)}
                      className="p-1 px-1.5 text-natural-text-light hover:text-natural-absent hover:bg-natural-absent/15 rounded-lg transition cursor-pointer"
                      title="ลบชั้นเรียนออก"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="font-extrabold text-natural-text text-base">{sec.grade_level} {sec.section_name}</h4>
                  <p className="text-natural-text-light text-xs mt-0.5 block flex items-center gap-1 font-medium">
                    <User className="w-3 h-3" /> ครูประจำชั้น: {sec.teacher_name}
                  </p>
                </div>
              </div>

              {/* Counts metrics footer */}
              <div className="pt-3.5 border-t border-natural-border/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-natural-text-light font-semibold">
                  <Users className="w-4 h-4 text-natural-text-light/80" />
                  <span>นร. ทั้งหมด {registeredKids.length} คน</span>
                </div>

                {lowAttendanceKids.length > 0 ? (
                  <span className="text-2xs bg-natural-absent/15 text-natural-absent border border-natural-absent/25 font-bold px-3 py-1 rounded-full">
                    เฝ้าระวัง {lowAttendanceKids.length} คน
                  </span>
                ) : (
                  <span className="text-2xs bg-natural-present/15 text-natural-present border border-natural-present/25 font-bold px-3 py-1 rounded-full">
                    ปกติครบถ้วน
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Classroom Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmSection && (
          <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-natural-card rounded-2xl p-6 shadow-xl max-w-sm w-full relative space-y-4 border border-natural-border text-center"
            >
              <div className="w-12 h-12 bg-natural-absent/15 text-natural-absent rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6 animate-pulse" />
              </div>
              <h4 className="font-extrabold text-natural-text text-sm md:text-base">ยืนยันการลบระดับชั้นห้องเรียน</h4>
              <p className="text-natural-text-light text-xs leading-relaxed">
                คุณครูต้องการลบระดับห้องเรียน <strong className="text-natural-text">{deleteConfirmSection.name}</strong> ออกจากทะเบียนระบบหลักหรือไม่?
              </p>

              <div className="flex gap-2.5 mt-4 pt-1">
                <button
                  onClick={() => setDeleteConfirmSection(null)}
                  className="flex-1 py-2.5 text-xs font-bold rounded-xl border border-natural-border text-natural-text-light hover:bg-[#EDEBE4]/40 cursor-pointer transition"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => {
                    const { id, name } = deleteConfirmSection;
                    setDeleteConfirmSection(null);
                    try {
                      dbService.deleteSection(id);
                      onRefreshAllData();
                      onAddToast(`ลบห้องเรียน ${name} เรียบร้อยแล้ว`, 'success');
                    } catch (err: any) {
                      onAddToast(`ลบห้องเรียนไม่สำเร็จ: ${err.message}`, 'error');
                    }
                  }}
                  className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-natural-absent hover:bg-[#A83200] text-white cursor-pointer transition shadow-xs"
                >
                  ยืนยันการลบ
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Edit Classroom Modal */}
      <AnimatePresence>
        {editingSection && (
          <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-natural-card rounded-2xl p-6 shadow-xl max-w-md w-full relative space-y-4 border border-natural-border text-left font-sans animate-fade-in"
            >
              <div className="flex items-center justify-between pb-2 border-b border-natural-border">
                <h4 className="font-extrabold text-natural-text text-sm md:text-base">แก้ไขข้อมูลระดับห้องเรียน</h4>
                <button
                  type="button"
                  onClick={() => setEditingSection(null)}
                  className="text-natural-text-light hover:text-natural-text p-1.5 rounded-lg hover:bg-[#EDEBE4]/60 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEditSection} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-natural-text-light">ระดับชั้นปี:</label>
                  <select
                    value={editGradeLevel}
                    onChange={(e) => setEditGradeLevel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-natural-border bg-white text-natural-text text-xs md:text-sm focus:outline-none"
                  >
                    <option value="ประถมศึกษาปีที่ 1">ประถมศึกษาปีที่ 1</option>
                    <option value="ประถมศึกษาปีที่ 2">ประถมศึกษาปีที่ 2</option>
                    <option value="ประถมศึกษาปีที่ 3">ประถมศึกษาปีที่ 3</option>
                    <option value="ประถมศึกษาปีที่ 4">ประถมศึกษาปีที่ 4</option>
                    <option value="ประถมศึกษาปีที่ 5">ประถมศึกษาปีที่ 5</option>
                    <option value="ประถมศึกษาปีที่ 6">ประถมศึกษาปีที่ 6</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-natural-text-light">ชื่อห้องเรียน / บัญชีรายชื่อ:</label>
                  <input
                    type="text"
                    required
                    value={editSectionName}
                    onChange={(e) => setEditSectionName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-natural-border bg-white text-natural-text text-xs md:text-sm focus:outline-none focus:border-natural-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-natural-text-light">ชื่อ-สกุลครูที่ปรึกษาประจำชั้น:</label>
                  <input
                    type="text"
                    required
                    value={editTeacherName}
                    onChange={(e) => setEditTeacherName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-natural-border bg-white text-natural-text text-xs md:text-sm focus:outline-none focus:border-natural-primary"
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingSection(null)}
                    className="flex-1 py-2.5 text-xs font-bold rounded-xl border border-natural-border text-natural-text-light hover:bg-[#EDEBE4]/40 transition cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-natural-primary hover:bg-[#4F7942] text-white transition cursor-pointer shadow-xs"
                  >
                    บันทึกห้องเรียน
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
