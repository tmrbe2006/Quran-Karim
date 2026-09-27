export interface KhatmaPlan {
  id: string;
  title: string;
  startDate: string; // "YYYY-MM-DD"
  targetDays: number; // e.g., 30 days
  dailyJuzGoal: number; // e.g. 1 juz per day (computed or manual)
  completedJuzList: number[]; // Array of juz numbers 1..30 that user marked as finished
  currentJuz: number; // current reading position (1..30)
  completedAyahsCount: number; // distinct count of ayahs read
  completedSurahsCount: number; // surahs fully read
  isFinished: boolean;
  notes?: string;
}

const KHATMA_STORAGE_KEY = 'quran_app_khatma_plan';

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const DEFAULT_KHATMA_PLAN: KhatmaPlan = {
  id: 'default-khatma',
  title: 'ختمة القرآن الكريم',
  startDate: getTodayDateString(),
  targetDays: 30,
  dailyJuzGoal: 1,
  completedJuzList: [],
  currentJuz: 1,
  completedAyahsCount: 0,
  completedSurahsCount: 0,
  isFinished: false
};

export function loadKhatmaPlan(): KhatmaPlan {
  if (typeof window === 'undefined') return DEFAULT_KHATMA_PLAN;
  try {
    const saved = localStorage.getItem(KHATMA_STORAGE_KEY);
    if (saved) {
      return {
        ...DEFAULT_KHATMA_PLAN,
        ...JSON.parse(saved)
      };
    }
  } catch (e) {
    console.warn('Failed to load Khatma plan:', e);
  }
  return DEFAULT_KHATMA_PLAN;
}

export function saveKhatmaPlan(plan: KhatmaPlan): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KHATMA_STORAGE_KEY, JSON.stringify(plan));
  } catch (e) {
    console.warn('Failed to save Khatma plan:', e);
  }
}

/**
 * Calculate days passed and projected finish date
 */
export function getKhatmaProgressDetails(plan: KhatmaPlan): {
  daysPassed: number;
  daysRemaining: number;
  expectedJuzToday: number;
  completionPercent: number;
  targetDate: string;
  isAhead: boolean;
} {
  const start = new Date(plan.startDate + 'T00:00:00');
  const now = new Date();
  const diffTime = Math.max(0, now.getTime() - start.getTime());
  const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

  const targetDateObj = new Date(start);
  targetDateObj.setDate(targetDateObj.getDate() + plan.targetDays);
  const targetDate = `${targetDateObj.getFullYear()}-${(targetDateObj.getMonth() + 1).toString().padStart(2, '0')}-${targetDateObj.getDate().toString().padStart(2, '0')}`;

  const daysRemaining = Math.max(0, plan.targetDays - daysPassed);
  
  // expected juz by today
  const expectedJuzToday = Math.min(30, Math.ceil(daysPassed * (30 / Math.max(1, plan.targetDays))));
  
  const completedCount = plan.completedJuzList.length;
  const completionPercent = Math.min(100, Math.round((completedCount / 30) * 100));

  const isAhead = completedCount >= expectedJuzToday;

  return {
    daysPassed,
    daysRemaining,
    expectedJuzToday,
    completionPercent,
    targetDate,
    isAhead
  };
}
