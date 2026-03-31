import { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { X, MapPin, Tag, ChevronDown, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UnifiedLocationSearch } from './UnifiedLocationSearch';
import { LocationModal } from './LocationModal';
import { useLocation } from '@/hooks/useLocation';
import { useLanguage } from '@/contexts/LanguageContext';
import { Post } from './PostCard';

const CATEGORIES = [
  { id: 'দোয়া চাই', label: '🤲 দোয়া চাই', color: 'bg-emerald-50 text-emerald-600' },
  { id: 'হাদিস', label: '📖 হাদিস', color: 'bg-blue-50 text-blue-600' },
  { id: 'কুরআনের আয়াত', label: '🕋 কুরআনের আয়াত', color: 'bg-amber-50 text-amber-600' },
  { id: 'ইসলামিক উপদেশ', label: '💡 ইসলামিক উপদেশ', color: 'bg-purple-50 text-purple-600' },
  { id: 'ছোট গল্প', label: '✍️ ছোট গল্প', color: 'bg-rose-50 text-rose-600' },
];

interface PostEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post;
}

export function PostEditModal({ isOpen, onClose, post }: PostEditModalProps) {
  const { language } = useLanguage();
  const { latitude: currentLat, longitude: currentLon, country: currentCountry, city: currentCity } = useLocation(language);
  const [content, setContent] = useState(post.content);
  const [type, setType] = useState(post.type);
  const [location, setLocation] = useState(post.location || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setContent(post.content);
      setType(post.type);
      setLocation(post.location || '');
    }
  }, [isOpen, post]);

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const postRef = doc(db, 'posts', post.id);
      await updateDoc(postRef, {
        content: content.trim(),
        type: type,
        location: location,
      });

      alert("পোস্ট সফলভাবে আপডেট করা হয়েছে!");
      onClose();
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, `posts/${post.id}`);
      alert("আপডেট করা সম্ভব হয়নি।");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 z-[1000] bg-white dark:bg-slate-950 flex flex-col"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-3">
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-slate-700 dark:text-slate-200" />
              </button>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">পোস্ট এডিট করুন</h2>
            </div>
            <button 
              onClick={handleSubmit}
              disabled={!content.trim() || isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-5 py-1.5 rounded-full font-bold text-sm transition-colors"
            >
              {isSubmitting ? 'আপডেট হচ্ছে...' : 'আপডেট'}
            </button>
          </div>

          {/* Modal Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* User Info */}
            <div className="flex items-center space-x-3 mb-4">
              {post.authorAvatarUrl ? (
                <img 
                  src={post.authorAvatarUrl} 
                  alt={post.authorName} 
                  className="w-12 h-12 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-xl">
                  {post.authorName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white leading-tight">{post.authorName}</h3>
                <div className="flex items-center space-x-2 mt-1">
                  <button 
                    onClick={() => setShowCategoryPicker(true)}
                    className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-[11px] font-bold text-slate-600 dark:text-slate-400"
                  >
                    <span>{CATEGORIES.find(c => c.id === type)?.label || type}</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={() => setShowLocationPicker(true)}
                    className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-[11px] font-bold text-slate-600 dark:text-slate-400"
                  >
                    <MapPin className="w-3 h-3" />
                    <span>{location || 'লোকেশন যোগ করুন'}</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Text Area */}
            <textarea
              autoFocus
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="আপনার মনে কী চলছে?"
              className="w-full bg-transparent text-slate-900 dark:text-white text-xl outline-none resize-none placeholder-slate-400 min-h-[200px]"
            />
          </div>

          {/* Bottom Toolbar */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-sm">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">আপনার পোস্টে যোগ করুন</span>
              <div className="flex items-center space-x-4">
                <button onClick={() => setShowLocationPicker(true)} className="text-rose-500 flex items-center space-x-1">
                  <MapPin className="w-6 h-6" />
                  <span className="text-xs font-bold hidden sm:inline">লোকেশন</span>
                </button>
                <button onClick={() => setShowCategoryPicker(true)} className="text-emerald-500 flex items-center space-x-1">
                  <Tag className="w-6 h-6" />
                  <span className="text-xs font-bold hidden sm:inline">ক্যাটাগরি</span>
                </button>
              </div>
            </div>
          </div>

          {/* Category Picker Overlay */}
          <AnimatePresence>
            {showCategoryPicker && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[110] bg-black/60 flex items-end"
                onClick={() => setShowCategoryPicker(false)}
              >
                <motion.div 
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  className="w-full bg-white dark:bg-slate-900 rounded-t-3xl p-6"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">ক্যাটাগরি সিলেক্ট করুন</h3>
                    <button onClick={() => setShowCategoryPicker(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setType(cat.id);
                          setShowCategoryPicker(false);
                        }}
                        className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                          type === cat.id 
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' 
                            : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50'
                        }`}
                      >
                        <span className="font-bold text-slate-800 dark:text-slate-200">{cat.label}</span>
                        {type === cat.id && <div className="w-3 h-3 bg-emerald-500 rounded-full" />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Location Modal */}
          <LocationModal
            isOpen={showLocationPicker}
            onClose={() => setShowLocationPicker(false)}
            onSelect={(loc) => {
              setLocation(`${loc.city}, ${loc.country}`);
              setShowLocationPicker(false);
            }}
            currentCountry={location.split(', ')[1] || currentCountry}
            currentCity={location.split(', ')[0] || currentCity}
            currentLat={currentLat}
            currentLon={currentLon}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
