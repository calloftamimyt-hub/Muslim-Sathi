import { Search, Share2, Copy, Check, BookmarkPlus, BookmarkCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { useFavorites } from '@/hooks/useFavorites';
import { cn } from '@/lib/utils';
import { HADITH_DATA, Hadith } from '@/data/hadith';

import { useLanguage } from '@/contexts/LanguageContext';

export function HadithView({ onBack }: { onBack: () => void }) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const { toggleFavorite, isFavorite } = useFavorites<Hadith>('favorite-hadiths');

  const filteredHadiths = HADITH_DATA.filter(hadith => 
    hadith.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    hadith.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    hadith.arabic?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopy = (hadith: Hadith) => {
    const text = `${hadith.title}\n\n${hadith.arabic ? hadith.arabic + '\n\n' : ''}${hadith.content}\n\n${t('source')}: ${hadith.reference || t('unknown')}`;
    navigator.clipboard.writeText(text);
    setCopiedId(hadith.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50 dark:bg-slate-950 pt-safe">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white dark:bg-slate-900 px-4 py-2 pb-4 border-b border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-black text-slate-800 dark:text-white">{t('hadith-sharif')}</h1>
            <div className="flex gap-2">
              {/* No back arrow in UI as per user request */}
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder={t('search-hadith')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary transition-all"
            />
          </div>
        </div>
      </header>

      {/* Hadith List */}
      <div className="flex-1 px-4 py-4 space-y-3 pb-8">
        {/* Intro Text */}
        {!searchQuery && (
          <div className="bg-primary-light/20 dark:bg-primary-dark/10 p-4 rounded-xl border border-primary-light/30 dark:border-primary-dark/20 mb-2">
            <p className="text-xs font-bold text-primary-dark dark:text-primary-light mb-1">{t('hadith-sharif')}</p>
            <p className="text-[11px] leading-relaxed text-primary dark:text-primary-light italic">
              {t('hadith-intro')}
            </p>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {filteredHadiths.map((hadith, idx) => (
            <motion.div
              key={hadith.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: idx * 0.02 }}
              className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="px-2.5 py-1 bg-primary-light/20 dark:bg-primary-dark/20 text-primary dark:text-primary-light rounded-lg text-[10px] font-bold uppercase tracking-wider">
                  {hadith.title}
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => toggleFavorite(hadith)}
                    className={cn(
                      "p-1.5 rounded-lg transition-colors",
                      isFavorite(hadith.id) ? "text-primary bg-primary-light/20 dark:bg-primary-dark/20" : "text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800"
                    )}
                  >
                    {isFavorite(hadith.id) ? <BookmarkCheck className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={() => handleCopy(hadith)}
                    className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    {copiedId === hadith.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {hadith.arabic && (
                  <p className="text-xl font-arabic text-right leading-loose text-slate-800 dark:text-slate-100" dir="rtl">
                    {hadith.arabic}
                  </p>
                )}
                
                <p className="text-base font-medium text-slate-700 dark:text-slate-200 leading-relaxed">
                  {hadith.content}
                </p>
                
                <div className="flex flex-col gap-1 pt-3 border-t border-slate-50 dark:border-slate-800">
                  {hadith.narrator && (
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      বর্ণনায়: <span className="text-primary dark:text-primary-light">{hadith.narrator}</span>
                    </p>
                  )}
                  {hadith.reference && (
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">
                      সূত্র: {hadith.reference}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredHadiths.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">কোনো হাদীস পাওয়া যায়নি</p>
          </div>
        )}
      </div>
    </div>
  );
}
