/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Section, Student, AttendanceRecord, ReportRecord, Settings } from '../types';
import { FileSpreadsheet, Download, FileText, Printer, BarChart2, TrendingUp, Calendar, AlertCircle, Cloud } from 'lucide-react';
import { motion } from 'motion/react';
import { dbService } from '../db';

interface Props {
  sections: Section[];
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  settings: Settings;
  onAddToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function ReportView({
  sections,
  students,
  attendanceRecords,
  settings,
  onAddToast,
}: Props) {
  const [reportPeriod, setReportPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [syncingReports, setSyncingReports] = useState(false);

  const handleSyncReportsToGoogleSheets = async () => {
    const sheetsUrl = dbService.getSheetsUrl();
    if (!sheetsUrl) {
      onAddToast('⚠️ ไม่มีการเชื่อมต่อ Google Sheets กรุณากรอก URL และเชื่อมโยงที่แท็บ Google Sheets ก่อน', 'error');
      return;
    }

    setSyncingReports(true);
    onAddToast('🔄 กำลังปั้นคำนวณสถิติรายห้องและบันทึกประวัติลง Google Sheets...', 'info');

    try {
      const generatedDate = new Date().toISOString().split('T')[0];
      const periodStr = `สะสม (${reportPeriod === 'weekly' ? 'รายสัปดาห์' : 'รายเดือน'}) ณ ${generatedDate}`;

      const reportRecords: ReportRecord[] = printableReportsSum.map((sec) => {
        return {
          report_id: `REP-${sec.section_id}-${reportPeriod}-${generatedDate.replace(/-/g, '')}`,
          period: periodStr,
          section_id: sec.section_id,
          present_count: sec.present,
          absent_count: sec.absent,
          late_count: sec.late,
          excused_count: sec.excused,
          attendance_rate: sec.rate,
          generated_at: new Date().toISOString()
        };
      });

      const res = await dbService.syncReportsToSheets(reportRecords);
      if (res.success) {
        onAddToast(res.message, 'success');
      } else {
        onAddToast(res.message, 'error');
      }
    } catch (err: any) {
      console.error("Save reports error:", err);
      onAddToast(`บันทึกรายงานขัดข้อง: ${err.message}`, 'error');
    } finally {
      setSyncingReports(false);
    }
  };

  const activeStudents = students.filter((s) => s.active);

  // Group and sum daily stats for chart visualization
  const getDailyAggregation = () => {
    // Unique check dates in attendance records
    const dates = Array.from(new Set(attendanceRecords.map((r) => r.date))).sort();
    
    // Pick last 6 dates for optimal visual width
    const recentDates = dates.slice(-6);

    return recentDates.map((date) => {
      const dayRecs = attendanceRecords.filter((r) => r.date === date);
      const present = dayRecs.filter((r) => r.status === 'Present').length;
      const late = dayRecs.filter((r) => r.status === 'Late').length;
      const excused = dayRecs.filter((r) => r.status === 'Excused').length;
      const absent = dayRecs.filter((r) => r.status === 'Absent').length;
      const total = present + late + excused + absent;
      const rate = total > 0 ? Math.round(((present + late + excused) / total) * 100) : 100;

      return {
        date: date.split('-').reverse().slice(0, 2).join('/'),
        fullDate: date,
        Present: present,
        Late: late,
        Excused: excused,
        Absent: absent,
        Rate: rate,
      };
    });
  };

  const chartData = getDailyAggregation();

  // Printable section report summaries
  const printableReportsSum = sections.map((sec) => {
    const secStudents = activeStudents.filter((s) => s.section_id === sec.section_id);
    const secStuIds = secStudents.map((s) => s.student_id);
    const secRecords = attendanceRecords.filter((r) => secStuIds.includes(r.student_id));

    const totalDaysCount = secRecords.length;
    const presentCount = secRecords.filter((r) => r.status === 'Present').length;
    const lateCount = secRecords.filter((r) => r.status === 'Late').length;
    const excusedCount = secRecords.filter((r) => r.status === 'Excused').length;
    const absentCount = secRecords.filter((r) => r.status === 'Absent').length;

    const accumRate = totalDaysCount > 0 
      ? Math.round(((presentCount + lateCount + excusedCount) / totalDaysCount) * 1000) / 10
      : 100;

    return {
      ...sec,
      totalRegistered: secStudents.length,
      attendanceCheckCount: totalDaysCount,
      present: presentCount,
      late: lateCount,
      excused: excusedCount,
      absent: absentCount,
      rate: accumRate,
    };
  });

  const handlePrint = () => {
    window.print();
    onAddToast('เปิดตัวปรับตั้งค่าการพิมพ์รายงานสรุปประวัติเข้าเรียน', 'success');
  };

  const handleAggregateCSVReport = () => {
    const headers = ['Grade Level', 'Room', 'Class Teacher', 'Registered Count', 'Total Records Checked', 'Present', 'Late', 'Excused', 'Absent', 'Cumulative Attendance Rate'];
    const rows = printableReportsSum.map((r) => [
      r.grade_level,
      r.section_name,
      r.teacher_name,
      r.totalRegistered,
      r.attendanceCheckCount,
      r.present,
      r.late,
      r.excused,
      r.absent,
      `${r.rate}%`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.map(v => `"${v}"`).join(','))].join('\n');

    const downloadUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', downloadUri);
    link.setAttribute('download', `Attendance_Executive_Summary_${reportPeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onAddToast('สรุปสถิติออกเป็นรายงานผู้บริหารสำเร็จ (Spreadsheet ready)', 'success');
  };

  return (
    <div className="space-y-6 font-sans print:bg-white print:p-0">
      
      {/* Top Controls (Hidden when print) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h3 className="font-extrabold text-natural-text text-lg">รายงานวิเคราะห์สถิติและการเข้าเรียนอย่างยั่งยืน</h3>
          <p className="text-natural-text-light text-xs mt-0.5">พยากรณ์แนวโน้มการขาดและมาเรียนรายวันสัปดาห์ เพื่อประเมินสัดส่วนพัฒนาการเด็ก</p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          {/* Print trigger button */}
          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#EDEBE4]/40 hover:bg-[#EDEBE4]/70 text-natural-text-light rounded-xl text-xs font-bold border border-natural-border transition cursor-pointer"
          >
            <Printer className="w-4.5 h-4.5" />
            <span>พิมพ์รายงาน (PDF)</span>
          </button>
          
          {/* Sheet format dump */}
          <button
            onClick={handleAggregateCSVReport}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#4F7942] hover:bg-[#4F7942]/90 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
          >
            <Download className="w-4.5 h-4.5" />
            <span>ส่งออกรายงาน Sheets (CSV)</span>
          </button>

          {/* Cloud Sync Reports button */}
          <button
            onClick={handleSyncReportsToGoogleSheets}
            disabled={syncingReports}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs border ${
              syncingReports 
                ? 'bg-slate-300 border-slate-300 text-slate-500 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600'
            }`}
          >
            {syncingReports ? (
              <span className="w-3.5 h-3.5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <Cloud className="w-4.5 h-4.5" />
            )}
            <span>บันทึกส่งออกสถิติลง Google Sheets (คลาวด์)</span>
          </button>
        </div>
      </div>

      {/* Main Stats Graph Widget (Hidden in print) */}
      <div className="bg-natural-card rounded-2xl p-6 border border-natural-border shadow-xs print:hidden">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-natural-primary/10 rounded-lg text-natural-primary">
              <TrendingUp className="w-4.5 h-4.5" />
            </div>
            <div>
              <h4 className="font-extrabold text-natural-text text-sm md:text-base">แนวโน้มมาเรียนรอบสัปดาห์ (สถิติ 5 วันทำการล่าสุด)</h4>
              <p className="text-natural-text-light text-2xs">อัตราเฉลี่ยนับตามประวัติการบันทึกสถานะ</p>
            </div>
          </div>
          
          <div className="flex bg-[#EDEBE4]/45 p-1 rounded-lg text-xs gap-1">
            <button
              onClick={() => setReportPeriod('weekly')}
              className={`px-3 py-1.5 rounded-md font-bold transition cursor-pointer ${
                reportPeriod === 'weekly' ? 'bg-natural-card text-natural-text shadow-2xs font-extrabold' : 'text-natural-text-light hover:text-natural-text'
              }`}
            >
              รายวันในสัปดาห์
            </button>
            <button
              onClick={() => {
                setReportPeriod('monthly');
                onAddToast('เปลี่ยนกรอบมุมมองวิเคราะห์ข้อมูลลึกลงระดับรายเดือน', 'info');
              }}
              className={`px-3 py-1.5 rounded-md font-bold transition cursor-pointer ${
                reportPeriod === 'monthly' ? 'bg-natural-card text-natural-text shadow-2xs font-extrabold' : 'text-natural-text-light hover:text-natural-text'
              }`}
            >
              รายเดือนสะสม
            </button>
          </div>
        </div>

        {/* Custom pure Responsive bar graph charts using pure HTML SVG bar layouts for clean layout, highly stable on React 19 */}
        <div className="h-64 grid grid-cols-6 items-end gap-3 sm:gap-6 pt-6 border-b border-l border-natural-border/60 px-4">
          {chartData.length === 0 ? (
            <div className="col-span-6 text-center py-20 text-natural-text-light text-xs">
              ยังไม่มีข้อมูลรายงานสำหรับการแสดงแนวโน้มกรอบเวลานี้
            </div>
          ) : (
            chartData.map((day, i) => {
              const maxVal = Math.max(...chartData.map((d) => d.Present + d.Late + d.Excused + d.Absent), 1);
              const presentHeight = (day.Present / maxVal) * 100;
              const lateHeight = (day.Late / maxVal) * 100;
              const excusedHeight = (day.Excused / maxVal) * 100;
              const absentHeight = (day.Absent / maxVal) * 100;

              return (
                <div key={day.fullDate} className="flex flex-col items-center gap-2 group relative">
                  {/* Tooltip bar values */}
                  <div className="absolute -top-12 bg-[#1A1917] text-[#EDEBE4] rounded-lg p-2.5 text-3xs font-semibold opacity-0 group-hover:opacity-100 pointer-events-none transition duration-150 z-20 shadow-lg min-w-28 text-left space-y-0.5">
                    <p className="font-extrabold border-b border-[#3C3A36] pb-1 mb-1 text-2xs">วันที่: {day.fullDate.split('-').reverse().join('/')}</p>
                    <p className="text-emerald-400">มาเรียนปกติ: {day.Present} คน</p>
                    <p className="text-amber-400">มาสาย: {day.Late} คน</p>
                    <p className="text-sky-400">ลา: {day.Excused} คน</p>
                    <p className="text-rose-400">ขาดเรียน: {day.Absent} คน</p>
                    <p className="border-t border-[#3C3A36] pt-1 font-bold">อัตรา: {day.Rate}%</p>
                  </div>

                  {/* Stacked interactive bars */}
                  <div className="w-full h-44 flex gap-1 items-end relative rounded-t-lg overflow-hidden bg-natural-bg border border-transparent hover:border-natural-border/40">
                    <div className="bg-[#5A6B5D] hover:bg-[#5A6B5D]/90 transition-all rounded-t-xs" style={{ height: `${presentHeight}%`, flex: 1.5 }} title={`มาเรียน: ${day.Present}`}></div>
                    <div className="bg-[#D99330] hover:bg-[#D99330]/90 transition-all rounded-t-xs" style={{ height: `${lateHeight}%`, flex: 1 }} title={`สาย: ${day.Late}`}></div>
                    <div className="bg-[#C04000] hover:bg-[#C04000]/90 transition-all rounded-t-xs" style={{ height: `${absentHeight}%`, flex: 1 }} title={`ขาด: ${day.Absent}`}></div>
                  </div>

                  {/* X Axis labels */}
                  <span className="text-2xs font-bold text-natural-text-light">{day.date}</span>
                </div>
              );
            })
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 justify-center items-center mt-5 text-2xs md:text-xs text-natural-text">
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#5A6B5D]"></span> มาเรียนปกติ</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#D99330]"></span> มาสาย</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#4682B4]"></span> ลาป่วย/ลาหยุดสามัญ</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#C04000]"></span> ขาดเรียน</div>
        </div>
      </div>

      {/* Aggregate Student Classroom Sheets Data Display (Printers layout ready) */}
      <div className="bg-natural-card rounded-2xl p-6 border border-natural-border shadow-xs print:border-none print:shadow-none space-y-6">
        
        {/* Printable-Only header info block */}
        <div className="hidden print:flex flex-col gap-1 border-b border-natural-border/70 pb-5 mb-5 font-sans">
          <h1 className="text-xl font-bold text-natural-text">{settings.school_name}</h1>
          <h2 className="text-sm font-semibold text-natural-text-light">รายงานสรุปสาระสำคัญสถิติการเช็กชื่อเข้าเรียนสะสม ปีการศึกษา: {settings.academic_year}</h2>
          <p className="text-xs text-natural-text-light/80 mt-1">คัดแจกข้อมูลจากใบ Google Sheets ณ วันที่ {new Date().toLocaleDateString('th-TH')}</p>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-extrabold text-natural-text text-sm md:text-base">ตารางประเมินสรุปสถิติประจำทุกห้องเรียน</h4>
            <p className="text-natural-text-light text-2xs print:hidden">นับจำนวนสัดส่วนผู้เรียนเฉลี่ยรายบุคคล</p>
          </div>
          <div className="hidden print:block text-right">
            <span className="text-xs font-mono text-natural-text-light">Executive Report</span>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-natural-border print:text-xs">
          <table className="min-w-full divide-y divide-natural-border text-left">
            <thead className="bg-[#EDEBE4]/45 text-natural-text-light text-xs font-semibold">
              <tr>
                <th className="px-5 py-3">ระดับชั้นเรียน/ห้อง</th>
                <th className="px-5 py-3 text-center">ครูที่ปรึกษาประจำวิชา</th>
                <th className="px-5 py-3 text-center">นร.ในบังคับ</th>
                <th className="px-5 py-3 text-center">สถิติสะสม (มาปกติ / สาย / ขาด / ลา)</th>
                <th className="px-5 py-3 text-right">อัตราความสม่ำเสมอสะสม</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-natural-border/60 text-natural-text-light text-xs md:text-sm">
              {printableReportsSum.map((sec) => (
                <tr key={sec.section_id} className="hover:bg-natural-sidebar/20">
                  <td className="px-5 py-4 font-bold text-natural-text">
                    {sec.grade_level} {sec.section_name}
                  </td>
                  <td className="px-5 py-4 text-center">{sec.teacher_name}</td>
                  <td className="px-5 py-4 text-center text-natural-text font-bold">{sec.totalRegistered} คน</td>
                  <td className="px-5 py-4 text-center">
                    <div className="flex gap-2 justify-center font-semibold text-xs leading-none">
                      <span className="text-natural-present bg-natural-present/15 px-2.5 py-1 rounded border border-natural-present/20">ม: {sec.present}</span>
                      <span className="text-[#4682B4] bg-[#4682B4]/15 px-2.5 py-1 rounded border border-[#4682B4]/20">ล: {sec.excused}</span>
                      <span className="text-natural-late bg-natural-late/15 px-2.5 py-1 rounded border border-natural-late/25">ส: {sec.late}</span>
                      <span className="text-natural-absent bg-natural-absent/15 px-2.5 py-1 rounded border border-natural-absent/25">ข: {sec.absent}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right font-extrabold text-natural-text">
                    <span className={`${
                      sec.rate >= 90 ? 'text-natural-present' : sec.rate >= 80 ? 'text-natural-late' : 'text-natural-absent'
                    }`}>{sec.rate}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Printable Signature footer */}
        <div className="hidden print:grid grid-cols-2 pt-28 gap-10 text-center font-sans">
          <div className="space-y-12">
            <p className="text-xs text-natural-text-light">ลงชื่อครูประจำชั้นที่ปรึกษา</p>
            <div>
              <div className="w-48 border-b border-natural-border mx-auto"></div>
              <p className="text-xs font-semibold text-natural-text mt-2">(............................................................)</p>
              <p className="text-xs text-natural-text-light mt-0.5">ครูผู้เช็กยอดและบันทึกประวัติ</p>
            </div>
          </div>

          <div className="space-y-12">
            <p className="text-xs text-natural-text-light">ลงชื่อผู้เห็นชอบเห็นชอบการสรุป</p>
            <div>
              <div className="w-48 border-b border-natural-border mx-auto"></div>
              <p className="text-xs font-semibold text-natural-text mt-2">(............................................................)</p>
              <p className="text-xs text-[#5F7C5F] mt-0.5 font-semibold">ผู้อำนวยการโรงเรียนประถมศึกษา</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
