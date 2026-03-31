import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Clock, Trash2, Bell, BellOff } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { motion, AnimatePresence } from 'motion/react';

interface Alarm {
  id: number;
  time: string; // 24h format internally
  displayTime?: string;
  period?: 'AM' | 'PM';
  days: number[]; // 0-6 (Sun-Sat)
  enabled: boolean;
  sound?: string;
}

export const AlarmList = ({ onBack, onAdd, onEdit }: { onBack: () => void, onAdd: () => void, onEdit: (alarm: Alarm) => void }) => {
  const { t, language } = useLanguage();
  const [alarms, setAlarms] = useState<Alarm[]>([]);

  useEffect(() => {
    const savedAlarms = localStorage.getItem('alarms');
    if (savedAlarms) {
      setAlarms(JSON.parse(savedAlarms));
    }
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const permStatus = await LocalNotifications.checkPermissions();
        if (permStatus.display !== 'granted') {
          await LocalNotifications.requestPermissions();
        }
      } catch (e) {
        console.error("Permission request failed", e);
      }
    }
  };

  const toggleAlarm = async (alarm: Alarm) => {
    const updatedEnabled = !alarm.enabled;
    const updatedAlarms = alarms.map(a => a.id === alarm.id ? { ...a, enabled: updatedEnabled } : a);
    setAlarms(updatedAlarms);
    localStorage.setItem('alarms', JSON.stringify(updatedAlarms));

    if (Capacitor.isNativePlatform()) {
      if (updatedEnabled) {
        // Reschedule
        const [hours, minutes] = alarm.time.split(':').map(Number);
        const notificationsToSchedule = [];
        
        const finalSound = alarm.sound || 'azan.wav';
        const soundName = finalSound === 'system_default' ? undefined : finalSound.replace(/\.[^/.]+$/, "");
        const channelId = soundName ? `alarm_channel_${soundName.replace(/[^a-z0-9]/gi, '_')}` : 'default_alarm_channel';

        await LocalNotifications.createChannel({
          id: channelId,
          name: soundName ? `Alarm Channel - ${soundName}` : 'Default Alarm Channel',
          importance: 5,
          sound: soundName,
          visibility: 1,
          vibration: true,
        });

        for (const day of alarm.days) {
          notificationsToSchedule.push({
            title: language === 'bn' ? 'এলার্ম' : 'Alarm',
            body: language === 'bn' ? 'আপনার এলার্ম বাজছে!' : 'Your alarm is ringing!',
            id: parseInt(`${alarm.id}${day}`.substring(0, 9)),
            schedule: {
              on: {
                weekday: day + 1,
                hour: hours,
                minute: minutes,
              },
              allowWhileIdle: true
            },
            sound: soundName,
            channelId: channelId
          });
        }
        if (notificationsToSchedule.length > 0) {
          await LocalNotifications.schedule({ notifications: notificationsToSchedule });
        }
      } else {
        // Cancel
        const pending = await LocalNotifications.getPending();
        const toCancel = pending.notifications.filter(n => String(n.id).startsWith(String(alarm.id).substring(0, 8)));
        if (toCancel.length > 0) {
          await LocalNotifications.cancel({ notifications: toCancel });
        }
      }
    }
  };

  const deleteAlarm = async (alarm: Alarm) => {
    const updatedAlarms = alarms.filter(a => a.id !== alarm.id);
    setAlarms(updatedAlarms);
    localStorage.setItem('alarms', JSON.stringify(updatedAlarms));
    
    if (Capacitor.isNativePlatform()) {
      const pending = await LocalNotifications.getPending();
      const toCancel = pending.notifications.filter(n => String(n.id).startsWith(String(alarm.id).substring(0, 8)));
      if (toCancel.length > 0) {
        await LocalNotifications.cancel({ notifications: toCancel });
      }
    }
  };

  const formatDisplayTime = (alarm: Alarm) => {
    if (alarm.displayTime && alarm.period) {
      return { time: alarm.displayTime, period: alarm.period };
    }
    // Fallback for old alarms
    const [h, m] = alarm.time.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return { time: `${hour}:${m.toString().padStart(2, '0')}`, period };
  };

  const dayNames = language === 'bn' ? ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="h-screen w-full bg-[#F8FAFC] dark:bg-slate-950 flex flex-col font-sans">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
            {language === 'bn' ? 'এলার্ম' : 'Alarms'}
          </h2>
        </div>
        <button 
          onClick={onAdd} 
          className="w-10 h-10 bg-primary hover:bg-primary-dark text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 transition-transform active:scale-95"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
      
      {/* Alarm List */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto pb-24">
        <AnimatePresence>
          {alarms.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full text-center px-6"
            >
              <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                <BellOff className="w-10 h-10 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">
                {language === 'bn' ? 'কোনো এলার্ম নেই' : 'No Alarms'}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                {language === 'bn' ? 'নতুন এলার্ম সেট করতে উপরের + বাটনে ক্লিক করুন' : 'Click the + button above to set a new alarm'}
              </p>
            </motion.div>
          ) : (
            alarms.map(alarm => {
              const { time, period } = formatDisplayTime(alarm);
              return (
                <motion.div 
                  key={alarm.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border transition-all duration-300 ${
                    alarm.enabled 
                      ? 'border-slate-200/60 dark:border-slate-700/60 shadow-slate-200/50 dark:shadow-none' 
                      : 'border-slate-100 dark:border-slate-800 opacity-70'
                  }`}
                  onClick={() => onEdit(alarm)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-baseline gap-1 cursor-pointer">
                      <span className={`text-3xl font-black tracking-tight ${alarm.enabled ? 'text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                        {time}
                      </span>
                      <span className={`text-base font-bold ${alarm.enabled ? 'text-primary dark:text-primary-light' : 'text-slate-400 dark:text-slate-500'}`}>
                        {period}
                      </span>
                    </div>
                    
                    {/* Custom Premium Toggle */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleAlarm(alarm); }}
                      className={`relative w-12 h-7 rounded-lg p-1 transition-colors duration-300 ease-in-out ${
                        alarm.enabled ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md bg-white shadow-sm transition-transform duration-300 ease-in-out flex items-center justify-center ${
                        alarm.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}>
                        {alarm.enabled && <Bell className="w-3 h-3 text-primary" />}
                      </div>
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex flex-wrap gap-1.5">
                      {alarm.days.length === 7 ? (
                        <span className="text-xs font-medium px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg">
                          {language === 'bn' ? 'প্রতিদিন' : 'Every day'}
                        </span>
                      ) : (
                        alarm.days.map(d => (
                          <span key={d} className="text-[11px] font-bold px-2 py-1 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light rounded-md">
                            {dayNames[d]}
                          </span>
                        ))
                      )}
                    </div>
                    
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteAlarm(alarm); }} 
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-full transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
