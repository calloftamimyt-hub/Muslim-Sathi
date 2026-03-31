import React, { useEffect } from 'react';
import { Trash2, BellOff, CheckCircle2 } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { useLanguage } from '../contexts/LanguageContext';
import { format } from 'date-fns';
import { bn, enUS } from 'date-fns/locale';

interface NotificationsProps {
}

export default function Notifications() {
  const { language, t } = useLanguage();
  const { notifications, deleteNotification, deleteAll, markAllAsRead, markAsRead } = useNotifications();

  // Mark all as read when opening the page
  useEffect(() => {
    if (notifications.some(n => !n.read)) {
      markAllAsRead();
    }
  }, [notifications, markAllAsRead]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return format(date, 'PPp', { locale: language === 'bn' ? bn : enUS });
  };

  return (
    <div className="fixed inset-0 bg-slate-50 dark:bg-slate-900 z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 pt-safe">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center">
            <h1 className="text-lg font-semibold text-slate-800 dark:text-white">
              {language === 'bn' ? 'নোটিফিকেশন' : 'Notifications'}
            </h1>
          </div>
          
          {notifications.length > 0 && (
            <button
              onClick={deleteAll}
              className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-full transition-colors"
              title={language === 'bn' ? 'সব মুছুন' : 'Delete All'}
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <BellOff className="w-8 h-8" />
            </div>
            <p className="text-lg font-medium">
              {language === 'bn' ? 'কোনো নোটিফিকেশন নেই' : 'No notifications'}
            </p>
            <p className="text-sm mt-1">
              {language === 'bn' ? 'নতুন আপডেট এখানে দেখা যাবে' : 'New updates will appear here'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div 
                key={notification.id}
                className={`bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border transition-all ${
                  notification.read 
                    ? 'border-slate-100 dark:border-slate-700' 
                    : 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-500/5'
                }`}
                onClick={() => !notification.read && markAsRead(notification.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className={`font-semibold text-slate-800 dark:text-white ${!notification.read ? 'text-emerald-700 dark:text-emerald-400' : ''}`}>
                      {notification.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      {notification.body}
                    </p>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-3 font-medium">
                      {formatDate(notification.timestamp)}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                    className="p-2 -mr-2 -mt-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-full transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
