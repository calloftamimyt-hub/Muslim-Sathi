import React, { useState, useEffect } from 'react';
import { Compass, Moon, Sun, Palette, Type, Settings, Heart, Calculator, MapPin, BookOpen, HelpCircle, UserCheck, Plane, Tv, Headphones, Trophy, Book, ArrowLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { useLocation } from '@/hooks/useLocation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { useAdmin } from '@/hooks/useAdmin';

// Import new feature views
import { TasbihView } from './features/Tasbih';
import { ZakatView } from './features/Zakat';
import { EducationView } from './features/Education';
import { QuizView } from './features/Quiz';
import { QiblaView } from './features/Qibla';

export function More({ initialView = 'menu', onNavigate }: { initialView?: string, onNavigate?: (tab: string) => void }) {
  const [activeView, setActiveView] = useState<string>(initialView);
  const { language } = useLanguage();
  const { isAdmin } = useAdmin();

  const { latitude, longitude } = useLocation(language);

  useEffect(() => {
    setActiveView(initialView);
  }, [initialView]);



  const openMosqueMap = () => {
    const lat = latitude || 23.8103;
    const lng = longitude || 90.4125;
    const url = `https://www.google.com/maps/search/mosque/@${lat},${lng},16z`;
    window.open(url, '_blank');
  };

  // Routing
  if (activeView === 'qibla') return <QiblaView onBack={() => setActiveView('menu')} />;
  if (activeView === 'duas') return <DuasView onBack={() => setActiveView('menu')} />;
  if (activeView === 'settings') return <SettingsView onBack={() => setActiveView('menu')} />;
  if (activeView === 'ramadan') return <RamadanView onBack={() => setActiveView('menu')} />;
  if (activeView === 'tasbih') return <TasbihView onBack={() => setActiveView('menu')} />;
  if (activeView === 'zakat') return <ZakatView onBack={() => setActiveView('menu')} />;
  if (activeView === 'mosques') {
    openMosqueMap();
    setActiveView('menu');
    return null;
  }
  if (activeView === 'education') return <EducationView onBack={() => setActiveView('menu')} />;
  if (activeView === 'quiz') return <QuizView onBack={() => setActiveView('menu')} />;
  
  // Placeholders for remaining features
  if (['qa', 'learn_prayer', 'hajj', 'tv', 'audio', 'books'].includes(activeView)) {
    return <PlaceholderView title={getFeatureTitle(activeView)} onBack={() => setActiveView('menu')} />;
  }

  return (
    <div className={cn(
      "px-4 md:px-8 pb-24 max-w-3xl mx-auto space-y-8",
      Capacitor.isNativePlatform() ? "pt-12" : "pt-safe"
    )}>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">আরও ফিচার</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">আপনার প্রয়োজনীয় সকল ইসলামিক টুলস</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        <MenuGridItem icon={<MapPin className="w-6 h-6 text-primary" />} title="কাছাকাছি মসজিদ" onClick={openMosqueMap} />
        <MenuGridItem icon={<BookOpen className="w-6 h-6 text-indigo-500" />} title="ইসলামিক শিক্ষা" onClick={() => setActiveView('education')} />
        <MenuGridItem icon={<Calculator className="w-6 h-6 text-amber-500" />} title="যাকাত ক্যালকুলেটর" onClick={() => setActiveView('zakat')} />
        <MenuGridItem icon={<Compass className="w-6 h-6 text-teal-500" />} title="কিবলা কম্পাস" onClick={() => setActiveView('qibla')} />
        <MenuGridItem icon={<Heart className="w-6 h-6 text-rose-500" />} title="তাসবিহ কাউন্টার" onClick={() => setActiveView('tasbih')} />
        <MenuGridItem icon={<Moon className="w-6 h-6 text-purple-500" />} title="রমজান ক্যালেন্ডার" onClick={() => setActiveView('ramadan')} />
        <MenuGridItem icon={<HelpCircle className="w-6 h-6 text-blue-500" />} title="প্রশ্ন-উত্তর" onClick={() => setActiveView('qa')} />
        <MenuGridItem icon={<UserCheck className="w-6 h-6 text-cyan-500" />} title="নামাজ শিক্ষা" onClick={() => setActiveView('learn_prayer')} />
        <MenuGridItem icon={<Plane className="w-6 h-6 text-sky-500" />} title="হজ ও উমরাহ" onClick={() => setActiveView('hajj')} />
        <MenuGridItem icon={<Tv className="w-6 h-6 text-red-500" />} title="লাইভ টিভি" onClick={() => setActiveView('tv')} />
        <MenuGridItem icon={<Headphones className="w-6 h-6 text-orange-500" />} title="কুরআন অডিও" onClick={() => setActiveView('audio')} />
        <MenuGridItem icon={<Trophy className="w-6 h-6 text-yellow-500" />} title="ইসলামিক কুইজ" onClick={() => setActiveView('quiz')} />
        <MenuGridItem icon={<Book className="w-6 h-6 text-fuchsia-500" />} title="ইসলামিক বই" onClick={() => setActiveView('books')} />
        <MenuGridItem icon={<Settings className="w-6 h-6 text-slate-500" />} title="সেটিংস" onClick={() => setActiveView('settings')} />
        {isAdmin && (
          <MenuGridItem 
            icon={<ShieldCheck className="w-6 h-6 text-primary-dark" />} 
            title="এডমিন সেটিংস" 
            onClick={() => onNavigate?.('admin-settings')} 
          />
        )}
      </div>
    </div>
  );
}

function getFeatureTitle(id: string) {
  const titles: Record<string, string> = {
    qa: 'ইসলামিক প্রশ্ন-উত্তর',
    learn_prayer: 'নামাজ শিক্ষা',
    hajj: 'হজ ও উমরাহ গাইড',
    tv: 'ইসলামিক লাইভ টিভি',
    audio: 'কুরআন অডিও',
    books: 'ইসলামিক বই'
  };
  return titles[id] || 'ফিচার';
}

function MenuGridItem({ icon, title, onClick }: { icon: React.ReactNode, title: string, onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md hover:border-primary-light dark:hover:border-primary-dark transition-all text-center group h-32"
    >
      <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="font-medium text-sm text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors">{title}</h3>
    </motion.button>
  );
}

function PlaceholderView({ title, onBack }: { title: string, onBack: () => void }) {
  return (
    <div className="p-4 pt-safe md:p-8 max-w-3xl mx-auto space-y-6">
      <header className="flex items-center mb-8">
        <button onClick={onBack} className="p-2 mr-4 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
      </header>
      <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
        <div className="w-16 h-16 bg-primary-light/20 text-primary rounded-full flex items-center justify-center mb-4">
          <Settings className="w-8 h-8 animate-spin-slow" />
        </div>
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">কাজ চলছে</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto">এই ফিচারটি খুব শীঘ্রই যুক্ত করা হবে ইনশাআল্লাহ। আমাদের সাথেই থাকুন।</p>
      </div>
    </div>
  );
}

// Keeping existing views below (QiblaView, DuasView, SettingsView, RamadanView)
// ... (I will preserve the existing code for these views)


function RamadanView({ onBack }: { onBack: () => void }) {
  const { language } = useLanguage();
  const { latitude, longitude } = useLocation(language);
  const [ramadanData, setRamadanData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!latitude || !longitude) return;

    const fetchRamadanTimes = async () => {
      try {
        const year = new Date().getFullYear();
        // Fetching for the whole year to find Ramadan (Month 9 in Hijri)
        // For simplicity, we just fetch the current month and check if it's Ramadan
        // A real app would calculate the exact Gregorian dates for Ramadan
        const response = await fetch(`https://api.aladhan.com/v1/calendar/${year}/3?latitude=${latitude}&longitude=${longitude}&method=2`);
        const data = await response.json();
        
        // Filter for Ramadan days
        const ramadanDays = data.data.filter((d: any) => d.date.hijri.month.number === 9);
        setRamadanData(ramadanDays.length > 0 ? ramadanDays : null);
      } catch (error) {
        console.error("Error fetching Ramadan data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRamadanTimes();
  }, [latitude, longitude]);

  return (
    <div className="p-4 pt-safe md:p-8 max-w-3xl mx-auto space-y-6">
      <header className="flex items-center mb-8">
        <button onClick={onBack} className="p-2 mr-4 bg-slate-100 dark:bg-slate-800 rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">রমজান ক্যালেন্ডার</h1>
      </header>

      {loading ? (
        <div className="text-center py-10 text-slate-500">লোড হচ্ছে...</div>
      ) : !ramadanData ? (
        <div className="text-center py-10 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
          <Moon className="w-12 h-12 mx-auto text-slate-400 mb-4" />
          <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">বর্তমানে রমজান মাস চলছে না</h3>
          <p className="text-slate-500 mt-2">রমজান মাস শুরু হলে এখানে সেহরি ও ইফতারের সময়সূচি দেখা যাবে।</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-6 text-white mb-6">
            <h2 className="text-2xl font-bold mb-2">পবিত্র রমজান</h2>
            <p className="text-indigo-100">সেহরি ও ইফতারের সময়সূচি</p>
          </div>
          
          <div className="grid gap-3">
            {ramadanData.map((day: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
                <div>
                  <div className="font-bold text-indigo-600 dark:text-indigo-400">{day.date.hijri.day} রমজান</div>
                  <div className="text-xs text-slate-500">{day.date.gregorian.date}</div>
                </div>
                <div className="flex space-x-6 text-center">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">সেহরি শেষ</div>
                    <div className="font-semibold">{(day.timings.Imsak || '').split(' ')[0]}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">ইফতার</div>
                    <div className="font-semibold">{(day.timings.Maghrib || '').split(' ')[0]}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MenuCard({ icon, title, description, onClick }: { icon: React.ReactNode, title: string, description: string, onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex items-center justify-between p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm hover:shadow-md transition-all text-left w-full group"
    >
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors">{title}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
    </motion.button>
  );
}

function DuasView({ onBack }: { onBack: () => void }) {
  const duas = [
    { title: 'ঘুম থেকে ওঠার দোয়া', arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ', bangla: 'আলহামদু লিল্লাহিল্লাযী আহইয়ানা বা‘দা মা আমাতানা ওয়া ইলাইহিন নুশুর।' },
    { title: 'ঘুমানোর দোয়া', arabic: 'بِاسْمِكَ رَبِّي وَضَعْتُ جَنْبِي، وَبِكَ أَرْفَعُهُ', bangla: 'বিসমিকা রাব্বী ওয়াদ্বাতু জাম্বী, ওয়া বিকা আরফাউহু।' },
    { title: 'মসজিদে প্রবেশের দোয়া', arabic: 'اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ', bangla: 'আল্লাহুম্মাফতাহ লী আবওয়াবা রাহমাতিক।' },
    { title: 'মসজিদ থেকে বের হওয়ার দোয়া', arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ', bangla: 'আল্লাহুম্মা ইন্নী আসআলুক মিন ফাদলিক।' },
  ];

  return (
    <div className="p-4 pt-safe md:p-8 max-w-3xl mx-auto space-y-6">
      <header className="flex items-center mb-8">
        <button onClick={onBack} className="p-2 mr-4 bg-slate-100 dark:bg-slate-800 rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">দোয়া ও যিকির</h1>
      </header>

      <div className="space-y-4">
        {duas.map((dua, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <h3 className="font-semibold text-lg text-primary-dark dark:text-primary-light mb-4">{dua.title}</h3>
            <p className="font-arabic text-2xl leading-loose text-right text-slate-800 dark:text-slate-200 mb-4" dir="rtl">{dua.arabic}</p>
            <div className="h-px w-full bg-slate-100 dark:bg-slate-800 mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">{dua.bangla}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsView({ onBack }: { onBack: () => void }) {
  const { 
    themeMode, colorTheme, fontSize, arabicFont, normalFont,
    setThemeMode, setColorTheme, setFontSize, setArabicFont, setNormalFont 
  } = useTheme();

  const [azanEnabled, setAzanEnabled] = useState(() => localStorage.getItem('azanEnabled') !== 'false');
  const [prayerSettings, setPrayerSettings] = useState(() => {
    const saved = localStorage.getItem('prayerSettings');
    return saved ? JSON.parse(saved) : { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true };
  });
  const [silentMode, setSilentMode] = useState(() => localStorage.getItem('silentMode') === 'true');
  const [vibrateOnly, setVibrateOnly] = useState(() => localStorage.getItem('vibrateOnly') === 'true');

  useEffect(() => {
    localStorage.setItem('azanEnabled', String(azanEnabled));
    localStorage.setItem('prayerSettings', JSON.stringify(prayerSettings));
    localStorage.setItem('silentMode', String(silentMode));
    localStorage.setItem('vibrateOnly', String(vibrateOnly));
  }, [azanEnabled, prayerSettings, silentMode, vibrateOnly]);

  const togglePrayer = (id: string) => {
    setPrayerSettings((prev: any) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="p-4 pt-safe md:p-8 max-w-3xl mx-auto space-y-6">
      <header className="flex items-center mb-8">
        <button onClick={onBack} className="p-2 mr-4 bg-slate-100 dark:bg-slate-800 rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">সেটিংস</h1>
      </header>

      <div className="space-y-6">
        {/* Theme / Design Section */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Palette className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">থিম ও ডিজাইন</h3>
            </div>
            
            <div className="space-y-6">
              {/* Dark/Light Mode */}
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">ডার্ক / লাইট মোড</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Light', label: 'লাইট', icon: <Sun className="w-4 h-4" /> },
                    { id: 'Dark', label: 'ডার্ক', icon: <Moon className="w-4 h-4" /> },
                    { id: 'System', label: 'সিস্টেম', icon: <Settings className="w-4 h-4" /> }
                  ].map((mode) => (
                    <button 
                      key={mode.id}
                      onClick={() => setThemeMode(mode.id as any)}
                      className={cn(
                        "flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                        themeMode === mode.id 
                          ? "bg-primary text-white shadow-lg shadow-primary/20" 
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                      )}
                    >
                      {mode.icon}
                      <span>{mode.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* App Color Theme */}
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">অ্যাপ কালার থিম</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'Green', label: 'Green', color: '#10b981' },
                    { id: 'Blue', label: 'Blue', color: '#3b82f6' },
                    { id: 'Gold', label: 'Gold', color: '#f59e0b' },
                    { id: 'Dark Green', label: 'Dark Green', color: '#064e3b' }
                  ].map((theme) => (
                    <button 
                      key={theme.id}
                      onClick={() => setColorTheme(theme.id as any)}
                      className={cn(
                        "flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium border-2 transition-all",
                        colorTheme === theme.id 
                          ? "border-primary bg-primary/5 text-primary" 
                          : "border-transparent bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      )}
                    >
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.color }} />
                      <span className="truncate">{theme.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Style */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Type className="w-4 h-4 text-slate-400" />
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">ফন্ট স্টাইল</p>
                </div>
                
                <div className="space-y-4">
                  {/* Normal Font */}
                  <div>
                    <p className="text-xs text-slate-400 mb-2">সাধারণ ফন্ট (বাংলা/ইংরেজি)</p>
                    <div className="flex flex-wrap gap-2">
                      {['Bengali', 'Inter', 'Roboto'].map((font) => (
                        <button 
                          key={font}
                          onClick={() => setNormalFont(font as any)}
                          className={cn(
                            "px-4 py-2 rounded-xl text-sm transition-all",
                            normalFont === font 
                              ? "bg-primary text-white" 
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                          )}
                        >
                          {font}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Arabic Font */}
                  <div>
                    <p className="text-xs text-slate-400 mb-2">আরবি ফন্ট (কুরআনের জন্য)</p>
                    <div className="flex flex-wrap gap-2">
                      {['Amiri', 'Scheherazade', 'Traditional'].map((font) => (
                        <button 
                          key={font}
                          onClick={() => setArabicFont(font as any)}
                          className={cn(
                            "px-4 py-2 rounded-xl text-sm transition-all",
                            arabicFont === font 
                              ? "bg-primary text-white" 
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                          )}
                        >
                          {font}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font Size */}
                  <div>
                    <p className="text-xs text-slate-400 mb-2">ফন্ট সাইজ</p>
                    <div className="flex space-x-2">
                      {['Small', 'Medium', 'Large'].map((size) => (
                        <button 
                          key={size}
                          onClick={() => setFontSize(size as any)}
                          className={cn(
                            "flex-1 py-2 rounded-xl text-sm transition-all",
                            fontSize === size 
                              ? "bg-primary text-white" 
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                          )}
                        >
                          {size === 'Small' ? 'ছোট' : size === 'Medium' ? 'মাঝারি' : 'বড়'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <h3 className="font-semibold text-lg mb-4">নামাজ ও আজান সেটিংস</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-700 dark:text-slate-300">আজান নোটিফিকেশন</span>
                <button onClick={() => setAzanEnabled(!azanEnabled)} className={cn("w-12 h-6 rounded-full transition-colors", azanEnabled ? "bg-primary" : "bg-slate-300 dark:bg-slate-600")}>
                  <div className={cn("w-4 h-4 bg-white rounded-full transition-transform", azanEnabled ? "translate-x-7" : "translate-x-1")} />
                </button>
              </div>

              {azanEnabled && (
                <div className="space-y-2 pl-4 border-l-2 border-slate-100 dark:border-slate-800">
                  {['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map(prayer => (
                    <div key={prayer} className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400 capitalize">{prayer}</span>
                      <input type="checkbox" checked={prayerSettings[prayer]} onChange={() => togglePrayer(prayer)} className="accent-primary" />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-slate-700 dark:text-slate-300">সাইলেন্ট মোড</span>
                <button onClick={() => setSilentMode(!silentMode)} className={cn("w-12 h-6 rounded-full transition-colors", silentMode ? "bg-primary" : "bg-slate-300 dark:bg-slate-600")}>
                  <div className={cn("w-4 h-4 bg-white rounded-full transition-transform", silentMode ? "translate-x-7" : "translate-x-1")} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-700 dark:text-slate-300">শুধুমাত্র ভাইব্রেট</span>
                <button onClick={() => setVibrateOnly(!vibrateOnly)} className={cn("w-12 h-6 rounded-full transition-colors", vibrateOnly ? "bg-primary" : "bg-slate-300 dark:bg-slate-600")}>
                  <div className={cn("w-4 h-4 bg-white rounded-full transition-transform", vibrateOnly ? "translate-x-7" : "translate-x-1")} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
