import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, query, where, orderBy, getDocs, getCountFromServer, doc, getDoc, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { PostCard, Post } from '../../components/PostCard';
import { ArrowLeft, Users, UserCheck, MessageSquare, UserPlus } from 'lucide-react';
import { motion } from 'motion/react';
import { Capacitor } from '@capacitor/core';
import { cn } from '@/lib/utils';

interface MyPostsProps {
  onBack: () => void;
  targetUserId?: string; // If provided, view this user's profile
  currentUser?: any; // The logged-in user
  onNavigateToProfile?: (uid: string) => void;
}

export function MyPosts({ onBack, targetUserId, currentUser, onNavigateToProfile }: MyPostsProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ followers: 0, following: 0 });
  const [username, setUsername] = useState('');
  const [profileUser, setProfileUser] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  const effectiveUserId = targetUserId || (currentUser?.id || currentUser?.uid);
  const isOwnProfile = !targetUserId || targetUserId === (currentUser?.id || currentUser?.uid);

  useEffect(() => {
    if (effectiveUserId) {
      fetchProfileData();
      fetchMyPosts();
      fetchFollowStats();
      if (!isOwnProfile && currentUser) {
        checkFollowStatus();
      }
    }
  }, [effectiveUserId, currentUser]);

  const fetchProfileData = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', effectiveUserId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setProfileUser({
          uid: effectiveUserId,
          displayName: data.displayName || data.name || 'ব্যবহারকারী',
          photoURL: data.photoURL || data.avatarUrl || '',
          ...data
        });
        setUsername(data.username || '');
      } else if (effectiveUserId.startsWith('demo-')) {
        // Handle demo users if needed
        setProfileUser({
          uid: effectiveUserId,
          displayName: 'Demo User',
          photoURL: ''
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${effectiveUserId}`);
    }
  };

  const checkFollowStatus = async () => {
    if (!currentUser) return;
    try {
      const q = query(
        collection(db, 'follows'),
        where('follower_id', '==', currentUser.uid),
        where('following_id', '==', effectiveUserId)
      );
      const snapshot = await getDocs(q);
      setIsFollowing(!snapshot.empty);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'follows');
    }
  };

  const handleToggleFollow = async () => {
    if (!currentUser) {
      alert("অনুসরণ করতে লগ-ইন করুন।");
      return;
    }
    setIsFollowLoading(true);
    try {
      if (isFollowing) {
        const q = query(
          collection(db, 'follows'),
          where('follower_id', '==', currentUser.uid),
          where('following_id', '==', effectiveUserId)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          await deleteDoc(doc(db, 'follows', snapshot.docs[0].id));
          setIsFollowing(false);
          setStats(prev => ({ ...prev, followers: Math.max(0, prev.followers - 1) }));
        }
      } else {
        await addDoc(collection(db, 'follows'), {
          follower_id: currentUser.uid,
          following_id: effectiveUserId,
          createdAt: serverTimestamp()
        });
        setIsFollowing(true);
        setStats(prev => ({ ...prev, followers: prev.followers + 1 }));
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'follows');
    } finally {
      setIsFollowLoading(false);
    }
  };

  const fetchMyPosts = async () => {
    const path = 'posts';
    try {
      setLoading(true);
      const q = query(
        collection(db, 'posts'),
        where('authorUid', '==', effectiveUserId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Post[];
      setPosts(postsData);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
      setError("পোস্টগুলো লোড করতে সমস্যা হচ্ছে।");
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowStats = async () => {
    const path = 'follows';
    try {
      const followersQuery = query(collection(db, 'follows'), where('following_id', '==', effectiveUserId));
      const followersSnapshot = await getCountFromServer(followersQuery);
      const followersCount = followersSnapshot.data().count;

      const followingQuery = query(collection(db, 'follows'), where('follower_id', '==', effectiveUserId));
      const followingSnapshot = await getCountFromServer(followingQuery);
      const followingCount = followingSnapshot.data().count;

      setStats({
        followers: followersCount || 0,
        following: followingCount || 0
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    }
  };

  if (!effectiveUserId && !loading) {
    return (
      <div className="fixed inset-0 z-[100] bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <MessageSquare className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">ইউজার পাওয়া যায়নি</h2>
        <button onClick={onBack} className="px-6 py-2 bg-emerald-600 text-white rounded-full font-bold">ফিরে যান</button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="fixed inset-0 z-[100] bg-slate-50 dark:bg-slate-950 overflow-y-auto pb-10"
    >
      {/* Header */}
      <div className={cn(
        "sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 pb-3 flex items-center",
        "pt-safe"
      )}>
        <button 
          onClick={onBack}
          className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-slate-600 dark:text-slate-300" />
        </button>
        <h1 className="ml-2 text-lg font-bold text-slate-800 dark:text-white flex-1 truncate">
          {isOwnProfile ? 'আমার পোস্ট' : (profileUser?.displayName || 'প্রোফাইল')}
        </h1>
        {!isOwnProfile && currentUser && (
          <button 
            onClick={handleToggleFollow}
            disabled={isFollowLoading}
            className={cn(
              "ml-2 px-3 py-1 rounded-full text-[11px] font-bold transition-all flex items-center space-x-1 shrink-0",
              isFollowing 
                ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300" 
                : "bg-emerald-600 text-white shadow-sm"
            )}
          >
            {isFollowing ? (
              <><UserCheck className="w-3 h-3" /> <span>আনফলো</span></>
            ) : (
              <><UserPlus className="w-3 h-3" /> <span>ফলো</span></>
            )}
          </button>
        )}
      </div>

      {/* Profile Info Section */}
      <div className="bg-white dark:bg-slate-900 px-4 py-6 border-b border-slate-200 dark:border-slate-800 mb-2">
        <div className="flex items-start space-x-4">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full border-2 border-emerald-100 dark:border-emerald-900/30 overflow-hidden shrink-0">
            {profileUser?.photoURL ? (
              <img 
                src={profileUser.photoURL} 
                alt="Profile" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-2xl">
                {(profileUser?.displayName || 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Name & Stats */}
          <div className="flex-1 pt-1">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {profileUser?.displayName || 'ব্যবহারকারী'}
              </h2>
              {!isOwnProfile && currentUser && (
                <button 
                  onClick={handleToggleFollow}
                  disabled={isFollowLoading}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center space-x-1",
                    isFollowing 
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300" 
                      : "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                  )}
                >
                  {isFollowing ? (
                    <><UserCheck className="w-3 h-3" /> <span>আনফলো</span></>
                  ) : (
                    <><UserPlus className="w-3 h-3" /> <span>ফলো</span></>
                  )}
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 font-mono">
              @{username || effectiveUserId.slice(0, 8)}
            </p>
            
            <div className="flex space-x-6">
              <div className="text-center">
                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 leading-none">{stats.followers}</p>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">ফলোয়ার</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 leading-none">{stats.following}</p>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">ফলোয়িং</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 leading-none">{posts.length}</p>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">পোস্ট</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Posts List */}
      <div className="max-w-2xl mx-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : error ? (
          <div className="p-4 text-center text-rose-500 bg-rose-50 dark:bg-rose-900/10 rounded-xl m-4">
            {error}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 px-6 bg-white dark:bg-slate-900 m-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">কোনো পোস্ট পাওয়া যায়নি।</p>
          </div>
        ) : (
          <div className="space-y-0">
            {posts.map(post => (
              <PostCard 
                key={post.id} 
                post={post} 
                currentUser={currentUser} 
                onNavigateToProfile={onNavigateToProfile}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
