import React, { useEffect, useRef, useState } from 'react';
import { Ayah, Surah, AppSettings, FavoriteAyah, BookmarkAyah, MemorizationState, Reciter } from '../types';
import { AUDIO_BASE_URL, TAFSIR_EDITIONS, DEFAULT_SETTINGS } from '../constants';
import { 
  saveAyahAudio, 
  isAyahAudioDownloaded, 
  downloadSurahAudio, 
  getSurahAudioStatus, 
  deleteSurahAudio 
} from '../utils/audioStorage';

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
  const [downloadedAyahs, setDownloadedAyahs] = useState<Record<number, boolean>>({});
  const [surahAudioStatus, setSurahAudioStatus] = useState<{ isComplete: boolean; downloadedCount: number; total: number }>({
    isComplete: false,
    downloadedCount: 0,
    total: 0
  });
  const [isDownloadingSurah, setIsDownloadingSurah] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{ pct: number; current: number; total: number }>({
    pct: 0,
    current: 0,
    total: 0
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const surAudioIsComplete = (status: { isComplete: boolean; downloadedCount: number; total: number }) => {
    return status.isComplete || (status.downloadedCount >= status.total && status.total > 0);
  };

  useEffect(() => {
    if (activeAyahRef.current) {
      activeAyahRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentAyahIndex]);

  // Refresh status of downloaded ayahs & surah audio completeness
  const refreshAudioStatus = async () => {
    if (!surah) return;
    const countStatus = await getSurahAudioStatus(reciter, surah.number, surah.numberOfAyahs);
    setSurahAudioStatus(countStatus);

    const statusMap: Record<number, boolean> = {};
    for (const ayah of ayahs) {
      const isDown = await isAyahAudioDownloaded(reciter.id, surah.number, ayah.numberInSurah);
      statusMap[ayah.numberInSurah] = isDown;
    }
    setDownloadedAyahs(statusMap);
  };

  useEffect(() => {
    if (!surah) return;
    refreshAudioStatus();
  }, [surah?.number, ayahs.length, reciter.id]);

  const handleDownloadFullSurah = async () => {
    if (!surah || isDownloadingSurah) return;
    setIsDownloadingSurah(true);
    setDownloadProgress({ pct: 0, current: 0, total: surah.numberOfAyahs });

    try {
      await downloadSurahAudio(reciter, surah.number, surah.numberOfAyahs, (pct, current, total) => {
        setDownloadProgress({ pct, current, total });
      });
      await refreshAudioStatus();
      showToast(`تم تحميل تلاوة سورة ${surah.name} كاملة أوفلاين بصوت (${reciter.name}) بنجاح!`);
    } catch (e) {
      showToast('حدث خطأ أثناء تحميل التلاوة. يرجى التحقق من الاتصال والمحاولة مجدداً.');
    } finally {
      setIsDownloadingSurah(false);
    }
  };

  const handleDeleteSurahAudio = async () => {
    if (!surah) return;
    if (!window.confirm(`هل تريد حذف الصوت المحفوظ لسورة ${surah.name} بصوت (${reciter.name})؟`)) return;
    await deleteSurahAudio(reciter, surah.number, surah.numberOfAyahs);
    await refreshAudioStatus();
    showToast(`تم حذف الصوت المحفوظ لسورة ${surah.name}`);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#051d14]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00b87c]"></div>
      </div>
    );
  }

  const shouldHideText = memorization?.isActive && memorization?.hideAyahs;

  const handleManualDownloadAyah = async (e: React.MouseEvent, ayah: Ayah) => {
    e.stopPropagation();
    if (!surah) return;
    const sStr = surah.number.toString().padStart(3, '0');
    const aStr = ayah.numberInSurah.toString().padStart(3, '0');
    const audioUrl = `${AUDIO_BASE_URL}/${reciter.subfolder}/${sStr}${aStr}.mp3`;

    try {
      const res = await fetch(audioUrl);
      if (res.ok) {
        const blob = await res.blob();
        await saveAyahAudio(reciter, surah.number, ayah.numberInSurah, blob, audioUrl, ayah.number);
        setDownloadedAyahs(prev => ({ ...prev, [ayah.numberInSurah]: true }));
        setSurahAudioStatus(prev => ({ ...prev, downloadedCount: prev.downloadedCount + 1 }));
        showToast(`تم حفظ الآية (${ayah.numberInSurah}) أوفلاين بصوت (${reciter.name})`);
      }
    } catch (err) {
      showToast('تعذر تنزيل الآية حالياً. تأكد من الاتصال بالإنترنت للمرة الأولى.');
    }
  };

  const isTrueDark = !!settings.trueDarkMode;

  return (
    <div 
      className={`flex-1 overflow-y-auto p-4 md:p-10 transition-colors duration-500 pb-16 relative ${
        isTrueDark ? 'bg-[#000000]' : 'bg-[#051d14]'
      }`}
      style={{
        backgroundColor: settings.backgroundColor !== DEFAULT_SETTINGS.backgroundColor 
          ? settings.backgroundColor 
          : (isTrueDark ? '#000000' : '#051d14')
      }}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#00b87c] text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-2xl animate-fadeIn flex items-center gap-2 border border-white/20">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* Offline Audio Management Card for the Surah */}
        {surah && (
          <div 
            className={`mb-6 p-3.5 rounded-2xl border transition-all text-right ${
              isTrueDark 
                ? 'bg-[#12100d] border-[#292218]' 
                : 'bg-[#09261c] border-[#133b2c]'
            }`}
            dir="rtl"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  surAudioIsComplete(surahAudioStatus)
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {surAudioIsComplete(surahAudioStatus) ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">تلاوة سورة {surah.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold ${
                      isTrueDark ? 'bg-[#dfb26d]/20 text-[#dfb26d]' : 'bg-[#00b87c]/20 text-[#00b87c]'
                    }`}>
                      {reciter.name}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {surAudioIsComplete(surahAudioStatus) ? (
                      <span className="text-emerald-400 font-semibold">
                        ✅ تلاوة السورة كاملة محفوظة أوفلاين في جهازك ({surahAudioStatus.downloadedCount} آية) وتعمل بدون نت
                      </span>
                    ) : surahAudioStatus.downloadedCount > 0 ? (
                      <span>
                        تم حفظ <strong className="text-[#00b87c]">{surahAudioStatus.downloadedCount}</strong> من أصل {surah.numberOfAyahs} آية أوفلاين
                      </span>
                    ) : (
                      <span>التلاوة غير محفوظة أوفلاين بعد، يمكنك تحميلها الآن لتعمل بدون نت</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                {isDownloadingSurah ? (
                  <div className="flex items-center gap-2 bg-black/30 px-3.5 py-1.5 rounded-xl border border-white/10 w-full sm:w-auto justify-center">
                    <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs font-bold text-amber-300">
                      جاري التحميل ({downloadProgress.current}/{downloadProgress.total}) {downloadProgress.pct}%
                    </span>
                  </div>
                ) : surAudioIsComplete(surahAudioStatus) ? (
                  <button
                    onClick={handleDeleteSurahAudio}
                    className="text-[10px] text-red-300 hover:text-red-200 bg-red-950/30 hover:bg-red-950/60 border border-red-500/20 px-3 py-1.5 rounded-xl font-bold transition-all"
                    title="حذف الصوت لتفريغ المساحة"
                  >
                    حذف المحفوظ أوفلاين
                  </button>
                ) : (
                  <button
                    onClick={handleDownloadFullSurah}
                    className={`text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5 w-full sm:w-auto justify-center ${
                      isTrueDark 
                        ? 'bg-[#dfb26d] hover:bg-[#ebd095] text-[#12110e]' 
                        : 'bg-[#00b87c] hover:bg-[#00d892] text-white'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    <span>تحميل تلاوة السورة كاملة أوفلاين</span>
                  </button>
                )}
              </div>
            </div>

            {/* Live Progress Bar if downloading */}
            {isDownloadingSurah && (
              <div className="mt-2.5 pt-2 border-t border-white/5">
                <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#00b87c] h-full transition-all duration-200" 
                    style={{ width: `${downloadProgress.pct}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {surah && surah.number !== 9 && surah.number !== 1 && (
          <div 
            className={`text-center mb-16 quran-text transition-colors duration-500 ${
              isTrueDark ? 'text-[#a3947c] opacity-80' : 'text-slate-300 opacity-90'
            }`} 
            style={{ fontSize: `${settings.fontSize}px` }}
          >
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

            // Active & idle color computation taking True Dark Mode into account
            let defaultTextColor = isTrueDark ? '#d6c7a9' : '#ffffff';
            if (settings.textColor !== DEFAULT_SETTINGS.textColor) {
              defaultTextColor = settings.textColor;
            }
            const activeTextColor = isTrueDark ? '#dfb26d' : '#00b87c';

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
                      ? (isTrueDark 
                          ? 'bg-[#dfb26d]/10 shadow-lg shadow-[#dfb26d]/5 ring-1 ring-[#dfb26d]/30' 
                          : 'bg-[#00b87c]/10 shadow-lg shadow-[#00b87c]/5 ring-1 ring-[#00b87c]/30')
                      : (isTrueDark ? 'hover:bg-neutral-900/60' : 'hover:bg-white/5')
                  } quran-text`}
                  style={{ 
                    color: index === currentAyahIndex ? activeTextColor : defaultTextColor,
                    fontSize: `${settings.fontSize}px`,
                    lineHeight: `${settings.fontSize * 2.2}px`
                  }}
                >
                  <span className={`${shouldHideText ? 'blur-lg select-none grayscale' : ''} transition-all duration-700`}>
                    {ayah.text}
                  </span>
                  
                  {/* Quick Actions for Ayah */}
                  <div className={`absolute -top-12 left-1/2 -translate-x-1/2 flex gap-2 ${
                    isTrueDark ? 'bg-[#14120e] border-[#2c2419]' : 'bg-[#0a2a1f] border-[#0f2d22]'
                  } p-1.5 rounded-full border transition-all z-20 ${index === currentAyahIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onToggleFavorite(ayah); }}
                      className={`p-1.5 rounded-full transition-colors ${isFav ? 'text-[#dfb26d] bg-[#dfb26d]/10' : 'text-slate-500 hover:text-white'}`}
                      title="المفضلة"
                    >
                      <svg className="w-4 h-4" fill={isFav ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onToggleBookmark(ayah); }}
                      className={`p-1.5 rounded-full transition-colors ${
                        isBm 
                          ? (isTrueDark ? 'text-[#dfb26d] bg-[#dfb26d]/10' : 'text-[#00b87c] bg-[#00b87c]/10')
                          : 'text-slate-500 hover:text-white'
                      }`}
                      title="علامة مرجعية"
                    >
                      <svg className="w-4 h-4" fill={isBm ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowTafsirAyahIndex(isTafsirVisible ? null : index); }}
                      className={`p-1.5 rounded-full transition-colors ${
                        isTafsirVisible 
                          ? (isTrueDark ? 'text-[#dfb26d] bg-[#dfb26d]/10' : 'text-primary-green bg-primary-green/10')
                          : 'text-slate-500 hover:text-white'
                      }`}
                      title="التفسير"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                    </button>
                    <button 
                      onClick={(e) => handleManualDownloadAyah(e, ayah)}
                      className={`p-1.5 rounded-full transition-colors ${
                        downloadedAyahs[ayah.numberInSurah]
                          ? (isTrueDark ? 'text-[#dfb26d] bg-[#dfb26d]/15' : 'text-[#00b87c] bg-[#00b87c]/15')
                          : 'text-slate-500 hover:text-white'
                      }`}
                      title={downloadedAyahs[ayah.numberInSurah] ? `محفوظة أوفلاين في مجلد (${reciter.name})` : `حفظ الآية أوفلاين في مجلد (${reciter.name})`}
                    >
                      {downloadedAyahs[ayah.numberInSurah] ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      )}
                    </button>
                    <a 
                      href={downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 rounded-full transition-colors text-slate-500 hover:text-[#dfb26d]"
                      title="تنزيل كملف MP3 على الجهاز"
                      download={`Ayah_${ayah.number}.mp3`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </a>
                  </div>

                  <span className="inline-flex items-center justify-center mx-4 relative"
                    style={{ 
                      width: `${settings.fontSize * 1.4}px`, 
                      height: `${settings.fontSize * 1.4}px`,
                      verticalAlign: 'middle'
                    }}
                  >
                    <div className={`absolute inset-0 star-8 border ${
                      isTrueDark 
                        ? 'bg-[#18140f] border-[#dfb26d]/30' 
                        : 'bg-[#0a2a1f] border-[#00b87c]/30'
                    }`}></div>
                    <span 
                      className={`relative font-bold ${isTrueDark ? 'text-[#dfb26d]' : 'text-[#00b87c]'}`} 
                      style={{ fontSize: `${settings.fontSize * 0.4}px` }}
                    >
                      {ayah.numberInSurah}
                    </span>
                  </span>
                </div>

                {/* Tafsir Card */}
                {isTafsirVisible && ayah.tafsir && (
                  <div className={`w-full mt-4 border rounded-2xl p-6 shadow-xl animate-fadeIn text-right ${
                    isTrueDark 
                      ? 'bg-[#12110e] border-[#dfb26d]/20 text-neutral-300' 
                      : 'bg-[#0a2a1f] border-primary-green/20'
                  }`} dir="rtl">
                    <div className={`flex items-center gap-2 mb-3 ${isTrueDark ? 'text-[#dfb26d]' : 'text-primary-green'}`}>
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                       <span className="font-bold text-xs uppercase tracking-widest">
                         {TAFSIR_EDITIONS.find(t => t.identifier === (settings.tafsirEdition || 'ar.muyassar'))?.name || 'التفسير'}
                       </span>
                    </div>
                    <p className={`text-sm leading-relaxed ${isTrueDark ? 'text-[#b8aa92]' : 'text-slate-300'}`}>{ayah.tafsir}</p>
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