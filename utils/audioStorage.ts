import { Reciter } from '../types';

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
  audioBlob: Blob;
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
 * Save audio blob into reciter's dedicated storage and mirror to CacheStorage
 */
export async function saveAyahAudio(
  reciter: Reciter,
  surahNumber: number,
  ayahNumberInSurah: number,
  blob: Blob,
  audioUrl?: string,
  globalAyahNumber?: number
): Promise<void> {
  try {
    const db = await openAudioDB();
    const key = buildAudioKey(reciter.id, surahNumber, ayahNumberInSurah);

    const record: CachedAudioRecord = {
      id: key,
      reciterId: reciter.id,
      reciterIdentifier: reciter.identifier,
      reciterName: reciter.name,
      surahNumber,
      ayahNumberInSurah,
      globalAyahNumber,
      audioBlob: blob,
      size: blob.size,
      downloadedAt: Date.now()
    };

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const putReq = store.put(record);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    });

    // Also mirror to CacheStorage under dedicated reciter cache name
    if (audioUrl && typeof window !== 'undefined' && 'caches' in window) {
      try {
        const reciterCacheName = `quran-audio-${reciter.identifier}`;
        const cache = await caches.open(reciterCacheName);
        await cache.put(
          audioUrl,
          new Response(blob, {
            headers: {
              'Content-Type': 'audio/mpeg',
              'Content-Length': blob.size.toString(),
              'X-Reciter-Name': encodeURIComponent(reciter.name),
              'X-Surah': surahNumber.toString(),
              'X-Ayah': ayahNumberInSurah.toString()
            }
          })
        );
      } catch (e) {
        console.warn('CacheStorage mirror failed', e);
      }
    }
  } catch (error) {
    console.warn('Failed to save audio in IndexedDB:', error);
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
  // 1. Try IndexedDB first
  try {
    const db = await openAudioDB();
    const key = buildAudioKey(reciter.id, surahNumber, ayahNumberInSurah);

    const blob = await new Promise<Blob | null>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(key);
      getReq.onsuccess = () => {
        const result = getReq.result as CachedAudioRecord | undefined;
        resolve(result?.audioBlob || null);
      };
      getReq.onerror = () => resolve(null);
    });

    if (blob) return blob;
  } catch (e) {
    console.warn('IndexedDB read error', e);
  }

  // 2. Try reciter specific CacheStorage
  if (audioUrl && typeof window !== 'undefined' && 'caches' in window) {
    try {
      const reciterCacheName = `quran-audio-${reciter.identifier}`;
      const cache = await caches.open(reciterCacheName);
      const cachedRes = await cache.match(audioUrl);
      if (cachedRes) {
        return await cachedRes.blob();
      }

      // Check general audio cache fallback
      const generalCache = await caches.open('quran-audio-cache');
      const genRes = await generalCache.match(audioUrl);
      if (genRes) {
        return await genRes.blob();
      }
    } catch (e) {}
  }

  return null;
}

/**
 * Check if a specific ayah audio is already downloaded offline
 */
export async function isAyahAudioDownloaded(
  reciterId: string,
  surahNumber: number,
  ayahNumberInSurah: number
): Promise<boolean> {
  try {
    const db = await openAudioDB();
    const key = buildAudioKey(reciterId, surahNumber, ayahNumberInSurah);

    return new Promise<boolean>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.count(IDBKeyRange.only(key));
      req.onsuccess = () => resolve(req.result > 0);
      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
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

      let count = 0;
      let totalBytes = 0;

      req.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest).result as IDBCursorWithValue | null;
        if (cursor) {
          count++;
          totalBytes += (cursor.value as CachedAudioRecord).size || 0;
          cursor.continue();
        } else {
          resolve({ count, totalBytes });
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
