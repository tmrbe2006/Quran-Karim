export interface QuranStats {
  /** Array of date strings "YYYY-MM-DD" when user read or listened */
  activeDays: string[];
  /** Total listening duration in seconds */
  totalListeningSeconds: number;
  /** Map of date string "YYYY-MM-DD" to unique ayah keys read, e.g. "1_1", "2_255" */
  ayahsReadByDay: Record<string, string[]>;
  /** Total all-time distinct count of ayahs interacted with */
  totalAyahsCount: number;
  /** Current streak in consecutive days */
  currentStreak: number;
  /** Longest streak ever achieved */
  bestStreak: number;
  /** Timestamp of last recorded activity */
  lastActiveTimestamp: number;
}

const STATS_STORAGE_KEY = 'quran_app_user_stats';

function getTodayKey(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function calculateStreaks(activeDays: string[]): { currentStreak: number; bestStreak: number } {
  if (activeDays.length === 0) return { currentStreak: 0, bestStreak: 0 };

  const sortedDays = Array.from(new Set(activeDays)).sort();
  let bestStreak = 0;
  let running = 0;
  let prevDate: Date | null = null;

  for (const dayStr of sortedDays) {
    const curDate = new Date(dayStr + 'T00:00:00');
    if (!prevDate) {
      running = 1;
    } else {
      const diffMs = curDate.getTime() - prevDate.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        running += 1;
      } else if (diffDays > 1) {
        running = 1;
      }
    }
    prevDate = curDate;
    if (running > bestStreak) bestStreak = running;
  }

  // Calculate current streak relative to today or yesterday
  const today = getTodayKey();
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yYear = yesterdayDate.getFullYear();
  const yMonth = (yesterdayDate.getMonth() + 1).toString().padStart(2, '0');
  const yDay = yesterdayDate.getDate().toString().padStart(2, '0');
  const yesterday = `${yYear}-${yMonth}-${yDay}`;

  const lastDay = sortedDays[sortedDays.length - 1];
  let currentStreak = 0;
  if (lastDay === today || lastDay === yesterday) {
    currentStreak = running;
  }

  return { currentStreak, bestStreak };
}

export function loadQuranStats(): QuranStats {
  if (typeof window === 'undefined') {
    return {
      activeDays: [],
      totalListeningSeconds: 0,
      ayahsReadByDay: {},
      totalAyahsCount: 0,
      currentStreak: 0,
      bestStreak: 0,
      lastActiveTimestamp: Date.now()
    };
  }

  try {
    const saved = localStorage.getItem(STATS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as QuranStats;
      const streaks = calculateStreaks(parsed.activeDays || []);
      parsed.currentStreak = streaks.currentStreak;
      parsed.bestStreak = Math.max(parsed.bestStreak || 0, streaks.bestStreak);
      return parsed;
    }
  } catch (e) {
    console.warn('Failed to parse user stats:', e);
  }

  return {
    activeDays: [],
    totalListeningSeconds: 0,
    ayahsReadByDay: {},
    totalAyahsCount: 0,
    currentStreak: 0,
    bestStreak: 0,
    lastActiveTimestamp: Date.now()
  };
}

export function saveQuranStats(stats: QuranStats): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    console.warn('Failed to save user stats:', e);
  }
}

/**
 * Record an ayah read/viewed today
 */
export function recordAyahRead(surahNumber: number, ayahNumberInSurah: number): QuranStats {
  const stats = loadQuranStats();
  const today = getTodayKey();
  const ayahKey = `${surahNumber}_${ayahNumberInSurah}`;

  if (!stats.ayahsReadByDay) stats.ayahsReadByDay = {};
  if (!stats.ayahsReadByDay[today]) stats.ayahsReadByDay[today] = [];

  if (!stats.ayahsReadByDay[today].includes(ayahKey)) {
    stats.ayahsReadByDay[today].push(ayahKey);
    stats.totalAyahsCount = (stats.totalAyahsCount || 0) + 1;
  }

  if (!stats.activeDays.includes(today)) {
    stats.activeDays.push(today);
  }

  const streaks = calculateStreaks(stats.activeDays);
  stats.currentStreak = streaks.currentStreak;
  stats.bestStreak = Math.max(stats.bestStreak || 0, streaks.bestStreak);
  stats.lastActiveTimestamp = Date.now();

  saveQuranStats(stats);
  return stats;
}

/**
 * Increment listening time in seconds
 */
export function addListeningSeconds(seconds: number): QuranStats {
  const stats = loadQuranStats();
  const today = getTodayKey();

  stats.totalListeningSeconds = (stats.totalListeningSeconds || 0) + seconds;

  if (!stats.activeDays.includes(today)) {
    stats.activeDays.push(today);
  }

  const streaks = calculateStreaks(stats.activeDays);
  stats.currentStreak = streaks.currentStreak;
  stats.bestStreak = Math.max(stats.bestStreak || 0, streaks.bestStreak);
  stats.lastActiveTimestamp = Date.now();

  saveQuranStats(stats);
  return stats;
}

/**
 * Format total seconds into a readable Arabic time string
 */
export function formatListeningTime(totalSeconds: number): { hours: number; minutes: number; formatted: string } {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return {
      hours,
      minutes,
      formatted: `${hours} س و ${minutes} د`
    };
  }
  if (minutes > 0) {
    return {
      hours: 0,
      minutes,
      formatted: `${minutes} دقيقة`
    };
  }
  return {
    hours: 0,
    minutes: 0,
    formatted: `${totalSeconds} ثانية`
  };
}

/**
 * Get count of unique ayahs read today
 */
export function getTodayAyahsCount(stats: QuranStats): number {
  const today = getTodayKey();
  return stats.ayahsReadByDay?.[today]?.length || 0;
}
