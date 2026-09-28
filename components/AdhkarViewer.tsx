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

interface AdhkarViewerProps {
  initialCategory?: 'morning' | 'evening' | 'after_prayer' | 'sleep' | 'rosary';
}

export const AdhkarViewer: React.FC<AdhkarViewerProps> = ({ initialCategory }) => {
  const [activeCategory, setActiveCategory] = useState<'morning' | 'evening' | 'after_prayer' | 'sleep' | 'rosary'>(() => {
    if (initialCategory) return initialCategory;
    const hour = new Date().getHours();
    return (hour >= 4 && hour < 12) ? 'morning' : 'evening';
  });
  const [counts, setCounts] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('quran-adhkar-counts');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Rosary states
  const [selectedDhikr, setSelectedDhikr] = useState('سبحان الله');
  const [customDhikrText, setCustomDhikrText] = useState('');
  const [rosaryTarget, setRosaryTarget] = useState(33);
  const [rosaryCounts, setRosaryCounts] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('quran-electronic-rosary-counts');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('quran-adhkar-counts', JSON.stringify(counts));
    } catch (e) {}
  }, [counts]);

  useEffect(() => {
    try {
      localStorage.setItem('quran-electronic-rosary-counts', JSON.stringify(rosaryCounts));
    } catch (e) {}
  }, [rosaryCounts]);

  const COMMON_ROSARY_DHIKRS = [
    'سبحان الله',
    'الحمد لله',
    'لا إله إلا الله',
    'الله أكبر',
    'أستغفر الله العظيم وأتوب إليه',
    'اللهم صلِّ وسلم على نبينا محمد',
    'لا حول ولا قوة إلا بالله العلي العظيم',
    'سبحان الله وبحمده، سبحان الله العظيم',
    'لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير'
  ];

  const activeDhikrKey = selectedDhikr === 'custom' ? `custom_${customDhikrText || 'default'}` : selectedDhikr;
  const activeDhikrText = selectedDhikr === 'custom' ? (customDhikrText || 'اكتب ذكرك المخصص للتسبيح...') : selectedDhikr;
  const activeDhikrCount = rosaryCounts[activeDhikrKey] || 0;

  const handleRosaryClick = () => {
    playBeadClick();
    if ('vibrate' in navigator) {
      try { navigator.vibrate(40); } catch (e) {}
    }
    const newCount = activeDhikrCount + 1;
    setRosaryCounts(prev => ({
      ...prev,
      [activeDhikrKey]: newCount
    }));

    if (rosaryTarget > 0 && newCount % rosaryTarget === 0) {
      if ('vibrate' in navigator) {
        try { navigator.vibrate([100, 50, 100]); } catch (e) {}
      }
    }
  };

  const handleRosaryResetCurrent = () => {
    setRosaryCounts(prev => ({
      ...prev,
      [activeDhikrKey]: 0
    }));
  };

  const handleRosaryResetAll = () => {
    if (confirm('هل أنت متأكد من تصفير جميع أعداد المسبحة الإلكترونية؟')) {
      setRosaryCounts({});
    }
  };

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
            <p className="text-[10px] text-[#00b87c] font-bold">أذكار مأثورة ومسبحة إلكترونية متكاملة</p>
          </div>
          {completedItems > 0 && activeCategory !== 'rosary' && (
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
            { id: 'sleep', label: 'أذكار النوم', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
            { id: 'rosary', label: 'المسبحة الإلكترونية', icon: 'M12 4a9 9 0 00-9 9m18 0a9 9 0 00-9-9m0 0v3m0 12v3m9-9h3m-18 0H3' }
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
        {activeCategory !== 'rosary' && (
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
        )}
      </div>

      {/* Main Container */}
      {activeCategory === 'rosary' ? (
        <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center space-y-5 max-w-md mx-auto w-full pb-24 animate-fadeIn">
          {/* Dhikr Selector Card */}
          <div className="w-full bg-[#0a2a1f] border border-[#0f2d22] p-5 rounded-3xl space-y-4 text-right shadow-xl">
            <div>
              <label className="text-xs font-bold text-[#dfb26d] block mb-1.5">اختر الذكر للتسبيح:</label>
              <select
                value={selectedDhikr}
                onChange={(e) => {
                  setSelectedDhikr(e.target.value);
                  if (e.target.value !== 'custom') {
                    setCustomDhikrText('');
                  }
                }}
                className="w-full bg-black/40 border border-white/10 rounded-2xl py-2.5 px-3 text-xs font-bold text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#00b87c]"
              >
                {COMMON_ROSARY_DHIKRS.map((d) => (
                  <option key={d} value={d} className="bg-[#051d14] text-slate-200">{d}</option>
                ))}
                <option value="custom" className="bg-[#051d14] text-slate-200">➕ ذكر مخصص...</option>
              </select>
            </div>

            {selectedDhikr === 'custom' && (
              <div className="space-y-1.5 animate-fadeIn">
                <label className="text-[10px] text-slate-400 font-bold block">اكتب ذكرك المخصص:</label>
                <input
                  type="text"
                  value={customDhikrText}
                  onChange={(e) => setCustomDhikrText(e.target.value)}
                  placeholder="مثال: سبحان الله وبحمده عدد خلقه..."
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-2 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#00b87c]"
                />
              </div>
            )}

            {/* Target Selectors */}
            <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-4">
              <span className="text-xs text-slate-400 font-bold">العدد المستهدف (الدورة):</span>
              <div className="flex gap-1">
                {[33, 100, 1000, 0].map((t) => (
                  <button
                    key={t}
                    onClick={() => setRosaryTarget(t)}
                    className={`py-1 px-2 rounded-lg text-[10px] font-bold border transition-all ${
                      rosaryTarget === t
                        ? 'bg-[#00b87c]/20 border-[#00b87c] text-[#00b87c]'
                        : 'bg-black/20 border-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    {t === 0 ? 'مفتوح' : t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Clicker Device Card */}
          <div className="w-full bg-[#0a2a1f] border border-[#0f2d22] rounded-[36px] p-5 shadow-2xl relative flex flex-col items-center justify-center space-y-5 overflow-hidden">
            {/* Ambient decorative glowing lights */}
            <div className="absolute top-0 left-0 w-20 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-20 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

            {/* Display screen (Digital LED look) */}
            <div className="w-full bg-[#04140b] rounded-2xl p-4 border border-emerald-950 flex flex-col items-center justify-center relative shadow-inner">
              <div className="absolute top-2 right-4 text-[9px] font-bold text-emerald-500/40 tracking-wider">T S B I H</div>
              
              <div className="text-[11px] text-slate-400 font-bold max-w-[240px] text-center overflow-hidden text-ellipsis whitespace-nowrap mb-1">
                {activeDhikrText}
              </div>

              {/* Digital LED numbers */}
              <div className="text-4xl font-black font-mono tracking-widest text-[#00b87c] drop-shadow-[0_0_8px_rgba(0,184,124,0.3)] select-all py-1">
                {activeDhikrCount.toString().padStart(4, '0')}
              </div>

              {/* Progress and Cycles */}
              <div className="w-full flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-2 border-t border-white/5">
                <span>الدورة الحالية: {rosaryTarget > 0 ? `${activeDhikrCount % rosaryTarget}/${rosaryTarget}` : 'مفتوحة'}</span>
                <span>المجموع الكلي: {activeDhikrCount}</span>
              </div>
            </div>

            {/* Huge clicking button */}
            <button
              onClick={handleRosaryClick}
              className="w-36 h-36 rounded-full bg-gradient-to-b from-[#00c988] to-[#008f5c] p-1.5 hover:scale-105 active:scale-95 transition-transform flex items-center justify-center relative cursor-pointer shadow-xl shadow-emerald-950/40 select-none"
              title="اضغط للتسبيح"
            >
              {/* Inner ring */}
              <div className="w-full h-full rounded-full border-4 border-emerald-400/20 bg-gradient-to-b from-[#00b87c] to-[#007a4f] flex flex-col items-center justify-center text-white shadow-inner">
                <span className="text-lg font-black tracking-widest drop-shadow">اضغط</span>
                <span className="text-[9px] opacity-75 font-bold mt-1">ذكر الله</span>
              </div>
              
              {/* Ripple ring on click */}
              <div className="absolute inset-0 rounded-full border-2 border-emerald-400 animate-ping opacity-0 active:opacity-100 transition-opacity pointer-events-none" />
            </button>

            {/* Sub-buttons (Reset, Reset All) */}
            <div className="w-full flex items-center justify-between gap-3 pt-2">
              <button
                onClick={handleRosaryResetCurrent}
                className="py-1.5 px-3 bg-red-600/10 hover:bg-red-600 border border-red-500/20 rounded-xl text-[10px] font-bold text-red-200 hover:text-white transition-all flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>تصفير هذا الذكر</span>
              </button>

              <button
                onClick={handleRosaryResetAll}
                className="py-1.5 px-3 bg-black/30 hover:bg-black/50 border border-white/5 rounded-xl text-[10px] font-bold text-slate-400 hover:text-white transition-all flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>تصفير المسبحة</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Adhkar List */
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
      )}
    </div>
  );
};
