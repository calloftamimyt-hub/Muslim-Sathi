import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, List, Search, Headphones, Share2, Download, Repeat, Shuffle, Loader2, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { quranService, Surah } from '@/services/quranService';

interface AudioPlayerProps {
  onBack: () => void;
}

export function QuranAudio({ onBack }: AudioPlayerProps) {
  const { t, language } = useLanguage();
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSurahIndex, setCurrentSurahIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showList, setShowList] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  useEffect(() => {
    if (currentSurahIndex !== null) {
      const surahNumber = surahs[currentSurahIndex].number;
      // Using Alafasy recitation by default
      const audioUrl = `https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/${surahNumber}.mp3`;
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        if (isPlaying) {
          audioRef.current.play().catch(e => console.error("Playback failed:", e));
        }
      }
    }
  }, [currentSurahIndex]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        if (currentSurahIndex === null && surahs.length > 0) {
          setCurrentSurahIndex(0);
        }
        audioRef.current.play().catch(e => console.error("Playback failed:", e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    if (isRepeat) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    } else {
      handleNext();
    }
  };

  const handlePrev = () => {
    if (currentSurahIndex !== null) {
      const nextIndex = (currentSurahIndex - 1 + surahs.length) % surahs.length;
      setCurrentSurahIndex(nextIndex);
      setIsPlaying(true);
    }
  };

  const handleNext = () => {
    if (currentSurahIndex !== null) {
      let nextIndex;
      if (isShuffle) {
        nextIndex = Math.floor(Math.random() * surahs.length);
      } else {
        nextIndex = (currentSurahIndex + 1) % surahs.length;
      }
      setCurrentSurahIndex(nextIndex);
      setIsPlaying(true);
    }
  };

  const handleDownload = async () => {
    if (!currentSurah) return;
    
    setIsDownloading(true);
    const audioUrl = `https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/${currentSurah.number}.mp3`;
    const fileName = `Surah-${currentSurah.englishName}-${currentSurah.number}.mp3`;

    try {
      if (Capacitor.isNativePlatform()) {
        // Native Download using Filesystem
        const downloadResult = await Filesystem.downloadFile({
          url: audioUrl,
          path: fileName,
          directory: Directory.Documents,
        });
        
        alert(language === 'bn' ? 'ডাউনলোড সম্পন্ন হয়েছে! আপনি এটি আপনার ডকুমেন্টস ফোল্ডারে পাবেন।' : 'Download complete! You can find it in your Documents folder.');
      } else {
        // Web Download Logic
        const response = await fetch(audioUrl);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      }
    } catch (err) {
      console.error('Download error:', err);
      // Fallback to browser download if everything fails
      window.open(audioUrl, '_blank');
    } finally {
      setIsDownloading(null);
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!currentSurah) return;
    
    setIsSharing(true);
    const audioUrl = `https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/${currentSurah.number}.mp3`;
    const shareText = `পবিত্র কুরআন তিলাওয়াত শুনুন:\nসূরা: ${currentSurah.englishName} (${currentSurah.name})\nতিলাওয়াতকারী: মিশারি রাশিদ আল-আফাসি`;

    try {
      if (Capacitor.isNativePlatform()) {
        await Share.share({
          title: `সূরা ${currentSurah.englishName}`,
          text: shareText,
          url: audioUrl,
          dialogTitle: 'শেয়ার করুন',
        });
      } else if (navigator.share) {
        await navigator.share({
          title: `সূরা ${currentSurah.englishName}`,
          text: shareText,
          url: audioUrl,
        });
      } else {
        // Fallback for browsers that don't support Web Share API
        await navigator.clipboard.writeText(`${shareText}\n${audioUrl}`);
        alert(language === 'bn' ? 'লিঙ্ক কপি করা হয়েছে!' : 'Link copied to clipboard!');
      }
    } catch (err) {
      console.error('Share error:', err);
    } finally {
      setIsSharing(false);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const filteredSurahs = surahs.filter(s => 
    s.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.name.includes(searchQuery)
  );

  const currentSurah = currentSurahIndex !== null ? surahs[currentSurahIndex] : null;

  if (loading) {
    return (
      <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
        {/* Skeleton Header */}
        <header className="px-4 pt-safe pb-4 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center space-x-3">
            <div className="space-y-2">
              <div className="w-32 h-6 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"></div>
              <div className="w-16 h-3 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse"></div>
        </header>

        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden relative">
          {/* Skeleton List */}
          <div className="w-full md:w-80 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 z-20">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-full h-10 bg-slate-50 dark:bg-slate-800 rounded-xl animate-pulse"></div>
            </div>
            <div className="flex-1 p-2 space-y-2">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="flex items-center justify-between p-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse"></div>
                    <div className="space-y-2">
                      <div className="w-24 h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"></div>
                      <div className="w-16 h-3 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"></div>
                    </div>
                  </div>
                  <div className="w-12 h-6 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Skeleton Player */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 bg-slate-50 dark:bg-slate-950">
            <div className="w-full max-w-md flex flex-col items-center space-y-8">
              <div className="w-64 h-64 md:w-80 md:h-80 rounded-[40px] bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
              <div className="w-full space-y-4 text-center">
                <div className="w-48 h-8 bg-slate-200 dark:bg-slate-800 rounded mx-auto animate-pulse"></div>
                <div className="w-32 h-4 bg-slate-200 dark:bg-slate-800 rounded mx-auto animate-pulse"></div>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
              <div className="flex items-center space-x-8">
                <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
                <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
                <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      {/* Header */}
      <header className="px-4 pt-safe pb-4 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
        <div className="flex items-center space-x-3">
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white leading-tight">কুরআন অডিও</h1>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">১১৪টি সূরা</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setShowList(!showList)}
            className={cn("p-2 rounded-full transition-colors", showList ? "bg-orange-100 text-orange-600" : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300")}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden relative">
        {/* Surah List Section */}
        <AnimatePresence mode="wait">
          {showList && (
            <motion.div 
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              className="w-full md:w-80 flex flex-col bg-slate-50 dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 z-20 absolute inset-0 md:relative md:inset-auto h-full"
            >
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="সূরা খুঁজুন..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-orange-500/50"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar scroll-smooth touch-pan-y overscroll-contain">
                {filteredSurahs.map((surah) => {
                  const actualIndex = surahs.findIndex(s => s.number === surah.number);
                  const isActive = currentSurahIndex === actualIndex;
                  return (
                    <button
                      key={surah.number}
                      onClick={() => {
                        setCurrentSurahIndex(actualIndex);
                        setIsPlaying(true);
                        if (window.innerWidth < 768) setShowList(false);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between p-3 rounded-xl transition-all group",
                        isActive 
                          ? "bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-800" 
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors",
                          isActive ? "bg-orange-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                        )}>
                          {surah.number}
                        </div>
                        <div className="text-left">
                          <h4 className={cn("text-sm font-bold transition-colors", isActive ? "text-orange-600 dark:text-orange-400" : "text-slate-700 dark:text-slate-300")}>
                            {surah.englishName}
                          </h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">{surah.englishNameTranslation}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {isActive && isPlaying && (
                          <div className="flex items-end space-x-0.5 h-3">
                            <div className="w-0.5 bg-orange-500 animate-[music-bar_0.6s_ease-in-out_infinite]"></div>
                            <div className="w-0.5 bg-orange-500 animate-[music-bar_0.8s_ease-in-out_infinite]"></div>
                            <div className="w-0.5 bg-orange-500 animate-[music-bar_0.5s_ease-in-out_infinite]"></div>
                          </div>
                        )}
                        <span className="font-arabic text-lg text-slate-400 dark:text-slate-600">{surah.name}</span>
                      </div>
                    </button>
                  );
                })}
                {/* Removed extra padding at bottom that appeared as a white header */}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Player Section */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 bg-slate-50 dark:bg-slate-950 relative overflow-y-auto h-full">
          <div className="w-full max-w-md flex flex-col items-center space-y-8">
            {/* Surah Artwork/Icon */}
            <motion.div 
              key={currentSurahIndex}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative w-64 h-64 md:w-80 md:h-80"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-600 rounded-[40px] shadow-2xl transform rotate-6 opacity-20"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-orange-700 rounded-[40px] shadow-2xl flex flex-col items-center justify-center text-white p-8 overflow-hidden">
                <Headphones className="w-16 h-16 mb-6 opacity-20 absolute top-4 right-4" />
                <div className="text-center z-10">
                  <h2 className="text-4xl md:text-5xl font-arabic mb-4">{currentSurah?.name || 'আল কুরআন'}</h2>
                  <h3 className="text-xl md:text-2xl font-bold mb-2">{currentSurah?.englishName || 'সূরা নির্বাচন করুন'}</h3>
                  <p className="text-orange-100/80 text-sm">{currentSurah?.englishNameTranslation || 'পবিত্র কুরআন তিলাওয়াত'}</p>
                </div>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20">
                  <motion.div 
                    className="h-full bg-white"
                    initial={{ width: 0 }}
                    animate={{ width: `${(currentTime / duration) * 100}%` }}
                  />
                </div>
              </div>
            </motion.div>

            {/* Surah Info */}
            <div className="text-center w-full">
              <div className="flex items-center justify-between mb-2">
                <button 
                  onClick={handleShare}
                  disabled={isSharing || !currentSurah}
                  className="p-2 text-slate-400 hover:text-orange-500 transition-colors disabled:opacity-50"
                >
                  {isSharing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Share2 className="w-5 h-5" />}
                </button>
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{currentSurah?.englishName || 'কুরআন অডিও'}</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">মিশারি রাশিদ আল-আফাসি</p>
                </div>
                <button 
                  onClick={handleDownload}
                  disabled={isDownloading || !currentSurah}
                  className="p-2 text-slate-400 hover:text-orange-500 transition-colors disabled:opacity-50"
                >
                  {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full space-y-2">
              <input 
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
              <div className="flex justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-widest">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between w-full px-4">
              <button 
                onClick={() => setIsShuffle(!isShuffle)}
                className={cn("p-2 transition-colors", isShuffle ? "text-orange-500" : "text-slate-400 hover:text-slate-600")}
              >
                <Shuffle className="w-5 h-5" />
              </button>
              
              <div className="flex items-center space-x-6">
                <button 
                  onClick={handlePrev}
                  className="p-3 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-all active:scale-90"
                >
                  <SkipBack className="w-7 h-7 fill-current" />
                </button>
                
                <button 
                  onClick={togglePlay}
                  className="w-20 h-20 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-orange-500/30 transition-all active:scale-95 transform hover:scale-105"
                >
                  {isPlaying ? <Pause className="w-10 h-10 fill-current" /> : <Play className="w-10 h-10 fill-current ml-1" />}
                </button>
                
                <button 
                  onClick={handleNext}
                  className="p-3 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-all active:scale-90"
                >
                  <SkipForward className="w-7 h-7 fill-current" />
                </button>
              </div>

              <button 
                onClick={() => setIsRepeat(!isRepeat)}
                className={cn("p-2 transition-colors", isRepeat ? "text-orange-500" : "text-slate-400 hover:text-slate-600")}
              >
                <Repeat className="w-5 h-5" />
              </button>
            </div>

            {/* Volume Control */}
            <div className="flex items-center space-x-4 w-full max-w-[200px] opacity-60 hover:opacity-100 transition-opacity">
              <button onClick={() => setIsMuted(!isMuted)}>
                <Volume2 className="w-4 h-4 text-slate-500" />
              </button>
              <input 
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setVolume(v);
                  if (audioRef.current) audioRef.current.volume = v;
                  if (v > 0) setIsMuted(false);
                }}
                className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-400"
              />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes music-bar {
          0%, 100% { height: 4px; }
          50% { height: 12px; }
        }
      `}</style>
    </div>
  );
}
