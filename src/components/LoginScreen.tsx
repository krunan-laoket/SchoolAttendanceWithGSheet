import React from 'react';
import { motion } from 'motion/react';
import { 
  GraduationCap, 
  Sparkles, 
  Lock, 
  ArrowRight
} from 'lucide-react';

interface LoginScreenProps {
  onSignIn: () => Promise<void>;
  authLoading: boolean;
  onSkipLogin: () => void;
}

export default function LoginScreen({ onSignIn, authLoading, onSkipLogin }: LoginScreenProps) {
  return (
    <div className="min-h-screen bg-natural-bg flex items-center justify-center p-6 font-sans antialiased text-natural-text relative overflow-hidden selection:bg-natural-primary/10">
      
      {/* Absolute Natural Soft Ambient Backdrops */}
      <div className="absolute top-[10%] left-[20%] w-[350px] h-[350px] rounded-full bg-natural-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[15%] right-[10%] w-[400px] h-[400px] rounded-full bg-natural-primary/5 blur-[140px] pointer-events-none" />

      {/* Modern Minimal Glass Card using Warm Natural Colors */}
      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm bg-natural-card border border-natural-border shadow-[0_12px_40px_rgba(60,58,54,0.04)] rounded-[2rem] p-8 md:p-10 z-10 flex flex-col justify-between relative"
        id="login-[minimal]-card"
      >
        
        {/* Top Header Section */}
        <div className="text-center space-y-6 pt-2">
          
          {/* Natural Accent Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-natural-primary/10 border border-natural-primary/20 text-natural-primary text-[10px] font-bold tracking-wider uppercase mx-auto">
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-natural-primary" />
            <span>Cloud Sync Active</span>
          </div>

          {/* Logo Icon Container using Primary Accent */}
          <div className="w-16 h-16 bg-natural-primary rounded-2xl flex items-center justify-center text-white mx-auto shadow-sm ring-4 ring-natural-border-light">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>

          {/* Brand Copy with beautiful natural-text spacing */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold font-display text-natural-text tracking-tight leading-normal">
              Baan Pratom Portal
            </h1>
            <p className="text-xs text-natural-text-light font-medium max-w-[280px] mx-auto leading-relaxed">
              ระบบตรวจสอบเวลาเรียนเด็กประถมศึกษา เชื่อมโยงบัญชีตรงกับแผ่นงาน Google Sheets ส่วนตัว
            </p>
          </div>
        </div>

        {/* Action Button Section using Warm Natural Accent */}
        <div className="my-8 space-y-4">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={onSignIn}
            disabled={authLoading}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-5 rounded-xl bg-natural-primary hover:bg-natural-primary/95 text-white font-bold text-sm transition-all shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            id="google-login-btn-minimal"
          >
            {authLoading ? (
              <div className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>กำลังโหลดเซสชัน...</span>
              </div>
            ) : (
              <>
                <svg className="w-4 h-4 fill-current mr-0.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#FFF"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#FFF"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FFF"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#FFF"/>
                </svg>
                <span>ลงชื่อใช้งานด้วย Google</span>
                <ArrowRight className="w-4 h-4 ml-1 text-white/70" />
              </>
            )}
          </motion.button>

          <div className="relative py-2 flex items-center justify-center">
            <span className="absolute inset-x-0 h-px bg-natural-border"></span>
            <span className="relative bg-natural-card px-3 text-[10px] text-natural-text-light font-bold uppercase tracking-wider">หรือ</span>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={onSkipLogin}
            disabled={authLoading}
            className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl border border-natural-border hover:bg-natural-primary/5 text-natural-text-light hover:text-natural-text font-bold text-xs transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            id="sandbox-login-btn"
          >
            <span>ทดลองใช้งาน (Sandbox โหมดทดสอบ)</span>
          </motion.button>

          {/* Clean minimal safety note with natural-text colors */}
          <div className="flex justify-center items-center gap-1.5 text-[10px] text-natural-text-light font-medium">
            <Lock className="w-3.5 h-3.5 text-natural-text-light/70" />
            <span>ผ่าน Google Direct API อย่างปลอดภัย ไร้กังวล</span>
          </div>
        </div>

        {/* Minimal Bottom Brand Credits */}
        <div className="border-t border-natural-border pt-4 text-center">
          <span className="text-[9px] text-natural-text-light/60 tracking-wider uppercase font-semibold">
            Baan Pratom School Portal © 2026
          </span>
        </div>

      </motion.div>
    </div>
  );
}
