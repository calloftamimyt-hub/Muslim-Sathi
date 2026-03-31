import { useEffect } from 'react';
import { messaging } from '../lib/firebase';
import { onMessage } from 'firebase/messaging';
import { useNotifications } from '../hooks/useNotifications';

export function NotificationManager() {
  const { addNotification } = useNotifications();

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupMessaging = async () => {
      try {
        const msg = await messaging();
        if (msg) {
          unsubscribe = onMessage(msg, (payload) => {
            console.log('Received foreground message ', payload);
            
            if (payload.notification) {
              addNotification({
                title: payload.notification.title || 'New Notification',
                body: payload.notification.body || '',
                data: payload.data
              });
            }
          });
        }
      } catch (error) {
        console.error('Error setting up messaging:', error);
      }
    };

    setupMessaging();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [addNotification]);

  return null;
}
