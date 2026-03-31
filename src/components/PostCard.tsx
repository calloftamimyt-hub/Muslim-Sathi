import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, increment, deleteDoc, addDoc, serverTimestamp, getDoc, arrayUnion } from 'firebase/firestore';
import { MoreHorizontal, Globe, MessageSquare, Share2, HeartHandshake, AlertCircle, UserPlus, UserCheck, MapPin, ThumbsUp, Heart, Smile, Angry, Ban, Pencil, Trash2 } from 'lucide-react';
import { ReactionPopup, ReactionIcon, formatCount } from './ReactionPopup';
import { ReactionListModal } from './ReactionListModal';
import { CommentModal } from './CommentModal';
import { ReportModal } from './ReportModal';
import { PostEditModal } from './PostEditModal';
import { timeAgo } from '../lib/utils';

const REACTION_MAP: Record<string, { emoji: string, label: string, color: string }> = {
  like: { emoji: '👍', label: 'Like', color: 'text-blue-600' },
  love: { emoji: '❤️', label: 'Love', color: 'text-rose-500' },
  haha: { emoji: '😂', label: 'Haha', color: 'text-amber-500' },
  wow: { emoji: '😮', label: 'Wow', color: 'text-amber-500' },
  sad: { emoji: '😢', label: 'Sad', color: 'text-amber-500' },
  angry: { emoji: '😡', label: 'Angry', color: 'text-orange-600' },
  ameen: { emoji: '🤲', label: 'Ameen', color: 'text-primary dark:text-primary-light' },
};

export interface Post {
  id: string;
  authorUid: string;
  authorName: string;
  authorAvatarUrl?: string;
  authorUsername?: string;
  content: string;
  type: string;
  location?: string;
  createdAt: any;
  ameenCount?: number;
  reactionsCount?: number;
  reportsCount?: number;
  reports?: string[];
}

export interface PostCardProps {
  post: Post;
  currentUser?: any;
  key?: string | number;
  onRequireLogin?: () => void;
  onNavigateToProfile?: (uid: string) => void;
}

export function PostCard({ post, currentUser, onRequireLogin, onNavigateToProfile }: PostCardProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isReactionPopupOpen, setIsReactionPopupOpen] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  
  const [localAmeenCount, setLocalAmeenCount] = useState(post.ameenCount || 0);
  const [localReactionsCount, setLocalReactionsCount] = useState(post.reactionsCount || 0);
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [topReactions, setTopReactions] = useState<string[]>([]);
  const [isReactionListOpen, setIsReactionListOpen] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [authorUsername, setAuthorUsername] = useState<string | null>(post.authorUsername || null);
  const [profileVisibility, setProfileVisibility] = useState<string>('Public');
  const [commentPermission, setCommentPermission] = useState<string>('Everyone');
  const [isAuthorDataLoaded, setIsAuthorDataLoaded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  // Sync local count with props when they change from server, 
  // but only if we are not currently processing an update
  useEffect(() => {
    if (!isProcessing) {
      setLocalAmeenCount(post.ameenCount || 0);
      setLocalReactionsCount(post.reactionsCount || 0);
    }
  }, [post.ameenCount, post.reactionsCount, isProcessing]);

  useEffect(() => {
    if (currentUser) {
      checkUserReaction();
    } else {
      setUserReaction(null);
    }
    fetchTopReactions();
  }, [currentUser?.id, post.id]);

  useEffect(() => {
    const fetchAuthorData = async () => {
      if (post.authorUid.startsWith('demo-')) {
        setIsAuthorDataLoaded(true);
        return;
      }
      try {
        const userDoc = await getDoc(doc(db, 'users', post.authorUid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (!post.authorUsername) {
            setAuthorUsername(data.username);
          }
          if (data.profileVisibility) {
            setProfileVisibility(data.profileVisibility);
          }
          if (data.commentPermission) {
            setCommentPermission(data.commentPermission);
          }
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${post.authorUid}`);
      } finally {
        setIsAuthorDataLoaded(true);
      }
    };
    
    fetchAuthorData();
  }, [post.authorUid, post.authorUsername]);

  const handleBlockUser = () => {
    if (!currentUser) {
      if (onRequireLogin) onRequireLogin();
      else alert("ব্লক করতে লগ-ইন করুন।");
      return;
    }
    setShowBlockConfirm(true);
    setIsMenuOpen(false);
  };

  const confirmBlockUser = async () => {
    if (!currentUser || isProcessing) return;
    
    setIsProcessing(true);
    try {
      const userDocRef = doc(db, 'users', currentUser.id || currentUser.uid);
      await updateDoc(userDocRef, {
        blockedUsers: arrayUnion(post.authorUid)
      });
      setShowBlockConfirm(false);
      alert("ইউজারকে ব্লক করা হয়েছে।");
      // We might want to trigger a refresh of the feed here, but for now it will just be filtered on next load
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.id || currentUser.uid}`);
      alert("ব্লক করতে সমস্যা হয়েছে।");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeletePost = async () => {
    if (!currentUser || isProcessing) return;
    
    setIsProcessing(true);
    try {
      // 1. Delete all reactions associated with this post
      const reactionsQuery = query(collection(db, 'reactions'), where('postId', '==', post.id));
      const reactionsSnapshot = await getDocs(reactionsQuery);
      const reactionDeletePromises = reactionsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(reactionDeletePromises);

      // 2. Delete all comments associated with this post
      const commentsQuery = query(collection(db, 'comments'), where('postId', '==', post.id));
      const commentsSnapshot = await getDocs(commentsQuery);
      const commentDeletePromises = commentsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(commentDeletePromises);

      // 3. Delete the post document
      await deleteDoc(doc(db, 'posts', post.id));

      setIsDeleted(true);
      setShowDeleteConfirm(false);
    } catch (error) {
      alert("ডিলিট করতে সমস্যা হয়েছে।");
      handleFirestoreError(error, OperationType.DELETE, `posts/${post.id}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const fetchTopReactions = async () => {
    if (post.id.startsWith('demo-')) return;
    try {
      const q = query(collection(db, 'reactions'), where('postId', '==', post.id));
      const snapshot = await getDocs(q);
      
      const counts: Record<string, number> = {};
      snapshot.forEach(doc => {
        const r = doc.data();
        counts[r.type] = (counts[r.type] || 0) + 1;
      });
      const sorted = Object.keys(counts).sort((a, b) => counts[b] - counts[a]).slice(0, 3);
      setTopReactions(sorted);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'reactions');
    }
  };

  const checkUserReaction = async () => {
    if (!currentUser || post.id.startsWith('demo-')) return;
    try {
      const q = query(
        collection(db, 'reactions'),
        where('postId', '==', post.id),
        where('userUid', '==', currentUser.id || currentUser.uid)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setUserReaction(snapshot.docs[0].data().type || null);
      } else {
        setUserReaction(null);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'reactions');
    }
  };

  const checkFollowStatus = async () => {
    if (!currentUser || post.id.startsWith('demo-')) return;
    try {
      const q = query(
        collection(db, 'follows'),
        where('follower_id', '==', currentUser.id || currentUser.uid),
        where('following_id', '==', post.authorUid)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) setIsFollowing(true);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'follows');
    }
  };

  const handleToggleFollow = async () => {
    if (!currentUser) {
      if (onRequireLogin) onRequireLogin();
      return;
    }
    setIsFollowLoading(true);

    try {
      const followerId = currentUser.id || currentUser.uid;
      const followingId = post.authorUid;

      if (isFollowing) {
        // Unfollow
        const q = query(
          collection(db, 'follows'),
          where('follower_id', '==', followerId),
          where('following_id', '==', followingId)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          await deleteDoc(doc(db, 'follows', snapshot.docs[0].id));
          setIsFollowing(false);
        }
      } else {
        // Follow
        await addDoc(collection(db, 'follows'), {
          follower_id: followerId,
          following_id: followingId,
          createdAt: serverTimestamp()
        });
        setIsFollowing(true);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'follows');
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleMainAction = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (isProcessing) return;

    if (!auth.currentUser) {
      if (onRequireLogin) onRequireLogin();
      else alert("দয়া করে লগ-ইন করুন।");
      return;
    }

    setIsProcessing(true);
    const oldReaction = userReaction;
    const isRemoving = !!oldReaction;
    const targetReaction = isRemoving ? null : 'ameen';

    // Optimistic Update
    setUserReaction(targetReaction);
    if (isRemoving) {
      setLocalReactionsCount(prev => Math.max(0, prev - 1));
      if (oldReaction === 'ameen') {
        setLocalAmeenCount(prev => Math.max(0, prev - 1));
      }
    } else {
      setLocalReactionsCount(prev => prev + 1);
      setLocalAmeenCount(prev => prev + 1);
    }

    try {
      const user = auth.currentUser;
      const postRef = doc(db, 'posts', post.id);
      
      if (isRemoving) {
        const q = query(
          collection(db, 'reactions'),
          where('postId', '==', post.id),
          where('userUid', '==', user.uid)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          await deleteDoc(doc(db, 'reactions', snapshot.docs[0].id));
          
          // Decrement counts
          await updateDoc(postRef, {
            reactionsCount: increment(-1),
            ...(oldReaction === 'ameen' ? { ameenCount: increment(-1) } : {})
          });
        }
      } else {
        await addDoc(collection(db, 'reactions'), {
          postId: post.id,
          userUid: user.uid,
          userName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
          userAvatarUrl: user.photoURL || '',
          type: 'ameen',
          createdAt: serverTimestamp()
        });

        // Increment counts
        await updateDoc(postRef, {
          reactionsCount: increment(1),
          ameenCount: increment(1)
        });
      }
      await fetchTopReactions();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'reactions');
      // Rollback on error
      setUserReaction(oldReaction);
      setLocalAmeenCount(post.ameenCount || 0);
      setLocalReactionsCount(post.reactionsCount || 0);
      alert("রিঅ্যাকশন সেভ করতে সমস্যা হয়েছে।");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReactionSelect = async (reactionId: string) => {
    setIsReactionPopupOpen(false);
    if (isProcessing) return;

    const user = auth.currentUser;
    if (!user) {
      if (onRequireLogin) onRequireLogin();
      else alert("দয়া করে লগ-ইন করুন।");
      return;
    }

    const oldReaction = userReaction;
    if (oldReaction === reactionId) return;

    setIsProcessing(true);
    setUserReaction(reactionId);

    // Optimistic count update
    if (!oldReaction) {
      setLocalReactionsCount(prev => prev + 1);
      if (reactionId === 'ameen') setLocalAmeenCount(prev => prev + 1);
    } else {
      if (oldReaction === 'ameen' && reactionId !== 'ameen') {
        setLocalAmeenCount(prev => Math.max(0, prev - 1));
      } else if (oldReaction !== 'ameen' && reactionId === 'ameen') {
        setLocalAmeenCount(prev => prev + 1);
      }
    }

    try {
      const postRef = doc(db, 'posts', post.id);
      
      // Remove old reaction if it exists
      if (oldReaction) {
        const q = query(
          collection(db, 'reactions'),
          where('postId', '==', post.id),
          where('userUid', '==', user.uid)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          await deleteDoc(doc(db, 'reactions', snapshot.docs[0].id));
        }
      }

      // Add new reaction
      await addDoc(collection(db, 'reactions'), {
        postId: post.id,
        userUid: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        userAvatarUrl: user.photoURL || '',
        type: reactionId,
        createdAt: serverTimestamp()
      });

      // Update counts
      const updateData: any = {};
      if (!oldReaction) {
        updateData.reactionsCount = increment(1);
        if (reactionId === 'ameen') updateData.ameenCount = increment(1);
      } else {
        if (oldReaction === 'ameen' && reactionId !== 'ameen') {
          updateData.ameenCount = increment(-1);
        } else if (oldReaction !== 'ameen' && reactionId === 'ameen') {
          updateData.ameenCount = increment(1);
        }
      }
      
      if (Object.keys(updateData).length > 0) {
        await updateDoc(postRef, updateData);
      }

      await fetchTopReactions();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'reactions');
      // Rollback on error
      setUserReaction(oldReaction);
      setLocalAmeenCount(post.ameenCount || 0);
      setLocalReactionsCount(post.reactionsCount || 0);
      alert("রিঅ্যাকশন সেভ করতে সমস্যা হয়েছে।");
    } finally {
      setIsProcessing(false);
    }
  };

  const onTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();

    longPressTimer.current = setTimeout(() => {
      setPopupPosition({ x: rect.left, y: rect.top });
      setIsReactionPopupOpen(true);
    }, 500); // 500ms for long press
  };

  const onTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    // If popup is open, prevent the click from triggering handleMainAction
    if (isReactionPopupOpen) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handleMainActionClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isReactionPopupOpen) {
      handleMainAction();
    }
  };

  const getReactionButtonContent = () => {
    if (!userReaction) {
      return { icon: <HeartHandshake className="w-5 h-5" />, label: 'Ameen', colorClass: 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800' };
    }
    
    switch (userReaction) {
      case 'like':
        return { icon: <span className="text-xl leading-none">👍</span>, label: 'Like', colorClass: 'text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800' };
      case 'love':
        return { icon: <span className="text-xl leading-none">❤️</span>, label: 'Love', colorClass: 'text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800' };
      case 'haha':
        return { icon: <span className="text-xl leading-none">😂</span>, label: 'Haha', colorClass: 'text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800' };
      case 'wow':
        return { icon: <span className="text-xl leading-none">😮</span>, label: 'Wow', colorClass: 'text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800' };
      case 'sad':
        return { icon: <span className="text-xl leading-none">😢</span>, label: 'Sad', colorClass: 'text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800' };
      case 'angry':
        return { icon: <span className="text-xl leading-none">😡</span>, label: 'Angry', colorClass: 'text-orange-600 hover:bg-slate-100 dark:hover:bg-slate-800' };
      case 'ameen':
        return { icon: <HeartHandshake className="w-5 h-5" />, label: 'Ameen', colorClass: 'text-primary dark:text-primary-light hover:bg-slate-100 dark:hover:bg-slate-800' };
      default:
        return { icon: <HeartHandshake className="w-5 h-5" />, label: 'Ameen', colorClass: 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800' };
    }
  };

  const btnContent = getReactionButtonContent();

  let displayReactions = [...topReactions];
  if (userReaction && !displayReactions.includes(userReaction)) {
    displayReactions = [userReaction, ...displayReactions].slice(0, 3);
  }
  if (displayReactions.length === 0) {
    displayReactions = ['ameen'];
  }

  const hasReactions = localReactionsCount > 0 || topReactions.length > 0;
  const initial = post.authorName ? post.authorName.charAt(0).toUpperCase() : 'U';

  const canComment = () => {
    if (!currentUser) return false;
    if (currentUser.uid === post.authorUid || currentUser.id === post.authorUid) return true;
    
    if (commentPermission === 'None') return false;
    if (commentPermission === 'Followers') return isFollowing;
    return true; // 'Everyone'
  };

  const isAuthor = currentUser && (post.authorUid === currentUser.uid || post.authorUid === currentUser.id);

  if (isDeleted) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 text-center shadow-sm border border-slate-100 dark:border-slate-800 my-2 mx-4">
        <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
          <Trash2 className="w-6 h-6 text-red-600" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">পোস্টটি ডিলিট করা হয়েছে</h3>
        <p className="text-xs text-slate-600 dark:text-slate-400">আপনার পোস্টটি সফলভাবে সার্ভার থেকে মুছে ফেলা হয়েছে।</p>
      </div>
    );
  }

  if (isAuthorDataLoaded && profileVisibility === 'Private' && (!currentUser || (currentUser.uid !== post.authorUid && currentUser.id !== post.authorUid))) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-900 shadow-sm mb-2 border-b border-slate-200 dark:border-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center space-x-3">
          <div 
            className="cursor-pointer active:scale-95 transition-transform"
            onClick={() => onNavigateToProfile?.(post.authorUid)}
          >
            {post.authorAvatarUrl ? (
              <img 
                src={post.authorAvatarUrl} 
                alt={post.authorName} 
                className="w-10 h-10 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary-dark/30 flex items-center justify-center text-primary dark:text-primary-light font-bold text-lg">
                {initial}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 
                className="font-bold text-slate-900 dark:text-white text-[15px] leading-tight cursor-pointer hover:underline"
                onClick={() => onNavigateToProfile?.(post.authorUid)}
              >
                {post.authorName}
              </h3>
              {currentUser && (currentUser.id || currentUser.uid) !== post.authorUid && (
                <button 
                  onClick={handleToggleFollow}
                  disabled={isFollowLoading}
                  className={`text-[11px] font-bold px-3 py-1 rounded-full flex items-center transition-all ${
                    isFollowing 
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300' 
                      : 'bg-primary text-white hover:bg-primary-dark shadow-md shadow-primary/20'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="w-3.5 h-3.5 mr-1" />
                      আনফলো
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5 mr-1" />
                      ফলো
                    </>
                  )}
                </button>
              )}
            </div>
            {authorUsername && (
              <div className="text-primary dark:text-primary-light text-[11px] font-medium leading-none mt-0.5">
                @{authorUsername}
              </div>
            )}
            <div className="flex items-center text-slate-500 dark:text-slate-400 text-xs mt-0.5">
              <span>{timeAgo(post.createdAt)}</span>
              <span className="mx-1">•</span>
              <Globe className="w-3 h-3" />
              {post.location && (
                <>
                  <span className="mx-1">•</span>
                  <div className="flex items-center">
                    <MapPin className="w-2.5 h-2.5 mr-0.5" />
                    <span>{post.location}</span>
                  </div>
                </>
              )}
              <span className="mx-1">•</span>
              <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">{post.type}</span>
            </div>
          </div>
        </div>
        <div className="relative">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-full transition-colors"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
          
          {isMenuOpen && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setIsMenuOpen(false)}
              ></div>
              <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 z-20 overflow-hidden">
                {currentUser && (currentUser.id || currentUser.uid) === post.authorUid ? (
                  <>
                    <button 
                      onClick={() => {
                        setIsEditModalOpen(true);
                        setIsMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 flex items-center space-x-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                      <span className="text-sm font-medium">Edit Post</span>
                    </button>
                    <button 
                      onClick={() => {
                        setShowDeleteConfirm(true);
                        setIsMenuOpen(false);
                      }}
                      disabled={isProcessing}
                      className="w-full text-left px-4 py-3 flex items-center space-x-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-red-600 dark:text-red-400 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-sm font-medium">Delete Post</span>
                    </button>
                  </>
                ) : (
                  currentUser && (
                    <button 
                      onClick={handleBlockUser}
                      className="w-full text-left px-4 py-3 flex items-center space-x-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-red-600 dark:text-red-400 transition-colors"
                    >
                      <Ban className="w-4 h-4" />
                      <span className="text-sm font-medium">Block User</span>
                    </button>
                  )
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-2">
        <p className="text-slate-800 dark:text-slate-200 text-[15px] whitespace-pre-wrap">{post.content}</p>
      </div>

      {/* Stats */}
      {hasReactions && (
        <div 
          onClick={() => setIsReactionListOpen(true)}
          className="px-4 py-2 flex items-center text-slate-500 dark:text-slate-400 text-sm cursor-pointer hover:underline"
        >
          <div className="flex items-center">
            {displayReactions.map((reactionType, idx) => (
              <div 
                key={`${reactionType}-${idx}`} 
                className={`relative ${idx > 0 ? '-ml-1' : ''}`}
                style={{ zIndex: 10 - idx }}
              >
                <ReactionIcon type={reactionType} className="w-[18px] h-[18px]" textSize="text-[12px]" />
              </div>
            ))}
          </div>
          <span className="ml-1.5 font-medium">{formatCount(localReactionsCount)}</span>
        </div>
      )}

      {/* Divider */}
      <div className="mx-4 border-t border-slate-200 dark:border-slate-800 mt-2"></div>

      {/* Actions */}
      <div className="flex items-center justify-between px-2 py-1 relative">
        <button 
          onClick={handleMainActionClick}
          onMouseDown={onTouchStart}
          onMouseUp={onTouchEnd}
          onMouseLeave={onTouchEnd}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg transition-colors font-medium text-sm select-none active:scale-95 ${btnContent.colorClass}`}
        >
          {btnContent.icon}
          <span>{btnContent.label}</span>
        </button>
        
        <ReactionPopup 
          isOpen={isReactionPopupOpen}
          onClose={() => setIsReactionPopupOpen(false)}
          onSelect={handleReactionSelect}
          position={popupPosition}
        />

        {canComment() ? (
          <button 
            onClick={() => {
              if (!currentUser) {
                if (onRequireLogin) onRequireLogin();
                else alert("কমেন্ট করতে লগ-ইন করুন।");
                return;
              }
              setIsCommentModalOpen(true);
            }}
            className="flex-1 flex items-center justify-center space-x-2 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors font-medium text-sm"
          >
            <MessageSquare className="w-5 h-5" />
            <span>Comment</span>
          </button>
        ) : (
          <div className="flex-1 flex items-center justify-center space-x-2 py-2 text-slate-400 dark:text-slate-600 rounded-lg font-medium text-sm cursor-not-allowed" title="Comments are restricted by the author">
            <MessageSquare className="w-5 h-5 opacity-50" />
            <span className="opacity-50">Comment</span>
          </div>
        )}
        <button 
          onClick={() => {
            if (!currentUser) {
              if (onRequireLogin) onRequireLogin();
              else alert("রিপোর্ট করতে লগ-ইন করুন।");
              return;
            }
            setIsReportModalOpen(true);
          }}
          className="flex-1 flex items-center justify-center space-x-2 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors font-medium text-sm"
        >
          <AlertCircle className="w-5 h-5" />
          <span>Report</span>
        </button>
      </div>

      <ReactionListModal 
        isOpen={isReactionListOpen}
        onClose={() => setIsReactionListOpen(false)}
        postId={post.id}
        reactionMap={REACTION_MAP}
      />

      <CommentModal 
        isOpen={isCommentModalOpen}
        onClose={() => setIsCommentModalOpen(false)}
        postId={post.id}
        currentUser={currentUser}
      />

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        postId={post.id}
        currentUser={currentUser}
      />

      <PostEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        post={post}
      />

      {/* Block Confirmation Modal */}
      {showBlockConfirm && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800"
          >
            <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Ban className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 text-center">ইউজারকে ব্লক করুন</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6 text-center">আপনি কি নিশ্চিত যে আপনি এই ইউজারকে ব্লক করতে চান? ব্লক করলে আপনি আর এই ইউজারের পোস্ট দেখতে পাবেন না।</p>
            <div className="flex space-x-3">
              <button 
                onClick={() => setShowBlockConfirm(false)}
                className="flex-1 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                বাতিল
              </button>
              <button 
                onClick={confirmBlockUser}
                disabled={isProcessing}
                className="flex-1 py-2.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {isProcessing ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : 'ব্লক করুন'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800"
          >
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">পোস্ট ডিলিট করুন</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">আপনি কি নিশ্চিত যে আপনি এই পোস্টটি ডিলিট করতে চান? এটি আর ফিরে পাওয়া যাবে না।</p>
            <div className="flex space-x-3">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                বাতিল
              </button>
              <button 
                onClick={handleDeletePost}
                disabled={isProcessing}
                className="flex-1 py-2.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {isProcessing ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : 'ডিলিট'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
