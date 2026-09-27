import React, { useEffect, useRef, useState } from 'react';
import { Ayah, Surah, AppSettings, FavoriteAyah, BookmarkAyah, MemorizationState, Reciter } from '../types';
import { AUDIO_BASE_URL } from '../constants';

interface QuranViewerProps {
  surah: Surah | null;
  ayahs: Ayah[];
  currentAyahIndex: number;
  onAyahClick: (index: number) => void;
  isLoading: boolean;
  settings: AppSettings;
  favorites: FavoriteAyah[];
  onToggleFavorite: (ayah: Ayah) => void;
  bookmarks: BookmarkAyah[];
  onToggleBookmark: (ayah: Ayah) => void;
  memorization?: MemorizationState;
  reciter: Reciter;
}

export const QuranViewer: React.FC<QuranViewerProps> = ({ 
  surah, 
  ayahs, 
  currentAyahIndex, 
  onAyahClick,
  isLoading,
  settings,
  favorites,
  onToggleFavorite,
  bookmarks,
  onToggleBookmark,
  memorization,
  reciter
}) => {
  const activeAyahRef = useRef<HTMLDivElement>(null);
  const [showTafsirAyahIndex, setShowTafsirAyahIndex] = useState<number | null>(null);

  useEffect(() => {
    if (activeAyahRef.current) {
      activeAyahRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentAyahIndex]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#051d14]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00b87c]"></div>
      </div>
    );
  }

  const shouldHideText = memorization?.isActive && memorization?.hideAyahs;

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-12 transition-colors duration-300 bg-[#051d14] pb-10">
      <div className="max-w-4xl mx-auto">
        {surah && surah.number !== 9 && surah.number !== 1 && (
          <div className="text-center mb-16 quran-text text-slate-300 opacity-90" style={{ fontSize: `${settings.fontSize}px` }}>
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </div>
        )}

        <div className="flex flex-col gap-12 text-right">
          {ayahs.map((ayah, index) => {
            const isFav = favorites.some(f => f.surahNumber === surah?.number && f.ayahNumberInSurah === ayah.numberInSurah);
            const isBm = bookmarks.some(b => b.surahNumber === surah?.number && b.ayahNumberInSurah === ayah.numberInSurah);
            const isTafsirVisible = showTafsirAyahIndex === index;

            // استخدام خادم Islamic Network لروابط التحميل لأنه أكثر استقراراً لفرز الآيات
            const downloadUrl = `https://cdn.islamic.network/quran/audio/128/${reciter.identifier}/${ayah.number}.mp3`;

            return (
              <div
                key={ayah.number}
                ref={index === currentAyahIndex ? activeAyahRef : null}
                className="relative group flex flex-col items-center w-full"
              >
                <div
                  onClick={() => onAyahClick(index)}
                  className={`inline-block px-4 py-4 rounded-3xl transition-all duration-500 cursor-pointer relative w-full text-center ${
                    index === currentAyahIndex 
                      ? 'bg-[#00b87c]/10 shadow-lg shadow-[#00b87c]/5 ring-1 ring-[#00b87c]/30' 
                      : 'hover:bg-white/5'
                  } quran-text`}
                  style={{ 
                    color: index === currentAyahIndex ? '#00b87c' : '#ffffff',
                    fontSize: `${settings.fontSize}px`,
                    lineHeight: `${settings.fontSize * 2.2}px`
                  }}
                >
                  <span className={`${shouldHideText ? 'blur-lg select-none grayscale' : ''} transition-all duration-700`}>
                    {ayah.text}
                  </span>
                  
                  {/* Quick Actions for Ayah */}
                  <div className={`absolute -top-12 left-1/2 -translate-x-1/2 flex gap-2 bg-[#0a2a1f] p-1.5 rounded-full border border-[#0f2d22] transition-all z-20 ${index === currentAyahIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onToggleFavorite(ayah); }}
                      className={`p-1.5 rounded-full transition-colors ${isFav ? 'text-[#dfb26d] bg-[#dfb26d]/10' : 'text-slate-500 hover:text-white'}`}
                      title="المفضلة"
                    >
                      <svg className="w-4 h-4" fill={isFav ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onToggleBookmark(ayah); }}
                      className={`p-1.5 rounded-full transition-colors ${isBm ? 'text-[#00b87c] bg-[#00b87c]/10' : 'text-slate-500 hover:text-white'}`}
                      title="علامة مرجعية"
                    >
                      <svg className="w-4 h-4" fill={isBm ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowTafsirAyahIndex(isTafsirVisible ? null : index); }}
                      className={`p-1.5 rounded-full transition-colors ${isTafsirVisible ? 'text-primary-green bg-primary-green/10' : 'text-slate-500 hover:text-white'}`}
                      title="التفسير"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                    </button>
                    <a 
                      href={downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 rounded-full transition-colors text-slate-500 hover:text-white"
                      title="تحميل الآية"
                      download={`Ayah_${ayah.number}.mp3`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    </a>
                  </div>

                  <span className="inline-flex items-center justify-center mx-4 relative"
                    style={{ 
                      width: `${settings.fontSize * 1.4}px`, 
                      height: `${settings.fontSize * 1.4}px`,
                      verticalAlign: 'middle'
                    }}
                  >
                    <div className="absolute inset-0 bg-[#0a2a1f] star-8 border border-[#00b87c]/30"></div>
                    <span className="relative text-[#00b87c] font-bold" style={{ fontSize: `${settings.fontSize * 0.4}px` }}>
                      {ayah.numberInSurah}
                    </span>
                  </span>
                </div>

                {/* Tafsir Card */}
                {isTafsirVisible && ayah.tafsir && (
                  <div className="w-full mt-4 bg-[#0a2a1f] border border-primary-green/20 rounded-2xl p-6 shadow-xl animate-fadeIn text-right" dir="rtl">
                    <div className="flex items-center gap-2 mb-3 text-primary-green">
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                       <span className="font-bold text-xs uppercase tracking-widest">التفسير (الجلالين)</span>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">{ayah.tafsir}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};