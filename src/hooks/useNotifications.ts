import { useState, useEffect, useCallback } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  timestamp: number;
  read: boolean;
  data?: any;
}

const DB_NAME = 'AppNotificationsDB';
const STORE_NAME = 'notifications';

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    
    request.onsuccess = (event: any) => resolve(event.target.result);
    request.onerror = (event: any) => reject(event.target.error);
  });
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const loadNotifications = useCallback(async () => {
    try {
      const db = await getDB();
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      
      request.onsuccess = () => {
        // Sort by timestamp descending
        const data = request.result.sort((a, b) => b.timestamp - a.timestamp);
        setNotifications(data);
      };
    } catch (e) {
      console.error('Failed to load notifications from IndexedDB', e);
    }
  }, []);

  useEffect(() => {
    loadNotifications();

    // Listen for global notifications from Firestore
    const globalQuery = query(
      collection(db, 'global_notifications'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribeFirestore = onSnapshot(globalQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          const id = change.doc.id;
          
          // Check if this global notification is already in IndexedDB
          getDB().then(async (idb) => {
            const transaction = idb.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(id);
            
            request.onsuccess = () => {
              if (!request.result) {
                // Not in DB, add it
                addNotification({
                  id, // Use Firestore ID to prevent duplicates
                  title: data.title,
                  body: data.body,
                  timestamp: data.createdAt?.toMillis() || Date.now(),
                  read: false,
                  data: { link: data.link, imageUrl: data.imageUrl }
                });
              }
            };
          });
        }
      });
    }, (err) => {
      console.warn('Firestore Global Notifications Permission Error:', err.message);
    });

    // Listen for custom event to sync across tabs/foreground
    const handleCustomEvent = () => loadNotifications();
    window.addEventListener('app_notifications_updated', handleCustomEvent);
    
    // Also poll occasionally in case a background message was received
    const interval = setInterval(loadNotifications, 5000);
    
    // Listen for visibility change to reload when app comes to foreground
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadNotifications();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      unsubscribeFirestore();
      window.removeEventListener('app_notifications_updated', handleCustomEvent);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadNotifications]);

  const addNotification = async (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'> & { id?: string, timestamp?: number, read?: boolean }) => {
    const newNotif: AppNotification = {
      title: notification.title,
      body: notification.body,
      data: notification.data,
      id: notification.id || Math.random().toString(36).substring(2, 15),
      timestamp: notification.timestamp || Date.now(),
      read: notification.read || false,
    };
    
    try {
      const db = await getDB();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      // Use put instead of add to handle potential duplicates with same ID
      store.put(newNotif);
      
      transaction.oncomplete = () => {
        setNotifications(prev => {
          const exists = prev.some(n => n.id === newNotif.id);
          if (exists) {
            return prev.map(n => n.id === newNotif.id ? newNotif : n);
          }
          return [newNotif, ...prev].sort((a, b) => b.timestamp - a.timestamp);
        });
        window.dispatchEvent(new Event('app_notifications_updated'));
      };
    } catch (e) {
      console.error('Failed to add notification', e);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const db = await getDB();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);
      
      request.onsuccess = () => {
        const data = request.result;
        if (data) {
          data.read = true;
          store.put(data);
        }
      };
      
      transaction.oncomplete = () => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        window.dispatchEvent(new Event('app_notifications_updated'));
      };
    } catch (e) {
      console.error('Failed to mark as read', e);
    }
  };

  const markAllAsRead = async () => {
    try {
      const db = await getDB();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      
      request.onsuccess = () => {
        const data = request.result;
        data.forEach((item: AppNotification) => {
          if (!item.read) {
            item.read = true;
            store.put(item);
          }
        });
      };
      
      transaction.oncomplete = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        window.dispatchEvent(new Event('app_notifications_updated'));
      };
    } catch (e) {
      console.error('Failed to mark all as read', e);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const db = await getDB();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.delete(id);
      
      transaction.oncomplete = () => {
        setNotifications(prev => prev.filter(n => n.id !== id));
        window.dispatchEvent(new Event('app_notifications_updated'));
      };
    } catch (e) {
      console.error('Failed to delete notification', e);
    }
  };

  const deleteAll = async () => {
    try {
      const db = await getDB();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.clear();
      
      transaction.oncomplete = () => {
        setNotifications([]);
        window.dispatchEvent(new Event('app_notifications_updated'));
      };
    } catch (e) {
      console.error('Failed to delete all notifications', e);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAll,
    unreadCount
  };
}
