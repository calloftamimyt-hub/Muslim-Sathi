import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Info, MapPin } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, isToday, setMonth, setYear } from 'date-fns';
import { bn } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Capacitor } from '@capacitor/core';

const BANGLA_MONTHS = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
const BANGLA_DAYS = ["শনি", "রবি", "সোম", "মঙ্গল", "বুধ", "বৃহঃ", "শুক্র"];

const toBn = (str: string | number) => {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return str.toString().replace(/\d/g, d => bnDigits[parseInt(d)]);
};

// Bangla Date using Intl
const getBanglaDate = (date: Date) => {
  try {
    const formatter = new Intl.DateTimeFormat('bn-BD-u-ca-bengali', { day: 'numeric', month: 'long' });
    return formatter.format(date);
  } catch (e) {
    return toBn(date.getDate());
  }
};

// Hijri Date using Intl
const getHijriDate = (date: Date) => {
  try {
    const formatter = new Intl.DateTimeFormat('bn-BD-u-ca-islamic-uma', { day: 'numeric', month: 'long', year: 'numeric' });
    return formatter.format(date);
  } catch (e) {
    return toBn(date.getDate());
  }
};

// Bangla Day Number
const getBanglaDay = (date: Date) => {
  try {
    const formatter = new Intl.DateTimeFormat('bn-BD-u-ca-bengali', { day: 'numeric' });
    return formatter.format(date);
  } catch (e) {
    return toBn(date.getDate());
  }
};

// Hijri Day Number
const getHijriDay = (date: Date) => {
  try {
    const formatter = new Intl.DateTimeFormat('bn-BD-u-ca-islamic-uma', { day: 'numeric' });
    return formatter.format(date);
  } catch (e) {
    return toBn(date.getDate());
  }
};

export function CalendarView({ onBack }: { onBack: () => void }) {
  const isMobile = Capacitor.isNativePlatform() || window.innerWidth < 768;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 6 }); // Start on Saturday for BD
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 6 });

  const calendarDays = useMemo(() => eachDayOfInterval({ start: startDate, end: endDate }), [startDate, endDate]);

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const arr = [];
    for (let i = currentYear - 10; i <= currentYear + 10; i++) {
      arr.push(i);
    }
    return arr;
  }, []);

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentDate(setMonth(currentDate, parseInt(e.target.value)));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentDate(setYear(currentDate, parseInt(e.target.value)));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [isYearOpen, setIsYearOpen] = useState(false);

  return (
    <div className="min-h-full w-full bg-[#FAFAFA] dark:bg-slate-950 font-sans selection:bg-emerald-100 dark:selection:bg-emerald-900/30 pb-8">
      {/* Sticky Header Section */}
      <header className="sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-20 px-4 pt-safe pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">ক্যালেন্ডার</h1>
              <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">English • Bangla • Hijri</p>
            </div>
          </div>
          
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={goToToday}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black rounded-xl shadow-lg shadow-emerald-600/10 transition-all"
          >
            আজ
          </motion.button>
        </div>
      </header>

      <main className="p-4 max-w-4xl mx-auto space-y-4">
        {/* Slim Selected Date Details Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <span className="text-2xl font-black tracking-tighter">{toBn(format(selectedDate, 'd'))}</span>
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white leading-none">
                {format(selectedDate, 'MMMM yyyy', { locale: bn })}
              </h2>
              <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 uppercase tracking-wider">
                {format(selectedDate, 'EEEE', { locale: bn })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:border-l sm:border-slate-100 dark:sm:border-slate-800 sm:pl-6">
            <div className="text-right">
              <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">হিজরি</p>
              <p className="text-[11px] font-black text-slate-700 dark:text-slate-200">{getHijriDate(selectedDate)}</p>
            </div>
            <div className="w-px h-6 bg-slate-100 dark:bg-slate-800" />
            <div className="text-right">
              <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">বাংলা</p>
              <p className="text-[11px] font-black text-slate-700 dark:text-slate-200">{getBanglaDate(selectedDate)}</p>
            </div>
          </div>
        </motion.div>

        {/* Calendar Grid & Controls Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden"
        >
          {/* Month Display & Controls Header */}
          <div className="px-5 py-4 flex items-center justify-between border-b border-slate-50 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-800/10">
            <div className="flex items-center gap-3">
              <div className="flex gap-2 relative">
                {/* Custom Month Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => { setIsMonthOpen(!isMonthOpen); setIsYearOpen(false); }}
                    className="flex items-center gap-1 text-xs font-black text-slate-800 dark:text-slate-200 hover:text-emerald-600 transition-colors"
                  >
                    {BANGLA_MONTHS[currentDate.getMonth()]}
                    <ChevronRight className={cn("w-3 h-3 transition-transform", isMonthOpen ? "-rotate-90" : "rotate-90")} />
                  </button>
                  
                  <AnimatePresence>
                    {isMonthOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsMonthOpen(false)} />
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute left-0 mt-2 w-40 max-h-64 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-xl z-50 py-2"
                        >
                          {BANGLA_MONTHS.map((m, i) => (
                            <button
                              key={i}
                              onClick={() => {
                                setCurrentDate(setMonth(currentDate, i));
                                setIsMonthOpen(false);
                              }}
                              className={cn(
                                "w-full text-left px-4 py-2 text-[11px] font-bold transition-colors",
                                currentDate.getMonth() === i 
                                  ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" 
                                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                              )}
                            >
                              {m}
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {/* Custom Year Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => { setIsYearOpen(!isYearOpen); setIsMonthOpen(false); }}
                    className="flex items-center gap-1 text-xs font-black text-slate-800 dark:text-slate-200 hover:text-emerald-600 transition-colors"
                  >
                    {toBn(currentDate.getFullYear())}
                    <ChevronRight className={cn("w-3 h-3 transition-transform", isYearOpen ? "-rotate-90" : "rotate-90")} />
                  </button>

                  <AnimatePresence>
                    {isYearOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsYearOpen(false)} />
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute left-0 mt-2 w-32 max-h-64 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-xl z-50 py-2"
                        >
                          {years.map(y => (
                            <button
                              key={y}
                              onClick={() => {
                                setCurrentDate(setYear(currentDate, y));
                                setIsYearOpen(false);
                              }}
                              className={cn(
                                "w-full text-left px-4 py-2 text-[11px] font-bold transition-colors",
                                currentDate.getFullYear() === y 
                                  ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" 
                                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                              )}
                            >
                              {toBn(y)}
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button 
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all text-slate-400 hover:text-emerald-500 border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all text-slate-400 hover:text-emerald-500 border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days Header */}
          <div className="grid grid-cols-7 px-2 py-2 border-b border-slate-50 dark:border-slate-800/30">
            {BANGLA_DAYS.map(day => (
              <div key={day} className="text-center text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Cells */}
          <div className="grid grid-cols-7 p-2 gap-1">
            {calendarDays.map((day, idx) => {
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isSelected = isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);

              return (
                <motion.button 
                  key={idx} 
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "relative aspect-square rounded-full flex flex-col items-center justify-center transition-all duration-200",
                    !isCurrentMonth && "opacity-10 pointer-events-none",
                    isSelected 
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20 z-10" 
                      : isTodayDate 
                        ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-bold"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/50",
                  )}
                >
                  <span className={cn(
                    "text-xs font-black leading-none",
                    isSelected ? "text-white" : isTodayDate ? "text-amber-700 dark:text-amber-400" : "text-slate-700 dark:text-slate-300"
                  )}>
                    {toBn(day.getDate())}
                  </span>
                  
                  {/* Secondary Dates */}
                  <div className="flex gap-1 mt-0.5">
                    <span className={cn(
                      "text-[7px] font-bold",
                      isSelected ? "text-white/70" : "text-orange-500"
                    )}>
                      {getBanglaDay(day)}
                    </span>
                    <span className={cn(
                      "text-[7px] font-bold",
                      isSelected ? "text-white/70" : "text-blue-500"
                    )}>
                      {getHijriDay(day)}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Bottom Tip Card */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800/50 flex items-center gap-3">
          <div className="p-1.5 bg-white dark:bg-slate-800 rounded-lg text-amber-500">
            <Info className="w-3.5 h-3.5" />
          </div>
          <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
            চাঁদ দেখার ওপর ভিত্তি করে হিজরি তারিখ ১-২ দিন কমবেশি হতে পারে।
          </p>
        </div>
      </main>
    </div>
  );
}
