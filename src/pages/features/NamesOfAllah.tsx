interface NameOfAllah {
  id: number;
  name: string;
  arabic: string;
  meaning: string;
}

const NAMES_OF_ALLAH: NameOfAllah[] = [
  { id: 1, name: "আল্লাহ", arabic: "ٱللَّٰه", meaning: "আল্লাহ" },
  { id: 2, name: "আর-রহমান", arabic: "ٱلرَّحْمَٰن", meaning: "পরম করুণাময়" },
  { id: 3, name: "আর-রাহীম", arabic: "ٱلرَّحِيم", meaning: "অসীম দয়ালু" },
  { id: 4, name: "আল-মালিক", arabic: "ٱلْمَلِك", meaning: "অধিপতি" },
  { id: 5, name: "আল-কুদ্দুস", arabic: "ٱلْقُدُّوس", meaning: "পবিত্র" },
  { id: 6, name: "আস-সালাম", arabic: "ٱلسَّلَام", meaning: "শান্তি দাতা" },
  { id: 7, name: "আল-মুমিন", arabic: "ٱلْمُؤْمِن", meaning: "নিরাপত্তা দানকারী" },
  { id: 8, name: "আল-মুহাইমিন", arabic: "ٱلْمُهَيْمِن", meaning: "রক্ষক" },
  { id: 9, name: "আল-আযীয", arabic: "ٱلْعَزِيز", meaning: "পরাক্রমশালী" },
  { id: 10, name: "আল-জাব্বার", arabic: "ٱلْجَبَّار", meaning: "সর্বশক্তিমান" },
  { id: 11, name: "আল-মুতাকাব্বির", arabic: "ٱلْمُتَكَبِّر", meaning: "অহংকারের অধিকারী" },
  { id: 12, name: "আল-খালিক", arabic: "ٱلْخَالِق", meaning: "সৃষ্টিকর্তা" },
  { id: 13, name: "আল-বারী", arabic: "ٱلْبَارِئ", meaning: "সঠিকভাবে সৃষ্টিকারী" },
  { id: 14, name: "আল-মুসাউয়ির", arabic: "ٱلْمُصَوِّر", meaning: "আকৃতি দানকারী" },
  { id: 15, name: "আল-গাফফার", arabic: "ٱلْغَفَّار", meaning: "অত্যন্ত ক্ষমাশীল" },
  { id: 16, name: "আল-কাহহার", arabic: "ٱلْقَهَّار", meaning: "সব কিছুর ওপর বিজয়ী" },
  { id: 17, name: "আল-ওয়াহহাব", arabic: "ٱلْوَهَّاب", meaning: "সব কিছুর দাতা" },
  { id: 18, name: "আর-রাজ্জাক", arabic: "ٱلرَّزَّاق", meaning: "রিযিকদাতা" },
  { id: 19, name: "আল-ফাত্তাহ", arabic: "ٱلْفَتَّاح", meaning: "বিজয়দানকারী" },
  { id: 20, name: "আল-আলিম", arabic: "ٱلْعَلِيم", meaning: "সর্বজ্ঞ" },
  { id: 21, name: "আল-কাবিদ", arabic: "ٱلْقَابِض", meaning: "সংকুচিতকারী" },
  { id: 22, name: "আল-বাসিত", arabic: "ٱلْبَاسِط", meaning: "প্রসারণকারী" },
  { id: 23, name: "আল-খাফিদ", arabic: "ٱلْخَافِض", meaning: "অবনতকারী" },
  { id: 24, name: "আর-রাফি", arabic: "ٱلرَّافِع", meaning: "উন্নীতকারী" },
  { id: 25, name: "আল-মুইয", arabic: "ٱلْمُعِزّ", meaning: "সম্মান দানকারী" },
  { id: 26, name: "আল-মুযিল", arabic: "ٱلْمُذِلّ", meaning: "অপমানকারী" },
  { id: 27, name: "আস-সামি", arabic: "ٱلسَّمِيع", meaning: "সর্বশ্রোতা" },
  { id: 28, name: "আল-বাসীর", arabic: "ٱلْبَصِير", meaning: "সর্বদ্রষ্টা" },
  { id: 29, name: "আল-হাকাম", arabic: "ٱلْحَكَم", meaning: "বিচারক" },
  { id: 30, name: "আল-আদল", arabic: "ٱلْعَدْل", meaning: "সুবিচারক" },
  { id: 31, name: "আল-লাতীফ", arabic: "ٱللَّطِيف", meaning: "সূক্ষ্মদর্শী" },
  { id: 32, name: "আল-খাবীর", arabic: "ٱلْخَبِير", meaning: "সব বিষয়ে অবগত" },
  { id: 33, name: "আল-হালিম", arabic: "ٱلْحَلِيم", meaning: "অত্যন্ত ধৈর্যশীল" },
  { id: 34, name: "আল-আযীম", arabic: "ٱلْعَظِيم", meaning: "মহান" },
  { id: 35, name: "আল-গাফূর", arabic: "ٱلْغَفُور", meaning: "ক্ষমাশীল" },
  { id: 36, name: "আশ-শাকূর", arabic: "ٱلشَّكُور", meaning: "কৃতজ্ঞতা স্বীকারকারী" },
  { id: 37, name: "আল-আলীয়্য", arabic: "ٱلْعَلِيّ", meaning: "উচ্চ মর্যাদা সম্পন্ন" },
  { id: 38, name: "আল-কবীর", arabic: "ٱلْكَبِير", meaning: "সবচেয়ে বড়" },
  { id: 39, name: "আল-হাফীয", arabic: "ٱلْحَفِيظ", meaning: "সংরক্ষণকারী" },
  { id: 40, name: "আল-মুকীত", arabic: "ٱلْمُقِيت", meaning: "খাদ্য ও শক্তি দাতা" },
  { id: 41, name: "আল-হাসীব", arabic: "ٱلْحَسِيب", meaning: "হিসাব গ্রহণকারী" },
  { id: 42, name: "আল-জালীল", arabic: "ٱلْجَلِيل", meaning: "মহিমান্বিত" },
  { id: 43, name: "আল-কারীম", arabic: "ٱلْكَرِيم", meaning: "দানশীল" },
  { id: 44, name: "আর-রাকীব", arabic: "ٱلرَّقِيب", meaning: "তত্ত্বাবধায়ক" },
  { id: 45, name: "আল-মুজীব", arabic: "ٱلْمُجِيب", meaning: "সাড়া দানকারী" },
  { id: 46, name: "আল-ওয়াসি", arabic: "ٱلْوَاسِع", meaning: "সর্বব্যাপী" },
  { id: 47, name: "আল-হাকীম", arabic: "ٱلْحَكِيم", meaning: "প্রজ্ঞাময়" },
  { id: 48, name: "আল-ওয়াদুদ", arabic: "ٱلْوَدُود", meaning: "প্রেমময়" },
  { id: 49, name: "আল-মাজীদ", arabic: "ٱلْمَجِيد", meaning: "মহিমান্বিত" },
  { id: 50, name: "আল-বাঈস", arabic: "ٱلْبَاعِث", meaning: "পুনরুত্থানকারী" },
  { id: 51, name: "আশ-শাহীদ", arabic: "ٱلشَّهِيد", meaning: "সাক্ষী" },
  { id: 52, name: "আল-হাক্ক", arabic: "ٱلْحَقّ", meaning: "সত্য" },
  { id: 53, name: "আল-ওয়াকীল", arabic: "ٱلْوَكِيل", meaning: "কর্মবিধায়ক" },
  { id: 54, name: "আল-কাউয়ী", arabic: "ٱلْقَوِيّ", meaning: "শক্তিশালী" },
  { id: 55, name: "আল-মাতীন", arabic: "ٱلْمَتِين", meaning: "সুদৃঢ়" },
  { id: 56, name: "আল-ওয়ালী", arabic: "ٱلْوَلِيّ", meaning: "অভিভাবক" },
  { id: 57, name: "আল-হামীদ", arabic: "ٱلْحَمِيد", meaning: "প্রশংসিত" },
  { id: 58, name: "আল-মুহসী", arabic: "ٱلْمُحْصِي", meaning: "গণনাকারী" },
  { id: 59, name: "আল-মুবদী", arabic: "ٱلْمُبْدِئ", meaning: "সূচনাকারী" },
  { id: 60, name: "আল-মুঈদ", arabic: "ٱلْمُعِيد", meaning: "পুনঃসৃষ্টিকারী" },
  { id: 61, name: "আল-মুহয়ী", arabic: "ٱلْمُحْيِي", meaning: "জীবন দানকারী" },
  { id: 62, name: "আল-মুমীত", arabic: "ٱلْمُمِيت", meaning: "মৃত্যু দানকারী" },
  { id: 63, name: "আল-হাইয়্যু", arabic: "ٱلْحَيّ", meaning: "চিরঞ্জীব" },
  { id: 64, name: "আল-কাইয়্যুম", arabic: "ٱلْقَيُّوم", meaning: "সব কিছুর ধারক" },
  { id: 65, name: "আল-ওয়াজিদ", arabic: "ٱلْوَاجِد", meaning: "অস্তিত্ব রক্ষাকারী" },
  { id: 66, name: "আল-মাজিদ", arabic: "ٱلْمَاجِد", meaning: "মহিমান্বিত" },
  { id: 67, name: "আল-ওয়াহিদ", arabic: "ٱلْوَاحِد", meaning: "একক" },
  { id: 68, name: "আস-সামাদ", arabic: "ٱلصَّمَد", meaning: "অমুখাপেক্ষী" },
  { id: 69, name: "আল-কাদির", arabic: "ٱلْقَادِر", meaning: "সর্বশক্তিমান" },
  { id: 70, name: "আল-মুকতাদির", arabic: "ٱلْمُقْتَدِر", meaning: "সর্বক্ষমতাবান" },
  { id: 71, name: "আল-মুকাদ্দিম", arabic: "ٱلْمُقَدِّم", meaning: "অগ্রসরকারী" },
  { id: 72, name: "আল-মুয়াকখির", arabic: "ٱلْمُؤَخِّر", meaning: "বিলম্বকারী" },
  { id: 73, name: "আল-আউয়াল", arabic: "ٱلْأَوَّل", meaning: "প্রথম" },
  { id: 74, name: "আল-আখির", arabic: "ٱلْآخِر", meaning: "শেষ" },
  { id: 75, name: "আয-যাহির", arabic: "ٱلظَّاهِر", meaning: "প্রকাশ্য" },
  { id: 76, name: "আল-বাতিন", arabic: "ٱلْبَاطِن", meaning: "গোপন" },
  { id: 77, name: "আল-ওয়ালী", arabic: "ٱلْوَالِي", meaning: "শাসক" },
  { id: 78, name: "আল-মুতাআলী", arabic: "ٱلْمُتَعَالِي", meaning: "সর্বোচ্চ" },
  { id: 79, name: "আল-বার", arabic: "ٱلْبَرّ", meaning: "কল্যাণকারী" },
  { id: 80, name: "আত-তাওয়াব", arabic: "ٱلتَّوَّاب", meaning: "ক্ষমা কবুলকারী" },
  { id: 81, name: "আল-মুনতাকিম", arabic: "ٱلْمُنْتَقِم", meaning: "প্রতিশোধ গ্রহণকারী" },
  { id: 82, name: "আল-আফুব্ব", arabic: "ٱلْعَفُوّ", meaning: "ক্ষমাশীল" },
  { id: 83, name: "আর-রাউফ", arabic: "ٱلرَّءُوف", meaning: "দয়ালু" },
  { id: 84, name: "মালিকুল মুলক", arabic: "مَالِكُ ٱلْمُلْك", meaning: "রাজ্যের মালিক" },
  { id: 85, name: "যুল জালালি ওয়াল ইকরাম", arabic: "ذُو ٱلْجَلَالِ وَٱلْإِكْرَام", meaning: "মহিমা ও সম্মানের অধিকারী" },
  { id: 86, name: "আল-মুকসিত", arabic: "ٱلْمُقْسِط", meaning: "ন্যায়পরায়ণ" },
  { id: 87, name: "আল-জামি", arabic: "ٱلْجَامِع", meaning: "একত্রকারী" },
  { id: 88, name: "আল-গণী", arabic: "ٱلْغَنِيّ", meaning: "অভাবমুক্ত" },
  { id: 89, name: "আল-মুগণী", arabic: "ٱلْمُغْنِي", meaning: "সমৃদ্ধকারী" },
  { id: 90, name: "আল-মানি", arabic: "ٱلْمَانِع", meaning: "প্রতিরোধকারী" },
  { id: 91, name: "আদ-দার", arabic: "ٱلضَّارّ", meaning: "ক্ষতিসাধনকারী" },
  { id: 92, name: "আন-নাফি", arabic: "ٱلنَّافِع", meaning: "উপকারী" },
  { id: 93, name: "আন-নূর", arabic: "ٱلنُّور", meaning: "আলো" },
  { id: 94, name: "আল-হাদী", arabic: "ٱلْهَادِي", meaning: "পথপ্রদর্শক" },
  { id: 95, name: "আল-বাদী", arabic: "ٱلْبَدِيع", meaning: "অতুলনীয়" },
  { id: 96, name: "আল-বাকী", arabic: "ٱلْبَاقِي", meaning: "চিরস্থায়ী" },
  { id: 97, name: "আল-ওয়ারিস", arabic: "ٱلْوَارِث", meaning: "উত্তরাধিকারী" },
  { id: 98, name: "আর-রাশীদ", arabic: "ٱلرَّشِيد", meaning: "সঠিক পথপ্রদর্শক" },
  { id: 99, name: "আস-সবূর", arabic: "ٱلصَّبُور", meaning: "অত্যন্ত ধৈর্যশীল" },
];

export function NamesOfAllahView() {
  return (
    <div className="min-h-full w-full bg-slate-50 dark:bg-slate-950 pb-8">
      <header className="sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-20 px-4 pt-safe pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-center relative">
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">আল্লাহর ৯৯ নাম</h1>
        </div>
      </header>
      
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {NAMES_OF_ALLAH.map((name) => (
          <div 
            key={name.id} 
            className="bg-white dark:bg-slate-900 p-3 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center"
          >
            <h2 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">{name.arabic}</h2>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{name.name}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{name.meaning}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
