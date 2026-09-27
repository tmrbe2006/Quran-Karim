import React, { useState } from 'react';
import { Reciter } from '../types';

interface AboutViewerProps {
  onBack?: () => void;
  downloadProgress?: number | null;
  onDownloadAll?: () => void;
  audioDownloadProgress?: number | null;
  onDownloadAllAudio?: () => void;
  isAudioDownloading?: boolean;
  currentReciter?: Reciter;
  onOpenSurahFatiha?: () => void;
}

export const AboutViewer: React.FC<AboutViewerProps> = ({
  onBack,
  downloadProgress,
  onDownloadAll,
  audioDownloadProgress,
  onDownloadAllAudio,
  isAudioDownloading,
  currentReciter,
  onOpenSurahFatiha,
}) => {
  const [fatihaRead, setFatihaRead] = useState(false);
  const [showFatihaText, setShowFatihaText] = useState(true);

  return (
    <div className="w-full h-full flex flex-col bg-[#051d14] text-white overflow-y-auto page-fade-in pb-24" dir="rtl">
      {/* Top Header */}
      <div className="p-4 pb-3 border-b border-[#0f2d22] bg-[#07251a] sticky top-0 z-20 flex items-center justify-between">
        {onBack ? (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0a2a1f] text-slate-300 hover:text-white border border-white/5 text-xs font-bold transition-all"
            title="العودة للمصحف"
          >
            <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            <span>المصحف</span>
          </button>
        ) : <div className="w-8" />}

        <div className="text-center">
          <h1 className="text-lg font-bold text-[#dfb26d]">نبذة عن التطبيق</h1>
          <p className="text-[10px] text-[#00b87c] font-bold">صدقة جارية</p>
        </div>

        <div className="w-8 h-8 rounded-full bg-[#dfb26d]/10 flex items-center justify-center text-[#dfb26d]">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
      </div>

      <div className="p-6 space-y-6 flex flex-col items-center">
        {/* Decorative Holy Crest */}
        <div className="relative w-24 h-24 my-2 flex items-center justify-center">
          <div className="absolute inset-0 bg-[#00b87c]/10 rounded-full border border-[#00b87c]/30 animate-pulse" />
          <div className="absolute inset-2 bg-[#dfb26d]/10 star-8 border border-[#dfb26d]/40" />
          <svg className="w-10 h-10 text-[#dfb26d] relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>

        {/* The Exact User Requested Wording inside a dedicated Spiritual Card */}
        <div className="w-full bg-gradient-to-b from-[#0a2a1f] to-[#041a12] p-6 rounded-3xl border-2 border-[#dfb26d]/40 shadow-2xl relative overflow-hidden text-center">
          {/* Subtle Decorative Star Watermark */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#dfb26d]/5 rounded-full blur-xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-[#00b87c]/5 rounded-full blur-xl pointer-events-none" />

          {/* Bismillah */}
          <p className="quran-text text-xl text-[#00b87c] mb-5 tracking-wide">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>

          {/* User Requested Sentences */}
          <div className="space-y-5 text-white">
            <div className="bg-[#051d14]/70 p-4 rounded-2xl border border-white/5 shadow-inner">
              <p className="text-base sm:text-lg font-bold text-[#dfb26d] leading-relaxed quran-text">
                هذا صدقة جارية علي روح ابي وامي واموات المسلمين اجمعين
              </p>
            </div>

            <div className="bg-[#051d14]/70 p-4 rounded-2xl border border-white/5 shadow-inner">
              <p className="text-base sm:text-lg font-bold text-slate-100 leading-relaxed quran-text">
                ادعوا الله بالمغفرة لنا ولهم والحاقنا بهم علي العمل الصالح
              </p>
            </div>

            <div className="bg-[#051d14]/70 p-4 rounded-2xl border border-[#00b87c]/30 shadow-inner">
              <p className="text-base sm:text-lg font-bold text-[#00b87c] leading-relaxed quran-text">
                ارجوا قراءة سورة الفاتحة علي ارواح المسلمين اجمعين
              </p>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-center gap-2 text-xs text-slate-400">
            <span>نسأل الله أن يتقبلها خالصة لوجهه الكريم</span>
          </div>
        </div>

        {/* Surah Al-Fatiha Card to immediately fulfill the reader request */}
        <div className="w-full bg-[#0a2a1f] p-5 rounded-3xl border border-[#0f2d22] text-center shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-[#00b87c]/20 text-[#00b87c] flex items-center justify-center font-bold text-xs">
                ١
              </span>
              <h3 className="font-bold text-sm text-[#dfb26d]">سورة الفاتحة</h3>
            </div>
            <button
              onClick={() => setShowFatihaText(!showFatihaText)}
              className="text-xs text-[#00b87c] font-bold hover:underline"
            >
              {showFatihaText ? 'إخفاء النص' : 'إظهار النص'}
            </button>
          </div>

          {showFatihaText && (
            <div className="bg-[#051d14] p-5 rounded-2xl border border-white/5 mb-4 text-center">
              <p className="quran-text text-lg sm:text-xl text-white leading-loose select-none">
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۞ الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ ۞ الرَّحْمَٰنِ الرَّحِيمِ ۞ مَالِكِ يَوْمِ الدِّينِ ۞ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ ۞ اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ ۞ صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-2 justify-center">
            <button
              onClick={() => {
                setFatihaRead(true);
                if ('vibrate' in navigator) {
                  try { navigator.vibrate(50); } catch (e) {}
                }
              }}
              className={`w-full sm:w-auto px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                fatihaRead
                  ? 'bg-[#00b87c] text-white shadow-lg shadow-[#00b87c]/30'
                  : 'bg-[#00b87c]/20 text-[#00b87c] hover:bg-[#00b87c] hover:text-white border border-[#00b87c]/40'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              <span>{fatihaRead ? 'تمت القراءة والدعاء بحمد الله' : 'قرأت الفاتحة ودعوت لهم'}</span>
            </button>

            {onOpenSurahFatiha && (
              <button
                onClick={onOpenSurahFatiha}
                className="w-full sm:w-auto px-4 py-2.5 rounded-2xl text-xs font-bold bg-[#dfb26d]/20 text-[#dfb26d] hover:bg-[#dfb26d] hover:text-[#051d14] border border-[#dfb26d]/30 transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>الاستماع والتلاوة بالمصحف</span>
              </button>
            )}
          </div>
        </div>

        {/* Du'a for Parents and Muslims */}
        <div className="w-full bg-[#0a2a1f] p-5 rounded-3xl border border-[#0f2d22] text-right space-y-3">
          <h4 className="font-bold text-xs text-[#dfb26d] flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            <span>من أدعية القرآن والسنة للوالدين والأموات</span>
          </h4>
          <p className="quran-text text-base text-slate-200 leading-relaxed bg-[#051d14] p-3 rounded-2xl border border-white/5">
            ﴿ رَّبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا ﴾
          </p>
          <p className="quran-text text-base text-slate-200 leading-relaxed bg-[#051d14] p-3 rounded-2xl border border-white/5">
            ﴿ رَبَّنَا اغْفِرْ لِي وَلِوَالِدَيَّ وَلِلْمُؤْمِنِينَ يَوْمَ يَقُومُ الْحِسَابُ ﴾
          </p>
          <p className="text-xs text-slate-300 leading-relaxed bg-[#051d14] p-3 rounded-2xl border border-white/5">
            «اللَّهُمَّ اغْفِرْ لَهُمْ وَارْحَمْهُمْ، وَعَافِهِمْ وَاعْفُ عَنْهُمْ، وَأَكْرِمْ نُزُلَهُمْ، وَوَسِّعْ مُدْخَلَهُمْ، وَاغْسِلْهُمْ بِالْمَاءِ وَالثَّلْجِ وَالْبَرَدِ، وَنَقِّهِمْ مِنَ الْخَطَايَا كَمَا نَقَّيْتَ الثَّوْبَ الأَبْيَضَ مِنَ الدَّنَسِ».
          </p>
        </div>

        {/* Offline Quran Downloader Controls */}
        {(onDownloadAll || onDownloadAllAudio) && (
          <div className="w-full bg-[#0a2a1f] p-5 rounded-3xl border border-[#0f2d22] space-y-5 text-right">
            <div>
              <h4 className="text-sm font-bold text-[#dfb26d] mb-1">التحميل والتشغيل بدون إنترنت (Offline)</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                يمكنك تحميل كامل نصوص المصحف والتفاسير أو أصوات القراء للتشغيل بدون الحاجة لشبكة الإنترنت نهائياً.
              </p>
            </div>

            {/* Texts and Tafsir download */}
            {onDownloadAll && (
              <div className="bg-[#051d14] p-4 rounded-2xl border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">نصوص المصحف الشريف والتفاسير</span>
                  {downloadProgress === 100 && (
                    <span className="text-[10px] text-[#00b87c] font-bold bg-[#00b87c]/10 px-2 py-0.5 rounded-full">
                      محمل أوفلاين ✓
                    </span>
                  )}
                </div>

                {downloadProgress === null ? (
                  <button 
                    onClick={onDownloadAll}
                    className="w-full bg-[#00b87c]/20 hover:bg-[#00b87c] text-[#00b87c] hover:text-white py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 border border-[#00b87c]/30"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    <span>تحميل نصوص المصحف كاملاً (١١٤ سورة)</span>
                  </button>
                ) : downloadProgress < 100 ? (
                  <div className="space-y-2">
                    <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden">
                      <div className="bg-[#00b87c] h-full transition-all duration-300" style={{ width: `${downloadProgress}%` }} />
                    </div>
                    <p className="text-[10px] font-bold text-[#00b87c] text-center">{downloadProgress}% جاري حفظ النصوص...</p>
                  </div>
                ) : (
                  <div className="text-center text-[#00b87c] text-xs font-bold py-1">
                    تم حفظ نصوص وتفاسير القرآن الكريم أوفلاين بنجاح
                  </div>
                )}
              </div>
            )}

            {/* Audio Reciter download */}
            {onDownloadAllAudio && currentReciter && (
              <div className="bg-[#051d14] p-4 rounded-2xl border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">صوت القارئ ({currentReciter.name})</span>
                  {audioDownloadProgress === 100 && (
                    <span className="text-[10px] text-[#dfb26d] font-bold bg-[#dfb26d]/10 px-2 py-0.5 rounded-full">
                      محمل أوفلاين ✓
                    </span>
                  )}
                </div>

                {audioDownloadProgress === null ? (
                  <button 
                    onClick={onDownloadAllAudio}
                    disabled={isAudioDownloading}
                    className="w-full bg-[#dfb26d]/20 hover:bg-[#dfb26d] text-[#dfb26d] hover:text-[#051d14] py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 border border-[#dfb26d]/30 disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    <span>تحميل التلاوة الصوتية كاملة للقارئ</span>
                  </button>
                ) : audioDownloadProgress < 100 ? (
                  <div className="space-y-2">
                    <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden">
                      <div className="bg-[#dfb26d] h-full transition-all duration-300" style={{ width: `${audioDownloadProgress}%` }} />
                    </div>
                    <p className="text-[10px] font-bold text-[#dfb26d] text-center">{audioDownloadProgress}% جاري تحميل التلاوة الصوتية...</p>
                  </div>
                ) : (
                  <div className="text-center text-[#dfb26d] text-xs font-bold py-1">
                    تم حفظ صوت الشيخ {currentReciter.name} كاملاً أوفلاين
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer info */}
        <div className="text-center text-[10px] text-slate-500 pt-4 pb-2 space-y-1">
          <p>تطبيق القرآن الكريم - المصحف الرقمي التفاعلي</p>
          <p>نسألكم خالص الدعاء بظهر الغيب</p>
        </div>
      </div>
    </div>
  );
};
