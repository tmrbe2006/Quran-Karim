import React, { useState, useEffect } from 'react';
import { ADHKAR_DATA, DhikrItem } from '../data/adhkar';

// Sound effect synthesizer using Web Audio API (completely offline)
function playBeadClick() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(480, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(160, ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch (e) {
    // Ignore if audio context is blocked
  }
}

export const AdhkarViewer: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'morning' | 'evening' | 'after_prayer' | 'sleep'>('morning');
  const [counts, setCounts] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('quran-adhkar-counts');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('quran-adhkar-counts', JSON.stringify(counts));
    } catch (e) {}
  }, [counts]);

  const items = ADHKAR_DATA.filter(item => item.category === activeCategory);

  const totalItems = items.length;
  const completedItems = items.filter(item => (counts[item.id] || 0) >= item.repeat).length;
  const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const handleIncrement = (item: DhikrItem) => {
    const current = counts[item.id] || 0;
    if (current < item.repeat) {
      playBeadClick();
      if ('vibrate' in navigator) {
        try { navigator.vibrate(30); } catch (e) {}
      }
      setCounts(prev => ({
        ...prev,
        [item.id]: current + 1
      }));
    }
  };

  const handleResetSingle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCounts(prev => ({ ...prev, [id]: 0 }));
  };

  const handleResetCategory = () => {
    setCounts(prev => {
      const updated = { ...prev };
      items.forEach(it => {
        updated[it.id] = 0;
      });
      return updated;
    });
  };

  const handleCopy = (item: DhikrItem, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.text).then(() => {
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#051d14] text-white overflow-hidden page-fade-in" dir="rtl">
      {/* Header */}
      <div className="p-4 pb-2 shrink-0 border-b border-[#0f2d22] bg-[#07251a]">
        <div className="flex items-center justify-between mb-4">
          <div className="text-right">
            <h1 className="text-xl font-bold text-[#dfb26d]">حصن المسلم والأذكار</h1>
            <p className="text-[10px] text-[#00b87c] font-bold">أذكار مأثورة من السنة النبوية</p>
          </div>
          {completedItems > 0 && (
            <button
              onClick={handleResetCategory}
              className="text-[11px] font-bold text-slate-400 hover:text-white bg-[#0f2d22] hover:bg-red-950/40 px-3 py-1.5 rounded-xl border border-white/5 transition-all flex items-center gap-1.5"
              title="تصفير أذكار هذا القسم"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              <span>إعادة البدء</span>
            </button>
          )}
        </div>

        {/* Categories Bar */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {[
            { id: 'morning', label: 'أذكار الصباح', icon: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z' },
            { id: 'evening', label: 'أذكار المساء', icon: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z' },
            { id: 'after_prayer', label: 'بعد الصلاة', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
            { id: 'sleep', label: 'أذكار النوم', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`whitespace-nowrap px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeCategory === cat.id
                  ? 'bg-gradient-to-r from-[#00b87c] to-[#009b68] text-white shadow-lg shadow-[#00b87c]/20'
                  : 'bg-[#0a2a1f] text-slate-400 hover:text-white hover:bg-[#0f2d22]'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={cat.icon} /></svg>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Category Progress Bar */}
        <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">الإنجاز:</span>
            <span className="font-bold text-[#dfb26d]">{completedItems} / {totalItems}</span>
          </div>
          <div className="w-32 bg-black/40 h-2 rounded-full overflow-hidden border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-[#00b87c] to-[#dfb26d] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-[10px] text-[#00b87c] font-bold">{progressPercent}%</span>
        </div>
      </div>

      {/* Adhkar List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {items.map((item, index) => {
          const currentCount = counts[item.id] || 0;
          const isDone = currentCount >= item.repeat;
          const remaining = Math.max(0, item.repeat - currentCount);

          return (
            <div
              key={item.id}
              onClick={() => handleIncrement(item)}
              className={`p-5 rounded-3xl border transition-all cursor-pointer select-none relative group overflow-hidden ${
                isDone
                  ? 'bg-[#06261a] border-[#00b87c]/50 shadow-lg shadow-[#00b87c]/5'
                  : 'bg-[#0a2a1f] border-[#0f2d22] hover:border-[#00b87c]/30'
              }`}
            >
              {/* Top Row: Index, Tag & Quick Actions */}
              <div className="flex items-center justify-between mb-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-[#00b87c]/10 text-[#00b87c] flex items-center justify-center font-bold text-[11px]">
                    {index + 1}
                  </span>
                  {isDone ? (
                    <span className="bg-[#00b87c]/20 text-[#00b87c] px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      تم بحمد الله
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-bold">
                      متبقي: {remaining} من {item.repeat}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => handleCopy(item, e)}
                    className="p-1.5 text-slate-500 hover:text-white rounded-lg transition-colors"
                    title="نسخ الذكر"
                  >
                    {copiedId === item.id ? (
                      <span className="text-[10px] text-[#00b87c] font-bold">تم النسخ</span>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    )}
                  </button>
                  {currentCount > 0 && (
                    <button
                      onClick={(e) => handleResetSingle(item.id, e)}
                      className="p-1.5 text-slate-500 hover:text-amber-400 rounded-lg transition-colors"
                      title="إعادة تصفير هذا الذكر"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Dhikr Main Text */}
              <p className="quran-text text-lg text-white leading-relaxed text-right mb-4 whitespace-pre-line">
                {item.text}
              </p>

              {/* Fadl / Virtue info box */}
              {item.fadl && (
                <div className="bg-[#051d14]/70 p-3 rounded-2xl border border-white/5 mb-4 text-right">
                  <div className="text-[10px] font-bold text-[#dfb26d] flex items-center gap-1 mb-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>فضل الذكر:</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-normal">{item.fadl}</p>
                  <p className="text-[9px] text-slate-500 mt-1">{item.reference}</p>
                </div>
              )}

              {/* Counter Button Trigger */}
              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <span className="text-[11px] text-slate-400">
                  انقر في أي مكان للتكرار
                </span>

                <div className={`px-4 py-2 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all ${
                  isDone 
                    ? 'bg-[#00b87c] text-white shadow-md shadow-[#00b87c]/30' 
                    : 'bg-[#00b87c]/20 text-[#00b87c] border border-[#00b87c]/40 group-hover:scale-105 active:scale-95'
                }`}>
                  <span className="text-xs font-normal">العدد:</span>
                  <span className="text-base font-extrabold">{currentCount}</span>
                  <span className="text-xs opacity-60">/ {item.repeat}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
