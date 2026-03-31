import React, { useState, useEffect } from 'react';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, Timestamp, doc, getDoc, where } from 'firebase/firestore';
import { PostForm } from '../components/PostForm';
import { PostCard, Post } from '../components/PostCard';
import { SlimBannerAd, LargeBannerAd } from '../components/AdSystem';
import { Bell, Plus, Search } from 'lucide-react';
import { StoryCreationModal } from '../components/StoryCreationModal';
import { StoryViewer } from '../components/StoryViewer';
import { LoginRequiredModal } from '../components/LoginRequiredModal';
import { LimitReachedModal } from '../components/LimitReachedModal';
import { useSocialLimits } from '../hooks/useSocialLimits';
import { useNotifications } from '../hooks/useNotifications';
import { DEMO_POSTS } from '../constants/demoPosts';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';

import { getFriendlyErrorMessage } from '@/lib/errorUtils';

export function Social({ onNavigate, onNavigateToProfile }: { onNavigate?: (tab: string) => void, onNavigateToProfile?: (uid: string) => void }) {
  const [user, setUser] = useState<any>(undefined); // undefined: checking auth, null: guest, object: logged in
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [viewingStoryIndex, setViewingStoryIndex] = useState<number | null>(null);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showStoryLimitModal, setShowStoryLimitModal] = useState(false);
  const { checkLimit } = useSocialLimits();
  const { unreadCount } = useNotifications();

  useEffect(() => {
    const isAnyModalOpen = isStoryModalOpen || viewingStoryIndex !== null;
    
    if (isAnyModalOpen) {
      window.history.pushState({ modal: 'story' }, '', '');
      
      const handlePopState = () => {
        if (isStoryModalOpen) setIsStoryModalOpen(false);
        if (viewingStoryIndex !== null) setViewingStoryIndex(null);
      };
      
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [isStoryModalOpen, viewingStoryIndex]);

  useEffect(() => {
    let unsubscribeFollowing: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (unsubscribeFollowing) {
        unsubscribeFollowing();
        unsubscribeFollowing = null;
      }

      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists() && userDoc.data().blockedUsers) {
            setBlockedUsers(userDoc.data().blockedUsers);
          }
          
          // Fetch following
          const followingQuery = query(collection(db, 'follows'), where('follower_id', '==', user.uid));
          unsubscribeFollowing = onSnapshot(followingQuery, (snapshot) => {
            setFollowing(snapshot.docs.map(doc => doc.data().following_id));
          }, (err) => {
            handleFirestoreError(err, OperationType.LIST, 'follows');
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
        }
      } else {
        setBlockedUsers([]);
        setFollowing([]);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeFollowing) unsubscribeFollowing();
    };
  }, []);

  useEffect(() => {
    if (user === undefined) return;

    if (user === null) {
      setPosts(DEMO_POSTS);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      
      setPosts(postsData);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'posts');
      setError(getFriendlyErrorMessage(err));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (user === undefined || user === null) {
      setStories([]);
      return;
    }

    // Fetch stories from the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const q = query(
      collection(db, 'stories'),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const storiesData = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter((story: any) => {
          // Client-side filtering for 24 hours
          if (!story.createdAt) return true; // Keep optimistic updates
          return story.createdAt.toDate() > twentyFourHoursAgo;
        });
      
      setStories(storiesData);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'stories');
    });

    return () => unsubscribe();
  }, [user]);

  // Filter out blocked users and apply privacy rules
  const filteredStories = stories.filter(s => {
    if (blockedUsers.includes(s.authorUid)) return false;
    
    // Privacy rules
    if (s.privacy === 'personal' && s.authorUid !== user?.uid) return false;
    if (s.privacy === 'friends' && s.authorUid !== user?.uid && !following.includes(s.authorUid)) return false;
    
    return true;
  });
  const filteredPosts = posts.filter(p => !blockedUsers.includes(p.authorUid));

  // Group stories by user for the top bar
  const uniqueStoryUsers = Array.from<string>(new Set(filteredStories.map(s => s.authorUid as string)))
    .map(uid => {
      const userStories = filteredStories.filter(s => s.authorUid === uid);
      return {
        uid,
        authorName: userStories[0].authorName,
        authorAvatarUrl: userStories[0].authorAvatarUrl,
        stories: userStories.reverse() // Chronological order for viewing
      };
    });

  const handleStoryClick = (uid: string) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    const userIndex = uniqueStoryUsers.findIndex(u => u.uid === uid);
    if (userIndex !== -1) {
      setViewingStoryIndex(userIndex);
    }
  };

  const handleAddStoryClick = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (!checkLimit('story')) {
      setShowStoryLimitModal(true);
      return;
    }

    setIsStoryModalOpen(true);
  };

  return (
    <div className="bg-slate-100 dark:bg-slate-950 min-h-full pb-8">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 pt-safe pb-3">
        <div className="max-w-2xl mx-auto px-4 flex items-center justify-between w-full">
          <div className="flex items-center space-x-3">
            <h1 className="text-base font-bold text-primary dark:text-primary-light font-serif">Muslim Sathi</h1>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => onNavigate?.('search')}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Search className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
            <button 
              onClick={() => onNavigate?.('notifications')}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
            >
              <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-900 animate-pulse"></span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Stories Section (Facebook Style) */}
        <div className="bg-white dark:bg-slate-900 shadow-sm mb-2 py-3 px-2 overflow-x-auto scrollbar-hide flex space-x-3">
          {/* Add Story Button */}
          <div className="flex flex-col items-center space-y-1 flex-shrink-0 ml-2">
            <button 
              onClick={handleAddStoryClick}
              className="relative w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700"
            >
              <Plus className="w-6 h-6 text-slate-500 dark:text-slate-400" />
              {user?.photoURL && (
                <img src={user.photoURL} alt="You" className="absolute inset-0 w-full h-full rounded-full object-cover opacity-50" referrerPolicy="no-referrer" />
              )}
            </button>
            <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">Add Story</span>
          </div>

          {/* Story Items */}
          {uniqueStoryUsers.map((storyUser) => (
            <div key={storyUser.uid} className="flex flex-col items-center space-y-1 flex-shrink-0 cursor-pointer" onClick={() => handleStoryClick(storyUser.uid)}>
              <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-primary to-primary-light">
                <div className="w-full h-full rounded-full border-2 border-white dark:border-slate-900 overflow-hidden bg-white dark:bg-slate-800 flex items-center justify-center">
                  {storyUser.authorAvatarUrl ? (
                    <img src={storyUser.authorAvatarUrl} alt={storyUser.authorName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="text-lg font-bold text-primary">{storyUser.authorName.charAt(0).toUpperCase()}</span>
                  )}
                </div>
              </div>
              <span className="text-[10px] font-medium text-slate-700 dark:text-slate-300 w-16 truncate text-center">
                {storyUser.authorName.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>

        <div onClick={!user ? () => setShowLoginModal(true) : undefined}>
          <PostForm onAddStoryClick={handleAddStoryClick} onRequireLogin={() => setShowLoginModal(true)} />
        </div>
        
        {loading && (
          <div className="space-y-4 px-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 animate-pulse">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-5/6"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-4/6"></div>
                </div>
                <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-16"></div>
                  <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-16"></div>
                  <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl mb-4 mx-2">
            {error}
          </div>
        )}

        {!loading && !error && filteredPosts.length === 0 && (
          <div className="text-center py-8 text-slate-500 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 mx-2">
            এখনো কোনো পোস্ট নেই। প্রথম পোস্টটি আপনিই করুন!
          </div>
        )}

        <div className="px-0 sm:px-2">
          {!loading && !error && filteredPosts.map((post, index) => (
            <React.Fragment key={post.id}>
              <PostCard 
                post={post} 
                currentUser={user} 
                onRequireLogin={() => setShowLoginModal(true)} 
                onNavigateToProfile={onNavigateToProfile}
              />
              <div className="px-2 mb-4">
                <SlimBannerAd category="social" />
              </div>
              {(index + 1) % 5 === 0 && (
                <div className="px-2 mb-4">
                  <LargeBannerAd category="social" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <LoginRequiredModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
        onNavigate={onNavigate}
      />

      <StoryCreationModal 
        isOpen={isStoryModalOpen} 
        onClose={() => setIsStoryModalOpen(false)} 
        onSuccess={() => setIsStoryModalOpen(false)}
      />

      {viewingStoryIndex !== null && (
        <StoryViewer 
          groupedStories={uniqueStoryUsers} 
          initialUserIndex={viewingStoryIndex} 
          onClose={() => setViewingStoryIndex(null)} 
        />
      )}

      <LimitReachedModal 
        isOpen={showStoryLimitModal} 
        onClose={() => setShowStoryLimitModal(false)} 
        type="story" 
      />
    </div>
  );
}
