import React, { useState, useEffect } from 'react';
import { Reciter } from '../types';
import { getReciterAudioStats, clearReciterAudio } from '../utils/audioStorage';

interface ReciterStorageManagerProps {
  reciter: Reciter;
  onRefresh?: () => void;
}

export const ReciterStorageManager: React.FC<ReciterStorageManagerProps> = ({ reciter, onRefresh }) => {
  const [stats, setStats] = useState<{ count: number; totalBytes: number }>({ count: 0, totalBytes: 0 });
  const [isClearing, setIsClearing] = useState(false);

  const loadStats = async () => {
    try {
      const data = await getReciterAudioStats(reciter.id);
      setStats(data);
    } catch {
      setStats({ count: 0, totalBytes: 0 });
    }
  };

  useEffect(() => {
    loadStats();
  }, [reciter.id]);

  const handleClear = async () => {
    if (stats.count === 0) return;
    if (!window.confirm(`هل أنت متأكد من رغبتك في حذف الآيات المحملة أوفلاين للقارئ (${reciter.name})؟`)) return;

    setIsClearing(true);
    await clearReciterAudio(reciter);
    await loadStats();
    setIsClearing(false);
    if (onRefresh) onRefresh();
  };

  const megabytes = (stats.totalBytes / (1024 * 1024)).toFixed(1);

  return (
    <div className="bg-[#051d14] rounded-2xl p-3 border border-white/5 flex items-center justify-between text-right" dir="rtl">
      <div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#00b87c]" />
          <p className="text-xs font-bold text-white">مجلد القارئ: <span className="text-[#dfb26d]">{reciter.name}</span></p>
        </div>
        <p className="text-[10px] text-slate-400 mt-1">
          {stats.count > 0 ? (
            <>
              المحفوظ أوفلاين: <span className="text-[#00b87c] font-bold">{stats.count}</span> آية ({megabytes} ميجابايت)
            </>
          ) : (
            'لا توجد آيات محفوظة بعد لهذا القارئ (سيتم حفظ كل آية تسمعها تلقائياً)'
          )}
        </p>
      </div>

      {stats.count > 0 && (
        <button
          onClick={handleClear}
          disabled={isClearing}
          className="text-[10px] text-slate-400 hover:text-red-400 bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 px-2.5 py-1.5 rounded-xl transition-colors font-bold disabled:opacity-50"
          title="حذف الملفات الصوتية المحفوظة لهذا القارئ"
        >
          {isClearing ? 'جاري الحذف...' : 'مسح المحفوظ'}
        </button>
      )}
    </div>
  );
};
