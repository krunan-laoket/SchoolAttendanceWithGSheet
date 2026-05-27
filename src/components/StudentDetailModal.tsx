/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Student, AttendanceRecord, Section } from '../types';
import { dbService } from '../db';
import {
  X,
  User,
  GraduationCap,
  Calendar,
  Layers,
  Heart,
  Edit2,
  Trash2,
  Clock,
  ArrowLeft,
  Settings
} from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  student: Student;
  sections: Section[];
  attendanceRecords: AttendanceRecord[];
  onClose: () => void;
  onAddToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onRefreshAllData: () => void;
}

export default function StudentDetailModal({
  student,
  sections,
  attendanceRecords,
  onClose,
  onAddToast,
  onRefreshAllData,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editFirstName, setEditFirstName] = useState(student.first_name);
  const [editLastName, setEditLastName] = useState(student.last_name);
  const [editNotes, setEditNotes] = useState(student.notes || '');
  const [editSectionId, setEditSectionId] = useState(student.section_id);

  // Filter history of this student sorted by date
  const studentHistory = attendanceRecords
    .filter((r) => r.student_id === student.student_id)
    .sort((a, b) => b.date.localeCompare(a.date));

  const presentCount = studentHistory.filter((r) => r.status === 'Present').length;
  const lateCount = studentHistory.filter((r) => r.status === 'Late').length;
  const excusedCount = studentHistory.filter((r) => r.status === 'Excused').length;
  const absentCount = studentHistory.filter((r) => r.status === 'Absent').length;

  const sectionObj = sections.find((s) => s.section_id === student.section_id);

  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFirstName.trim() || !editLastName.trim()) {
      onAddToast('กรุณากรอกชื่อและนามสกุลนักเรียนให้สมบูรณ์', 'error');
      return;
    }

    try {
      const targetSection = sections.find(s => s.section_id === editSectionId);
      const updated: Student = {
        ...student,
        first_name: editFirstName.trim(),
        last_name: editLastName.trim(),
        notes: editNotes.trim(),
        section_id: editSectionId,
        grade_level: targetSection?.grade_level || student.grade_level,
      };

      dbService.updateStudent(updated);
      onRefreshAllData();
      setIsEditing(false);
      onAddToast('บันทึกความต้องการแก้ไขประวัติลงแผ่นงานเรียบร้อย!', 'success');
    } catch (err: any) {
      onAddToast(`อัปเดตเหลว: ${err.message}`, 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-[#1A1917]/55 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-natural-card rounded-2xl shadow-xl max-w-2xl w-full p-6 relative flex flex-col gap-6 border border-natural-border max-h-[90vh] overflow-y-auto font-sans"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-natural-text-light hover:text-natural-text cursor-pointer p-1.5 rounded-lg hover:bg-[#EDEBE4]/60 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Profile Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-4 border-b border-natural-border/75">
          <div className="w-14 h-14 rounded-2xl bg-natural-primary text-white flex items-center justify-center font-extrabold text-xl flex-shrink-0">
            {student.first_name[0]}
          </div>

          <div className="space-y-1">
            <h3 className="text-lg md:text-xl font-bold text-natural-text font-sans">
              ด.ช./ด.ญ. {student.first_name} {student.last_name}
            </h3>
            <p className="text-xs text-natural-text-light font-medium">
              ทะเบียนประจำตัว: <span className="font-mono bg-[#EDEBE4] text-natural-text px-1.5 py-0.5 rounded font-extrabold">{student.student_id}</span>
              {' • '} ปีชั้นเรียน: {sectionObj?.grade_level} ห้อง {sectionObj?.section_name}
            </p>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="sm:ml-auto px-4 py-2 text-xs font-bold text-natural-text hover:bg-[#EDEBE4] bg-[#EDEBE4]/50 rounded-xl border border-natural-border transition cursor-pointer self-start sm:self-auto flex items-center gap-1.5"
          >
            {isEditing ? <ArrowLeft className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
            <span>{isEditing ? 'ย้อนกลับ' : 'แก้ไขข้อมูล'}</span>
          </button>
        </div>

        {isEditing ? (
          /* Profile editor sheet */
          <form onSubmit={handleSaveChanges} className="space-y-4">
            <h4 className="font-bold text-natural-text text-sm">อัปเดตข้อมูลนักเรียนในแผ่นงาน (Google Sheets schema)</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-natural-text-light">ชื่อจริง:</label>
                <input
                  type="text"
                  required
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-natural-border bg-natural-bg focus:outline-none focus:border-natural-primary text-xs md:text-sm text-natural-text"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-natural-text-light">นามสกุล:</label>
                <input
                  type="text"
                  required
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-natural-border bg-natural-bg focus:outline-none focus:border-natural-primary text-xs md:text-sm text-natural-text"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-natural-text-light">ห้องเรียน (ระบุชั้นปี):</label>
                <select
                  value={editSectionId}
                  onChange={(e) => setEditSectionId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-natural-border bg-natural-bg text-xs md:text-sm focus:outline-none focus:border-natural-primary text-natural-text"
                >
                  {sections.map((sec) => (
                    <option key={sec.section_id} value={sec.section_id}>
                      {sec.grade_level} ({sec.section_name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#5A6B5D] font-extrabold">หมายเหตุสุขภาพ/ข้อสังเกตเพิ่มเติม:</label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="เช่น ประตูกระจกหนีบนิ้ว, โรคหัวใจ ฯลฯ"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-natural-border bg-natural-bg focus:outline-none focus:border-natural-primary text-xs md:text-sm text-natural-text"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-4">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 py-3 text-xs font-bold rounded-xl border border-natural-border text-natural-text-light hover:bg-[#EDEBE4]/40 transition cursor-pointer"
              >
                ละทิ้ง
              </button>
              <button
                type="submit"
                className="flex-1 py-3 text-xs font-bold rounded-xl bg-natural-primary hover:bg-natural-primary/95 text-white transition cursor-pointer"
              >
                เซฟการแก้ไข
              </button>
            </div>
          </form>
        ) : (
          /* Profile Details and History blocks */
          <div className="space-y-6">
            
            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3 bg-[#EDEBE4]/40 rounded-xl border border-natural-border text-center flex flex-col justify-center">
                <span className="text-natural-text-light text-3xs font-extrabold uppercase tracking-wider block">การเข้าเรียนรวม</span>
                <span className={`text-xl font-black block mt-0.5 ${
                  student.attendance_rate < 85 ? 'text-natural-absent' : 'text-natural-present'
                }`}>
                  {student.attendance_rate}%
                </span>
              </div>
              <div className="p-3 bg-natural-present/15 rounded-xl text-center border border-natural-present/20 flex flex-col justify-center">
                <span className="text-natural-present text-3xs font-extrabold uppercase tracking-wider block">มาเรียน (ปกติ)</span>
                <span className="text-xl font-black text-natural-present block mt-0.5">{presentCount} วัน</span>
              </div>
              <div className="p-3 bg-natural-late/15 rounded-xl text-center border border-natural-late/25 flex flex-col justify-center">
                <span className="text-natural-late text-3xs font-extrabold uppercase tracking-wider block">มาสาย (Late)</span>
                <span className="text-xl font-black text-natural-late block mt-0.5">{lateCount} วัน</span>
              </div>
              <div className="p-3 bg-[#4682B4]/15 rounded-xl text-center border border-[#4682B4]/25 flex flex-col justify-center">
                <span className="text-[#4682B4] text-3xs font-extrabold uppercase tracking-wider block">ลาเรียนป่วย/กิจ</span>
                <span className="text-xl font-black text-[#4682B4] block mt-0.5">{excusedCount} วัน</span>
              </div>
              <div className="p-3 bg-natural-absent/15 rounded-xl text-center border border-natural-absent/25 flex flex-col justify-center col-span-2 sm:col-span-1">
                <span className="text-natural-absent text-3xs font-extrabold uppercase tracking-wider block">ขาดเรียน</span>
                <span className="text-xl font-black text-natural-absent block mt-0.5">{absentCount} วัน</span>
              </div>
            </div>

            {/* Health / Personal Notes Alert banner */}
            {student.notes && (
              <div className="p-4 bg-[#EDEBE4]/50 rounded-xl border border-natural-border flex items-start gap-3">
                <Heart className="w-5 h-5 text-natural-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-natural-text text-xs md:text-sm">ข้อมูลโรคประจำตัวหรือสิ่งเฝ้ารงระวังพิเศษประจำตัว:</h4>
                  <p className="text-natural-text-light text-xs mt-0.5 leading-relaxed">{student.notes}</p>
                </div>
              </div>
            )}

            {/* Attendance list logs */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-natural-text text-sm flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-natural-primary" />
                ประวัติบันทึกการเช็กสถานะรายวัน (จาก Attendance Sheet)
              </h4>

              <div className="border border-natural-border rounded-2xl overflow-hidden bg-natural-bg/40 max-h-60 overflow-y-auto">
                {studentHistory.length === 0 ? (
                  <div className="py-12 text-center text-natural-text-light text-xs">
                    ยังไม่มีข้อมูลประวัติย้อนหลังของนักเรียนรายนี้
                  </div>
                ) : (
                  <div className="divide-y divide-natural-border/70">
                    {studentHistory.map((rec) => (
                      <div key={rec.attendance_id} className="p-3.5 flex items-center justify-between text-xs sm:text-sm hover:bg-[#EDEBE4]/20 transition">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-natural-text">
                            {rec.date.split('-').reverse().join('/')}
                          </span>
                          {rec.note && (
                            <span className="text-2xs bg-natural-sidebar text-natural-text-light border border-natural-border/70 px-2 py-0.5 rounded-full font-medium max-w-xs truncate" title={rec.note}>
                              เหตุผล: {rec.note}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-2xs text-natural-text-light/85 font-medium">บันทึกโดย: {rec.updated_by}</span>
                          <span className={`px-3 py-1 font-extrabold rounded-lg text-2xs leading-none uppercase border ${
                            rec.status === 'Present' ? 'bg-natural-present/15 text-natural-present border-natural-present/25' :
                            rec.status === 'Late' ? 'bg-natural-late/15 text-natural-late border-natural-late/25' :
                            rec.status === 'Excused' ? 'bg-[#4682B4]/15 text-[#4682B4] border-[#4682B4]/25' :
                            'bg-natural-absent/15 text-natural-absent border-natural-absent/25'
                          }`}>
                            {rec.status === 'Present' ? 'มาเรียน' :
                             rec.status === 'Late' ? 'มาสาย' :
                             rec.status === 'Excused' ? 'ลาหยุด' : 'ขาดเรียน'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </motion.div>
    </div>
  );
}
