import React from 'react';
import { motion } from 'motion/react';
import { 
  GraduationCap, 
  Sparkles, 
  FileSpreadsheet, 
  Lock, 
  Database, 
  ArrowRight,
  CloudLightning,
  ChevronRight
} from 'lucide-react';

interface LoginScreenProps {
  onSignIn: () => Promise<void>;
  authLoading: boolean;
}

export default function LoginScreen({ onSignIn, authLoading }: LoginScreenProps) {
  return (
    <div className="min-h-screen bg-natural-bg flex items-center justify-center p-4 md:p-8 font-sans antialiased text-natural-text relative overflow-hidden selection:bg-natural-primary/20">
      
      {/* Background Decorative Accent Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-natural-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-natural-primary/8 blur-[100px] pointer-events-none" />

      {/* Main Container Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-5xl bg-natural-card rounded-3xl border border-natural-border shadow-md overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[580px] z-10"
        id="login-main-card"
      >
        
        {/* Left Side: Brand Concept and System info */}
        <div className="lg:col-span-7 bg-natural-sidebar p-8 md:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-natural-border-dark relative">
          
          {/* Top Brand Tag */}
          <div className="flex items-center gap-2.5 mb-8 lg:mb-0" id="login-brand-tag">
            <div className="p-2 bg-natural-primary rounded-xl text-white flex items-center justify-center shadow-sm">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-wide font-display text-natural-text">
                Baan Pratom Portal
              </span>
              <span className="text-[10px] text-natural-primary font-bold uppercase tracking-wider block leading-none">
                Primary Attendance Hub
              </span>
            </div>
          </div>

          {/* Main Visual copy */}
          <div className="my-auto py-6 lg:py-10 space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-natural-primary/10 border border-natural-primary/20 text-natural-primary text-[11px] font-bold">
                <Sparkles className="w-3.5 h-3.5 fill-natural-primary" />
                <span>Cloud Sync & Local Safe Ecosystem</span>
              </div>
              <h2 className="text-2xl md:text-3.5xl font-black font-display text-natural-text leading-tight tracking-tight">
                ระบบจัดการรายชื่อและเช็กชื่อ <br />
                <span className="text-natural-primary">เชื่อมตรงบัญชี Google Sheets</span>
              </h2>
            </div>
            
            <p className="text-xs md:text-sm text-natural-text-light font-medium leading-relaxed max-w-lg">
              นวัตกรรมแอปพลิเคชันพอร์ทัลเพื่อครูประจำชั้นไทย ออกแบบเพื่อการเช็กเวลาเรียน บันทึกสถิติรายวัน 
              และส่งออกรายงานประมวลผลทันใจ โดยข้อมูลทั้งหมดจะเชื่อมโยงกับแผ่นงานส่วนตัวของท่านอย่างปลอดภัย ไร้รอยต่อ
            </p>

            {/* Core Pillars Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div className="p-4 bg-white/70 backdrop-blur-xs rounded-2xl border border-natural-border-dark/60 space-y-1.5 hover:border-natural-primary/30 transition-all">
                <div className="flex items-center gap-2 text-natural-primary">
                  <FileSpreadsheet className="w-4.5 h-4.5" />
                  <span className="font-bold text-xs text-natural-text">Google Sheets Database</span>
                </div>
                <p className="text-2xs text-natural-text-light leading-relaxed">
                  ไม่ต้องพึ่งพาเซิร์ฟเวอร์ส่วนกลาง ใช้ชีตส่วนตัวเป็นคลังเก็บข้อมูล เข้าถึงได้ทุกเวลา
                </p>
              </div>

              <div className="p-4 bg-white/70 backdrop-blur-xs rounded-2xl border border-natural-border-dark/60 space-y-1.5 hover:border-natural-primary/30 transition-all">
                <div className="flex items-center gap-2 text-natural-primary">
                  <Database className="w-4.5 h-4.5" />
                  <span className="font-bold text-xs text-natural-text">Firestore Secure Sync</span>
                </div>
                <p className="text-2xs text-natural-text-light leading-relaxed">
                  สำรองข้อมูลเชื่อมต่อ API ตัวสคริปต์ไว้อย่างปลอดภัยเฉพาะบัญชีเจ้าของเครื่อง
                </p>
              </div>
            </div>
          </div>

          {/* Footer Copyright/Notice details */}
          <div className="pt-6 lg:pt-0 border-t border-natural-border-dark lg:border-t-0 text-[11px] text-natural-text-light flex items-center justify-between">
            <span className="font-semibold">ระบบเวอร์ชันโรงเรียนประถมศึกษาเสรี v1.2</span>
            <span className="opacity-75">โรงเรียนในเครือสาธิตและสังกัด สพฐ.</span>
          </div>

        </div>

        {/* Right Side: Login Form Access */}
        <div className="lg:col-span-5 p-8 md:p-12 flex flex-col justify-between bg-white relative">
          
          {/* Floating Subtle Lock badge */}
          <div className="hidden lg:flex items-center justify-center p-3 bg-natural-bg border border-natural-border rounded-2xl self-end">
            <Lock className="w-5 h-5 text-natural-text-light/80" />
          </div>

          <div className="my-auto py-8 space-y-8 max-w-sm mx-auto w-full">
            
            {/* Call to action heading */}
            <div className="space-y-2 text-center lg:text-left">
              <span className="text-2xs font-extrabold uppercase tracking-widest text-natural-primary">เข้าสู่ระบบการทำงาน</span>
              <h3 className="text-xl md:text-2xl font-extrabold text-natural-text font-display">
                ลงชื่อเข้าใช้งานสากล
              </h3>
              <p className="text-xs text-natural-text-light leading-relaxed">
                กรุณาลงชื่อเข้าระบบด้วยบัญชี Google เพื่อเปิดใช้งานฐานข้อมูลคลาวด์และปรับปรุงระบบเช็กชื่อเด็กนักเรียนรายชั้นเรียน
              </p>
            </div>

            {/* Actions Block */}
            <div className="space-y-4">
              
              {/* Primary Google Login Button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={onSignIn}
                disabled={authLoading}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl bg-natural-primary hover:bg-natural-primary/95 text-white font-extrabold text-xs transition shadow-xs hover:shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                id="google-login-btn"
              >
                {authLoading ? (
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>กำลังประมวลผลเซสชัน...</span>
                  </div>
                ) : (
                  <>
                    {/* Google SVG Icon */}
                    <svg className="w-4 h-4 fill-current mr-1" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#FFF"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#FFF"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FFF"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#FFF"/>
                    </svg>
                    <span>ลงชื่อเข้าใช้งานด้วย Google Accounts</span>
                  </>
                )}
              </motion.button>

              {/* Secure Notice */}
              <div className="p-3.5 bg-natural-bg/70 rounded-xl border border-natural-border flex items-start gap-2.5 text-3xs text-natural-text-light font-medium">
                <Lock className="w-3.5 h-3.5 text-natural-primary mt-0.5 flex-shrink-0" />
                <span className="leading-normal">
                  ระบบส่งต่อและยืนยันตัวตนผ่านเซิร์ฟเวอร์ทางการของ Google OAuth โดยตรง ปราศจากการจัดเก็บรหัสผ่านส่วนตัวบนระบบภายนอก ความเป็นส่วนตัวได้รับการป้องกันขั้นสูงสุด
                </span>
              </div>

            </div>

            {/* Quick Helper Instructions */}
            <div className="border-t border-natural-border pt-5 space-y-2.5">
              <span className="text-[10px] font-bold text-natural-text/60 uppercase block tracking-wider">
                สิทธิ์และความเป็นเจ้าของข้อมูล
              </span>
              <ul className="text-3xs text-natural-text-light space-y-1.5 font-medium leading-relaxed">
                <li className="flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-natural-primary" />
                  <span>สถิติเวลาเช็กชื่อจะบันทึกอยู่ในเครื่องของท่านอย่างปลอดภัย</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-natural-primary" />
                  <span>สามารถสั่งซิงค์เพื่อเชื่อมบัญชี แผ่นงาน กับครูร่วมสายชั้นเรียนท่านอื่นได้</span>
                </li>
              </ul>
            </div>

          </div>

          <div className="text-center text-[10px] text-natural-text-light/70 font-semibold">
            หน่วยพัฒนาเทคโนโลยีเทคนิคศึกษาครูประถม • พัฒนาด้วยความปลอดภัยสุงสุด
          </div>

        </div>

      </motion.div>
    </div>
  );
}
