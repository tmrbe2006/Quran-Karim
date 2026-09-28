import { Reciter } from '../types';
import { AUDIO_BASE_URL } from '../constants';

const DB_NAME = 'quran_audio_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'audio_files';

export interface CachedAudioRecord {
  /** Unique key: `${reciterId}_${surahNumber}_${ayahNumberInSurah}` */
  id: string;
  reciterId: string;
  reciterIdentifier: string;
  reciterName: string;
  surahNumber: number;
  ayahNumberInSurah: number;
  globalAyahNumber?: number;
  audioData?: ArrayBuffer;
  audioBlob?: Blob;
  size: number;
  downloadedAt: number;
}

let dbInstance: IDBDatabase | null = null;

export async function openAudioDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported on this platform'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('reciterId', 'reciterId', { unique: false });
        store.createIndex('reciter_surah', ['reciterId', 'surahNumber'], { unique: false });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export function buildAudioKey(reciterId: string, surahNumber: number, ayahNumberInSurah: number): string {
  return `${reciterId}_${surahNumber}_${ayahNumberInSurah}`;
}

/**
 * Save audio into reciter's storage using ArrayBuffer (100% safe across mobile iOS Safari and Android)
 * and mirror to CacheStorage
 */
export async function saveAyahAudio(
  reciter: Reciter,
  surahNumber: number,
  ayahNumberInSurah: number,
  blob: Blob,
  audioUrl?: string,
  globalAyahNumber?: number
): Promise<void> {
  let arrayBuffer: ArrayBuffer | null = null;
  try {
    arrayBuffer = await blob.arrayBuffer();
  } catch (e) {
    console.warn('Could not convert blob to arrayBuffer', e);
  }

  const key = buildAudioKey(reciter.id, surahNumber, ayahNumberInSurah);
  const altKey = reciter.identifier ? buildAudioKey(reciter.identifier, surahNumber, ayahNumberInSurah) : null;
  const size = arrayBuffer ? arrayBuffer.byteLength : blob.size;

  // 1. Save to IndexedDB using ArrayBuffer (never throws DataCloneError on iOS WebKit)
  try {
    const db = await openAudioDB();
    const record: CachedAudioRecord = {
      id: key,
      reciterId: reciter.id,
      reciterIdentifier: reciter.identifier,
      reciterName: reciter.name,
      surahNumber,
      ayahNumberInSurah,
      globalAyahNumber,
      audioData: arrayBuffer || undefined,
      audioBlob: !arrayBuffer ? blob : undefined,
      size,
      downloadedAt: Date.now()
    };

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const putReq = store.put(record);
      if (altKey && altKey !== key) {
        store.put({ ...record, id: altKey });
      }
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    });
  } catch (error) {
    console.warn('IndexedDB save warning:', error);
  }

  // 2. Also save to CacheStorage (both reciter cache and general audio cache)
  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const bodyData = arrayBuffer ? arrayBuffer.slice(0) : blob;
      const resp = new Response(bodyData, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': size.toString(),
          'X-Reciter-Id': reciter.id,
          'X-Surah': surahNumber.toString(),
          'X-Ayah': ayahNumberInSurah.toString()
        }
      });
      const reciterCache = await caches.open(`quran-audio-${reciter.identifier}`);
      const generalCache = await caches.open('quran-audio-cache');

      if (audioUrl) {
        await reciterCache.put(audioUrl, resp.clone());
        await generalCache.put(audioUrl, resp.clone());
      }

      // Also cache standard fallback URL patterns
      const surahStr = surahNumber.toString().padStart(3, '0');
      const ayahStr = ayahNumberInSurah.toString().padStart(3, '0');
      const everyAyahUrl = `${AUDIO_BASE_URL}/${reciter.subfolder}/${surahStr}${ayahStr}.mp3`;
      await reciterCache.put(everyAyahUrl, resp.clone());
      await generalCache.put(everyAyahUrl, resp);
    } catch (e) {
      console.warn('CacheStorage mirror warning:', e);
    }
  }
}

/**
 * Retrieve cached audio blob for a specific reciter, surah, and ayah
 */
export async function getAyahAudio(
  reciter: Reciter,
  surahNumber: number,
  ayahNumberInSurah: number,
  audioUrl?: string
): Promise<Blob | null> {
  const keysToTry = [
    buildAudioKey(reciter.id, surahNumber, ayahNumberInSurah),
    reciter.identifier ? buildAudioKey(reciter.identifier, surahNumber, ayahNumberInSurah) : null,
    reciter.subfolder ? buildAudioKey(reciter.subfolder, surahNumber, ayahNumberInSurah) : null
  ].filter(Boolean) as string[];

  // 1. Try IndexedDB with any key variant
  try {
    const db = await openAudioDB();
    for (const key of keysToTry) {
      const record = await new Promise<CachedAudioRecord | null>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const getReq = store.get(key);
        getReq.onsuccess = () => resolve((getReq.result as CachedAudioRecord) || null);
        getReq.onerror = () => resolve(null);
      });

      if (record) {
        if (record.audioData) {
          return new Blob([record.audioData], { type: 'audio/mpeg' });
        }
        if (record.audioBlob) {
          return record.audioBlob;
        }
      }
    }
  } catch (e) {
    console.warn('IndexedDB read error', e);
  }

  // 2. Try CacheStorage across all possible URLs
  if (typeof window !== 'undefined' && 'caches' in window) {
    const surahStr = surahNumber.toString().padStart(3, '0');
    const ayahStr = ayahNumberInSurah.toString().padStart(3, '0');
    const standardUrl = `${AUDIO_BASE_URL}/${reciter.subfolder}/${surahStr}${ayahStr}.mp3`;
    const urlsToTry = [audioUrl, standardUrl].filter(Boolean) as string[];

    for (const url of urlsToTry) {
      try {
        const reciterCache = await caches.open(`quran-audio-${reciter.identifier}`);
        const rMatch = await reciterCache.match(url);
        if (rMatch) {
          return await rMatch.blob();
        }

        const generalCache = await caches.open('quran-audio-cache');
        const gMatch = await generalCache.match(url);
        if (gMatch) {
          return await gMatch.blob();
        }

        const anyMatch = await caches.match(url);
        if (anyMatch) {
          return await anyMatch.blob();
        }
      } catch (e) {}
    }
  }

  return null;
}

/**
 * Check if a specific ayah audio is already downloaded offline
 */
export async function isAyahAudioDownloaded(
  reciterId: string,
  surahNumber: number,
  ayahNumberInSurah: number,
  audioUrl?: string
): Promise<boolean> {
  const key = buildAudioKey(reciterId, surahNumber, ayahNumberInSurah);
  try {
    const db = await openAudioDB();
    const count = await new Promise<number>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.count(IDBKeyRange.only(key));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(0);
    });
    if (count > 0) return true;
  } catch {}

  if (audioUrl && typeof window !== 'undefined' && 'caches' in window) {
    try {
      const match = await caches.match(audioUrl);
      if (match) return true;
    } catch {}
  }

  return false;
}

/**
 * Get detailed offline status for a surah's audio
 */
export async function getSurahAudioStatus(
  reciter: Reciter,
  surahNumber: number,
  numberOfAyahs: number
): Promise<{ isComplete: boolean; downloadedCount: number; total: number }> {
  let downloadedCount = 0;
  try {
    const db = await openAudioDB();
    const checkPromises: Promise<boolean>[] = [];

    for (let aNum = 1; aNum <= numberOfAyahs; aNum++) {
      const key = buildAudioKey(reciter.id, surahNumber, aNum);
      checkPromises.push(new Promise<boolean>((resolve) => {
        try {
          const tx = db.transaction(STORE_NAME, 'readonly');
          const store = tx.objectStore(STORE_NAME);
          const req = store.get(key);
          req.onsuccess = () => resolve(!!req.result);
          req.onerror = () => resolve(false);
        } catch {
          resolve(false);
        }
      }));
    }

    const results = await Promise.all(checkPromises);
    downloadedCount = results.filter(Boolean).length;
  } catch (e) {
    console.warn('getSurahAudioStatus error', e);
  }

  return {
    isComplete: downloadedCount >= numberOfAyahs && numberOfAyahs > 0,
    downloadedCount,
    total: numberOfAyahs
  };
}

/**
 * Fast concurrent downloader for an entire Surah's audio with batching and progress
 */
export async function downloadSurahAudio(
  reciter: Reciter,
  surahNumber: number,
  numberOfAyahs: number,
  onProgress?: (progressPercent: number, downloadedCount: number, total: number) => void
): Promise<void> {
  const surahStr = surahNumber.toString().padStart(3, '0');
  let downloadedCount = 0;

  // Process in concurrent batches of 4 for speed & reliability without hitting limits
  const BATCH_SIZE = 4;
  const ayahIndices = Array.from({ length: numberOfAyahs }, (_, i) => i + 1);

  for (let i = 0; i < ayahIndices.length; i += BATCH_SIZE) {
    const batch = ayahIndices.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (aNum) => {
        const ayahStr = aNum.toString().padStart(3, '0');
        const audioUrl = `${AUDIO_BASE_URL}/${reciter.subfolder}/${surahStr}${ayahStr}.mp3`;

        try {
          const existing = await getAyahAudio(reciter, surahNumber, aNum, audioUrl);
          if (!existing) {
            const res = await fetch(audioUrl);
            if (res.ok) {
              const blob = await res.blob();
              await saveAyahAudio(reciter, surahNumber, aNum, blob, audioUrl);
            }
          }
        } catch (e) {
          console.warn(`Failed downloading audio for surah ${surahNumber} ayah ${aNum}`, e);
        }
        downloadedCount++;
        if (onProgress) {
          const pct = Math.round((downloadedCount / numberOfAyahs) * 100);
          onProgress(pct, downloadedCount, numberOfAyahs);
        }
      })
    );
  }
}

/**
 * Delete audio for a specific surah
 */
export async function deleteSurahAudio(
  reciter: Reciter,
  surahNumber: number,
  numberOfAyahs: number
): Promise<void> {
  try {
    const db = await openAudioDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      for (let aNum = 1; aNum <= numberOfAyahs; aNum++) {
        const key = buildAudioKey(reciter.id, surahNumber, aNum);
        const altKey = reciter.identifier ? buildAudioKey(reciter.identifier, surahNumber, aNum) : null;
        store.delete(key);
        if (altKey) store.delete(altKey);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });

    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        const surahStr = surahNumber.toString().padStart(3, '0');
        const reciterCache = await caches.open(`quran-audio-${reciter.identifier}`);
        for (let aNum = 1; aNum <= numberOfAyahs; aNum++) {
          const ayahStr = aNum.toString().padStart(3, '0');
          const audioUrl = `${AUDIO_BASE_URL}/${reciter.subfolder}/${surahStr}${ayahStr}.mp3`;
          await reciterCache.delete(audioUrl);
        }
      } catch {}
    }
  } catch (e) {
    console.warn('deleteSurahAudio failed', e);
  }
}

/**
 * Download all audio for a single surah for the given reciter (legacy alias)
 */
export async function downloadSingleSurahAudio(
  reciter: Reciter,
  surahNumber: number,
  numberOfAyahs: number,
  onProgress?: (progressPercent: number) => void
): Promise<void> {
  return downloadSurahAudio(reciter, surahNumber, numberOfAyahs, (pct) => {
    if (onProgress) onProgress(pct);
  });
}

/**
 * Get reciter downloaded stats (count of ayahs & total MB)
 */
export async function getReciterAudioStats(reciterId: string): Promise<{ count: number; totalBytes: number }> {
  try {
    const db = await openAudioDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('reciterId');
      const req = index.openCursor(IDBKeyRange.only(reciterId));

      const seenAyahs = new Set<string>();
      let totalBytes = 0;

      req.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest).result as IDBCursorWithValue | null;
        if (cursor) {
          const v = cursor.value as CachedAudioRecord;
          const ayahKey = `${v.surahNumber}_${v.ayahNumberInSurah}`;
          if (!seenAyahs.has(ayahKey)) {
            seenAyahs.add(ayahKey);
            totalBytes += v.size || 0;
          }
          cursor.continue();
        } else {
          resolve({ count: seenAyahs.size, totalBytes });
        }
      };
      req.onerror = () => resolve({ count: 0, totalBytes: 0 });
    });
  } catch {
    return { count: 0, totalBytes: 0 };
  }
}

/**
 * Delete all cached audio files for a specific reciter
 */
export async function clearReciterAudio(reciter: Reciter): Promise<void> {
  try {
    const db = await openAudioDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('reciterId');
      const req = index.openCursor(IDBKeyRange.only(reciter.id));

      req.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest).result as IDBCursorWithValue | null;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      req.onerror = () => reject(req.error);
    });

    if (typeof window !== 'undefined' && 'caches' in window) {
      await caches.delete(`quran-audio-${reciter.identifier}`);
    }
  } catch (e) {
    console.warn('Failed to clear reciter audio', e);
  }
}
