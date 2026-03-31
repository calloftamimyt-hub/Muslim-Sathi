import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Type, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Send, Globe, Users, Lock, ChevronDown } from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Capacitor } from '@capacitor/core';
import { cn } from '@/lib/utils';
import { useSocialLimits } from '@/hooks/useSocialLimits';

const BACKGROUNDS = [
  'bg-slate-900',
  'bg-emerald-600',
  'bg-blue-600',
  'bg-purple-600',
  'bg-rose-600',
  'bg-gradient-to-br from-purple-500 to-pink-500',
  'bg-gradient-to-br from-emerald-400 to-cyan-500',
  'bg-gradient-to-br from-amber-400 to-orange-500',
  'bg-gradient-to-br from-blue-500 to-indigo-600',
  'bg-gradient-to-br from-slate-800 to-slate-900',
  'bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500',
  'bg-gradient-to-br from-rose-400 via-fuchsia-500 to-indigo-500',
  'bg-gradient-to-bl from-teal-400 to-yellow-200',
  'bg-gradient-to-r from-red-500 to-orange-500',
  'bg-gradient-to-br from-gray-700 via-gray-900 to-black',
  'bg-gradient-to-t from-green-300 via-blue-500 to-purple-600',
  'bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500',
  'bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500',
  'bg-gradient-to-br from-cyan-500 to-blue-500',
  'bg-gradient-to-br from-indigo-500 to-cyan-500'
];

const FONTS = [
  { name: 'Default', class: 'font-sans' },
  { name: 'Serif', class: 'font-serif' },
  { name: 'Mono', class: 'font-mono' },
];

interface StoryCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function StoryCreationModal({ isOpen, onClose, onSuccess }: StoryCreationModalProps) {
  const [text, setText] = useState('');
  const [bgIndex, setBgIndex] = useState(5); // Default gradient
  const [fontIndex, setFontIndex] = useState(0);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');
  const [isBold, setIsBold] = useState(true);
  const [isItalic, setIsItalic] = useState(false);
  const [privacy, setPrivacy] = useState<'public' | 'friends' | 'personal'>('public');
  const [isPrivacyMenuOpen, setIsPrivacyMenuOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { incrementCount } = useSocialLimits();

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!text.trim() || isSubmitting) return;
    
    const user = auth.currentUser;
    if (!user) {
      alert("দয়া করে লগ-ইন করুন।");
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'stories'), {
        authorUid: user.uid,
        authorName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        authorAvatarUrl: user.photoURL || '',
        text: text.trim(),
        backgroundColor: BACKGROUNDS[bgIndex],
        textStyle: {
          fontFamily: FONTS[fontIndex].class,
          textAlign,
          isBold,
          isItalic,
          fontSize: text.length > 100 ? 'text-2xl' : text.length > 50 ? 'text-3xl' : 'text-4xl'
        },
        privacy,
        views: [],
        reactions: [],
        createdAt: serverTimestamp()
      });

      setText('');
      
      // Increment daily story count
      await incrementCount('story');
      
      onSuccess();
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'stories');
      alert("স্টোরি আপলোড করতে সমস্যা হয়েছে।");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentBg = BACKGROUNDS[bgIndex];
  const currentFont = FONTS[fontIndex].class;
  const currentSize = text.length > 100 ? 'text-2xl' : text.length > 50 ? 'text-3xl' : 'text-4xl';

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: '100%' }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-0 z-[1000] bg-black flex flex-col"
      >
        {/* Top Bar */}
        <div className={cn(
          "absolute top-0 left-0 right-0 px-4 pb-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/50 to-transparent",
          Capacitor.isNativePlatform() ? "pt-12" : "pt-4"
        )}>
          <button onClick={onClose} className="p-2 bg-black/20 hover:bg-black/40 rounded-full text-white backdrop-blur-sm transition-colors">
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex space-x-2">
            <button 
              onClick={() => setFontIndex((prev) => (prev + 1) % FONTS.length)}
              className="p-2 bg-black/20 hover:bg-black/40 rounded-full text-white backdrop-blur-sm transition-colors"
            >
              <Type className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setTextAlign(prev => prev === 'left' ? 'center' : prev === 'center' ? 'right' : 'left')}
              className="p-2 bg-black/20 hover:bg-black/40 rounded-full text-white backdrop-blur-sm transition-colors"
            >
              {textAlign === 'left' ? <AlignLeft className="w-5 h-5" /> : textAlign === 'center' ? <AlignCenter className="w-5 h-5" /> : <AlignRight className="w-5 h-5" />}
            </button>
            <button 
              onClick={() => setIsBold(!isBold)}
              className={`p-2 rounded-full text-white backdrop-blur-sm transition-colors ${isBold ? 'bg-white/40' : 'bg-black/20 hover:bg-black/40'}`}
            >
              <Bold className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsItalic(!isItalic)}
              className={`p-2 rounded-full text-white backdrop-blur-sm transition-colors ${isItalic ? 'bg-white/40' : 'bg-black/20 hover:bg-black/40'}`}
            >
              <Italic className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Editing Area */}
        <div className={`flex-1 flex items-center justify-center p-6 ${currentBg} transition-colors duration-500 relative`}>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="এখানে লিখুন..."
            className={`w-full bg-transparent text-white placeholder-white/50 resize-none outline-none overflow-hidden z-10 relative ${currentFont} ${currentSize} ${isBold ? 'font-bold' : 'font-normal'} ${isItalic ? 'italic' : ''}`}
            style={{ textAlign }}
            rows={5}
          />
        </div>

        {/* Bottom Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-6 pb-safe bg-gradient-to-t from-black/90 via-black/60 to-transparent z-20">
          <div className="flex flex-col space-y-6">
            {/* Privacy Selector */}
            <div className="flex items-center justify-start">
              <div className="relative">
                <button 
                  onClick={() => setIsPrivacyMenuOpen(!isPrivacyMenuOpen)}
                  className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full text-sm backdrop-blur-xl transition-all border border-white/20 shadow-lg"
                >
                  {privacy === 'public' && <Globe className="w-4 h-4 text-emerald-400" />}
                  {privacy === 'friends' && <Users className="w-4 h-4 text-blue-400" />}
                  {privacy === 'personal' && <Lock className="w-4 h-4 text-rose-400" />}
                  <span className="font-semibold tracking-wide uppercase text-[10px]">
                    {privacy === 'public' ? 'Public' : privacy === 'friends' ? 'Friends' : 'Only Me'}
                  </span>
                  <ChevronDown className="w-4 h-4 opacity-70" />
                </button>

                {isPrivacyMenuOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-full left-0 mb-3 w-56 bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
                  >
                    <button 
                      onClick={() => { setPrivacy('public'); setIsPrivacyMenuOpen(false); }}
                      className="flex items-center space-x-3 w-full p-4 hover:bg-white/5 text-left transition-colors"
                    >
                      <div className="bg-emerald-500/20 p-2 rounded-full"><Globe className="w-4 h-4 text-emerald-400" /></div>
                      <div>
                        <p className="text-white text-sm font-bold">Public</p>
                        <p className="text-slate-400 text-[10px]">Anyone can see</p>
                      </div>
                    </button>
                    <button 
                      onClick={() => { setPrivacy('friends'); setIsPrivacyMenuOpen(false); }}
                      className="flex items-center space-x-3 w-full p-4 hover:bg-white/5 text-left transition-colors border-t border-white/5"
                    >
                      <div className="bg-blue-500/20 p-2 rounded-full"><Users className="w-4 h-4 text-blue-400" /></div>
                      <div>
                        <p className="text-white text-sm font-bold">Friends</p>
                        <p className="text-slate-400 text-[10px]">Only followers</p>
                      </div>
                    </button>
                    <button 
                      onClick={() => { setPrivacy('personal'); setIsPrivacyMenuOpen(false); }}
                      className="flex items-center space-x-3 w-full p-4 hover:bg-white/5 text-left transition-colors border-t border-white/5"
                    >
                      <div className="bg-rose-500/20 p-2 rounded-full"><Lock className="w-4 h-4 text-rose-400" /></div>
                      <div>
                        <p className="text-white text-sm font-bold">Only Me</p>
                        <p className="text-slate-400 text-[10px]">Private story</p>
                      </div>
                    </button>
                  </motion.div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              {/* Color Picker Container */}
              <div className="flex-1 overflow-hidden">
                <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-2 ml-1">Background Color</p>
                <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide items-center">
                  {BACKGROUNDS.map((bg, idx) => (
                    <button
                      key={idx}
                      onClick={() => setBgIndex(idx)}
                      className={cn(
                        "w-8 h-8 rounded-full flex-shrink-0 border-2 transition-all duration-300 shadow-inner",
                        bg,
                        bgIndex === idx ? 'border-white scale-125 z-10 shadow-white/20' : 'border-white/10 scale-100 hover:scale-110'
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* Share Button */}
              <div className="flex flex-col items-center justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={!text.trim() || isSubmitting}
                  className={cn(
                    "flex items-center justify-center space-x-2 bg-white text-black px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-tighter shadow-[0_8px_30px_rgb(255,255,255,0.2)] transition-all active:scale-95 disabled:opacity-30 disabled:grayscale",
                    isSubmitting ? "animate-pulse" : "hover:bg-emerald-400 hover:text-white"
                  )}
                >
                  <span>{isSubmitting ? 'Posting' : 'Share'}</span>
                  {!isSubmitting && <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
