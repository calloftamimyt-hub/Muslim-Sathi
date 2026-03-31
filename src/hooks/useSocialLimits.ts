import { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { format } from 'date-fns';

export interface SocialLimits {
  postLimit: number;
  storyLimit: number;
}

export interface UserDailyStats {
  postCount: number;
  storyCount: number;
  lastUpdated: any;
}

export function useSocialLimits() {
  const [limits, setLimits] = useState<SocialLimits>({ postLimit: -1, storyLimit: -1 });
  const [stats, setStats] = useState<UserDailyStats | null>(null);
  const [loading, setLoading] = useState(true);

  const dateStr = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    const fetchLimits = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'social'));
        if (settingsDoc.exists()) {
          setLimits(settingsDoc.data() as SocialLimits);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'settings/social');
      }
    };

    const fetchStats = async () => {
      if (!auth.currentUser) {
        setLoading(false);
        return;
      }

      try {
        const path = `users/${auth.currentUser.uid}/daily_stats/${dateStr}`;
        const statsDoc = await getDoc(doc(db, 'users', auth.currentUser.uid, 'daily_stats', dateStr));
        if (statsDoc.exists()) {
          setStats(statsDoc.data() as UserDailyStats);
        } else {
          // Initialize stats for today
          const initialStats: UserDailyStats = {
            postCount: 0,
            storyCount: 0,
            lastUpdated: serverTimestamp()
          };
          setStats(initialStats);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${auth.currentUser.uid}/daily_stats/${dateStr}`);
      } finally {
        setLoading(false);
      }
    };

    fetchLimits();
    fetchStats();
  }, [dateStr]);

  const checkLimit = (type: 'post' | 'story'): boolean => {
    if (!stats) return true; // Assume allowed if stats not loaded
    
    const limit = type === 'post' ? limits.postLimit : limits.storyLimit;
    const count = type === 'post' ? stats.postCount : stats.storyCount;

    if (limit === -1) return true; // Unlimited
    return count < limit;
  };

  const incrementCount = async (type: 'post' | 'story') => {
    if (!auth.currentUser) return;

    const statsRef = doc(db, 'users', auth.currentUser.uid, 'daily_stats', dateStr);
    
    try {
      const statsDoc = await getDoc(statsRef);
      if (!statsDoc.exists()) {
        await setDoc(statsRef, {
          postCount: type === 'post' ? 1 : 0,
          storyCount: type === 'story' ? 1 : 0,
          lastUpdated: serverTimestamp()
        });
      } else {
        await updateDoc(statsRef, {
          [type === 'post' ? 'postCount' : 'storyCount']: increment(1),
          lastUpdated: serverTimestamp()
        });
      }
      
      // Update local state
      setStats(prev => {
        if (!prev) return null;
        return {
          ...prev,
          [type === 'post' ? 'postCount' : 'storyCount']: prev[type === 'post' ? 'postCount' : 'storyCount'] + 1
        };
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, statsRef.path);
    }
  };

  return { limits, stats, loading, checkLimit, incrementCount };
}
