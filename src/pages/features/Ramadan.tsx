import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Moon, Sun, Clock, Calendar as CalendarIcon, 
  BookOpen, CheckCircle2, Star, Coins, 
  ChevronRight, ArrowLeft, Bell, BellRing,
  Timer, Info, Heart, ListChecks, Sparkles
} from 'lucide-react';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { useLocation } from '@/hooks/useLocation';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { format, addDays, differenceInSeconds, isAfter, parse } from 'date-fns';

// Types
type RamadanTab = 'dashboard' | 'calendar' | 'duas' | 'tracker' | 'guide' | 'qadr' | 'zakat';

interface RamadanDay {
  day: number;
  date: string;
  sehri: string;
  iftar: string;
}

export function RamadanView({ onBack }: { onBack: () => void }) {
  const { t, language } = useLanguage();
  const { latitude, longitude } = useLocation(language);
  const { data: prayerData } = usePrayerTimes(latitude, longitude);
  const [activeTab, setActiveTab] = useState<RamadanTab>('dashboard');
  const [dailyChecklist, setDailyChecklist] = useState<Record<number, boolean>>(() => {
    const saved = localStorage.getItem('ramadan_daily_checklist');
    return saved ? JSON.parse(saved) : {};
  });

  // Handle hardware back button for tabs
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;
      if (state?.tab) {
        // If the state tab is 'ramadan', it means we are at the root of this feature
        if (state.tab === 'ramadan') {
          setActiveTab('dashboard');
        } else if (['dashboard', 'calendar', 'duas', 'tracker', 'guide', 'qadr', 'zakat'].includes(state.tab)) {
          setActiveTab(state.tab);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleTabChange = (tab: RamadanTab) => {
    if (tab !== activeTab) {
      window.history.pushState({ tab }, '', '');
      setActiveTab(tab);
    }
  };

  // Scroll to top on tab change
  useEffect(() => {
    const timer = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 10);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [tracker, setTracker] = useState<Record<number, boolean>>(() => {
    const saved = localStorage.getItem('ramadan_tracker');
    return saved ? JSON.parse(saved) : {};
  });

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Save states to local storage
  useEffect(() => {
    localStorage.setItem('ramadan_tracker', JSON.stringify(tracker));
  }, [tracker]);

  useEffect(() => {
    localStorage.setItem('ramadan_daily_checklist', JSON.stringify(dailyChecklist));
  }, [dailyChecklist]);

  const formatNumber = (num: number | string) => {
    if (language !== 'bn') return num.toString();
    const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().replace(/\d/g, d => bn[parseInt(d)]);
  };

  // Mock Ramadan Data (In a real app, this would be calculated based on the year)
  const ramadanDays: RamadanDay[] = prayerData?.slice(0, 30).map((d, i) => ({
    day: i + 1,
    date: d.date.gregorian.date,
    sehri: d.timings.Imsak.split(' ')[0],
    iftar: d.timings.Maghrib.split(' ')[0],
    hijriMonth: d.date.hijri.month.number
  })) || [];

  // Determine if we are in Ramadan
  const isRamadan = prayerData?.[0]?.date.hijri.month.number === 9;
  const currentRamadanDay = isRamadan ? parseInt(prayerData?.[0]?.date.hijri.day) : 0;
  const todayData = isRamadan ? ramadanDays[currentRamadanDay - 1] : null;

  // Countdown Logic
  const getCountdown = () => {
    const now = currentTime;

    if (!isRamadan) {
      // Countdown to Ramadan Start (Mocking next Ramadan start for demo if not in Ramadan)
      const ramadanStart = new Date(2027, 1, 7); // Approx Feb 7, 2027
      const diff = differenceInSeconds(ramadanStart, now);
      
      if (diff <= 0) return null;

      const d = Math.floor(diff / (3600 * 24));
      const h = Math.floor((diff % (3600 * 24)) / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;

      // Progress calculation for pre-Ramadan (e.g., 30 days before)
      const totalSeconds = 30 * 24 * 3600;
      const progress = Math.max(0, Math.min(100, (1 - diff / totalSeconds) * 100));

      return {
        d: d.toString().padStart(2, '0'),
        h: h.toString().padStart(2, '0'),
        m: m.toString().padStart(2, '0'),
        s: s.toString().padStart(2, '0'),
        label: t('countdown-ramadan'),
        type: 'start',
        progress
      };
    }

    if (!todayData) return null;
    
    const sehriTime = parse(todayData.sehri, 'HH:mm', now);
    const iftarTime = parse(todayData.iftar, 'HH:mm', now);
    
    let target = iftarTime;
    let startTime = sehriTime;
    let label = t('time-to-iftar');
    let type: 'sehri' | 'iftar' = 'iftar';

    if (isAfter(now, iftarTime)) {
      const tomorrow = ramadanDays[currentRamadanDay];
      if (tomorrow) {
        target = parse(tomorrow.sehri, 'HH:mm', addDays(now, 1));
        startTime = iftarTime;
        label = language === 'bn' ? 'সেহরির বাকি' : 'Time to Sehri';
        type = 'sehri';
      }
    } else if (isAfter(now, sehriTime)) {
      target = iftarTime;
      startTime = sehriTime;
      label = language === 'bn' ? 'ইফতারের বাকি' : 'Time to Iftar';
      type = 'iftar';
    } else {
      target = sehriTime;
      const yesterday = ramadanDays[currentRamadanDay - 2];
      startTime = yesterday ? parse(yesterday.iftar, 'HH:mm', addDays(now, -1)) : addDays(sehriTime, -1);
      label = language === 'bn' ? 'সেহরির বাকি' : 'Time to Sehri';
      type = 'sehri';
    }

    const diff = differenceInSeconds(target, now);
    const total = differenceInSeconds(target, startTime);
    const progress = Math.max(0, Math.min(100, (1 - diff / total) * 100));

    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;

    return {
      h: h.toString().padStart(2, '0'),
      m: m.toString().padStart(2, '0'),
      s: s.toString().padStart(2, '0'),
      label,
      type,
      progress
    };
  };

  const countdown = getCountdown();

  const renderDashboard = () => (
    <div className="space-y-6 pb-24">
      {/* Compact Fasting Card (Like Home Page) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.05)] dark:shadow-[0_4px_20px_rgb(0,0,0,0.3)] p-5 border border-slate-100 dark:border-slate-800">
        <div className="flex justify-between items-center divide-x divide-slate-100 dark:divide-slate-800 mb-6">
          <div className="flex-1 text-center px-1">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-wider">
              {t('sehri-time')}
            </p>
            <p className="text-base font-black text-slate-900 dark:text-white">
              {formatNumber(todayData?.sehri || '--:--')} AM
            </p>
          </div>
          <div className="flex-1 text-center px-1">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-wider">
              {t('iftar-time')}
            </p>
            <p className="text-base font-black text-slate-900 dark:text-white">
              {formatNumber(todayData?.iftar || '--:--')} PM
            </p>
          </div>
          <div className="flex-1 text-center px-1">
            <p className="text-[10px] font-bold text-primary-dark dark:text-primary mb-1.5 uppercase tracking-wider">
              {countdown?.label}
            </p>
            <p className="text-base font-black text-primary-dark dark:text-primary">
              {formatNumber(`${countdown?.h || '00'}:${countdown?.m || '00'}:${countdown?.s || '00'}`)}
            </p>
          </div>
        </div>
        
        {/* Fasting Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-[10px] font-black">
            <span className="text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              {countdown?.type === 'iftar' 
                ? t('fasting-completed') 
                : t('waiting-sehri')}
            </span>
            <span className="text-primary-dark dark:text-primary">{formatNumber(Math.round(countdown?.progress || 0))}%</span>
          </div>
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${countdown?.progress || 0}%` }}
              className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full shadow-lg shadow-primary/20"
            />
          </div>
        </div>
      </div>

      {/* Quick Actions Grid - Redesigned to White Cards */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { id: 'calendar', icon: CalendarIcon, label: t('ramadan-calendar'), sub: t('sehri-iftar-time'), color: 'text-blue-500', bg: 'bg-blue-50' },
          { id: 'duas', icon: BookOpen, label: t('essential-duas'), sub: t('sehri-iftar-duas'), color: 'text-primary', bg: 'bg-primary/10' },
          { id: 'tracker', icon: Timer, label: t('fasting-tracker'), sub: t('30-days-progress'), color: 'text-purple-500', bg: 'bg-purple-50' },
          { id: 'guide', icon: ListChecks, label: t('ramadan-guide'), sub: t('daily-special-deeds'), color: 'text-orange-500', bg: 'bg-orange-50' },
        ].map((item) => (
          <button 
            key={item.id}
            onClick={() => handleTabChange(item.id as RamadanTab)}
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 text-left shadow-sm hover:shadow-md transition-all active:scale-95 group"
          >
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", item.bg)}>
              <item.icon className={cn("w-5 h-5", item.color)} />
            </div>
            <h4 className="text-sm font-black text-slate-900 dark:text-white mb-1">{item.label}</h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{item.sub}</p>
          </button>
        ))}
      </div>

      {/* Daily Task Card - Redesigned */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Star className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                {language === 'bn' ? 'আজকের বিশেষ আমল' : 'Daily Special Deeds'}
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Ramadan Checklist</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300" />
        </div>
        
        <div className="space-y-3">
          {[
            { id: 1, task: '১ পারা কুরআন তিলাওয়াত', icon: BookOpen },
            { id: 2, task: '১০০ বার যিকির ও ইস্তিগফার', icon: Heart },
            { id: 3, task: 'অসহায়কে ইফতার করানো', icon: Coins },
          ].map((item) => (
            <div 
              key={item.id} 
              onClick={() => setDailyChecklist(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
              className={cn(
                "flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer group",
                dailyChecklist[item.id] 
                  ? "bg-primary/5 dark:bg-primary-dark/10 border-primary/20" 
                  : "bg-slate-50 dark:bg-slate-800/50 border-transparent hover:border-amber-500/20"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                dailyChecklist[item.id]
                  ? "border-primary bg-primary"
                  : "border-slate-200 dark:border-slate-700 group-hover:border-amber-500"
              )}>
                {dailyChecklist[item.id] ? (
                  <CheckCircle2 className="w-4 h-4 text-white" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-amber-500 scale-0 group-hover:scale-100 transition-transform" />
                )}
              </div>
              <span className={cn(
                "text-xs font-bold transition-colors",
                dailyChecklist[item.id] ? "text-primary-dark dark:text-primary" : "text-slate-700 dark:text-slate-300"
              )}>
                {item.task}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Special Sections - White Cards */}
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => handleTabChange('qadr')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-6 text-left relative overflow-hidden group shadow-sm border border-slate-100 dark:border-slate-800 transition-all active:scale-95"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Sparkles className="w-5 h-5 text-indigo-600" />
          </div>
          <h4 className="text-sm font-black text-slate-900 dark:text-white mb-1">লাইলাতুল কদর</h4>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">শেষ ১০ দিনের আমল</p>
        </button>
        <button 
          onClick={() => handleTabChange('zakat')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-6 text-left relative overflow-hidden group shadow-sm border border-slate-100 dark:border-slate-800 transition-all active:scale-95"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Coins className="w-5 h-5 text-primary" />
          </div>
          <h4 className="text-sm font-black text-slate-900 dark:text-white mb-1">যাকাত ও ফিতরা</h4>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">হিসাব ও নিয়মাবলী</p>
        </button>
      </div>
    </div>
  );

  const renderCalendar = () => (
    <div className="space-y-4 pb-24">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-100 dark:border-slate-800 grid grid-cols-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
          <span>দিন</span>
          <span>তারিখ</span>
          <span className="text-center">সেহরি</span>
          <span className="text-center">ইফতার</span>
        </div>
        <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
          {ramadanDays.map((day) => (
            <div key={day.day} className={cn(
              "px-6 py-4 grid grid-cols-4 items-center text-xs font-bold transition-colors",
              day.day === currentRamadanDay 
                ? "bg-amber-500/5 text-amber-600 dark:text-amber-400" 
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/30"
            )}>
              <span className="flex items-center gap-2">
                <span className={cn(
                  "w-6 h-6 rounded-lg flex items-center justify-center text-[10px]",
                  day.day === currentRamadanDay ? "bg-amber-500 text-white" : "bg-slate-100 dark:bg-slate-800"
                )}>
                  {formatNumber(day.day)}
                </span>
              </span>
              <span className="text-[10px] font-medium opacity-60">
                {formatNumber(day.date.split('-')[0])} {language === 'bn' ? 'মার্চ' : 'Mar'}
              </span>
              <span className="text-center font-black">{formatNumber(day.sehri)}</span>
              <span className="text-center font-black">{formatNumber(day.iftar)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="p-5 bg-blue-50 dark:bg-blue-500/5 rounded-2xl border border-blue-100 dark:border-blue-500/20 flex gap-4">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
          <Info className="w-5 h-5 text-blue-500" />
        </div>
        <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed font-medium">
          {language === 'bn' 
            ? 'সময়গুলো আপনার বর্তমান লোকেশন অনুযায়ী দেখানো হচ্ছে। এলাকাভেদে ১-২ মিনিট পার্থক্য হতে পারে।' 
            : 'Times are shown based on your current location. 1-2 minutes difference may occur based on area.'}
        </p>
      </div>
    </div>
  );

  const renderDuas = () => (
    <div className="space-y-4 pb-24">
      {[
        {
          title: 'সেহরির নিয়ত',
          arabic: 'نَوَيْتُ اَنْ اَصُوْمَ غَدًا مِّنْ شَهْرِ رَمَضَانَ الْمُبَارَكِ فَرْضًا لَّكَ يَا اَللهُ فَتَقَبَّلْ مِنِّى اِنَّكَ اَنْتَ السَّমِيْعُ الْعَلِيْمُ',
          bangla: 'নাওয়াইতু আন আসুমা গাদাম মিন শাহরি রামাদানাল মুবারাকি ফারদাল্লাকা ইয়া আল্লাহু ফাতাকাব্বাল মিন্নী ইন্নাকা আনতাস সামিউল আলীম।',
          meaning: 'হে আল্লাহ! আমি আগামীকাল পবিত্র রমজানের রোজা রাখার নিয়ত করছি, যা তোমার পক্ষ থেকে ফরজ করা হয়েছে। অতএব তুমি আমার পক্ষ থেকে তা কবুল করো। নিশ্চয়ই তুমি সর্বশ্রোতা ও সর্বজ্ঞ।'
        },
        {
          title: 'ইফতারের দোয়া',
          arabic: 'اَللَّهُمَّ لَكَ صُمْتُ وَعَلَى رِزْقِكَ اَفْطَرْتُ',
          bangla: 'আল্লাহুম্মা লাকা সুমতু ওয়া আলা রিযকিকা আফতারতু।',
          meaning: 'হে আল্লাহ! আমি তোমারই সন্তুষ্টির জন্য রোজা রেখেছি এবং তোমারই দেওয়া রিযিক দিয়ে ইফতার করছি।'
        },
        {
          title: 'রোজা ভাঙার দোয়া',
          arabic: 'ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ وَثَبَتَ الأَجْرُ إِنْ شَاءَ اللَّهُ',
          bangla: 'জাহাবাজ জামাউ ওয়াবতাল্লাতিল উরুকু ওয়া সাবাতাল আজরু ইনশাআল্লাহ।',
          meaning: 'পিপাসা মিটেছে, শিরাগুলো সিক্ত হয়েছে এবং ইনশাআল্লাহ সওয়াব নির্ধারিত হয়েছে।'
        }
      ].map((dua, i) => (
        <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-6 bg-primary rounded-full" />
            <h3 className="text-base font-black text-slate-900 dark:text-white">{dua.title}</h3>
          </div>
          <p className="text-2xl font-arabic text-right leading-relaxed dark:text-white py-2">{dua.arabic}</p>
          <div className="space-y-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
              <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 italic leading-relaxed">{dua.bangla}</p>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed px-1">
              <span className="font-black text-primary uppercase text-[9px] tracking-widest block mb-0.5">অর্থ</span>
              {dua.meaning}
            </p>
          </div>
        </div>
      ))}
    </div>
  );

  const renderTracker = () => (
    <div className="space-y-6 pb-24">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 text-center relative overflow-hidden shadow-sm">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-500/5 to-transparent" />
        <div className="relative z-10">
          <p className="text-[9px] font-black text-slate-400 dark:text-white/40 mb-2 uppercase tracking-[0.3em]">রমজান প্রগ্রেস</p>
          <div className="text-4xl font-black mb-3 tracking-tighter text-slate-900 dark:text-white">
            {formatNumber(Object.values(tracker).filter(Boolean).length)}<span className="text-xl text-slate-200 dark:text-white/20 mx-1">/</span>{formatNumber(30)}
          </div>
          <div className="h-2 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden p-0.5 border border-slate-200/50 dark:border-white/5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(Object.values(tracker).filter(Boolean).length / 30) * 100}%` }}
              className="h-full bg-gradient-to-r from-purple-500 to-amber-500 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.3)]"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-2">
        {Array.from({ length: 30 }).map((_, i) => (
          <button
            key={i}
            onClick={() => setTracker(prev => ({ ...prev, [i + 1]: !prev[i + 1] }))}
            className={cn(
              "aspect-square rounded-xl border flex flex-col items-center justify-center transition-all active:scale-90 relative overflow-hidden group",
              tracker[i + 1] 
                ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" 
                : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 hover:border-primary/30"
            )}
          >
            <span className="text-[10px] font-black">{formatNumber(i + 1)}</span>
            {tracker[i + 1] ? (
              <CheckCircle2 className="w-3 h-3 mt-0.5" />
            ) : (
              <div className="w-0.5 h-0.5 rounded-full bg-slate-200 dark:bg-slate-700 mt-1 group-hover:bg-primary transition-colors" />
            )}
          </button>
        ))}
      </div>
    </div>
  );

  const renderGuide = () => (
    <div className="space-y-4 pb-24">
      {[
        { title: 'বেশি কুরআন পড়া', desc: 'প্রতিদিন অন্তত ১ পারা পড়ার চেষ্টা করুন।' },
        { title: 'দান-সাদাকা করা', desc: 'অসহায়দের সাহায্য করুন, এটি সওয়াব বহুগুণ বাড়িয়ে দেয়।' },
        { title: 'নফল নামাজ', desc: 'তাহাজ্জুদ, ইশরাক ও চাশতের নামাজ পড়ার চেষ্টা করুন।' },
        { title: 'যিকির ও দোয়া', desc: 'সব সময় জবানকে আল্লাহর যিকিরে সিক্ত রাখুন।' },
        { title: 'তারাবীহ নামাজ', desc: 'জামাতের সাথে তারাবীহ পড়ার গুরুত্ব অনেক।' }
      ].map((item, i) => (
        <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 flex gap-4 items-start">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
            <Star className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900 dark:text-white mb-1">{item.title}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );

  const renderQadr = () => (
    <div className="space-y-6 pb-24">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-100 dark:border-slate-800 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <Moon className="w-24 h-24 fill-indigo-500" />
        </div>
        <div className="relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4">
            <Sparkles className="w-6 h-6 text-indigo-600" />
          </div>
          <h3 className="text-xl font-black mb-2 text-slate-900 dark:text-white">লাইলাতুল কদর</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            হাজার মাসের চেয়েও উত্তম রাত। রমজানের শেষ ১০ দিনের বেজোড় রাতগুলোতে এটি তালাশ করুন।
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest pl-2">সম্ভাব্য রাতসমূহ</h4>
        <div className="grid grid-cols-5 gap-2">
          {[21, 23, 25, 27, 29].map(night => (
            <div key={night} className="bg-white dark:bg-slate-900 border border-indigo-500/20 rounded-2xl p-3 text-center">
              <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">{formatNumber(night)}</span>
              <p className="text-[8px] text-slate-400 uppercase">রমজান</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="text-lg font-black text-indigo-600 dark:text-indigo-400">কদরের বিশেষ দোয়া</h3>
        <p className="text-2xl font-arabic text-right leading-loose dark:text-white">اَللَّهُمَّ اِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّى</p>
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 italic">আল্লাহুম্মা ইন্নাকা আফুউন তুহিব্বুল আফওয়া ফাফু আন্নী।</p>
          <div className="h-px bg-slate-100 dark:bg-slate-800 w-full" />
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            <span className="font-black text-indigo-500 mr-1">অর্থ:</span>
            হে আল্লাহ! নিশ্চয়ই তুমি ক্ষমাশীল, তুমি ক্ষমা করতে ভালোবাসো। অতএব তুমি আমাকে ক্ষমা করে দাও।
          </p>
        </div>
      </div>
    </div>
  );

  const renderZakat = () => (
    <div className="space-y-6 pb-24">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-100 dark:border-slate-800 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <Coins className="w-24 h-24 fill-primary" />
        </div>
        <div className="relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Heart className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-xl font-black mb-2 text-slate-900 dark:text-white">যাকাত ও ফিতরা গাইড</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            ইসলামের অন্যতম স্তম্ভ যাকাত। আপনার সম্পদের একটি নির্দিষ্ট অংশ গরিবদের দান করা ফরজ।
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800">
          <h4 className="text-sm font-black text-primary-dark mb-2">ফিতরা কি?</h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            ঈদুল ফিতরের আগে সামর্থ্যবান মুসলমানদের জন্য নির্দিষ্ট পরিমাণ খাদ্য বা অর্থ দান করা ওয়াজিব। এটি রোজার ভুলত্রুটি মার্জনা করে।
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800">
          <h4 className="text-sm font-black text-primary-dark mb-2">যাকাতের হিসাব</h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            আপনার কাছে যদি নিসাব পরিমাণ (৭.৫ তোলা সোনা বা ৫২.৫ তোলা রুপার সমমূল্য) সম্পদ এক বছর থাকে, তবে তার ২.৫% যাকাত দিতে হবে।
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-full bg-slate-50 dark:bg-slate-950 pb-8">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 px-4 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex flex-col leading-tight">
              <span className="text-[10px] text-amber-500 uppercase tracking-widest font-black">Ramadan</span>
              <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Moon className="w-5 h-5 text-amber-500 fill-amber-500" />
                {language === 'bn' ? 'রমজান' : 'Ramadan'}
              </h1>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl text-slate-400 hover:text-amber-500 transition-colors">
              <BellRing className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 pt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'calendar' && renderCalendar()}
            {activeTab === 'duas' && renderDuas()}
            {activeTab === 'tracker' && renderTracker()}
            {activeTab === 'guide' && renderGuide()}
            {activeTab === 'qadr' && renderQadr()}
            {activeTab === 'zakat' && renderZakat()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
