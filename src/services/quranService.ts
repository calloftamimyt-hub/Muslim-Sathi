import { openDB, IDBPDatabase } from 'idb';
import axios from 'axios';

const DB_NAME = 'quran_offline_db';
const SURAHS_STORE = 'surahs';
const AYAHS_STORE = 'ayahs';
const DB_VERSION = 1;

export interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

export interface Ayah {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  manzil: number;
  page: number;
  ruku: number;
  hizbQuarter: number;
  sajda: boolean;
}

export interface SurahDetail {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  revelationType: string;
  numberOfAyahs: number;
  ayahs: Ayah[];
  translation?: Ayah[];
}

class QuranService {
  private db: Promise<IDBPDatabase>;

  constructor() {
    this.db = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(SURAHS_STORE)) {
          db.createObjectStore(SURAHS_STORE, { keyPath: 'number' });
        }
        if (!db.objectStoreNames.contains(AYAHS_STORE)) {
          db.createObjectStore(AYAHS_STORE, { keyPath: 'id' });
        }
      },
    });
  }

  async getSurahs(): Promise<Surah[]> {
    const db = await this.db;
    const cached = await db.getAll(SURAHS_STORE);
    
    if (cached.length > 0) {
      return cached;
    }

    try {
      const response = await axios.get('https://api.alquran.cloud/v1/surah');
      const surahs = response.data.data;
      
      // Cache them
      const tx = db.transaction(SURAHS_STORE, 'readwrite');
      for (const surah of surahs) {
        await tx.store.put(surah);
      }
      await tx.done;
      
      return surahs;
    } catch (error) {
      console.error('Error fetching surahs:', error);
      return [];
    }
  }

  async getSurahDetail(surahNumber: number, language: string): Promise<SurahDetail | null> {
    const db = await this.db;
    const cacheKey = `${surahNumber}_${language}`;
    const cached = await db.get(AYAHS_STORE, cacheKey);

    if (cached) {
      return cached.data;
    }

    try {
      let translationEdition = 'bn.bengali';
      if (language === 'en') translationEdition = 'en.asad';
      else if (language === 'hi') translationEdition = 'hi.hindi';
      else if (language === 'ar') translationEdition = 'ar.jalalayn';

      const [arabicRes, translationRes] = await Promise.all([
        axios.get(`https://api.alquran.cloud/v1/surah/${surahNumber}`),
        axios.get(`https://api.alquran.cloud/v1/surah/${surahNumber}/${translationEdition}`)
      ]);

      const surahData = arabicRes.data.data;
      const translationData = translationRes.data.data.ayahs;

      const detail: SurahDetail = {
        ...surahData,
        translation: translationData
      };

      // Cache it
      await db.put(AYAHS_STORE, {
        id: cacheKey,
        data: detail,
        timestamp: Date.now()
      });

      return detail;
    } catch (error) {
      console.error('Error fetching surah detail:', error);
      return null;
    }
  }

  async isSurahCached(surahNumber: number, language: string): Promise<boolean> {
    const db = await this.db;
    const cacheKey = `${surahNumber}_${language}`;
    const cached = await db.get(AYAHS_STORE, cacheKey);
    return !!cached;
  }
}

export const quranService = new QuranService();
