import React, { useState, useEffect } from 'react';
import { 
  loadKhatmaPlan, 
  saveKhatmaPlan, 
  getKhatmaProgressDetails, 
  getTodayDateString, 
  KhatmaPlan 
} from '../utils/khatmaStorage';

interface KhatmaTrackerProps {
  onBackToSurahs?: () => void;
  onSelectJuzAyah?: (surahNumber: number, ayahNumber: number) => void;
  trueDarkMode?: boolean;
}

const JUZ_MAPPING: Record<number, { s: number, a: number, name: string }> = {
  1: { s: 1, a: 1, name: "الم (الفاتحة والبقرة)" },
  2: { s: 2, a: 142, name: "سيقول السفهاء" },
  3: { s: 2, a: 253, name: "تلك الرسل" },
  4: { s: 3, a: 93, name: "لن تنالوا البر" },
  5: { s: 4, a: 24, name: "والمحصنات" },
  6: { s: 4, a: 148, name: "لا يحب الله" },
  7: { s: 5, a: 82, name: "لتجدن أشد الناس" },
  8: { s: 6, a: 111, name: "ولو أننا نزلنا" },
  9: { s: 7, a: 88, name: "قال الملأ" },
  10: { s: 8, a: 41, name: "واعلموا أنما" },
  11: { s: 9, a: 93, name: "يعتذرون إليكم" },
  12: { s: 11, a: 6, name: "وما من دابة" },
  13: { s: 12, a: 53, name: "وما أبرئ نفسي" },
  14: { s: 14, a: 1, name: "الر (إبراهيم والحجر)" },
  15: { s: 15, a: 1, name: "سبحان الذي أسرى" },
  16: { s: 17, a: 1, name: "قال ألم أقل لك" },
  17: { s: 18, a: 75, name: "اقترب للناس" },
  18: { s: 22, a: 1, name: "قد أفلح المؤمنون" },
  19: { s: 25, a: 21, name: "وقال الذين لا يرجون" },
  20: { s: 27, a: 56, name: "فما كان جواب قومه" },
  21: { s: 29, a: 46, name: "ولا تجادلوا" },
  22: { s: 33, a: 31, name: "ومن يقنت منكن" },
  23: { s: 36, a: 28, name: "وما أنزلنا على قومه" },
  24: { s: 39, a: 32, name: "فمن أظلم" },
  25: { s: 41, a: 47, name: "إليه يرد علم الساعة" },
  26: { s: 46, a: 1, name: "حم (الأحقاف)" },
  27: { s: 51, a: 31, name: "قال فما خطبكم" },
  28: { s: 58, a: 1, name: "قد سمع الله" },
  29: { s: 67, a: 1, name: "تبارك الذي بيده الملك" },
  30: { s: 78, a: 1, name: "عم يتساءلون" }
};

export const KhatmaTracker: React.FC<KhatmaTrackerProps> = ({
  onBackToSurahs,
  onSelectJuzAyah,
  trueDarkMode = false
}) => {
  const [plan, setPlan] = useState<KhatmaPlan>(loadKhatmaPlan());
  const [isEditing, setIsEditing] = useState(false);
  const [targetDaysInput, setTargetDaysInput] = useState<number>(plan.targetDays);
  const [planTitleInput, setPlanTitleInput] = useState<string>(plan.title);

  useEffect(() => {
    setPlan(loadKhatmaPlan());
  }, []);

  const progress = getKhatmaProgressDetails(plan);

  const handleToggleJuz = (juzNum: number) => {
    const isCompleted = plan.completedJuzList.includes(juzNum);
    let nextList: number[];
    if (isCompleted) {
      nextList = plan.completedJuzList.filter(j => j !== juzNum);
    } else {
      nextList = [...plan.completedJuzList, juzNum].sort((a, b) => a - b);
    }

    const nextCurrentJuz = nextList.length >= 30 
      ? 30 
      : (Math.max(1, ...nextList, 0) + 1 <= 30 ? Math.max(1, ...nextList, 0) + 1 : 30);

    const updatedPlan: KhatmaPlan = {
      ...plan,
      completedJuzList: nextList,
      currentJuz: nextCurrentJuz,
      isFinished: nextList.length >= 30
    };

    setPlan(updatedPlan);
    saveKhatmaPlan(updatedPlan);
  };

  const handleSavePlanSettings = () => {
    const days = Math.max(1, targetDaysInput || 30);
    const updatedPlan: KhatmaPlan = {
      ...plan,
      title: planTitleInput.trim() || 'ختمة القرآن الكريم',
      targetDays: days,
      dailyJuzGoal: Number((30 / days).toFixed(2))
    };
    setPlan(updatedPlan);
    saveKhatmaPlan(updatedPlan);
    setIsEditing(false);
  };

  const handleResetKhatma = () => {
    if (window.confirm('هل أنت متأكد من رغبتك في بدء ختمة جديدة وتصفير الإنجاز الحالي؟')) {
      const resetPlan: KhatmaPlan = {
        ...plan,
        startDate: getTodayDateString(),
        completedJuzList: [],
        currentJuz: 1,
        isFinished: false
      };
      setPlan(resetPlan);
      saveKhatmaPlan(resetPlan);
    }
  };

  const planPresets = [
    { label: 'ختمة في 10 أيام (3 أجزاء يومياً)', days: 10 },
    { label: 'ختمة في 15 يوماً (جزءان يومياً)', days: 15 },
    { label: 'ختمة في شهر (جزء يومياً)', days: 30 },
    { label: 'ختمة في 60 يوماً (نصف جزء يومياً)', days: 60 }
  ];

  return (
    <div className={`p-6 pb-24 flex-1 overflow-y-auto page-fade-in ${trueDarkMode ? 'text-amber-100' : 'text-slate-100'}`} dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className={`text-xl font-bold ${trueDarkMode ? 'text-[#dfb26d]' : 'text-[#00b87c]'}`}>
            متابعة ختمة القرآن الكريم
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">خطتك المخصصة لختم كتاب الله وتتبع الأجزاء</p>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
            isEditing
              ? (trueDarkMode ? 'bg-[#dfb26d] text-black border-[#dfb26d]' : 'bg-[#00b87c] text-white border-[#00b87c]')
              : (trueDarkMode ? 'bg-[#18140f] text-[#dfb26d] border-[#292218]' : 'bg-[#00b87c]/10 text-[#00b87c] border-[#00b87c]/20 hover:bg-[#00b87c]/20')
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span>{isEditing ? 'إغلاق الخطة' : 'تعديل الخطة'}</span>
        </button>
      </div>

      {/* Plan Settings Form (Collapsible) */}
      {isEditing && (
        <div className={`p-5 rounded-3xl border mb-6 animate-fadeIn transition-all ${
          trueDarkMode 
            ? 'bg-[#181510] border-[#292218] text-amber-100' 
            : 'bg-[#0a2a1f] border-[#0f2d22] text-white'
        }`}>
          <h3 className="text-sm font-bold mb-3 text-[#dfb26d]">تحديد خطة الختمة</h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1.5">اسم الختمة أو النية</label>
              <input
                type="text"
                value={planTitleInput}
                onChange={(e) => setPlanTitleInput(e.target.value)}
                placeholder="مثال: ختمة رمضان المبارك"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none ${
                  trueDarkMode ? 'bg-[#0f0d0a] border-neutral-700 text-amber-100' : 'bg-[#051d14] border-white/10 text-white'
                }`}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1.5">المدة المرغوبة لإنهاء الختمة (بالأيام)</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={targetDaysInput}
                  onChange={(e) => setTargetDaysInput(parseInt(e.target.value) || 30)}
                  className={`w-28 px-3.5 py-2.5 rounded-xl border text-sm font-bold outline-none text-center ${
                    trueDarkMode ? 'bg-[#0f0d0a] border-neutral-700 text-[#dfb26d]' : 'bg-[#051d14] border-white/10 text-[#00b87c]'
                  }`}
                />
                <span className="text-xs text-slate-300">
                  {targetDaysInput > 0 ? `(المطلوب: ${(30 / targetDaysInput).toFixed(1)} جزء يومياً تقريباً)` : ''}
                </span>
              </div>
            </div>

            {/* Presets */}
            <div>
              <span className="text-[11px] text-slate-400 block mb-2 font-medium">خطط جاهزة شائعة:</span>
              <div className="grid grid-cols-2 gap-2">
                {planPresets.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setTargetDaysInput(p.days)}
                    className={`p-2 rounded-xl border text-[11px] font-bold transition-all text-right ${
                      targetDaysInput === p.days
                        ? (trueDarkMode ? 'bg-[#dfb26d] text-black border-[#dfb26d]' : 'bg-[#00b87c] text-white border-[#00b87c]')
                        : (trueDarkMode ? 'bg-[#100e0b] border-neutral-800 text-neutral-300 hover:border-neutral-700' : 'bg-[#062117] border-white/5 text-slate-300 hover:border-white/20')
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={handleSavePlanSettings}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  trueDarkMode ? 'bg-[#dfb26d] text-[#12110e] hover:bg-[#ebd095]' : 'bg-[#00b87c] text-white hover:bg-[#00d892]'
                }`}
              >
                حفظ خطة الختمة
              </button>
              <button
                onClick={handleResetKhatma}
                className="py-2.5 px-4 rounded-xl text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-all"
              >
                بدء ختمة جديدة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Khatma Hero Card with Progress */}
      <div className={`p-5 rounded-3xl border mb-6 relative overflow-hidden transition-all ${
        trueDarkMode 
          ? 'bg-gradient-to-br from-[#1a140b] via-[#120f0a] to-[#0a0805] border-amber-500/20 shadow-lg shadow-amber-950/20' 
          : 'bg-gradient-to-br from-[#0c3829] via-[#082b1f] to-[#051d14] border-[#00b87c]/30 shadow-lg shadow-black/20'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-[10px] text-slate-400 font-medium block">خطة الختمة الحالية</span>
            <h3 className={`text-lg font-extrabold ${trueDarkMode ? 'text-[#dfb26d]' : 'text-white'}`}>
              {plan.title}
            </h3>
          </div>
          <div className="text-left">
            <span className={`text-2xl font-extrabold ${trueDarkMode ? 'text-[#dfb26d]' : 'text-[#00b87c]'}`}>
              {progress.completionPercent}%
            </span>
            <span className="text-[10px] text-slate-400 block font-medium">نسبة الإنجاز</span>
          </div>
        </div>

        {/* Big Progress Bar */}
        <div className="w-full bg-black/40 h-3.5 rounded-full overflow-hidden p-0.5 border border-white/10 mb-4">
          <div 
            className={`h-full rounded-full transition-all duration-700 ${
              trueDarkMode 
                ? 'bg-gradient-to-r from-amber-600 via-amber-400 to-[#dfb26d]' 
                : 'bg-gradient-to-r from-emerald-600 via-[#00b87c] to-[#00e69d]'
            }`}
            style={{ width: `${Math.max(progress.completionPercent > 0 ? 3 : 0, progress.completionPercent)}%` }}
          />
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-white/10">
          <div className="p-2 rounded-2xl bg-black/20">
            <span className="text-[10px] text-slate-400 block">الأجزاء المنجزة</span>
            <span className={`text-sm font-extrabold ${trueDarkMode ? 'text-amber-200' : 'text-[#00b87c]'}`}>
              {plan.completedJuzList.length} / 30
            </span>
          </div>

          <div className="p-2 rounded-2xl bg-black/20">
            <span className="text-[10px] text-slate-400 block">الهدف اليومي</span>
            <span className={`text-sm font-extrabold ${trueDarkMode ? 'text-amber-200' : 'text-[#00b87c]'}`}>
              {plan.targetDays > 0 ? (30 / plan.targetDays).toFixed(1) : 1} جزء
            </span>
          </div>

          <div className="p-2 rounded-2xl bg-black/20">
            <span className="text-[10px] text-slate-400 block">الأيام المتبقية</span>
            <span className={`text-sm font-extrabold ${trueDarkMode ? 'text-amber-200' : 'text-[#00b87c]'}`}>
              {progress.daysRemaining} يوم
            </span>
          </div>
        </div>

        {/* Motivational Status Note */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span>{plan.completedJuzList.length >= 30 ? '🎉' : progress.isAhead ? '✨' : '📖'}</span>
            <span className="text-slate-300">
              {plan.completedJuzList.length >= 30 
                ? 'هنيئاً لك ختم كتاب الله الكريم! تقبل الله طاعاتكم.' 
                : progress.isAhead 
                  ? 'أنت متقدم على جدولك الزمني اليومي، استمر في هذا الأداء المبارك!'
                  : `أنت اليوم في اليوم (${progress.daysPassed})، حاول قراءة الجزء (${progress.expectedJuzToday}) للحفاظ على الجدول.`}
            </span>
          </div>
        </div>
      </div>

      {/* Juz Grid Tracker (الأجزاء الثلاثين) */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className={`text-sm font-bold ${trueDarkMode ? 'text-[#dfb26d]' : 'text-[#00b87c]'}`}>
            جدول أجزاء القرآن الكريم (30 جزءاً)
          </h4>
          <span className="text-[10px] text-slate-400">اضغط لتحديد إتمام الجزء أو بدء قراءته</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {Array.from({ length: 30 }, (_, i) => i + 1).map((juzNum) => {
            const isDone = plan.completedJuzList.includes(juzNum);
            const mapping = JUZ_MAPPING[juzNum];

            return (
              <div
                key={juzNum}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                  isDone
                    ? (trueDarkMode 
                        ? 'bg-[#1f1910] border-amber-500/40 shadow-sm shadow-amber-950/20' 
                        : 'bg-[#082a1e] border-[#00b87c]/40 shadow-sm shadow-[#00b87c]/10')
                    : (trueDarkMode 
                        ? 'bg-[#12100d] border-[#221c14] hover:border-neutral-700' 
                        : 'bg-[#0a2a1f] border-[#0f2d22] hover:border-[#00b87c]/30')
                }`}
              >
                <div 
                  className="flex-1 cursor-pointer pr-1"
                  onClick={() => {
                    if (onSelectJuzAyah && mapping) {
                      onSelectJuzAyah(mapping.s, mapping.a);
                    }
                  }}
                  title="الانتقال إلى قراءة هذا الجزء في المصحف"
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${isDone ? (trueDarkMode ? 'text-[#dfb26d]' : 'text-[#00b87c]') : 'text-slate-200'}`}>
                      الجزء {juzNum}
                    </span>
                    {isDone && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-400 font-bold">
                        مكتمل
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 truncate max-w-[140px] mt-0.5">
                    {mapping ? mapping.name : ''}
                  </p>
                </div>

                {/* Checkbox button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleJuz(juzNum);
                  }}
                  className={`w-7 h-7 rounded-xl border flex items-center justify-center transition-all shrink-0 ${
                    isDone
                      ? (trueDarkMode 
                          ? 'bg-[#dfb26d] text-black border-[#dfb26d]' 
                          : 'bg-[#00b87c] text-white border-[#00b87c]')
                      : (trueDarkMode 
                          ? 'border-neutral-700 text-transparent hover:border-neutral-500' 
                          : 'border-white/20 text-transparent hover:border-white/40')
                  }`}
                  title={isDone ? 'إلغاء تحديد الإتمام' : 'تحديد الجزء كمكتمل'}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Return to Quran Button */}
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
