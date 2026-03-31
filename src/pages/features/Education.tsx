import { ArrowLeft, BookmarkPlus, Search, Share2, Copy, Check, BookmarkCheck, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { useFavorites } from '@/hooks/useFavorites';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface EducationSection {
  type: 'text' | 'list' | 'heading' | 'subheading';
  title?: string;
  content?: string;
  items?: string[];
}

export interface Education {
  id: number;
  title: string;
  subtitle?: string;
  sections?: EducationSection[];
}

const EDUCATION_LIST: Education[] = [
  {
    id: 1,
    title: 'অজু করার তরীকা',
    subtitle: 'অজু করার সঠিক নিয়ম ও সুন্নাতসমূহ',
    sections: [
      {
        type: 'list',
        items: [
          '১। অজুতে নিয়ত করা সুন্নত।',
          '২। বিসমিল্লাহ পড়া সুন্নত।',
          '৩। দোন হাতের কব্জিসহ তিনবার ধোয়া সুন্নত।',
          '৪। তিনবার মেছওয়াক করা সুন্নত।',
          '৫। তিনবার কুলি করা সুন্নত।',
          '৬। তিনবার নাক পরিষ্কার করা সুন্নত।',
          '৭। সমস্ত মুখ তিনবার ধোয়া সুন্নত।',
          '৮। দোন হাতের কনুইসহ তিনবার ধোয়া সুন্নত।',
          '৯। একবার সমস্ত মাথা মাসেহ করা সুন্নত।',
          '১০। দোন কানের লতি মাসেহ করা সুন্নত।',
          '১১। দোন হাতের আঙ্গুলসমূহ খেলাল করা সুন্নত।',
          '১২। দোন পায়ের আঙ্গুলসমূহ খেলাল করা সুন্নত।',
          '১৩। দোন পায়ের টাখনুসহ তিনবার ধোয়া সুন্নত।',
          '১৪। অজুর পর কালিমা শাহাদাত পড়া সুন্নত।'
        ]
      }
    ]
  },
  {
    id: 2,
    title: 'অজুর ফরজ',
    subtitle: 'অজুর ৪টি ফরজ কাজ',
    sections: [
      {
        type: 'list',
        items: [
          '১। সমস্ত মুখ একবার ধোয়া।',
          '২। দোন হাতের কনুইসহ একবার ধোয়া।',
          '৩। মাথার চারভাগের একভাগ মাসেহ করা।',
          '৪। দোন পায়ের টাখনুসহ একবার ধোয়া।'
        ]
      }
    ]
  },
  {
    id: 3,
    title: 'অজু ভঙ্গের কারণ',
    subtitle: 'যে ৭টি কারণে অজু ভেঙ্গে যায়',
    sections: [
      {
        type: 'list',
        items: [
          '১। পায়খানা বা প্রস্রাবের রাস্তা দিয়া কোন কিছু বাহির হওয়া।',
          '২। মুখ ভরিয়া বমি হওয়া।',
          '৩। শরীরের কোন জায়গা হইতে রক্ত বা পুঁজ বাহির হইয়া গড়াইয়া পড়া।',
          '৪। থুথুর সঙ্গে রক্তের ভাগ সমান বা বেশি হওয়া।',
          '৫। চিৎ হইয়া বা কাত হইয়া বা ঠেস দিয়া ঘুম যাওয়া।',
          '৬। পাগল, মাতাল বা অচেতন হইলে।',
          '৭। নামাযের মধ্যে উচ্চস্বরে হাসি দিলে।'
        ]
      }
    ]
  },
  {
    id: 4,
    title: 'গোসলের ফরজ ও সুন্নত',
    subtitle: 'গোসলের ৩টি ফরজ ও ৫টি সুন্নত',
    sections: [
      { type: 'heading', title: 'গোসলের ফরজ ৩টি' },
      {
        type: 'list',
        items: [
          '১। গরগরার সহিত কুলি করা।',
          '২। নাকে পানি দেওয়া।',
          '৩। সমস্ত শরীরে পানি পৌঁছানো।'
        ]
      },
      { type: 'heading', title: 'গোসলের সুন্নত ৫টি' },
      {
        type: 'list',
        items: [
          '১। দোন হাতের কব্জি পর্যন্ত ধোয়া।',
          '২। ইস্তিনজা করা (নাপাকি ধোয়া)।',
          '৩। শরীরের কোন স্থানে নাপাকি থাকিলে তাহা ধুইয়া ফেলা।',
          '৪। ওজু করা।',
          '৫। সমস্ত শরীরে তিনবার পানি ঢালা।'
        ]
      }
    ]
  },
  {
    id: 5,
    title: 'তায়াম্মুমের নিয়ম',
    subtitle: 'তায়াম্মুমের ফরজ ও তরীকা',
    sections: [
      { type: 'heading', title: 'তায়াম্মুমের ফরজ ৩টি' },
      {
        type: 'list',
        items: [
          '১। তায়াম্মুমের নিয়ত করা।',
          '২। পবিত্র মাটি বা ঐ জাতীয় বস্তুর উপর দোন হাত মারিয়া সমস্ত মুখ মাসেহ করা।',
          '৩। পুনরায় হাত মারিয়া দোন হাতের কনুইসহ মাসেহ করা।'
        ]
      },
      { type: 'heading', title: 'তায়াম্মুম করার তরীকা' },
      {
        type: 'list',
        items: [
          '১। প্রথমে মনে মনে নিয়ত করা যে, আমি পবিত্রতা অর্জনের জন্য তায়াম্মুম করিতেছি।',
          '২। বিসমিল্লাহ বলিয়া পবিত্র মাটি বা ঐ জাতীয় বস্তুর উপর দোন হাতের তালু মারিয়া সামান্য ঝাড়িয়া সমস্ত মুখ একবার মাসেহ করা।',
          '৩। পুনরায় মাটি বা ঐ জাতীয় বস্তুর উপর দোন হাত মারিয়া বাম হাতের তালু দিয়া ডান হাতের কনুইসহ এবং ডান হাতের তালু দিয়া বাম হাতের কনুইসহ একবার মাসেহ করা।'
        ]
      }
    ]
  },
  {
    id: 6,
    title: 'নামাযের আহকাম ও আরকান',
    subtitle: 'নামাযের বাইরের ৭টি ও ভিতরের ৬টি ফরজ',
    sections: [
      { type: 'heading', title: 'নামাযের আহকাম (বাইরের ফরজ) ৭টি' },
      {
        type: 'list',
        items: [
          '১। শরীর পাক।',
          '২। কাপড় পাক।',
          '৩। নামাযের জায়গা পাক।',
          '৪। সতর ঢাকা।',
          '৫। কেবলামুখী হওয়া।',
          '৬। ওয়াক্ত মত নামায পড়া।',
          '৭। নামাযের নিয়ত করা।'
        ]
      },
      { type: 'heading', title: 'নামাযের আরকান (ভিতরের ফরজ) ৬টি' },
      {
        type: 'list',
        items: [
          '১। তাকবীরে তাহরীমা বলা।',
          '২। খাড়া হইয়া নামায পড়া।',
          '৩। কেরাআত পড়া।',
          '৪। রুকু করা।',
          '৫। দোন সেজদা করা।',
          '৬। শেষ বৈঠক।'
        ]
      }
    ]
  },
  {
    id: 7,
    title: 'নামাযের ওয়াজিব',
    subtitle: 'নামাযের ১৪টি ওয়াজিব কাজ',
    sections: [
      {
        type: 'list',
        items: [
          '১। আলহামদু শরীফ পুরা পড়া।',
          '২। আলহামদু শরীফের সাথে সূরা মিলানো।',
          '৩। রুকু সেজদায় দেরি করা।',
          '৪। রুকু হইতে সোজা হইয়া খাড়া হওয়া।',
          '৫। দোন সেজদার মাঝখানে সোজা হইয়া বসা।',
          '৬। দরূদ শরীফ পড়ার জন্য প্রথম বৈঠক করা।',
          '৭। দোন বৈঠকে আত্তাহিয়্যাতু পড়া।',
          '৮। ইমামের জন্য কেরাআত উচ্চস্বরে এবং আস্তে পড়ার জায়গায় আস্তে পড়া।',
          '৯। বিতরের নামাযে দোয়ায়ে কুনুত পড়া।',
          '১০। দুই ঈদের নামাযে ছয় তাকবীর বলা।',
          '১১। প্রত্যেক ফরয নামাযের প্রথম দুই রাকাতে কেরাআত পড়া।',
          '১২। ফরয নামাযের রাকাতগুলোর তারতীব ঠিক রাখা।',
          '১৩। নামাযের ওয়াজিবগুলোর তারতীব ঠিক রাখা।',
          '১৪। আসসালামু আলাইকুম বলিয়া নামায শেষ করা।'
        ]
      }
    ]
  },
  {
    id: 8,
    title: 'নামাযের সুন্নত',
    subtitle: 'নামাযের ১২টি সুন্নত কাজ',
    sections: [
      {
        type: 'list',
        items: [
          '১। তাকবীরে তাহরীমার সময় দোন হাত কান পর্যন্ত উঠানো।',
          '২। দোন হাতের আঙ্গুলসমূহ স্বাভাবিক রাখা।',
          '৩। তাকবীর বলার পর দোন হাত নাভির নিচে বাঁধা।',
          '৪। ছানা পড়া।',
          '৫। আউযুবিল্লাহ পড়া।',
          '৬। বিসমিল্লাহ পড়া।',
          '৭। আলহামদু শরীফ শেষ করিয়া আমীন বলা।',
          '৮। এক রুকন হইতে অন্য রুকনে যাওয়ার সময় তাকবীর বলা।',
          '৯। রুকুতে ‘সুবহানা রাব্বিয়াল আযীম’ অন্তত তিনবার বলা।',
          '১০। রুকু হইতে উঠিবার সময় ‘সামিআল্লাহু লিমান হামিদাহ’ ও ‘রাব্বানা লাকাল হামদ’ বলা।',
          '১১। সেজদাতে ‘সুবহানা রাব্বিয়াল আলা’ অন্তত তিনবার বলা।',
          '১২। শেষ বৈঠকে আত্তাহিয়্যাতু পড়ার পর দরূদ শরীফ ও দোয়ায়ে মাসুরা পড়া।'
        ]
      }
    ]
  },
  {
    id: 9,
    title: 'নামায ভঙ্গের কারণ',
    subtitle: 'যে ১৯টি কারণে নামায ভেঙ্গে যায়',
    sections: [
      {
        type: 'list',
        items: [
          '১। নামাযের মধ্যে কথা বলা।',
          '২। কোন লোককে সালাম দেওয়া।',
          '৩। সালামের উত্তর দেওয়া।',
          '৪। উঃ আঃ শব্দ করা।',
          '৫। বিনা ওজরে কাশি দেওয়া।',
          '৬। আমলে কলীল করা।',
          '৭। বিপদে বা ব্যথায় উচ্চস্বরে কাঁদা।',
          '৮। তিন তাসবীহ পরিমাণ সতর খুলিয়া থাকা।',
          '৯। মুক্তাদী ব্যতীত অন্য লোকের লোকমা লওয়া।',
          '১০। কুরআন শরীফ দেখিয়া পড়া।',
          '১১। নামাযের মধ্যে খাওয়া বা পান করা।',
          '১২। কিবলা হইতে সিনা ফিরিয়া যাওয়া।',
          '১৩। নাপাক জায়গায় সেজদা করা।',
          '১৪। শব্দ করিয়া হাসা।',
          '১৫। নামাযে কেরাআতে বড় রকমের ভুল করা।',
          '১৬। নামাযের মধ্যে ওজু ভাঙ্গিয়া যাওয়া।',
          '১৭। নামাযের মধ্যে কাপড় পরা।',
          '১৮। নামাযের মধ্যে কোন কিছু খাওয়া।',
          '১৯। ইমামের আগে মুক্তাদীর কোন রুকন আদায় করা।'
        ]
      }
    ]
  }
];

export function EducationView({ onBack }: { onBack: () => void }) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<Education | null>(null);
  const [copied, setCopied] = useState(false);
  const { toggleFavorite, isFavorite } = useFavorites<Education>('favorite-education');

  // Handle back button for mobile
  useEffect(() => {
    const handleBackButton = () => {
      if (selectedTopic) {
        setSelectedTopic(null);
        return true;
      }
      return false;
    };

    window.addEventListener('popstate', handleBackButton);
    if (selectedTopic) {
      window.history.pushState({ detailView: true }, '');
    }

    return () => window.removeEventListener('popstate', handleBackButton);
  }, [selectedTopic]);

  const filteredTopics = EDUCATION_LIST.filter(topic => 
    topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    topic.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (selectedTopic) {
    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="flex flex-col min-h-full bg-white dark:bg-slate-950"
      >
        {/* Detail Header */}
        <header className="sticky top-0 z-10 bg-white dark:bg-slate-950 backdrop-blur-md px-4 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-bold text-slate-800 dark:text-white line-clamp-1 max-w-[200px]">
              {selectedTopic.title}
            </h2>
          </div>
          <div className="flex gap-0.5">
            <button 
              onClick={() => toggleFavorite(selectedTopic)}
              className={cn(
                "p-2.5 transition-all active:scale-90",
                isFavorite(selectedTopic.id) ? "text-primary-500" : "text-slate-400 hover:text-primary-500"
              )}
              title={isFavorite(selectedTopic.id) ? "পছন্দ থেকে সরান" : "পছন্দ তালিকায় যোগ করুন"}
            >
              {isFavorite(selectedTopic.id) ? <BookmarkCheck className="w-5 h-5 fill-primary-500/10" /> : <BookmarkPlus className="w-5 h-5" />}
            </button>
            <button className="p-2.5 text-slate-400 hover:text-primary-500 transition-colors active:scale-90">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 px-5 py-8 space-y-8 max-w-2xl mx-auto w-full">
          {/* Title Section */}
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-primary-50 dark:bg-primary-500/10 rounded-2xl mb-2">
              <BookOpen className="w-6 h-6 text-primary-500" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
              {selectedTopic.title}
            </h2>
            {selectedTopic.subtitle && (
              <p className="text-sm font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10 px-3 py-1 rounded-full inline-block">
                {selectedTopic.subtitle}
              </p>
            )}
          </div>

          <div className="space-y-6 pb-20">
            {selectedTopic.sections?.map((section, idx) => (
              <div key={idx} className="space-y-3">
                {section.type === 'heading' && (
                  <h3 className="text-base font-bold text-primary-600 dark:text-primary-400 border-l-4 border-primary-500 pl-3 py-1 bg-primary-50/50 dark:bg-primary-900/10 rounded-r-lg">
                    {section.title}
                  </h3>
                )}
                {section.type === 'subheading' && (
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-4">
                    {section.title}
                  </h4>
                )}
                {section.type === 'text' && (
                  <p className="text-[14px] text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                    {section.content}
                  </p>
                )}
                {section.type === 'list' && (
                  <ul className="space-y-2">
                    {section.items?.map((item, i) => (
                      <li key={i} className="flex gap-3 text-[14px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary-500 mt-2" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
            
            {/* Copy All Button */}
            <div className="flex justify-center pt-8">
              <button 
                onClick={() => {
                  const allText = selectedTopic.sections?.map(s => {
                    if (s.type === 'text') return s.content;
                    if (s.type === 'heading' || s.type === 'subheading') return s.title;
                    if (s.type === 'list') return s.items?.join('\n');
                    return '';
                  }).join('\n\n');
                  handleCopy(allText || '');
                }}
                className="flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-2xl text-sm font-bold shadow-xl shadow-primary-500/20 hover:bg-primary-600 active:scale-95 transition-all"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                {copied ? 'সবগুলো কপি হয়েছে' : 'সবগুলো কপি করুন'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-slate-50 dark:bg-slate-950 pb-8">
      {/* Header */}
      <div className="px-6 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-4 flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
          <div className="p-2 bg-primary-500/10 rounded-xl">
            <BookOpen className="w-6 h-6 text-primary-500" />
          </div>
          {t('education')}
        </h1>
      </div>

      {/* Unified Card Container (Search + List) */}
      <div className="w-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Thinner Search Bar */}
        <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 mr-3" />
            <input
              type="text"
              placeholder={t('search-topics')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-1 text-[15px] bg-transparent outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Content List */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
          {filteredTopics.length > 0 ? (
            filteredTopics.map((topic, idx) => (
              <motion.div
                key={topic.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="group active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors"
              >
                <button
                  onClick={() => setSelectedTopic(topic)}
                  className="w-full flex flex-col py-5 px-6 text-left relative"
                >
                  <div className="pr-12">
                    <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors text-[17px] leading-tight">
                      {topic.title}
                    </h3>
                    {topic.subtitle && (
                      <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-1 font-medium opacity-80">
                        {topic.subtitle}
                      </p>
                    )}
                  </div>
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(topic);
                    }}
                    className={cn(
                      "absolute right-5 top-1/2 -translate-y-1/2 p-2.5 rounded-xl transition-all active:scale-90 z-10",
                      isFavorite(topic.id) 
                        ? "text-primary-500 bg-primary-50 dark:bg-primary-500/10" 
                        : "text-slate-300 hover:text-primary-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                    )}
                  >
                    {isFavorite(topic.id) ? <BookmarkCheck className="w-5 h-5 fill-primary-500/10" /> : <BookmarkPlus className="w-5 h-5" />}
                  </div>
                </button>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-slate-700/50">
                <Search className="w-10 h-10 text-slate-200 dark:text-slate-700" />
              </div>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-lg">{t('no-results-found')}</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">{t('try-another-search')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

