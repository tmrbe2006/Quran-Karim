export interface Surah {
  number: number;
  name: string;
  englishName: string;
  numberOfAyahs: number;
  revelationType: string;
}

export interface Ayah {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  tafsir?: string;
}

export interface Reciter {
  id: string;
  name: string;
  identifier: string;
  subfolder: string;
}

export interface AppSettings {
  fontSize: number;
  textColor: string;
  backgroundColor: string;
  trueDarkMode?: boolean;
  tafsirEdition?: string; // e.g. 'ar.muyassar' | 'ar.ibnkathir' | 'ar.jalalayn'
}

export interface FavoriteAyah {
  surahNumber: number;
  surahName: string;
  ayahNumberInSurah: number;
  text: string;
  indexInSurah: number;
}

export interface BookmarkAyah {
  surahNumber: number;
  surahName: string;
  ayahNumberInSurah: number;
  text: string;
  indexInSurah: number;
}

export interface MemorizationState {
  isActive: boolean;
  startAyah: number;
  endAyah: number;
  ayahRepetitions: number;
  rangeRepetitions: number;
  currentAyahRep: number;
  currentRangeRep: number;
  hideAyahs: boolean;
}

export interface PlaybackState {
  currentSurah: Surah | null;
  currentAyahIndex: number;
  isPlaying: boolean;
  reciter: Reciter;
}