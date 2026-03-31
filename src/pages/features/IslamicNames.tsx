import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Search, Users, Baby, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface NameEntry {
  name: string;
  meaning: string;
  gender: 'boy' | 'girl';
}

const NAMES_DATA: NameEntry[] = [
  // Boys
  { name: 'আবদুল্লাহ', meaning: 'আল্লাহর বান্দা', gender: 'boy' },
  { name: 'আবদুর রহমান', meaning: 'দয়ালু আল্লাহর বান্দা', gender: 'boy' },
  { name: 'আবদুর রহিম', meaning: 'পরম করুণাময়ের বান্দা', gender: 'boy' },
  { name: 'মুহাম্মদ', meaning: 'প্রশংসিত', gender: 'boy' },
  { name: 'আহমদ', meaning: 'অধিক প্রশংসাকারী', gender: 'boy' },
  { name: 'আলী', meaning: 'মহান, উচ্চ মর্যাদার', gender: 'boy' },
  { name: 'হাসান', meaning: 'সুন্দর, উত্তম', gender: 'boy' },
  { name: 'হুসাইন', meaning: 'ছোট সুন্দর', gender: 'boy' },
  { name: 'উমর', meaning: 'দীর্ঘ জীবন লাভকারী', gender: 'boy' },
  { name: 'উসমান', meaning: 'জ্ঞানী, বুদ্ধিমান', gender: 'boy' },
  { name: 'আবু বকর', meaning: 'প্রথম খলিফার নাম', gender: 'boy' },
  { name: 'সালমান', meaning: 'নিরাপদ, শান্তিপ্রিয়', gender: 'boy' },
  { name: 'সাঈদ', meaning: 'সৌভাগ্যবান', gender: 'boy' },
  { name: 'সাদ', meaning: 'সুখী', gender: 'boy' },
  { name: 'হামজা', meaning: ' শক্তিশালী, সাহসী', gender: 'boy' },
  { name: 'ইয়াসিন', meaning: 'কুরআনের একটি সূরার নাম', gender: 'boy' },
  { name: 'তারিক', meaning: 'রাত্রিকালীন আগন্তুক', gender: 'boy' },
  { name: 'ইমরান', meaning: 'উন্নত, সমৃদ্ধ', gender: 'boy' },
  { name: 'জামিল', meaning: 'সুন্দর', gender: 'boy' },
  { name: 'কামাল', meaning: 'পরিপূর্ণতা', gender: 'boy' },
  { name: 'ফয়সাল', meaning: 'সিদ্ধান্তদাতা', gender: 'boy' },
  { name: 'রাশেদ', meaning: 'সৎপথপ্রাপ্ত', gender: 'boy' },
  { name: 'রাশিদ', meaning: 'সঠিক পথপ্রদর্শক', gender: 'boy' },
  { name: 'মাহির', meaning: 'দক্ষ, পারদর্শী', gender: 'boy' },
  { name: 'নাঈম', meaning: 'সুখ-শান্তিতে থাকা', gender: 'boy' },
  { name: 'নাবিল', meaning: 'ভদ্র, মহৎ', gender: 'boy' },
  { name: 'তাহমিদ', meaning: 'আল্লাহর প্রশংসা করা', gender: 'boy' },
  { name: 'তাহসিন', meaning: 'সুন্দর করা', gender: 'boy' },
  { name: 'তাহির', meaning: 'পবিত্র', gender: 'boy' },
  { name: 'জুবায়ের', meaning: 'সাহসী', gender: 'boy' },
  { name: 'জাকারিয়া', meaning: 'নবীর নাম', gender: 'boy' },
  { name: 'ইব্রাহিম', meaning: 'নবীর নাম', gender: 'boy' },
  { name: 'ইসমাইল', meaning: 'আল্লাহর শোনা', gender: 'boy' },
  { name: 'ইসহাক', meaning: 'হাসি', gender: 'boy' },
  { name: 'ইউসুফ', meaning: 'নবীর নাম', gender: 'boy' },
  { name: 'ইয়াহইয়া', meaning: 'জীবিতকারী', gender: 'boy' },
  { name: 'মুসা', meaning: 'নবীর নাম', gender: 'boy' },
  { name: 'হারুন', meaning: 'নবীর নাম', gender: 'boy' },
  { name: 'দাউদ', meaning: 'প্রিয়', gender: 'boy' },
  { name: 'সুলাইমান', meaning: 'শান্তির মানুষ', gender: 'boy' },
  { name: 'আদম', meaning: 'প্রথম মানুষ', gender: 'boy' },
  { name: 'নুহ', meaning: 'নবীর নাম', gender: 'boy' },
  { name: 'আইয়ুব', meaning: 'ধৈর্যশীল নবী', gender: 'boy' },
  { name: 'লুত', meaning: 'নবীর নাম', gender: 'boy' },
  { name: 'শোয়াইব', meaning: 'নবীর নাম', gender: 'boy' },
  { name: 'ইদ্রিস', meaning: 'শিক্ষিত', gender: 'boy' },
  { name: 'বিলাল', meaning: 'প্রথম মুয়াজ্জিনের নাম', gender: 'boy' },
  { name: 'খালিদ', meaning: 'চিরস্থায়ী', gender: 'boy' },
  { name: 'ওয়ালিদ', meaning: 'নভজাতক', gender: 'boy' },
  { name: 'মারওয়ান', meaning: 'শক্তিশালী পাথর', gender: 'boy' },
  { name: 'মুয়াজ', meaning: 'আশ্রয়প্রাপ্ত', gender: 'boy' },
  { name: 'মুস্তাফা', meaning: 'নির্বাচিত', gender: 'boy' },
  { name: 'মুরসালিন', meaning: 'প্রেরিত', gender: 'boy' },
  { name: 'মুনির', meaning: 'আলোকিত', gender: 'boy' },
  { name: 'মিজান', meaning: 'ভারসাম্য', gender: 'boy' },
  { name: 'মাহমুদ', meaning: 'প্রশংসিত', gender: 'boy' },
  { name: 'মাজিদ', meaning: 'সম্মানিত', gender: 'boy' },
  { name: 'মাকসুদ', meaning: 'উদ্দেশ্য', gender: 'boy' },
  { name: 'মাসুদ', meaning: 'সুখী', gender: 'boy' },
  { name: 'মুজাহিদ', meaning: 'সংগ্রামকারী', gender: 'boy' },
  { name: 'মুকিত', meaning: 'রিজিকদাতা', gender: 'boy' },
  { name: 'মুকিম', meaning: 'স্থায়ী', gender: 'boy' },
  { name: 'মুকতার', meaning: 'নির্বাচিত', gender: 'boy' },
  { name: 'মুকাররম', meaning: 'সম্মানিত', gender: 'boy' },
  { name: 'মুনতাসির', meaning: 'বিজয়ী', gender: 'boy' },
  { name: 'মুনিরুল', meaning: 'আলোর অধিকারী', gender: 'boy' },
  { name: 'রাফি', meaning: 'উচ্চ মর্যাদাসম্পন্ন', gender: 'boy' },
  { name: 'রিয়াদ', meaning: 'বাগান', gender: 'boy' },
  { name: 'রিজওয়ান', meaning: 'সন্তুষ্টি', gender: 'boy' },
  { name: 'রিয়াজ', meaning: 'অনুশীলন', gender: 'boy' },
  { name: 'রুহান', meaning: 'আধ্যাত্মিক', gender: 'boy' },
  { name: 'সাব্বির', meaning: 'ধৈর্যশীল', gender: 'boy' },
  { name: 'সাবির', meaning: 'ধৈর্যধারী', gender: 'boy' },
  { name: 'সাকিব', meaning: 'উজ্জ্বল নক্ষত্র', gender: 'boy' },
  { name: 'সাকিল', meaning: 'ভারী, গম্ভীর', gender: 'boy' },
  { name: 'সালেহ', meaning: 'সৎ', gender: 'boy' },
  { name: 'সালেহীন', meaning: 'নেককারদের দল', gender: 'boy' },
  { name: 'সায়েম', meaning: 'রোজাদার', gender: 'boy' },
  { name: 'সাইফ', meaning: 'তরবারি', gender: 'boy' },
  { name: 'সাইফুল', meaning: 'তরবারির মতো শক্তিশালী', gender: 'boy' },
  { name: 'সাফওয়ান', meaning: 'স্বচ্ছ পাথর', gender: 'boy' },
  { name: 'সাফি', meaning: 'বিশুদ্ধ', gender: 'boy' },
  { name: 'সাফিউল্লাহ', meaning: 'আল্লাহর নির্বাচিত', gender: 'boy' },
  { name: 'সামি', meaning: 'উচ্চ, মহান', gender: 'boy' },
  { name: 'সামির', meaning: 'গল্পপ্রিয়', gender: 'boy' },
  { name: 'সামিউল', meaning: 'শ্রবণকারী', gender: 'boy' },
  { name: 'শাকির', meaning: 'কৃতজ্ঞ', gender: 'boy' },
  { name: 'শাকিল', meaning: 'সুন্দর গঠন', gender: 'boy' },
  { name: 'শামস', meaning: 'সূর্য', gender: 'boy' },
  { name: 'শরীফ', meaning: 'সম্মানিত', gender: 'boy' },
  { name: 'শহীদ', meaning: 'সাক্ষী', gender: 'boy' },
  { name: 'শহরিয়ার', meaning: 'রাজা', gender: 'boy' },
  { name: 'শিহাব', meaning: 'উজ্জ্বল তারা', gender: 'boy' },
  { name: 'শরিফুল', meaning: 'সম্মানিত ব্যক্তি', gender: 'boy' },
  { name: 'জাহিদ', meaning: 'দুনিয়া বিমুখ', gender: 'boy' },
  { name: 'জুবাইরুল', meaning: 'শক্তিশালী ব্যক্তি', gender: 'boy' },
  { name: 'ফারহান', meaning: 'আনন্দিত', gender: 'boy' },
  { name: 'ফারুক', meaning: 'সত্য-মিথ্যার পার্থক্যকারী', gender: 'boy' },

  // Girls
  { name: 'আয়েশা', meaning: 'জীবন্ত, সমৃদ্ধশালী', gender: 'girl' },
  { name: 'খাদিজা', meaning: 'অকালজাত শিশু', gender: 'girl' },
  { name: 'ফাতিমা', meaning: 'পবিত্র, সংযমী', gender: 'girl' },
  { name: 'জয়নাব', meaning: 'সুগন্ধি ফুল', gender: 'girl' },
  { name: 'হাফসা', meaning: 'সিংহী', gender: 'girl' },
  { name: 'মারিয়াম', meaning: 'পবিত্র নারী', gender: 'girl' },
  { name: 'আসমা', meaning: 'উচ্চ মর্যাদাসম্পন্ন', gender: 'girl' },
  { name: 'রুকাইয়া', meaning: 'কোমল, নরম', gender: 'girl' },
  { name: 'উম্মে কুলসুম', meaning: 'নবীজির কন্যার নাম', gender: 'girl' },
  { name: 'সুমাইয়া', meaning: 'প্রথম শহীদ নারী', gender: 'girl' },
  { name: 'সাফিয়া', meaning: 'বিশুদ্ধ, পবিত্র', gender: 'girl' },
  { name: 'হালিমা', meaning: 'সহনশীল', gender: 'girl' },
  { name: 'আমিনা', meaning: 'বিশ্বস্ত', gender: 'girl' },
  { name: 'খালিদা', meaning: 'চিরস্থায়ী', gender: 'girl' },
  { name: 'রাবিয়া', meaning: 'বসন্তের ফুল', gender: 'girl' },
  { name: 'নুসরাত', meaning: 'সাহায্য', gender: 'girl' },
  { name: 'নাজমা', meaning: 'তারা', gender: 'girl' },
  { name: 'নাজিয়া', meaning: 'সফল', gender: 'girl' },
  { name: 'নাজনীন', meaning: 'কোমল, সুন্দর', gender: 'girl' },
  { name: 'নাসরিন', meaning: 'সাদা ফুল', gender: 'girl' },
  { name: 'নাফিসা', meaning: 'মূল্যবান', gender: 'girl' },
  { name: 'নাহিদ', meaning: 'উজ্জ্বল', gender: 'girl' },
  { name: 'নাজিবা', meaning: 'ভদ্র, মহৎ', gender: 'girl' },
  { name: 'নাওশিন', meaning: 'মিষ্টি', gender: 'girl' },
  { name: 'নাইমা', meaning: 'শান্তিপূর্ণ', gender: 'girl' },
  { name: 'নাবিলা', meaning: 'সম্মানিত', gender: 'girl' },
  { name: 'নাহার', meaning: 'দিন', gender: 'girl' },
  { name: 'নুর', meaning: 'আলো', gender: 'girl' },
  { name: 'নুরা', meaning: 'আলোকিত', gender: 'girl' },
  { name: 'নুরজাহান', meaning: 'বিশ্বের আলো', gender: 'girl' },
  { name: 'নুসাইবা', meaning: 'সাহাবিয়ার নাম', gender: 'girl' },
  { name: 'রাহিমা', meaning: 'দয়ালু', gender: 'girl' },
  { name: 'রাহেলা', meaning: 'ভ্রমণকারী', gender: 'girl' },
  { name: 'রাইহানা', meaning: 'সুগন্ধি ফুল', gender: 'girl' },
  { name: 'রাশিদা', meaning: 'সৎপথপ্রাপ্ত', gender: 'girl' },
  { name: 'রাশমি', meaning: 'আলোর রশ্মি', gender: 'girl' },
  { name: 'রুমানা', meaning: 'ডালিম', gender: 'girl' },
  { name: 'রুমাইসা', meaning: 'ছোট ফুল', gender: 'girl' },
  { name: 'রুকসানা', meaning: 'উজ্জ্বল', gender: 'girl' },
  { name: 'রুহি', meaning: 'আত্মিক', gender: 'girl' },
  { name: 'রুবাইয়া', meaning: 'বসন্তের ফুল', gender: 'girl' },
  { name: 'রুবিনা', meaning: 'লাল রত্ন', gender: 'girl' },
  { name: 'রিমা', meaning: 'সাদা হরিণ', gender: 'girl' },
  { name: 'সাবা', meaning: 'সকাল বেলার বাতাস', gender: 'girl' },
  { name: 'সাবিহা', meaning: 'সুন্দরী', gender: 'girl' },
  { name: 'সাদিয়া', meaning: 'সৌভাগ্যবতী', gender: 'girl' },
  { name: 'সাফা', meaning: 'পবিত্রতা', gender: 'girl' },
  { name: 'সাকিনা', meaning: 'শান্তি', gender: 'girl' },
  { name: 'সামিরা', meaning: 'গল্পকার', gender: 'girl' },
  { name: 'সামিয়া', meaning: 'উচ্চ মর্যাদার', gender: 'girl' },
  { name: 'সারাহ', meaning: 'রাজকুমারী', gender: 'girl' },
  { name: 'সারমিন', meaning: 'আনন্দিত', gender: 'girl' },
  { name: 'সাবরিনা', meaning: 'ধৈর্যশীলা', gender: 'girl' },
  { name: 'সাবিরা', meaning: 'ধৈর্যশীলা', gender: 'girl' },
  { name: 'শাহিদা', meaning: 'সাক্ষী', gender: 'girl' },
  { name: 'শাহিনা', meaning: 'রাজকীয় নারী', gender: 'girl' },
  { name: 'শাহনাজ', meaning: 'রাজকীয় গর্ব', gender: 'girl' },
  { name: 'শাহরিন', meaning: 'মিষ্টি', gender: 'girl' },
  { name: 'শামিমা', meaning: 'সুগন্ধি', gender: 'girl' },
  { name: 'শামসিয়া', meaning: 'সূর্যের মতো', gender: 'girl' },
  { name: 'শারমিন', meaning: 'লাজুক', gender: 'girl' },
  { name: 'শারমিলা', meaning: 'লাজুক', gender: 'girl' },
  { name: 'শিফা', meaning: 'আরোগ্য', gender: 'girl' },
  { name: 'শিরিন', meaning: 'মিষ্টি', gender: 'girl' },
  { name: 'শাইলা', meaning: 'সুন্দরী', gender: 'girl' },
  { name: 'শায়লা', meaning: 'পর্দানশীন নারী', gender: 'girl' },
  { name: 'শাইস্তা', meaning: 'ভদ্র', gender: 'girl' },
  { name: 'তাহমিনা', meaning: 'শক্তিশালী নারী', gender: 'girl' },
  { name: 'তাহিরা', meaning: 'পবিত্র', gender: 'girl' },
  { name: 'তানজিলা', meaning: 'অবতীর্ণ', gender: 'girl' },
  { name: 'তাসনিম', meaning: 'জান্নাতের ঝর্ণা', gender: 'girl' },
  { name: 'তাসফিয়া', meaning: 'পরিশুদ্ধ করা', gender: 'girl' },
  { name: 'তাসলিমা', meaning: ' আত্মসমর্পণকারী', gender: 'girl' },
  { name: 'তানিয়া', meaning: 'কোমল', gender: 'girl' },
  { name: 'তানজিনা', meaning: 'সুন্দর', gender: 'girl' },
  { name: 'তাবাসসুম', meaning: 'হাসি', gender: 'girl' },
  { name: 'তানহা', meaning: 'একা, নির্জন', gender: 'girl' },
  { name: 'তুবা', meaning: 'জান্নাতের গাছ', gender: 'girl' },
  { name: 'উম্মে সালমা', meaning: 'সাহাবিয়ার নাম', gender: 'girl' },
  { name: 'উম্মে হাবিবা', meaning: 'নবীজির স্ত্রীর নাম', gender: 'girl' },
  { name: 'ইয়াসমিন', meaning: 'সুগন্ধি ফুল', gender: 'girl' },
  { name: 'ইয়াসমিনা', meaning: 'জুঁই ফুল', gender: 'girl' },
  { name: 'ইয়াসরা', meaning: 'সহজ, স্বচ্ছন্দ', gender: 'girl' },
  { name: 'ইয়ামিনা', meaning: 'শুভ', gender: 'girl' },
  { name: 'ইয়ুমনা', meaning: 'সৌভাগ্যবতী', gender: 'girl' },
  { name: 'জান্নাত', meaning: 'স্বর্গ', gender: 'girl' },
  { name: 'জান্নাতুল', meaning: 'জান্নাতের', gender: 'girl' },
  { name: 'জান্নাতারা', meaning: 'জান্নাতের তারা', gender: 'girl' },
  { name: 'জান্নাতুন', meaning: 'স্বর্গীয়', gender: 'girl' },
  { name: 'জারিন', meaning: 'সোনালী', gender: 'girl' },
  { name: 'জারিনা', meaning: 'রাণী', gender: 'girl' },
  { name: 'জুলেখা', meaning: 'ইউসুফ (আ.)-এর কাহিনীর নাম', gender: 'girl' },
  { name: 'জুনাইরা', meaning: 'ছোট ফুল', gender: 'girl' },
  { name: 'ফারহানা', meaning: 'আনন্দিত', gender: 'girl' },
  { name: 'ফারজানা', meaning: 'জ্ঞানী', gender: 'girl' },
  { name: 'ফারিয়া', meaning: 'সুন্দর', gender: 'girl' },
  { name: 'ফারিহা', meaning: 'আনন্দিত', gender: 'girl' },
  { name: 'ফারহিন', meaning: 'সুখী', gender: 'girl' },
  { name: 'ফারহাত', meaning: 'আনন্দ', gender: 'girl' },
];

export function IslamicNames({ onBack }: { onBack: () => void }) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGender, setActiveGender] = useState<'boy' | 'girl'>('boy');
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Scroll to top when component mounts
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo(0, 0);
    }
    // Also try window scroll as fallback
    window.scrollTo(0, 0);
  }, []);

  const filteredNames = useMemo(() => {
    return NAMES_DATA.filter(item => 
      item.gender === activeGender &&
      (item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       item.meaning.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [activeGender, searchQuery]);

  return (
    <div ref={containerRef} className="flex flex-col h-full bg-white dark:bg-slate-900 overflow-y-auto scroll-smooth">
      {/* Sticky Top Section (Header & Search) */}
      <div className="sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-sm">
        {/* Header */}
        <div className="px-4 pt-safe pb-2 flex items-center gap-4 border-b border-slate-50 dark:border-slate-800/50">
          <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Baby className="w-5 h-5 text-blue-500" />
            {t('islamic-names')}
          </h1>
        </div>

        {/* Search Bar Container */}
        <div className="px-4 py-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('search-name-meaning')}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-[13px] text-slate-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      <div className="flex-1">
        <div className="w-full">
          {/* Gender Tabs (Non-sticky) */}
          <div className="px-4 py-3 bg-slate-50/30 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800">
            <div className="flex p-0.5 bg-slate-200/50 dark:bg-slate-800/50 rounded-lg">
              <button
                onClick={() => setActiveGender('boy')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md font-bold transition-all text-[14px]",
                  activeGender === 'boy' 
                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" 
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                <Baby className="w-4 h-4" />
                {t('boys-names')}
              </button>
              <button
                onClick={() => setActiveGender('girl')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md font-bold transition-all text-[14px]",
                  activeGender === 'girl' 
                    ? "bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm" 
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                <Heart className="w-4 h-4" />
                {t('girls-names')}
              </button>
            </div>
          </div>

          {/* Names List */}
          <div className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
            <AnimatePresence mode="popLayout">
              {filteredNames.length > 0 ? (
                filteredNames.map((item, idx) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: idx * 0.01 }}
                    className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-[15px] font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {item.name}
                        </h3>
                        <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
                          <span className="font-medium text-slate-400 dark:text-slate-500">অর্থ:</span> {item.meaning}
                        </p>
                      </div>
                      <div className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center opacity-10",
                        item.gender === 'boy' ? "bg-blue-500" : "bg-rose-500"
                      )}>
                        {item.gender === 'boy' ? <Baby className="w-3.5 h-3.5" /> : <Heart className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <p className="text-slate-500 dark:text-slate-400">কোনো নাম পাওয়া যায়নি</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
