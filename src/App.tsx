/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, Component, ErrorInfo, ReactNode } from 'react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Quran } from './pages/Quran';
import { Tracker } from './pages/Tracker';
import { Social } from './pages/Social';
import { Profile } from './pages/Profile';
import { More } from './pages/More';
import { AlarmList } from './pages/features/AlarmList';
import { CreateAlarm } from './pages/features/CreateAlarm';
import { TasbihView } from './pages/features/Tasbih';
import { QiblaView } from './pages/features/Qibla';
import { NamesOfAllahView } from './pages/features/NamesOfAllah';
import { ZakatView as ZakatCalculatorView } from './pages/features/Zakat';
import { CalendarView } from './pages/features/CalendarView';
import { QuranAudio } from './pages/features/QuranAudio';
import { IslamicNames } from './pages/features/IslamicNames';
import { DuaView } from './pages/features/Dua';
import { ComingSoon } from './pages/features/ComingSoon';
import { SettingsView } from './pages/features/Settings';
import { CategoriesView } from './pages/features/Categories';
import { EducationView } from './pages/features/Education';
import { HadithView } from './pages/features/Hadith';
import { RamadanView } from './pages/features/Ramadan';
import { QuizView } from './pages/features/Quiz';
import { CalligraphyView } from './pages/features/Calligraphy';
import { NotesView } from './pages/features/Notes';
import { AlarmSettingsView } from './pages/features/AlarmSettings';
import { AdminSettingsView } from './pages/features/AdminSettings';
import { MyPosts } from './pages/features/MyPosts';
import Notifications from './pages/Notifications';
import { SearchPage } from './pages/SearchPage';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { auth, testConnection } from './lib/firebase';
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { WelcomeScreen } from './components/WelcomeScreen';
import { AuthForm } from './components/AuthForm';
import { AuthView } from './pages/AuthView';
import { Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NotificationManager } from './components/NotificationManager';
import { NetworkPrompt } from './components/NetworkPrompt';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

import { getFriendlyErrorMessage } from './lib/errorUtils';

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  constructor(props: ErrorBoundaryProps) {
    super(props);
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorInfo = null;
      try {
        if (this.state.error?.message) {
          errorInfo = JSON.parse(this.state.error.message);
        }
      } catch (e) {
        // Not a JSON error
      }

      const friendlyMessage = getFriendlyErrorMessage(errorInfo?.error || this.state.error?.message || this.state.error);

      return (
        <div className="p-6 bg-slate-50 dark:bg-slate-950 min-h-screen flex items-center justify-center">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-100 dark:border-slate-800 text-center">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <X className="w-10 h-10" />
            </div>
            
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">কিছু একটা সমস্যা হয়েছে!</h1>
            
            <div className="text-center p-4 rounded-xl mb-6">
              <p className="text-slate-600 dark:text-slate-400 text-base">
                {friendlyMessage}
              </p>
            </div>

            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-primary hover:bg-primary-dark text-white font-bold rounded-2xl transition-all shadow-lg shadow-primary/20"
            >
              আবার চেষ্টা করুন
            </button>
          </div>
        </div>
      );
    }
    // @ts-ignore
    return this.props.children;
  }
}

function TranslatedComingSoon({ categoryKey, onBack }: { categoryKey: string, onBack: () => void }) {
  const { t } = useLanguage();
  return <ComingSoon categoryName={t(categoryKey as any) || categoryKey} onBack={onBack} />;
}

export default function App() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('home');
  const [editingAlarm, setEditingAlarm] = useState<any>(null);
  const [navigationStack, setNavigationStack] = useState<string[]>(['home']);
  const [user, setUser] = useState<User | null>(null);
  const [viewingProfileUserId, setViewingProfileUserId] = useState<string | null>(null);
  const [hasSkippedWelcome, setHasSkippedWelcome] = useState(() => {
    return localStorage.getItem('hasSkippedWelcome') === 'true';
  });
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isOfflineMode, setIsOfflineMode] = useState(() => {
    const savedSettings = localStorage.getItem('islamic_app_settings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        return !!settings['offline-mode'];
      } catch (e) {
        return false;
      }
    }
    return false;
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const isFirebaseTab = useMemo(() => {
    const onlineTabs = ['social', 'profile', 'tracker', 'search', 'notifications', 'admin-settings', 'auth', 'my-posts', 'community', 'settings'];
    return onlineTabs.includes(activeTab) || !!viewingProfileUserId;
  }, [activeTab, viewingProfileUserId]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    // Listen for changes to offline mode in localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'islamic_app_settings') {
        try {
          const settings = JSON.parse(e.newValue || '{}');
          setIsOfflineMode(!!settings['offline-mode']);
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    // Also poll occasionally because storage event doesn't fire on same page
    const interval = setInterval(() => {
      const savedSettings = localStorage.getItem('islamic_app_settings');
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings);
          if (!!settings['offline-mode'] !== isOfflineMode) {
            setIsOfflineMode(!!settings['offline-mode']);
          }
        } catch (e) {}
      }
    }, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [isOfflineMode]);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
      StatusBar.setStyle({ style: Style.Default }).catch(() => {});
      StatusBar.setBackgroundColor({ color: '#ffffff' }).catch(() => {});
      
      // Request permissions on launch
      const requestPermissions = async () => {
        try {
          const { LocalNotifications } = await import('@capacitor/local-notifications');
          const localPerm = await LocalNotifications.requestPermissions();
          console.log('Local notifications permission status:', localPerm);

          const { PushNotifications } = await import('@capacitor/push-notifications');
          const pushPerm = await PushNotifications.requestPermissions();
          console.log('Push notifications permission status:', pushPerm);
          if (pushPerm.receive === 'granted') {
            try {
              await PushNotifications.register();
            } catch (regErr) {
              console.warn('PushNotifications.register() failed. This is expected if google-services.json is missing:', regErr);
            }
          }

          const { Geolocation } = await import('@capacitor/geolocation');
          // Use a timeout to ensure the app is fully ready
          setTimeout(async () => {
            const geoPerm = await Geolocation.requestPermissions();
            console.log('Geolocation permission status:', geoPerm);
          }, 1000);
          
        } catch (err) {
          console.error('Error requesting permissions:', err);
        }
      };
      
      requestPermissions();

      // Create Notification Channel for Alarms (Android 8.0+)
      import('@capacitor/local-notifications').then(({ LocalNotifications }) => {
        LocalNotifications.createChannel({
          id: 'azan_alarm_channel',
          name: 'Azan Alarm',
          description: 'Channel for Azan Alarms',
          importance: 5, // 5 = MAX
          visibility: 1, // 1 = PUBLIC
          sound: 'azan.wav',
          vibration: true,
        }).catch(console.error);
      });
    }
  }, []);

  const handleNavigate = (tab: string) => {
    if (tab === activeTab) return;
    
    // Push to browser history so the browser's back button works in preview
    window.history.pushState({ tab }, '', '');
    
    setNavigationStack(prev => [...prev, tab]);
    setActiveTab(tab);
  };

  useEffect(() => {
    const onPopState = (event: PopStateEvent) => {
      const state = event.state;
      
      // Only handle tab navigation if the state explicitly has a different tab.
      // Internal states (like modals or sub-pages) might not have a tab, or have the same tab.
      // We ignore those and let the component's own popstate listener handle them.
      if (state && state.tab && state.tab !== activeTab) {
        if (navigationStack.length > 1) {
          const newStack = [...navigationStack];
          newStack.pop();
          const prevTab = newStack[newStack.length - 1];
          setNavigationStack(newStack);
          setActiveTab(prevTab);
        }
      }
    };

    window.addEventListener('popstate', onPopState);

    // Check for offline mode changes periodically
    const offlineCheckInterval = setInterval(() => {
      const savedSettings = localStorage.getItem('islamic_app_settings');
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings);
          const isOffline = !!settings['offline-mode'];
          if (isOffline !== isOfflineMode) {
            setIsOfflineMode(isOffline);
          }
        } catch (e) {}
      }
    }, 1000);

    const backListener = CapApp.addListener('backButton', () => {
      if (navigationStack.length > 1) {
        // Trigger browser back which will fire popstate
        window.history.back();
      } else {
        CapApp.exitApp();
      }
    });

    return () => {
      window.removeEventListener('popstate', onPopState);
      clearInterval(offlineCheckInterval);
      backListener.then(l => l.remove());
    };
  }, [navigationStack, isOfflineMode, activeTab]);

  useEffect(() => {
    // Initialize history state
    window.history.replaceState({ tab: 'home' }, '', '');

    testConnection();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setHasSkippedWelcome(true);
        localStorage.setItem('hasSkippedWelcome', 'true');

        // Sync user to Firestore for search and profile
        try {
          const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
          const { db } = await import('./lib/firebase');
          const userRef = doc(db, 'users', currentUser.uid);
          await setDoc(userRef, {
            displayName: currentUser.displayName || 'User',
            displayNameLower: (currentUser.displayName || 'User').toLowerCase(),
            photoURL: currentUser.photoURL || '',
            email: currentUser.email || '',
            phoneNumber: currentUser.phoneNumber || '',
            updatedAt: serverTimestamp()
          }, { merge: true });
        } catch (error) {
          console.error("Error syncing user to Firestore:", error);
        }

        // Auto Restore from cloud if user is logged in
        try {
          const { doc, getDoc } = await import('firebase/firestore');
          const { db } = await import('./lib/firebase');
          const userDocRef = doc(db, 'user_data', currentUser.uid);
          const docSnap = await getDoc(userDocRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            
            // Check if we should restore (e.g. if local data is missing)
            const hasLocalData = localStorage.getItem('prayerTracker') || 
                                localStorage.getItem('quranProgress') || 
                                localStorage.getItem('favoriteDuas');
            
            if (!hasLocalData) {
              console.log("Restoring data from cloud...");
              if (data.prayerTracker) localStorage.setItem('prayerTracker', JSON.stringify(data.prayerTracker));
              if (data.quranProgress) localStorage.setItem('quranProgress', JSON.stringify(data.quranProgress));
              if (data.favoriteDuas) localStorage.setItem('favoriteDuas', JSON.stringify(data.favoriteDuas));
              if (data.favoriteAyats) localStorage.setItem('favoriteAyats', JSON.stringify(data.favoriteAyats));
              if (data.userReminders) localStorage.setItem('userReminders', JSON.stringify(data.userReminders));
              if (data.settings) localStorage.setItem('islamic_app_settings', JSON.stringify(data.settings));
            }
          }
        } catch (error) {
          console.error("Error during auto-restore:", error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const getParentTab = (tab: string) => {
    const homeFeatures = [
      'tasbih', 'qibla', 'names-of-allah', 'zakat', 'calendar', 
      'dua', 'hadith', 'ramadan', 'education', 'namaz-shikkha', 
      'hajj-umrah', 'live-tv', 'notes', 'calligraphy', 'wallpaper', 'quiz', 
      'islamic-names', 'categories', 'settings', 'alarm-settings', 'notifications', 'admin-settings', 'search'
    ];
    const quranFeatures = ['audio'];
    
    if (homeFeatures.includes(tab)) return 'home';
    if (quranFeatures.includes(tab)) return 'quran';
    return tab;
  };

  return (
    <ErrorBoundary>
      <NotificationManager />
      <AnimatePresence mode="wait">
          {!hasSkippedWelcome ? (
            <WelcomeScreen 
              key="welcome"
              onLogin={() => { 
                setHasSkippedWelcome(true);
                localStorage.setItem('hasSkippedWelcome', 'true');
                setAuthMode('login'); 
                handleNavigate('auth'); 
              }}
              onSignUp={() => { 
                setHasSkippedWelcome(true);
                localStorage.setItem('hasSkippedWelcome', 'true');
                setAuthMode('register'); 
                handleNavigate('auth'); 
              }}
              onSkip={() => {
                setHasSkippedWelcome(true);
                localStorage.setItem('hasSkippedWelcome', 'true');
              }}
            />
          ) : (
            <motion.div 
              key="main-app"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="min-h-full w-full"
            >
              <Layout activeTab={getParentTab(activeTab)} setActiveTab={handleNavigate}>
                <div className="flex-1 flex flex-col w-full min-h-full">
                  <AnimatePresence>
                    {isOfflineMode && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-amber-500 text-white text-[10px] font-bold py-1 px-4 text-center sticky top-0 z-[60] flex items-center justify-center gap-2"
                      >
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>{t('offline-mode-banner')}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {activeTab === 'home' && <Home setActiveTab={handleNavigate} />}
                  {activeTab === 'quran' && <Quran />}
                  {activeTab === 'social' && (
                    <Social 
                      onNavigate={handleNavigate} 
                      onNavigateToProfile={(uid) => setViewingProfileUserId(uid)} 
                    />
                  )}
                  {activeTab === 'tracker' && <Tracker />}
                  {activeTab === 'profile' && <Profile onNavigate={handleNavigate} />}
                  {activeTab === 'admin-settings' && <AdminSettingsView onBack={() => window.history.back()} />}
                  
                  {activeTab === 'auth' && <AuthView onBack={() => { setUser(auth.currentUser); window.history.back(); }} initialMode={authMode} />}
                  {activeTab === 'alarm-list' && <AlarmList onBack={() => window.history.back()} onAdd={() => { setEditingAlarm(null); handleNavigate('create-alarm'); }} onEdit={(alarm) => { setEditingAlarm(alarm); handleNavigate('create-alarm'); }} />}
                  {activeTab === 'create-alarm' && <CreateAlarm initialAlarm={editingAlarm} onBack={() => window.history.back()} onSave={(alarm) => {
                    const savedAlarms = localStorage.getItem('alarms');
                    const alarms = savedAlarms ? JSON.parse(savedAlarms) : [];
                    const index = alarms.findIndex((a: any) => a.id === alarm.id);
                    if (index !== -1) {
                        alarms[index] = alarm;
                    } else {
                        alarms.push(alarm);
                    }
                    localStorage.setItem('alarms', JSON.stringify(alarms));
                    setEditingAlarm(null);
                    window.history.back();
                  }} />}
                  {activeTab === 'tasbih' && <TasbihView onBack={() => window.history.back()} />}
                  {activeTab === 'alarm-settings' && <AlarmSettingsView onBack={() => window.history.back()} />}
                  {activeTab === 'qibla' && <QiblaView onBack={() => window.history.back()} />}
                  {activeTab === 'names-of-allah' && <NamesOfAllahView />}
                  {activeTab === 'zakat' && <ZakatCalculatorView onBack={() => window.history.back()} />}
                  {activeTab === 'calendar' && <CalendarView onBack={() => window.history.back()} />}
                  {activeTab === 'audio' && <QuranAudio onBack={() => window.history.back()} />}
                  {activeTab === 'dua' && <DuaView onBack={() => window.history.back()} />}
                  {activeTab === 'hadith' && <HadithView onBack={() => window.history.back()} />}
                  {activeTab === 'ramadan' && <RamadanView onBack={() => window.history.back()} />}
                  {activeTab === 'education' && <EducationView onBack={() => window.history.back()} />}
                  {activeTab === 'namaz-shikkha' && <TranslatedComingSoon categoryKey="namaz-shikkha" onBack={() => window.history.back()} />}
                  {activeTab === 'hajj-umrah' && <TranslatedComingSoon categoryKey="hajj-umrah" onBack={() => window.history.back()} />}
                  {activeTab === 'live-tv' && <TranslatedComingSoon categoryKey="live-tv" onBack={() => window.history.back()} />}
                  {activeTab === 'notes' && <NotesView onBack={() => window.history.back()} />}
                  {activeTab === 'calligraphy' && <CalligraphyView />}
                  {activeTab === 'wallpaper' && <CalligraphyView />}
                  {activeTab === 'settings' && <SettingsView onBack={() => window.history.back()} />}
                  {activeTab === 'quiz' && (
                    <QuizView 
                      onBack={() => {
                        // If the previous page was categories, just go back
                        if (navigationStack.length > 1 && navigationStack[navigationStack.length - 2] === 'categories') {
                          window.history.back();
                        } else {
                          // Otherwise force navigation to categories
                          handleNavigate('categories');
                        }
                      }} 
                    />
                  )}
                  {activeTab === 'islamic-names' && <IslamicNames onBack={() => window.history.back()} />}
                  {activeTab === 'categories' && <CategoriesView setActiveTab={handleNavigate} />}
                  {activeTab === 'notifications' && <Notifications />}
                  {activeTab === 'search' && (
                    <SearchPage 
                      currentUser={user}
                      onNavigateToProfile={(uid) => setViewingProfileUserId(uid)}
                    />
                  )}
                </div>

                {/* User Profile View Overlay */}
                <AnimatePresence>
                  {viewingProfileUserId && (
                    <MyPosts 
                      targetUserId={viewingProfileUserId}
                      currentUser={user}
                      onBack={() => setViewingProfileUserId(null)}
                      onNavigateToProfile={(uid) => setViewingProfileUserId(uid)}
                    />
                  )}
                </AnimatePresence>
              </Layout>
            </motion.div>
          )}
        </AnimatePresence>
        <NetworkPrompt isOnline={isOnline || !isFirebaseTab} />
    </ErrorBoundary>
  );
}

