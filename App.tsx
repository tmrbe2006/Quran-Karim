import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { QuranViewer } from './components/QuranViewer';
import { Controls } from './components/Controls';
import { SettingsModal } from './components/SettingsModal';
import { AdhkarViewer } from './components/AdhkarViewer';
import { QiblaCompass } from './components/QiblaCompass';
import { FavoritesViewer } from './components/FavoritesViewer';
import { BookmarksViewer } from './components/BookmarksViewer';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Surah, Ayah, Reciter, AppSettings, FavoriteAyah, BookmarkAyah, MemorizationState } from './types';
import { RECITERS, API_BASE_URL, AUDIO_BASE_URL, DEFAULT_SETTINGS, SURAHS_LIST_FALLBACK } from './constants';
import { OFFLINE_SURAHS_DATA } from './data/offlineSurahs';
import { saveAyahAudio, getAyahAudio } from './utils/audioStorage';
import { GoogleGenAI } from "@google/genai";

type TabType = 'surahs' | 'adhkar' | 'qibla' | 'favorites' | 'bookmarks' | 'search' | 'memorize' | 'about';

const App: React.FC = () => {
  const [surahs, setSurahs] = useState<Surah[]>(SURAHS_LIST_FALLBACK);
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [currentAyahIndex, setCurrentAyahIndex] = useState(0);
  const [targetAyahIndex, setTargetAyahIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [reciter, setReciter] = useState<Reciter>(RECITERS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('surahs');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  
  // Offline Progress Controllers
  const [textDownloadProgress, setTextDownloadProgress] = useState<number | null>(null);
  const [audioDownloadProgress, setAudioDownloadProgress] = useState<number | null>(null);
  const [isAudioDownloading, setIsAudioDownloading] = useState(false);
  
  const [memorization, setMemorization] = useState<MemorizationState>({
    isActive: false, startAyah: 1, endAyah: 7, ayahRepetitions: 1, rangeRepetitions: 1, currentAyahRep: 0, currentRangeRep: 0, hideAyahs: false
  });

  const [favorites, setFavorites] = useState<FavoriteAyah[]>(() => {
    try {
      const saved = localStorage.getItem('quran-favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [favoriteSurahNumbers, setFavoriteSurahNumbers] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('quran-favorite-surahs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [bookmarks, setBookmarks] = useState<BookmarkAyah[]>(() => {
    try {
      const saved = localStorage.getItem('quran-bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('quran-settings');
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  // Sync state to local storage
  useEffect(() => {
    try {
      localStorage.setItem('quran-settings', JSON.stringify(settings));
      localStorage.setItem('quran-favorites', JSON.stringify(favorites));
      localStorage.setItem('quran-bookmarks', JSON.stringify(bookmarks));
      localStorage.setItem('quran-favorite-surahs', JSON.stringify(favoriteSurahNumbers));
    } catch (e) {}
  }, [settings, favorites, bookmarks, favoriteSurahNumbers]);

  // Bulk Downloader for Texts and Tafsirs (Offline Support)
  const downloadAllText = async () => {
    if (textDownloadProgress !== null && textDownloadProgress < 100) return;
    setTextDownloadProgress(0);
    try {
      if (typeof window === 'undefined' || !('caches' in window)) {
        setTextDownloadProgress(100);
        return;
      }
      const cache = await caches.open('quran-surahs-data');

      setTextDownloadProgress(10);
      const textRes = await fetch('https://api.alquran.cloud/v1/quran/quran-uthmani');
      if (!textRes.ok) throw new Error(`HTTP error text: ${textRes.status}`);
      const fullTextData = await textRes.json();
      setTextDownloadProgress(35);

      const tafsirRes = await fetch('https://api.alquran.cloud/v1/quran/ar.jalalayn');
      if (!tafsirRes.ok) throw new Error(`HTTP error tafsir: ${tafsirRes.status}`);
      const fullTafsirData = await tafsirRes.json();
      setTextDownloadProgress(60);

      const surahsList = fullTextData?.data?.surahs || [];
      const tafsirList = fullTafsirData?.data?.surahs || [];

      // Cache individual surahs so loadContent can instantly find them offline
      for (let i = 0; i < surahsList.length; i++) {
        const s = surahsList[i];
        const textUrl = `${API_BASE_URL}/surah/${s.number}`;
        const surahPayload = { code: 200, status: "OK", data: s };
        await cache.put(textUrl, new Response(JSON.stringify(surahPayload), {
          headers: { 'Content-Type': 'application/json' }
        }));

        const tafsirS = tafsirList[i];
        if (tafsirS) {
          const tafsirUrl = `${API_BASE_URL}/surah/${s.number}/ar.jalalayn`;
          const tafsirPayload = { code: 200, status: "OK", data: tafsirS };
          await cache.put(tafsirUrl, new Response(JSON.stringify(tafsirPayload), {
            headers: { 'Content-Type': 'application/json' }
          }));
        }

        if (i % 10 === 0 || i === surahsList.length - 1) {
          setTextDownloadProgress(60 + Math.round(((i + 1) / surahsList.length) * 40));
        }
      }
      setTextDownloadProgress(100);
    } catch (error) {
      console.error("Text Sync Failed", error);
      setTextDownloadProgress(null);
    }
  };

  // High-Performance Audio Downloader (Concurrently batches downloads per reciter)
  const downloadAllAudio = async () => {
    if (isAudioDownloading) return;
    setIsAudioDownloading(true);
    setAudioDownloadProgress(0);
    
    try {
      let totalDownloaded = 0;
      const totalAyahs = 6236;

      for (let sNum = 1; sNum <= 114; sNum++) {
        const surah = surahs.find(s => s.number === sNum);
        if (!surah) continue;

        const surahStr = sNum.toString().padStart(3, '0');
        const chunk = [];

        for (let aNum = 1; aNum <= surah.numberOfAyahs; aNum++) {
          const ayahStr = aNum.toString().padStart(3, '0');
          const url = `${AUDIO_BASE_URL}/${reciter.subfolder}/${surahStr}${ayahStr}.mp3`;
          
          chunk.push((async () => {
            try {
              // Check if already in reciter's offline folder
              const existingBlob = await getAyahAudio(reciter, sNum, aNum, url);
              if (!existingBlob) {
                const res = await fetch(url);
                if (res.ok) {
                  const blob = await res.blob();
                  await saveAyahAudio(reciter, sNum, aNum, blob, url);
                }
              }
            } catch (e) {}
            totalDownloaded++;
            if (totalDownloaded % 50 === 0) setAudioDownloadProgress(Math.round((totalDownloaded / totalAyahs) * 100));
          })());

          if (chunk.length >= 8) {
            await Promise.all(chunk);
            chunk.length = 0;
          }
        }
        await Promise.all(chunk);
      }
      setAudioDownloadProgress(100);
    } catch (error) {
      console.error("Audio Sync Failed", error);
    } finally {
      setIsAudioDownloading(false);
    }
  };

  // Initial Data Fetching (Surahs Metadata)
  useEffect(() => {
    const fetchSurahs = async () => {
      try {
        const url = `${API_BASE_URL}/surah`;
        if (typeof window !== 'undefined' && 'caches' in window) {
          try {
            const cache = await caches.open('quran-metadata');
            const cachedResponse = await cache.match(url);
            if (cachedResponse) {
              const data = await cachedResponse.json();
              if (data?.data) setSurahs(data.data);
            }
          } catch (e) {}
        }

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          if (data?.data) {
            setSurahs(data.data);
            if (typeof window !== 'undefined' && 'caches' in window) {
              try {
                const cache = await caches.open('quran-metadata');
                await cache.put(url, new Response(JSON.stringify(data), {
                  headers: { 'Content-Type': 'application/json' }
                }));
              } catch (e) {}
            }
          }
        }
      } catch (e) {
        console.warn("Network offline, keeping existing surahs list.");
      }
    };
    fetchSurahs();
  }, []);

  // Main Playback Logic & Ayah Transition
  const handleNextAyah = useCallback(() => {
    if (memorization.isActive) {
      if (memorization.currentAyahRep < (memorization.ayahRepetitions - 1)) {
        setMemorization(prev => ({ ...prev, currentAyahRep: prev.currentAyahRep + 1 }));
        if (audioRef.current) { audioRef.current.currentTime = 0; audioRef.current.play().catch(() => {}); }
      } else {
        if (ayahs[currentAyahIndex]?.numberInSurah < memorization.endAyah && currentAyahIndex < ayahs.length - 1) {
          setCurrentAyahIndex(p => p + 1);
          setMemorization(prev => ({ ...prev, currentAyahRep: 0 }));
        } else {
          if (memorization.currentRangeRep < (memorization.rangeRepetitions - 1)) {
            setCurrentAyahIndex(memorization.startAyah - 1);
            setMemorization(p => ({ ...p, currentAyahRep: 0, currentRangeRep: p.currentRangeRep + 1 }));
          } else {
            setIsPlaying(false);
            setMemorization(p => ({ ...p, isActive: false }));
          }
        }
      }
    } else {
      if (currentAyahIndex < ayahs.length - 1) setCurrentAyahIndex(p => p + 1);
      else setIsPlaying(false);
    }
  }, [ayahs, currentAyahIndex, memorization]);

  // Dynamic Ayah Loader (Surah Level with offline fallbacks)
  useEffect(() => {
    if (!selectedSurah) return;
    const ctrl = new AbortController();
    const loadContent = async () => {
      setIsLoading(true);
      try {
        let tData: any = null;
        let fData: any = null;
        const textUrl = `${API_BASE_URL}/surah/${selectedSurah.number}`;
        const tafsirUrl = `${API_BASE_URL}/surah/${selectedSurah.number}/ar.jalalayn`;

        // 1. Check browser cache first
        if (typeof window !== 'undefined' && 'caches' in window) {
          try {
            const cache = await caches.open('quran-surahs-data');
            const cachedText = await cache.match(textUrl);
            if (cachedText) {
              tData = await cachedText.json();
            }
            const cachedTafsir = await cache.match(tafsirUrl);
            if (cachedTafsir) {
              fData = await cachedTafsir.json();
            }
          } catch (e) {}
        }

        // 2. Fetch text online if not in cache
        if (!tData) {
          try {
            const res = await fetch(textUrl, { signal: ctrl.signal });
            if (res.ok) {
              tData = await res.json();
              if (typeof window !== 'undefined' && 'caches' in window) {
                try {
                  const cache = await caches.open('quran-surahs-data');
                  await cache.put(textUrl, new Response(JSON.stringify(tData), {
                    headers: { 'Content-Type': 'application/json' }
                  }));
                } catch (e) {}
              }
            }
          } catch (e) {
            if (!ctrl.signal.aborted) console.warn("Could not fetch surah text online", e);
          }
        }

        // 3. Fallback to bundled offline dataset if network unavailable and not in cache
        if (!tData && OFFLINE_SURAHS_DATA[selectedSurah.number]) {
          tData = {
            data: {
              ayahs: OFFLINE_SURAHS_DATA[selectedSurah.number]
            }
          };
        }

        // 4. Fetch tafsir online if not in cache (optional)
        if (!fData) {
          try {
            const res = await fetch(tafsirUrl, { signal: ctrl.signal });
            if (res.ok) {
              fData = await res.json();
              if (typeof window !== 'undefined' && 'caches' in window) {
                try {
                  const cache = await caches.open('quran-surahs-data');
                  await cache.put(tafsirUrl, new Response(JSON.stringify(fData), {
                    headers: { 'Content-Type': 'application/json' }
                  }));
                } catch (e) {}
              }
            }
          } catch (e) {}
        }

        if (tData?.data?.ayahs) {
          const merged = tData.data.ayahs.map((a: any, i: number) => ({
            ...a,
            tafsir: fData?.data?.ayahs?.[i]?.text || a.tafsir || "التفسير محمل أوفلاين"
          }));
          setAyahs(merged);
          setCurrentAyahIndex(targetAyahIndex !== null ? targetAyahIndex : 0);
          setTargetAyahIndex(null);
        } else {
          // If offline and surah is not cached
          setAyahs([]);
        }
      } catch (e) {
        if (!ctrl.signal.aborted) {
          console.error("Content Loading Error", e);
        }
      } finally {
        if (!ctrl.signal.aborted) {
          setIsLoading(false);
        }
      }
    };
    loadContent();
    return () => ctrl.abort();
  }, [selectedSurah]);

  // Audio Streaming Hub (Handles Cache-First Strategy)
  useEffect(() => {
    if (!audioRef.current || !isPlaying || ayahs.length === 0) { audioRef.current?.pause(); return; }
    const currentAyah = ayahs[currentAyahIndex];
    if (!currentAyah || !selectedSurah) return;

    const sStr = selectedSurah.number.toString().padStart(3, '0');
    const aStr = currentAyah.numberInSurah.toString().padStart(3, '0');
    const audioUrl = `${AUDIO_BASE_URL}/${reciter.subfolder}/${sStr}${aStr}.mp3`;
    
    const playAudio = async () => {
      try {
        let blob: Blob | null = null;

        // 1. Check if this ayah is already saved in this reciter's offline folder
        blob = await getAyahAudio(reciter, selectedSurah.number, currentAyah.numberInSurah, audioUrl);

        // 2. If not found in offline storage, fetch online and automatically cache in reciter's folder!
        if (!blob) {
          try {
            const res = await fetch(audioUrl);
            if (res && res.ok) {
              blob = await res.blob();
              // Save asynchronously to reciter's folder for offline playback
              saveAyahAudio(reciter, selectedSurah.number, currentAyah.numberInSurah, blob, audioUrl, currentAyah.number).catch(e => {
                console.warn('Auto-save ayah audio failed:', e);
              });
            }
          } catch (netErr) {
            console.warn('Network fetch error for audio:', netErr);
          }
        }

        if (blob) {
          const bUrl = URL.createObjectURL(blob);
          if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
          audioUrlRef.current = bUrl;
          if (audioRef.current) {
            audioRef.current.src = bUrl;
            audioRef.current.play().catch(() => {});
          }
        } else if (audioRef.current) {
          // Fallback to direct url stream
          audioRef.current.src = audioUrl;
          audioRef.current.play().catch(() => {});
        }
      } catch (e) {
        if (audioRef.current) { audioRef.current.src = audioUrl; audioRef.current.play().catch(() => {}); }
      }
    };
    playAudio();
  }, [isPlaying, currentAyahIndex, ayahs, reciter, selectedSurah]);

  // Toggle Favorite Ayah
  const handleToggleFavorite = useCallback((ayah: Ayah) => {
    if (!selectedSurah) return;
    setFavorites(prev => {
      const exists = prev.some(f => f.surahNumber === selectedSurah.number && f.ayahNumberInSurah === ayah.numberInSurah);
      if (exists) {
        return prev.filter(f => !(f.surahNumber === selectedSurah.number && f.ayahNumberInSurah === ayah.numberInSurah));
      } else {
        const newFav: FavoriteAyah = {
          surahNumber: selectedSurah.number,
          surahName: selectedSurah.name,
          ayahNumberInSurah: ayah.numberInSurah,
          text: ayah.text,
          indexInSurah: ayah.numberInSurah - 1
        };
        return [newFav, ...prev];
      }
    });
  }, [selectedSurah]);

  // Toggle Bookmark Ayah
  const handleToggleBookmark = useCallback((ayah: Ayah) => {
    if (!selectedSurah) return;
    setBookmarks(prev => {
      const exists = prev.some(b => b.surahNumber === selectedSurah.number && b.ayahNumberInSurah === ayah.numberInSurah);
      if (exists) {
        return prev.filter(b => !(b.surahNumber === selectedSurah.number && b.ayahNumberInSurah === ayah.numberInSurah));
      } else {
        const newBm: BookmarkAyah = {
          surahNumber: selectedSurah.number,
          surahName: selectedSurah.name,
          ayahNumberInSurah: ayah.numberInSurah,
          text: ayah.text,
          indexInSurah: ayah.numberInSurah - 1
        };
        return [newBm, ...prev];
      }
    });
  }, [selectedSurah]);

  const handleSelectFavorite = (fav: FavoriteAyah) => {
    const s = surahs.find(x => x.number === fav.surahNumber);
    if (s) {
      setTargetAyahIndex(fav.ayahNumberInSurah - 1);
      setSelectedSurah(s);
    }
  };

  const handleSelectBookmark = (bm: BookmarkAyah) => {
    const s = surahs.find(x => x.number === bm.surahNumber);
    if (s) {
      setTargetAyahIndex(bm.ayahNumberInSurah - 1);
      setSelectedSurah(s);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#051d14] font-sans selection:bg-[#00b87c]/30 max-w-md mx-auto shadow-2xl relative border-x border-white/5" dir="rtl">
      <audio ref={audioRef} onEnded={handleNextAyah} preload="auto" />
      <OfflineIndicator />

      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden relative">
          {selectedSurah ? (
            <div className="h-full flex flex-col page-fade-in">
              <header className="p-4 flex items-center justify-between bg-[#0a2a1f]/90 backdrop-blur border-b border-[#0f2d22] z-50">
                <button
                  onClick={() => { setSelectedSurah(null); setIsPlaying(false); }}
                  className="text-white bg-[#0f2d22] p-2 rounded-xl hover:bg-[#00b87c]/20 transition-colors"
                  title="العودة"
                >
                  <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div className="text-center">
                  <h2 className="font-bold quran-text text-xl text-[#00b87c]">{selectedSurah.name}</h2>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{selectedSurah.englishName}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="text-[#00b87c] bg-[#0f2d22] p-2 rounded-xl hover:bg-[#00b87c]/20 transition-colors"
                    title="خيارات العرض والخط"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066" /></svg>
                  </button>
                </div>
              </header>

              {ayahs.length === 0 && !isLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">هذه السورة غير محملة أوفلاين بعد</h3>
                  <p className="text-xs text-slate-400 mb-6 max-w-xs leading-relaxed">
                    يرجى الاتصال بالإنترنت لتحميل السورة، أو يمكنك تحميل نصوص المصحف كاملاً دفعة واحدة ليعمل بدون اتصال نهائياً.
                  </p>
                  <button
                    onClick={downloadAllText}
                    className="bg-[#00b87c] text-white px-5 py-2.5 rounded-2xl text-xs font-bold shadow-lg shadow-[#00b87c]/20 hover:bg-[#00d892] transition-colors"
                  >
                    تحميل نصوص المصحف كاملاً
                  </button>
                </div>
              ) : (
                <>
                  <QuranViewer 
                    surah={selectedSurah} ayahs={ayahs} currentAyahIndex={currentAyahIndex}
                    onAyahClick={(idx) => { setCurrentAyahIndex(idx); setIsPlaying(true); }} 
                    isLoading={isLoading} settings={settings}
                    favorites={favorites} onToggleFavorite={handleToggleFavorite} 
                    bookmarks={bookmarks} onToggleBookmark={handleToggleBookmark}
                    memorization={memorization} reciter={reciter}
                  />
                  <Controls 
                    isPlaying={isPlaying} onTogglePlay={() => setIsPlaying(!isPlaying)}
                    onNext={handleNextAyah} onPrev={() => setCurrentAyahIndex(p => Math.max(0, p - 1))}
                    selectedReciter={reciter} onSelectReciter={setReciter}
                  />
                </>
              )}
            </div>
          ) : (
            <>
              {activeTab === 'surahs' && (
                <div className="h-full flex flex-col">
                  {/* Top bar with PWA Install Prompt */}
                  <div className="px-4 pt-3 flex items-center justify-between border-b border-white/5 bg-[#062117] pb-2">
                    <span className="text-[11px] font-bold text-[#dfb26d]">المصحف الرقمي التفاعلي</span>
                    <PWAInstallButton />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <Sidebar 
                      surahs={surahs} 
                      selectedSurah={selectedSurah}
                      onSelectSurah={setSelectedSurah} 
                      favorites={favorites}
                      favoriteSurahNumbers={favoriteSurahNumbers}
                      onToggleFavoriteSurah={(n) => setFavoriteSurahNumbers(p => p.includes(n) ? p.filter(x => x !== n) : [...p, n])}
                      onSelectFavorite={handleSelectFavorite}
                      onRemoveFavorite={(f) => setFavorites(p => p.filter(x => x !== f))}
                      bookmarks={bookmarks}
                      onSelectBookmark={handleSelectBookmark}
                      onRemoveBookmark={(b) => setBookmarks(p => p.filter(x => x !== b))}
                      onSearch={async (q) => {
                        setIsSearchLoading(true);
                        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                        const r = await ai.models.generateContent({
                          model: 'gemini-3-flash-preview',
                          contents: `ابحث في القرآن عن "${q}". ارجع JSON فقط: [{"surahNumber": 1, "surahName": "الفاتحة", "numberInSurah": 1, "text": "..."}]`,
                          config: { responseMimeType: "application/json" }
                        });
                        const res = JSON.parse(r.text || "[]");
                        setSearchResults(res.map((x: any) => ({ text: x.text, numberInSurah: x.numberInSurah, surah: { number: x.surahNumber, name: x.surahName } })));
                        setIsSearchLoading(false);
                        return res;
                      }}
                      onSelectSearchResult={(res) => {
                        const s = surahs.find(x => x.number === res.surah.number);
                        if (s) { setTargetAyahIndex(res.numberInSurah - 1); setSelectedSurah(s); }
                      }}
                      isSearchLoading={isSearchLoading}
                      memorization={memorization}
                      onStartMemorization={(c, r, s) => {
                        setMemorization({...memorization, ...c, isActive: true});
                        setReciter(r);
                        setTargetAyahIndex((c.startAyah || 1) - 1);
                        setSelectedSurah(s);
                        setIsPlaying(true);
                      }}
                      onStopMemorization={() => setMemorization({...memorization, isActive: false})}
                      currentReciter={reciter}
                      onSelectReciter={setReciter}
                      activeTab="surahs"
                      downloadProgress={textDownloadProgress}
                      onDownloadAll={downloadAllText}
                      audioDownloadProgress={audioDownloadProgress}
                      onDownloadAllAudio={downloadAllAudio}
                      isAudioDownloading={isAudioDownloading}
                      onOpenTab={(t) => setActiveTab(t as TabType)}
                      onOpenSettings={() => setIsSettingsOpen(true)}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'adhkar' && (
                <AdhkarViewer />
              )}

              {activeTab === 'qibla' && (
                <QiblaCompass />
              )}

              {activeTab === 'favorites' && (
                <FavoritesViewer 
                  favorites={favorites}
                  onSelectFavorite={handleSelectFavorite}
                  onRemoveFavorite={(f) => setFavorites(p => p.filter(x => !(x.surahNumber === f.surahNumber && x.ayahNumberInSurah === f.ayahNumberInSurah)))}
                  favoriteSurahNumbers={favoriteSurahNumbers}
                  surahs={surahs}
                  onSelectSurah={setSelectedSurah}
                  onToggleFavoriteSurah={(n) => setFavoriteSurahNumbers(p => p.includes(n) ? p.filter(x => x !== n) : [...p, n])}
                />
              )}

              {activeTab === 'bookmarks' && (
                <BookmarksViewer 
                  bookmarks={bookmarks}
                  onSelectBookmark={handleSelectBookmark}
                  onRemoveBookmark={(b) => setBookmarks(p => p.filter(x => !(x.surahNumber === b.surahNumber && x.ayahNumberInSurah === b.ayahNumberInSurah)))}
                  onClearAllBookmarks={() => setBookmarks([])}
                />
              )}

              {(activeTab === 'search' || activeTab === 'memorize' || activeTab === 'about') && (
                <Sidebar 
                  surahs={surahs} 
                  selectedSurah={selectedSurah}
                  onSelectSurah={setSelectedSurah} 
                  favorites={favorites}
                  favoriteSurahNumbers={favoriteSurahNumbers}
                  onToggleFavoriteSurah={(n) => setFavoriteSurahNumbers(p => p.includes(n) ? p.filter(x => x !== n) : [...p, n])}
                  onSelectFavorite={handleSelectFavorite}
                  onRemoveFavorite={(f) => setFavorites(p => p.filter(x => x !== f))}
                  bookmarks={bookmarks}
                  onSelectBookmark={handleSelectBookmark}
                  onRemoveBookmark={(b) => setBookmarks(p => p.filter(x => x !== b))}
                  onSearch={async (q) => {
                    setIsSearchLoading(true);
                    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                    const r = await ai.models.generateContent({
                      model: 'gemini-3-flash-preview',
                      contents: `ابحث في القرآن عن "${q}". ارجع JSON فقط: [{"surahNumber": 1, "surahName": "الفاتحة", "numberInSurah": 1, "text": "..."}]`,
                      config: { responseMimeType: "application/json" }
                    });
                    const res = JSON.parse(r.text || "[]");
                    setSearchResults(res.map((x: any) => ({ text: x.text, numberInSurah: x.numberInSurah, surah: { number: x.surahNumber, name: x.surahName } })));
                    setIsSearchLoading(false);
                    return res;
                  }}
                  onSelectSearchResult={(res) => {
                    const s = surahs.find(x => x.number === res.surah.number);
                    if (s) { setTargetAyahIndex(res.numberInSurah - 1); setSelectedSurah(s); }
                  }}
                  isSearchLoading={isSearchLoading}
                  memorization={memorization}
                  onStartMemorization={(c, r, s) => {
                    setMemorization({...memorization, ...c, isActive: true});
                    setReciter(r);
                    setTargetAyahIndex((c.startAyah || 1) - 1);
                    setSelectedSurah(s);
                    setIsPlaying(true);
                  }}
                  onStopMemorization={() => setMemorization({...memorization, isActive: false})}
                  currentReciter={reciter}
                  onSelectReciter={setReciter}
                  activeTab={activeTab}
                  downloadProgress={textDownloadProgress}
                  onDownloadAll={downloadAllText}
                  audioDownloadProgress={audioDownloadProgress}
                  onDownloadAllAudio={downloadAllAudio}
                  isAudioDownloading={isAudioDownloading}
                  onOpenTab={(t) => setActiveTab(t as TabType)}
                  onOpenSettings={() => setIsSettingsOpen(true)}
                />
              )}
            </>
          )}
        </div>

        {/* Bottom Navigation Bar */}
        <nav className="bg-[#07251a] border-t border-[#0f2d22] flex items-center justify-around py-2.5 pb-5 shrink-0 z-50 shadow-lg">
          {[
            {
              id: 'surahs',
              label: 'المصحف',
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              ),
              badge: null
            },
            {
              id: 'adhkar',
              label: 'الأذكار',
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ),
              badge: null
            },
            {
              id: 'qibla',
              label: 'القبلة',
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 4l2.5 5.5L20 14l-5.5 2.5L12 22l-2.5-5.5L4 14l5.5-2.5L12 6z" />
                </svg>
              ),
              badge: null
            },
            {
              id: 'favorites',
              label: 'المفضلة',
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              ),
              badge: favorites.length > 0 ? favorites.length : null
            },
            {
              id: 'bookmarks',
              label: 'المرجعية',
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              ),
              badge: bookmarks.length > 0 ? bookmarks.length : null
            }
          ].map(t => {
            const isActive = activeTab === t.id && !selectedSurah;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setActiveTab(t.id as TabType);
                  setSelectedSurah(null);
                }}
                className={`flex flex-col items-center gap-1 transition-all relative px-3 py-1 ${
                  isActive ? 'text-[#00b87c] scale-105' : 'text-slate-400 hover:text-white'
                }`}
              >
                <div className={`p-1.5 rounded-2xl relative transition-all ${
                  isActive ? 'bg-[#00b87c]/15 text-[#00b87c]' : ''
                }`}>
                  {t.icon}
                  {t.badge && (
                    <span className="absolute -top-1 -right-1 bg-[#dfb26d] text-[#051d14] text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow">
                      {t.badge > 99 ? '99+' : t.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-bold ${isActive ? 'text-[#00b87c]' : 'text-slate-400'}`}>
                  {t.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
      />
    </div>
  );
};

export default App;
