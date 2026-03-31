import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'islamic_app_storage';
const STORE_NAME = 'downloads';
const DB_VERSION = 1;

export interface DownloadedFile {
  id: string;
  name: string;
  type: 'audio' | 'pdf' | 'other';
  size: number;
  blob: Blob;
  timestamp: number;
  metadata?: any;
}

export interface StorageUsage {
  app: number;
  downloads: number;
  cache: number;
  total: number;
}

class StorageService {
  private db: Promise<IDBPDatabase>;

  constructor() {
    this.db = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      },
    });
  }

  async saveDownload(file: DownloadedFile): Promise<void> {
    const db = await this.db;
    await db.put(STORE_NAME, file);
  }

  async getDownloads(): Promise<DownloadedFile[]> {
    const db = await this.db;
    return db.getAll(STORE_NAME);
  }

  async deleteDownload(id: string): Promise<void> {
    const db = await this.db;
    await db.delete(STORE_NAME, id);
  }

  async deleteAllDownloads(): Promise<void> {
    const db = await this.db;
    await db.clear(STORE_NAME);
  }

  async getStorageUsage(): Promise<StorageUsage> {
    const downloads = await this.getDownloads();
    const downloadsSize = downloads.reduce((acc, file) => acc + file.size, 0);
    
    // Accurate localStorage size calculation
    let localStorageSize = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key) || "";
          localStorageSize += (key.length + value.length) * 2; // 2 bytes per char
        }
      }
    } catch (e) {
      console.error("Error calculating localStorage size:", e);
    }

    // App assets size is managed by browser, we show 0 if we want it to reach zero on clear
    // Or we can estimate it as 0 for this specific UI request
    const appSize = 0; 

    return {
      app: appSize,
      downloads: downloadsSize,
      cache: localStorageSize,
      total: appSize + downloadsSize + localStorageSize
    };
  }

  async clearCache(): Promise<void> {
    // Clear all localStorage except essential settings
    const essentialKeys = ['islamic_app_settings', 'app_language', 'app_theme', 'user_auth_state'];
    const savedData: Record<string, string> = {};
    
    essentialKeys.forEach(key => {
      const val = localStorage.getItem(key);
      if (val) savedData[key] = val;
    });
    
    localStorage.clear();
    
    // Restore essential settings
    Object.entries(savedData).forEach(([key, val]) => {
      localStorage.setItem(key, val);
    });

    // Clear Cache API
    if ('caches' in window) {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map(key => caches.delete(key)));
      } catch (e) {
        console.error("Error clearing Cache API:", e);
      }
    }

    // Clear session storage as well
    sessionStorage.clear();
  }
}

export const storageService = new StorageService();
