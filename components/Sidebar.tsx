import React, { useState, useEffect } from 'react';
import { Surah, FavoriteAyah, BookmarkAyah, MemorizationState, Reciter } from '../types';
import { RECITERS, API_BASE_URL } from '../constants';
import { ReciterStorageManager } from './ReciterStorageManager';

const SAJDAHS = [
  { surah: 7, ayah: 206, name: "الأعراف" },
  { surah: 13, ayah: 15, name: "الرعد" },
  { surah: 16, ayah: 50, name: "النحل" },
  { surah: 17, ayah: 109, name: "الإسراء" },
  { surah: 19, ayah: 58, name: "مريم" },
  { surah: 22, ayah: 18, name: "الحج" },
  { surah: 22, ayah: 77, name: "الحج" },
  { surah: 25, ayah: 60, name: "الفرقان" },
  { surah: 27, ayah: 26, name: "النمل" },
  { surah: 32, ayah: 15, name: "السجدة" },
  { surah: 38, ayah: 24, name: "ص" },
  { surah: 41, ayah: 38, name: "فصلت" },
  { surah: 53, ayah: 62, name: "النجم" },
  { surah: 84, ayah: 21, name: "الانشقاق" },
  { surah: 96, ayah: 19, name: "العلق" },
];

const JUZ_MAPPING: Record<number, { s: number, a: number }> = {
  1: { s: 1, a: 1 }, 2: { s: 2, a: 142 }, 3: { s: 2, a: 253 }, 4: { s: 3, a: 93 }, 5: { s: 4, a: 24 },
  6: { s: 4, a: 148 }, 7: { s: 5, a: 82 }, 8: { s: 6, a: 111 }, 9: { s: 7, a: 88 }, 10: { s: 8, a: 41 },
  11: { s: 9, a: 93 }, 12: { s: 11, a: 6 }, 13: { s: 12, a: 53 }, 14: { s: 14, a: 1 }, 15: { s: 15, a: 1 },
  16: { s: 17, a: 1 }, 17: { s: 18, a: 75 }, 18: { s: 22, a: 1 }, 19: { s: 25, a: 21 }, 20: { s: 27, a: 56 },
  21: { s: 29, a: 46 }, 22: { s: 33, a: 31 }, 23: { s: 36, a: 28 }, 24: { s: 39, a: 32 }, 25: { s: 41, a: 47 },
  26: { s: 46, a: 1 }, 27: { s: 51, a: 31 }, 28: { s: 58, a: 1 }, 29: { s: 67, a: 1 }, 30: { s: 78, a: 1 }
};

interface SidebarProps {
  surahs: Surah[];
  selectedSurah: Surah | null;
  onSelectSurah: (surah: Surah) => void;
  favorites: FavoriteAyah[];
  favoriteSurahNumbers: number[];
  onToggleFavoriteSurah: (surahNumber: number) => void;
  onSelectFavorite: (fav: FavoriteAyah) => void;
  onRemoveFavorite: (fav: FavoriteAyah) => void;
  bookmarks: BookmarkAyah[];
  onSelectBookmark: (bm: BookmarkAyah) => void;
  onRemoveBookmark: (bm: BookmarkAyah) => void;
  onSearch: (query: string) => Promise<any[]>;
  onSelectSearchResult: (res: any) => void;
  isSearchLoading: boolean;
  memorization: MemorizationState;
  onStartMemorization: (config: Partial<MemorizationState>, reciter: Reciter, surah: Surah) => void;
  onStopMemorization: () => void;
  currentReciter: Reciter;
  onSelectReciter: (reciter: Reciter) => void;
  activeTab: string;
  downloadProgress?: number | null;
  onDownloadAll?: () => void;
  audioDownloadProgress?: number | null;
  onDownloadAllAudio?: () => void;
  isAudioDownloading?: boolean;
  onOpenTab?: (tab: string) => void;
  onOpenSettings?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  surahs, 
  selectedSurah, 
  onSelectSurah, 
  favorites,
  favoriteSurahNumbers,
  onToggleFavoriteSurah,
  onSelectFavorite,
  onRemoveFavorite,
  bookmarks,
  onSelectBookmark,
  onRemoveBookmark,
  onSearch,
  onSelectSearchResult,
  isSearchLoading,
  memorization,
  onStartMemorization,
  onStopMemorization,
  currentReciter,
  onSelectReciter,
  activeTab,
  downloadProgress,
  onDownloadAll,
  audioDownloadProgress,
  onDownloadAllAudio,
  isAudioDownloading,
  onOpenTab,
  onOpenSettings
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [surahFilterQuery, setSurahFilterQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'meccan' | 'medinan' | 'favorites'>('all');
  const [favSubTab, setFavSubTab] = useState<'ayahs' | 'bookmarks' | 'surahs'>('ayahs');
  const [quickAccessView, setQuickAccessView] = useState<'none' | 'juz' | 'sajdah'>('none');

  const [memReciter, setMemReciter] = useState<Reciter>(currentReciter);
  const [memSurah, setMemSurah] = useState<Surah | null>(null);
  const [memStartAyah, setMemStartAyah] = useState(1);
  const [memEndAyah, setMemEndAyah] = useState(7);
  const [memAyahReps, setMemAyahReps] = useState(1);
  const [memRangeReps, setMemRangeReps] = useState(1);
  const [memHideAyahs, setMemHideAyahs] = useState(false);

  const handleGlobalSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim().length > 0) {
      setQuickAccessView('none');
    }
    if (query.trim().length > 2) {
      const results = await onSearch(query);
      setSearchResults(results || []);
    } else {
      setSearchResults([]);
    }
  };

  const filteredSurahs = surahs.filter(s => {
    const matchesQuery = s.name.includes(surahFilterQuery) || 
                         s.englishName.toLowerCase().includes(surahFilterQuery.toLowerCase()) ||
                         s.number.toString() === surahFilterQuery;
    
    if (!matchesQuery) return false;
    
    if (filter === 'meccan') return s.revelationType === 'Meccan';
    if (filter === 'medinan') return s.revelationType === 'Medinan';
    if (filter === 'favorites') return favoriteSurahNumbers.includes(s.number);
    return true;
  });

  const favoriteSurahsList = surahs.filter(s => favoriteSurahNumbers.includes(s.number));

  return (
    <div className="w-full h-full bg-[#051d14] flex flex-col overflow-hidden page-fade-in">
      {activeTab === 'surahs' && (
        <div className="p-6 pb-2 shrink-0">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              {onOpenSettings && (
                <button
                  onClick={onOpenSettings}
                  className="text-slate-300 hover:text-white bg-[#0a2a1f] p-2 rounded-xl border border-white/5 transition-colors"
                  title="الإعدادات وحجم الخط"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066" /></svg>
                </button>
              )}
              {onOpenTab && (
                <button
                  onClick={() => onOpenTab('about')}
                  className="text-slate-300 hover:text-[#dfb26d] bg-[#0a2a1f] p-2 rounded-xl border border-white/5 transition-colors"
                  title="التحميل أوفلاين ومعلومات التطبيق"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                </button>
              )}
            </div>
            <div className="text-center">
              <h1 className="text-xl font-bold tracking-widest text-[#dfb26d] uppercase leading-tight">القرآن الكريم</h1>
              <p className="text-[10px] text-[#00b87c] font-bold uppercase tracking-widest">المصحف الرقمي الشريف</p>
            </div>
            <div className="flex items-center gap-2">
              {onOpenTab && (
                <button
                  onClick={() => onOpenTab('search')}
                  className="text-slate-300 hover:text-[#00b87c] bg-[#0a2a1f] p-2 rounded-xl border border-white/5 transition-colors"
                  title="البحث في المصحف"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </button>
              )}
              {onOpenTab && (
                <button
                  onClick={() => onOpenTab('memorize')}
                  className="text-slate-300 hover:text-[#00b87c] bg-[#0a2a1f] p-2 rounded-xl border border-white/5 transition-colors"
                  title="التحفيظ وتكرار الآيات"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707" /></svg>
                </button>
              )}
            </div>
          </div>

          <div className="relative mb-6 text-right" dir="rtl">
            <input 
              type="text"
              value={surahFilterQuery}
              onChange={(e) => setSurahFilterQuery(e.target.value)}
              placeholder="ابحث عن سورة أو رقم..."
              className="w-full bg-[#0a2a1f] border-none rounded-2xl py-3 px-12 text-sm text-slate-300 placeholder-slate-500 focus:ring-1 focus:ring-[#00b87c] outline-none transition-all"
            />
            <svg className="w-5 h-5 absolute right-4 top-3 text-[#00b87c]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>

          <div className="flex gap-4 border-b border-[#0f2d22] pb-2 overflow-x-auto scrollbar-hide">
            {[
              { id: 'all', label: 'الكل' },
              { id: 'meccan', label: 'مكية' },
              { id: 'medinan', label: 'مدنية' },
              { id: 'favorites', label: 'المفضلة' }
            ].map(f => (
              <button 
                key={f.id}
                onClick={() => setFilter(f.id as any)}
                className={`whitespace-nowrap px-2 py-2 text-sm font-bold transition-all ${filter === f.id ? 'text-[#00b87c] border-b-2 border-[#00b87c]' : 'text-slate-500 hover:text-white'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'search' && (
        <div className="p-6 pb-2 shrink-0">
          <h2 className="text-xl font-bold mb-6 text-center text-[#dfb26d]">البحث في القرآن</h2>
          <div className="relative mb-6 text-right" dir="rtl">
            <input 
              type="text"
              value={searchQuery}
              onChange={handleGlobalSearchChange}
              placeholder="ابحث عن آيات أو كلمات..."
              className="w-full bg-[#0a2a1f] border-none rounded-2xl py-3 px-12 text-sm text-slate-300 placeholder-slate-500 focus:ring-1 focus:ring-[#00b87c] outline-none"
            />
            <svg className="w-5 h-5 absolute right-4 top-3 text-[#00b87c]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
        </div>
      )}

      {activeTab === 'memorize' && (
        <div className="p-6 pb-4 flex-1 overflow-y-auto">
           <h2 className="text-xl font-bold mb-6 text-center text-[#dfb26d]">إعدادات التحفيظ</h2>
           <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">اختر القارئ</label>
                <div className="grid grid-cols-2 gap-2">
                  {RECITERS.map(r => (
                    <button
                      key={r.id}
                      onClick={() => setMemReciter(r)}
                      className={`p-3 rounded-2xl border transition-all text-right group ${memReciter.id === r.id ? 'bg-[#00b87c]/20 border-[#00b87c] shadow-lg shadow-[#00b87c]/5' : 'bg-[#0a2a1f] border-[#0f2d22] hover:border-slate-700'}`}
                    >
                      <h4 className={`text-[12px] font-bold mb-1 ${memReciter.id === r.id ? 'text-[#00b87c]' : 'text-slate-200'}`}>{r.name}</h4>
                      <p className="text-[8px] text-slate-500 uppercase">{r.subfolder.split('_').slice(0, 2).join(' ')}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">السورة</label>
                <select 
                  value={memSurah?.number || ''}
                  onChange={(e) => {
                    const s = surahs.find(sur => sur.number === parseInt(e.target.value));
                    if (s) {
                      setMemSurah(s);
                      setMemStartAyah(1);
                      setMemEndAyah(s.numberOfAyahs);
                    }
                  }}
                  className="w-full bg-[#0a2a1f] border border-[#0f2d22] rounded-2xl py-3 px-4 text-sm text-white outline-none focus:ring-1 focus:ring-[#00b87c] appearance-none"
                >
                  <option value="" disabled>اختر السورة...</option>
                  {surahs.map(s => (
                    <option key={s.number} value={s.number}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">من آية</label>
                  <input 
                    type="number" min="1" max={memSurah?.numberOfAyahs || 286}
                    value={memStartAyah}
                    onChange={(e) => setMemStartAyah(parseInt(e.target.value))}
                    className="w-full bg-[#0a2a1f] border border-[#0f2d22] rounded-2xl py-3 px-4 text-sm text-white outline-none focus:ring-1 focus:ring-[#00b87c]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">إلى آية</label>
                  <input 
                    type="number" min="1" max={memSurah?.numberOfAyahs || 286}
                    value={memEndAyah}
                    onChange={(e) => setMemEndAyah(parseInt(e.target.value))}
                    className="w-full bg-[#0a2a1f] border border-[#0f2d22] rounded-2xl py-3 px-4 text-sm text-white outline-none focus:ring-1 focus:ring-[#00b87c]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">تكرار الآية</label>
                  <input 
                    type="number" min="1" max="100"
                    value={memAyahReps}
                    onChange={(e) => setMemAyahReps(parseInt(e.target.value))}
                    className="w-full bg-[#0a2a1f] border border-[#0f2d22] rounded-2xl py-3 px-4 text-sm text-white outline-none focus:ring-1 focus:ring-[#00b87c]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">تكرار النطاق</label>
                  <input 
                    type="number" min="1" max="100"
                    value={memRangeReps}
                    onChange={(e) => setMemRangeReps(parseInt(e.target.value))}
                    className="w-full bg-[#0a2a1f] border border-[#0f2d22] rounded-2xl py-3 px-4 text-sm text-white outline-none focus:ring-1 focus:ring-[#00b87c]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#0a2a1f] rounded-2xl border border-[#0f2d22]">
                <label className="text-sm font-bold text-slate-300">إخفاء الآيات (للاختبار)</label>
                <button 
                  onClick={() => setMemHideAyahs(!memHideAyahs)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${memHideAyahs ? 'bg-[#00b87c]' : 'bg-[#0f2d22]'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${memHideAyahs ? 'right-1' : 'right-7'}`}></div>
                </button>
              </div>

              <button 
                disabled={!memSurah}
                onClick={() => memSurah && onStartMemorization({
                  startAyah: memStartAyah,
                  endAyah: memEndAyah,
                  ayahRepetitions: memAyahReps,
                  rangeRepetitions: memRangeReps,
                  hideAyahs: memHideAyahs
                }, memReciter, memSurah)}
                className="w-full bg-[#00b87c] hover:bg-[#00d892] disabled:opacity-30 disabled:hover:bg-[#00b87c] text-white py-4 rounded-2xl font-bold shadow-lg shadow-[#00b87c]/20 transition-all mt-6 active:scale-95"
              >
                بدء التحفيظ
              </button>
           </div>
        </div>
      )}

      {activeTab !== 'memorize' && (
        <div className="flex-1 overflow-y-auto px-4 pb-20">
          {activeTab === 'surahs' && (
            <div className="space-y-1">
              {filteredSurahs.map((surah) => (
                <div key={surah.number} className="w-full flex items-center justify-between p-4 hover:bg-[#0a2a1f] transition-colors group rounded-xl cursor-pointer" onClick={() => onSelectSurah(surah)}>
                  <div className="flex items-center gap-4">
                    <div className="relative w-10 h-10 flex items-center justify-center">
                      <div className="absolute inset-0 bg-[#0a2a1f] star-8 group-hover:bg-[#00b87c]/20 transition-colors"></div>
                      <span className="relative text-xs font-bold text-[#00b87c]">{surah.number}</span>
                    </div>
                    <div className="text-right">
                      <h3 className="text-sm font-bold text-white text-right group-hover:text-[#00b87c] transition-colors">{surah.englishName}</h3>
                      <p className="text-[10px] text-slate-500">{surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} • {surah.numberOfAyahs} آية</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="quran-text text-lg font-bold text-[#00b87c]">{surah.name}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'search' && (
            <div className="pt-4">
              {isSearchLoading ? (
                <div className="flex items-center justify-center py-10">
                   <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#00b87c]"></div>
                </div>
              ) : (
                <>
                  {!searchQuery && (
                    <>
                      <h4 className="text-xs font-bold text-slate-400 uppercase mb-4 px-2 tracking-widest">وصول سريع</h4>
                      <div className="grid grid-cols-2 gap-3 px-2 mb-8">
                        {[
                          { label: 'الجزء', id: 'juz' },
                          { label: 'سجدة', id: 'sajdah' }
                        ].map(q => (
                          <button 
                            key={q.id} 
                            onClick={() => setQuickAccessView(quickAccessView === q.id ? 'none' : q.id as any)}
                            className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-bold transition-colors ${quickAccessView === q.id ? 'bg-[#00b87c] text-white shadow-lg shadow-[#00b87c]/20' : 'bg-[#0a2a1f] text-slate-300 hover:bg-[#0f2d22]'}`}
                          >
                            <div className={`w-6 h-6 rounded flex items-center justify-center ${quickAccessView === q.id ? 'bg-white/20 text-white' : 'bg-[#00b87c]/20 text-[#00b87c]'}`}>
                               <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                            </div>
                            {q.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  
                  {!searchQuery && quickAccessView === 'juz' && (
                    <div className="grid grid-cols-3 gap-2 px-2 pb-10">
                      {Object.keys(JUZ_MAPPING).map(num => (
                        <button 
                          key={num}
                          onClick={() => onSelectSearchResult({ surah: { number: JUZ_MAPPING[parseInt(num)].s }, numberInSurah: JUZ_MAPPING[parseInt(num)].a, text: `بداية الجزء ${num}` })}
                          className="bg-[#0a2a1f] p-3 rounded-xl text-xs font-bold text-white hover:bg-[#00b87c]/20 border border-white/5"
                        >
                          جزء {num}
                        </button>
                      ))}
                    </div>
                  )}

                  {!searchQuery && quickAccessView === 'sajdah' && (
                    <div className="space-y-2 px-2 pb-10">
                      {SAJDAHS.map((s, i) => (
                        <button 
                          key={i}
                          onClick={() => onSelectSearchResult({ surah: { number: s.surah }, numberInSurah: s.ayah, text: `موضع سجدة في سورة ${s.name}` })}
                          className="w-full bg-[#0a2a1f] p-4 rounded-2xl text-right flex items-center justify-between hover:bg-[#00b87c]/10 border border-white/5"
                        >
                          <span className="text-xs text-slate-400">آية {s.ayah}</span>
                          <span className="text-sm font-bold text-white">سورة {s.name}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchResults && searchResults.length > 0 && (
                    <div className="space-y-4 px-2">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">النتائج</h4>
                        <span className="text-[10px] text-[#00b87c]">{searchResults.length} نتيجة</span>
                      </div>
                      {searchResults.map((res, idx) => (
                        <div 
                          key={idx}
                          onClick={() => onSelectSearchResult(res)}
                          className="p-4 bg-[#0a2a1f] rounded-2xl border border-transparent hover:border-[#00b87c]/30 cursor-pointer transition-all mb-4"
                        >
                          <div className="flex justify-between mb-2">
                             <span className="text-xs font-bold text-[#00b87c]">سورة {res.surah?.name || ''}</span>
                             <span className="text-[10px] text-slate-500">آية {res.numberInSurah}</span>
                          </div>
                          <p className="quran-text text-lg text-right text-white leading-loose mb-2">{res.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {searchQuery.trim().length >= 3 && searchResults && searchResults.length === 0 && !isSearchLoading && (
                    <div className="text-center py-10 text-slate-500 text-sm">لا توجد نتائج مطابقة لبحثك</div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'favorites' && (
            <div className="pt-4 px-2 space-y-4">
              <div className="flex gap-2 mb-4 bg-[#0a2a1f] p-1 rounded-2xl border border-[#0f2d22]">
                {[
                  { id: 'ayahs', label: 'الآيات' },
                  { id: 'bookmarks', label: 'العلامات' },
                  { id: 'surahs', label: 'السور' }
                ].map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => setFavSubTab(sub.id as any)}
                    className={`flex-1 py-2 text-[10px] font-bold rounded-xl transition-all ${favSubTab === sub.id ? 'bg-[#00b87c] text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>

              {favSubTab === 'ayahs' && favorites.length > 0 ? (
                favorites.map((fav, idx) => (
                  <div key={idx} className="bg-[#0a2a1f] p-5 rounded-3xl border border-[#0f2d22] hover:border-[#00b87c]/30 transition-all cursor-pointer relative group" onClick={() => onSelectFavorite(fav)}>
                    <div className="flex justify-between mb-4">
                       <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-[#00b87c] uppercase tracking-widest">آية محفوظة</span>
                          <h5 className="font-bold text-lg">{fav.surahName}</h5>
                          <p className="text-[10px] text-slate-500">آية {fav.ayahNumberInSurah}</p>
                       </div>
                       <button 
                         onClick={(e) => { e.stopPropagation(); onRemoveFavorite(fav); }}
                         className="p-2 text-slate-600 hover:text-red-500 transition-colors"
                       >
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                       </button>
                    </div>
                    <p className="quran-text text-xl text-right mb-4 leading-loose">{fav.text}</p>
                  </div>
                ))
              ) : favSubTab === 'bookmarks' && bookmarks.length > 0 ? (
                bookmarks.map((bm, idx) => (
                  <div key={idx} className="bg-[#0a2a1f] p-4 rounded-2xl border border-[#0f2d22] flex items-center justify-between hover:border-[#00b87c]/30 cursor-pointer" onClick={() => onSelectBookmark(bm)}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#00b87c]/10 text-[#00b87c] flex items-center justify-center font-bold text-xs">{idx + 1}</div>
                      <div>
                        <h5 className="text-sm font-bold text-white">{bm.surahName}</h5>
                        <p className="text-[10px] text-slate-500">آية {bm.ayahNumberInSurah}</p>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onRemoveBookmark(bm); }}
                      className="text-slate-600 hover:text-red-400 p-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))
              ) : favSubTab === 'surahs' && favoriteSurahsList.length > 0 ? (
                favoriteSurahsList.map((surah) => (
                  <button
                    key={surah.number}
                    onClick={() => onSelectSurah(surah)}
                    className="w-full flex items-center justify-between p-4 bg-[#0a2a1f] rounded-2xl border border-[#0f2d22] group"
                  >
                    <div className="flex items-center gap-4 text-right">
                      <h3 className="text-sm font-bold text-white">{surah.name}</h3>
                      <p className="text-[10px] text-slate-500">{surah.englishName}</p>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onToggleFavoriteSurah(surah.number); }}
                      className="text-[#00b87c]"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                    </button>
                  </button>
                ))
              ) : (
                <div className="text-center py-20 opacity-30 flex flex-col items-center gap-4">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                  <p className="text-sm">لا يوجد محتوى محفوظ هنا بعد</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'statistics' && (
            <div className="pt-4 px-2">
              <h2 className="text-xl font-bold mb-6 text-center text-[#dfb26d]">إحصائيات قرآنية</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'عدد السور', value: '114', sub: 'سورة' },
                  { label: 'عدد الآيات', value: '6236', sub: 'آية' },
                  { label: 'عدد الأجزاء', value: '30', sub: 'جزء' },
                  { label: 'عدد الأحزاب', value: '60', sub: 'حزب' },
                  { label: 'عدد الأرباع', value: '240', sub: 'ربع' },
                  { label: 'عدد السجدات', value: '15', sub: 'سجدة' },
                  { label: 'عدد الكلمات', value: '77,430', sub: 'كلمة تقريباً' },
                  { label: 'عدد الحروف', value: '323,671', sub: 'حرف تقريباً' },
                  { label: 'المنازل', value: '7', sub: 'منزل' },
                  { label: 'مدة التنزيل', value: '23', sub: 'سنة' }
                ].map((stat, i) => (
                  <div key={i} className="bg-[#0a2a1f] p-4 rounded-2xl border border-[#0f2d22] text-center hover:border-[#00b87c]/30 transition-all">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                    <div className="text-[#00b87c] text-xl font-bold">{stat.value}</div>
                    <p className="text-[8px] text-slate-400 mt-1">{stat.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="pt-12 px-6 flex flex-col items-center justify-center text-center space-y-8 animate-fadeIn">
              <div className="w-24 h-24 bg-[#00b87c]/10 rounded-full flex items-center justify-center border border-[#00b87c]/20 shadow-xl shadow-[#00b87c]/5">
                <svg className="w-12 h-12 text-[#00b87c]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              </div>
              <div className="quran-text text-xl leading-relaxed text-slate-100 space-y-4">
                <p>هذا كتاب الله القرأن الكريم</p>
                <p>صدقة جارية علي روح ابي وامي</p>
                <p>واموات المسلمين اجمع في جميع بقاع الارض</p>
                <p>ارجوا منك عند القراءة في المصحف الشريف</p>
                <p>ان تهب سورة الفاتحة الي اموات المسلمين</p>
              </div>

              {/* Offline Download UI */}
              <div className="w-full bg-[#0a2a1f] p-6 rounded-3xl border border-[#0f2d22] mt-4 space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-[#dfb26d] mb-2">تحميل نصوص المصحف</h4>
                  <p className="text-[10px] text-slate-400 mb-4 leading-relaxed">تحميل كافة الآيات والتفاسير لتعمل بدون اتصال نهائياً.</p>
                  
                  {downloadProgress === null ? (
                    <button 
                      onClick={onDownloadAll}
                      className="w-full bg-[#00b87c]/20 hover:bg-[#00b87c] text-[#00b87c] hover:text-white py-3 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 border border-[#00b87c]/30"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      تحميل نصوص المصحف
                    </button>
                  ) : downloadProgress < 100 ? (
                    <div className="space-y-3">
                      <div className="w-full bg-black/20 h-2 rounded-full overflow-hidden">
                        <div className="bg-[#00b87c] h-full transition-all duration-300" style={{ width: `${downloadProgress}%` }}></div>
                      </div>
                      <p className="text-[10px] font-bold text-[#00b87c]">{downloadProgress}% جاري تحميل النصوص...</p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-[#00b87c] font-bold text-xs bg-[#00b87c]/10 py-3 rounded-2xl border border-[#00b87c]/30">
                      تم تحميل النصوص بنجاح
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-[#dfb26d]">مجلد صوت القارئ في الهاتف</h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    يتم تلقائياً حفظ أي آية تستمع إليها في مجلد القارئ المخصص (<span className="text-[#00b87c]">{currentReciter.name}</span>) لتعمل بدون اتصال. كما يمكنك تحميل صوته كاملاً:
                  </p>

                  <ReciterStorageManager reciter={currentReciter} />

                  {audioDownloadProgress === null ? (
                    <button 
                      onClick={onDownloadAllAudio}
                      className="w-full bg-[#dfb26d]/20 hover:bg-[#dfb26d] text-[#dfb26d] hover:text-white py-3 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 border border-[#dfb26d]/30 text-xs"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      تحميل كامل سور المصحف بصوت {currentReciter.name}
                    </button>
                  ) : audioDownloadProgress < 100 ? (
                    <div className="space-y-3">
                      <div className="w-full bg-black/20 h-2 rounded-full overflow-hidden">
                        <div className="bg-[#dfb26d] h-full transition-all duration-300" style={{ width: `${audioDownloadProgress}%` }}></div>
                      </div>
                      <p className="text-[10px] font-bold text-[#dfb26d]">{audioDownloadProgress}% جاري حفظ التلاوة في مجلد {currentReciter.name}...</p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-[#dfb26d] font-bold text-xs bg-[#dfb26d]/10 py-3 rounded-2xl border border-[#dfb26d]/30">
                      تم تحميل وحفظ صوت {currentReciter.name} كاملاً في الهاتف
                    </div>
                  )}
                </div>
              </div>

              <div className="w-16 h-1 bg-[#00b87c]/20 rounded-full mt-6"></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};