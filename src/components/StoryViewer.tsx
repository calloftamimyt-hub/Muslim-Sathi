import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Eye, Heart, AlertTriangle, Trash2, MoreVertical } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { cn } from '@/lib/utils';
import { auth, db } from '../lib/firebase';
import { doc, updateDoc, arrayUnion, deleteDoc } from 'firebase/firestore';

interface Story {
  id: string;
  authorUid: string;
  authorName: string;
  authorAvatarUrl: string;
  text: string;
  backgroundColor: string;
  backgroundImage?: string;
  textStyle: {
    fontFamily: string;
    textAlign: 'left' | 'center' | 'right';
    isBold: boolean;
    isItalic: boolean;
    fontSize: string;
  };
  privacy?: 'public' | 'friends' | 'personal';
  views?: string[];
  reactions?: { uid: string, emoji: string }[];
  createdAt: any;
}

interface GroupedStory {
  uid: string;
  authorName: string;
  authorAvatarUrl: string;
  stories: Story[];
}

interface StoryViewerProps {
  groupedStories: GroupedStory[];
  initialUserIndex: number;
  onClose: () => void;
}

const STORY_DURATION = 5000; // 5 seconds per story

export function StoryViewer({ groupedStories, initialUserIndex, onClose }: StoryViewerProps) {
  const [currentUserIndex, setCurrentUserIndex] = useState(initialUserIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  
  const currentUser = groupedStories[currentUserIndex];
  const currentStory = currentUser?.stories[currentStoryIndex];
  const isOwner = auth.currentUser?.uid === currentStory?.authorUid;

  // Record view
  useEffect(() => {
    if (!currentStory || !auth.currentUser || isOwner) return;
    
    const recordView = async () => {
      if (!currentStory.views?.includes(auth.currentUser!.uid)) {
        try {
          await updateDoc(doc(db, 'stories', currentStory.id), {
            views: arrayUnion(auth.currentUser!.uid)
          });
        } catch (e) {
          console.error("Error recording view", e);
        }
      }
    };
    recordView();
  }, [currentStory?.id]);

  useEffect(() => {
    if (!currentUser || isPaused) return;

    const timer = setInterval(() => {
      setProgress((prev) => prev + (100 / (STORY_DURATION / 50)));
    }, 50);

    return () => clearInterval(timer);
  }, [currentUserIndex, currentStoryIndex, isPaused, currentUser]);

  useEffect(() => {
    if (progress >= 100) {
      handleNext();
    }
  }, [progress]);

  const handleNext = () => {
    if (!currentUser) return;
    
    if (currentStoryIndex < currentUser.stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
      setProgress(0);
    } else if (currentUserIndex < groupedStories.length - 1) {
      setCurrentUserIndex(prev => prev + 1);
      setCurrentStoryIndex(0);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (!currentUser) return;

    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
      setProgress(0);
    } else if (currentUserIndex > 0) {
      setCurrentUserIndex(prev => prev - 1);
      setCurrentStoryIndex(groupedStories[currentUserIndex - 1].stories.length - 1);
      setProgress(0);
    }
  };

  const handleReaction = async (emoji: string) => {
    if (!currentStory || !auth.currentUser) return;
    
    try {
      await updateDoc(doc(db, 'stories', currentStory.id), {
        reactions: arrayUnion({ uid: auth.currentUser.uid, emoji })
      });
      setShowReactions(false);
      setIsPaused(false);
    } catch (e) {
      console.error("Error adding reaction", e);
    }
  };

  const handleDelete = async () => {
    if (!currentStory || !isOwner) return;
    
    if (window.confirm('Are you sure you want to delete this story?')) {
      try {
        await deleteDoc(doc(db, 'stories', currentStory.id));
        handleNext(); // Move to next story or close if it was the last one
      } catch (e) {
        console.error("Error deleting story", e);
      }
    }
  };

  const handleReport = () => {
    alert('Story reported. Thank you for keeping the community safe.');
    setShowMenu(false);
    setIsPaused(false);
  };

  if (!currentUser || !currentStory) return null;

  const { backgroundColor, backgroundImage, textStyle, text, createdAt } = currentStory;
  const initial = currentUser.authorName.charAt(0).toUpperCase();

  // Format time ago
  const timeAgo = () => {
    if (!createdAt) return 'Just now';
    const seconds = Math.floor((new Date().getTime() - createdAt.toDate().getTime()) / 1000);
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h`;
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        drag
        dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
        onDragEnd={(e, { offset, velocity }) => {
          if (offset.y > 100 || velocity.y > 500) {
            onClose();
          } else if (offset.x < -100 || velocity.x < -500) {
            // Skip to next user
            if (currentUserIndex < groupedStories.length - 1) {
              setCurrentUserIndex(prev => prev + 1);
              setCurrentStoryIndex(0);
              setProgress(0);
            } else {
              onClose();
            }
          } else if (offset.x > 100 || velocity.x > 500) {
            // Skip to prev user
            if (currentUserIndex > 0) {
              setCurrentUserIndex(prev => prev - 1);
              setCurrentStoryIndex(0);
              setProgress(0);
            }
          }
        }}
        className="fixed inset-0 z-[300] bg-black flex flex-col"
      >
        {/* Progress Bars */}
        <div className={cn(
          "absolute top-0 left-0 right-0 z-20 flex space-x-1 px-2 pb-2 bg-gradient-to-b from-black/60 to-transparent",
          Capacitor.isNativePlatform() ? "pt-12" : "pt-4"
        )}>
          {currentUser.stories.map((_, idx) => (
            <div key={idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-75 ease-linear"
                style={{ 
                  width: idx === currentStoryIndex ? `${progress}%` : idx < currentStoryIndex ? '100%' : '0%' 
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className={cn(
          "absolute left-0 right-0 z-20 flex items-center justify-between px-4",
          Capacitor.isNativePlatform() ? "top-16" : "top-8"
        )}>
          <div className="flex items-center space-x-3">
            {currentUser.authorAvatarUrl ? (
              <img src={currentUser.authorAvatarUrl} alt={currentUser.authorName} className="w-10 h-10 rounded-full border-2 border-white/20 object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold border-2 border-white/20">
                {initial}
              </div>
            )}
            <div>
              <p className="text-white font-bold text-sm drop-shadow-md">{currentUser.authorName}</p>
              <p className="text-white/70 text-xs drop-shadow-md">{timeAgo()}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="relative">
              <button 
                onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); setIsPaused(!showMenu); }} 
                className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              
              {showMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-xl overflow-hidden z-50">
                  {isOwner ? (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                      className="w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center"
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Delete Story
                    </button>
                  ) : (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleReport(); }}
                      className="w-full text-left px-4 py-3 text-sm text-amber-600 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center"
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" /> Report Story
                    </button>
                  )}
                </div>
              )}
            </div>
            <button onClick={onClose} className="p-2 text-white hover:bg-white/20 rounded-full transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tap Areas for Navigation */}
        <div className="absolute inset-0 z-10 flex">
          <div className="w-1/3 h-full" onClick={handlePrev} />
          <div className="w-2/3 h-full" onClick={handleNext} />
        </div>

        {/* Content */}
        <div 
          className={`flex-1 flex items-center justify-center p-8 ${!backgroundImage ? backgroundColor : ''} transition-colors duration-300 relative overflow-hidden`}
          onPointerDown={() => setIsPaused(true)}
          onPointerUp={() => setIsPaused(false)}
          onPointerLeave={() => setIsPaused(false)}
        >
          {backgroundImage && (
            <div 
              className="absolute inset-0 bg-cover bg-center z-0" 
              style={{ backgroundImage: `url(${backgroundImage})` }} 
            />
          )}
          {backgroundImage && text && (
            <div className="absolute inset-0 bg-black/40 z-0" />
          )}
          <p 
            className={`text-white drop-shadow-lg whitespace-pre-wrap ${textStyle.fontFamily} ${textStyle.fontSize} ${textStyle.isBold ? 'font-bold' : 'font-normal'} ${textStyle.isItalic ? 'italic' : ''} z-10 relative`}
            style={{ textAlign: textStyle.textAlign }}
          >
            {text}
          </p>
        </div>

        {/* Bottom Bar (Views & Reactions) */}
        <div className="absolute bottom-0 left-0 right-0 p-4 z-20 bg-gradient-to-t from-black/80 to-transparent flex justify-between items-end">
          {/* View Count */}
          <div className="flex items-center space-x-1 text-white/80 bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-sm">
            <Eye className="w-4 h-4" />
            <span className="text-xs font-medium">{currentStory.views?.length || 0}</span>
          </div>

          {/* Reactions */}
          {!isOwner ? (
            <div className="relative">
              {showReactions && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-full right-0 mb-4 bg-white dark:bg-slate-900 p-2 rounded-full shadow-xl flex space-x-2"
                >
                  {['❤️', '🤲', '✨', '😢', '👏'].map(emoji => (
                    <button 
                      key={emoji}
                      onClick={(e) => { e.stopPropagation(); handleReaction(emoji); }}
                      className="w-10 h-10 flex items-center justify-center text-2xl hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </motion.div>
              )}
              
              <button 
                onClick={(e) => { e.stopPropagation(); setShowReactions(!showReactions); setIsPaused(!showReactions); }}
                className="w-12 h-12 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors border border-white/20"
              >
                <Heart className="w-6 h-6" />
              </button>
            </div>
          ) : (
            <div className="flex -space-x-2">
              {currentStory.reactions && currentStory.reactions.slice(0, 5).map((reaction, idx) => (
                <div key={idx} className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-sm border-2 border-black/50 z-10">
                  {reaction.emoji}
                </div>
              ))}
              {currentStory.reactions && currentStory.reactions.length > 5 && (
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold border-2 border-black/50 z-0">
                  +{currentStory.reactions.length - 5}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
