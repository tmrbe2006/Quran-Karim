export interface PrayerSetting {
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  method: number; // Calculation method
  reminders: {
    [key: string]: {
      enabled: boolean;
      voiceId: string;
    };
  };
}

export interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  date: string;
}

export const ADHAN_VOICES = [
  { id: 'makkah', name: 'أذان الحرم المكي الشريف', url: 'https://raw.githubusercontent.com/Kiwifu/adhan-mp3/main/Nayf_Fedah_-_Al_Haram_Al_Maki_(%D9%86%D8%A7%D9%8A%D9%81_%D9%81%D8%AF%D8%A7%D8%AD_-_%D8%A7%D9%84%D8%AD%D8%B1%D9%85_%D8%A7%D9%84%D9%85%D8%AF%D9%86%D9%8A).mp3' },
  { id: 'madinah', name: 'أذان الحرم المدني الشريف', url: 'https://raw.githubusercontent.com/Kiwifu/adhan-mp3/main/Adhan_Al_Haram_Al_Madani_-_Al_Madinah_1_(%D8%A3%D8%B0%D8%A7%D9%86_%D8%A7%D9%84%D8%AD%D8%B1%D9%85_%D8%A7%D9%84%D9%85%D8%AF%D9%86%D9%8A_-_%D8%A7%D9%84%D9%85%D8%AF%D9%8A%D9%86%D8%A9_%D8%A5%D9%84%D9%85%D9%86%D9%88%D8%B1%D8%A9).mp3' },
  { id: 'aqsa', name: 'أذان المسجد الأقصى المبارك', url: 'https://raw.githubusercontent.com/Kiwifu/adhan-mp3/main/Adhan_Al_Aqsa_-_Jerusalem_(%D8%A3%D8%B0%D8%A7%D9%86_%D8%A7%D9%84%D9%85%D8%B3%D8%AC%D8%AF_%D8%A7%D9%84%D8%A3%D9%82%D8%B5%D9%89_-_%D8%A7%D9%84%D9%82%D8%AF%D8%B3).mp3' },
  { id: 'abdulbasit', name: 'أذان الشيخ عبد الباسط عبد الصمد', url: 'https://raw.githubusercontent.com/Kiwifu/adhan-mp3/main/Abdulbasit_Abdusamad_5_-_Cairo_(%D8%B9%D8%A8%D8%AF_%D8%A7%D9%84%D8%A8%D8%A7%D8%B3%D8%B7_%D8%B9%D8%A8%D8%AF_%D8%A7%D9%84%D8%B5%D9%85%D8%AF_-_%D8%A7%D9%84%D9%82%D8%A7%D9%87%D8%B1%D8%A9).mp3' },
  { id: 'alafasy', name: 'أذان الشيخ مشاري العفاسي', url: 'https://raw.githubusercontent.com/Kiwifu/adhan-mp3/main/Mishary_Rashid_Alafasy_2_-_Kuwait_(%D9%85%D8%B4%D8%A7%D8%B1%D9%8A_%D8%B1%D8%A7%D8%B4%D8%AF_%D8%A7%D9%84%D8%B9%D9%81%D8%A7%D8%B3%D9%8A_-_%D8%A7%D9%84%D9%83%D9%88%D9%8A%D8%AA).mp3' },
  { id: 'beep', name: 'نغمة تنبيه قصيرة (صوت هادئ)', url: 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg' },
];

export const CALCULATION_METHODS = [
  { id: 4, name: 'رابطة العالم الإسلامي' },
  { id: 5, name: 'الهيئة المصرية العامة للمساحة' },
  { id: 1, name: 'جامعة العلوم الإسلامية بكراتشي' },
  { id: 2, name: 'الجمعية الإسلامية لأمريكا الشمالية (ISNA)' },
  { id: 3, name: 'جامعة أم القرى (مكة المكرمة)' },
  { id: 7, name: 'معهد الجيوفيزياء بجامعة طهران' },
  { id: 8, name: 'موقع أدان الإقليمي (الخليج)' },
];

export const DEFAULT_PRAYER_SETTINGS: PrayerSetting = {
  city: 'القاهرة',
  country: 'مصر',
  latitude: 30.0444,
  longitude: 31.2357,
  method: 5, // Egyptian Survey
  reminders: {
    Fajr: { enabled: true, voiceId: 'makkah' },
    Sunrise: { enabled: false, voiceId: 'beep' },
    Dhuhr: { enabled: true, voiceId: 'madinah' },
    Asr: { enabled: true, voiceId: 'aqsa' },
    Maghrib: { enabled: true, voiceId: 'makkah' },
    Isha: { enabled: true, voiceId: 'madinah' },
  }
};

export const PRAYER_NAMES_AR: Record<string, string> = {
  Fajr: 'الفجر',
  Sunrise: 'الشروق',
  Dhuhr: 'الظهر',
  Asr: 'العصر',
  Maghrib: 'المغرب',
  Isha: 'العشاء'
};

const STORAGE_KEY = 'quran_app_prayer_times_settings';

export function loadPrayerSettings(): PrayerSetting {
  if (typeof window === 'undefined') return DEFAULT_PRAYER_SETTINGS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_PRAYER_SETTINGS,
        ...parsed,
        reminders: {
          ...DEFAULT_PRAYER_SETTINGS.reminders,
          ...(parsed.reminders || {})
        }
      };
    }
  } catch {}
  return DEFAULT_PRAYER_SETTINGS;
}

export function savePrayerSettings(settings: PrayerSetting): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save prayer settings', e);
  }
}
