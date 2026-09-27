import { Ayah, Surah } from '../types';

let cachedQuranUthmani: any = null;
let cachedTafsirJalalayn: any = null;

/**
 * Loads the bundled full Quran dataset (from /data/quran-uthmani.json)
 */
export async function getFullQuranData(): Promise<any> {
  if (cachedQuranUthmani) return cachedQuranUthmani;
  try {
    const res = await fetch('/data/quran-uthmani.json');
    if (res.ok) {
      cachedQuranUthmani = await res.json();
      return cachedQuranUthmani;
    }
  } catch (e) {
    console.warn('Could not load local /data/quran-uthmani.json', e);
  }
  return null;
}

/**
 * Loads the bundled full Tafsir Jalalayn dataset (from /data/tafsir-jalalayn.json)
 */
export async function getFullTafsirData(): Promise<any> {
  if (cachedTafsirJalalayn) return cachedTafsirJalalayn;
  try {
    const res = await fetch('/data/tafsir-jalalayn.json');
    if (res.ok) {
      cachedTafsirJalalayn = await res.json();
      return cachedTafsirJalalayn;
    }
  } catch (e) {
    console.warn('Could not load local /data/tafsir-jalalayn.json', e);
  }
  return null;
}

/**
 * Returns all ayahs of a surah from offline local files or cache
 */
export async function getOfflineSurahAyahs(surahNumber: number): Promise<Ayah[] | null> {
  try {
    const [quranData, tafsirData] = await Promise.all([
      getFullQuranData(),
      getFullTafsirData()
    ]);

    const surah = quranData?.data?.surahs?.find((s: any) => s.number === surahNumber);
    if (!surah || !surah.ayahs) return null;

    const tafsirSurah = tafsirData?.data?.surahs?.find((s: any) => s.number === surahNumber);

    return surah.ayahs.map((a: any, idx: number) => ({
      number: a.number,
      text: a.text,
      numberInSurah: a.numberInSurah,
      juz: a.juz,
      tafsir: tafsirSurah?.ayahs?.[idx]?.text || 'تفسير الجلالين'
    }));
  } catch (e) {
    console.warn('getOfflineSurahAyahs failed', e);
    return null;
  }
}

/**
 * Clean arabic text for accurate search matching
 */
function normalizeArabic(text: string): string {
  return text
    // remove diacritics / tashkeel
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED]/g, '')
    // normalize alefs
    .replace(/[أإآٱ]/g, 'ا')
    // normalize teh marbuta & heh
    .replace(/ة/g, 'ه')
    // normalize yeh
    .replace(/[ىي]/g, 'ي');
}

/**
 * Searches the entire Quran offline instantly using the bundled dataset
 */
export async function searchInQuranOffline(query: string, maxResults = 50): Promise<any[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const quranData = await getFullQuranData();
  if (!quranData?.data?.surahs) return [];

  const normQuery = normalizeArabic(trimmed);
  const results: any[] = [];

  for (const surah of quranData.data.surahs) {
    for (const ayah of surah.ayahs) {
      const normAyahText = normalizeArabic(ayah.text);
      if (normAyahText.includes(normQuery) || ayah.text.includes(trimmed)) {
        results.push({
          surahNumber: surah.number,
          surahName: surah.name,
          numberInSurah: ayah.numberInSurah,
          text: ayah.text
        });
        if (results.length >= maxResults) return results;
      }
    }
  }

  return results;
}
