import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, HeartHandshake, Reply, MoreHorizontal, ThumbsUp, Heart, Smile } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, increment, getDoc, setDoc } from 'firebase/firestore';
import { ReactionIcon, formatCount } from './ReactionPopup';
import { timeAgo } from '../lib/utils';

interface Comment {
  id: string;
  postId: string;
  parentCommentId: string | null;
  userUid: string;
  userName: string;
  userAvatarUrl: string;
  content: string;
  ameenCount: number;
  reactionsCount: number;
  createdAt: string;
  replies?: Comment[];
}

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  currentUser: any;
}

export function CommentModal({ isOpen, onClose, postId, currentUser }: CommentModalProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const q = query(
        collection(db, 'comments'),
        where('postId', '==', postId),
        orderBy('createdAt', 'asc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const commentsData: Comment[] = [];
        snapshot.forEach((doc) => {
          commentsData.push({ id: doc.id, ...doc.data() } as Comment);
        });

        // Organize comments into parent-child structure
        const commentMap = new Map();
        const rootComments: Comment[] = [];

        commentsData.forEach((comment: any) => {
          comment.replies = [];
          commentMap.set(comment.id, comment);
          if (!comment.parentCommentId) {
            rootComments.push(comment);
          } else {
            const parent = commentMap.get(comment.parentCommentId);
            if (parent) {
              parent.replies.push(comment);
            }
          }
        });

        setComments(rootComments);
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, 'comments');
      });

      return () => unsubscribe();
    }
  }, [isOpen, postId]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'comments'), {
        postId,
        parentCommentId: replyingTo?.id || null,
        userUid: currentUser.uid,
        userName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Anonymous',
        userAvatarUrl: currentUser.photoURL || '',
        content: newComment.trim(),
        reactionsCount: 0,
        createdAt: serverTimestamp()
      });

      setNewComment('');
      setReplyingTo(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'comments');
      alert("কমেন্ট সেভ করা যায়নি।");
    } finally {
      setLoading(false);
    }
  };

  const handleReaction = async (commentId: string, type: string) => {
    if (!currentUser) return;
    try {
      const reactionRef = doc(db, 'comment_reactions', `${commentId}_${currentUser.uid}`);
      const reactionSnap = await getDoc(reactionRef);
      
      if (reactionSnap.exists()) {
        if (reactionSnap.data().type === type) return; // Already reacted with same type
        await updateDoc(reactionRef, { type });
        // Count doesn't change if just changing type
      } else {
        await setDoc(reactionRef, {
          commentId,
          userUid: currentUser.uid,
          type,
          createdAt: serverTimestamp()
        });
        
        const commentRef = doc(db, 'comments', commentId);
        await updateDoc(commentRef, {
          reactionsCount: increment(1)
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `comment_reactions/${commentId}_${currentUser.uid}`);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[1000] backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-[1001] bg-white dark:bg-slate-900 h-[90vh] rounded-t-[24px] flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">মন্তব্যসমূহ</h2>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>

            {/* Comments List */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6">
              {comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
                  <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center">
                    <Send className="w-8 h-8 opacity-20" />
                  </div>
                  <p>এখনো কোনো মন্তব্য নেই। প্রথম মন্তব্যটি আপনিই করুন!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <CommentItem 
                    key={comment.id} 
                    comment={comment} 
                    onReply={() => setReplyingTo(comment)}
                    onReaction={(type) => handleReaction(comment.id, type)}
                  />
                ))
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 pb-safe">
              {replyingTo && (
                <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-lg mb-2">
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">
                    রিপ্লাই দিচ্ছেন: <span className="font-bold">{replyingTo.userName}</span>
                  </p>
                  <button onClick={() => setReplyingTo(null)}>
                    <X className="w-4 h-4 text-emerald-600" />
                  </button>
                </div>
              )}
              <form onSubmit={handleSubmitComment} className="flex items-center space-x-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={replyingTo ? "আপনার উত্তর লিখুন..." : "একটি মন্তব্য লিখুন..."}
                    className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-full px-5 py-3 text-sm focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!newComment.trim() || loading}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white p-3 rounded-full transition-all shadow-lg shadow-emerald-600/20"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

interface CommentItemProps {
  comment: Comment;
  onReply: () => void;
  onReaction: (type: string) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, onReply, onReaction }) => {
  return (
    <div className="space-y-4">
      <div className="flex space-x-3">
        {comment.userAvatarUrl ? (
          <img src={comment.userAvatarUrl} className="w-9 h-9 rounded-full object-cover" alt="" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 font-bold text-sm">
            {comment.userName.charAt(0)}
          </div>
        )}
        <div className="flex-1 space-y-1.5">
          <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-2.5 inline-block max-w-[90%]">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">{comment.userName}</h4>
            <p className="text-sm text-slate-800 dark:text-slate-200">{comment.content}</p>
          </div>
          
          <div className="flex items-center space-x-4 text-xs font-bold text-slate-500 dark:text-slate-400 px-1">
            <span>{timeAgo(comment.createdAt)}</span>
            <button onClick={() => onReaction('like')} className="hover:text-emerald-600">লাইক</button>
            <button onClick={() => onReaction('ameen')} className="hover:text-emerald-600 flex items-center">
              আমীন
            </button>
            <button onClick={onReply} className="hover:text-emerald-600">রিপ্লাই</button>
            
            {(comment.reactionsCount > 0) && (
              <div className="flex items-center bg-white dark:bg-slate-700 shadow-sm rounded-full px-1.5 py-0.5 -mt-4 border border-slate-100 dark:border-slate-600">
                <ReactionIcon type="ameen" className="w-3 h-3" textSize="text-[8px]" />
                <span className="ml-1 text-[10px]">{formatCount(comment.reactionsCount)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-12 space-y-4 border-l-2 border-slate-100 dark:border-slate-800 pl-4">
          {comment.replies.map((reply) => (
            <CommentItem 
              key={reply.id} 
              comment={reply} 
              onReply={onReply} 
              onReaction={onReaction} 
            />
          ))}
        </div>
      )}
    </div>
  );
};
