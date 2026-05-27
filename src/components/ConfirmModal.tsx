import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'ยืนยัน',
  cancelText = 'ยกเลิก',
  isDestructive = false,
  onConfirm,
  onCancel,
}: Props) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden p-6 relative flex flex-col gap-4 font-sans border border-slate-100"
        >
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex gap-3 items-start">
            <div className={`p-2.5 rounded-xl shrink-0 ${isDestructive ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-[#2C2A29] text-base md:text-lg">{title}</h3>
              <p className="text-natural-text-light text-xs md:text-sm leading-relaxed">{message}</p>
            </div>
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              onClick={onCancel}
              type="button"
              className="flex-1 py-2.5 text-xs font-bold rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition cursor-pointer"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              type="button"
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl text-white transition cursor-pointer ${
                isDestructive ? 'bg-red-600 hover:bg-red-700' : 'bg-[#2C2A29] hover:bg-slate-800'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
