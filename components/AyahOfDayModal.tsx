import React, { useState } from 'react';
import { Ayah, Surah } from '../types';

export interface DailyAyahData {
  surahNumber: number;
  surahName: string;
  ayahNumberInSurah: number;
  text: string;
  tafsir?: string;
}

interface AyahOfDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  ayahData: DailyAyahData | null;
  onGoToAyah?: (surahNumber: number, ayahNumberInSurah: number) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  trueDarkMode?: boolean;
}

export const AyahOfDayModal: React.FC<AyahOfDayModalProps> = ({
  isOpen,
  onClose,
  ayahData,
  onGoToAyah,
  onRefresh,
  isLoading = false,
  trueDarkMode = false
}) => {
  if (!isOpen) return null;

  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (!ayahData) return;
    const shareText = `﴿ ${ayahData.text} ﴾\n[سورة ${ayahData.surahName} - الآية ${ayahData.ayahNumberInSurah}]\n\nتمت المشاركة من تطبيق القرآن الكريم الرقمي`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `آية اليوم: سورة ${ayahData.surahName}`,
          text: shareText
        });
        return;
      } catch (e) {
        // User cancelled or share API declined, fallback to clipboard
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch {}
    }
  };

  return (
    <div className="absolute inset-0 z-[120] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div 
        className={`relative w-full max-w-sm rounded-3xl p-6 shadow-2xl border transition-all text-right animate-fadeIn ${
          trueDarkMode 
            ? 'bg-[#12110e] border-[#382d1c] text-amber-100 shadow-amber-950/40' 
            : 'bg-[#06261a] border-[#00b87c]/30 text-white shadow-black/60'
        }`}
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-2xl ${trueDarkMode ? 'bg-amber-500/20 text-[#dfb26d]' : 'bg-[#00b87c]/20 text-[#00b87c]'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div>
              <h3 className={`text-base font-extrabold ${trueDarkMode ? 'text-[#dfb26d]' : 'text-[#00b87c]'}`}>
                آية اليوم
              </h3>
              <p className="text-[10px] text-slate-400">تلاوة وتدبر من كتاب الله الحكيم</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isLoading}
                className={`p-1.5 rounded-xl border border-white/5 transition-all text-slate-400 hover:text-white ${
                  trueDarkMode ? 'hover:bg-neutral-800' : 'hover:bg-[#0a2a1f]'
                } ${isLoading ? 'animate-spin opacity-50' : ''}`}
                title="آية عشوائية أخرى"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
            <button
              onClick={onClose}
              className={`p-1.5 rounded-xl border border-white/5 text-slate-400 hover:text-white transition-colors ${
                trueDarkMode ? 'hover:bg-neutral-800' : 'hover:bg-[#0a2a1f]'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        {isLoading || !ayahData ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <div className={`w-8 h-8 rounded-full border-2 border-t-transparent animate-spin ${
              trueDarkMode ? 'border-[#dfb26d]' : 'border-[#00b87c]'
            }`} />
            <span className="text-xs text-slate-400">جاري اختيار آية مباركة...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Ayah Card */}
            <div className={`p-5 rounded-2xl border text-center relative overflow-hidden ${
              trueDarkMode 
                ? 'bg-[#18140e] border-[#2e2417]' 
                : 'bg-[#093323] border-[#0e4732]'
            }`}>
              <div className="text-amber-400/20 text-4xl font-serif absolute -top-1 right-2 select-none">“</div>
              <p className={`quran-text text-xl sm:text-2xl leading-[2.2] py-2 font-normal ${
                trueDarkMode ? 'text-amber-100' : 'text-emerald-50'
              }`}>
                {ayahData.text}
              </p>
              <div className="text-amber-400/20 text-4xl font-serif absolute -bottom-4 left-2 select-none">”</div>
            </div>

            {/* Surah Reference Tag */}
            <div className="flex items-center justify-between text-xs px-1">
              <span className={`font-bold ${trueDarkMode ? 'text-[#dfb26d]' : 'text-[#00b87c]'}`}>
                سورة {ayahData.surahName}
              </span>
              <span className="text-slate-400 font-medium">
                الآية {ayahData.ayahNumberInSurah}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={handleShare}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md ${
                  copied 
                    ? 'bg-emerald-600 text-white' 
                    : (trueDarkMode 
                        ? 'bg-[#dfb26d] text-black hover:bg-[#ebd095]' 
                        : 'bg-[#00b87c] text-white hover:bg-[#00d892]')
                }`}
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>تم النسخ بنجاح!</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    <span>مشاركة الآية</span>
                  </>
                )}
              </button>

              {onGoToAyah && (
                <button
                  type="button"
                  onClick={() => {
                    onGoToAyah(ayahData.surahNumber, ayahData.ayahNumberInSurah);
                    onClose();
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                    trueDarkMode 
                      ? 'bg-[#1a1712] border-neutral-700 text-neutral-200 hover:border-neutral-500' 
                      : 'bg-[#0a2a1f] border-white/10 text-slate-200 hover:bg-[#0f3829]'
                  }`}
                >
                  <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                  <span>قراءة في المصحف</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
