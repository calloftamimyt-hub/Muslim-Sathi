import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Clock, Volume2, Bell, CheckCircle2, Circle, Play, Square } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { motion } from 'motion/react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export const AlarmSettingsView = ({ onBack }: { onBack: () => void }) => {
  const { t, language } = useLanguage();

  const DEFAULT_RINGTONES = [
    { id: 'azan.wav', name: language === 'bn' ? 'আজান' : 'Azan' },
    { id: 'beep.wav', name: language === 'bn' ? 'বিপ' : 'Beep' },
    { id: 'bing.wav', name: language === 'bn' ? 'বিং' : 'Bing' }
  ];
  const [alarmTime, setAlarmTime] = useState('05:00');
  const [isAlarmEnabled, setIsAlarmEnabled] = useState(false);
  const [selectedRingtone, setSelectedRingtone] = useState(DEFAULT_RINGTONES[0].id);
  const [customRingtoneName, setCustomRingtoneName] = useState('');
  
  // Audio preview state
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkExistingAlarms();
    
    // Cleanup audio on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCustomRingtoneName(file.name);
      setSelectedRingtone('custom_file');
      if (isAlarmEnabled) setIsAlarmEnabled(false);
      
      // For preview in browser
      const url = URL.createObjectURL(file);
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const newAudio = new Audio(url);
      newAudio.play().catch(err => console.error("Preview failed", err));
      audioRef.current = newAudio;
      setPlayingId('custom_file');
      newAudio.onended = () => setPlayingId(null);
    }
  };

  const checkExistingAlarms = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const pending = await LocalNotifications.getPending();
        if (pending.notifications.length > 0) {
          setIsAlarmEnabled(true);
          // Try to extract time and sound from the first pending notification if possible
          const notif = pending.notifications[0];
          if (notif.schedule?.at) {
            const date = new Date(notif.schedule.at);
            const hours = date.getHours().toString().padStart(2, '0');
            const mins = date.getMinutes().toString().padStart(2, '0');
            setAlarmTime(`${hours}:${mins}`);
          }
          if ((notif as any).sound) {
            setSelectedRingtone((notif as any).sound);
          }
        }
      } catch (error) {
        console.error("Error checking alarms:", error);
      }
    }
  };

  const toggleAlarm = async () => {
    if (!Capacitor.isNativePlatform()) {
      alert('অ্যালার্ম ফিচারটি শুধুমাত্র অ্যান্ড্রয়েড/আইওএস ডিভাইসে কাজ করবে।');
      setIsAlarmEnabled(!isAlarmEnabled);
      return;
    }

    if (isAlarmEnabled) {
      // Cancel alarm
      try {
        const pending = await LocalNotifications.getPending();
        if (pending.notifications.length > 0) {
          await LocalNotifications.cancel({ notifications: pending.notifications });
        }
        setIsAlarmEnabled(false);
      } catch (error) {
        console.error("Error canceling alarm:", error);
      }
    } else {
      // Set alarm
      try {
        let permStatus = await LocalNotifications.checkPermissions();
        if (permStatus.display !== 'granted') {
          permStatus = await LocalNotifications.requestPermissions();
        }

        if (permStatus.display !== 'granted') {
          alert('নোটিফিকেশন পারমিশন দেওয়া হয়নি! দয়া করে সেটিংসে গিয়ে পারমিশন দিন।');
          return;
        }

        const now = new Date();
        const [hours, minutes] = alarmTime.split(':').map(Number);
        let alarmDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
        
        if (alarmDate <= now) {
          // If the time has already passed today, set it for tomorrow
          alarmDate.setDate(alarmDate.getDate() + 1);
        }

        const finalSound = selectedRingtone === 'custom_file' 
          ? customRingtoneName 
          : (selectedRingtone === 'manual' ? customRingtoneName : selectedRingtone);

        // Strip extension for Android res/raw compatibility
        const soundName = finalSound === 'system_default' ? undefined : finalSound.replace(/\.[^/.]+$/, "");
        const channelId = soundName ? `alarm_channel_${soundName.replace(/[^a-z0-9]/gi, '_')}` : 'default_alarm_channel';

        if (Capacitor.isNativePlatform()) {
          await LocalNotifications.createChannel({
            id: channelId,
            name: soundName ? `Alarm Channel - ${soundName}` : 'Default Alarm Channel',
            importance: 5,
            sound: soundName,
            visibility: 1,
            vibration: true,
          });
        }

        await LocalNotifications.schedule({
          notifications: [
            {
              title: language === 'bn' ? "নামাজের সময় হয়েছে" : "Prayer Time",
              body: language === 'bn' ? "দয়া করে নামাজের প্রস্তুতি নিন" : "Please prepare for prayer",
              id: Math.floor(Math.random() * 10000) + 1, // Generate random ID to avoid conflicts
              schedule: { at: alarmDate, allowWhileIdle: true },
              sound: soundName,
              channelId: channelId,
              actionTypeId: "",
              extra: null
            }
          ]
        });
        
        setIsAlarmEnabled(true);
        alert(language === 'bn' ? `অ্যালার্ম সেট করা হয়েছে: ${alarmDate.toLocaleTimeString()}` : `Alarm set for: ${alarmDate.toLocaleTimeString()}`);
      } catch (error) {
        console.error("Error setting alarm:", error);
        alert('অ্যালার্ম সেট করতে সমস্যা হয়েছে। দয়া করে নিশ্চিত করুন যে আপনার অ্যাপে Exact Alarm পারমিশন দেওয়া আছে।');
      }
    }
  };

  const togglePlay = (ringtoneId: string) => {
    if (playingId === ringtoneId) {
      // Stop playing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setPlayingId(null);
    } else {
      // Play new audio
      if (audioRef.current) {
        audioRef.current.pause();
      }

      if (ringtoneId === 'custom_file' || ringtoneId === 'manual' || ringtoneId === 'system_default') {
        return; // Preview not available for these without extra logic
      }

      // Assuming audio files are in the public/sounds folder for preview
      const newAudio = new Audio(`/sounds/${ringtoneId}`);
      newAudio.play().catch(e => {
        console.error("Audio playback failed", e);
        setPlayingId(null);
      });
      
      newAudio.onended = () => {
        setPlayingId(null);
      };
      
      audioRef.current = newAudio;
      setPlayingId(ringtoneId);
    }
  };

  const handleSelectRingtone = (ringtoneId: string) => {
    setSelectedRingtone(ringtoneId);
    if (isAlarmEnabled) setIsAlarmEnabled(false); // Require re-enabling to apply new sound
  };

  return (
    <div className="h-screen w-full bg-slate-50 dark:bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center p-4 pt-12 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 z-10 sticky top-0">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
          <ArrowLeft className="w-6 h-6 text-slate-700 dark:text-slate-200" />
        </button>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white ml-4">{t('set-alarm')}</h2>
      </div>
      
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-32">
        <div className="p-6 flex flex-col items-center space-y-8 max-w-md mx-auto">
          
          {/* Time Picker Card */}
          <div className="w-full bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Clock className="w-10 h-10 text-emerald-500" />
              <input 
                type="time" 
                value={alarmTime} 
                onChange={(e) => {
                  setAlarmTime(e.target.value);
                  if (isAlarmEnabled) setIsAlarmEnabled(false); // Disable if time changes
                }}
                className="bg-transparent border-none focus:ring-0 text-center text-5xl font-bold w-full text-slate-800 dark:text-white"
              />
            </div>
          </div>

          {/* Enable/Disable Button */}
          <button 
            onClick={toggleAlarm}
            className={cn(
              "w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-md active:scale-[0.98]",
              isAlarmEnabled 
                ? "bg-rose-500 hover:bg-rose-600 text-white" 
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
            )}
          >
            {isAlarmEnabled ? (language === 'bn' ? 'অ্যালার্ম বন্ধ করুন' : 'Disable Alarm') : (language === 'bn' ? 'অ্যালার্ম চালু করুন' : 'Enable Alarm')}
          </button>

          {/* Ringtone Selection List */}
          <div className="w-full mt-4">
            <div className="flex items-center space-x-2 mb-4 px-2">
              <Volume2 className="w-5 h-5 text-slate-500" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                {language === 'bn' ? 'রিংটোন সিলেক্ট করুন' : 'Select Ringtone'}
              </h3>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
              {/* Default Options */}
              {DEFAULT_RINGTONES.map((ringtone, index) => (
                <div
                  key={ringtone.id}
                  onClick={() => handleSelectRingtone(ringtone.id)}
                  className={cn(
                    "flex items-center justify-between px-4 py-2.5 transition-all cursor-pointer",
                    index !== 0 ? "border-t border-slate-50 dark:border-slate-700/50" : "",
                    selectedRingtone === ringtone.id
                      ? "bg-emerald-50 dark:bg-emerald-900/20"
                      : "hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  )}
                >
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        togglePlay(ringtone.id); 
                      }}
                      className={cn(
                        "p-2 rounded-full shadow-sm transition-transform hover:scale-105",
                        playingId === ringtone.id 
                          ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400" 
                          : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                      )}
                    >
                      {playingId === ringtone.id ? (
                        <Square className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      )}
                    </button>
                    <span className={cn(
                      "font-semibold text-base transition-colors",
                      selectedRingtone === ringtone.id ? "text-emerald-600 dark:text-emerald-400" : "text-slate-700 dark:text-slate-200"
                    )}>
                      {ringtone.name}
                    </span>
                  </div>
                  <div>
                    {selectedRingtone === ringtone.id ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    ) : (
                      <Circle className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                    )}
                  </div>
                </div>
              ))}

              {/* Custom File Option */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "flex items-center justify-between px-4 py-2.5 border-t border-slate-50 dark:border-slate-700/50 transition-all cursor-pointer",
                  selectedRingtone === 'custom_file'
                    ? "bg-emerald-50 dark:bg-emerald-900/20"
                    : "hover:bg-slate-50 dark:hover:bg-slate-700/50"
                )}
              >
                <div className="flex items-center space-x-4">
                  <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className={cn(
                      "font-semibold text-base transition-colors",
                      selectedRingtone === 'custom_file' ? "text-emerald-600 dark:text-emerald-400" : "text-slate-700 dark:text-slate-200"
                    )}>
                      {language === 'bn' ? 'ডিভাইস থেকে নিন' : 'Pick from Device'}
                    </span>
                    {customRingtoneName && selectedRingtone === 'custom_file' && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium truncate max-w-[150px]">
                        {customRingtoneName}
                      </span>
                    )}
                  </div>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="audio/*" 
                  onChange={handleFileChange}
                />
                <div>
                  {selectedRingtone === 'custom_file' ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  ) : (
                    <Circle className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                  )}
                </div>
              </div>
            </div>
            
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-6 px-4">
              {language === 'bn' 
                ? 'অ্যালার্মের সময় বা সাউন্ড পরিবর্তন করলে অ্যালার্মটি পুনরায় চালু করতে হবে।' 
                : 'If you change the time or sound, you need to re-enable the alarm.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
