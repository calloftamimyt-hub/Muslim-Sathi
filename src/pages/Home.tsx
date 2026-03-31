import { useState, useEffect } from 'react';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { useLocation } from '@/hooks/useLocation';
import { format, parse, isAfter, differenceInSeconds, addDays, addMinutes, subMinutes } from 'date-fns';
import { MapPin, Bell, Moon, Sun, Sunrise, Sunset, ChevronRight, ChevronDown, BookOpen, BookText, Compass, Calculator, Calendar, Star, Heart, CircleDot, HelpCircle, UserCheck, Plane, Tv, Headphones, Trophy, Book, Settings, Library, ArrowLeft, Image, Users, Notebook } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { LocationModal } from '@/components/LocationModal';
import { SlimBannerAd } from '@/components/AdSystem';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotifications } from '../hooks/useNotifications';
import { useAdmin } from '../hooks/useAdmin';
import { Capacitor } from '@capacitor/core';
import { ShieldCheck } from 'lucide-react';

const PRAYERS_TO_SHOW = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

const formatNumber = (str: string | number, lang: string) => {
  if (lang !== 'bn') return str.toString();
  const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return str.toString().replace(/\d/g, d => bn[parseInt(d)]);
};

export const CATEGORIES = [
  { id: 'quran', icon: BookOpen, color: 'text-white', bg: 'bg-gradient-to-br from-primary-light to-primary-dark' },
  { id: 'hadith', icon: BookText, color: 'text-white', bg: 'bg-gradient-to-br from-blue-400 to-blue-600' },
  { id: 'tasbih', icon: CircleDot, color: 'text-white', bg: 'bg-gradient-to-br from-purple-400 to-purple-600' },
  { id: 'qibla', icon: Compass, color: 'text-white', bg: 'bg-gradient-to-br from-emerald-400 to-emerald-600' },
  { id: 'dua', icon: Heart, color: 'text-white', bg: 'bg-gradient-to-br from-rose-400 to-rose-600' },
  { id: 'names-of-allah', icon: Star, color: 'text-white', bg: 'bg-gradient-to-br from-amber-400 to-amber-600' },
  { id: 'zakat', icon: Calculator, color: 'text-white', bg: 'bg-gradient-to-br from-teal-400 to-teal-600' },
  { id: 'calendar', icon: Calendar, color: 'text-white', bg: 'bg-gradient-to-br from-indigo-400 to-indigo-600' },
  { id: 'mosque', icon: MapPin, color: 'text-white', bg: 'bg-gradient-to-br from-primary to-primary-dark' },
  { id: 'education', icon: Library, color: 'text-white', bg: 'bg-gradient-to-br from-indigo-500 to-indigo-700' },
  { id: 'ramadan', icon: Moon, color: 'text-white', bg: 'bg-gradient-to-br from-purple-500 to-purple-700' },
  { id: 'islamic-names', icon: Users, color: 'text-white', bg: 'bg-gradient-to-br from-blue-500 to-blue-700' },
  { id: 'namaz-shikkha', icon: UserCheck, color: 'text-white', bg: 'bg-gradient-to-br from-cyan-400 to-cyan-600' },
  { id: 'hajj-umrah', icon: Plane, color: 'text-white', bg: 'bg-gradient-to-br from-sky-400 to-sky-600' },
  { id: 'live-tv', icon: Tv, color: 'text-white', bg: 'bg-gradient-to-br from-red-400 to-red-600' },
  { id: 'audio', icon: Headphones, color: 'text-white', bg: 'bg-gradient-to-br from-orange-500 to-orange-700' },
  { id: 'quiz', icon: Trophy, color: 'text-white', bg: 'bg-gradient-to-br from-yellow-400 to-yellow-600' },
  { id: 'notes', icon: Notebook, color: 'text-white', bg: 'bg-gradient-to-br from-fuchsia-400 to-fuchsia-600' },
  { id: 'wallpaper', icon: Image, color: 'text-white', bg: 'bg-gradient-to-br from-teal-500 to-teal-700' },
  { id: 'alarm-list', icon: Bell, color: 'text-white', bg: 'bg-gradient-to-br from-rose-500 to-rose-700' },
  { id: 'settings', icon: Settings, color: 'text-white', bg: 'bg-gradient-to-br from-slate-400 to-slate-600' },
];

import { memo } from 'react';

export const CategoryButton = memo(({ cat, idx, setActiveTab, latitude, longitude }: any) => {
  const { t } = useLanguage();
  return (
    <motion.button
      key={cat.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05 }}
      onClick={() => {
        if (cat.id === 'mosque') {
          const url = `https://www.google.com/maps/search/mosque/@${latitude},${longitude},16z`;
          window.open(url, '_blank');
        } else if ((cat as any).id) {
          setActiveTab((cat as any).id);
        }
      }}
      className="flex flex-col items-center justify-center group"
    >
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center mb-1.5 transition-all duration-300 relative",
        "border border-slate-100 dark:border-slate-700",
        cat.bg, cat.color
      )}>
        <cat.icon className="w-[18px] h-[18px] stroke-[2.5px]" />
      </div>
      <span className="text-[8px] font-medium text-slate-600 dark:text-slate-400 text-center leading-tight group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
        {t(cat.id as any)}
      </span>
    </motion.button>
  );
});

export function Home({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const { t, language } = useLanguage();
  const { unreadCount } = useNotifications();
  const { isAdmin } = useAdmin();
  const { latitude, longitude, country, city, loading: locLoading } = useLocation(language);
  const { data, loading: prayerLoading, error: prayerError } = usePrayerTimes(latitude, longitude);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [nextPrayer, setNextPrayer] = useState<{ name: string; time: Date; remaining: string; progress: number; isForbidden?: boolean } | null>(null);
  const [fastingInfo, setFastingInfo] = useState<{ nextSehri: Date | null, nextIftar: Date | null, remaining: string, type: 'sehri' | 'iftar', progress: number } | null>(null);
  const [showAllPrayers, setShowAllPrayers] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!data) return;

    const todayStr = format(currentTime, 'dd-MM-yyyy');
    const tomorrowStr = format(addDays(currentTime, 1), 'dd-MM-yyyy');
    
    const todayData = data.find(d => d.date.gregorian.date === todayStr);
    const tomorrowData = data.find(d => d.date.gregorian.date === tomorrowStr);
    
    if (!todayData) return;

    const timings = todayData.timings;
    
    // Helper to parse time string into a Date object for a specific date
    const parseTime = (timeStr: string | undefined, date: Date) => {
      if (!timeStr) return new Date(date);
      const parts = timeStr.split(' ');
      const timePart = parts[0] || '00:00';
      const [hours, minutes] = timePart.split(':');
      const d = new Date(date);
      d.setHours(parseInt(hours || '0'), parseInt(minutes || '0'), 0, 0);
      return d;
    };

    // Define all time points for the day
    const fajrStart = parseTime(timings.Fajr, currentTime);
    const sunrise = parseTime(timings.Sunrise, currentTime);
    const sunriseEnd = addMinutes(sunrise, 15);
    const ishraqEnd = addMinutes(sunriseEnd, 30);
    const dhuhrStart = parseTime(timings.Dhuhr, currentTime);
    const zenithStart = subMinutes(dhuhrStart, 10);
    const asrStart = parseTime(timings.Asr, currentTime);
    const maghribStart = parseTime(timings.Maghrib, currentTime);
    const sunsetStart = subMinutes(maghribStart, 15);
    const ishaStart = parseTime(timings.Isha, currentTime);
    
    const tomorrowFajr = tomorrowData 
      ? parseTime(tomorrowData.timings.Fajr, addDays(currentTime, 1)) 
      : addDays(fajrStart, 1);

    // Determine current period
    let periodName = '';
    let periodEnd = new Date();
    let periodStart = new Date();
    let isForbidden = false;

    if (currentTime < fajrStart) {
      // Late night, after Isha
      periodName = 'Isha';
      periodEnd = fajrStart;
      const yesterdayData = data.find(d => d.date.gregorian.date === format(addDays(currentTime, -1), 'dd-MM-yyyy'));
      periodStart = yesterdayData ? parseTime(yesterdayData.timings.Isha, addDays(currentTime, -1)) : subMinutes(fajrStart, 360);
    } else if (currentTime < sunrise) {
      periodName = 'Fajr';
      periodEnd = sunrise;
      periodStart = fajrStart;
    } else if (currentTime < sunriseEnd) {
      periodName = 'Forbidden';
      periodEnd = sunriseEnd;
      periodStart = sunrise;
      isForbidden = true;
    } else if (currentTime < ishraqEnd) {
      periodName = 'Ishraq';
      periodEnd = ishraqEnd;
      periodStart = sunriseEnd;
    } else if (currentTime < zenithStart) {
      periodName = 'Duha';
      periodEnd = zenithStart;
      periodStart = ishraqEnd;
    } else if (currentTime < dhuhrStart) {
      periodName = 'Forbidden';
      periodEnd = dhuhrStart;
      periodStart = zenithStart;
      isForbidden = true;
    } else if (currentTime < asrStart) {
      periodName = currentTime.getDay() === 5 ? 'Jumuah' : 'Dhuhr';
      periodEnd = asrStart;
      periodStart = dhuhrStart;
    } else if (currentTime < sunsetStart) {
      periodName = 'Asr';
      periodEnd = sunsetStart;
      periodStart = asrStart;
    } else if (currentTime < maghribStart) {
      periodName = 'Forbidden';
      periodEnd = maghribStart;
      periodStart = sunsetStart;
      isForbidden = true;
    } else if (currentTime < ishaStart) {
      periodName = 'Maghrib';
      periodEnd = ishaStart;
      periodStart = maghribStart;
    } else {
      periodName = 'Isha';
      periodEnd = tomorrowFajr;
      periodStart = ishaStart;
    }

    const totalDurationMs = periodEnd.getTime() - periodStart.getTime();
    const elapsedMs = currentTime.getTime() - periodStart.getTime();
    const progress = Math.max(0, Math.min(100, (elapsedMs / totalDurationMs) * 100));
    
    const diffMs = Math.max(0, periodEnd.getTime() - currentTime.getTime());
    const totalSeconds = Math.ceil(diffMs / 1000);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    const remaining = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    setNextPrayer({ name: periodName, time: periodEnd, remaining, progress, isForbidden });

    // Calculate Fasting Info (Sehri/Iftar)
    const imsakTime = parse((timings.Imsak || '00:00').split(' ')[0], 'HH:mm', currentTime);
    const maghribTime = parse((timings.Maghrib || '00:00').split(' ')[0], 'HH:mm', currentTime);
    
    let fType: 'sehri' | 'iftar' = 'sehri';
    let targetTime = imsakTime;
    let nextSehri = imsakTime;
    let nextIftar = maghribTime;
    let fProgress = 0;

    if (isAfter(currentTime, imsakTime) && !isAfter(currentTime, maghribTime)) {
      // Currently fasting, waiting for Iftar
      fType = 'iftar';
      targetTime = maghribTime;
      const totalFastingSeconds = differenceInSeconds(maghribTime, imsakTime);
      const elapsedFastingSeconds = differenceInSeconds(currentTime, imsakTime);
      fProgress = Math.max(0, Math.min(100, (elapsedFastingSeconds / totalFastingSeconds) * 100));
      
      if (tomorrowData) {
        nextSehri = parse((tomorrowData.timings.Imsak || '00:00').split(' ')[0], 'HH:mm', addDays(currentTime, 1));
      }
    } else if (isAfter(currentTime, maghribTime)) {
      // After Iftar, waiting for tomorrow's Sehri
      fType = 'sehri';
      if (tomorrowData) {
        targetTime = parse((tomorrowData.timings.Imsak || '00:00').split(' ')[0], 'HH:mm', addDays(currentTime, 1));
        nextSehri = targetTime;
        nextIftar = parse((tomorrowData.timings.Maghrib || '00:00').split(' ')[0], 'HH:mm', addDays(currentTime, 1));
        
        const totalWaitSeconds = differenceInSeconds(targetTime, maghribTime);
        const elapsedWaitSeconds = differenceInSeconds(currentTime, maghribTime);
        fProgress = Math.max(0, Math.min(100, (elapsedWaitSeconds / totalWaitSeconds) * 100));
      }
    } else {
      // Before Sehri
      fType = 'sehri';
      targetTime = imsakTime;
      const yesterdayData = data.find(d => d.date.gregorian.date === format(addDays(currentTime, -1), 'dd-MM-yyyy'));
      const prevIftar = yesterdayData ? parse((yesterdayData.timings.Maghrib || '00:00').split(' ')[0], 'HH:mm', addDays(currentTime, -1)) : subMinutes(imsakTime, 600);
      
      const totalWaitSeconds = differenceInSeconds(imsakTime, prevIftar);
      const elapsedWaitSeconds = differenceInSeconds(currentTime, prevIftar);
      fProgress = Math.max(0, Math.min(100, (elapsedWaitSeconds / totalWaitSeconds) * 100));
    }

    const fDiffMs = Math.max(0, targetTime.getTime() - currentTime.getTime());
    const fTotalSeconds = Math.ceil(fDiffMs / 1000);
    const fHours = Math.floor(fTotalSeconds / 3600);
    const fMinutes = Math.floor((fTotalSeconds % 3600) / 60);
    const fSeconds = fTotalSeconds % 60;
    const fRemaining = `${fHours.toString().padStart(2, '0')}:${fMinutes.toString().padStart(2, '0')}:${fSeconds.toString().padStart(2, '0')}`;

    setFastingInfo({ nextSehri, nextIftar, remaining: fRemaining, type: fType, progress: fProgress });

  }, [data, currentTime]);

  if (locLoading || prayerLoading) {
    return (
      <div className="bg-slate-50 dark:bg-slate-950 pb-8 font-sans min-h-screen">
        {/* Skeleton Hero Section */}
        <div className="relative bg-white dark:bg-slate-900 px-4 pt-safe pb-10 rounded-xl shadow-sm border-b border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <div className="space-y-2">
              <div className="h-4 w-24 shimmer rounded"></div>
              <div className="h-3 w-32 shimmer rounded"></div>
              <div className="h-2 w-20 shimmer rounded opacity-50"></div>
            </div>
            <div className="flex space-x-2">
              <div className="w-8 h-8 shimmer rounded-full"></div>
            </div>
          </div>
          
          <div className="flex justify-center items-center mt-4 mb-2">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <div className="absolute inset-0 shimmer rounded-full opacity-10"></div>
              <div className="w-28 h-28 shimmer rounded-full"></div>
            </div>
          </div>

          {/* Sunrise/Sunset Skeletons */}
          <div className="absolute left-4 bottom-12 flex flex-col items-center">
            <div className="w-4 h-4 shimmer rounded-full mb-1"></div>
            <div className="h-2 w-8 shimmer rounded"></div>
          </div>
          <div className="absolute right-4 bottom-12 flex flex-col items-center">
            <div className="w-4 h-4 shimmer rounded-full mb-1"></div>
            <div className="h-2 w-8 shimmer rounded"></div>
          </div>
        </div>

        {/* Skeleton Fasting Info */}
        <div className="relative z-20 -mt-6 mx-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-4 border border-slate-50 dark:border-slate-800">
            <div className="flex justify-between items-center divide-x divide-slate-100 dark:divide-slate-800 mb-4">
              <div className="flex-1 px-2 space-y-2">
                <div className="h-2 w-12 shimmer rounded mx-auto"></div>
                <div className="h-4 w-16 shimmer rounded mx-auto"></div>
              </div>
              <div className="flex-1 px-2 space-y-2">
                <div className="h-2 w-12 shimmer rounded mx-auto"></div>
                <div className="h-4 w-16 shimmer rounded mx-auto"></div>
              </div>
              <div className="flex-1 px-2 space-y-2">
                <div className="h-2 w-16 shimmer rounded mx-auto"></div>
                <div className="h-4 w-20 shimmer rounded mx-auto"></div>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="h-2 w-full shimmer rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Skeleton Prayer Times List */}
        <div className="mx-4 mt-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-50 dark:border-slate-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-50 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/20">
              <div className="h-4 w-24 shimmer rounded"></div>
            </div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex justify-between items-center py-3 px-3 border-b border-slate-50 dark:border-slate-800/50">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 shimmer rounded-full"></div>
                  <div className="h-4 w-20 shimmer rounded"></div>
                </div>
                <div className="h-4 w-16 shimmer rounded"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Skeleton Categories */}
        <div className="mx-4 mt-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-4">
            <div className="grid grid-cols-4 gap-y-4 gap-x-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="flex flex-col items-center space-y-2">
                  <div className="w-10 h-10 shimmer rounded-full"></div>
                  <div className="h-2 w-12 shimmer rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (prayerError) {
    return (
      <div className="p-6 text-center text-red-500">
        {prayerError}
      </div>
    );
  }

  const todayData = data?.find(d => d.date.gregorian.date === format(currentTime, 'dd-MM-yyyy'));
  const hijriDate = todayData?.date.hijri;

  const isFriday = currentTime.getDay() === 5;
  const PRAYERS_TO_SHOW_DYNAMIC = ['Fajr', 'Ishraq', 'Duha', isFriday ? 'Jumuah' : 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

  let visiblePrayers = PRAYERS_TO_SHOW_DYNAMIC;
  if (!showAllPrayers && nextPrayer) {
    const nextIdx = PRAYERS_TO_SHOW_DYNAMIC.indexOf(nextPrayer.name);
    const currentIdx = nextIdx <= 0 ? PRAYERS_TO_SHOW_DYNAMIC.length - 1 : nextIdx - 1;
    visiblePrayers = [PRAYERS_TO_SHOW_DYNAMIC[currentIdx], PRAYERS_TO_SHOW_DYNAMIC[nextIdx]];
  }

  let forbiddenTimes = null;
  if (todayData && todayData.timings) {
    const sunriseTime = parse((todayData.timings.Sunrise || '00:00').split(' ')[0], 'HH:mm', currentTime);
    const dhuhrTime = parse((todayData.timings.Dhuhr || '00:00').split(' ')[0], 'HH:mm', currentTime);
    const sunsetTime = parse((todayData.timings.Sunset || '00:00').split(' ')[0], 'HH:mm', currentTime);

    forbiddenTimes = [
      {
        id: 'sunrise',
        label: t('sunrise'),
        start: sunriseTime,
        end: addMinutes(sunriseTime, 15),
        icon: Sunrise,
        color: 'text-amber-500 dark:text-amber-400',
        bg: 'bg-amber-50 dark:bg-amber-500/10',
        isActive: isAfter(currentTime, sunriseTime) && !isAfter(currentTime, addMinutes(sunriseTime, 15))
      },
      {
        id: 'zenith',
        label: t('zenith'),
        start: subMinutes(dhuhrTime, 10),
        end: dhuhrTime,
        icon: Sun,
        color: 'text-orange-500 dark:text-orange-400',
        bg: 'bg-orange-50 dark:bg-orange-500/10',
        isActive: isAfter(currentTime, subMinutes(dhuhrTime, 10)) && !isAfter(currentTime, dhuhrTime)
      },
      {
        id: 'sunset',
        label: t('sunset'),
        start: subMinutes(sunsetTime, 15),
        end: sunsetTime,
        icon: Sunset,
        color: 'text-red-500 dark:text-red-400',
        bg: 'bg-red-50 dark:bg-red-500/10',
        isActive: isAfter(currentTime, subMinutes(sunsetTime, 15)) && !isAfter(currentTime, sunsetTime)
      }
    ];
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-950 pb-8 font-sans">
      {/* Premium Hero Section - Clean White/Light Theme (Compact) */}
      <div className={cn(
        "relative bg-white dark:bg-slate-900 text-slate-800 dark:text-white px-4 pb-10 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] overflow-hidden border-b border-slate-100 dark:border-slate-800",
        "pt-safe"
      )}>
        {/* Soft Ambient Glows for White Theme */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-primary/5 dark:bg-primary-dark/20 rounded-full"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-50 dark:bg-teal-900/20 rounded-full"></div>
        </div>

        {/* Header Top Bar */}
        <div className="relative z-10 flex justify-between items-start mb-3">
          <button 
            onClick={() => setIsLocationModalOpen(true)}
            className="text-left group hover:opacity-80 transition-opacity focus:outline-none"
          >
            <div className="flex items-center text-slate-600 dark:text-slate-300 mb-0.5">
              <MapPin className="w-3.5 h-3.5 mr-1 text-primary" />
              <span className="text-[13px] font-semibold tracking-wide border-b border-dashed border-slate-300 dark:border-slate-600 group-hover:border-primary transition-colors">{city || t('unknown-location')}</span>
              <ChevronDown className="w-3 h-3 ml-1 text-slate-400" />
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {formatNumber(format(currentTime, 'dd MMMM, yyyy'), language)}
            </div>
            {hijriDate && (
              <div className="text-[10px] text-primary/80 dark:text-primary/80 mt-0.5 font-medium">
                {formatNumber(hijriDate.day, language)} {hijriDate.month.ar}, {formatNumber(hijriDate.year, language)}
              </div>
            )}
          </button>
          <div className="flex space-x-2">
            <button 
              onClick={() => setActiveTab('notifications')}
              className="p-2 hover:opacity-80 transition-opacity relative"
            >
              <Bell className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
              )}
            </button>
          </div>
        </div>

        {/* Circular Progress & Next Prayer */}
        <div className="relative z-10 flex justify-center items-center mt-1 mb-2">
          {/* Sunrise/Sunset Indicators */}
          <div className="absolute left-4 flex flex-col items-center text-slate-400 dark:text-slate-500">
            <Sunrise className="w-4 h-4 mb-0.5 text-amber-500/80" />
            <span className="text-[10px] font-semibold tracking-wider">
              {todayData?.timings?.Sunrise ? formatNumber(format(parse(todayData.timings.Sunrise.split(' ')[0], 'HH:mm', currentTime), 'hh:mm a').replace('AM', language === 'bn' ? 'এএম' : 'AM').replace('PM', language === 'bn' ? 'পিএম' : 'PM'), language) : '--:--'}
            </span>
          </div>
          <div className="absolute right-4 flex flex-col items-center text-slate-400 dark:text-slate-500">
            <Sunset className="w-4 h-4 mb-0.5 text-orange-500/80" />
            <span className="text-[10px] font-semibold tracking-wider">
              {todayData?.timings?.Sunset ? formatNumber(format(parse(todayData.timings.Sunset.split(' ')[0], 'HH:mm', currentTime), 'hh:mm a').replace('AM', language === 'bn' ? 'এএম' : 'AM').replace('PM', language === 'bn' ? 'পিএম' : 'PM'), language) : '--:--'}
            </span>
          </div>

          {/* Main Circle - Clean & Premium White (Compact) */}
          <div className="relative w-36 h-36 flex items-center justify-center">
            {/* Outer soft shadow ring */}
            <div className="absolute inset-1.5 rounded-full shadow-[inset_0_0_15px_rgba(0,0,0,0.03)] dark:shadow-[inset_0_0_15px_rgba(0,0,0,0.2)]"></div>
            
            <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="ring-gradient-light" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--color-primary)" />
                  <stop offset="100%" stopColor="var(--color-primary-light)" />
                </linearGradient>
                <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.15" floodColor="var(--color-primary)" />
                </filter>
              </defs>
              {/* Background Track */}
              <circle 
                cx="50" cy="50" r="46" 
                fill="none" 
                className="stroke-slate-100 dark:stroke-slate-800"
                strokeWidth="2" 
              />
              {/* Progress Track */}
              <motion.circle 
                cx="50" cy="50" r="46" 
                fill="none" 
                stroke={nextPrayer?.isForbidden ? "#ef4444" : "url(#ring-gradient-light)"} 
                strokeWidth="4"
                strokeLinecap="round"
                filter={nextPrayer?.isForbidden ? "none" : "url(#soft-shadow)"}
                strokeDasharray="289.03"
                strokeDashoffset={289.03 - (289.03 * (nextPrayer?.progress || 0)) / 100}
                initial={{ strokeDashoffset: 289.03 }}
                animate={{ strokeDashoffset: 289.03 - (289.03 * (nextPrayer?.progress || 0)) / 100 }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </svg>
            
            <div className="text-center z-10 flex flex-col items-center justify-center mt-0.5">
              <p className={cn(
                "text-[9px] font-bold mb-0.5 tracking-widest uppercase",
                nextPrayer?.isForbidden ? "text-red-500" : "text-slate-500 dark:text-slate-400"
              )}>
                {nextPrayer?.isForbidden ? t('now-forbidden') : t('prayer-times')}
              </p>
              <h2 className={cn(
                "text-2xl font-extrabold mb-0 tracking-tight",
                nextPrayer?.isForbidden ? "text-red-600 dark:text-red-400" : "text-slate-800 dark:text-white"
              )}>
                {nextPrayer ? t(nextPrayer.name.toLowerCase() as any) : '...'}
              </h2>
              <p className="text-[9px] font-medium text-slate-400 dark:text-slate-500 mb-0.5">{t('prayer-times')}</p>
              <div className={cn(
                "text-lg font-bold tracking-widest leading-none",
                nextPrayer?.isForbidden ? "text-red-600 dark:text-red-400" : "text-primary dark:text-primary-light"
              )}>
                {formatNumber(nextPrayer?.remaining || '00:00:00', language)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Solid Info Card (Fasting Info) */}
      <div className="relative z-20 -mt-6 mx-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.05)] dark:shadow-[0_4px_20px_rgb(0,0,0,0.3)] p-4 border border-slate-50 dark:border-slate-800">
          <div className="flex justify-between items-center divide-x divide-slate-100 dark:divide-slate-800 mb-4">
            <div className="flex-1 text-center px-1">
              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wide">{t('next-sehri')}</p>
              <p className="text-base font-bold text-slate-800 dark:text-slate-100">
                {fastingInfo?.nextSehri ? formatNumber(format(fastingInfo.nextSehri, 'hh:mm a').replace('AM', language === 'bn' ? 'এএম' : 'AM').replace('PM', language === 'bn' ? 'পিএম' : 'PM'), language) : '--:--'}
              </p>
            </div>
            <div className="flex-1 text-center px-1">
              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wide">{t('next-iftar')}</p>
              <p className="text-base font-bold text-slate-800 dark:text-slate-100">
                {fastingInfo?.nextIftar ? formatNumber(format(fastingInfo.nextIftar, 'hh:mm a').replace('AM', language === 'bn' ? 'এএম' : 'AM').replace('PM', language === 'bn' ? 'পিএম' : 'PM'), language) : '--:--'}
              </p>
            </div>
            <div className="flex-1 text-center px-1">
              <p className="text-[10px] font-semibold text-primary dark:text-primary-light mb-1 uppercase tracking-wide">
                {fastingInfo?.type === 'sehri' ? t('sehri-remaining') : t('iftar-remaining')}
              </p>
              <p className="text-base font-bold text-primary dark:text-primary-light">
                {formatNumber(fastingInfo?.remaining || '00:00:00', language)}
              </p>
            </div>
          </div>
          
          {/* Fasting Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[10px] font-bold">
              <span className="text-slate-400 dark:text-slate-500">
                {fastingInfo?.type === 'iftar' ? t('fasting-progress') : t('sehri-wait')}
              </span>
              <span className="text-primary dark:text-primary-light">{formatNumber(Math.round(fastingInfo?.progress || 0), language)}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${fastingInfo?.progress || 0}%` }}
                className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-4 mt-4">
        <SlimBannerAd category="home" />
      </div>

      {/* Prayer Times List */}
      <div className="mx-4 mt-2">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgb(0,0,0,0.2)] border border-slate-50 dark:border-slate-800 overflow-hidden">
          {/* Internal Header */}
          <div className="flex justify-between items-center px-4 py-3 border-b border-slate-50 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/20">
            <h3 className="text-[14px] font-bold text-slate-800 dark:text-slate-200">{t('prayer-times')}</h3>
            <button 
              onClick={() => setActiveTab('alarm-list')}
              className="text-[11px] font-medium text-primary dark:text-primary-light flex items-center hover:opacity-80 transition-colors"
            >
              {t('set-alarm')} <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
          
          {todayData && todayData.timings && visiblePrayers.map((prayer, index) => {
            const timingKey = prayer === 'Jumuah' ? 'Dhuhr' : prayer;
            let timing = todayData.timings[timingKey as keyof typeof todayData.timings];
            
            // Handle Ishraq and Duha
            if (prayer === 'Ishraq' || prayer === 'Duha') {
              const sunrise = parse((todayData.timings.Sunrise || '00:00').split(' ')[0], 'HH:mm', currentTime);
              const sunriseEnd = addMinutes(sunrise, 15);
              const ishraqEnd = addMinutes(sunriseEnd, 30);
              const time = prayer === 'Ishraq' ? sunriseEnd : ishraqEnd;
              timing = format(time, 'HH:mm');
            }

            if (!timing) return null;
            const timeStr = timing.split(' ')[0];
            const [hours, minutes] = timeStr.split(':');
            const prayerTime = new Date(currentTime);
            prayerTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            
            const isNext = nextPrayer?.name === prayer;
            const isPassed = isAfter(currentTime, prayerTime);

            let Icon = Sun;
            if (prayer === 'Fajr') Icon = Sunrise;
            if (prayer === 'Maghrib' || prayer === 'Isha') Icon = Moon;
            if (prayer === 'Ishraq' || prayer === 'Duha') Icon = Sun;

            return (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                key={prayer}
                className={cn(
                  "flex items-center justify-between py-1.5 px-3 border-b border-slate-50 dark:border-slate-800/50 transition-colors",
                  isNext ? "bg-primary-light/10 dark:bg-primary-dark/10" : "",
                  isPassed && !isNext ? "opacity-50" : ""
                )}
              >
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                    isNext ? "bg-primary-light/30 text-primary dark:bg-primary-dark/30 dark:text-primary-light" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                  )}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <h4 className={cn(
                    "font-semibold text-[14px] transition-colors",
                    isNext ? "text-primary dark:text-primary-light" : "text-slate-700 dark:text-slate-300"
                  )}>
                    {t(prayer.toLowerCase() as any)}
                  </h4>
                </div>
                
                <div className="text-right">
                  <p className={cn(
                    "font-medium text-[14px] transition-colors",
                    isNext ? "text-primary dark:text-primary-light" : "text-slate-700 dark:text-slate-300"
                  )}>
                    {formatNumber(format(prayerTime, 'hh:mm a').replace('AM', language === 'bn' ? 'এএম' : 'AM').replace('PM', language === 'bn' ? 'পিএম' : 'PM'), language)}
                  </p>
                </div>
              </motion.div>
            );
          })}
          
          <button 
            onClick={() => setShowAllPrayers(!showAllPrayers)}
            className="w-full py-1.5 text-[12px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/20 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-center"
          >
            {showAllPrayers ? t('collapse') : t('show-all')} 
            <ChevronDown className={cn("w-3.5 h-3.5 ml-1 transition-transform", showAllPrayers && "rotate-180")} />
          </button>
        </div>
      </div>

      {/* Categories Section */}
      <div className="mx-4 mt-2 mb-2">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="flex justify-between items-center px-4 py-2.5 border-b border-slate-50 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/20">
            <h3 className="text-[13px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">{t('categories')}</h3>
            <button 
              onClick={() => setActiveTab('categories')}
              className="text-[10px] font-black text-primary dark:text-primary-light uppercase tracking-widest flex items-center"
            >
              {t('categories')}
            </button>
          </div>
          
          <div className="p-4">
            <div className="grid grid-cols-4 gap-y-3 gap-x-2">
              {[
                ...CATEGORIES.filter(c => [
                  'quran', 'hadith', 'education', 'namaz-shikkha',
                  'qibla', 'tasbih', 'zakat', 'calendar',
                  'dua', 'names-of-allah', 'ramadan', 'islamic-names'
                ].includes(c.id)),
                ...(isAdmin ? [{ id: 'admin-settings', icon: ShieldCheck, color: 'text-white', bg: 'bg-gradient-to-br from-primary-dark to-primary-dark/80' }] : [])
              ].map((cat, idx) => (
                <CategoryButton key={cat.id} cat={cat} idx={idx} setActiveTab={setActiveTab} latitude={latitude} longitude={longitude} />
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Forbidden Prayer Times Section */}
      {forbiddenTimes && (
        <div className="mx-4 mt-2 mb-8">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgb(0,0,0,0.2)] border border-red-50 dark:border-red-900/10 overflow-hidden">
            {/* Internal Header */}
            <div className="flex justify-between items-center px-4 py-3 border-b border-red-50 dark:border-red-900/20 bg-red-50/30 dark:bg-red-900/10">
              <h3 className="text-[14px] font-bold text-red-800 dark:text-red-400">{t('forbidden-times')}</h3>
            </div>
            <div className="grid grid-cols-3 divide-x divide-slate-50 dark:divide-slate-800/50">
              {forbiddenTimes.map((time, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  key={time.id} 
                  className={cn(
                    "p-4 text-center flex flex-col items-center justify-center relative",
                    (time as any).isActive && "bg-red-50/50 dark:bg-red-900/5"
                  )}
                >
                  {(time as any).isActive && (
                    <div className="absolute top-1 right-1">
                      <span className="flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                    </div>
                  )}
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center mb-2.5", time.bg, time.color)}>
                    <time.icon className="w-5 h-5" />
                  </div>
                  <h4 className="text-[12px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">{time.label}</h4>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-tight">
                    {formatNumber(format(time.start, 'hh:mm a').replace('AM', language === 'bn' ? 'এএম' : 'AM').replace('PM', language === 'bn' ? 'পিএম' : 'PM'), language)} 
                    <span className="mx-1 text-zinc-300 dark:text-zinc-600">-</span> 
                    {formatNumber(format(time.end, 'hh:mm a').replace('AM', language === 'bn' ? 'এএম' : 'AM').replace('PM', language === 'bn' ? 'পিএম' : 'PM'), language)}
                  </p>
                  {(time as any).isActive && (
                    <span className="mt-1.5 text-[9px] font-black text-red-600 dark:text-red-400 uppercase tracking-tighter">{t('now-forbidden')}</span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      <LocationModal 
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentCountry={country}
        currentCity={city}
        currentLat={latitude}
        currentLon={longitude}
      />
    </div>
  );
}
