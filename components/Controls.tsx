import React, { useState, useRef, useEffect } from 'react';
import { RECITERS } from '../constants';
import { Reciter } from '../types';

interface ControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  selectedReciter: Reciter;
  onSelectReciter: (reciter: Reciter) => void;
  trueDarkMode?: boolean;
  sleepTimerSeconds?: number | null;
  onSetSleepTimer?: (minutes: number | null) => void;
}

export const Controls: React.FC<ControlsProps> = ({
  isPlaying,
  onTogglePlay,
  onNext,
  onPrev,
  selectedReciter,
  onSelectReciter,
  trueDarkMode = false,
  sleepTimerSeconds = null,
  onSetSleepTimer
}) => {
  const [isTimerMenuOpen, setIsTimerMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close timer dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsTimerMenuOpen(false);
      }
    };
    if (isTimerMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isTimerMenuOpen]);

  // Format remaining timer seconds into mm:ss
  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const timerOptions = [
    { label: 'إيقاف المؤقت', value: null },
    { label: '15 دقيقة', value: 15 },
    { label: '30 دقيقة', value: 30 },
    { label: '45 دقيقة', value: 45 },
    { label: '60 دقيقة (ساعة)', value: 60 }
  ];

  return (
    <div className={`p-4 z-40 border-t transition-colors duration-500 relative ${
      trueDarkMode 
        ? 'bg-[#000000] border-[#221c14]' 
        : 'bg-[#0a2a1f] border-[#0f2d22]'
    }`}>
      <div className="flex items-center justify-between gap-3 max-w-4xl mx-auto">
        
        {/* Sleep Timer Button and Dropdown Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsTimerMenuOpen(prev => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition-all ${
              sleepTimerSeconds !== null && sleepTimerSeconds > 0
                ? (trueDarkMode 
                    ? 'bg-[#dfb26d]/20 border-[#dfb26d]/50 text-[#dfb26d] shadow-sm shadow-[#dfb26d]/20 animate-pulse'
                    : 'bg-[#00b87c]/20 border-[#00b87c]/50 text-[#00b87c] shadow-sm shadow-[#00b87c]/20 animate-pulse')
                : (trueDarkMode
                    ? 'bg-[#181510] border-neutral-800 text-neutral-400 hover:text-amber-100 hover:border-neutral-700'
                    : 'bg-[#0f2d22] border-white/5 text-slate-400 hover:text-white hover:border-white/10')
            }`}
            title="مؤقت النوم لإيقاف الصوت تلقائياً"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              {sleepTimerSeconds !== null && sleepTimerSeconds > 0
                ? formatTimer(sleepTimerSeconds)
                : 'مؤقت النوم'}
            </span>
          </button>

          {/* Timer Selection Popover */}
          {isTimerMenuOpen && onSetSleepTimer && (
            <div 
              className={`absolute bottom-full mb-3 right-0 w-44 rounded-2xl p-2 shadow-2xl border text-right z-50 animate-fadeIn ${
                trueDarkMode 
                  ? 'bg-[#14120e] border-[#292218] text-amber-100' 
                  : 'bg-[#0a2a1f] border-[#0f2d22] text-white'
              }`}
              dir="rtl"
            >
              <div className="px-2 py-1.5 mb-1 border-b border-white/10 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400">إيقاف التلاوة بعد</span>
                <span className="text-[10px] text-amber-400 font-bold">🌙</span>
              </div>
              <div className="space-y-1">
                {timerOptions.map((opt, idx) => {
                  const isActive = opt.value === null
                    ? (sleepTimerSeconds === null || sleepTimerSeconds <= 0)
                    : (sleepTimerSeconds !== null && Math.ceil(sleepTimerSeconds / 60) === opt.value);

                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        onSetSleepTimer(opt.value);
                        setIsTimerMenuOpen(false);
                      }}
                      className={`w-full text-right px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between ${
                        isActive
                          ? (trueDarkMode 
                              ? 'bg-[#dfb26d] text-[#12110e] font-bold' 
                              : 'bg-[#00b87c] text-white font-bold')
                          : (trueDarkMode 
                              ? 'hover:bg-neutral-800 text-neutral-300' 
                              : 'hover:bg-white/5 text-slate-300')
                      }`}
                    >
                      <span>{opt.label}</span>
                      {isActive && (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-4 flex-1 justify-center">
          <button 
            onClick={onNext} 
            className={`transition-colors ${
              trueDarkMode ? 'text-amber-200/50 hover:text-[#dfb26d]' : 'text-slate-400 hover:text-[#00b87c]'
            }`}
            title="الآية التالية"
          >
            <svg className="w-6 h-6 rotate-180" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
          </button>

          <button 
            onClick={onTogglePlay}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              trueDarkMode 
                ? 'bg-[#dfb26d] text-[#12110e] shadow-lg shadow-[#dfb26d]/20 hover:scale-105' 
                : 'bg-[#00b87c] text-white shadow-lg shadow-[#00b87c]/20 hover:scale-105'
            }`}
            title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل التلاوة'}
          >
            {isPlaying ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            ) : (
              <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            )}
          </button>

          <button 
            onClick={onPrev} 
            className={`transition-colors ${
              trueDarkMode ? 'text-amber-200/50 hover:text-[#dfb26d]' : 'text-slate-400 hover:text-[#00b87c]'
            }`}
            title="الآية السابقة"
          >
            <svg className="w-6 h-6 rotate-180" fill="currentColor" viewBox="0 0 24 24"><path d="M16 18V6h-2v12h2zM6 12l8.5 6V6z"/></svg>
          </button>
        </div>

        {/* Reciter Mini Selector */}
        <select 
          value={selectedReciter.id}
          onChange={(e) => {
            const reciter = RECITERS.find(r => r.id === e.target.value);
            if (reciter) onSelectReciter(reciter);
          }}
          className={`border-none text-[10px] font-bold rounded-lg px-2.5 py-1.5 outline-none appearance-none cursor-pointer transition-colors ${
            trueDarkMode 
              ? 'bg-[#181510] text-[#dfb26d]' 
              : 'bg-[#0f2d22] text-[#00b87c]'
          }`}
          title="اختيار القارئ"
        >
          {RECITERS.map(r => (
            <option key={r.id} value={r.id}>{r.name.split(' ').pop()}</option>
          ))}
        </select>
      </div>
    </div>
  );
};
