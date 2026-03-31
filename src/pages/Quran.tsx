import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, BookOpen, ChevronRight, Bookmark, History, Palette, X, Check, BookmarkCheck, ArrowLeft, Download, CloudOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '@/contexts/ThemeContext';
import { useFavorites } from '@/hooks/useFavorites';
import { useLanguage } from '@/contexts/LanguageContext';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { quranService, Surah, SurahDetail } from '@/services/quranService';

type QuranTheme = 'emerald' | 'royal' | 'purple' | 'gold' | 'midnight';

const THEMES: Record<QuranTheme, { name: string, color: string, bg: string, border: string, text: string, hoverText: string, groupHoverText: string, activeBorder: string, activeBg: string, activeBgDark: string, borderLeft: string }> = {
  emerald: { name: 'Emerald', color: 'bg-emerald-600', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-600', hoverText: 'hover:text-emerald-600', groupHoverText: 'group-hover:text-emerald-600', activeBorder: 'border-emerald-500', activeBg: 'bg-emerald-50', activeBgDark: 'dark:bg-emerald-900/20', borderLeft: 'border-emerald-500/20' },
  royal: { name: 'Royal Blue', color: 'bg-blue-600', bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-600', hoverText: 'hover:text-blue-600', groupHoverText: 'group-hover:text-blue-600', activeBorder: 'border-blue-500', activeBg: 'bg-blue-50', activeBgDark: 'dark:bg-blue-900/20', borderLeft: 'border-blue-500/20' },
  purple: { name: 'Purple', color: 'bg-purple-600', bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-600', hoverText: 'hover:text-purple-600', groupHoverText: 'group-hover:text-purple-600', activeBorder: 'border-purple-500', activeBg: 'bg-purple-50', activeBgDark: 'dark:bg-purple-900/20', borderLeft: 'border-purple-500/20' },
  gold: { name: 'Golden', color: 'bg-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-600', hoverText: 'hover:text-amber-600', groupHoverText: 'group-hover:text-amber-600', activeBorder: 'border-amber-500', activeBg: 'bg-amber-50', activeBgDark: 'dark:bg-amber-900/20', borderLeft: 'border-amber-500/20' },
  midnight: { name: 'Midnight', color: 'bg-slate-800', bg: 'bg-slate-800/10', border: 'border-slate-800/20', text: 'text-slate-800', hoverText: 'hover:text-slate-800', groupHoverText: 'group-hover:text-slate-800', activeBorder: 'border-slate-800', activeBg: 'bg-slate-100', activeBgDark: 'dark:bg-slate-800/40', borderLeft: 'border-slate-800/20' },
};

export function Quran() {
  const { t, language } = useLanguage();
  const { colorTheme, fontSize, arabicFont, normalFont } = useTheme();
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  const getInitialTheme = (): QuranTheme => {
    const saved = localStorage.getItem('quran-theme');
    if (saved) return saved as QuranTheme;
    
    switch (colorTheme) {
      case 'Blue': return 'royal';
      case 'Gold': return 'gold';
      case 'Dark Green': return 'emerald';
      case 'Green': default: return 'emerald';
    }
  };

  const [theme, setTheme] = useState<QuranTheme>(getInitialTheme);
  const [showThemeModal, setShowThemeModal] = useState(false);

  useEffect(() => {
    localStorage.setItem('quran-theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const fetchSurahs = async () => {
      try {
        const data = await quranService.getSurahs();
        setSurahs(data);
      } catch (error) {
        console.error("Error fetching surahs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSurahs();
  }, []);

  const filteredSurahs = surahs.filter(s => 
    s.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.name.includes(searchQuery)
  );

  if (loading) {
    return (
      <div className="flex flex-col bg-white dark:bg-slate-950 min-h-full">
        {/* Skeleton Header */}
        <div className={cn(
          "sticky top-0 z-50 flex items-center justify-between pb-3 px-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800",
          Capacitor.isNativePlatform() ? "pt-12" : "pt-3"
        )}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse"></div>
            <div className="space-y-2">
              <div className="w-24 h-5 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"></div>
              <div className="w-12 h-3 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="flex space-x-2">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse"></div>
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse"></div>
          </div>
        </div>

        {/* Skeleton Hero */}
        <div className="h-32 mx-4 mt-4 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse"></div>

        {/* Skeleton Search */}
        <div className="px-4 py-4">
          <div className="w-full h-10 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse"></div>
        </div>

        {/* Skeleton List */}
        <div className="flex-1 px-4 space-y-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="flex items-center justify-between py-4 border-b border-slate-50 dark:border-slate-900">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse"></div>
                <div className="space-y-2">
                  <div className="w-32 h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"></div>
                  <div className="w-20 h-3 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="w-16 h-6 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (selectedSurah) {
    return <SurahReader surahNumber={selectedSurah} onBack={() => setSelectedSurah(null)} theme={theme} />;
  }

  return (
    <div className="flex flex-col bg-white dark:bg-slate-950 min-h-full pb-8">
      {/* Premium Header - More Distinct */}
      <div className={cn(
        "sticky top-0 z-50 flex items-center justify-between pb-3 px-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-100 dark:border-slate-800 shadow-sm",
        Capacitor.isNativePlatform() ? "pt-12" : "pt-3"
      )}>
        <div className="flex items-center space-x-3">
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-sm", THEMES[theme].color)}>
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white leading-tight">{t('quran')}</h1>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">114 {t('surahs')}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          {isOffline && (
            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-full">
              <CloudOff className="w-5 h-5" />
            </div>
          )}
          <button 
            onClick={() => setShowThemeModal(true)}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full transition-all border border-slate-100 dark:border-slate-700 shadow-sm group"
          >
            <Palette className={cn("w-5 h-5 transition-colors", THEMES[theme].text)} />
          </button>
        </div>
      </div>

      {/* Theme Selection Modal */}
      <AnimatePresence>
        {showThemeModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-slate-900 rounded-lg w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white">{t('premium-theme')}</h3>
                  <button onClick={() => setShowThemeModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>
                <div className="space-y-3">
                  {(Object.keys(THEMES) as QuranTheme[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setTheme(t);
                        setShowThemeModal(false);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between p-4 rounded-lg transition-all border-2",
                        theme === t 
                          ? `${THEMES[t].activeBorder} ${THEMES[t].activeBg} ${THEMES[t].activeBgDark}` 
                          : "border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700"
                      )}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={cn("w-10 h-10 rounded-full shadow-inner", THEMES[t].color)}></div>
                        <span className="font-bold text-slate-700 dark:text-slate-200">{THEMES[t].name}</span>
                      </div>
                      {theme === t && <Check className={cn("w-5 h-5", THEMES[t].text)} />}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Slim Hero Section */}
      <div className={cn("relative overflow-hidden p-8 mx-4 mt-4 rounded-lg text-white shadow-lg", THEMES[theme].color)}>
        <div className="absolute top-0 right-0 opacity-20 transform translate-x-1/4 -translate-y-1/4">
          <BookOpen className="w-40 h-40" />
        </div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">{t('holy-quran')}</h1>
          <p className="text-white/90 text-sm font-medium">
            {t('quran-quote')}
          </p>
        </div>
      </div>

      {/* Search Bar - Slimmer */}
      <div className="relative px-4 py-2">
        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-slate-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 placeholder-slate-400 focus:outline-none focus:ring-0 transition-all text-sm"
          placeholder={t('search-surah')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Surah List - Slimmer Grid */}
      <div className="flex-1 overflow-y-auto">
        {filteredSurahs.map((surah, index) => (
          <SurahListItem 
            key={surah.number} 
            surah={surah} 
            index={index} 
            theme={theme} 
            language={language}
            onClick={() => setSelectedSurah(surah.number)} 
          />
        ))}
      </div>
    </div>
  );
}

const SurahListItem: React.FC<{ surah: Surah, index: number, theme: QuranTheme, language: string, onClick: () => void }> = ({ surah, index, theme, language, onClick }) => {
  const { t } = useLanguage();
  const [isCached, setIsCached] = useState(false);

  useEffect(() => {
    quranService.isSurahCached(surah.number, language).then(setIsCached);
  }, [surah.number, language]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.01 }}
      onClick={onClick}
      className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group"
    >
      <div className="flex items-center space-x-3">
        <div className={cn("w-8 h-8 flex items-center justify-center shrink-0 rounded-lg font-bold text-xs transition-colors", THEMES[theme].bg, THEMES[theme].text)}>
          {surah.number}
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h3 className={cn("font-bold text-slate-800 dark:text-slate-200 text-sm transition-colors", THEMES[theme].groupHoverText)}>
              {surah.englishName}
            </h3>
            {isCached && <div className="w-1 h-1 rounded-full bg-emerald-500" title="Available offline"></div>}
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            {surah.revelationType === 'Meccan' ? t('meccan') : t('medinan')} • {surah.numberOfAyahs} {t('ayahs')}
          </p>
        </div>
      </div>
      <span className={cn("font-arabic text-xl transition-colors", THEMES[theme].text)}>{surah.name}</span>
    </motion.div>
  );
}

function SurahReader({ surahNumber, onBack, theme }: { surahNumber: number, onBack: () => void, theme: QuranTheme }) {
  const { t, language } = useLanguage();
  const [ayahs, setAyahs] = useState<any[]>([]);
  const [translation, setTranslation] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [surahInfo, setSurahInfo] = useState<any>(null);
  const { toggleFavorite, isFavorite } = useFavorites<any>('bookmarked-ayats');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSurah = async () => {
      try {
        const detail = await quranService.getSurahDetail(surahNumber, language);
        if (detail) {
          setSurahInfo(detail);
          setAyahs(detail.ayahs);
          setTranslation(detail.translation || []);
        } else {
          setError("এই সূরাটি অফলাইনে নেই এবং আপনার ইন্টারনেট সংযোগও নেই।");
        }
      } catch (error) {
        console.error("Error fetching surah details:", error);
        setError("সূরাটি লোড করতে সমস্যা হয়েছে।");
      } finally {
        setLoading(false);
      }
    };

    fetchSurah();
  }, [surahNumber, language]);

  useEffect(() => {
    // Use popstate to handle back button on all platforms
    const handlePopState = () => {
      onBack();
    };
    window.history.pushState({ surah: surahNumber }, '', '');
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []); // Empty dependency array ensures this only runs once on mount

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-950 min-h-full">
        {/* Skeleton Header */}
        <header className={cn(
          "sticky top-0 z-30 px-4 pb-3 flex items-center justify-between bg-slate-100 dark:bg-slate-800 animate-pulse", 
          Capacitor.isNativePlatform() ? "pt-12" : "pt-3"
        )}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20"></div>
            <div className="space-y-1">
              <div className="w-24 h-4 bg-white/20 rounded"></div>
              <div className="w-12 h-2 bg-white/20 rounded"></div>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8 pt-8">
          {/* Skeleton Surah Info */}
          <div className="flex flex-col items-center space-y-4">
            <div className="w-48 h-8 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"></div>
            <div className="w-32 h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"></div>
          </div>

          {/* Skeleton Bismillah */}
          <div className="py-8 flex justify-center">
            <div className="w-64 h-12 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"></div>
          </div>

          {/* Skeleton Ayahs */}
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-4">
              <div className="flex justify-end">
                <div className="w-3/4 h-12 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse"></div>
              </div>
              <div className="w-full h-16 bg-slate-50 dark:bg-slate-900 rounded-lg animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full bg-white dark:bg-slate-950 p-8 text-center">
        <CloudOff className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">অফলাইন</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">{error}</p>
        <button 
          onClick={onBack}
          className={cn("px-6 py-2 rounded-full text-white font-bold", THEMES[theme].color)}
        >
          ফিরে যান
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-950 min-h-full pb-8">
      {/* Immersive Header */}
      <header className={cn(
        "sticky top-0 z-30 backdrop-blur-md px-4 pb-3 flex items-center justify-between text-white shadow-lg transition-colors duration-500", 
        THEMES[theme].color,
        Capacitor.isNativePlatform() ? "pt-12" : "pt-3"
      )}>
        <div className="flex items-center gap-2">
          <div className="text-left">
            <h2 className="text-base font-bold leading-tight">{surahInfo?.englishName}</h2>
            <p className="text-[10px] opacity-80">{surahInfo?.name}</p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Surah Info Header - All in one line */}
        <div className="py-4 text-center border-b border-slate-100 dark:border-slate-800/50 mb-2">
          <h1 className={cn("text-xl font-bold mb-0.5", THEMES[theme].text)}>{surahInfo?.englishName} ({surahInfo?.name})</h1>
          <div className="flex items-center justify-center space-x-2 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            <span>{surahInfo?.revelationType === 'Meccan' ? t('meccan') : t('medinan')}</span>
            <span className="w-0.5 h-0.5 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
            <span>{surahInfo?.numberOfAyahs} {t('ayahs')}</span>
            <span className="w-0.5 h-0.5 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
            <span>{surahInfo?.englishNameTranslation}</span>
          </div>
        </div>

        {/* Bismillah Section - Centered */}
        {surahNumber !== 1 && surahNumber !== 9 && (
          <div className="py-8 text-center mb-4">
            <h3 className="font-arabic text-3xl sm:text-4xl text-slate-800 dark:text-slate-200">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </h3>
          </div>
        )}

        {/* Ayah List - Extremely Compact */}
        <div className="space-y-1 pb-12">
          {ayahs.map((ayah, index) => (
            <div key={ayah.number} className={cn("py-2 px-2 sm:px-4 rounded-lg transition-colors", `hover:${THEMES[theme].bg}`)}>
              <div className="flex flex-col space-y-1">
                {/* Arabic Text & Number in one row for better flow */}
                <div className="flex items-start justify-end space-x-4">
                  <div className="flex flex-col items-start gap-2">
                    <button 
                      onClick={() => {
                        const ayahId = `${surahNumber}:${ayah.numberInSurah}`;
                        toggleFavorite({
                          id: ayahId,
                          surahNumber,
                          surahName: surahInfo?.englishName,
                          ayahNumber: ayah.numberInSurah,
                          arabic: ayah.text,
                          translation: translation[index]?.text
                        });
                      }}
                      className={cn("p-1.5 rounded-full transition-colors", isFavorite(`${surahNumber}:${ayah.numberInSurah}`) ? cn(THEMES[theme].text, THEMES[theme].activeBg, THEMES[theme].activeBgDark) : cn("text-slate-300", THEMES[theme].hoverText))}
                    >
                      {isFavorite(`${surahNumber}:${ayah.numberInSurah}`) ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="font-arabic text-2xl sm:text-3xl leading-[1.6] text-right text-slate-800 dark:text-slate-100 flex-1" dir="rtl">
                    {ayah.numberInSurah === 1 && surahNumber !== 1 && surahNumber !== 9 
                      ? ayah.text.replace(/^(بِسْم|بِسۡم)[\s\S]*?(الرَّحِيم|ٱلرَّحِيم|الرَّحِیم|ٱلرَّحِیم)\s*/, '').trim() 
                      : ayah.text} 
                    <span className={cn("inline-flex items-center justify-center w-6 h-6 rounded-full border text-[10px] font-bold mr-2 align-middle", THEMES[theme].border, THEMES[theme].text)}>
                      {ayah.numberInSurah}
                    </span>
                  </p>
                </div>

                {/* Translation - Very close to Arabic */}
                <p className={cn(
                  "text-slate-600 dark:text-slate-400 leading-relaxed pl-2 border-l-2", 
                  THEMES[theme].borderLeft
                )}>
                  {translation[index]?.text}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Info */}
        <div className="py-8 text-center border-t border-slate-100 dark:border-slate-800">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Sadaqallahul Azim</p>
        </div>
      </div>
    </div>
  );
}
