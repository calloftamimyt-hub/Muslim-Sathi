import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Save, BellRing, ChevronUp, ChevronDown, Volume2, Play, Square, CheckCircle2, Circle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { motion } from 'motion/react';

const NumberScroller = ({ value, min, max, onChange, pad = false }: { value: number, min: number, max: number, onChange: (v: number) => void, pad?: boolean }) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <button 
        onClick={() => onChange(value === max ? min : value + 1)}
        className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors active:scale-90"
      >
        <ChevronUp className="w-6 h-6" />
      </button>
      <div className="text-5xl font-black text-slate-800 dark:text-white w-20 text-center tracking-tighter select-none">
        {pad ? value.toString().padStart(2, '0') : value}
      </div>
      <button 
        onClick={() => onChange(value === min ? max : value - 1)}
        className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors active:scale-90"
      >
        <ChevronDown className="w-6 h-6" />
      </button>
    </div>
  );
};

export const CreateAlarm = ({ onBack, onSave, initialAlarm }: { onBack: () => void, onSave: (alarm: any) => void, initialAlarm?: any }) => {
  const { t, language } = useLanguage();
  
  const DEFAULT_RINGTONES = [
    { id: 'azan.wav', name: language === 'bn' ? 'আজান' : 'Azan' },
    { id: 'beep.wav', name: language === 'bn' ? 'বিপ' : 'Beep' },
    { id: 'bing.wav', name: language === 'bn' ? 'বিং' : 'Bing' }
  ];
  
  // Parse initial time
  let initialHour = 6;
  let initialMinute = 30;
  let initialPeriod: 'AM' | 'PM' = 'AM';
  
  if (initialAlarm?.time) {
    const [h, m] = initialAlarm.time.split(':').map(Number);
    initialHour = h % 12 || 12;
    initialMinute = m;
    initialPeriod = h >= 12 ? 'PM' : 'AM';
  }

  const [hour, setHour] = useState(initialHour);
  const [minute, setMinute] = useState(initialMinute);
  const [period, setPeriod] = useState<'AM' | 'PM'>(initialPeriod);
  const [days, setDays] = useState<number[]>(initialAlarm?.days || [0, 1, 2, 3, 4, 5, 6]);
  const [selectedRingtone, setSelectedRingtone] = useState(initialAlarm?.sound || DEFAULT_RINGTONES[0].id);
  const [customRingtoneName, setCustomRingtoneName] = useState(initialAlarm?.customSoundName || '');
  
  // Audio preview state
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
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

  const togglePlay = (ringtoneId: string) => {
    if (playingId === ringtoneId) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      let audioSrc = '';
      if (ringtoneId === 'custom_file' || ringtoneId === 'system_default') {
        // If it's a custom file or system default, we'd need the blob URL or native picker, 
        // but for now we just show it's selected
        return; 
      } else {
        audioSrc = `/sounds/${ringtoneId}`;
      }

      const newAudio = new Audio(audioSrc);
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

  const saveAlarm = async () => {
    // Convert to 24h format for scheduling
    let hour24 = hour;
    if (period === 'PM' && hour !== 12) hour24 += 12;
    if (period === 'AM' && hour === 12) hour24 = 0;
    
    const timeString = `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

      const finalSound = selectedRingtone === 'custom_file' 
        ? customRingtoneName 
        : (selectedRingtone === 'manual' ? customRingtoneName : selectedRingtone);

      // Strip extension for Android res/raw compatibility
      const soundName = finalSound === 'system_default' ? undefined : finalSound.replace(/\.[^/.]+$/, "");
      const channelId = soundName ? `alarm_channel_${soundName.replace(/[^a-z0-9]/gi, '_')}` : 'default_alarm_channel';

      const alarm = {
        id: initialAlarm?.id || Date.now(),
        time: timeString,
        displayTime: `${hour}:${minute.toString().padStart(2, '0')}`,
        period,
        days,
        enabled: true,
        sound: finalSound,
        customSoundName: customRingtoneName
      };
      
      // Schedule notification
      if (Capacitor.isNativePlatform()) {
        // Create channel first
        await LocalNotifications.createChannel({
          id: channelId,
          name: soundName ? `Alarm Channel - ${soundName}` : 'Default Alarm Channel',
          importance: 5,
          sound: soundName,
          visibility: 1,
          vibration: true,
        });

        // Cancel existing if editing
        if (initialAlarm?.id) {
          const pending = await LocalNotifications.getPending();
          const toCancel = pending.notifications.filter(n => String(n.id).startsWith(String(initialAlarm.id).substring(0, 8)));
          if (toCancel.length > 0) {
            await LocalNotifications.cancel({ notifications: toCancel });
          }
        }

        const notificationsToSchedule = [];
        
        for (const day of days) {
          notificationsToSchedule.push({
            title: language === 'bn' ? 'এলার্ম' : 'Alarm',
            body: language === 'bn' ? 'আপনার এলার্ম বাজছে!' : 'Your alarm is ringing!',
            id: parseInt(`${alarm.id}${day}`.substring(0, 9)),
            schedule: {
              on: {
                weekday: day + 1, // Capacitor uses 1-7 for Sun-Sat
                hour: hour24,
                minute: minute,
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
    }
    
    onSave(alarm);
  };

  const dayNames = language === 'bn' ? ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="h-screen w-full bg-[#F8FAFC] dark:bg-slate-950 flex flex-col font-sans"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 sticky top-0 z-10">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">
          {initialAlarm ? (language === 'bn' ? 'এলার্ম এডিট করুন' : 'Edit Alarm') : (language === 'bn' ? 'নতুন এলার্ম' : 'New Alarm')}
        </h2>
        <button 
          onClick={saveAlarm} 
          className="p-2 -mr-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
        >
          <Save className="w-6 h-6" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-5 space-y-6 pb-24">
        {/* Time Picker */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-center gap-3">
          <NumberScroller value={hour} min={1} max={12} onChange={setHour} />
          <div className="text-5xl font-black text-slate-300 dark:text-slate-700 pb-2">:</div>
          <NumberScroller value={minute} min={0} max={59} onChange={setMinute} pad />
          
          <div className="flex flex-col gap-2 ml-3">
            <button 
              onClick={() => setPeriod('AM')}
              className={`px-3 py-2 rounded-lg font-bold text-base transition-all ${
                period === 'AM' 
                  ? 'bg-primary text-white shadow-md shadow-primary/30' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}
            >
              AM
            </button>
            <button 
              onClick={() => setPeriod('PM')}
              className={`px-3 py-2 rounded-lg font-bold text-base transition-all ${
                period === 'PM' 
                  ? 'bg-primary text-white shadow-md shadow-primary/30' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}
            >
              PM
            </button>
          </div>
        </div>
        
        {/* Days Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {language === 'bn' ? 'রিপিট করুন' : 'Repeat On'}
            </h3>
            <button 
              onClick={() => setDays(days.length === 7 ? [] : [0, 1, 2, 3, 4, 5, 6])}
              className="text-sm font-bold text-primary hover:text-primary-dark transition-colors"
            >
              {days.length === 7 ? (language === 'bn' ? 'বাদ দিন' : 'Clear All') : (language === 'bn' ? 'প্রতিদিন' : 'Every Day')}
            </button>
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {dayNames.map((day, i) => {
              const isSelected = days.includes(i);
              return (
                <button 
                  key={i}
                  onClick={() => setDays(isSelected ? days.filter(d => d !== i) : [...days, i].sort())}
                  className={`aspect-square rounded-lg font-bold text-xs transition-all flex items-center justify-center ${
                    isSelected 
                      ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105' 
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {day.substring(0, 3)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Ringtone Selection */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 px-2">
            <Volume2 className="w-5 h-5 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {language === 'bn' ? 'রিংটোন সিলেক্ট করুন' : 'Select Ringtone'}
            </h3>
          </div>
          
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
            {/* Default Options */}
            {DEFAULT_RINGTONES.map((ringtone, index) => (
              <div
                key={ringtone.id}
                onClick={() => setSelectedRingtone(ringtone.id)}
                className={`flex items-center justify-between px-4 py-2.5 transition-all cursor-pointer ${
                  index !== 0 ? 'border-t border-slate-100 dark:border-slate-800' : ''
                } ${
                  selectedRingtone === ringtone.id
                    ? 'bg-primary/5 dark:bg-primary/10'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <button
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      togglePlay(ringtone.id); 
                    }}
                    className={`p-2 rounded-full transition-colors ${
                      playingId === ringtone.id 
                        ? 'bg-primary text-white' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {playingId === ringtone.id ? (
                      <Square className="w-3.5 h-3.5 fill-current" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    )}
                  </button>
                  <span className={`font-bold text-sm ${selectedRingtone === ringtone.id ? 'text-primary' : 'text-slate-700 dark:text-slate-200'}`}>
                    {ringtone.name}
                  </span>
                </div>
                {selectedRingtone === ringtone.id ? (
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-300 dark:text-slate-700" />
                )}
              </div>
            ))}

            {/* Custom File Option */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`flex items-center justify-between px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 transition-all cursor-pointer ${
                selectedRingtone === 'custom_file'
                  ? 'bg-primary/5 dark:bg-primary/10'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                  <Volume2 className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col">
                  <span className={`font-bold text-sm ${selectedRingtone === 'custom_file' ? 'text-primary' : 'text-slate-700 dark:text-slate-200'}`}>
                    {language === 'bn' ? 'ডিভাইস থেকে নিন' : 'Pick from Device'}
                  </span>
                  {customRingtoneName && selectedRingtone === 'custom_file' && (
                    <span className="text-[10px] text-primary font-medium truncate max-w-[150px]">
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
              {selectedRingtone === 'custom_file' ? (
                <CheckCircle2 className="w-5 h-5 text-primary" />
              ) : (
                <Circle className="w-5 h-5 text-slate-300 dark:text-slate-700" />
              )}
            </div>
          </div>
        </div>

        {/* Save Button (Bottom) */}
        <button 
          onClick={saveAlarm}
          className="w-full py-3.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-base shadow-lg shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-6"
        >
          <BellRing className="w-5 h-5" />
          {language === 'bn' ? 'এলার্ম সেভ করুন' : 'Save Alarm'}
        </button>
      </div>
    </motion.div>
  );
};
