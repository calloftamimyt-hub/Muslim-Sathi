import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, User, Bell, MapPin, Compass, Book, Heart, 
  Users, Globe, Palette, Database, Shield, Info, RefreshCw, 
  Settings as SettingsIcon, Volume2, Moon, 
  ChevronRight, LogOut, Trash2, VolumeX, Vibrate, RotateCcw,
  CloudUpload, WifiOff, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { PrivacySecurityView } from './PrivacySecurity';
import { DataPermissionView } from './DataPermissionView';
import { DeleteAccountView } from './DeleteAccountView';
import { LanguageSelectionView } from './LanguageSelectionView';
import { BlockedUsersView } from './BlockedUsersView';
import { auth, db } from '../../lib/firebase';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { storageService } from '../../services/storageService';

interface SettingsProps {
  onBack: () => void;
}

interface SettingItem {
  id: string;
  label: string;
  type: 'toggle' | 'select' | 'action' | 'link';
  value?: any;
  options?: string[];
  icon?: any;
}

interface SettingSection {
  id: string;
  title: string;
  icon: any;
  items: SettingItem[];
}

const STORAGE_KEY = 'islamic_app_settings';

export function SettingsView({ onBack }: SettingsProps) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showCityModal, setShowCityModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [tempCity, setTempCity] = useState('');
  const { language, preference, setLanguage, t } = useLanguage();
  const { 
    themeMode, colorTheme, fontSize, arabicFont, normalFont, 
    setThemeMode, setColorTheme, setFontSize, setArabicFont, setNormalFont 
  } = useTheme();
  const [settings, setSettings] = useState<Record<string, any>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {
      'azan-on': true,
      'fajr-notif': true,
      'dhuhr-notif': true,
      'asr-notif': true,
      'maghrib-notif': true,
      'isha-notif': true,
      'silent-mode': false,
      'auto-location': true,
      'high-accuracy-qibla': true,
      'all-notifs': true,
      'dua-reminder': true,
      'daily-reminder': true,
      'jummah-reminder': true,
      'tahajjud-reminder': true,
      'auto-scroll': false,
      'tasbih-vibration': true,
      'daily-zikr-reminder': true,
      'profile-visibility': 'Public',
      'theme': 'System',
      'offline-mode': false,
      'azan-sound': 'Makkah',
      'reminder-time': '৫ মিনিট',
      'calc-method': 'Karachi',
      'location-permission': true,
      'analytics-permission': true,
      'crash-permission': true,
    };
  });

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const isPopState = useRef(false);

  // Handle mobile back button for sub-sections
  useEffect(() => {
    // Fetch settings from Firestore
    const fetchUserSettings = async () => {
      if (auth.currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setSettings(prev => ({
              ...prev,
              ...(data.profileVisibility && { 'profile-visibility': data.profileVisibility }),
              ...(data.commentPermission && { 'comment-permission': data.commentPermission })
            }));
          }
        } catch (error) {
          console.error("Error fetching user settings:", error);
        }
      }
    };
    fetchUserSettings();

    // Initialize history state for SettingsView
    window.history.replaceState({ ...window.history.state, section: null }, '');

    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;
      if (state && 'section' in state) {
        isPopState.current = true;
        setActiveSection(state.section);
      }
    };

    const handleNavigateSettings = (e: any) => {
      if (e.detail) {
        setActiveSection(e.detail);
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('navigate-settings', handleNavigateSettings);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('navigate-settings', handleNavigateSettings);
    };
  }, []); // Empty dependency array, only run on mount

  // Push state when activeSection changes
  useEffect(() => {
    if (isPopState.current) {
      isPopState.current = false;
      return;
    }
    // Don't push state on initial mount when activeSection is null
    if (activeSection !== null) {
      window.history.pushState({ ...window.history.state, section: activeSection }, '');
    }
  }, [activeSection]);

  const toggleSetting = (id: string) => {
    if (id === 'auto-location' && !settings['auto-location']) {
      // If turning on auto-location, try to get current position
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log("Location obtained:", position.coords.latitude, position.coords.longitude);
            // In a real app, we'd save these coordinates to the settings or a context
          },
          (error) => {
            console.error("Error getting location:", error);
          }
        );
      }
    }
    setSettings(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const updateSelectSetting = async (id: string, value: string) => {
    if (id === 'theme-mode') {
      setThemeMode(value as any);
    } else if (id === 'app-color-theme') {
      setColorTheme(value as any);
    } else if (id === 'arabic-font') {
      setArabicFont(value as any);
    } else if (id === 'normal-font') {
      setNormalFont(value as any);
    } else if (id === 'font-size') {
      setFontSize(value as any);
    } else {
      setSettings(prev => ({ ...prev, [id]: value }));
    }
    
    // Sync specific settings to Firestore
    if ((id === 'profile-visibility' || id === 'comment-permission') && auth.currentUser) {
      try {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userDocRef, {
          [id === 'profile-visibility' ? 'profileVisibility' : 'commentPermission']: value
        });
      } catch (error) {
        console.error(`Error updating ${id} in Firestore:`, error);
      }
    }
  };

  const handleAction = (id: string) => {
    if (id === 'manual-city') {
      setTempCity(settings['manual-city-name'] || '');
      setShowCityModal(true);
    } else if (id === 'privacy-policy') {
      setActiveSection('privacy-security-view');
    } else if (id === 'terms') {
      setActiveSection('terms-view');
    } else if (id === 'data-permission') {
      setActiveSection('data-permission-view');
    } else if (id === 'delete-account') {
      setActiveSection('delete-account-view');
    } else if (id === 'language') {
      setActiveSection('language-selection-view');
    } else if (id === 'blocked-users') {
      setActiveSection('blocked-users-view');
    }
  };

  const saveCity = () => {
    if (tempCity.trim()) {
      setSettings(prev => ({ 
        ...prev, 
        'manual-city-name': tempCity.trim(),
        'auto-location': false 
      }));
    }
    setShowCityModal(false);
  };

  const SECTIONS: SettingSection[] = [
    {
      id: 'profile',
      title: t('profile-settings' as any) || 'প্রোফাইল সেটিংস',
      icon: User,
      items: [
        { id: 'change-name', label: t('change-name'), type: 'action' },
        { id: 'profile-pic', label: t('profile-pic'), type: 'action' },
        { id: 'contact-info', label: t('contact-info'), type: 'action' },
        { id: 'change-pass', label: t('change-password'), type: 'action' },
        { id: 'logout', label: t('logout'), type: 'action', icon: LogOut },
      ]
    },
    {
      id: 'community',
      title: t('community-settings' as any) || 'কমিউনিটি সেটিংস',
      icon: Users,
      items: [
        { id: 'profile-visibility', label: t('profile-visibility'), type: 'select', options: ['Public', 'Private'] },
        { id: 'comment-permission', label: t('comment-permission'), type: 'select', options: ['Everyone', 'Followers', 'None'] },
        { id: 'comment-notif', label: t('comment-notification'), type: 'toggle' },
        { id: 'blocked-users', label: t('blocked-users-list'), type: 'action' },
      ]
    },
    {
      id: 'language',
      title: t('language-settings' as any) || 'ভাষা (Language)',
      icon: Globe,
      items: [
        { 
          id: 'language', 
          label: t('select-language' as any) || 'ভাষা নির্বাচন', 
          type: 'action', 
          value: preference === 'auto' ? (t('auto-language' as any) || 'Auto (Device Language)') : preference === 'bn' ? 'বাংলা' : 'English' 
        },
      ]
    },
    {
      id: 'theme',
      title: t('theme-settings' as any) || 'থিম / ডিজাইন',
      icon: Palette,
      items: [
        { id: 'theme-mode', label: t('dark-light-mode'), type: 'select', options: ['Light', 'Dark', 'System'], value: themeMode },
        { id: 'app-color-theme', label: t('app-color-theme'), type: 'select', options: ['Green', 'Blue', 'Gold', 'Dark Green'], value: colorTheme },
        { id: 'normal-font', label: 'সাধারণ ফন্ট (বাংলা/ইংরেজি)', type: 'select', options: ['Bengali', 'Inter', 'Roboto'], value: normalFont },
        { id: 'arabic-font', label: 'আরবি ফন্ট (কুরআনের জন্য)', type: 'select', options: ['Amiri', 'Scheherazade', 'Traditional'], value: arabicFont },
        { id: 'font-size', label: t('font-size'), type: 'select', options: ['Small', 'Medium', 'Large'], value: fontSize },
      ]
    },
    {
      id: 'privacy',
      title: t('privacy-settings' as any) || 'প্রাইভেসি ও সিকিউরিটি',
      icon: Shield,
      items: [
        { id: 'privacy-policy', label: t('privacy-policy'), type: 'action' },
        { id: 'terms', label: t('terms-conditions'), type: 'action' },
        { id: 'delete-account', label: t('account-delete'), type: 'action', icon: Trash2 },
        { id: 'data-permission', label: t('data-permission-control'), type: 'action' },
      ]
    },
  ];

  const getHeaderTitle = () => {
    if (!activeSection) return t('settings');
    
    const section = SECTIONS.find(s => s.id === activeSection);
    if (section) return section.title;

    switch (activeSection) {
      case 'privacy-security-view': return t('privacy-policy') || 'Privacy Policy';
      case 'terms-view': return t('terms-conditions') || 'Terms & Conditions';
      case 'data-permission-view': return t('data-permission-control') || 'Data Permissions';
      case 'delete-account-view': return t('account-delete') || 'Delete Account';
      case 'language-selection-view': return t('select-language') || 'Select Language';
      case 'blocked-users-view': return t('blocked-users-list') || 'Blocked Users';
      default: return t('settings');
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-slate-900 px-4 pt-safe pb-4 flex items-center border-b border-slate-200 dark:border-slate-800">
        {!activeSection && (
          <button onClick={onBack} className="p-2 -ml-2 mr-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
        )}
        <h1 className={cn("text-xl font-bold text-slate-900 dark:text-white", activeSection ? "ml-2" : "")}>{getHeaderTitle()}</h1>
      </header>

      <div className="flex-grow pb-24">
        <AnimatePresence mode="wait">
          {showCityModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl"
              >
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{t('select-city')}</h3>
            <input 
              type="text" 
              value={tempCity}
              onChange={(e) => setTempCity(e.target.value)}
              placeholder={t('enter-city-name')}
              className="w-full p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl border-none outline-none text-slate-900 dark:text-white mb-6"
              autoFocus
            />
            <div className="flex gap-3">
              <button 
                onClick={() => setShowCityModal(false)}
                className="flex-1 p-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {t('cancel')}
              </button>
              <button 
                onClick={saveCity}
                className="flex-1 p-4 bg-primary rounded-2xl font-bold text-white shadow-lg shadow-primary/20 dark:shadow-none hover:opacity-90 transition-colors"
              >
                {t('save')}
              </button>
            </div>
              </motion.div>
            </motion.div>
          )}

          {activeSection === 'privacy-security-view' ? (
            <PrivacySecurityView type="privacy" />
          ) : activeSection === 'terms-view' ? (
            <PrivacySecurityView type="terms" />
          ) : activeSection === 'data-permission-view' ? (
            <DataPermissionView settings={settings} onToggle={toggleSetting} />
          ) : activeSection === 'delete-account-view' ? (
            <DeleteAccountView />
          ) : activeSection === 'language-selection-view' ? (
            <LanguageSelectionView />
          ) : activeSection === 'blocked-users-view' ? (
            <BlockedUsersView />
          ) : !activeSection ? (
            <motion.div 
              key="main-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900"
            >
              {SECTIONS.map((section, idx) => (
                <motion.button
                  key={section.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  onClick={() => setActiveSection(section.id)}
                  className="flex items-center p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group w-full"
                >
                  <div className="w-9 h-9 rounded-full bg-primary/10 dark:bg-primary-dark/10 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                    <section.icon className="w-5 h-5 text-primary dark:text-primary-light" />
                  </div>
                  <span className="flex-grow text-left font-semibold text-slate-700 dark:text-slate-200">
                    {section.title}
                  </span>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="section-detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-col"
            >
              <div className="bg-white dark:bg-slate-900 divide-y divide-slate-50 dark:divide-slate-800/50">
                {SECTIONS.find(s => s.id === activeSection)?.items.map((item) => {
                  const isAction = item.type === 'action';
                  const isToggle = item.type === 'toggle';
                  
                  const Content = (
                    <>
                      <div className="flex items-center">
                        {item.icon && <item.icon className="w-4 h-4 mr-3 text-slate-400" />}
                        <span className="font-medium text-slate-700 dark:text-slate-300">{item.label}</span>
                      </div>

                      {isToggle && (
                        <div 
                          className={cn(
                            "w-12 h-6 rounded-full transition-colors relative",
                            settings[item.id] ? "bg-primary" : "bg-slate-200 dark:bg-slate-700"
                          )}
                        >
                          <div className={cn(
                            "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                            settings[item.id] ? "left-7" : "left-1"
                          )} />
                        </div>
                      )}

                      {item.type === 'select' && (
                        <select 
                          value={item.value || settings[item.id] || item.options?.[0]}
                          onChange={(e) => updateSelectSetting(item.id, e.target.value)}
                          className="bg-transparent text-sm font-bold text-primary dark:text-primary-light outline-none cursor-pointer"
                        >
                          {item.options?.map(opt => (
                            <option key={opt} value={opt}>
                              {opt === 'Light' ? t('light-mode' as any) || 'Light' : 
                               opt === 'Dark' ? t('dark-mode' as any) || 'Dark' : 
                               opt === 'System' ? t('system-mode' as any) || 'System' : opt}
                            </option>
                          ))}
                        </select>
                      )}

                      {isAction && (
                        <div className="flex items-center text-slate-400">
                          {item.id === 'manual-city' && settings['manual-city-name'] && (
                            <span className="text-xs mr-2 text-primary font-bold">{settings['manual-city-name']}</span>
                          )}
                          {item.value && <span className="text-xs mr-2">{item.value}</span>}
                          {isProcessing && (item.id === 'backup' || item.id === 'restore') ? (
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </div>
                      )}

                      {item.type === 'link' && (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                    </>
                  );

                  if (isAction || isToggle) {
                    return (
                      <button 
                        key={item.id} 
                        disabled={isProcessing && (item.id === 'backup' || item.id === 'restore')}
                        onClick={() => isAction ? handleAction(item.id) : toggleSetting(item.id)}
                        className="w-full p-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors text-left disabled:opacity-50"
                      >
                        {Content}
                      </button>
                    );
                  }

                  return (
                    <div key={item.id} className="p-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      {Content}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Quote */}
      {!activeSection && (
        <div className="p-8 text-center opacity-50 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs italic text-slate-500">
            {t('settings-quote')}
          </p>
        </div>
      )}
    </div>
  );
}
