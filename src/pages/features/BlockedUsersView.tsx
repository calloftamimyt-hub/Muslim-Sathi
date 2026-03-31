import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, UserX, UserCheck } from 'lucide-react';
import { db, auth } from '../../lib/firebase';
import { doc, getDoc, updateDoc, arrayRemove } from 'firebase/firestore';

interface BlockedUsersViewProps {}

interface BlockedUser {
  uid: string;
  name: string;
  avatarUrl: string;
}

export function BlockedUsersView({}: BlockedUsersViewProps) {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlockedUsers = async () => {
      if (!auth.currentUser) {
        setLoading(false);
        return;
      }

      try {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const blockedUids = userDoc.data().blockedUsers || [];
          
          if (blockedUids.length > 0) {
            // Fetch details for each blocked user
            const usersData = await Promise.all(
              blockedUids.map(async (uid: string) => {
                const uDoc = await getDoc(doc(db, 'users', uid));
                if (uDoc.exists()) {
                  return {
                    uid,
                    name: uDoc.data().displayName || uDoc.data().name || 'Unknown User',
                    avatarUrl: uDoc.data().photoURL || uDoc.data().avatarUrl || ''
                  };
                }
                return null;
              })
            );
            
            setBlockedUsers(usersData.filter(u => u !== null) as BlockedUser[]);
          }
        }
      } catch (error) {
        console.error("Error fetching blocked users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlockedUsers();
  }, []);

  const handleUnblock = async (uidToUnblock: string) => {
    if (!auth.currentUser) return;

    try {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userDocRef, {
        blockedUsers: arrayRemove(uidToUnblock)
      });
      
      // Update local state
      setBlockedUsers(prev => prev.filter(u => u.uid !== uidToUnblock));
    } catch (error) {
      console.error("Error unblocking user:", error);
      alert("আনব্লক করতে সমস্যা হয়েছে।");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-slate-50 dark:bg-slate-950 min-h-screen pb-20"
    >
      <div className="p-4 pt-8">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : blockedUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400">
            <UserX className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-medium">কোনো ব্লক করা ইউজার নেই</p>
          </div>
        ) : (
          <div className="space-y-3">
            {blockedUsers.map(user => (
              <div key={user.uid} className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex items-center justify-center flex-shrink-0">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="text-lg font-bold text-slate-500">{user.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <span className="font-medium text-slate-900 dark:text-white">{user.name}</span>
                </div>
                <button 
                  onClick={() => handleUnblock(user.uid)}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors text-sm font-medium"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Unblock</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
