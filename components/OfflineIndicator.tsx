import React from 'react';
import { useOnlineStatus } from './useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div 
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-2xl bg-amber-500/95 backdrop-blur-md px-4 py-2 text-xs font-bold text-slate-900 shadow-xl border border-amber-300/40 animate-bounce"
      dir="rtl"
    >
      <span className="h-2.5 w-2.5 rounded-full bg-slate-900 animate-ping" />
      <span>وضع عدم الاتصال — يعمل التطبيق من الذاكرة المحفوظة أوفلاين.</span>
    </div>
  );
};
