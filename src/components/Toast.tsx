/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

export default function Toast({ toasts, removeToast }: ToastProps) {
  return (
    <div className="fixed top-4 left-4 right-4 md:top-5 md:right-5 md:left-auto z-50 flex flex-col gap-2 max-w-md md:max-w-sm font-sans">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            id={`toast-${toast.id}`}
            initial={{ opacity: 0, y: -15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`p-4 rounded-2xl shadow-xl border flex items-start gap-3 backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-emerald-500/95 text-white border-emerald-600 shadow-emerald-500/10'
                : toast.type === 'error'
                ? 'bg-rose-500/95 text-white border-rose-600 shadow-rose-500/10'
                : 'bg-[#3C3A36]/95 text-white border-[#2A2925] shadow-black/10'
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-100" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-100" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-amber-200" />}
            </div>
            <div className="flex-1 text-xs md:text-sm font-bold leading-normal">{toast.message}</div>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 text-white/70 hover:text-white cursor-pointer p-1 rounded-lg hover:bg-white/10 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
