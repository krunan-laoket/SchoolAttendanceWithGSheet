/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Database, 
  FileSpreadsheet, 
  Copy, 
  Check, 
  Terminal, 
  PlayCircle, 
  HelpCircle, 
  RefreshCw, 
  Link2, 
  Wifi, 
  WifiOff, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { dbService } from '../db';
import { motion } from 'motion/react';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';

interface Props {
  onAddToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onRefreshAllData: () => void;
  user: User | null;
}

export default function SheetsIntegrationPanel({ onAddToast, onRefreshAllData, user }: Props) {
  const [activeTab, setActiveTab] = useState<'info' | 'script' | 'logs'>('info');
  const [copied, setCopied] = useState(false);
  const [sheetsUrl, setSheetsUrl] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [syncErrorMessage, setSyncErrorMessage] = useState('');

  // Loaded saved URL on mount
  useEffect(() => {
    setSheetsUrl(dbService.getSheetsUrl());
  }, []);

  const logs = dbService.getDBLogs();

  const handleCopy = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    setCopied(true);
    onAddToast('คัดลอกโค้ด Google Apps Script เรียบร้อย!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveUrl = async () => {
    const trimmed = sheetsUrl.trim();
    if (trimmed && !trimmed.startsWith('https://script.google.com/')) {
      onAddToast('URL ไม่ถูกต้อง (เว็บแอปสคริปต์ Google ต้องขึ้นต้นด้วย https://script.google.com/)', 'error');
      return;
    }

    if (!trimmed) {
      // Clear all synced data and reset back to beautiful default mockup local sandbox dataset
      dbService.resetDB();
      onAddToast('ล้างการเชื่อมเชื่อมต่อนอกเรียบร้อยแล้ว กู้คืนฐานข้อมูลและสลับสู่โหมด Sandbox ท้องถิ่นสำเร็จ', 'success');
    } else {
      onAddToast('บันทึกที่อยู่ตัวเชื่อมแผ่นงานเรียบร้อย!', 'success');
    }

    dbService.setSheetsUrl(trimmed);
    
    if (user) {
      try {
        const docRef = doc(db, 'users', user.uid);
        await setDoc(docRef, { sheetsUrl: trimmed });
        if (trimmed) {
          onAddToast('☁️ สำรองข้อมูลตัวเชื่อมนี้ลง Firestore คลาวด์เสร็จสมบูรณ์', 'success');
        }
      } catch (err: any) {
        console.error("Firestore setDoc error:", err);
      }
    }
    
    onRefreshAllData();
  };

  const handleSyncFromSheets = async () => {
    const trimmed = sheetsUrl.trim();
    if (!trimmed) {
      onAddToast('กรุณากรอกและบันทึก URL เว็บแอปของ Apps Script ก่อนกดซิงค์', 'error');
      return;
    }

    setIsSyncing(true);
    setSyncStatus('idle');
    onAddToast('กำลังดึงข้อมูลและเชื่อมโยงกับ Google Sheets ของคุณ...', 'info');

    try {
      // Save the url first
      dbService.setSheetsUrl(trimmed);
      if (user) {
        try {
          const docRef = doc(db, 'users', user.uid);
          await setDoc(docRef, { sheetsUrl: trimmed });
        } catch (err: any) {
          console.error("Firestore setDoc on sync error:", err);
        }
      }
      
      const res = await dbService.syncFromSheets(trimmed);
      if (res.success) {
        setSyncStatus('success');
        onAddToast(res.message, 'success');
        onRefreshAllData();
      } else {
        setSyncStatus('error');
        setSyncErrorMessage(res.message);
        onAddToast(`ซิงค์ข้อมูลล้มเหลว: ${res.message}`, 'error');
      }
    } catch (err: any) {
      setSyncStatus('error');
      setSyncErrorMessage(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่าย');
      onAddToast(`ซิงค์ไม่สำเร็จ: ${err.message}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const isLive = !!sheetsUrl.trim() && sheetsUrl.trim().startsWith('https://script.google.com/');

  return (
    <div className="space-y-6">
      {/* Real-time Google Sheets URL Configuration */}
      <div className="bg-natural-card rounded-2xl border border-natural-border p-6 font-sans shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-natural-border pb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${
              isLive ? 'bg-natural-present/10 text-natural-present animate-pulse' : 'bg-natural-text-light/10 text-natural-text-light'
            }`}>
              {isLive ? <Wifi className="w-5.5 h-http-5.5" /> : <WifiOff className="w-5.5 h-5.5" />}
            </div>
            <div>
              <h3 className="font-bold text-natural-text text-base">การเชื่อมต่อแผ่นงานสด (Google Sheets Live Integration)</h3>
              <p className="text-xs text-natural-text-light">ประสานข้อมูลเข้า-ออกกับใบงานครูบน Google Sheets แบบสองทิศทาง</p>
            </div>
          </div>

          <div className="self-start sm:self-auto">
            {isLive ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-2xs font-extrabold bg-[#4F7942]/10 text-[#4F7942] rounded-full border border-[#4F7942]/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                โหมดเว็บบัฟเฟอร์ (LIVE SPREADSHEET MODE)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-2xs font-bold bg-[#E6A15C]/10 text-[#C17028] rounded-full border border-[#E6A15C]/20">
                โหมดจำลอง (LOCAL SANDBOX MODE)
              </span>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-bold text-natural-text flex items-center gap-1.5">
            <Link2 className="w-4 h-4 text-natural-primary" />
            ที่อยู่เว็บแอปที่ได้จากการเผยแพร่สคริปต์ (Google Apps Script Web App URL):
          </label>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={sheetsUrl}
              onChange={(e) => setSheetsUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-natural-border bg-natural-bg font-mono text-xs text-natural-text focus:outline-none focus:border-natural-primary"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveUrl}
                className="px-4 py-2.5 text-xs font-bold bg-[#3C3A36] hover:bg-[#3C3A36]/90 text-white rounded-xl transition cursor-pointer flex-shrink-0"
              >
                บันทึก URL
              </button>
              <button
                type="button"
                disabled={isSyncing || !sheetsUrl}
                onClick={handleSyncFromSheets}
                className="px-4 py-2.5 text-xs font-bold bg-natural-primary hover:bg-natural-primary/95 text-white rounded-xl transition cursor-pointer flex-shrink-0 flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>ประสานข้อมูลสด (Sync)</span>
              </button>
            </div>
          </div>
          
          <p className="text-3xs text-natural-text-light leading-normal">
            * ระบบจะทำการเขียนและอ่านข้อมูลไปยัง URL แผ่นงานนี้โดยตรงเมื่อผู้ใช้ทำเครื่องหมายหรือเช็กชื่อนักเรียน (Last-Write-Wins Sync Model) 
            และหากไม่พบ สัญญาณเครือข่าย ระบบจะยังบันทึกประวัติล่วงหน้าลง Cache เพื่ออัปโหลดซ้ำภายหลังได้
          </p>

          {/* Sync Result Indicator */}
          {syncStatus === 'success' && (
            <div className="p-3 bg-natural-present/10 rounded-xl border border-natural-present/25 flex items-center gap-2 text-xs text-[#2E5A36] font-medium">
              <CheckCircle2 className="w-4 h-4 text-natural-present flex-shrink-0" />
              <span>ซิงค์นำเข้าชั้นเรียน แผนภูมิ สถิติ และรายชื่อนักเรียนจาก Google Sheets เข้าสู่ Cache ในเครื่องครูสำเร็จสมบูรณ์!</span>
            </div>
          )}

          {syncStatus === 'error' && (
            <div className="p-3 bg-natural-absent/10 rounded-xl border border-natural-absent/25 flex items-start gap-2 text-xs text-natural-absent font-medium">
              <AlertCircle className="w-4 h-4 text-natural-absent flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">เชื่อมต่อไม่สำเร็จ:</span>{' '}
                <span className="font-mono text-3xs block mt-0.5 leading-normal bg-white/70 p-2 rounded border border-natural-absent/15">{syncErrorMessage}</span>
                <span className="block mt-1.5 text-3xs text-[#8A302E]">
                  คำแนะนำ: ตรวจสอบขั้นตอนการอัปโหลด Apps Script, มั่นใจว่าสิทธิ์การตั้งค่า Deployment ของคุณระบุสิทธิ์ผู้เข้าใช้แอปเป็น <strong>"ทุกคน" (Anyone)</strong> และกดอัปเดตเวอร์ชันใหม่ในเมนูการทำให้ใช้งานได้
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-natural-card rounded-2xl border border-natural-border p-6 font-sans shadow-xs">
        <div className="flex items-center justify-between border-b border-natural-border pb-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-natural-primary/10 rounded-xl text-natural-primary">
              <FileSpreadsheet className="w-5.5 h-5.5" />
            </div>
            <div>
              <h3 className="font-semibold text-natural-text text-base">โครงสร้างแผ่นงานและสคริปต์ (Sheet Specs & Apps Script Setup)</h3>
              <p className="text-xs text-natural-text-light">คำแนะนำในการเปิดและเขียนรหัสใบประเมินผลผ่านหลังบ้าน</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-natural-border mb-5 gap-1">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition ${
              activeTab === 'info'
                ? 'border-natural-primary text-natural-primary bg-natural-primary/10 font-bold'
                : 'border-transparent text-natural-text-light hover:text-natural-text hover:bg-natural-sidebar/55'
            }`}
          >
            <HelpCircle className="inline w-4 h-4 mr-1.5" />
            1. โครงสร้างตาราง (Required Sheets)
          </button>
          <button
            onClick={() => setActiveTab('script')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition ${
              activeTab === 'script'
                ? 'border-natural-primary text-natural-primary bg-natural-primary/10 font-bold'
                : 'border-transparent text-natural-text-light hover:text-natural-text hover:bg-natural-sidebar/55'
            }`}
          >
            <PlayCircle className="inline w-4 h-4 mr-1.5" />
            2. รหัส Google Apps Script
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition ${
              activeTab === 'logs'
                ? 'border-natural-primary text-natural-primary bg-natural-primary/10 font-bold'
                : 'border-transparent text-natural-text-light hover:text-natural-text hover:bg-natural-sidebar/55'
            }`}
          >
            <Terminal className="inline w-4 h-4 mr-1.5" />
            3. บันทึกประวัติการเรียก API (Audit Logs)
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === 'info' && (
          <div className="space-y-4 text-xs md:text-sm text-natural-text leading-relaxed">
            <div className="p-4 bg-natural-bg rounded-xl space-y-2 border border-natural-border">
              <h4 className="font-bold text-natural-text flex items-center gap-1.5 text-sm">
                <Database className="w-4 h-4 text-natural-primary" />
                การรองรับข้อมูลแบบความปลอดภัยสูงสุด (Last-Write-Wins Model)
              </h4>
              <p>
                ระบบนี้ออกแบบสถาปัตยกรรมข้อมูลให้ <strong>แยกส่วนของ UI และ API Layer อย่างชัดเจน</strong> ข้อมูลจะถูกเขียนลงตารางจำลองของทั้ง 5 แฟ้ม ได้แก่ 
                <span className="font-semibold text-natural-text"> Sections, Students, Attendance, Reports, Settings </span> 
                แบบเรียลไทม์ พร้อมตรวจสอบความถูกต้องของข้อมูล (Validation) และรักษาบันทึกข้อมูลย้อนหลัง (Audit Log) เสมอ
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-natural-text text-sm">ขั้นตอนเปลี่ยนระบบจากเครื่องครูไปใช้ Google Sheets เพื่อใช้งานจริง:</h4>
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  สร้าง Google Sheets ใหม่เพิ่มแผ่นงาน (Sheets) 5 หน้า ตามลำดับโดยใช้หัวคอลัมน์สะกดตรงตามนี้ในแถวบนสุด (Row 1):
                  <ul className="list-disc pl-5 mt-1 space-y-1 text-natural-text-light">
                    <li><strong className="text-natural-text">Sections:</strong> section_id, grade_level, section_name, teacher_name, student_count, active</li>
                    <li><strong className="text-natural-text">Students:</strong> student_id, first_name, last_name, section_id, grade_level, status_today, attendance_rate, last_updated, notes, active</li>
                    <li><strong className="text-natural-text">Attendance:</strong> attendance_id, date, student_id, section_id, status, updated_by, updated_at, note</li>
                    <li><strong className="text-natural-text">Reports:</strong> report_id, period, section_id, present_count, absent_count, late_count, excused_count, attendance_rate, generated_at</li>
                    <li><strong className="text-natural-text">Settings:</strong> school_name, academic_year, default_status, low_attendance_threshold</li>
                  </ul>
                </li>
                <li>ไปที่เมนู <strong className="text-natural-text">ส่วนขยาย (Extensions) &gt; Apps Script</strong></li>
                <li>ลบโค้ดเดิมในนั้นออกทั้งหมด แล้วคัดลอกโค้ดจากแผงหน้าถัดไป (<strong className="text-natural-primary">สคริปต์ Apps Script</strong>) ไปวางลงในไฟล์ <code className="bg-[#ECE9E0]/55 px-1 py-0.5 rounded text-[#C04000] font-mono text-xs">รหัส.gs</code> หรือ <code className="bg-[#ECE9E0]/55 px-1 py-0.5 rounded text-[#C04000] font-mono text-xs">Code.gs</code></li>
                <li>กดเซฟ และทำการ <strong className="text-natural-text">การทำให้ใช้งานได้ (Deploy) &gt; การทำให้ใช้งานได้ใหม่ (New deployment)</strong> เลือกประเภทเป็น <strong className="text-natural-text">เว็บแอป (Web App)</strong></li>
                <li>
                  กำหนดการกำหนดค่าและสิทธิ์เป็น:
                  <ul className="list-disc pl-5 mt-1 space-y-0.5 text-natural-text-light">
                    <li>Execute as (เรียกใช้เป็น): <strong>Me (ฉัน - เมลของคุณครู)</strong></li>
                    <li>Who has access (ผู้มีสิทธิ์เข้าถึง): <strong>Anyone (ทุกคน)</strong> <em>*สำคัญมาก! เพื่อให้หน้าเว็บบอร์ดส่งและรับค่าได้โดยตรง</em></li>
                  </ul>
                </li>
                <li>
                  นำที่อยู่เว็บแอป (Web App URL) ที่สร้างเสร็จ มาวางในช่องด้านบนแล้วกด "ซิงค์" เพื่อเริ่มการดึงข้อมูลและเชื่อมต่องานสดโดยทันที!
                </li>
              </ol>
            </div>
          </div>
        )}

        {activeTab === 'script' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center bg-[#3C3A36]/90 text-white px-4 py-2 rounded-t-xl">
              <span className="text-xs font-mono">GoogleAppsScriptAPI.gs</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs bg-[#5A6B5D] hover:bg-[#5A6B5D]/90 text-white py-1 px-2.5 rounded transition cursor-pointer font-bold"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'คัดลอกแล้ว!' : 'คัดลอกโค้ด'}</span>
              </button>
            </div>
            <div className="relative">
              <pre className="p-4 bg-[#1A1917] text-[#EDEBE4] font-mono text-xs overflow-auto max-h-80 rounded-b-xl border border-[#3C3A36] leading-relaxed scrollbar-thin">
                {APPS_SCRIPT_CODE}
              </pre>
            </div>
            <p className="text-xs text-natural-late font-semibold">
              ⚠️ คำแนะนำ: ปลดล็อกฟังก์ชันบันทึกกลับลงในแผ่นงานด้วยสคริปต์นี้ เพื่อรองรับการทำงานและการประสานสถิติทั่วทิศทางแบบเรียลไทม์
            </p>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-natural-text uppercase tracking-wider">แผงบันทึกรายการกิจกรรมและสถิติเชื่อมโยง (Audit Logs)</h4>
              <span className="text-2xs bg-natural-primary/10 text-natural-primary px-3 py-1 rounded-full font-bold border border-natural-primary/20">LIVE API LISTENER</span>
            </div>
            <div className="bg-[#EDEBE4]/40 border border-natural-border rounded-xl p-3 max-h-[300px] overflow-auto divide-y divide-[#ECE9E0] font-mono text-2xs md:text-xs">
              {logs.length === 0 ? (
                <div className="py-8 text-center text-natural-text-light">
                  ยังไม่มีการเรียกดำเนินการ หรือไม่มีประวัติกิจกรรมล่าสุด
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="py-2.5 first:pt-0 last:pb-0 flex items-start gap-2.5 hover:bg-natural-sidebar/30 transition">
                    <div className={`mt-0.5 px-2 py-0.5 rounded text-2xs font-extrabold ${
                      log.action === 'CREATE' ? 'bg-natural-present/15 text-natural-present border border-natural-present/20' :
                      log.action === 'DELETE' ? 'bg-natural-absent/15 text-natural-absent border border-natural-absent/20' :
                      log.action === 'BULK_UPDATE' ? 'bg-[#4682B4]/15 text-[#4682B4] border border-[#4682B4]/20' :
                      log.action === 'SYNC' ? 'bg-[#2E5A36]/15 text-[#2E5A36] border border-[#2E5A36]/20 font-black' :
                      'bg-natural-sidebar text-natural-text-light border border-natural-border-dark'
                    }`}>
                      {log.action}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-bold text-natural-text">Sheet: {log.targetTable}</span>
                        <span className="text-natural-text-light text-2xs">
                          {new Date(log.timestamp).toLocaleTimeString('th-TH')}
                        </span>
                      </div>
                      <p className="text-natural-text-light font-sans leading-relaxed text-xs">{log.details}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Complete, production-ready, beautiful Apps Script code
const APPS_SCRIPT_CODE = `/**
 * GOOGLE APPS SCRIPT API ENGINE FOR ATTENDANCE MANAGEMENT SYSTEM
 * วางโค้ดนี้ใน Apps Script และเผยแพร่เป็นเว็บแอปเพื่อทำหน้าที่เป็น REST API ให้กับระบบเช็กชื่อ
 */

const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

function doGet(e) {
  try {
    const sheetDb = SpreadsheetApp.openById(SPREADSHEET_ID);
    const action = e.parameter.action || "get_all";
    
    let result = {};
    
    if (action === "get_all") {
      result = {
        sections: getSheetDataAsJson(sheetDb, "Sections"),
        students: getSheetDataAsJson(sheetDb, "Students"),
        settings: getSheetDataAsJson(sheetDb, "Settings")[0] || {}
      };
    } else if (action === "get_records") {
      const date = e.parameter.date;
      const section_id = e.parameter.section_id;
      let records = getSheetDataAsJson(sheetDb, "Attendance");
      
      if (date) records = records.filter(r => r.date === date);
      if (section_id) records = records.filter(r => r.section_id === section_id);
      
      result = records;
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: true, data: result }))
                         .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const sheetDb = SpreadsheetApp.openById(SPREADSHEET_ID);
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;
    
    let responseData = {};
    
    if (action === "update_attendance") {
      const records = postData.records; // Array of AttendanceRecord
      const attendanceSheet = sheetDb.getSheetByName("Attendance");
      const studentsSheet = sheetDb.getSheetByName("Students");
      
      records.forEach(rec => {
        // 1. เขียนประวัติลง Attendance Log
        appendOrUpdateAttendance(attendanceSheet, rec);
        
        // 2. อัปเดตสถานะล่าสุดใน Students
        updateStudentStatusToday(studentsSheet, rec.student_id, rec.status, rec.updated_at, rec.note);
      });
      
      responseData = { message: "บันทึกข้อมูลการเข้าเรียนลง Google Sheets สำเร็จ" };
      
    } else if (action === "add_student") {
      const student = postData.student;
      const studentSheet = sheetDb.getSheetByName("Students");
      
      appendOrUpdateStudent(studentSheet, student);
      responseData = { message: "บันทึกข้อมูลเด็กเรียนสำเร็จ", student };
      
    } else if (action === "add_section") {
      const section = postData.section;
      const sectionsSheet = sheetDb.getSheetByName("Sections");
      
      appendOrUpdateSection(sectionsSheet, section);
      responseData = { message: "บันทึกข้อมูลระดับห้อองเรียนสำเร็จ", section };
      
    } else if (action === "update_settings") {
      const settings = postData.settings;
      const settingsSheet = sheetDb.getSheetByName("Settings");
      if (settingsSheet) {
        const Headers = ["school_name", "academic_year", "default_status", "low_attendance_threshold"];
        const rowValues = Headers.map(column => {
          if (settings[column] !== undefined) return settings[column];
          return "";
        });
        if (settingsSheet.getLastRow() < 2) {
          settingsSheet.appendRow(rowValues);
        } else {
          settingsSheet.getRange(2, 1, 1, Headers.length).setValues([rowValues]);
        }
        responseData = { message: "บันทึกข้อมูลการตั้งค่าลง Google Sheets สำเร็จ", settings };
      }
      
    } else if (action === "add_reports") {
      const reports = postData.reports;
      const reportsSheet = sheetDb.getSheetByName("Reports");
      if (reportsSheet && Array.isArray(reports)) {
        reports.forEach(rep => {
          appendOrUpdateReport(reportsSheet, rep);
        });
        responseData = { message: "บันทึกสรุปรายงานสถิติมิติต่อเนื่องลง Google Sheets สำเร็จ", count: reports.length };
      }
      
    } else if (action === "reset_database") {
      const payload = postData.payload;
      
      initializeSheetWithHeadersAndData(sheetDb, "Sections", 
        ["section_id", "grade_level", "section_name", "teacher_name", "student_count", "active"], 
        payload.sections
      );
      
      initializeSheetWithHeadersAndData(sheetDb, "Students", 
        ["student_id", "first_name", "last_name", "section_id", "grade_level", "status_today", "attendance_rate", "last_updated", "notes", "active"], 
        payload.students
      );
      
      initializeSheetWithHeadersAndData(sheetDb, "Attendance", 
        ["attendance_id", "date", "student_id", "section_id", "status", "updated_by", "updated_at", "note"], 
        payload.attendance
      );
      
      initializeSheetWithHeadersAndData(sheetDb, "Reports", 
        ["report_id", "period", "section_id", "present_count", "absent_count", "late_count", "excused_count", "attendance_rate", "generated_at"], 
        payload.reports || []
      );
      
      initializeSheetWithHeadersAndData(sheetDb, "Settings", 
        ["school_name", "academic_year", "default_status", "low_attendance_threshold"], 
        [payload.settings]
      );
      
      responseData = { message: "รีเซ็ตและเตรียมโครงสร้างพร้อมข้อมูลตั้งต้นลง Google Sheets ทุกหน้าสำเร็จแล้ว!" };
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: true, data: responseData }))
                         .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}

// Helper methods
function getSheetDataAsJson(sheetDb, sheetName) {
  const sheet = sheetDb.getSheetByName(sheetName);
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  const headers = data[0];
  const jsonArray = [];
  
  for (let i = 1; i < data.length; i++) {
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      let cellValue = data[i][j];
      if (cellValue instanceof Date) {
        cellValue = cellValue.toISOString();
      }
      obj[headers[j]] = cellValue;
    }
    jsonArray.push(obj);
  }
  return jsonArray;
}

function appendOrUpdateAttendance(sheet, record) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const studentIdIdx = headers.indexOf("student_id");
  const dateIdx = headers.indexOf("date");
  
  let foundRowIdx = -1;
  for (let i = 1; i < data.length; i++) {
    const rowDateRaw = data[i][dateIdx];
    let rowDate = "";
    if (rowDateRaw instanceof Date) {
      rowDate = rowDateRaw.toISOString().split('T')[0];
    } else if (rowDateRaw) {
      rowDate = rowDateRaw.toString().split('T')[0];
    }
    
    const testDate = record.date.split('T')[0];
    
    if (data[i][studentIdIdx].toString() === record.student_id.toString() && rowDate === testDate) {
      foundRowIdx = i + 1;
      break;
    }
  }
  
  const rowValues = headers.map(column => {
    if (column === "attendance_id") return record.attendance_id || ("ATT-" + record.student_id + "-" + record.date);
    if (column === "date") return record.date;
    if (column === "student_id") return record.student_id;
    if (column === "section_id") return record.section_id;
    if (column === "status") return record.status;
    if (column === "updated_by") return record.updated_by;
    if (column === "updated_at") return record.updated_at;
    if (column === "note") return record.note || "";
    return "";
  });
  
  if (foundRowIdx > -1) {
    sheet.getRange(foundRowIdx, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
}

function updateStudentStatusToday(sheet, studentId, status, updatedAt, note) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIdx = headers.indexOf("student_id");
  const statusIdx = headers.indexOf("status_today");
  const updatedIdx = headers.indexOf("last_updated");
  const notesIdx = headers.indexOf("notes");
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][idIdx].toString() === studentId.toString()) {
      const row = i + 1;
      if (statusIdx > -1) sheet.getRange(row, statusIdx + 1).setValue(status);
      if (updatedIdx > -1) sheet.getRange(row, updatedIdx + 1).setValue(updatedAt);
      if (notesIdx > -1 && note) sheet.getRange(row, notesIdx + 1).setValue(note);
      break;
    }
  }
}

function appendOrUpdateStudent(sheet, student) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIdx = headers.indexOf("student_id");
  
  let foundRowIdx = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][idIdx].toString() === student.student_id.toString()) {
      foundRowIdx = i + 1;
      break;
    }
  }
  
  const rowValues = headers.map(column => {
    if (student[column] !== undefined) return student[column];
    return "";
  });
  
  if (foundRowIdx > -1) {
    sheet.getRange(foundRowIdx, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
}

function appendOrUpdateSection(sheet, section) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIdx = headers.indexOf("section_id");
  
  let foundRowIdx = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][idIdx].toString() === section.section_id.toString()) {
      foundRowIdx = i + 1;
      break;
    }
  }
  
  const rowValues = headers.map(column => {
    if (section[column] !== undefined) return section[column];
    return "";
  });
  
  if (foundRowIdx > -1) {
    sheet.getRange(foundRowIdx, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
}

function appendOrUpdateReport(sheet, report) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIdx = headers.indexOf("report_id");
  
  let foundRowIdx = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][idIdx].toString() === report.report_id.toString()) {
      foundRowIdx = i + 1;
      break;
    }
  }
  
  const rowValues = headers.map(column => {
    if (report[column] !== undefined) return report[column];
    return "";
  });
  
  if (foundRowIdx > -1) {
    sheet.getRange(foundRowIdx, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
}

function initializeSheetWithHeadersAndData(sheetDb, sheetName, headers, dArray) {
  let sheet = sheetDb.getSheetByName(sheetName);
  if (!sheet) {
    sheet = sheetDb.insertSheet(sheetName);
  } else {
    sheet.clear();
  }
  sheet.appendRow(headers);
  if (dArray && dArray.length > 0) {
    const rows = dArray.map(item => {
      return headers.map(column => {
        if (item[column] !== undefined) return item[column];
        return "";
      });
    });
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
}
`;
