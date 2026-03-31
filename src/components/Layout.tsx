import { ReactNode, useState, useEffect } from 'react';
import { Home, BookOpen, CheckSquare, User, Users, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useLanguage } from '../contexts/LanguageContext';
import { useAdmin } from '../hooks/useAdmin';

interface LayoutProps {
  children: ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Layout({ children, activeTab, setActiveTab }: LayoutProps) {
  const [user, setUser] = useState<any>(null);
  const { t } = useLanguage();
  const { isAdmin } = useAdmin();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  const tabs = [
    { id: 'home', label: t('home' as any) || 'Home', icon: Home },
    { id: 'quran', label: t('quran' as any) || 'Quran', icon: BookOpen },
    { id: 'social', label: t('social' as any) || 'Social', icon: Users },
    { id: 'tracker', label: t('tracker' as any) || 'Tracker', icon: CheckSquare },
    { id: 'profile', label: t('profile' as any) || 'Profile', icon: User },
    ...(isAdmin ? [{ id: 'admin-settings', label: 'Admin Settings', icon: ShieldCheck }] : []),
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-300">
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col pb-16 md:pb-0 md:pl-20 lg:pl-64">
        {children}
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 md:hidden z-[999] pb-safe">
        <div className="flex justify-around items-center h-16">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors relative",
                    isActive ? "text-primary dark:text-primary-light" : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
                  )}
                >
                  {tab.id === 'profile' && user && (user.user_metadata?.avatar_url || user.user_metadata?.picture) ? (
                    <div className={cn(
                      "w-6 h-6 rounded-full overflow-hidden border",
                      isActive ? "border-primary" : "border-slate-300 dark:border-slate-700"
                    )}>
                      <img 
                        src={user.user_metadata.avatar_url || user.user_metadata.picture} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <Icon className="w-6 h-6" />
                  )}
                  <span className="text-[10px] font-medium">{tab.label}</span>
                </button>
              );
          })}
        </div>
      </nav>

      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col fixed top-0 left-0 h-screen w-20 lg:w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-[999]">
        <div className="p-4 flex items-center justify-center lg:justify-start space-x-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl">
            M
          </div>
          <span className="hidden lg:block font-bold text-xl text-primary dark:text-primary-light">{t('app-name' as any) || 'Muslim Sathi'}</span>
        </div>
        
        <div className="flex-1 py-6 flex flex-col gap-2 px-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center space-x-3 px-3 py-3 rounded-xl transition-colors",
                  isActive 
                    ? "bg-primary/10 text-primary dark:bg-primary-dark/20 dark:text-primary-light" 
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
              >
                {tab.id === 'profile' && user && (user.user_metadata?.avatar_url || user.user_metadata?.picture) ? (
                  <div className={cn(
                    "w-6 h-6 rounded-full overflow-hidden border flex-shrink-0",
                    isActive ? "border-primary" : "border-slate-300 dark:border-slate-700"
                  )}>
                    <img 
                      src={user.user_metadata.avatar_url || user.user_metadata.picture} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  <Icon className="w-6 h-6 flex-shrink-0" />
                )}
                <span className="hidden lg:block font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
