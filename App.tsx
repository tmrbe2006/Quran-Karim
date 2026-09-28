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
import { getOfflineSurahAyahs, searchInQuranOffline, getRandomQuranAyah } from './utils/quranData';
import { AyahOfDayModal, DailyAyahData } from './components/AyahOfDayModal';
import { PrayerTimesViewer } from './components/PrayerTimesViewer';
import { ADHAN_VOICES, PRAYER_NAMES_AR, PrayerTimes, loadPrayerSettings } from './utils/prayerStorage';
import { saveAyahAudio, getAyahAudio } from './utils/audioStorage';
import { recordAyahRead, addListeningSeconds } from './utils/statsStorage';
import { checkAdhkarTimeTriggers, loadNotificationSettings } from './utils/notificationService';

type TabType = 'surahs' | 'adhkar' | 'qibla' | 'favorites' | 'bookmarks' | 'search' | 'memorize' | 'about' | 'statistics' | 'khatma' | 'prayer';

const App: React.FC = () => {
  const [surahs, setSurahs] = useState<Surah[]>(SURAHS_LIST_FALLBACK);
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [currentAyahIndex, setCurrentAyahIndex] = useState(0);
  const [targetAyahIndex, setTargetAyahIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [reciter, setReciterState] = useState<Reciter>(() => {
    try {
      const savedId = localStorage.getItem('quran-selected-reciter-id');
      if (savedId) {
        const found = RECITERS.find(r => r.id === savedId || r.identifier === savedId);
        if (found) return found;
      }
    } catch {}
    return RECITERS[0];
  });

  const setReciter = useCallback((newReciter: Reciter) => {
    setReciterState(newReciter);
    try {
      localStorage.setItem('quran-selected-reciter-id', newReciter.id);
    } catch {}
  }, []);

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('surahs');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  
  // Offline Progress Controllers
  const [textDownloadProgress, setTextDownloadProgress] = useState<number | null>(null);
  const [audioDownloadProgress, setAudioDownloadProgress] = useState<number | null>(null);
  const [isAudioDownloading, setIsAudioDownloading] = useState(false);
  const [sleepTimerSeconds, setSleepTimerSeconds] = useState<number | null>(null);
  const [activeToast, setActiveToast] = useState<{ type: 'morning' | 'evening'; title: string; body: string } | null>(null);
  const [adhkarCategory, setAdhkarCategory] = useState<'morning' | 'evening' | 'after_prayer' | 'sleep'>('morning');
  
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

  // Ayah of the Day State & Fetcher
  const [isAyahOfDayOpen, setIsAyahOfDayOpen] = useState(false);
  const [ayahOfDayData, setAyahOfDayData] = useState<DailyAyahData | null>(null);
  const [isAyahOfDayLoading, setIsAyahOfDayLoading] = useState(false);
  
  // Adhan state
  const [isAdhanPlaying, setIsAdhanPlaying] = useState(false);

  const fetchAyahOfDay = useCallback(async () => {
    setIsAyahOfDayLoading(true);
    try {
      const randomAyah = await getRandomQuranAyah();
      if (randomAyah) {
        let tafsirText = '';
        try {
          const tafsirEdition = settings.tafsirEdition || 'ar.muyassar';
          const tafsirRes = await fetch(`${API_BASE_URL}/ayah/${randomAyah.surahNumber}:${randomAyah.ayahNumberInSurah}/${tafsirEdition}`);
          if (tafsirRes.ok) {
            const tafsirJson = await tafsirRes.json();
            tafsirText = tafsirJson?.data?.text || '';
          }
        } catch (err) {
          console.warn('Failed to fetch tafsir online for Ayah of the Day:', err);
        }

        setAyahOfDayData({
          ...randomAyah,
          tafsir: tafsirText || 'التفسير متاح عند الاتصال بالشبكة'
        });
      }
    } catch (e) {
      console.warn('Failed to fetch Ayah of the Day:', e);
    } finally {
      setIsAyahOfDayLoading(false);
    }
  }, [settings.tafsirEdition]);

  const handleOpenAyahOfDay = useCallback(() => {
    setIsAyahOfDayOpen(true);
    fetchAyahOfDay();
  }, [fetchAyahOfDay]);

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

  // Sleep Timer Handler (Countdown and auto-pause)
  useEffect(() => {
    if (sleepTimerSeconds === null || sleepTimerSeconds <= 0) return;

    const interval = setInterval(() => {
      setSleepTimerSeconds(prev => {
        if (prev === null || prev <= 1) {
          setIsPlaying(false);
          if (audioRef.current) audioRef.current.pause();
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sleepTimerSeconds]);

  // Track listening time in seconds while audio is playing
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      addListeningSeconds(1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Track currently viewed/played ayah in user reading stats
  useEffect(() => {
    if (selectedSurah && ayahs.length > 0 && ayahs[currentAyahIndex]) {
      const ayah = ayahs[currentAyahIndex];
      recordAyahRead(selectedSurah.number, ayah.numberInSurah);
    }
  }, [selectedSurah, currentAyahIndex, ayahs]);

  // Periodic Local Time Check for Morning & Evening Adhkar Notifications
  useEffect(() => {
    const runCheck = () => {
      const config = loadNotificationSettings();
      checkAdhkarTimeTriggers(config, (type, title, body) => {
        setActiveToast({ type, title, body });
      });
    };

    runCheck();
    // Check every 30 seconds
    const interval = setInterval(runCheck, 30000);
    return () => clearInterval(interval);
  }, []);

  // Periodic Prayer Times Checker for Adhan sound reminders
  const adhanAudioRef = useRef<HTMLAudioElement | null>(null);

  // Background Prayer Times Fetcher if cache is missing
  useEffect(() => {
    const fetchTimingsBackground = async () => {
      try {
        const cached = localStorage.getItem('quran_app_cached_prayer_times');
        if (cached) return;

        const pSettings = loadPrayerSettings();
        let url = '';
        if (pSettings.latitude && pSettings.longitude) {
          url = `https://api.aladhan.com/v1/timings?latitude=${pSettings.latitude}&longitude=${pSettings.longitude}&method=${pSettings.method}`;
        } else {
          url = `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(pSettings.city)}&country=${encodeURIComponent(pSettings.country)}&method=${pSettings.method}`;
        }

        const response = await fetch(url);
        if (response.ok) {
          const json = await response.json();
          if (json?.data?.timings) {
            const t = json.data.timings;
            const mappedTimes = {
              Fajr: t.Fajr,
              Sunrise: t.Sunrise,
              Dhuhr: t.Dhuhr,
              Asr: t.Asr,
              Maghrib: t.Maghrib,
              Isha: t.Isha,
              date: json.data.date.readable
            };
            localStorage.setItem('quran_app_cached_prayer_times', JSON.stringify(mappedTimes));
          }
        }
      } catch (err) {
        console.warn('Failed to fetch prayer timings in background', err);
        // Guarantee default prayer times are stored in localStorage for offline reliability
        const fallbackTimes = {
          Fajr: "05:15",
          Sunrise: "06:40",
          Dhuhr: "12:55",
          Asr: "16:15",
          Maghrib: "18:45",
          Isha: "20:10",
          date: "27 Sep 2026"
        };
        localStorage.setItem('quran_app_cached_prayer_times', JSON.stringify(fallbackTimes));
      }
    };

    fetchTimingsBackground();
  }, []);

  useEffect(() => {
    const checkPrayerTimeAndTrigger = () => {
      const pSettings = loadPrayerSettings();
      let cachedTimes: PrayerTimes | null = null;
      try {
        const cached = localStorage.getItem('quran_app_cached_prayer_times');
        if (cached) cachedTimes = JSON.parse(cached);
      } catch {}

      if (!cachedTimes) return;

      const now = new Date();
      const currentHours = now.getHours().toString().padStart(2, '0');
      const currentMinutes = now.getMinutes().toString().padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;

      const todayKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
      const alertKey = `quran_app_last_prayer_alert_records`;
      
      let alertRecords: Record<string, boolean> = {};
      try {
        const stored = localStorage.getItem(alertKey);
        if (stored) alertRecords = JSON.parse(stored);
      } catch {}

      const prayerKeys = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

      for (const pKey of prayerKeys) {
        let pTime = cachedTimes[pKey as keyof PrayerTimes] as string;
        if (!pTime) continue;

        pTime = pTime.trim().substring(0, 5);

        if (pTime === currentTimeStr) {
          const prayerTodayKey = `${todayKey}_${pKey}`;

          if (!alertRecords[prayerTodayKey]) {
            alertRecords[prayerTodayKey] = true;
            localStorage.setItem(alertKey, JSON.stringify(alertRecords));

            const rConfig = pSettings.reminders[pKey];
            if (rConfig?.enabled) {
              // 1. Pause any Quran recitation playing
              setIsPlaying(false);
              if (audioRef.current) {
                audioRef.current.pause();
              }

              // 2. Play Custom Adhan Sound
              const voice = ADHAN_VOICES.find(v => v.id === rConfig.voiceId) || ADHAN_VOICES[0];
              if (voice) {
                if (adhanAudioRef.current) {
                  adhanAudioRef.current.pause();
                }
                const adhanAudio = new Audio(voice.url);
                adhanAudio.play()
                  .then(() => {
                    adhanAudioRef.current = adhanAudio;
                    setIsAdhanPlaying(true);
                    adhanAudio.onended = () => {
                      setIsAdhanPlaying(false);
                    };
                  })
                  .catch(err => {
                    console.warn('Adhan play error:', err);
                  });
              }

              // 3. Native Browser Notification
              const title = `🕌 حان وقت صلاة ${PRAYER_NAMES_AR[pKey]}`;
              const body = `حان الآن موعد أذان ${PRAYER_NAMES_AR[pKey]} في مدينة ${pSettings.city}. حي على الصلاة، حي على الفلاح.`;

              if ('Notification' in window && Notification.permission === 'granted') {
                try {
                  new Notification(title, {
                    body,
                    icon: '/icons/icon-192.png',
                    dir: 'rtl',
                    lang: 'ar'
                  });
                } catch {
                  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                    navigator.serviceWorker.ready.then(reg => {
                      reg.showNotification(title, {
                        body,
                        icon: '/icons/icon-192.png',
                        dir: 'rtl',
                        lang: 'ar'
                      });
                    }).catch(() => {});
                  }
                }
              }

              // 4. Trigger Toast Notification
              setActiveToast({
                type: 'morning',
                title,
                body
              });
            }
          }
        }
      }
    };

    // Run every 20 seconds
    const checkInterval = setInterval(checkPrayerTimeAndTrigger, 20000);
    return () => {
      clearInterval(checkInterval);
    };
  }, []);

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
      let fullTextData: any = null;
      let fullTafsirData: any = null;

      try {
        const textRes = await fetch('https://api.alquran.cloud/v1/quran/quran-uthmani');
        if (textRes.ok) fullTextData = await textRes.json();
      } catch (e) {}

      if (!fullTextData) {
        const localTextRes = await fetch('/data/quran-uthmani.json');
        if (localTextRes.ok) fullTextData = await localTextRes.json();
      }

      setTextDownloadProgress(35);

      try {
        const tafsirRes = await fetch('https://api.alquran.cloud/v1/quran/ar.jalalayn');
        if (tafsirRes.ok) fullTafsirData = await tafsirRes.json();
      } catch (e) {}

      if (!fullTafsirData) {
        const localTafsirRes = await fetch('/data/tafsir-jalalayn.json');
        if (localTafsirRes.ok) fullTafsirData = await localTafsirRes.json();
      }

      // Also persist full datasets in bundled cache
      try {
        const bundledCache = await caches.open('quran-bundled-data');
        if (fullTextData) {
          await bundledCache.put('/data/quran-uthmani.json', new Response(JSON.stringify(fullTextData), {
            headers: { 'Content-Type': 'application/json' }
          }));
        }
        if (fullTafsirData) {
          await bundledCache.put('/data/tafsir-jalalayn.json', new Response(JSON.stringify(fullTafsirData), {
            headers: { 'Content-Type': 'application/json' }
          }));
        }
      } catch (e) {}

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
          const tafsirPayload = { code: 200, status: "OK", data: tafsirS };
          await cache.put(`${API_BASE_URL}/surah/${s.number}/ar.jalalayn`, new Response(JSON.stringify(tafsirPayload), {
            headers: { 'Content-Type': 'application/json' }
          }));
          await cache.put(`${API_BASE_URL}/surah/${s.number}/ar.muyassar`, new Response(JSON.stringify(tafsirPayload), {
            headers: { 'Content-Type': 'application/json' }
          }));
          await cache.put(`${API_BASE_URL}/surah/${s.number}/ar.ibnkathir`, new Response(JSON.stringify(tafsirPayload), {
            headers: { 'Content-Type': 'application/json' }
          }));
        }

        if (i % 10 === 0 || i === surahsList.length - 1) {
          setTextDownloadProgress(60 + Math.round(((i + 1) / surahsList.length) * 40));
        }
      }
      try {
        localStorage.setItem('quran_offline_text_ready', 'true');
      } catch (e) {}
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

  // Initial Data Fetching (Surahs Metadata) and Background Offline Pre-warming
  useEffect(() => {
    const fetchSurahs = async () => {
      // Pre-warm full Quran dataset in background for offline use
      try {
        getFullQuranData();
        getFullTafsirData();
      } catch (e) {}

      // 1. Try local bundled surahs.json first
      try {
        const localRes = await fetch('/data/surahs.json');
        if (localRes.ok) {
          const localData = await localRes.json();
          if (localData?.data && Array.isArray(localData.data)) {
            setSurahs(localData.data);
            return;
          }
        }
      } catch (e) {}

      // Fallback: check CacheStorage for surahs.json
      if (typeof window !== 'undefined' && 'caches' in window) {
        try {
          const localMatch = await caches.match('/data/surahs.json');
          if (localMatch) {
            const localData = await localMatch.json();
            if (localData?.data && Array.isArray(localData.data)) {
              setSurahs(localData.data);
              return;
            }
          }
        } catch (e) {}
      }

      // 2. Try CacheStorage
      try {
        const url = `${API_BASE_URL}/surah`;
        if (typeof window !== 'undefined' && 'caches' in window) {
          try {
            const cache = await caches.open('quran-metadata');
            const cachedResponse = await cache.match(url);
            if (cachedResponse) {
              const data = await cachedResponse.json();
              if (data?.data) {
                setSurahs(data.data);
                return;
              }
            }
          } catch (e) {}
        }

        // 3. Fetch from API if online
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

  // Dynamic Ayah Loader (Surah Level with offline fallbacks and selected Tafsir Edition)
  useEffect(() => {
    if (!selectedSurah) return;
    const ctrl = new AbortController();
    const loadContent = async () => {
      setIsLoading(true);
      try {
        const activeTafsirEdition = settings.tafsirEdition || 'ar.muyassar';

        // 1. If using default offline jalalayn and no network, offline fallback is immediate
        // But if user requested online tafsir (like ar.muyassar or ar.ibnkathir), we attempt fetching that edition
        let tData: any = null;
        let fData: any = null;
        const textUrl = `${API_BASE_URL}/surah/${selectedSurah.number}`;
        const tafsirUrl = `${API_BASE_URL}/surah/${selectedSurah.number}/${activeTafsirEdition}`;

        // 2. Check browser cache
        if (typeof window !== 'undefined' && 'caches' in window) {
          try {
            const cache = await caches.open('quran-surahs-data');
            const cachedText = await cache.match(textUrl);
            if (cachedText) {
              tData = await cachedText.json();
            }
            const cachedTafsir = await cache.match(tafsirUrl) ||
                                 await cache.match(`${API_BASE_URL}/surah/${selectedSurah.number}/ar.jalalayn`) ||
                                 await cache.match(`${API_BASE_URL}/surah/${selectedSurah.number}/ar.muyassar`);
            if (cachedTafsir) {
              fData = await cachedTafsir.json();
            }
          } catch (e) {}
        }

        // 3. Fetch text online if not in cache
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

        // 4. Fetch tafsir online for active edition if not in cache
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

        // 5. Fallback to local offline bundled dataset if network failed
        if (!tData) {
          const offlineAyahs = await getOfflineSurahAyahs(selectedSurah.number, activeTafsirEdition);
          if (offlineAyahs && offlineAyahs.length > 0) {
            setAyahs(offlineAyahs);
            setCurrentAyahIndex(targetAyahIndex !== null ? targetAyahIndex : 0);
            setTargetAyahIndex(null);
            setIsLoading(false);
            return;
          }

          if (OFFLINE_SURAHS_DATA[selectedSurah.number]) {
            tData = {
              data: {
                ayahs: OFFLINE_SURAHS_DATA[selectedSurah.number]
              }
            };
          }
        }

        if (tData?.data?.ayahs) {
          const merged = tData.data.ayahs.map((a: any, i: number) => ({
            ...a,
            tafsir: fData?.data?.ayahs?.[i]?.text || a.tafsir || "التفسير متاح أوفلاين"
          }));
          setAyahs(merged);
          setCurrentAyahIndex(targetAyahIndex !== null ? targetAyahIndex : 0);
          setTargetAyahIndex(null);
        } else {
          const directOffline = await getOfflineSurahAyahs(selectedSurah.number, activeTafsirEdition);
          if (directOffline && directOffline.length > 0) {
            setAyahs(directOffline);
            setCurrentAyahIndex(targetAyahIndex !== null ? targetAyahIndex : 0);
            setTargetAyahIndex(null);
          } else {
            setAyahs([]);
          }
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
  }, [selectedSurah, settings.tafsirEdition]);

  // User-gesture safe audio triggers for Mobile iOS & Android
  const handleTogglePlay = useCallback(() => {
    if (!isPlaying) {
      if (audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
      audioRef.current?.pause();
    }
  }, [isPlaying]);

  const handleAyahClick = useCallback((idx: number) => {
    if (audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
    setCurrentAyahIndex(idx);
    setIsPlaying(true);
  }, []);

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
          const oldUrl = audioUrlRef.current;
          audioUrlRef.current = bUrl;
          if (audioRef.current) {
            audioRef.current.src = bUrl;
            audioRef.current.load();
            audioRef.current.play().catch((err) => {
              console.warn('Offline blob playback error:', err);
            });
          }
          if (oldUrl) {
            setTimeout(() => {
              try { URL.revokeObjectURL(oldUrl); } catch {}
            }, 6000);
          }
        } else if (audioRef.current) {
          // Fallback to direct url stream
          audioRef.current.src = audioUrl;
          audioRef.current.load();
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

  const isTrueDark = !!settings.trueDarkMode;

  return (
    <div className={`flex h-screen overflow-hidden font-sans max-w-md mx-auto shadow-2xl relative border-x transition-colors duration-500 ${
      isTrueDark 
        ? 'bg-[#000000] border-neutral-800/80 selection:bg-[#dfb26d]/30 text-amber-100' 
        : 'bg-[#051d14] border-white/5 selection:bg-[#00b87c]/30 text-white'
    }`} dir="rtl">
      <audio ref={audioRef} onEnded={handleNextAyah} preload="auto" playsInline={true} />
      <OfflineIndicator />

      {/* In-App Toast Notification for Adhkar Reminders */}
      {activeToast && (
        <div className="absolute top-4 inset-x-4 z-[99] animate-fadeIn" dir="rtl">
          <div className={`p-4 rounded-3xl shadow-2xl border flex items-start gap-3 backdrop-blur-md ${
            isTrueDark
              ? 'bg-[#181510]/95 border-amber-500/40 text-amber-100 shadow-amber-950/40'
              : 'bg-[#082a1e]/95 border-[#00b87c]/40 text-white shadow-black/40'
          }`}>
            <div className={`p-2.5 rounded-2xl shrink-0 text-xl ${
              activeToast.type === 'morning' ? 'bg-amber-400/20 text-amber-300' : 'bg-indigo-400/20 text-indigo-300'
            }`}>
              {activeToast.type === 'morning' ? '☀️' : '🌙'}
            </div>

            <div className="flex-1 text-right">
              <h4 className={`text-xs font-extrabold ${isTrueDark ? 'text-[#dfb26d]' : 'text-[#00b87c]'}`}>
                {activeToast.title}
              </h4>
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                {activeToast.body}
              </p>
              
              <div className="flex items-center gap-2 mt-2.5">
                <button
                  onClick={() => {
                    setAdhkarCategory(activeToast.type);
                    setActiveTab('adhkar');
                    setSelectedSurah(null);
                    setActiveToast(null);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isTrueDark 
                      ? 'bg-[#dfb26d] text-[#12110e] hover:bg-[#ebd095]' 
                      : 'bg-[#00b87c] text-white hover:bg-[#00d892]'
                  }`}
                >
                  قراءة الأذكار الآن
                </button>
                <button
                  onClick={() => setActiveToast(null)}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors"
                >
                  إغلاق
                </button>
              </div>
            </div>

            <button
              onClick={() => setActiveToast(null)}
              className="text-slate-400 hover:text-white p-1 rounded-full"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden relative">
          {selectedSurah ? (
            <div className="h-full flex flex-col page-fade-in">
              <header className={`p-4 flex items-center justify-between backdrop-blur border-b z-50 transition-colors duration-500 ${
                isTrueDark 
                  ? 'bg-[#000000]/95 border-[#221c14]' 
                  : 'bg-[#0a2a1f]/90 border-[#0f2d22]'
              }`}>
                <button
                  onClick={() => { setSelectedSurah(null); setIsPlaying(false); }}
                  className={`p-2 rounded-xl transition-colors ${
                    isTrueDark 
                      ? 'text-amber-200/80 bg-[#16130e] hover:bg-[#252018]' 
                      : 'text-white bg-[#0f2d22] hover:bg-[#00b87c]/20'
                  }`}
                  title="العودة"
                >
                  <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div className="text-center">
                  <h2 className={`font-bold quran-text text-xl transition-colors ${
                    isTrueDark ? 'text-[#dfb26d]' : 'text-[#00b87c]'
                  }`}>{selectedSurah.name}</h2>
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${
                    isTrueDark ? 'text-amber-200/50' : 'text-slate-500'
                  }`}>{selectedSurah.englishName}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    className={`p-2 rounded-xl transition-colors ${
                      isTrueDark 
                        ? 'text-[#dfb26d] bg-[#16130e] hover:bg-[#252018]' 
                        : 'text-[#00b87c] bg-[#0f2d22] hover:bg-[#00b87c]/20'
                    }`}
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
                    onAyahClick={handleAyahClick} 
                    isLoading={isLoading} settings={settings}
                    favorites={favorites} onToggleFavorite={handleToggleFavorite} 
                    bookmarks={bookmarks} onToggleBookmark={handleToggleBookmark}
                    memorization={memorization} reciter={reciter}
                  />
                  <Controls 
                    isPlaying={isPlaying} onTogglePlay={handleTogglePlay}
                    onNext={handleNextAyah} onPrev={() => setCurrentAyahIndex(p => Math.max(0, p - 1))}
                    selectedReciter={reciter} onSelectReciter={setReciter}
                    trueDarkMode={isTrueDark}
                    sleepTimerSeconds={sleepTimerSeconds}
                    onSetSleepTimer={(mins) => setSleepTimerSeconds(mins ? mins * 60 : null)}
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

                  {/* High visibility Quick Link Banner to customize Adhan */}
                  <div className="p-3 bg-[#0a271c] border-b border-white/5 flex flex-col gap-1.5 text-right" dir="rtl">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                        <span className="text-xs font-bold text-amber-200">🕌 ضبط منبه الأذان وتجربة الأصوات:</span>
                      </div>
                      <button
                        onClick={() => setActiveTab('prayer')}
                        className="px-3 py-1.5 bg-[#dfb26d] hover:bg-[#ebd095] text-[#051d14] text-[10px] font-black rounded-xl transition-all shadow-md active:scale-95 shrink-0"
                      >
                        اضبط وجرب الصوت الآن ➔
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      انقر للذهاب إلى شاشة "المواقيت" لاختبار صوت الأذان العذب (مكة، المدينة، الأقصى، عبد الباسط، العفاسي) بلمسة واحدة.
                    </p>
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
                        try {
                          const localMatches = await searchInQuranOffline(q);
                          if (localMatches && localMatches.length > 0) {
                            setSearchResults(localMatches.map((x: any) => ({
                              text: x.text,
                              numberInSurah: x.numberInSurah,
                              surah: { number: x.surahNumber, name: x.surahName }
                            })));
                            setIsSearchLoading(false);
                            return localMatches;
                          }
                          setSearchResults([]);
                          setIsSearchLoading(false);
                          return [];
                        } catch (e) {
                          console.warn('Search failed:', e);
                        }
                        setIsSearchLoading(false);
                        return [];
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
                      trueDarkMode={isTrueDark}
                      onSelectJuzAyah={(surahNum, ayahNum) => {
                        const s = surahs.find(x => x.number === surahNum);
                        if (s) {
                          setTargetAyahIndex(ayahNum - 1);
                          setSelectedSurah(s);
                        }
                      }}
                      onOpenAyahOfDay={handleOpenAyahOfDay}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'adhkar' && (
                <AdhkarViewer initialCategory={adhkarCategory} />
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

              {activeTab === 'prayer' && (
                <PrayerTimesViewer trueDarkMode={isTrueDark} />
              )}

              {(activeTab === 'search' || activeTab === 'memorize' || activeTab === 'about' || activeTab === 'statistics' || activeTab === 'khatma') && (
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
                    try {
                      const localMatches = await searchInQuranOffline(q);
                      if (localMatches && localMatches.length > 0) {
                        setSearchResults(localMatches.map((x: any) => ({
                          text: x.text,
                          numberInSurah: x.numberInSurah,
                          surah: { number: x.surahNumber, name: x.surahName }
                        })));
                        setIsSearchLoading(false);
                        return localMatches;
                      }
                      setSearchResults([]);
                      setIsSearchLoading(false);
                      return [];
                    } catch (e) {
                      console.warn('Search failed:', e);
                    }
                    setIsSearchLoading(false);
                    return [];
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
                  trueDarkMode={isTrueDark}
                  onSelectJuzAyah={(surahNum, ayahNum) => {
                    const s = surahs.find(x => x.number === surahNum);
                    if (s) {
                      setTargetAyahIndex(ayahNum - 1);
                      setSelectedSurah(s);
                    }
                  }}
                  onOpenAyahOfDay={handleOpenAyahOfDay}
                />
              )}
            </>
          )}
        </div>

        {/* Bottom Navigation Bar */}
        <nav className={`border-t flex items-center justify-around py-2.5 pb-5 shrink-0 z-50 shadow-lg transition-colors duration-500 ${
          isTrueDark 
            ? 'bg-[#000000] border-[#221c14]' 
            : 'bg-[#07251a] border-[#0f2d22]'
        }`}>
          {[
            {
              id: 'surahs',
              label: 'السور',
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              ),
              badge: null
            },
            {
              id: 'prayer',
              label: 'المواقيت',
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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
            }
          ].map(t => {
            const isActive = activeTab === t.id && !selectedSurah;
            const activeColorClass = isTrueDark ? 'text-[#dfb26d]' : 'text-[#00b87c]';
            const activeBgClass = isTrueDark ? 'bg-[#dfb26d]/15 text-[#dfb26d]' : 'bg-[#00b87c]/15 text-[#00b87c]';

            return (
              <button
                key={t.id}
                onClick={() => {
                  setActiveTab(t.id as TabType);
                  setSelectedSurah(null);
                }}
                className={`flex flex-col items-center gap-1 transition-all relative px-3 py-1 ${
                  isActive 
                    ? `${activeColorClass} scale-105` 
                    : (isTrueDark ? 'text-amber-200/40 hover:text-amber-100' : 'text-slate-400 hover:text-white')
                }`}
              >
                <div className={`p-1.5 rounded-2xl relative transition-all ${
                  isActive ? activeBgClass : ''
                }`}>
                  {t.icon}
                  {t.badge && (
                    <span className="absolute -top-1 -right-1 bg-[#dfb26d] text-[#051d14] text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow">
                      {t.badge > 99 ? '99+' : t.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-bold ${isActive ? activeColorClass : (isTrueDark ? 'text-amber-200/50' : 'text-slate-400')}`}>
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

      <AyahOfDayModal
        isOpen={isAyahOfDayOpen}
        onClose={() => setIsAyahOfDayOpen(false)}
        ayahData={ayahOfDayData}
        onRefresh={fetchAyahOfDay}
        isLoading={isAyahOfDayLoading}
        trueDarkMode={isTrueDark}
        onGoToAyah={(surahNumber, ayahNumberInSurah) => {
          const s = surahs.find(x => x.number === surahNumber);
          if (s) {
            setTargetAyahIndex(ayahNumberInSurah - 1);
            setSelectedSurah(s);
          }
        }}
      />

      {/* Floating Stop Adhan Button */}
      {isAdhanPlaying && (
        <div className="fixed bottom-24 left-4 right-4 z-[200] max-w-sm mx-auto animate-bounce text-right" dir="rtl">
          <div className={`border text-white rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-3 ${
            isTrueDark ? 'bg-[#14120e] border-[#382d1f]' : 'bg-[#0a2a1f] border-emerald-500/30'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center animate-pulse ${
                isTrueDark ? 'bg-amber-500/20 text-[#dfb26d]' : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-200 block">صوت الأذان يرتفع الآن 🕌</span>
                <span className="text-[10px] text-slate-400">حي على الصلاة، حي على الفلاح</span>
              </div>
            </div>
            <button
              onClick={() => {
                if (adhanAudioRef.current) {
                  adhanAudioRef.current.pause();
                  adhanAudioRef.current = null;
                }
                setIsAdhanPlaying(false);
              }}
              className="px-3.5 py-1.5 bg-red-600/20 hover:bg-red-600 text-red-200 hover:text-white rounded-xl text-xs font-bold transition-all border border-red-500/20"
            >
              إيقاف الأذان
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
