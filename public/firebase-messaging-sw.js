importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
  projectId: "gen-lang-client-0377603990",
  appId: "1:1088380836747:web:c14255adb7b518177e6d8e",
  apiKey: "AIzaSyDdcAkKDS1xXrNjp8QjH3Bv7SkyNCoPUX8",
  authDomain: "gen-lang-client-0377603990.firebaseapp.com",
  storageBucket: "gen-lang-client-0377603990.firebasestorage.app",
  messagingSenderId: "1088380836747"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Helper to save to IndexedDB
function saveNotificationToDB(notification) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('AppNotificationsDB', 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('notifications')) {
        db.createObjectStore('notifications', { keyPath: 'id' });
      }
    };
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['notifications'], 'readwrite');
      const store = transaction.objectStore('notifications');
      
      const newNotif = {
        id: Math.random().toString(36).substring(2, 15),
        title: notification.title || 'New Notification',
        body: notification.body || '',
        data: notification.data || {},
        timestamp: Date.now(),
        read: false
      };
      
      store.add(newNotif);
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = (err) => reject(err);
    };
    
    request.onerror = (err) => reject(err);
  });
}

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body,
    icon: '/vite.svg',
    data: payload.data
  };

  // Save to IndexedDB
  saveNotificationToDB({
    title: notificationTitle,
    body: notificationOptions.body,
    data: payload.data
  }).catch(console.error);

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
