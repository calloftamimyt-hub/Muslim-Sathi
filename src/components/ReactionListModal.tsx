import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { ReactionIcon, formatCount } from './ReactionPopup';

interface ReactionListModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  reactionMap: Record<string, { emoji: string, label: string, color: string }>;
}

export function ReactionListModal({ isOpen, onClose, postId, reactionMap }: ReactionListModalProps) {
  const [activeTab, setActiveTab] = useState('all');
  const [reactions, setReactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchReactions();
    }
  }, [isOpen, postId]);

  const fetchReactions = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'reactions'),
        where('postId', '==', postId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      
      const reactionsData: any[] = [];
      snapshot.forEach((doc) => {
        reactionsData.push({ id: doc.id, ...doc.data() });
      });
      setReactions(reactionsData);
    } catch (err) {
      console.error("Error fetching reactions:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Group reactions by type
  const counts: Record<string, number> = {};
  reactions.forEach(r => {
    counts[r.type] = (counts[r.type] || 0) + 1;
  });

  const tabs = ['all', ...Object.keys(counts).sort((a, b) => counts[b] - counts[a])];

  const filteredReactions = activeTab === 'all' 
    ? reactions 
    : reactions.filter(r => r.type === activeTab);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: '100%' }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-0 z-[200] bg-white dark:bg-slate-900 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">রিঅ্যাকশন সমূহ</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-6 h-6 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto hide-scrollbar border-b border-slate-200 dark:border-slate-800">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center space-x-2 px-4 py-3 whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab 
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-medium' 
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              {tab === 'all' ? (
                <span>সবগুলো</span>
              ) : (
                <>
                  <ReactionIcon type={tab} className="w-5 h-5" />
                  <span>{formatCount(counts[tab])}</span>
                </>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
          ) : filteredReactions.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              কোনো রিঅ্যাকশন পাওয়া যায়নি
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReactions.map((reaction) => (
                <div key={reaction.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      {reaction.userAvatarUrl ? (
                        <img 
                          src={reaction.userAvatarUrl} 
                          alt={reaction.userName || 'User'} 
                          className="w-10 h-10 rounded-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-lg">
                          {(reaction.userName || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 rounded-full p-0.5 shadow-sm">
                        <ReactionIcon type={reaction.type} className="w-4 h-4" />
                      </div>
                    </div>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {reaction.userName || 'Unknown User'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
