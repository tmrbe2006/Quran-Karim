import React, { useState, useEffect } from 'react';
import { loadQuranStats, getTodayAyahsCount, formatListeningTime, QuranStats } from '../utils/statsStorage';
import { loadKhatmaPlan, getKhatmaProgressDetails, KhatmaPlan } from '../utils/khatmaStorage';

interface StatsViewerProps {
  onBackToSurahs?: () => void;
  onOpenKhatma?: () => void;
  trueDarkMode?: boolean;
}

export const StatsViewer: React.FC<StatsViewerProps> = ({ onBackToSurahs, onOpenKhatma, trueDarkMode = false }) => {
  const [stats, setStats] = useState<QuranStats>(loadQuranStats());
  const [khatmaPlan, setKhatmaPlan] = useState<KhatmaPlan>(loadKhatmaPlan());

  useEffect(() => {
    setStats(loadQuranStats());
    setKhatmaPlan(loadKhatmaPlan());
  }, []);

  const khatmaProgress = getKhatmaProgressDetails(khatmaPlan);

  const todayAyahs = getTodayAyahsCount(stats);
  const timeFormatted = formatListeningTime(stats.totalListeningSeconds || 0);

  // Motivational quote based on streak and reading
  const getMotivationalMessage = () => {
    if (stats.currentStreak >= 7) {
      return 'ما شاء الله! همّة مباركة واستمرارية رائعة، جعلها الله في ميزان حسناتك.';
    }
    if (stats.currentStreak >= 3) {
      return 'ثبات طيب، استمر في تلاوة كتاب الله والتدبر فيه كل يوم.';
    }
    if (todayAyahs > 0) {
      return 'أحسنت! خير الأعمال أدومها وإن قل، استمر في وردك اليومي.';
    }
    return 'ابدأ وردك اليوم ولو ببضع آيات، فكل حرف بحسنة والحسنة بعشر أمثالها.';
  };

  return (
    <div className={`p-6 pb-24 flex-1 overflow-y-auto page-fade-in ${trueDarkMode ? 'text-amber-100' : 'text-slate-100'}`} dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`text-xl font-bold ${trueDarkMode ? 'text-[#dfb26d]' : 'text-[#00b87c]'}`}>
            إحصائيات القراءة والاستماع
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">متابعة إنجازك اليومي وسلسلة الأيام المتتالية</p>
        </div>
        <div className={`p-2 rounded-2xl ${trueDarkMode ? 'bg-[#18140f] text-[#dfb26d]' : 'bg-[#00b87c]/10 text-[#00b87c]'}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
      </div>

      {/* Streak Hero Card */}
      <div className={`p-5 rounded-3xl border mb-6 relative overflow-hidden transition-all ${
        trueDarkMode 
          ? 'bg-gradient-to-br from-[#1a140b] via-[#120f0a] to-[#0a0805] border-amber-500/20 shadow-lg shadow-amber-950/20' 
          : 'bg-gradient-to-br from-[#0c3829] via-[#082b1f] to-[#051d14] border-[#00b87c]/30 shadow-lg shadow-black/20'
      }`}>
        <div className="flex items-center justify-between relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🔥</span>
              <span className={`text-xs font-bold uppercase tracking-wider ${trueDarkMode ? 'text-amber-400' : 'text-[#00b87c]'}`}>
                سلسلة الأيام المتتالية (Streak)
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-4xl font-extrabold ${trueDarkMode ? 'text-[#dfb26d]' : 'text-white'}`}>
                {stats.currentStreak}
              </span>
              <span className="text-sm font-medium text-slate-300">
                {stats.currentStreak === 1 ? 'يوم متواصل' : stats.currentStreak === 2 ? 'يومان' : 'أيام متتالية'}
              </span>
            </div>
          </div>

          <div className="text-left">
            <span className="text-[10px] text-slate-400 block font-medium">أطول سلسلة</span>
            <span className={`text-lg font-bold ${trueDarkMode ? 'text-amber-200' : 'text-[#00b87c]'}`}>
              {stats.bestStreak} {stats.bestStreak === 1 ? 'يوم' : 'أيام'}
            </span>
          </div>
        </div>

        {/* Motivational banner */}
        <div className="mt-4 pt-3 border-t border-white/10 text-xs text-slate-300 flex items-center gap-2">
          <svg className="w-4 h-4 text-[#dfb26d] shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
          <p className="leading-snug">{getMotivationalMessage()}</p>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {/* Ayahs Read Today */}
        <div className={`p-4 rounded-2xl border text-right transition-all ${
          trueDarkMode 
            ? 'bg-[#14120e] border-[#292218]' 
            : 'bg-[#0a2a1f] border-[#0f2d22]'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400">آيات اليوم</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl font-bold ${trueDarkMode ? 'text-[#dfb26d]' : 'text-[#00b87c]'}`}>
              {todayAyahs}
            </span>
            <span className="text-[10px] text-slate-400">آية مقروءة</span>
          </div>
          <p className="text-[9px] text-slate-500 mt-1">تحديث فوري مع كل آية</p>
        </div>

        {/* Total Listening Time */}
        <div className={`p-4 rounded-2xl border text-right transition-all ${
          trueDarkMode 
            ? 'bg-[#14120e] border-[#292218]' 
            : 'bg-[#0a2a1f] border-[#0f2d22]'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400">وقت الاستماع</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-xl font-bold ${trueDarkMode ? 'text-[#dfb26d]' : 'text-[#00b87c]'}`}>
              {timeFormatted.formatted}
            </span>
          </div>
          <p className="text-[9px] text-slate-500 mt-1">إجمالي التلاوات المستمع إليها</p>
        </div>

        {/* Total Ayahs Count */}
        <div className={`p-4 rounded-2xl border text-right transition-all ${
          trueDarkMode 
            ? 'bg-[#14120e] border-[#292218]' 
            : 'bg-[#0a2a1f] border-[#0f2d22]'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400">إجمالي الآيات</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl font-bold ${trueDarkMode ? 'text-[#dfb26d]' : 'text-[#00b87c]'}`}>
              {stats.totalAyahsCount || 0}
            </span>
            <span className="text-[10px] text-slate-400">آية مميزة</span>
          </div>
          <p className="text-[9px] text-slate-500 mt-1">من أصل 6,236 آية</p>
        </div>

        {/* Days of activity */}
        <div className={`p-4 rounded-2xl border text-right transition-all ${
          trueDarkMode 
            ? 'bg-[#14120e] border-[#292218]' 
            : 'bg-[#0a2a1f] border-[#0f2d22]'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400">أيام القراءة</span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl font-bold ${trueDarkMode ? 'text-[#dfb26d]' : 'text-[#00b87c]'}`}>
              {stats.activeDays?.length || (stats.currentStreak > 0 ? 1 : 0)}
            </span>
            <span className="text-[10px] text-slate-400">يوماً نشطاً</span>
          </div>
          <p className="text-[9px] text-slate-500 mt-1">سجل التلاوة والتفاعل</p>
        </div>
      </div>

      {/* Khatma Plan Card */}
      <div className={`p-4 rounded-2xl border mb-6 ${
        trueDarkMode ? 'bg-[#14120e] border-[#292218]' : 'bg-[#0a2a1f] border-[#0f2d22]'
      }`}>
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <span className="text-base">📖</span>
            <span className="text-xs font-bold">{khatmaPlan.title}</span>
          </div>
          {onOpenKhatma && (
            <button
              onClick={onOpenKhatma}
              className={`text-[11px] font-bold px-2.5 py-1 rounded-xl transition-colors ${
                trueDarkMode ? 'text-[#dfb26d] bg-amber-500/10 hover:bg-amber-500/20' : 'text-[#00b87c] bg-[#00b87c]/10 hover:bg-[#00b87c]/20'
              }`}
            >
              عرض خطة الختمة ➔
            </button>
          )}
        </div>

        <div className="w-full bg-black/30 h-2.5 rounded-full overflow-hidden mb-2">
          <div 
            className={`h-full transition-all duration-700 ${trueDarkMode ? 'bg-[#dfb26d]' : 'bg-[#00b87c]'}`}
            style={{ width: `${Math.max(khatmaProgress.completionPercent > 0 ? 3 : 0, khatmaProgress.completionPercent)}%` }}
          />
        </div>

        <div className="flex justify-between text-[10px] text-slate-400">
          <span>{khatmaPlan.completedJuzList.length} من 30 جزءاً ({khatmaProgress.completionPercent}%)</span>
          <span>المتبقي: {khatmaProgress.daysRemaining} يوم ({khatmaPlan.targetDays} يوماً للختمة)</span>
        </div>
      </div>

      {/* Progress to All Ayahs Bar */}
      <div className={`p-4 rounded-2xl border mb-6 ${
        trueDarkMode ? 'bg-[#14120e] border-[#292218]' : 'bg-[#0a2a1f] border-[#0f2d22]'
      }`}>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold">نسبة إنجاز آيات المصحف</span>
          <span className={`text-xs font-bold ${trueDarkMode ? 'text-[#dfb26d]' : 'text-[#00b87c]'}`}>
            {(((stats.totalAyahsCount || 0) / 6236) * 100).toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-black/30 h-2.5 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-700 ${trueDarkMode ? 'bg-[#dfb26d]' : 'bg-[#00b87c]'}`}
            style={{ width: `${Math.min(100, Math.max(1, ((stats.totalAyahsCount || 0) / 6236) * 100))}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 mt-2">
          <span>{stats.totalAyahsCount || 0} آية تمت قراءتها</span>
          <span>المتبقي: {Math.max(0, 6236 - (stats.totalAyahsCount || 0))} آية</span>
        </div>
      </div>

      {/* Quick Action to return to Quran */}
      {onBackToSurahs && (
        <button
          onClick={onBackToSurahs}
          className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            trueDarkMode 
              ? 'bg-[#dfb26d] text-[#12110e] hover:bg-[#ebd095]' 
              : 'bg-[#00b87c] text-white hover:bg-[#00a86b]'
          }`}
        >
          <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          متابعة تلاوة القرآن الكريم
        </button>
      )}
    </div>
  );
};
