import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  PrayerSetting, 
  PrayerTimes, 
  ADHAN_VOICES, 
  CALCULATION_METHODS, 
  DEFAULT_PRAYER_SETTINGS, 
  PRAYER_NAMES_AR, 
  loadPrayerSettings, 
  savePrayerSettings 
} from '../utils/prayerStorage';

interface PrayerTimesViewerProps {
  trueDarkMode?: boolean;
}

const POPULAR_CITIES = [
  { label: 'القاهرة (مصر)', city: 'Cairo', country: 'Egypt', lat: 30.0444, lon: 31.2357 },
  { label: 'مكة المكرمة (السعودية)', city: 'Mecca', country: 'Saudi Arabia', lat: 21.3891, lon: 39.8579 },
  { label: 'المدينة المنورة (السعودية)', city: 'Medina', country: 'Saudi Arabia', lat: 24.4672, lon: 39.6111 },
  { label: 'القدس الشريف (فلسطين)', city: 'Jerusalem', country: 'Palestine', lat: 31.7683, lon: 35.2137 },
  { label: 'الرياض (السعودية)', city: 'Riyadh', country: 'Saudi Arabia', lat: 24.7136, lon: 46.6753 },
  { label: 'دبي (الإمارات)', city: 'Dubai', country: 'United Arab Emirates', lat: 25.2048, lon: 55.2708 },
  { label: 'عمان (الأردن)', city: 'Amman', country: 'Jordan', lat: 31.9454, lon: 35.9284 },
  { label: 'بغداد (العراق)', city: 'Baghdad', country: 'Iraq', lat: 33.3152, lon: 44.3661 },
  { label: 'بيروت (لبنان)', city: 'Beirut', country: 'Lebanon', lat: 33.8938, lon: 35.5018 },
  { label: 'الدوحة (قطر)', city: 'Doha', country: 'Qatar', lat: 25.2854, lon: 51.5310 },
  { label: 'الكويت (الكويت)', city: 'Kuwait City', country: 'Kuwait', lat: 29.3759, lon: 47.9774 },
  { label: 'غزة (فلسطين)', city: 'Gaza', country: 'Palestine', lat: 31.5017, lon: 34.4668 }
];

export const PrayerTimesViewer: React.FC<PrayerTimesViewerProps> = ({ trueDarkMode = false }) => {
  const [settings, setSettings] = useState<PrayerSetting>(loadPrayerSettings());
  const [times, setTimes] = useState<PrayerTimes | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  
  // Audio playing preview states
  const [playingPreviewId, setPlayingPreviewId] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Time related states for next prayer calculations
  const [nowTime, setNowTime] = useState<Date>(new Date());
  const [nextPrayerName, setNextPrayerName] = useState<string>('');
  const [nextPrayerTimeLeft, setNextPrayerTimeLeft] = useState<string>('');
  const [activePrayerKey, setActivePrayerKey] = useState<string>('');

  // Save settings when changed
  const updateSettings = (newSettings: PrayerSetting) => {
    setSettings(newSettings);
    savePrayerSettings(newSettings);
  };

  // Stop audio preview
  const stopAudioPreview = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    setPlayingPreviewId(null);
  };

  // Play audio preview
  const handlePlayPreview = (voiceId: string) => {
    if (playingPreviewId === voiceId) {
      stopAudioPreview();
      return;
    }

    stopAudioPreview();
    const voice = ADHAN_VOICES.find(v => v.id === voiceId);
    if (!voice) return;

    const audio = new Audio(voice.url);
    audio.play()
      .then(() => {
        previewAudioRef.current = audio;
        setPlayingPreviewId(voiceId);
        audio.onended = () => {
          setPlayingPreviewId(null);
        };
      })
      .catch((e) => {
        console.warn('Failed to play adhan preview', e);
      });
  };

  // Fetch Prayer Times
  const fetchPrayerTimes = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      let url = '';
      if (settings.latitude && settings.longitude) {
        url = `https://api.aladhan.com/v1/timings?latitude=${settings.latitude}&longitude=${settings.longitude}&method=${settings.method}`;
      } else {
        url = `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(settings.city)}&country=${encodeURIComponent(settings.country)}&method=${settings.method}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error('فشل جلب مواقيت الصلاة من السيرفر');
      const json = await response.json();
      
      if (json && json.data && json.data.timings) {
        const t = json.data.timings;
        const mappedTimes: PrayerTimes = {
          Fajr: t.Fajr,
          Sunrise: t.Sunrise,
          Dhuhr: t.Dhuhr,
          Asr: t.Asr,
          Maghrib: t.Maghrib,
          Isha: t.Isha,
          date: json.data.date.readable
        };
        setTimes(mappedTimes);
        // Backup in localStorage
        localStorage.setItem('quran_app_cached_prayer_times', JSON.stringify(mappedTimes));
      }
    } catch (e: any) {
      console.warn('Failed to fetch online prayer times', e);
      // Load from backup
      const cached = localStorage.getItem('quran_app_cached_prayer_times');
      if (cached) {
        setTimes(JSON.parse(cached));
        setErrorMsg('تم تحميل المواقيت المخزنة مسبقاً لعدم توفر اتصال بالشبكة');
      } else {
        // Safe offline fallback so that the table, customization bell, voices list and test buttons are ALWAYS visible!
        const fallbackTimes: PrayerTimes = {
          Fajr: "05:15",
          Sunrise: "06:40",
          Dhuhr: "12:55",
          Asr: "16:15",
          Maghrib: "18:45",
          Isha: "20:10",
          date: "27 Sep 2026"
        };
        setTimes(fallbackTimes);
        setErrorMsg('تعذر الاتصال بالشبكة؛ تم تشغيل نمط العمل دون اتصال وعرض التوقيت الافتراضي للبلد.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [settings.city, settings.country, settings.latitude, settings.longitude, settings.method]);

  // Geolocation detector
  const handleDetectLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      alert('ميزة تحديد الموقع غير مدعومة في متصفحك.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        
        // Fetch reverse geo info or just use coords directly
        updateSettings({
          ...settings,
          latitude: lat,
          longitude: lon,
          city: 'موقعي الحالي',
          country: ''
        });
        setIsLocating(false);
      },
      (error) => {
        console.warn('Geolocation error', error);
        alert('فشل تحديد الموقع التلقائي. يرجى تفعيل صلاحية الموقع أو اختيار مدينة من القائمة.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Popular city click handler
  const handleSelectPopularCity = (item: typeof POPULAR_CITIES[0]) => {
    updateSettings({
      ...settings,
      city: item.city,
      country: item.country,
      latitude: item.lat,
      longitude: item.lon
    });
  };

  // Trigger fetch when settings change
  useEffect(() => {
    fetchPrayerTimes();
    return () => {
      stopAudioPreview();
    };
  }, [settings.city, settings.country, settings.latitude, settings.longitude, settings.method]);

  // Realtime ticking clock and Countdown to next prayer calculations
  useEffect(() => {
    const interval = setInterval(() => {
      setNowTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Next prayer computation helper
  useEffect(() => {
    if (!times) return;

    const parsePrayerTimeToDate = (timeStr: string) => {
      const [h, m] = timeStr.split(':').map(Number);
      const d = new Date(nowTime);
      d.setHours(h, m, 0, 0);
      return d;
    };

    const prayerKeys = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    const nowMs = nowTime.getTime();

    let nextK = 'Fajr';
    let nextDiff = Infinity;
    let activeK = 'Isha'; // Default fallback

    // Find the next prayer
    for (let i = 0; i < prayerKeys.length; i++) {
      const key = prayerKeys[i];
      const pTimeStr = times[key as keyof PrayerTimes] as string;
      if (!pTimeStr) continue;

      const pDate = parsePrayerTimeToDate(pTimeStr);
      const diff = pDate.getTime() - nowMs;

      if (diff > 0 && diff < nextDiff) {
        nextDiff = diff;
        nextK = key;
      }
    }

    // Determine currently active prayer (the one before the next prayer)
    const nextIdx = prayerKeys.indexOf(nextK);
    if (nextIdx === 0) {
      activeK = 'Isha';
    } else {
      activeK = prayerKeys[nextIdx - 1];
    }
    setActivePrayerKey(activeK);

    // If all prayers today have passed, Fajr of tomorrow is the next prayer
    if (nextDiff === Infinity) {
      nextK = 'Fajr';
      const fTimeStr = times.Fajr;
      const fDate = parsePrayerTimeToDate(fTimeStr);
      fDate.setDate(fDate.getDate() + 1); // Tomorrow
      nextDiff = fDate.getTime() - nowMs;
    }

    // Set countdown string
    const diffSecs = Math.floor(nextDiff / 1000);
    const hours = Math.floor(diffSecs / 3600);
    const mins = Math.floor((diffSecs % 3600) / 60);
    const secs = diffSecs % 60;

    const formattedCountdown = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    
    setNextPrayerName(PRAYER_NAMES_AR[nextK]);
    setNextPrayerTimeLeft(formattedCountdown);

  }, [times, nowTime]);

  // Format standard date in Arabic
  const formatArabicDate = () => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return nowTime.toLocaleDateString('ar-EG', options);
  };

  return (
    <div className="pt-2 px-6 flex flex-col space-y-6 pb-20 animate-fadeIn text-right" dir="rtl">
      {/* Location / Header card */}
      <div className={`p-6 rounded-3xl border transition-all shadow-xl shadow-[#00b87c]/5 relative overflow-hidden ${
        trueDarkMode ? 'bg-[#14120e] border-[#292218]' : 'bg-[#0a2a1f] border-[#0f2d22]'
      }`}>
        <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4 mb-4">
          <div>
            <h2 className="text-xl font-black text-slate-200">⏱️ مواقيت الصلاة والآذان</h2>
            <p className="text-xs text-slate-400 mt-1">{formatArabicDate()}</p>
          </div>
          <button
            onClick={handleDetectLocation}
            disabled={isLocating}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
              isLocating 
                ? 'opacity-50 cursor-not-allowed' 
                : trueDarkMode 
                  ? 'bg-amber-500/10 border-amber-500/20 text-[#dfb26d] hover:bg-amber-500/20' 
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
            }`}
          >
            <svg className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {isLocating ? 'جاري تحديد موقعك...' : 'تحديد موقعي التلقائي'}
          </button>
        </div>

        {/* Next Prayer Countdown Widget */}
        <div className={`p-4 rounded-2xl flex flex-col items-center justify-center text-center ${
          trueDarkMode ? 'bg-[#1b1710]' : 'bg-[#0e3527]'
        }`}>
          <span className="text-xs text-slate-400">الصلاة القادمة: <strong className={trueDarkMode ? 'text-[#dfb26d]' : 'text-[#00b87c]'}>{nextPrayerName}</strong></span>
          <div className="text-3xl font-black font-mono tracking-widest text-slate-200 mt-1 select-all" dir="ltr">
            {nextPrayerTimeLeft || '--:--:--'}
          </div>
          <span className="text-[10px] text-slate-500 mt-1">الوقت المتبقي لرفع الأذان في {settings.city}</span>
        </div>

        {/* Preset cities dropdown */}
        <div className="mt-5">
          <label className="text-xs font-bold text-slate-400 block mb-2">اختر مدينة سريعة:</label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
            {POPULAR_CITIES.map((c) => {
              const isSelected = settings.city === c.city || (c.city === 'Mecca' && settings.city === 'Mecca');
              return (
                <button
                  key={c.label}
                  onClick={() => handleSelectPopularCity(c)}
                  className={`py-1.5 px-2 rounded-lg text-[10px] font-bold text-center border transition-all overflow-hidden text-ellipsis whitespace-nowrap ${
                    isSelected 
                      ? trueDarkMode
                        ? 'bg-[#dfb26d]/20 border-[#dfb26d] text-[#dfb26d]'
                        : 'bg-[#00b87c]/20 border-[#00b87c] text-[#00b87c]'
                      : 'bg-black/20 border-white/5 text-slate-300 hover:border-white/10'
                  }`}
                >
                  {c.label.split(' ')[0]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Configuration Details: City Name & Method Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5 pt-4 border-t border-white/5">
          <div>
            <label className="text-xs font-bold text-slate-400 block mb-1.5">المدينة والبلد يدوياً:</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={settings.city}
                onChange={(e) => updateSettings({ ...settings, city: e.target.value, latitude: null, longitude: null })}
                placeholder="المدينة..."
                className="w-1/2 bg-black/30 border border-white/5 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <input
                type="text"
                value={settings.country}
                onChange={(e) => updateSettings({ ...settings, country: e.target.value, latitude: null, longitude: null })}
                placeholder="الدولة..."
                className="w-1/2 bg-black/30 border border-white/5 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 block mb-1.5">طريقة الحساب الفقهية:</label>
            <select
              value={settings.method}
              onChange={(e) => updateSettings({ ...settings, method: Number(e.target.value) })}
              className="w-full bg-black/30 border border-white/5 rounded-xl py-2 px-3 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {CALCULATION_METHODS.map(m => (
                <option key={m.id} value={m.id} className="bg-[#051d14] text-slate-300">{m.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-center gap-2">
          <svg className="w-5 h-5 shrink-0 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Prayers Times list */}
      <div className="space-y-3.5">
        <h3 className="text-xs font-bold text-slate-400 px-1">🕌 مواقيت الصلاة لهذا اليوم:</h3>
        
        {isLoading && !times ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <div className={`w-8 h-8 rounded-full border-2 border-t-transparent animate-spin ${
              trueDarkMode ? 'border-[#dfb26d]' : 'border-[#00b87c]'
            }`} />
            <span className="text-xs text-slate-400">جاري احتساب مواقيت الصلاة لمدينتك...</span>
          </div>
        ) : times ? (
          <div className="space-y-3">
            {Object.keys(PRAYER_NAMES_AR).map((key) => {
              const prayerName = PRAYER_NAMES_AR[key];
              const prayerTime = times[key as keyof PrayerTimes] as string;
              const isRemindEnabled = settings.reminders[key]?.enabled ?? false;
              const currentVoiceId = settings.reminders[key]?.voiceId ?? 'makkah';
              const isActive = activePrayerKey === key;

              return (
                <div
                  key={key}
                  className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    isActive
                      ? trueDarkMode
                        ? 'bg-[#dfb26d]/10 border-[#dfb26d] shadow-lg shadow-amber-950/20'
                        : 'bg-[#00b87c]/10 border-[#00b87c] shadow-lg shadow-emerald-950/20'
                      : trueDarkMode
                        ? 'bg-[#14120e] border-[#251e15] hover:border-[#382d1f]'
                        : 'bg-[#0a2a1f] border-[#0f2d22] hover:border-[#153e2f]'
                  }`}
                >
                  {/* Left: Prayer Name and Time */}
                  <div className="flex items-center justify-between md:justify-start gap-4 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-base font-black ${
                        isActive 
                          ? trueDarkMode ? 'text-[#dfb26d]' : 'text-emerald-400'
                          : 'text-slate-200'
                      }`}>
                        {prayerName}
                      </span>
                      {isActive && (
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold animate-pulse ${
                          trueDarkMode ? 'bg-[#dfb26d] text-black' : 'bg-[#00b87c] text-white'
                        }`}>
                          الآن
                        </span>
                      )}
                    </div>
                    <span className="text-lg font-black font-mono text-slate-200 tracking-wider">
                      {prayerTime || '--:--'}
                    </span>
                  </div>

                  {/* Right: Reminder configuration and Voice customizer */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 md:gap-4 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-white/5">
                    {/* Toggle reminders bell checkbox */}
                    <button
                      type="button"
                      onClick={() => {
                        const r = { ...settings.reminders };
                        r[key] = { ...r[key], enabled: !isRemindEnabled };
                        updateSettings({ ...settings, reminders: r });
                      }}
                      className={`py-1.5 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition-all ${
                        isRemindEnabled
                          ? trueDarkMode 
                            ? 'bg-[#dfb26d]/20 border-[#dfb26d]/30 text-[#dfb26d]' 
                            : 'bg-[#00b87c]/20 border-[#00b87c]/30 text-emerald-400'
                          : 'bg-black/20 border-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      {isRemindEnabled ? (
                        <>
                          <svg className="w-4 h-4 fill-current animate-swing" viewBox="0 0 20 20">
                            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                          </svg>
                          <span>تنبيه مفعّل</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                          <span className="opacity-70">صامت</span>
                        </>
                      )}
                    </button>

                    {/* Adhan Voice selection dropdown */}
                    <div className="flex items-center gap-1.5 flex-1 sm:flex-none">
                      <select
                        value={currentVoiceId}
                        onChange={(e) => {
                          const r = { ...settings.reminders };
                          r[key] = { ...r[key], voiceId: e.target.value };
                          updateSettings({ ...settings, reminders: r });
                        }}
                        disabled={!isRemindEnabled}
                        className={`bg-black/30 border border-white/5 rounded-xl py-1.5 px-2 text-[11px] text-slate-300 focus:outline-none flex-1 max-w-[170px] ${
                          !isRemindEnabled ? 'opacity-30 cursor-not-allowed' : ''
                        }`}
                      >
                        {ADHAN_VOICES.map(v => (
                          <option key={v.id} value={v.id} className="bg-[#051d14] text-slate-300">{v.name}</option>
                        ))}
                      </select>

                      {/* Play preview sound */}
                      <button
                        type="button"
                        onClick={() => handlePlayPreview(currentVoiceId)}
                        className={`p-2 rounded-xl border text-slate-400 hover:text-white transition-all shrink-0 ${
                          playingPreviewId === currentVoiceId
                            ? trueDarkMode 
                              ? 'bg-[#dfb26d] text-black border-[#dfb26d]' 
                              : 'bg-[#00b87c] text-white border-[#00b87c]'
                            : 'bg-black/20 border-white/5 hover:border-white/10'
                        }`}
                        title="استمع لصوت الأذان"
                      >
                        {playingPreviewId === currentVoiceId ? (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>

      {/* Advice Card */}
      <div className={`p-5 rounded-3xl border text-center ${
        trueDarkMode ? 'bg-[#18140e] border-[#292218] text-[#dfb26d]' : 'bg-[#093323] border-[#00b87c]/10 text-emerald-100'
      }`}>
        <p className="text-xs leading-relaxed">
          "إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَوْقُوتًا" - سورة النساء.
          <br />
          حافظ على صلواتك في أوقاتها، وسيقوم التطبيق بإطلاق صوت الأذان كاملاً تلقائياً وتنبيهك فور دخول موعد الصلاة طالما أن التطبيق مفتوح في متصفحك.
        </p>
      </div>
    </div>
  );
};
