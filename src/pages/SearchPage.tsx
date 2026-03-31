import React, { useState, useEffect } from 'react';
import { Search, User, MessageSquare, Loader2, X } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, getDocs, limit, orderBy, startAt, endAt } from 'firebase/firestore';
import { PostCard, Post } from '../components/PostCard';
import { useLanguage } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';

interface SearchPageProps {
  onNavigateToProfile?: (uid: string) => void;
  currentUser: any;
}

export function SearchPage({ onNavigateToProfile, currentUser }: SearchPageProps) {
  const { language, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<{ users: any[], posts: Post[] }>({ users: [], posts: [] });
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'users' | 'posts'>('all');

  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults({ users: [], posts: [] });
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      handleSearch();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, activeFilter]);

  const handleSearch = async () => {
    setLoading(true);
    const q = searchQuery.trim().toLowerCase();
    
    try {
      let users: any[] = [];
      let posts: Post[] = [];

      if (activeFilter === 'all' || activeFilter === 'users') {
        // Search users by name (prefix search)
        const usersQuery = query(
          collection(db, 'users'),
          where('displayNameLower', '>=', q),
          where('displayNameLower', '<=', q + '\uf8ff'),
          limit(10)
        );
        const userSnap = await getDocs(usersQuery);
        users = userSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }

      if (activeFilter === 'all' || activeFilter === 'posts') {
        // Search posts by content (this is limited in Firestore, usually we'd use Algolia or similar)
        // For now, we'll do a simple prefix search on a 'contentKeywords' field if it exists, 
        // or just search by content if it's stored in a way that allows prefix search.
        // Since we don't have a full-text search, we'll try to find posts that start with the query.
        const postsQuery = query(
          collection(db, 'posts'),
          where('content', '>=', searchQuery),
          where('content', '<=', searchQuery + '\uf8ff'),
          limit(10)
        );
        const postSnap = await getDocs(postsQuery);
        posts = postSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Post[];
      }

      setResults({ users, posts });
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'search');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-50 dark:bg-slate-950 z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 pt-safe">
        <div className="flex items-center px-4 h-14 gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              autoFocus
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'bn' ? 'মানুষ অথবা পোস্ট খুঁজুন...' : 'Search people or posts...'}
              className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-full py-2 pl-10 pr-10 text-sm focus:ring-2 focus:ring-primary/20 dark:text-white"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <X className="w-3 h-3 text-slate-500" />
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex px-4 py-2 gap-2 overflow-x-auto scrollbar-hide">
          {[
            { id: 'all', label: language === 'bn' ? 'সব' : 'All' },
            { id: 'users', label: language === 'bn' ? 'মানুষ' : 'People' },
            { id: 'posts', label: language === 'bn' ? 'পোস্ট' : 'Posts' }
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id as any)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                activeFilter === filter.id
                  ? 'bg-primary text-white shadow-sm shadow-primary/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-3 text-primary" />
            <p className="text-sm">{language === 'bn' ? 'খোঁজা হচ্ছে...' : 'Searching...'}</p>
          </div>
        ) : !searchQuery.trim() ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-600">
            <Search className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-sm text-center max-w-[200px]">
              {language === 'bn' ? 'আপনার প্রিয় মানুষ অথবা পোস্ট খুঁজে নিন' : 'Find your favorite people or posts'}
            </p>
          </div>
        ) : results.users.length === 0 && results.posts.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            {language === 'bn' ? 'কিছু পাওয়া যায়নি' : 'No results found'}
          </div>
        ) : (
          <div className="space-y-6 max-w-2xl mx-auto">
            {/* Users Results */}
            {results.users.length > 0 && (
              <div>
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">
                  {language === 'bn' ? 'মানুষ' : 'People'}
                </h2>
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 divide-y divide-slate-50 dark:divide-slate-800">
                  {results.users.map((u) => (
                    <div 
                      key={u.id}
                      onClick={() => onNavigateToProfile?.(u.id)}
                      className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center flex-shrink-0">
                        {u.photoURL ? (
                          <img src={u.photoURL} alt={u.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <User className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 dark:text-white truncate">{u.displayName}</p>
                        {u.bio && <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{u.bio}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Posts Results */}
            {results.posts.length > 0 && (
              <div>
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">
                  {language === 'bn' ? 'পোস্ট' : 'Posts'}
                </h2>
                <div className="space-y-4">
                  {results.posts.map((post) => (
                    <PostCard 
                      key={post.id}
                      post={post}
                      currentUser={currentUser}
                      onNavigateToProfile={onNavigateToProfile}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
