import React, { useState } from 'react';
import { FavoriteAyah, Surah } from '../types';

interface FavoritesViewerProps {
  favorites: FavoriteAyah[];
  onSelectFavorite: (fav: FavoriteAyah) => void;
  onRemoveFavorite: (fav: FavoriteAyah) => void;
  favoriteSurahNumbers: number[];
  surahs: Surah[];
  onSelectSurah: (surah: Surah) => void;
  onToggleFavoriteSurah: (surahNumber: number) => void;
}

export const FavoritesViewer: React.FC<FavoritesViewerProps> = ({
  favorites,
  onSelectFavorite,
  onRemoveFavorite,
  favoriteSurahNumbers,
  surahs,
  onSelectSurah,
  onToggleFavoriteSurah
}) => {
  const [filterType, setFilterType] = useState<'ayahs' | 'surahs'>('ayahs');
  const [searchQuery, setSearchQuery] = useState('');

  const favoriteSurahs = surahs.filter(s => favoriteSurahNumbers.includes(s.number));

  const filteredFavorites = favorites.filter(fav =>
    fav.text.includes(searchQuery) ||
    fav.surahName.includes(searchQuery) ||
    fav.ayahNumberInSurah.toString() === searchQuery
  );

  return (
    <div className="w-full h-full flex flex-col bg-[#051d14] text-white overflow-hidden page-fade-in" dir="rtl">
      {/* Header */}
      <div className="p-4 pb-2 border-b border-[#0f2d22] bg-[#07251a] shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="text-right">
            <h1 className="text-xl font-bold text-[#dfb26d]">الآيات والسور المفضلة</h1>
            <p className="text-[10px] text-[#00b87c] font-bold">مجموعتك الخاصة من آيات الذكر الحكيم</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#dfb26d]/10 flex items-center justify-center text-[#dfb26d]">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          </div>
        </div>

        {/* Filter Switcher */}
        <div className="flex gap-2 p-1 bg-[#0a2a1f] rounded-2xl border border-[#0f2d22] mb-3">
          <button
            onClick={() => setFilterType('ayahs')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              filterType === 'ayahs'
                ? 'bg-[#00b87c] text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>الآيات المفضلة</span>
            <span className="bg-black/20 text-[10px] px-2 py-0.5 rounded-full">{favorites.length}</span>
          </button>
          <button
            onClick={() => setFilterType('surahs')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              filterType === 'surahs'
                ? 'bg-[#00b87c] text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>السور المفضلة</span>
            <span className="bg-black/20 text-[10px] px-2 py-0.5 rounded-full">{favoriteSurahs.length}</span>
          </button>
        </div>

        {/* Search inside favorites */}
        {filterType === 'ayahs' && favorites.length > 0 && (
          <div className="relative mb-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في آياتك المفضلة..."
              className="w-full bg-[#0a2a1f] border border-[#0f2d22] rounded-xl py-2 px-9 text-xs text-slate-200 placeholder-slate-500 outline-none focus:ring-1 focus:ring-[#00b87c]"
            />
            <svg className="w-4 h-4 absolute right-3 top-2.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {filterType === 'ayahs' ? (
          filteredFavorites.length > 0 ? (
            filteredFavorites.map((fav, index) => (
              <div
                key={index}
                onClick={() => onSelectFavorite(fav)}
                className="bg-[#0a2a1f] p-5 rounded-3xl border border-[#0f2d22] hover:border-[#00b87c]/40 transition-all cursor-pointer relative group text-right shadow-lg"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-xl bg-[#00b87c]/15 text-[#00b87c] flex items-center justify-center font-bold text-xs">
                      {index + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-[#dfb26d]">سورة {fav.surahName}</h4>
                      <p className="text-[10px] text-slate-500">الآية رقم {fav.ayahNumberInSurah}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(`${fav.text} [سورة ${fav.surahName}: ${fav.ayahNumberInSurah}]`);
                      }}
                      className="p-1.5 text-slate-500 hover:text-white rounded-lg transition-colors"
                      title="نسخ الآية"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveFavorite(fav);
                      }}
                      className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
                      title="إزالة من المفضلة"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>

                <p className="quran-text text-lg text-white leading-relaxed mb-3">
                  {fav.text}
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/5">
                  <span className="flex items-center gap-1 text-[#00b87c] group-hover:underline">
                    <span>انقر للقراءة والاستماع في المصحف</span>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 opacity-60 flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-[#dfb26d]/10 flex items-center justify-center text-[#dfb26d]">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
              </div>
              <h3 className="text-sm font-bold text-white">لا توجد آيات في المفضلة</h3>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                أثناء تلاوتك في المصحف، انقر على رمز النجمة ⭐ أعلى أي آية لإضافتها إلى قائمة مفضلتك هنا.
              </p>
            </div>
          )
        ) : (
          favoriteSurahs.length > 0 ? (
            favoriteSurahs.map(surah => (
              <div
                key={surah.number}
                onClick={() => onSelectSurah(surah)}
                className="w-full flex items-center justify-between p-4 bg-[#0a2a1f] rounded-2xl border border-[#0f2d22] hover:border-[#00b87c]/30 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-4 text-right">
                  <div className="relative w-10 h-10 flex items-center justify-center">
                    <div className="absolute inset-0 bg-[#00b87c]/10 star-8"></div>
                    <span className="relative text-xs font-bold text-[#00b87c]">{surah.number}</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{surah.name}</h3>
                    <p className="text-[10px] text-slate-500">{surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} • {surah.numberOfAyahs} آية</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 font-bold">{surah.englishName}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavoriteSurah(surah.number);
                    }}
                    className="text-[#dfb26d] p-1 hover:scale-110 transition-transform"
                    title="إزالة من السور المفضلة"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 opacity-60 flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-[#dfb26d]/10 flex items-center justify-center text-[#dfb26d]">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
              </div>
              <h3 className="text-sm font-bold text-white">لا توجد سور في المفضلة</h3>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                يمكنك تفضيل السور التي تقرأها بانتظام للوصول إليها مباشرة.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
};
