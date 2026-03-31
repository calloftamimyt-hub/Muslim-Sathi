import { useState, useEffect, useRef } from 'react';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { Image as ImageIcon, MapPin, Tag, ChevronRight, X, Check, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { onAuthStateChanged } from 'firebase/auth';
import { useLocation, updateUserLocation } from '@/hooks/useLocation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSocialLimits } from '@/hooks/useSocialLimits';
import { LimitReachedModal } from './LimitReachedModal';

const CATEGORIES = [
  { id: 'General', bn: 'সাধারণ', en: 'General' },
  { id: 'Dua', bn: 'দোয়া', en: 'Dua' },
  { id: 'Hadith', bn: 'হাদিস', en: 'Hadith' },
  { id: 'Quran', bn: 'কুরআন', en: 'Quran' },
  { id: 'Question', bn: 'প্রশ্ন', en: 'Question' },
  { id: 'Islamic Knowledge', bn: 'ইসলামিক জ্ঞান', en: 'Islamic Knowledge' },
];

const POPULAR_CITIES = [
  { bn: 'ঢাকা', en: 'Dhaka' },
  { bn: 'চট্টগ্রাম', en: 'Chittagong' },
  { bn: 'সিলেট', en: 'Sylhet' },
  { bn: 'রাজশাহী', en: 'Rajshahi' },
  { bn: 'খুলনা', en: 'Khulna' },
  { bn: 'বরিশাল', en: 'Barisal' },
  { bn: 'রংপুর', en: 'Rangpur' },
  { bn: 'ময়মনসিংহ', en: 'Mymensingh' },
  { bn: 'কুমিল্লা', en: 'Comilla' },
  { bn: 'গাজীপুর', en: 'Gazipur' },
];

export function PostForm({ onPostCreated, onAddStoryClick, onRequireLogin }: { onPostCreated?: () => void, onAddStoryClick?: () => void, onRequireLogin?: () => void }) {
  const { t, language } = useLanguage();
  const locationState = useLocation(language);
  const { city: currentCity, country: currentCountry } = locationState;
  const { checkLimit, incrementCount } = useSocialLimits();
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('General');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isModalOpen) {
      window.history.pushState({ modal: 'post' }, '', '');
      const handlePopState = () => {
        if (showCategoryModal) setShowCategoryModal(false);
        else if (showLocationModal) setShowLocationModal(false);
        else setIsModalOpen(false);
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [isModalOpen, showCategoryModal, showLocationModal]);

  useEffect(() => {
    if (currentCity && !location) {
      setLocation(currentCountry ? `${currentCity}, ${currentCountry}` : currentCity);
    }
  }, [currentCity, currentCountry]);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUsername(userDoc.data().username);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
        }
      } else {
        setUsername(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (!user) {
        alert(t('login-required'));
        setIsModalOpen(false);
        return;
      }

      await addDoc(collection(db, 'posts'), {
        authorUid: user.uid,
        authorName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        authorAvatarUrl: user.photoURL || '',
        authorUsername: username || '',
        content: content.trim(),
        type: category,
        location: location,
        ameenCount: 0,
        reactionsCount: 0,
        reportsCount: 0,
        reports: [],
        createdAt: serverTimestamp()
      });

      setContent('');
      setLocation(currentCountry ? `${currentCity}, ${currentCountry}` : (currentCity || ''));
      setCategory('General');
      setIsModalOpen(false);
      
      await incrementCount('post');
      alert(t('post-success'));
      
      if (onPostCreated) {
        onPostCreated();
      }
      
    } catch (error: any) {
      handleFirestoreError(error, OperationType.CREATE, 'posts');
      alert(t('post-error') + "\n" + (error.message || "Unknown Error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const initial = user?.displayName ? user.displayName.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : 'U');
  const firstName = user?.displayName ? user.displayName.split(' ')[0] : '';
  const userAvatar = user?.photoURL;
  const userName = user?.displayName || user?.email?.split('@')[0] || 'Anonymous';

  const handleOpenModal = () => {
    if (!user) {
      if (onRequireLogin) onRequireLogin();
      else alert(t('login-required'));
      return;
    }

    if (!checkLimit('post')) {
      setShowLimitModal(true);
      return;
    }

    setIsModalOpen(true);
  };

  const filteredCities = POPULAR_CITIES.filter(city => 
    city.en.toLowerCase().includes(locationSearch.toLowerCase()) || 
    city.bn.includes(locationSearch)
  );

  const selectedCategoryLabel = CATEGORIES.find(c => c.id === category)?.[language === 'bn' ? 'bn' : 'en'] || category;

  return (
    <>
      <div className="bg-white dark:bg-slate-900 shadow-sm mb-2 border-b border-slate-200 dark:border-slate-800 p-4">
        <div className="flex items-center space-x-3">
          {userAvatar ? (
            <img 
              src={userAvatar} 
              alt={userName} 
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-lg flex-shrink-0">
              {initial}
            </div>
          )}
          <button 
            onClick={handleOpenModal}
            className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full px-5 py-2.5 text-left text-[15px] transition-colors"
          >
            {t('whats-on-your-mind')}{firstName ? `, ${firstName}` : ''}?
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[1000] bg-white dark:bg-slate-950 flex flex-col pt-safe"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 sticky top-0 z-10">
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 -ml-1 text-slate-500 dark:text-slate-400"
                >
                  <X className="w-6 h-6" />
                </button>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('create-post')}</h2>
              </div>
              <button 
                onClick={handleSubmit}
                disabled={!content.trim() || isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-5 py-1.5 rounded-full font-bold text-sm transition-colors shadow-sm shadow-emerald-200 dark:shadow-none"
              >
                {isSubmitting ? t('posting') : t('post')}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex items-center space-x-3 mb-4">
                {userAvatar ? (
                  <img 
                    src={userAvatar} 
                    alt={userName} 
                    className="w-12 h-12 rounded-full object-cover border border-slate-100 dark:border-slate-800"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-xl">
                    {initial}
                  </div>
                )}
                <div className="flex flex-col">
                  <h3 className="font-bold text-slate-900 dark:text-white leading-tight">{userName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <button 
                      onClick={() => setShowCategoryModal(true)}
                      className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[11px] font-bold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                    >
                      <Tag className="w-3 h-3" />
                      {selectedCategoryLabel}
                    </button>
                    {location && (
                      <button 
                        onClick={() => setShowLocationModal(true)}
                        className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[11px] font-bold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 max-w-[120px] truncate"
                      >
                        <MapPin className="w-3 h-3" />
                        {location.split(',')[0]}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <textarea
                autoFocus
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`${t('whats-on-your-mind')}${firstName ? `, ${firstName}` : ''}?`}
                className="w-full bg-transparent text-slate-900 dark:text-white text-xl outline-none resize-none placeholder-slate-400 min-h-[200px]"
              />
            </div>

            {/* Bottom Bar (Facebook Style) */}
            <div className="border-t border-slate-100 dark:border-slate-800 p-3 bg-white dark:bg-slate-950">
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 p-3 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-600 dark:text-slate-400 ml-2">
                  {language === 'bn' ? 'পোস্টে যোগ করুন' : 'Add to your post'}
                </span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowCategoryModal(true)}
                    className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-emerald-600"
                    title={language === 'bn' ? 'ক্যাটাগরি' : 'Category'}
                  >
                    <Tag className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={() => setShowLocationModal(true)}
                    className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-red-500"
                    title={language === 'bn' ? 'লোকেশন' : 'Location'}
                  >
                    <MapPin className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>

            {/* Category Selection Modal */}
            <AnimatePresence>
              {showCategoryModal && (
                <motion.div 
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  className="absolute inset-0 z-[1010] bg-white dark:bg-slate-950 flex flex-col"
                >
                  <div className="flex items-center px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                    <button onClick={() => setShowCategoryModal(false)} className="p-1 -ml-1">
                      <X className="w-6 h-6 text-slate-500" />
                    </button>
                    <h3 className="ml-4 text-lg font-bold text-slate-900 dark:text-white">
                      {language === 'bn' ? 'ক্যাটাগরি নির্বাচন করুন' : 'Select Category'}
                    </h3>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setCategory(cat.id);
                          setShowCategoryModal(false);
                        }}
                        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-colors"
                      >
                        <span className={`font-bold ${category === cat.id ? 'text-emerald-600' : 'text-slate-700 dark:text-slate-300'}`}>
                          {language === 'bn' ? cat.bn : cat.en}
                        </span>
                        {category === cat.id && <Check className="w-5 h-5 text-emerald-600" />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Location Selection Modal */}
            <AnimatePresence>
              {showLocationModal && (
                <motion.div 
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  className="absolute inset-0 z-[1010] bg-white dark:bg-slate-950 flex flex-col"
                >
                  <div className="flex items-center px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                    <button onClick={() => setShowLocationModal(false)} className="p-1 -ml-1">
                      <X className="w-6 h-6 text-slate-500" />
                    </button>
                    <h3 className="ml-4 text-lg font-bold text-slate-900 dark:text-white">
                      {language === 'bn' ? 'লোকেশন নির্বাচন করুন' : 'Select Location'}
                    </h3>
                  </div>
                  
                  <div className="p-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        type="text"
                        value={locationSearch}
                        onChange={(e) => setLocationSearch(e.target.value)}
                        placeholder={language === 'bn' ? 'শহর খুঁজুন...' : 'Search city...'}
                        className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-full py-3 pl-10 pr-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto px-2">
                    {locationSearch && !filteredCities.some(c => c.en.toLowerCase() === locationSearch.toLowerCase() || c.bn === locationSearch) && (
                      <button
                        onClick={() => {
                          setLocation(locationSearch);
                          setShowLocationModal(false);
                          setLocationSearch('');
                        }}
                        className="w-full flex items-center p-4 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-colors text-emerald-600 font-bold"
                      >
                        <MapPin className="w-5 h-5 mr-3" />
                        "{locationSearch}" {language === 'bn' ? 'ব্যবহার করুন' : 'Use this'}
                      </button>
                    )}

                    <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {language === 'bn' ? 'জনপ্রিয় শহর' : 'Popular Cities'}
                    </div>

                    {filteredCities.map((city) => {
                      const cityLabel = language === 'bn' ? city.bn : city.en;
                      const isSelected = location.startsWith(cityLabel);
                      return (
                        <button
                          key={city.en}
                          onClick={() => {
                            const fullLocation = city.en === 'Dhaka' || city.bn === 'ঢাকা' ? `${cityLabel}, Bangladesh` : cityLabel;
                            setLocation(fullLocation);
                            setShowLocationModal(false);
                            setLocationSearch('');
                            // Optionally update app-wide location
                            updateUserLocation({ city: cityLabel });
                          }}
                          className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-colors"
                        >
                          <div className="flex items-center">
                            <MapPin className={`w-5 h-5 mr-3 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                            <span className={`font-bold ${isSelected ? 'text-emerald-600' : 'text-slate-700 dark:text-slate-300'}`}>
                              {cityLabel}
                            </span>
                          </div>
                          {isSelected && <Check className="w-5 h-5 text-emerald-600" />}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <LimitReachedModal 
        isOpen={showLimitModal} 
        onClose={() => setShowLimitModal(false)} 
        type="post" 
      />
    </>
  );
}
