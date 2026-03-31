import { useState, useEffect, useMemo } from 'react';
import { format, subDays, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, startOfMonth, endOfMonth } from 'date-fns';
import { 
  Check, Circle, Trophy, Calendar as CalendarIcon, Activity, 
  ChevronLeft, ChevronRight, Moon, Sun, BookOpen, Hash, Flame,
  TrendingUp, Award, Star, Zap, Info, Loader2, X, Clock, ChevronDown,
  Droplets, Bed, HeartHandshake, Smile, Meh, Frown, MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useLanguage } from '../contexts/LanguageContext';
import { Capacitor } from '@capacitor/core';

const PRAYERS = [
  { id: 'fajr', labelKey: 'fajr', type: 'fard', time: '০৫:১০' },
  { id: 'dhuhr', labelKey: 'dhuhr', type: 'fard', time: '১২:১৫' },
  { id: 'asr', labelKey: 'asr', type: 'fard', time: '০৪:৩০' },
  { id: 'maghrib', labelKey: 'maghrib', type: 'fard', time: '০৬:১০' },
  { id: 'isha', labelKey: 'isha', type: 'fard', time: '০৭:৪৫' },
  { id: 'tahajjud', labelKey: 'tahajjud', type: 'nafl', time: '০৩:৩০' },
  { id: 'ishraq', labelKey: 'ishraq', type: 'nafl', time: '০৬:৩০' },
  { id: 'duha', labelKey: 'duha', type: 'nafl', time: '০৯:৩০' },
  { id: 'awwabin', labelKey: 'awwabin', type: 'nafl', time: '০৬:৩০' },
];

import { getFriendlyErrorMessage } from '@/lib/errorUtils';

export function Tracker() {
  const { t } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [trackerData, setTrackerData] = useState<Record<string, any>>(() => {
    const saved = localStorage.getItem('prayerTracker');
    return saved ? JSON.parse(saved) : {};
  });
  const [loading, setLoading] = useState(true);

  // Auth state for UI if needed, but no Firestore Sync
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const dayData = trackerData[dateStr] || {
    prayers: {},
    fasting: false,
    quran: 0,
    zikr: 0,
    qaza: 0,
    water: 0,
    sleep: 0,
    sadaqah: false,
    mood: '',
    reflection: ''
  };

  const prayerProgress = useMemo(() => {
    const fardPrayers = PRAYERS.filter(p => p.type === 'fard');
    const completed = fardPrayers.filter(p => dayData.prayers[p.id] === 'prayed').length;
    return (completed / fardPrayers.length) * 100;
  }, [dayData.prayers]);

  useEffect(() => {
    localStorage.setItem('prayerTracker', JSON.stringify(trackerData));
  }, [trackerData]);

  const toggleItem = (id: string, category: 'prayers' | 'fasting' | 'quran' | 'zikr' | 'qaza' | 'water' | 'sleep' | 'sadaqah' | 'mood' | 'reflection', value?: any) => {
    setTrackerData(prev => {
      const currentDay = prev[dateStr] || { prayers: {}, fasting: false, quran: 0, zikr: 0, qaza: 0, water: 0, sleep: 0, sadaqah: false, mood: '', reflection: '' };
      let newValue;
      
      if (category === 'prayers') {
        const currentStatus = currentDay.prayers[id];
        if (value !== undefined) {
          newValue = { ...currentDay.prayers, [id]: value };
        } else {
          // 3-state toggle: None -> Prayed -> Missed -> None
          let nextStatus;
          if (!currentStatus) nextStatus = 'prayed';
          else if (currentStatus === 'prayed') nextStatus = 'missed';
          else nextStatus = null;
          newValue = { ...currentDay.prayers, [id]: nextStatus };
        }
      } else if (category === 'fasting' || category === 'sadaqah') {
        newValue = !currentDay[category];
      } else {
        newValue = value;
      }

      const updatedDay = {
        ...currentDay,
        [category]: newValue
      };

      const newState = {
        ...prev,
        [dateStr]: updatedDay
      };

      return newState;
    });
  };

  const completedFard = Object.entries(dayData.prayers || {})
    .filter(([id, val]) => val === 'prayed' && PRAYERS.find(p => p.id === id)?.type === 'fard').length;
  
  const progressPercentage = (completedFard / 5) * 100;

  // Weekly report data
  const start = startOfWeek(new Date(), { weekStartsOn: 6 });
  const end = endOfWeek(new Date(), { weekStartsOn: 6 });
  const weekDays = eachDayOfInterval({ start, end });

  const chartData = weekDays.map(day => {
    const dStr = format(day, 'yyyy-MM-dd');
    const dData = trackerData[dStr] || { prayers: {} };
    const completed = Object.entries(dData.prayers || {})
      .filter(([id, val]) => val === 'prayed' && PRAYERS.find(p => p.id === id)?.type === 'fard').length;
    return {
      name: format(day, 'EEE'),
      completed,
      isToday: isSameDay(day, new Date())
    };
  });

  const navigateDate = (days: number) => {
    setSelectedDate(prev => addDays(prev, days));
  };

  // Calculate Streaks
  const calculateStreak = () => {
    let streak = 0;
    let curr = new Date();
    while (true) {
      const dStr = format(curr, 'yyyy-MM-dd');
      const dData = trackerData[dStr];
      if (!dData) break;
      const completed = Object.entries(dData.prayers || {})
        .filter(([id, val]) => val === 'prayed' && PRAYERS.find(p => p.id === id)?.type === 'fard').length;
      if (completed === 5) {
        streak++;
        curr = subDays(curr, 1);
      } else {
        break;
      }
    }
    return streak;
  };

  const currentStreak = calculateStreak();

  const getCurrentPrayer = () => {
    const now = new Date();
    const sortedPrayers = [...PRAYERS].filter(p => p.type === 'fard').sort((a, b) => {
      const [hA, mA] = a.time.split(':').map(Number);
      const [hB, mB] = b.time.split(':').map(Number);
      return (hA * 60 + mA) - (hB * 60 + mB);
    });

    for (let i = 0; i < sortedPrayers.length; i++) {
      const [h, m] = sortedPrayers[i].time.split(':').map(Number);
      const prayerDate = new Date();
      prayerDate.setHours(h, m, 0, 0);
      
      const nextPrayerDate = i < sortedPrayers.length - 1 
        ? (() => {
            const [h, m] = sortedPrayers[i+1].time.split(':').map(Number);
            return new Date(new Date().setHours(h, m, 0, 0));
          })()
        : new Date(new Date().setHours(24, 0, 0, 0));

      if (now >= prayerDate && now < nextPrayerDate) {
        return sortedPrayers[i];
      }
    }
    return sortedPrayers[0]; // Default to first
  };

  const currentPrayer = getCurrentPrayer();
  const isCurrentPrayerDone = dayData.prayers?.[currentPrayer.id] === 'prayed';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className={cn(
        "fixed top-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-2 pb-2 shadow-sm",
        Capacitor.isNativePlatform() ? "pt-12" : "pt-safe"
      )}>
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center whitespace-nowrap">
            <Activity className="w-5 h-5 mr-2 text-primary dark:text-primary-light" />
            {t('worship-tracker')}
          </h1>
          <div className="flex items-center space-x-2">
            {currentStreak > 0 && (
              <div className="flex items-center bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded-full border border-orange-200 dark:border-orange-800">
                <Flame className="w-3 h-3 text-orange-600 mr-1 fill-orange-600" />
                <span className="text-[10px] font-black text-orange-700 dark:text-orange-400">{currentStreak}</span>
              </div>
            )}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-0.5">
              <button onClick={() => navigateDate(-1)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="px-2 font-bold text-xs min-w-[70px] text-center">
                {isSameDay(selectedDate, new Date()) ? t('today') : format(selectedDate, 'dd MMM')}
              </div>
              <button 
                onClick={() => navigateDate(1)} 
                disabled={isSameDay(selectedDate, new Date())}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-[calc(4rem+env(safe-area-inset-top))] p-4 md:p-8 max-w-3xl mx-auto space-y-3 pb-24">
        {loading && (
          <div className="flex justify-center py-4">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        )}

        {/* Daily Summary & Streak */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-slate-100 dark:border-slate-800"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                {t('daily-summary')}
              </h3>
              <Activity className="w-4 h-4 text-primary" />
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-[10px] font-bold mb-1">
                  <span className="text-slate-500">{t('prayers')}</span>
                  <span className="text-primary">{Math.round(prayerProgress)}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${prayerProgress}%` }}
                    className="h-full bg-primary"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2 text-center">
                  <span className="block text-[8px] font-black text-slate-400 uppercase mb-0.5">{t('quran')}</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white">{dayData.quran}p</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2 text-center">
                  <span className="block text-[8px] font-black text-slate-400 uppercase mb-0.5">{t('zikr')}</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white">{dayData.zikr}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2 text-center">
                  <span className="block text-[8px] font-black text-slate-400 uppercase mb-0.5">{t('fasting')}</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white">{dayData.fasting ? '✓' : '✗'}</span>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="bg-gradient-to-br from-orange-500 to-rose-600 rounded-lg p-4 text-white flex items-center justify-between relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-orange-100 uppercase tracking-widest mb-1">{t('current-streak')}</p>
              <div className="flex items-baseline space-x-1">
                <span className="text-3xl font-black">{currentStreak}</span>
                <span className="text-xs font-bold text-orange-100">{t('days')}</span>
              </div>
              <p className="text-[10px] text-orange-100 mt-1">{t('keep-it-up')}</p>
            </div>
            <div className="relative z-10 w-12 h-12 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center">
              <Flame className="w-7 h-7 text-white fill-white" />
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          </div>
        </div>

        {/* Quick Log Section */}
        <div className="space-y-3">
          <motion.div 
            whileTap={{ scale: 0.98 }}
            onClick={() => toggleItem(currentPrayer.id, 'prayers', isCurrentPrayerDone ? null : 'prayed')}
            className={cn(
              "relative overflow-hidden rounded-lg p-4 border transition-all cursor-pointer group",
              isCurrentPrayerDone 
                ? "bg-primary border-primary-dark text-white" 
                : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"
            )}
          >
            <div className="relative z-10 flex justify-between items-center">
              <div>
                <p className={cn("text-[10px] font-bold uppercase tracking-widest mb-1", isCurrentPrayerDone ? "text-primary-light/80" : "text-slate-500")}>
                  {t('current-prayer')}
                </p>
                <h2 className="text-xl font-black">{currentPrayer.id === 'dhuhr' && selectedDate.getDay() === 5 ? t('jumuah') : t(currentPrayer.labelKey as any)}</h2>
                <div className="flex items-center mt-1 space-x-2">
                  <span className={cn("text-xs font-bold", isCurrentPrayerDone ? "text-primary-light" : "text-primary")}>
                    {isCurrentPrayerDone ? t('completed') : t('mark-as-done')}
                  </span>
                  <Clock className={cn("w-3 h-3", isCurrentPrayerDone ? "text-primary-light" : "text-slate-400")} />
                  <span className={cn("text-[10px]", isCurrentPrayerDone ? "text-primary-light" : "text-slate-400")}>{currentPrayer.time}</span>
                </div>
              </div>
              <div className={cn(
                "w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-500",
                isCurrentPrayerDone ? "bg-white text-primary rotate-12" : "bg-primary/10 dark:bg-primary-dark/10 text-primary"
              )}>
                {isCurrentPrayerDone ? <Check className="w-7 h-7" /> : <Zap className="w-7 h-7" />}
              </div>
            </div>
            {!isCurrentPrayerDone && (
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-8 -mt-8 blur-2xl group-hover:bg-primary/10 transition-colors" />
            )}
          </motion.div>
        </div>

        {/* Sections */}
        <div className="space-y-2">
          {/* Fard Prayers */}
          <section className="space-y-1">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2">{t('fard-prayers')}</h3>
            <div className="grid grid-cols-1 gap-1">
              {PRAYERS.filter(p => p.type === 'fard').map((prayer) => (
                <PrayerItem 
                  key={prayer.id}
                  label={prayer.id === 'dhuhr' && selectedDate.getDay() === 5 ? t('jumuah') : t(prayer.labelKey as any)}
                  time={prayer.time}
                  status={dayData.prayers?.[prayer.id]}
                  onToggle={() => toggleItem(prayer.id, 'prayers')}
                  onStatusChange={(status: string) => toggleItem(prayer.id, 'prayers', status)}
                />
              ))}
            </div>
          </section>

          {/* Nafl Prayers */}
          <section className="space-y-1">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2">{t('nafl-sunnah')}</h3>
            <div className="grid grid-cols-1 gap-1">
              {PRAYERS.filter(p => p.type === 'nafl').map((prayer) => (
                <PrayerItem 
                  key={prayer.id}
                  label={t(prayer.labelKey as any)}
                  time={prayer.time}
                  status={dayData.prayers?.[prayer.id]}
                  onToggle={() => toggleItem(prayer.id, 'prayers')}
                  onStatusChange={(status: string) => toggleItem(prayer.id, 'prayers', status)}
                  isNafl
                />
              ))}
            </div>
          </section>

          {/* Fasting & Others */}
          <section className="space-y-1">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2">{t('other-worships')}</h3>
            <div className="grid grid-cols-1 gap-1">
              {/* Fasting */}
              <div className={cn(
                "flex items-center justify-between p-2 rounded-lg border transition-all shadow-sm",
                dayData.fasting ? "bg-orange-50 dark:bg-orange-900/10 border-orange-200 shadow-orange-500/10" : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"
              )}>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                    <Sun className="w-4 h-4 text-orange-600" />
                  </div>
                  <span className="font-bold text-sm">{t('todays-fasting')}</span>
                </div>
                <button 
                  onClick={() => toggleItem('roza', 'fasting')}
                  className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold transition-all",
                    dayData.fasting ? "bg-orange-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                  )}
                >
                  {dayData.fasting ? t('fasted') : t('not-fasted')}
                </button>
              </div>

              {/* Quran */}
              <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between shadow-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <span className="font-bold block text-sm">{t('quran-recitation')}</span>
                    <span className="text-[10px] text-slate-500">{t('page-count')}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button 
                    onClick={() => toggleItem('quran', 'quran', Math.max(0, (dayData.quran || 0) - 1))}
                    className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-sm"
                  >-</button>
                  <span className="w-7 text-center font-bold text-sm">{dayData.quran || 0}</span>
                  <button 
                    onClick={() => toggleItem('quran', 'quran', (dayData.quran || 0) + 1)}
                    className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-sm"
                  >+</button>
                </div>
              </div>

              {/* Zikr */}
              <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between shadow-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                    <Hash className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <span className="font-bold block text-sm">{t('zikr-tasbih')}</span>
                    <span className="text-[10px] text-slate-500">{t('times-count')}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button 
                    onClick={() => toggleItem('zikr', 'zikr', Math.max(0, (dayData.zikr || 0) - 1))}
                    className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-sm"
                  >-</button>
                  <span className="w-7 text-center font-bold text-sm">{dayData.zikr || 0}</span>
                  <button 
                    onClick={() => toggleItem('zikr', 'zikr', (dayData.zikr || 0) + 1)}
                    className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-sm"
                  >+</button>
                </div>
              </div>

              {/* Qaza */}
              <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md p-2 rounded-lg border border-white/20 dark:border-slate-800/20 flex items-center justify-between shadow-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-rose-100 dark:bg-rose-900/30 rounded-lg flex items-center justify-center">
                    <Activity className="w-4 h-4 text-rose-600" />
                  </div>
                  <div>
                    <span className="font-bold block text-sm">{t('qaza-prayers')}</span>
                    <span className="text-[10px] text-slate-500">{t('waqt-count')}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button 
                    onClick={() => toggleItem('qaza', 'qaza', Math.max(0, (dayData.qaza || 0) - 1))}
                    className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-sm"
                  >-</button>
                  <span className="w-7 text-center font-bold text-sm">{dayData.qaza || 0}</span>
                  <button 
                    onClick={() => toggleItem('qaza', 'qaza', (dayData.qaza || 0) + 1)}
                    className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-sm"
                  >+</button>
                </div>
              </div>

              {/* Water Intake */}
              <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md p-2 rounded-lg border border-white/20 dark:border-slate-800/20 flex items-center justify-between shadow-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <Droplets className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <span className="font-bold block text-sm">{t('water-intake') || 'Water Intake'}</span>
                    <span className="text-[10px] text-slate-500">{t('glasses') || 'glasses'}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button 
                    onClick={() => toggleItem('water', 'water', Math.max(0, (dayData.water || 0) - 1))}
                    className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-sm"
                  >-</button>
                  <span className="w-7 text-center font-bold text-sm">{dayData.water || 0}</span>
                  <button 
                    onClick={() => toggleItem('water', 'water', (dayData.water || 0) + 1)}
                    className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-sm"
                  >+</button>
                </div>
              </div>

              {/* Sleep Tracker */}
              <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md p-2 rounded-lg border border-white/20 dark:border-slate-800/20 flex items-center justify-between shadow-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                    <Bed className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <span className="font-bold block text-sm">{t('sleep-tracker') || 'Sleep Tracker'}</span>
                    <span className="text-[10px] text-slate-500">{t('hours') || 'hours'}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button 
                    onClick={() => toggleItem('sleep', 'sleep', Math.max(0, (dayData.sleep || 0) - 1))}
                    className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-sm"
                  >-</button>
                  <span className="w-7 text-center font-bold text-sm">{dayData.sleep || 0}</span>
                  <button 
                    onClick={() => toggleItem('sleep', 'sleep', (dayData.sleep || 0) + 1)}
                    className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-sm"
                  >+</button>
                </div>
              </div>

              {/* Sadaqah */}
              <div className={cn(
                "flex items-center justify-between p-2 rounded-lg border transition-all shadow-sm",
                dayData.sadaqah ? "bg-rose-500/20 border-rose-300" : "bg-white/20 dark:bg-slate-900/20 backdrop-blur-xl border border-white/30 dark:border-slate-800/30"
              )}>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-rose-100 dark:bg-rose-900/30 rounded-lg flex items-center justify-center">
                    <HeartHandshake className="w-4 h-4 text-rose-600" />
                  </div>
                  <span className="font-bold text-sm">{t('sadaqah-charity') || 'Sadaqah/Charity'}</span>
                </div>
                <button 
                  onClick={() => toggleItem('sadaqah', 'sadaqah')}
                  className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold transition-all",
                    dayData.sadaqah ? "bg-rose-500 text-white" : "bg-slate-100/50 dark:bg-slate-800/50 text-slate-500"
                  )}
                >
                  {dayData.sadaqah ? t('donated') || 'Donated' : t('not-donated') || 'Not Donated'}
                </button>
              </div>
            </div>
          </section>

          {/* Mood & Reflection */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold flex items-center px-1">
              <Smile className="w-4 h-4 mr-2 text-amber-500" />
              {t('mood-reflection') || 'Mood & Reflection'}
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {/* Mood Tracker */}
              <div className="bg-white/20 dark:bg-slate-900/20 backdrop-blur-xl p-3 rounded-lg border border-white/30 dark:border-slate-800/30 shadow-sm">
                <span className="text-xs font-bold block mb-2 text-slate-500">{t('todays-feeling') || 'Today\'s Feeling'}</span>
                <div className="flex justify-around">
                  {[
                    { id: 'happy', icon: Smile, color: 'text-primary', label: t('happy') || 'Happy' },
                    { id: 'neutral', icon: Meh, color: 'text-amber-500', label: t('neutral') || 'Neutral' },
                    { id: 'sad', icon: Frown, color: 'text-rose-500', label: t('sad') || 'Sad' }
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => toggleItem('mood', 'mood', m.id)}
                      className={cn(
                        "flex flex-col items-center p-2 rounded-lg transition-all border",
                        dayData.mood === m.id 
                          ? "bg-white/40 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 scale-110" 
                          : "border-transparent opacity-50"
                      )}
                    >
                      <m.icon className={cn("w-6 h-6 mb-1", m.color)} />
                      <span className="text-[10px] font-medium">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Reflection */}
              <div className="bg-white/20 dark:bg-slate-900/20 backdrop-blur-xl p-3 rounded-lg border border-white/30 dark:border-slate-800/30 shadow-sm">
                <div className="flex items-center space-x-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-bold text-slate-500">{t('todays-reflection') || 'Today\'s Reflection'}</span>
                </div>
                <textarea
                  value={dayData.reflection || ''}
                  onChange={(e) => toggleItem('reflection', 'reflection', e.target.value)}
                  placeholder={t('reflection-placeholder') || 'How was your day? Want to write something?'}
                  className="w-full bg-white/30 dark:bg-slate-800/30 border border-white/20 dark:border-slate-700/20 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50 min-h-[80px] resize-none"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Weekly Report */}
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center mb-2">
            <CalendarIcon className="w-4 h-4 mr-2 text-primary" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">{t('weekly-report')}</h3>
          </div>
          
          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'none', backgroundColor: '#1e293b', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="completed" radius={[2, 2, 2, 2]} maxBarSize={30}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.isToday ? 'var(--color-primary)' : '#cbd5e1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  );
}

function PrayerItem({ label, time, status, onToggle, onStatusChange, isNafl }: any) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const getStatusLabel = () => {
    if (status === 'prayed') return t('prayed');
    if (status === 'missed') return t('missed');
    return t('select');
  };

  const getStatusColor = () => {
    if (status === 'prayed') return isNafl ? 'text-indigo-600' : 'text-primary';
    if (status === 'missed') return 'text-rose-600';
    return 'text-slate-400';
  };

  return (
    <div className="relative">
      <div className="flex items-center">
        <button
          onClick={onToggle}
          className={cn(
            "flex-1 flex items-center justify-between p-2 rounded-lg transition-all border backdrop-blur-xl",
            status === 'prayed'
              ? isNafl ? "bg-indigo-500/20 border-indigo-300" : "bg-primary/20 border-primary-light/50"
              : status === 'missed'
                ? "bg-rose-500/20 border-rose-300"
                : "bg-white/20 dark:bg-slate-900/20 border-white/30 dark:border-slate-800/30 hover:border-primary-light/50"
          )}
        >
          <div className="flex items-center space-x-3">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
              status === 'prayed'
                ? isNafl ? "bg-indigo-500 text-white" : "bg-primary text-white"
                : status === 'missed'
                  ? "bg-rose-500 text-white"
                  : "bg-slate-100/50 dark:bg-slate-800/50 text-slate-400"
            )}>
              {status === 'prayed' ? <Check className="w-5 h-5" /> : status === 'missed' ? <X className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
            </div>
            <div className="text-left">
              <span className={cn(
                "font-bold block text-sm",
                status === 'prayed'
                  ? isNafl ? "text-indigo-700 dark:text-indigo-400" : "text-primary dark:text-primary-light"
                  : status === 'missed'
                    ? "text-rose-700 dark:text-rose-400"
                    : "text-slate-700 dark:text-slate-300"
              )}>
                {label}
              </span>
              <div className="flex items-center space-x-2">
                <span className={cn("text-[10px] font-medium", getStatusColor())}>
                  {getStatusLabel()}
                </span>
                {time && (
                  <span className="text-[10px] text-slate-400 flex items-center">
                    <Clock className="w-2.5 h-2.5 mr-0.5" />
                    {time}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div 
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className="p-1 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 rounded-lg transition-colors ml-2"
          >
            <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", isOpen && "rotate-180")} />
          </div>
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-10 overflow-hidden"
          >
            <button
              onClick={() => {
                onStatusChange('prayed');
                setIsOpen(false);
              }}
              className="w-full flex items-center space-x-3 p-3.5 hover:bg-primary-light/20 dark:hover:bg-primary-dark/20 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-full bg-primary-light/30 dark:bg-primary-dark/30 flex items-center justify-center text-primary dark:text-primary-light">
                <Check className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{t('prayed')}</span>
            </button>
            <button
              onClick={() => {
                onStatusChange('missed');
                setIsOpen(false);
              }}
              className="w-full flex items-center space-x-3 p-3.5 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors text-left border-t border-slate-100 dark:border-slate-700"
            >
              <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600">
                <X className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{t('missed')}</span>
            </button>
            <button
              onClick={() => {
                onStatusChange(null);
                setIsOpen(false);
              }}
              className="w-full flex items-center space-x-3 p-3.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left border-t border-slate-100 dark:border-slate-700"
            >
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <Circle className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{t('reset')}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
