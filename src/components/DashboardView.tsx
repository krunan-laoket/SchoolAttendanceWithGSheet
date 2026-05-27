/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Section, Student, AttendanceRecord, Settings } from '../types';
import { Users, UserCheck, UserX, Clock, AlertTriangle, ChevronRight, GraduationCap } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  sections: Section[];
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  settings: Settings;
  selectedDate: string;
  onSelectSection: (sectionId: string) => void;
  onSelectStudent: (student: Student) => void;
}

export default function DashboardView({
  sections,
  students,
  attendanceRecords,
  settings,
  selectedDate,
  onSelectSection,
  onSelectStudent,
}: Props) {
  // 1. Current Date Attendance statistics
  const activeStudents = students.filter((s) => s.active);
  const totalStudentsCount = activeStudents.length;

  const todayRecords = attendanceRecords.filter((r) => r.date === selectedDate);
  const checkedCount = todayRecords.length;

  const presentCount = todayRecords.filter((r) => r.status === 'Present').length;
  const absentCount = todayRecords.filter((r) => r.status === 'Absent').length;
  const lateCount = todayRecords.filter((r) => r.status === 'Late').length;
  const excusedCount = todayRecords.filter((r) => r.status === 'Excused').length;

  const uncheckedCount = totalStudentsCount - checkedCount;

  // Calculate rate for today
  const schoolAttendanceRateToday =
    checkedCount > 0
      ? Math.round(((presentCount + lateCount + excusedCount) / checkedCount) * 1000) / 10
      : 100;

  // 2. Identify students with critical low attendance (below threshold, e.g. 85%)
  const warningList = activeStudents
    .filter((s) => s.attendance_rate < settings.low_attendance_threshold)
    .sort((a, b) => a.attendance_rate - b.attendance_rate);

  // 3. Clean statistics map for sections
  const sectionsSummary = sections.map((sec) => {
    const secStudents = activeStudents.filter((s) => s.section_id === sec.section_id);
    const secStudentIds = secStudents.map((s) => s.student_id);
    const secRecords = todayRecords.filter((r) => secStudentIds.includes(r.student_id));

    const secPresent = secRecords.filter((r) => r.status === 'Present').length;
    const secLate = secRecords.filter((r) => r.status === 'Late').length;
    const secExcused = secRecords.filter((r) => r.status === 'Excused').length;
    const secAbsent = secRecords.filter((r) => r.status === 'Absent').length;

    const secChecked = secRecords.length;
    const secRate = secChecked > 0 ? Math.round(((secPresent + secLate + secExcused) / secChecked) * 100) : 100;

    return {
      ...sec,
      checkedCount: secChecked,
      totalCount: secStudents.length,
      present: secPresent,
      late: secLate,
      excused: secExcused,
      absent: secAbsent,
      rate: secRate,
    };
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Overview stats cards with interactive entry animations */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Present Card */}
        <motion.div
          id="stat-present-card"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-natural-card p-5 rounded-2xl border border-natural-present/20 shadow-xs flex items-center gap-4 hover:border-natural-present/40 transition"
        >
          <div className="p-3 bg-natural-present/10 rounded-xl text-natural-present">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-natural-text-light text-xs font-semibold block uppercase tracking-wider">มาเรียน (Present)</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-extrabold text-natural-text">{presentCount}</span>
              <span className="text-natural-text-light text-xs font-medium">จาก {totalStudentsCount} คน</span>
            </div>
          </div>
        </motion.div>

        {/* Absent Card */}
        <motion.div
          id="stat-absent-card"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="bg-natural-card p-5 rounded-2xl border border-natural-absent/20 shadow-xs flex items-center gap-4 hover:border-natural-absent/40 transition"
        >
          <div className="p-3 bg-natural-absent/10 rounded-xl text-natural-absent">
            <UserX className="w-6 h-6" />
          </div>
          <div>
            <span className="text-natural-text-light text-xs font-semibold block uppercase tracking-wider">ขาดเรียน (Absent)</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-extrabold text-natural-text">{absentCount}</span>
              <span className="text-natural-text-light text-xs font-medium">คน</span>
            </div>
          </div>
        </motion.div>

        {/* Late Card */}
        <motion.div
          id="stat-late-card"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-natural-card p-5 rounded-2xl border border-natural-late/20 shadow-xs flex items-center gap-4 hover:border-natural-late/40 transition"
        >
          <div className="p-3 bg-natural-late/10 rounded-xl text-natural-late">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-natural-text-light text-xs font-semibold block uppercase tracking-wider">มาสาย (Late)</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-extrabold text-natural-text">{lateCount}</span>
              <span className="text-natural-text-light text-xs font-medium">คน</span>
            </div>
          </div>
        </motion.div>

        {/* Excused Card */}
        <motion.div
          id="stat-excused-card"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="bg-natural-card p-5 rounded-2xl border border-natural-excused/20 shadow-xs flex items-center gap-4 hover:border-natural-excused/40 transition"
        >
          <div className="p-3 bg-natural-excused/10 rounded-xl text-natural-excused">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-natural-text-light text-xs font-semibold block uppercase tracking-wider">ลากิจ/ป่วย (Excused)</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-extrabold text-natural-text">{excusedCount}</span>
              <span className="text-natural-text-light text-xs font-medium">คน</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Stats Split (Room Headcounts & High Risk Warning List) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Sections Breakdown Status */}
        <div className="xl:col-span-2 bg-natural-card rounded-2xl shadow-xs border border-natural-border p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-natural-text text-base">อัตราการเข้าเช็กชื่อจำแนกตามห้องเรียน</h3>
                <p className="text-natural-text-light text-xs mt-0.5">สรุปสถิติจำนวนเด็กที่ครูเช็กสถานะแล้วในระบบประจำวันนี้</p>
              </div>
              <div className="text-right">
                <span className="text-2xs bg-natural-sidebar text-natural-text font-bold px-2.5 py-1 rounded-full uppercase">
                  {selectedDate.split('-').reverse().join('/')}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-natural-border">
              <table className="min-w-full divide-y divide-natural-border text-left">
                <thead className="bg-[#EDEBE4]/60 text-natural-text-light text-xs font-semibold whitespace-nowrap">
                  <tr>
                    <th className="px-5 py-3 whitespace-nowrap">ห้องเรียน</th>
                    <th className="px-5 py-3 text-center whitespace-nowrap">ความคืบหน้า (เช็กชื่อ)</th>
                    <th className="px-5 py-3 text-center whitespace-nowrap">สถิติรายห้อง (มา/ลา/สาย/ขาด)</th>
                    <th className="px-5 py-3 text-right whitespace-nowrap">สัดส่วนเข้าเรียนวันนี้</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-natural-border text-natural-text text-xs md:text-sm">
                  {sectionsSummary.map((sec) => (
                    <tr
                      key={sec.section_id}
                      className="hover:bg-[#EDEBE4]/20 transition cursor-pointer"
                      onClick={() => onSelectSection(sec.section_id)}
                    >
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-natural-text block">{sec.grade_level} {sec.section_name}</span>
                        <span className="text-natural-text-light text-xs">{sec.teacher_name}</span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full font-bold text-xs bg-natural-bg text-natural-text">
                          <span>{sec.checkedCount} / {sec.totalCount} คน</span>
                          <span className={`w-2 h-2 rounded-full ${
                            sec.checkedCount === sec.totalCount ? 'bg-natural-present' : 'bg-natural-late'
                          }`}></span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex gap-2 justify-center font-semibold text-xs">
                          <span className="text-natural-present">ม: {sec.present}</span>
                          <span className="text-natural-excused">ล: {sec.excused}</span>
                          <span className="text-natural-late">ส: {sec.late}</span>
                          <span className="text-natural-absent">ข: {sec.absent}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right font-extrabold">
                        <span className={`${
                          sec.rate >= 90 ? 'text-natural-present' : sec.rate >= 80 ? 'text-natural-late' : 'text-natural-absent'
                        }`}>{sec.rate}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-natural-border flex flex-col md:flex-row justify-between items-center text-xs text-natural-text-light gap-3">
            <span>💡 กดแถวของชั้นเรียนเพื่อเปิดแผงบันทึกเช็กชื่อทันที</span>
            <div className="flex gap-4">
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-natural-present"></span> ครบถ้วน</div>
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-natural-late"></span> ยังค้างอยู่</div>
            </div>
          </div>
        </div>

        {/* Low Attendance/Critical Risk Watch-list */}
        <div className="bg-natural-card rounded-2xl shadow-xs border border-natural-border p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-natural-absent/10 rounded-lg text-natural-absent">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-natural-text text-sm">เฝ้าระวัง: อัตรามาเรียนต่ำกว่า {settings.low_attendance_threshold}%</h3>
            </div>
            
            <p className="text-natural-text-light text-xs mb-4">
              นักเรียนที่มีอัตราการเข้าเรียนสะสมต่ำกว่าเกณฑ์ความปลอดภัยของโรงเรียนสะสม เพื่อจัดทำรายงานส่งผู้ปกครองชี้แจง
            </p>

            <div className="space-y-3 max-h-76 overflow-auto pr-1">
              {warningList.length === 0 ? (
                <div className="py-12 text-center text-natural-text-light border border-dashed border-natural-border rounded-xl bg-[#F7F6F2]/55 flex flex-col items-center gap-2">
                  <GraduationCap className="w-8 h-8 text-natural-text-light/50" />
                  <span className="text-xs">ไม่มีนักเรียนต่ำกว่าเกณฑ์วิกฤตความปลอดภัย</span>
                </div>
              ) : (
                warningList.map((stu) => (
                  <div
                    key={stu.student_id}
                    onClick={() => onSelectStudent(stu)}
                    className="p-3 border border-natural-border/40 rounded-xl hover:border-natural-border bg-natural-bg hover:bg-natural-sidebar/45 transition flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <span className="font-bold text-natural-text block text-xs">
                        {stu.first_name} {stu.last_name}
                      </span>
                      <span className="text-natural-text-light text-2xs block mt-0.5 font-mono">
                        ID: {stu.student_id} | {stu.grade_level} room: {sections.find(s => s.section_id === stu.section_id)?.section_name}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-extrabold text-natural-absent block bg-natural-absent/10 px-2 py-0.5 rounded-md">
                        {stu.attendance_rate}%
                      </span>
                      <span className="text-natural-text-light text-3xs block mt-0.5 font-medium hover:underline flex items-center justify-end">
                        ดูประวัติ <ChevronRight className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-natural-border text-natural-text-light text-xs flex justify-between items-center">
            <span>ครูประจำชั้นควรติดต่อผู้ดูแลหากเด็กขาดลารวมเกิน 15 วัน</span>
          </div>

        </div>

      </div>

    </div>
  );
}
