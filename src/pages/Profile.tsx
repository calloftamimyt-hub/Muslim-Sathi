import React, { useState, useEffect } from 'react';
import { 
  User, Settings, Bell, Shield, HelpCircle, LogOut, ChevronRight, 
  Calendar, Award, Flame, BookOpen, Heart, MessageSquare, ShoppingBag,
  Lock, Trash2, Globe, Edit3, CheckCircle2, Star, Bookmark, BookmarkCheck, Clock,
  Trophy, Zap, Hash, CircleDot, Sparkles, LogIn, X, MapPin, Search, Loader2,
  ArrowLeft, Send, Droplets, Bed, HeartHandshake
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { format, subDays, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth, isSameMonth, subMonths } from 'date-fns';
import { auth, db, messaging } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, sendPasswordResetEmail, deleteUser, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getCountFromServer, addDoc, serverTimestamp, updateDoc, arrayUnion, deleteDoc, onSnapshot } from 'firebase/firestore';
import { getToken, onMessage } from 'firebase/messaging';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { App as CapApp } from '@capacitor/app';
import { useLocation } from '@/hooks/useLocation';
import { LocationModal } from '@/components/LocationModal';

const PRAYERS_LIST = [
  { id: 'fajr', type: 'fard' },
  { id: 'dhuhr', type: 'fard' },
  { id: 'asr', type: 'fard' },
  { id: 'maghrib', type: 'fard' },
  { id: 'isha', type: 'fard' },
];

const BADGE_DEFINITIONS = [
  { id: 'prayer_bronze', titleKey: 'badge-prayer-bronze', icon: <Trophy className="w-4 h-4" />, type: 'bronze', descKey: 'badge-prayer-bronze-desc' },
  { id: 'prayer_silver', titleKey: 'badge-prayer-silver', icon: <Trophy className="w-4 h-4" />, type: 'silver', descKey: 'badge-prayer-silver-desc' },
  { id: 'prayer_gold', titleKey: 'badge-prayer-gold', icon: <Trophy className="w-4 h-4" />, type: 'gold', descKey: 'badge-prayer-gold-desc' },
  
  { id: 'zikr_bronze', titleKey: 'badge-zikr-bronze', icon: <Sparkles className="w-4 h-4" />, type: 'bronze', descKey: 'badge-zikr-bronze-desc' },
  { id: 'zikr_silver', titleKey: 'badge-zikr-silver', icon: <Sparkles className="w-4 h-4" />, type: 'silver', descKey: 'badge-zikr-silver-desc' },
  { id: 'zikr_gold', titleKey: 'badge-zikr-gold', icon: <Sparkles className="w-4 h-4" />, type: 'gold', descKey: 'badge-zikr-gold-desc' },
  
  { id: 'quran_bronze', titleKey: 'badge-quran-bronze', icon: <BookOpen className="w-4 h-4" />, type: 'bronze', descKey: 'badge-quran-bronze-desc' },
  { id: 'quran_silver', titleKey: 'badge-quran-silver', icon: <BookOpen className="w-4 h-4" />, type: 'silver', descKey: 'badge-quran-silver-desc' },
  { id: 'quran_gold', titleKey: 'badge-quran-gold', icon: <BookOpen className="w-4 h-4" />, type: 'gold', descKey: 'badge-quran-gold-desc' },
];

import { AuthForm } from '../components/AuthForm';
import { MyPosts } from './features/MyPosts';
import { EditProfilePage } from './features/EditProfilePage';
import { useFavorites } from '@/hooks/useFavorites';
import { DuaView, Dua } from './features/Dua';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSelectionView } from './features/LanguageSelectionView';

import { getFriendlyErrorMessage } from '@/lib/errorUtils';

export function Profile({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const [user, setUser] = useState<any>(null);
  const [showMyPosts, setShowMyPosts] = useState(false);
  const [showEditProfilePage, setShowEditProfilePage] = useState(false);
  const [showFavoriteDuas, setShowFavoriteDuas] = useState(false);
  const [showFavoriteAyats, setShowFavoriteAyats] = useState(false);
  const [showFavoriteHadiths, setShowFavoriteHadiths] = useState(false);
  const { favorites: favoriteDuas, count: favoriteDuaCount } = useFavorites<Dua>('favorite-duas');
  const { favorites: favoriteAyats, count: favoriteAyatCount } = useFavorites<any>('bookmarked-ayats');
  const { favorites: favoriteHadiths, count: favoriteHadithCount } = useFavorites<any>('favorite-hadiths');
  const { language, preference, setPreference, t: globalT } = useLanguage();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'today' | 'week' | 'month'>('today');
  const [trackerData, setTrackerData] = useState<Record<string, any>>({});
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [username, setUsername] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const { latitude, longitude, country, city: userLocation, loading: locLoading } = useLocation(language);
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Reminders State
  const [reminders, setReminders] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('userReminders');
    return saved ? JSON.parse(saved) : {
      'tahajjud': true,
      'jumuah': true,
      'dua': true,
      'ishraq': false,
      'surah-kahf': true,
      'morning-azkar': true,
      'evening-azkar': true,
      'sunnah-fasting': false
    };
  });

  const [showReminderModal, setShowReminderModal] = useState(false);
  const [newReminderLabel, setNewReminderLabel] = useState('');

  useEffect(() => {
    localStorage.setItem('userReminders', JSON.stringify(reminders));
  }, [reminders]);

  const toggleReminder = (label: string) => {
    setReminders(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  const isMobile = Capacitor.isNativePlatform() || (typeof window !== 'undefined' && window.innerWidth < 768);

  useEffect(() => {
    const modals = [
      showMyPosts, showEditProfilePage, showFavoriteDuas, showFavoriteAyats, 
      showFavoriteHadiths, showLanguageModal, showEditProfileModal, 
      showChangePasswordModal, showForgotPasswordModal, showDeleteModal, 
      showLocationModal, showReminderModal
    ];
    
    const anyModalOpen = modals.some(m => m);
    
    if (anyModalOpen) {
      window.history.pushState({ modal: true }, '', '');
      
      const handlePopState = () => {
        setShowMyPosts(false);
        setShowEditProfilePage(false);
        setShowFavoriteDuas(false);
        setShowFavoriteAyats(false);
        setShowFavoriteHadiths(false);
        setShowLanguageModal(false);
        setShowEditProfileModal(false);
        setShowChangePasswordModal(false);
        setShowForgotPasswordModal(false);
        setShowDeleteModal(false);
        setShowLocationModal(false);
        setShowReminderModal(false);
      };
      
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [
    showMyPosts, showEditProfilePage, showFavoriteDuas, showFavoriteAyats, 
    showFavoriteHadiths, showLanguageModal, showEditProfileModal, 
    showChangePasswordModal, showForgotPasswordModal, showDeleteModal, 
    showLocationModal, showReminderModal
  ]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        // Fetch follower count
        try {
          const followersQuery = query(collection(db, 'follows'), where('following_id', '==', user.uid));
          const followersSnapshot = await getCountFromServer(followersQuery);
          setFollowerCount(followersSnapshot.data().count);

          // Fetch following count
          const followingQuery = query(collection(db, 'follows'), where('follower_id', '==', user.uid));
          const followingSnapshot = await getCountFromServer(followingQuery);
          setFollowingCount(followingSnapshot.data().count);

          // Fetch user profile data (username)
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUsername(userDoc.data().username || '');
            setNewUsername(userDoc.data().username || '');
          }
        } catch (error) {
          console.error("Error fetching user stats/profile:", error);
          setErrorMsg(getFriendlyErrorMessage(error));
        }
      } else {
        setUser(null);
        setFollowerCount(0);
        setFollowingCount(0);
        setUsername('');
      }
    });

    return () => unsubscribe();
  }, []);

  const handlePostReport = async () => {
    if (!user || isSavingProfile) return;

    const confirmPost = window.confirm(t.postReportConfirm || "Do you want to post this report to the social feed?");
    if (!confirmPost) return;

    setIsSavingProfile(true);
    try {
      const reportTitle = t.monthlyReportTitle;
      const content = `${reportTitle} (${format(new Date(), 'MMMM yyyy')})\n\n` +
        `✅ ${t.prayerStats}: ${currentMonthStats.completed}\n` +
        `📖 ${t.quranStats}: ${currentMonthStats.totalQuran}\n` +
        `📿 ${t.zikrStats}: ${currentMonthStats.totalZikr}\n\n` +
        `${t.prayerBreakdown || 'Prayer Breakdown:'}\n` +
        `${t.fajr || 'Fajr'}: ${currentMonthStats.prayerCounts.fajr} ${t.days || 'days'}\n` +
        `${t.dhuhr || 'Dhuhr'}: ${currentMonthStats.prayerCounts.dhuhr} ${t.days || 'days'}\n` +
        `${t.asr || 'Asr'}: ${currentMonthStats.prayerCounts.asr} ${t.days || 'days'}\n` +
        `${t.maghrib || 'Maghrib'}: ${currentMonthStats.prayerCounts.maghrib} ${t.days || 'days'}\n` +
        `${t.isha || 'Isha'}: ${currentMonthStats.prayerCounts.isha} ${t.days || 'days'}\n\n` +
        `#MuslimSathi #MonthlyReport #IbadatTracker`;

      await addDoc(collection(db, 'posts'), {
        authorUid: user.uid,
        authorName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        authorAvatarUrl: user.photoURL || '',
        authorUsername: username || '',
        content: content,
        type: 'General',
        location: userLocation || '',
        ameenCount: 0,
        reactionsCount: 0,
        reportsCount: 0,
        reports: [],
        createdAt: serverTimestamp()
      });

      alert(globalT('postSuccess' as any) || t.postSuccess);
    } catch (error) {
      console.error("Error posting report:", error);
      alert(globalT('postError' as any) || t.postError);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = () => {
    setPasswordError('');
    setPasswordSuccess('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowChangePasswordModal(true);
  };

  const submitPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }

    setIsChangingPassword(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setPasswordSuccess("Password updated successfully!");
      setTimeout(() => setShowChangePasswordModal(false), 2000);
    } catch (error: any) {
      console.error("Password change error:", error);
      if (error.code === 'auth/invalid-credential') {
        setPasswordError("Incorrect current password.");
      } else {
        setPasswordError("Failed to update password. Please try again.");
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const submitForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    setPasswordError('');
    setPasswordSuccess('');
    setIsChangingPassword(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send OTP');
      
      setPasswordSuccess("OTP sent to your email! Please check your inbox.");
      setResetStep(2);
    } catch (error: any) {
      console.error("Forgot password error:", error);
      setPasswordError(error.message || "Failed to send OTP. Please try again later.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const submitResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail || !otpCode || !newPassword) return;
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }
    setPasswordError('');
    setPasswordSuccess('');
    setIsChangingPassword(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, otp: otpCode, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to reset password');

      setPasswordSuccess("Password reset successfully! You can now log in.");
      setTimeout(() => {
        setShowForgotPasswordModal(false);
        setResetStep(1);
        setOtpCode('');
        setResetEmail('');
        setNewPassword('');
        setConfirmPassword('');
      }, 3000);
    } catch (error: any) {
      console.error("Reset password error:", error);
      setPasswordError(error.message || "Failed to reset password. Please try again.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = () => {
    if (!user) return;
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = async () => {
    if (!user) return;
    setIsDeletingAccount(true);
    try {
      // Delete user data from Firestore
      await deleteDoc(doc(db, 'users', user.uid));
      await deleteDoc(doc(db, 'user_data', user.uid));
      
      // Delete user from Auth
      await deleteUser(user);
      
      setShowDeleteModal(false);
      setUser(null);
      alert(globalT('delete-account-success' as any) || "Account deleted successfully.");
    } catch (error: any) {
      console.error("Delete account error:", error);
      if (error.code === 'auth/requires-recent-login') {
        alert("For security reasons, please log out and log back in before deleting your account.");
      } else {
        alert(globalT('delete-account-error' as any) || "Failed to delete account. Please try again.");
      }
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user || !newUsername.trim() || isSavingProfile) return;
    
    setIsSavingProfile(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        username: newUsername.trim(),
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      setUsername(newUsername.trim());
      setShowEditProfileModal(false);
      alert(globalT('profile-updated' as any) || "Profile updated!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert(globalT('profile-update-error' as any) || "Failed to update profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  useEffect(() => {
    // Listen for foreground messages
    const setupMessaging = async () => {
      const msg = await messaging();
      if (msg) {
        onMessage(msg, (payload) => {
          console.log('Message received. ', payload);
          // Show a simple alert or toast for foreground notifications
          if (payload.notification) {
            alert(`${payload.notification.title}\n${payload.notification.body}`);
          }
        });
      }
    };
    setupMessaging();
  }, []);



  useEffect(() => {
    // Initial load from localStorage
    const savedData = localStorage.getItem('prayerTracker');
    if (savedData) {
      setTrackerData(JSON.parse(savedData));
    }

    if (user) {
      // Real-time sync from Firestore
      const docRef = doc(db, 'user_data', user.uid);
      const unsub = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const firestoreData = docSnap.data().prayerTracker || {};
          setTrackerData(prev => {
            const merged = { ...prev, ...firestoreData };
            localStorage.setItem('prayerTracker', JSON.stringify(merged));
            return merged;
          });
          
          // Recalculate badges
          const dataToBadge = { ...JSON.parse(localStorage.getItem('prayerTracker') || '{}'), ...firestoreData };
          const newEarned = calculateNewBadges(dataToBadge, []);
          setEarnedBadges(newEarned);
          localStorage.setItem('earnedBadges', JSON.stringify(newEarned));
        }
      });
      return () => unsub();
    }
  }, [user]);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
      alert(globalT('login-error' as any) || "Login failed. Please make sure Google Auth is enabled in Firebase console.");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const calculateNewBadges = (data: Record<string, any>, existing: string[]) => {
    const newlyEarned: string[] = [];
    const today = new Date();

    // Filter data for the current month only
    const currentMonthData = Object.entries(data).filter(([dateStr]) => {
      const date = new Date(dateStr);
      return isSameMonth(date, today);
    });

    // 1. Prayer Streaks in current month
    let fullPrayerDays = 0;
    currentMonthData.forEach(([_, day]: any) => {
      const completed = Object.entries(day.prayers || {})
        .filter(([id, val]) => val === 'prayed' && PRAYERS_LIST.find(p => p.id === id)?.type === 'fard').length;
      if (completed === 5) fullPrayerDays++;
    });

    if (fullPrayerDays >= 20) newlyEarned.push('prayer_bronze');
    if (fullPrayerDays >= 25) newlyEarned.push('prayer_silver');
    if (fullPrayerDays >= 30) newlyEarned.push('prayer_gold');

    // 2. Totals in current month
    let totalZikr = 0;
    let totalQuran = 0;
    currentMonthData.forEach(([_, day]: any) => {
      totalZikr += (day.zikr || 0);
      totalQuran += (day.quran || 0);
    });

    if (totalZikr >= 10000) newlyEarned.push('zikr_bronze');
    if (totalZikr >= 50000) newlyEarned.push('zikr_silver');
    if (totalZikr >= 100000) newlyEarned.push('zikr_gold');

    if (totalQuran >= 150) newlyEarned.push('quran_bronze');
    if (totalQuran >= 250) newlyEarned.push('quran_silver');
    if (totalQuran >= 300) newlyEarned.push('quran_gold');

    return newlyEarned;
  };

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayData = trackerData[todayStr] || { prayers: {}, quran: 0, zikr: 0 };

  const completedToday = Object.entries(todayData.prayers || {})
    .filter(([id, val]) => val === 'prayed' && PRAYERS_LIST.find(p => p.id === id)?.type === 'fard').length;

  const getStatsForInterval = (start: Date, end: Date) => {
    const days = eachDayOfInterval({ start, end });
    let completed = 0;
    let missed = 0;
    let totalQuran = 0;
    let totalZikr = 0;
    let totalFasting = 0;
    let totalQaza = 0;
    let totalWater = 0;
    let totalSleep = 0;
    let totalSadaqah = 0;
    const prayerCounts: Record<string, number> = { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };

    days.forEach(day => {
      const dStr = format(day, 'yyyy-MM-dd');
      const dData = trackerData[dStr] || { prayers: {}, quran: 0, zikr: 0, fasting: false, qaza: 0, water: 0, sleep: 0, sadaqah: false };
      
      PRAYERS_LIST.forEach(p => {
        if (dData.prayers?.[p.id] === 'prayed') {
          prayerCounts[p.id]++;
        }
      });

      const dayCompleted = Object.entries(dData.prayers || {})
        .filter(([id, val]) => val === 'prayed' && PRAYERS_LIST.find(p => p.id === id)?.type === 'fard').length;
      
      completed += dayCompleted;
      
      // Only count missed for past days (not including today)
      if (day < new Date() && !isSameDay(day, new Date())) {
        missed += (5 - dayCompleted);
      }

      totalQuran += (dData.quran || 0);
      totalZikr += (dData.zikr || 0);
      if (dData.fasting) totalFasting++;
      totalQaza += (dData.qaza || 0);
      totalWater += (dData.water || 0);
      totalSleep += (dData.sleep || 0);
      if (dData.sadaqah) totalSadaqah++;
    });

    return { completed, missed, totalQuran, totalZikr, totalFasting, totalQaza, totalWater, totalSleep, totalSadaqah, prayerCounts, daysCount: days.length };
  };

  const stats = activeTab === 'today' 
    ? { completed: completedToday, missed: 0, totalQuran: todayData.quran || 0, totalZikr: todayData.zikr || 0, totalFasting: todayData.fasting ? 1 : 0, totalQaza: todayData.qaza || 0, totalWater: todayData.water || 0, totalSleep: todayData.sleep || 0, totalSadaqah: todayData.sadaqah ? 1 : 0, daysCount: 1 }
    : activeTab === 'week'
    ? getStatsForInterval(subDays(new Date(), 6), new Date())
    : getStatsForInterval(subDays(new Date(), 29), new Date());

  // Overall totals for the bottom cards
  const overallStats = getStatsForInterval(subDays(new Date(), 365), new Date());

  const getStatsForMonth = (date: Date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    return getStatsForInterval(start, end);
  };

  const currentMonthStats = getStatsForMonth(new Date());
  const lastMonth = subMonths(startOfMonth(new Date()), 1);
  const lastMonthStats = getStatsForMonth(lastMonth);

  const t = {
    en: {
      welcome: "Welcome to Muslim Sathi",
      loginNote: "Login to save your settings and data",
      loginBtn: "Login / Sign Up",
      user: "User",
      followers: "Followers",
      following: "Following",
      statusToday: "Ibadat Status (Today)",
      prayerToday: "Today's Prayer",
      quranReading: "Quran Reading",
      zikrTasbih: "Zikr & Tasbih",
      allPrayersDone: "Ma sha Allah! All prayers completed",
      prayersLeft: (left: number) => `Only ${left} prayers left`,
      targetReached: "Today's target reached",
      targetQuran: "Target: 10 pages",
      targetZikr: "Target: 1000 times",
      prayerTracker: "Prayer Tracker",
      today: "Today",
      days7: "7 Days",
      days30: "30 Days",
      completed: "Completed",
      missed: "Missed",
      monthlyReport: "Monthly Report (This Month)",
      prayer: "Prayer",
      quran: "Quran",
      zikr: "Zikr",
      totalReading: "Total Reading",
      totalTasbih: "Total Tasbih",
      avg: "Avg",
      pagesDay: "pages/day",
      timesDay: "times/day",
      achievements: "Achievements This Month",
      earned: "earned",
      favorites: "Favorites",
      savedDua: "Saved Dua",
      bookmarkedAyat: "Bookmarked Ayat",
      favoriteHadith: "Favorite Hadith",
      reminderStatus: "Reminder Status",
      shortcutSettings: "Shortcut Settings",
      setLocation: "Set Your Location",
      locationNotSet: "Location not set",
      editProfile: "Edit Profile",
      changeLanguage: "Change Language",
      myPosts: "My Posts",
      seeAllPosts: "See all posts",
      myShop: "My Shop",
      comingSoon: "Coming Soon",
      changePassword: "Change Password",
      logout: "Logout",
      deleteAccount: "Delete Account",
      postReport: "Post Report",
      postSuccess: "Report posted successfully!",
      postError: "Failed to post report.",
      monthlyReportTitle: "My Monthly Ibadat Report",
      prayerStats: "Prayers Completed",
      quranStats: "Quran Pages",
      zikrStats: "Zikr Count",
      items: "items",
      usernameLabel: "Username",
      usernameHint: "Only lowercase letters, numbers, and underscores (_) are allowed.",
      saveBtn: "Save",
      thisMonth: "This Month",
      postReportConfirm: "Do you want to post this report to the social feed?",
      prayerBreakdown: "Prayer Breakdown:",
      fajr: "Fajr",
      dhuhr: "Dhuhr",
      asr: "Asr",
      maghrib: "Maghrib",
      isha: "Isha",
      days: "days",
      fasting: "Fasting",
      qaza: "Qaza Prayer",
      water: "Water",
      sleep: "Sleep",
      sadaqah: "Sadaqah",
      dailyHabits: "Daily Habits (Today)",
      glasses: "glasses",
      hours: "hours",
      yes: "Yes",
      no: "No",
      mood: "Mood",
      reflection: "Reflection"
    },
    bn: {
      welcome: "মুসলিম সাথী-তে স্বাগতম",
      loginNote: "আপনার সেটিংস ও তথ্য সেভ রাখতে লগইন করুন",
      loginBtn: "লগইন / সাইন আপ",
      user: "ব্যবহারকারী",
      followers: "ফলোয়ার",
      following: "ফলোয়িং",
      statusToday: "ইবাদত স্ট্যাটাস (আজ)",
      prayerToday: "আজকের নামাজ",
      quranReading: "কুরআন তিলাওয়াত",
      zikrTasbih: "যিকির ও তাসবিহ",
      allPrayersDone: "মাশাআল্লাহ! সব নামাজ সম্পন্ন হয়েছে",
      prayersLeft: (left: number) => `আর মাত্র ${left} ওয়াক্ত বাকি`,
      targetReached: "আজকের লক্ষ্য পূরণ হয়েছে",
      targetQuran: "লক্ষ্য: ১০ পৃষ্ঠা",
      targetZikr: "লক্ষ্য: ১০০০ বার",
      prayerTracker: "নামাজ ট্র্যাকার",
      today: "আজ",
      days7: "৭ দিন",
      days30: "৩০ দিন",
      completed: "পড়া হয়েছে",
      missed: "মিস হয়েছে",
      monthlyReport: "মাসিক রিপোর্ট (এই মাস)",
      prayer: "নামাজ",
      quran: "কুরআন",
      zikr: "যিকির",
      totalReading: "মোট তিলাওয়াত",
      totalTasbih: "মোট তাসবিহ",
      avg: "গড়",
      pagesDay: "পৃষ্ঠা/দিন",
      timesDay: "বার/দিন",
      achievements: "এই মাসের অর্জন",
      earned: "অর্জিত",
      favorites: "সংরক্ষিত (Favorites)",
      savedDua: "সেভ করা দোয়া",
      bookmarkedAyat: "বুকমার্ক করা আয়াত",
      favoriteHadith: "পছন্দের হাদিস",
      reminderStatus: "রিমাইন্ডার স্ট্যাটাস",
      shortcutSettings: "শর্টকাট সেটিংস",
      setLocation: "আপনার লোকেশন সেট করুন",
      locationNotSet: "লোকেশন সেট নেই",
      editProfile: "প্রোফাইল এডিট করুন",
      changeLanguage: "ভাষা পরিবর্তন (Language)",
      myPosts: "আমার পোস্ট",
      seeAllPosts: "সব পোস্ট দেখুন",
      myShop: "আমার শপ",
      comingSoon: "শীঘ্রই আসছে",
      changePassword: "পাসওয়ার্ড পরিবর্তন",
      logout: "লগ আউট",
      deleteAccount: "অ্যাকাউন্ট মুছে ফেলুন",
      items: "টি",
      postReport: "রিপোর্ট পোস্ট করুন",
      postSuccess: "রিপোর্ট সফলভাবে পোস্ট করা হয়েছে!",
      postError: "রিপোর্ট পোস্ট করতে সমস্যা হয়েছে।",
      monthlyReportTitle: "আমার মাসিক ইবাদত রিপোর্ট",
      prayerStats: "নামাজ সম্পন্ন",
      quranStats: "কুরআন পৃষ্ঠা",
      zikrStats: "যিকির সংখ্যা",
      thisMonth: "এই মাস",
      usernameLabel: "ইউজারনেম",
      usernameHint: "শুধুমাত্র ছোট হাতের অক্ষর, সংখ্যা এবং আন্ডারস্কোর (_) ব্যবহার করা যাবে।",
      saveBtn: "সেভ করুন",
      postReportConfirm: "আপনি কি এই রিপোর্টটি সোশ্যাল ফিডে পোস্ট করতে চান?",
      prayerBreakdown: "নামাজের বিবরণ:",
      fajr: "ফজর",
      dhuhr: "যোহর",
      asr: "আসর",
      maghrib: "মাগরিব",
      isha: "এশা",
      days: "দিন",
      fasting: "রোজা",
      qaza: "কাজা নামাজ",
      water: "পানি",
      sleep: "ঘুম",
      sadaqah: "সাদাকাহ",
      dailyHabits: "দৈনন্দিন অভ্যাস (আজ)",
      glasses: "গ্লাস",
      hours: "ঘণ্টা",
      yes: "হ্যাঁ",
      no: "না",
      mood: "মন মেজাজ",
      reflection: "প্রতিফলন"
    },
    ar: {
      welcome: "مرحبًا بك في مسلم ساتي",
      loginNote: "تسجيل الدخول لحفظ إعداداتك وبياناتك",
      loginBtn: "تسجيل الدخول / التسجيل",
      user: "مستخدم",
      followers: "متابعون",
      following: "يتابع",
      statusToday: "حالة العبادة (اليوم)",
      prayerToday: "صلاة اليوم",
      quranReading: "تلاوة القرآن",
      zikrTasbih: "الذكر والتسبيح",
      allPrayersDone: "ما شاء الله! اكتملت جميع الصلوات",
      prayersLeft: (left: number) => `بقي ${left} صلوات فقط`,
      targetReached: "تم الوصول إلى هدف اليوم",
      targetQuran: "الهدف: 10 صفحات",
      targetZikr: "الهدف: 1000 مرة",
      prayerTracker: "متتبع الصلاة",
      today: "اليوم",
      days7: "7 أيام",
      days30: "30 يومًا",
      completed: "مكتمل",
      missed: "فائت",
      monthlyReport: "التقرير الشهري (هذا الشهر)",
      prayer: "الصلاة",
      quran: "القرآن",
      zikr: "الذكر",
      totalReading: "إجمالي التلاوة",
      totalTasbih: "إجمالي التسبيح",
      avg: "المتوسط",
      pagesDay: "صفحة/يوم",
      timesDay: "مرة/يوم",
      achievements: "إنجازات هذا الشهر",
      earned: "مكتسب",
      favorites: "المفضلة",
      savedDua: "الأدعية المحفوظة",
      bookmarkedAyat: "الآيات المحفوظة",
      favoriteHadith: "الحديث المفضل",
      reminderStatus: "حالة التذكير",
      shortcutSettings: "إعدادات الاختصار",
      setLocation: "تعيين موقعك",
      locationNotSet: "لم يتم تعيين الموقع",
      editProfile: "تعديل الملف الشخصي",
      notificationSettings: "إعدادات الإشعارات",
      changeLanguage: "تغيير اللغة",
      myPosts: "منشوراتي",
      seeAllPosts: "عرض جميع المنشورات",
      myShop: "متجري",
      comingSoon: "قريباً",
      changePassword: "تغيير كلمة المرور",
      logout: "تسجيل الخروج",
      deleteAccount: "حذف الحساب",
      postReport: "نشر التقرير",
      postSuccess: "تم نشر التقرير بنجاح!",
      postError: "فشل في نشر التقرير.",
      monthlyReportTitle: "تقرير العبادة الشهري",
      prayerStats: "الصلوات المكتملة",
      quranStats: "صفحات القرآن",
      zikrStats: "عدد الأذكار",
      items: "عناصر",
      usernameLabel: "اسم المستخدم",
      usernameHint: "يُسمح فقط بالأحرف الصغيرة والأرقام والشرطات السفلية (_).",
      saveBtn: "حفظ",
      thisMonth: "هذا الشهر",
      postReportConfirm: "هل تريد نشر هذا التقرير في الموجز الاجتماعي؟",
      prayerBreakdown: "تفاصيل الصلاة:",
      fajr: "الفجر",
      dhuhr: "الظهر",
      asr: "العصر",
      maghrib: "المغرب",
      isha: "العشاء",
      days: "أيام",
      fasting: "صيام",
      qaza: "قضاء",
      water: "ماء",
      sleep: "نوم",
      sadaqah: "صدقة",
      dailyHabits: "العادات اليومية (اليوم)",
      glasses: "أكواب",
      hours: "ساعات",
      yes: "نعم",
      no: "لا",
      mood: "مزاج",
      reflection: "تأمل"
    },
    hi: {
      welcome: "मुस्लिम साथी में आपका स्वागत है",
      loginNote: "अपनी सेटिंग्स और डेटा सहेजने के लिए लॉगिन करें",
      loginBtn: "लॉगिन / साइन अप",
      user: "उपयोगकर्ता",
      followers: "फ़ॉलोअर्स",
      following: "फ़ॉলো कर रहे हैं",
      statusToday: "इबादत स्थिति (आज)",
      prayerToday: "आज की नमाज़",
      quranReading: "कुरान पाठ",
      zikrTasbih: "ज़िक्र और तस्बीह",
      allPrayersDone: "माशाअल्लाह! सभी नमाज़ पूरी हुईं",
      prayersLeft: (left: number) => `केवल ${left} नमाज़ बाकी`,
      targetReached: "आज का लक्ष्य पूरा हुआ",
      targetQuran: "लक्ष्य: 10 पृष्ठ",
      targetZikr: "लक्ष्य: 1000 बार",
      prayerTracker: "नमाज़ ट्रैकर",
      today: "आज",
      days7: "7 दिन",
      days30: "30 दिन",
      completed: "पूरा हुआ",
      missed: "छूट गया",
      monthlyReport: "मासिक रिपोर्ट (इस महीने)",
      prayer: "नमाज़",
      quran: "कुरान",
      zikr: "ज़िक्र",
      totalReading: "कुल पाठ",
      totalTasbih: "कुल तस्बीह",
      avg: "औसत",
      pagesDay: "पृष्ठ/दिन",
      timesDay: "बार/दिन",
      achievements: "इस महीने की उपलब्धियां",
      earned: "अर्जित",
      favorites: "पसंदीदा",
      savedDua: "सहेजी गई दुआ",
      bookmarkedAyat: "बुकमार्क की गई आयत",
      favoriteHadith: "पसंदीदा हदीस",
      reminderStatus: "रिमाइंडर स्थिति",
      shortcutSettings: "शॉर्टकट सेटिंग्स",
      setLocation: "अपना स्थान सेट करें",
      locationNotSet: "स्थान सेट नहीं है",
      editProfile: "प्रोफ़ाइल संपादित करें",
      notificationSettings: "अधिसूचना सेटिंग्स",
      changeLanguage: "भाषा बदलें",
      myPosts: "मेरी पोस्ट",
      seeAllPosts: "सभी पोस्ट देखें",
      myShop: "मेरी दुकान",
      comingSoon: "जल्द आ रहा है",
      changePassword: "पासवर्ड बदलें",
      logout: "लॉग आउट",
      deleteAccount: "खाता हटाएं",
      postReport: "रिपोर्ट पोस्ट करें",
      postSuccess: "रिपोर्ट सफलतापूर्वक पोस्ट की गई!",
      postError: "रिपोर्ट पोस्ट करने में विफल।",
      monthlyReportTitle: "मेरी मासिक इबादत रिपोर्ट",
      prayerStats: "नमाज़ पूरी हुई",
      quranStats: "कुरान पृष्ठ",
      zikrStats: "ज़िक्र गिनती",
      items: "आइटम",
      usernameLabel: "उपयोगकर्ता नाम",
      usernameHint: "केवल छोटे अक्षर, संख्याएं और अंडरस्कोर (_) की अनुमति है।",
      saveBtn: "सहेजें",
      thisMonth: "इस महीने",
      postReportConfirm: "क्या आप इस रिपोर्ट को सोशल फीड पर पोस्ट करना चाहते हैं?",
      prayerBreakdown: "नमाज़ का विवरण:",
      fajr: "फज्र",
      dhuhr: "ज़ुहर",
      asr: "असर",
      maghrib: "मग़रिब",
      isha: "ईशा",
      days: "दिन",
      fasting: "उपवास",
      qaza: "क़ज़ा",
      water: "पानी",
      sleep: "नींद",
      sadaqah: "सदक़ा",
      dailyHabits: "दैनिक आदतें (आज)",
      glasses: "गिलास",
      hours: "घंटे",
      yes: "हाँ",
      no: "नहीं",
      mood: "मनोदशा",
      reflection: "प्रतिबिंब"
    }
  }[language] || {
    welcome: "Welcome to Muslim Sathi",
    loginNote: "Login to save your settings and data",
    loginBtn: "Login",
    user: "User",
    followers: "Followers",
    following: "Following",
    statusToday: "Ibadat Status (Today)",
    prayerToday: "Today's Prayer",
    quranReading: "Quran Reading",
    zikrTasbih: "Zikr & Tasbih",
    allPrayersDone: "Ma sha Allah! All prayers completed",
    prayersLeft: (left: number) => `Only ${left} prayers left`,
    targetReached: "Today's target reached",
    targetQuran: "Target: 10 pages",
    targetZikr: "Target: 1000 times",
    prayerTracker: "Prayer Tracker",
    today: "Today",
    days7: "7 Days",
    days30: "30 Days",
    completed: "Completed",
    missed: "Missed",
    monthlyReport: "Monthly Report (This Month)",
    prayer: "Prayer",
    quran: "Quran",
    zikr: "Zikr",
    totalReading: "Total Reading",
    totalTasbih: "Total Tasbih",
    avg: "Avg",
    pagesDay: "pages/day",
    timesDay: "times/day",
    achievements: "Achievements This Month",
    earned: "earned",
    favorites: "Favorites",
    savedDua: "Saved Dua",
    bookmarkedAyat: "Bookmarked Ayat",
    favoriteHadith: "Favorite Hadith",
    reminderStatus: "Reminder Status",
    shortcutSettings: "Shortcut Settings",
    setLocation: "Set Your Location",
    locationNotSet: "Location not set",
    editProfile: "Edit Profile",
    notificationSettings: "Notification Settings",
    changeLanguage: "Change Language",
    myPosts: "My Posts",
    seeAllPosts: "See all posts",
    myShop: "My Shop",
    comingSoon: "Coming Soon",
    changePassword: "Change Password",
    logout: "Logout",
    deleteAccount: "Delete Account",
    postReport: "Post Report",
    postSuccess: "Report posted successfully!",
    postError: "Failed to post report.",
    monthlyReportTitle: "My Monthly Ibadat Report",
    prayerStats: "Prayers Completed",
    quranStats: "Quran Pages",
    zikrStats: "Zikr Count",
    items: "items",
    thisMonth: "This Month",
    postReportConfirm: "Do you want to post this report to the social feed?",
    prayerBreakdown: "Prayer Breakdown:",
    fajr: "Fajr",
    dhuhr: "Dhuhr",
    asr: "Asr",
    maghrib: "Maghrib",
    isha: "Isha",
    days: "days",
    fasting: "Fasting",
    qaza: "Qaza Prayer",
    water: "Water",
    sleep: "Sleep",
    sadaqah: "Sadaqah",
    dailyHabits: "Daily Habits (Today)",
    glasses: "glasses",
    hours: "hours",
    yes: "Yes",
    no: "No",
    mood: "Mood",
    reflection: "Reflection"
  };
  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-950 pb-2 font-sans relative">
      {/* Header Section */}
      <div className="bg-[#F5F7F5] dark:bg-slate-900 pb-5 rounded-b-lg border-b border-slate-200 dark:border-slate-800 relative overflow-hidden">
        {/* Top Teal Header - Compact */}
        <div className="h-[calc(5rem+env(safe-area-inset-top))] bg-primary-light/30 dark:bg-primary-dark/40 relative overflow-hidden">
          <div className="absolute -bottom-4 left-1/4 w-10 h-10 bg-primary-light/40 dark:bg-primary-dark/50 rounded-full"></div>
          <div className="absolute -bottom-3 right-1/4 w-12 h-12 bg-primary-light/40 dark:bg-primary-dark/50 rounded-full"></div>
        </div>

        {/* Content Card - Compact */}
        <div className="px-4 -mt-12 relative z-10 flex flex-col items-center">
          {/* Avatar Circle - Larger */}
          <div className="w-24 h-24 bg-[#F5F7F5] dark:bg-slate-900 rounded-full flex items-center justify-center">
            <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm overflow-hidden">
              {!user ? (
                <User className="w-10 h-10 text-slate-400" />
              ) : user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-primary-light/20 dark:bg-primary-dark/30 flex items-center justify-center text-primary dark:text-primary-light font-bold text-3xl">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
            </div>
          </div>

          {/* Text - Compact */}
          <div className="mt-2 text-center px-4">
            {!user ? (
              <>
                <h1 className="text-xl font-bold text-slate-800 dark:text-white mb-1">{t.welcome}</h1>
                <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed max-w-xs mx-auto mb-3">
                  {t.loginNote}
                </p>

                {/* Login Button - Compact */}
                <button
                  onClick={() => onNavigate?.('auth')}
                  className="w-full max-w-[200px] mx-auto bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-full transition-colors shadow-sm text-sm"
                >
                  {t.loginBtn}
                </button>
              </>
            ) : (
              <>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{user.displayName || t.user}</h1>
                <div className="flex flex-col items-center space-y-1">
                  <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 text-sm">
                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-mono">
                      @{username || user?.uid?.slice(0, 8) || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 mt-1">
                    <div className="text-primary dark:text-primary-light font-bold text-sm">
                      {followerCount} {t.followers}
                    </div>
                    <div className="text-primary dark:text-primary-light font-bold text-sm">
                      {followingCount} {t.following}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-3 max-w-2xl mx-auto">
          {errorMsg && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{errorMsg}</span>
            </div>
          )}
          {/* ইবাদত স্ট্যাটাস (Main Highlight) */}
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 px-2 uppercase tracking-wider">{t.statusToday}</h3>
            <div className="grid grid-cols-1 gap-2">
              <StatusCard 
                icon={<Clock className="w-5 h-5 text-primary" />}
                title={t.prayerToday}
                value={`${completedToday}/5`}
                progress={(completedToday / 5) * 100}
                color="bg-primary"
                label={completedToday === 5 ? t.allPrayersDone : t.prayersLeft(5 - completedToday)}
              />
              <StatusCard 
                icon={<BookOpen className="w-5 h-5 text-blue-500" />}
                title={t.quranReading}
                value={`${todayData.quran || 0} ${globalT('pages' as any) || 'pages'}`}
                progress={Math.min(100, ((todayData.quran || 0) / 10) * 100)}
                color="bg-blue-500"
                label={todayData.quran >= 10 ? t.targetReached : t.targetQuran}
              />
              <StatusCard 
                icon={<Zap className="w-5 h-5 text-amber-500" />}
                title={t.zikrTasbih}
                value={`${todayData.zikr || 0} ${globalT('times' as any) || 'times'}`}
                progress={Math.min(100, ((todayData.zikr || 0) / 1000) * 100)}
                color="bg-amber-500"
                label={t.targetZikr}
              />
            </div>
          </section>

          {/* Daily Habits */}
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 px-2 uppercase tracking-wider">{t.dailyHabits}</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <Droplets className="w-4 h-4 text-blue-500" />
                  </div>
                  <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">{t.water}</span>
                </div>
                <span className="text-sm font-black text-slate-900 dark:text-white">{todayData.water || 0} <span className="text-[10px] font-normal text-slate-500">{t.glasses}</span></span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center">
                    <Bed className="w-4 h-4 text-indigo-500" />
                  </div>
                  <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">{t.sleep}</span>
                </div>
                <span className="text-sm font-black text-slate-900 dark:text-white">{todayData.sleep || 0} <span className="text-[10px] font-normal text-slate-500">{t.hours}</span></span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-rose-50 dark:bg-rose-900/20 rounded-lg flex items-center justify-center">
                    <HeartHandshake className="w-4 h-4 text-rose-500" />
                  </div>
                  <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">{t.sadaqah}</span>
                </div>
                <span className="text-sm font-black text-slate-900 dark:text-white">{todayData.sadaqah ? t.yes : t.no}</span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary-light/20 dark:bg-primary-dark/20 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  </div>
                  <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">{t.fasting}</span>
                </div>
                <span className="text-sm font-black text-slate-900 dark:text-white">{todayData.fasting ? t.yes : t.no}</span>
              </div>
            </div>
          </section>

          {/* নামাজ ট্র্যাকার (History) */}
          <section className="bg-white dark:bg-slate-900 rounded-lg p-5 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 dark:text-slate-200">{t.prayerTracker}</h3>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                {(['today', 'week', 'month'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "px-2.5 py-1 text-[10px] font-bold rounded-md transition-all",
                      activeTab === tab 
                        ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400" 
                        : "text-slate-500"
                    )}
                  >
                    {tab === 'today' ? t.today : tab === 'week' ? t.days7 : t.days30}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-lg border border-indigo-100/50 dark:border-indigo-900/20">
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">{t.completed}</p>
                <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                  {stats.completed}
                </p>
              </div>
              <div className="p-3.5 bg-rose-50/50 dark:bg-rose-900/10 rounded-lg border border-rose-100/50 dark:border-rose-900/20">
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">{t.missed}</p>
                <p className="text-xl font-bold text-rose-600 dark:text-rose-400">
                  {stats.missed}
                </p>
              </div>
              <div className="p-3.5 bg-amber-50/50 dark:bg-amber-900/10 rounded-lg border border-amber-100/50 dark:border-amber-900/20">
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">{t.qaza}</p>
                <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                  {stats.totalQaza}
                </p>
              </div>
            </div>
          </section>

          {/* মাসিক রিপোর্ট (Monthly Report) */}
          <section className="bg-white dark:bg-slate-900 rounded-lg p-5 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 dark:text-slate-200">{t.monthlyReport}</h3>
              {user && (
                <button 
                  onClick={handlePostReport}
                  disabled={isSavingProfile}
                  className="flex items-center space-x-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-[10px] font-bold transition-colors shadow-sm"
                >
                  <Send className="w-3 h-3" />
                  <span>{t.postReport}</span>
                </button>
              )}
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                <span>{globalT('current-month-progress' as any) || 'Current Month Progress'}</span>
                <span>{Math.round((stats.completed / (stats.daysCount * 5)) * 100)}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (stats.completed / (stats.daysCount * 5)) * 100)}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
               <div className="p-3.5 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-lg border border-indigo-100/50 dark:border-indigo-900/20">
                 <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">{t.prayer}</p>
                 <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                   {currentMonthStats.completed}
                 </p>
                 <p className="text-[8px] text-slate-400 mt-1">{(t as any).thisMonth}</p>
               </div>
               <div className="p-3.5 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-100/50 dark:border-blue-900/20">
                 <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">{t.quran}</p>
                 <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                   {currentMonthStats.totalQuran}
                 </p>
                 <p className="text-[8px] text-slate-400 mt-1">{(t as any).thisMonth}</p>
               </div>
               <div className="p-3.5 bg-amber-50/50 dark:bg-amber-900/10 rounded-lg border border-amber-100/50 dark:border-amber-900/20">
                 <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">{t.zikr}</p>
                 <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                   {currentMonthStats.totalZikr}
                 </p>
                 <p className="text-[8px] text-slate-400 mt-1">{(t as any).thisMonth}</p>
               </div>
            </div>
          </section>

          {/* কুরআন ও যিকির ট্র্যাকার */}
          <section className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
              <div className="w-9 h-9 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mb-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">{t.totalReading}</p>
              <p className="text-base font-bold text-slate-800 dark:text-slate-200">{overallStats.totalQuran} {globalT('pages' as any) || 'pages'}</p>
              <p className="text-[9px] text-slate-400 mt-0.5">{t.avg}: {Math.round(overallStats.totalQuran / Math.max(1, overallStats.daysCount))} {t.pagesDay}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
              <div className="w-9 h-9 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-center justify-center mb-2">
                <Hash className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">{t.totalTasbih}</p>
              <p className="text-base font-bold text-slate-800 dark:text-slate-200">{overallStats.totalZikr} {globalT('times' as any) || 'times'}</p>
              <p className="text-[9px] text-slate-400 mt-0.5">{t.avg}: {Math.round(overallStats.totalZikr / Math.max(1, overallStats.daysCount))} {t.timesDay}</p>
            </div>
          </section>

          {/* অর্জন (Achievements / Badges) */}
          <section className="space-y-2">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t.achievements}</h3>
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">{earnedBadges.length}/{BADGE_DEFINITIONS.length} {t.earned}</span>
            </div>
            <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide px-2">
              {BADGE_DEFINITIONS.map((badge) => {
                const isEarned = earnedBadges.includes(badge.id);
                return (
                  <Badge 
                    key={badge.id}
                    icon={badge.icon} 
                    title={globalT(badge.titleKey as any)} 
                    isLocked={!isEarned}
                    type={badge.type}
                    description={globalT(badge.descKey as any)}
                  />
                );
              })}
            </div>
          </section>

          {/* Saved / Favorite */}
          <section className="bg-white dark:bg-slate-900 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-800">
            <div className="p-3.5 border-b border-slate-50 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-slate-200">{t.favorites}</h3>
            </div>
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              <FavoriteItem 
                icon={<Heart className="text-rose-500" />} 
                title={t.savedDua} 
                count={favoriteDuaCount} 
                suffix={t.items} 
                onClick={() => setShowFavoriteDuas(true)}
              />
              <FavoriteItem 
                icon={<Bookmark className="text-indigo-500" />} 
                title={t.bookmarkedAyat} 
                count={favoriteAyatCount} 
                suffix={t.items} 
                onClick={() => setShowFavoriteAyats(true)}
              />
              <FavoriteItem 
                icon={<Star className="text-amber-500" />} 
                title={t.favoriteHadith} 
                count={favoriteHadithCount} 
                suffix={t.items} 
                onClick={() => setShowFavoriteHadiths(true)}
              />
            </div>
          </section>

          {/* রিমাইন্ডার স্ট্যাটাস */}
          <section className="bg-white dark:bg-slate-900 rounded-lg p-5 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-800 dark:text-slate-200">{t.reminderStatus}</h3>
              <button 
                onClick={() => setShowReminderModal(true)}
                className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider"
              >
                {globalT('manage' as any)}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(reminders).map(([label, active]) => (
                <ReminderBadge 
                  key={label} 
                  label={label} 
                  active={active} 
                  onClick={() => toggleReminder(label)}
                />
              ))}
            </div>
          </section>

          {/* Quick Settings */}
          <section className="bg-white dark:bg-slate-900 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-800">
            <div className="p-3.5 border-b border-slate-50 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-slate-200">{t.shortcutSettings}</h3>
            </div>
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              <MenuItem 
                icon={<User className="text-blue-500" />} 
                title={t.editProfile} 
                onClick={() => {
                  if (!user) {
                    onNavigate?.('auth');
                  } else {
                    setShowEditProfilePage(true);
                  }
                }}
              />
              <MenuItem 
                icon={<Globe className="text-primary" />} 
                title={t.changeLanguage} 
                onClick={() => setShowLanguageModal(true)}
              />
            </div>
          </section>

          {/* Edit Profile Modal */}
          <AnimatePresence>
            {showEditProfileModal && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[120] bg-black/60 flex items-center justify-center p-4"
                onClick={() => setShowEditProfileModal(false)}
              >
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-lg p-6 shadow-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">{t.editProfile}</h3>
                    <button onClick={() => setShowEditProfileModal(false)} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                      <X className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">{t.usernameLabel}</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">@</span>
                        <input 
                          type="text" 
                          value={newUsername}
                          onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 pl-8 pr-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                          placeholder="username"
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">{t.usernameHint}</p>
                    </div>
                    
                    <button 
                      onClick={handleUpdateProfile}
                      disabled={isSavingProfile || !newUsername.trim()}
                      className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-primary/20 flex items-center justify-center"
                    >
                      {isSavingProfile ? <Loader2 className="w-5 h-5 animate-spin" /> : t.saveBtn}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Location Selection Modal */}
          <LocationModal 
            isOpen={showLocationModal}
            onClose={() => setShowLocationModal(false)}
            currentCountry={country}
            currentCity={userLocation}
            currentLat={latitude}
            currentLon={longitude}
          />

          {/* Future Placeholders */}
          <section className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => {
                if (!user) {
                  onNavigate?.('auth');
                } else {
                  setShowMyPosts(true);
                }
              }}
              className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-100 dark:border-slate-800 text-left transition-all active:scale-95"
            >
              <div className="w-9 h-9 bg-primary-light/20 dark:bg-primary-dark/20 rounded-lg flex items-center justify-center mb-2">
                <MessageSquare className="w-4 h-4 text-primary dark:text-primary-light" />
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{t.myPosts}</p>
              <p className="text-[9px] text-primary dark:text-primary-light font-bold mt-0.5">{t.seeAllPosts}</p>
            </button>
            <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 opacity-70">
              <div className="w-9 h-9 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center mb-2">
                <ShoppingBag className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-400">{t.myShop}</p>
              <p className="text-[9px] text-indigo-600 dark:text-indigo-400 font-bold mt-0.5">{t.comingSoon}</p>
            </div>
          </section>

          {/* My Posts Full Screen View */}
          <AnimatePresence>
            {showMyPosts && user && (
              <MyPosts 
                currentUser={user} 
                onBack={() => setShowMyPosts(false)} 
              />
            )}
          </AnimatePresence>

          {/* Favorite Views */}
          <AnimatePresence>
            {showFavoriteAyats && (
              <motion.div 
                key="ayats"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="fixed inset-0 z-[150] bg-slate-50 dark:bg-slate-950 pb-20 overflow-y-auto"
              >
                <SavedAyatsView 
                  onBack={() => setShowFavoriteAyats(false)} 
                  ayats={favoriteAyats}
                  title={t.bookmarkedAyat}
                />
              </motion.div>
            )}
            {showFavoriteDuas && (
              <motion.div 
                key="duas"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="fixed inset-0 z-[150] bg-slate-50 dark:bg-slate-950 pb-20 overflow-y-auto"
              >
                <SavedDuasView 
                  onBack={() => setShowFavoriteDuas(false)} 
                  duas={favoriteDuas}
                  title={t.savedDua}
                />
              </motion.div>
            )}
            {showFavoriteHadiths && (
              <motion.div 
                key="hadiths"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="fixed inset-0 z-[150] bg-slate-50 dark:bg-slate-950 pb-20 overflow-y-auto"
              >
                <SavedHadithsView 
                  onBack={() => setShowFavoriteHadiths(false)} 
                  hadiths={favoriteHadiths}
                  title={t.favoriteHadith}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reminder Management Modal */}
          <AnimatePresence>
            {showReminderModal && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[150] bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4"
                onClick={() => setShowReminderModal(false)}
              >
                <motion.div 
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-lg sm:rounded-lg p-6 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{globalT('manage-reminders' as any)}</h3>
                    <button onClick={() => setShowReminderModal(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex gap-2 mb-6">
                    <input 
                      type="text" 
                      value={newReminderLabel}
                      onChange={(e) => setNewReminderLabel(e.target.value)}
                      placeholder={globalT('new-reminder' as any)}
                      className="flex-grow p-3 bg-slate-100 dark:bg-slate-800 rounded-lg border-none outline-none text-sm"
                    />
                    <button 
                      onClick={() => {
                        if (newReminderLabel.trim()) {
                          setReminders(prev => ({ ...prev, [newReminderLabel.trim()]: true }));
                          setNewReminderLabel('');
                        }
                      }}
                      className="p-3 bg-indigo-600 text-white rounded-lg font-bold text-sm"
                    >
                      {globalT('add' as any)}
                    </button>
                  </div>

                  <div className="overflow-y-auto space-y-2 pr-2">
                    {Object.entries(reminders).map(([label, active]) => (
                      <div key={label} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <div className="flex items-center">
                          <div className={cn("w-2 h-2 rounded-full mr-3", active ? "bg-indigo-600" : "bg-slate-300")} />
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => toggleReminder(label)}
                            className={cn(
                              "px-3 py-1 rounded-lg text-[10px] font-bold transition-colors",
                              active ? "bg-indigo-100 text-indigo-600" : "bg-slate-200 text-slate-500"
                            )}
                          >
                            {active ? globalT('on' as any) : globalT('off' as any)}
                          </button>
                          <button 
                            onClick={() => {
                              const next = { ...reminders };
                              delete next[label];
                              setReminders(next);
                            }}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Account Control */}
          {user && (
            <section className="bg-white dark:bg-slate-900 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-800">
              <div className="divide-y divide-slate-50 dark:divide-slate-800">
                <MenuItem icon={<Lock className="text-slate-500" />} title={t.changePassword} onClick={handleChangePassword} />
                <MenuItem icon={<LogOut className="text-rose-500" />} title={t.logout} onClick={handleLogout} />
                <MenuItem icon={<Trash2 className="text-slate-400" />} title={t.deleteAccount} isDanger onClick={handleDeleteAccount} />
              </div>
            </section>
          )}

          {/* Language Selection Full Screen Page */}
          <AnimatePresence>
            {showLanguageModal && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="fixed inset-0 z-[120] bg-white dark:bg-slate-950 pb-20 overflow-y-auto"
              >
                <div className="flex items-center p-4 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md z-10">
                  <button 
                    onClick={() => window.history.back()}
                    className="p-2 -ml-2 mr-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                  </button>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {t.language}
                  </h2>
                </div>
                <LanguageSelectionView />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Edit Profile Full Screen Page */}
          <AnimatePresence>
            {showEditProfilePage && user && (
              <EditProfilePage 
                currentUser={user}
                language={language}
                onBack={() => setShowEditProfilePage(false)}
                onUpdate={(newData) => {
                  if (newData.displayName) {
                    setUser({ ...user, displayName: newData.displayName });
                  }
                  if (newData.username) {
                    setUsername(newData.username);
                  }
                }}
              />
            )}
          </AnimatePresence>

          {/* Change Password Full Screen Page */}
          <AnimatePresence>
            {showChangePasswordModal && user && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="fixed inset-0 z-[120] bg-white dark:bg-slate-950 flex flex-col pb-20 overflow-y-auto"
              >
                <div className={cn(
                  "sticky top-0 z-10 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-4 py-4 flex items-center gap-4",
                  "pt-safe"
                )}>
                  {!isMobile && (
                    <button 
                      onClick={() => setShowChangePasswordModal(false)}
                      className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <ArrowLeft className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                    </button>
                  )}
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t.changePassword}</h2>
                </div>
                <div className="p-6 flex-1">
                  <form onSubmit={submitPasswordChange} className="space-y-4 max-w-md mx-auto">
                    {passwordError && (
                      <div className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-sm rounded-lg border border-rose-100 dark:border-rose-900/30">
                        {passwordError}
                      </div>
                    )}
                    {passwordSuccess && (
                      <div className="p-3 bg-primary-light/20 dark:bg-primary-dark/20 text-primary dark:text-primary-light text-sm rounded-lg border border-primary-light/30 dark:border-primary-dark/30">
                        {passwordSuccess}
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Current Password</label>
                      <input 
                        type="password" 
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">New Password</label>
                      <input 
                        type="password" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirm Password</label>
                      <input 
                        type="password" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                        required
                      />
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <button 
                        type="button"
                        onClick={() => {
                          setShowChangePasswordModal(false);
                          setShowForgotPasswordModal(true);
                        }}
                        className="text-sm text-primary dark:text-primary-light font-medium hover:underline"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <button 
                      type="submit"
                      disabled={isChangingPassword}
                      className="w-full py-3.5 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-6"
                    >
                      {isChangingPassword ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Password'}
                    </button>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Forgot Password Full Screen Page */}
          <AnimatePresence>
            {showForgotPasswordModal && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="fixed inset-0 z-[130] bg-white dark:bg-slate-950 flex flex-col pb-20 overflow-y-auto"
              >
                <div className={cn(
                  "sticky top-0 z-10 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-4 py-4 flex items-center gap-4",
                  "pt-safe"
                )}>
                  {!Capacitor.isNativePlatform() && (
                    <button 
                      onClick={() => setShowForgotPasswordModal(false)}
                      className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <ArrowLeft className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                    </button>
                  )}
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Forgot Password</h2>
                </div>
                <div className="p-6 flex-1">
                  {resetStep === 1 ? (
                    <form onSubmit={submitForgotPassword} className="space-y-4 max-w-md mx-auto">
                      <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
                        Enter your email address and we'll send you an OTP code to reset your password.
                      </p>
                      {passwordError && (
                        <div className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-sm rounded-lg border border-rose-100 dark:border-rose-900/30">
                          {passwordError}
                        </div>
                      )}
                      {passwordSuccess && (
                        <div className="p-3 bg-primary-light/20 dark:bg-primary-dark/20 text-primary dark:text-primary-light text-sm rounded-lg border border-primary-light/30 dark:border-primary-dark/30">
                          {passwordSuccess}
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                        <input 
                          type="email" 
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          className="w-full px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                          required
                        />
                      </div>
                      <button 
                        type="submit"
                        disabled={isChangingPassword}
                        className="w-full py-3.5 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-6"
                      >
                        {isChangingPassword ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send OTP Code'}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={submitResetPassword} className="space-y-4 max-w-md mx-auto">
                      <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
                        Enter the 6-digit code sent to <b>{resetEmail}</b> and your new password.
                      </p>
                      {passwordError && (
                        <div className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-sm rounded-lg border border-rose-100 dark:border-rose-900/30">
                          {passwordError}
                        </div>
                      )}
                      {passwordSuccess && (
                        <div className="p-3 bg-primary-light/20 dark:bg-primary-dark/20 text-primary dark:text-primary-light text-sm rounded-lg border border-primary-light/30 dark:border-primary-dark/30">
                          {passwordSuccess}
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">OTP Code</label>
                        <input 
                          type="text" 
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="123456"
                          className="w-full px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:text-white text-center text-2xl tracking-[10px] font-bold"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">New Password</label>
                        <input 
                          type="password" 
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirm New Password</label>
                        <input 
                          type="password" 
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                          required
                        />
                      </div>
                      <button 
                        type="submit"
                        disabled={isChangingPassword}
                        className="w-full py-3.5 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-6"
                      >
                        {isChangingPassword ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset Password'}
                      </button>
                      <button 
                        type="button"
                        onClick={() => setResetStep(1)}
                        className="w-full py-2 text-slate-500 text-sm font-medium"
                      >
                        Back to Email
                      </button>
                    </form>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {/* Delete Account Confirmation Modal */}
          <AnimatePresence>
            {showDeleteModal && (
              <div className="absolute inset-0 z-[200] flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => !isDeletingAccount && setShowDeleteModal(false)}
                  className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-lg shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden"
                >
                  <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Trash2 className="w-8 h-8 text-rose-600 dark:text-rose-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                      Delete Account
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                      Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowDeleteModal(false)}
                        disabled={isDeletingAccount}
                        className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={confirmDeleteAccount}
                        disabled={isDeletingAccount}
                        className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isDeletingAccount ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Delete'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
    </div>
  );
}

function StatusCard({ icon, title, value, progress, color, label }: any) {
  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center">
            {icon}
          </div>
          <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">{title}</span>
        </div>
        <span className="text-base font-black text-slate-900 dark:text-white">{value}</span>
      </div>
      <div className="space-y-1.5">
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className={cn("h-full rounded-full bg-gradient-to-r", 
              color === 'bg-emerald-500' || color === 'bg-primary' ? 'from-primary-light to-primary-dark' :
              color === 'bg-blue-500' ? 'from-blue-400 to-blue-600' :
              color === 'bg-amber-500' ? 'from-amber-400 to-amber-600' :
              color
            )}
          />
        </div>
        <p className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">{label}</p>
      </div>
    </div>
  );
}

function Badge({ icon, title, isLocked, type }: any) {
  const getTheme = () => {
    if (isLocked) return {
      container: "border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-800 opacity-60",
      icon: "text-slate-400 opacity-20",
      label: "bg-slate-300 text-slate-500",
      ribbon: "bg-slate-200",
      glow: "hidden"
    };
    switch (type) {
      case 'gold': return {
        container: "border-yellow-200 bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 shadow-[0_4px_8px_-2px_rgba(234,179,8,0.4),inset_0_1px_2px_rgba(255,255,255,0.4)]",
        icon: "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]",
        label: "bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-sm",
        ribbon: "bg-gradient-to-b from-amber-500 to-amber-700",
        glow: "bg-yellow-400/40"
      };
      case 'silver': return {
        container: "border-slate-100 bg-gradient-to-br from-slate-200 via-slate-400 to-slate-600 shadow-[0_4px_8px_-2px_rgba(148,163,184,0.4),inset_0_1px_2px_rgba(255,255,255,0.4)]",
        icon: "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]",
        label: "bg-gradient-to-r from-slate-400 to-slate-600 text-white shadow-md",
        ribbon: "bg-gradient-to-b from-slate-500 to-slate-700",
        glow: "bg-slate-300/40"
      };
      case 'bronze': return {
        container: "border-amber-600 bg-gradient-to-br from-amber-400 via-amber-700 to-amber-900 shadow-[0_4px_8px_-2px_rgba(180,83,9,0.4),inset_0_1px_2px_rgba(255,255,255,0.4)]",
        icon: "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]",
        label: "bg-gradient-to-r from-amber-700 to-amber-900 text-white shadow-md",
        ribbon: "bg-gradient-to-b from-amber-800 to-amber-950",
        glow: "bg-amber-600/40"
      };
      default: return {
        container: "border-indigo-400 bg-indigo-500",
        icon: "text-white",
        label: "bg-indigo-600 text-white",
        ribbon: "bg-indigo-700",
        glow: "hidden"
      };
    }
  };

  const theme = getTheme();

  return (
    <div 
      className={cn(
        "flex-shrink-0 flex flex-col items-center space-y-1.5 transition-all duration-500",
        isLocked ? "scale-90" : "scale-100 hover:scale-110 active:scale-95"
      )}
    >
      <div className="relative">
        {/* Glow Effect */}
        {!isLocked && (
          <div className={cn(
            "absolute inset-0 rounded-full blur-sm opacity-30 z-0",
            theme.glow
          )} />
        )}

        {/* Ribbon Effect */}
        {!isLocked && (
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 flex space-x-0.5 z-0">
            <div className={cn("w-2.5 h-5 -rotate-[15deg] rounded-b-sm shadow-sm", theme.ribbon)} 
                 style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 50% 85%, 0% 100%)' }} />
            <div className={cn("w-2.5 h-5 rotate-[15deg] rounded-b-sm shadow-sm", theme.ribbon)} 
                 style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 50% 85%, 0% 100%)' }} />
          </div>
        )}

        <div className={cn(
          "w-10 h-10 rounded-full border-2 flex items-center justify-center relative overflow-hidden group z-10",
          theme.container
        )}>
          {/* Glossy Overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/40 via-transparent to-transparent pointer-events-none" />
          
          <div className={cn("z-20 transition-transform duration-300 group-hover:scale-110", theme.icon)}>
            {icon}
          </div>

          {/* Inner Decorative Ring */}
          <div className="absolute inset-0.5 border border-white/20 rounded-full pointer-events-none" />
          
          {/* Lock Overlay */}
          {isLocked && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-30 backdrop-blur-[0.5px]">
              <Lock className="w-3.5 h-3.5 text-white drop-shadow-md" />
            </div>
          )}

          {/* Gold Star */}
          {type === 'gold' && !isLocked && (
            <div className="absolute top-0.5 right-0.5 z-30">
              <Star className="w-2 h-2 text-yellow-100 fill-yellow-100 drop-shadow-md animate-pulse" />
            </div>
          )}
        </div>
      </div>
      
      <div className="text-center w-14 px-0.5">
        <span className={cn(
          "text-[7px] font-black leading-tight block truncate drop-shadow-sm",
          isLocked ? "text-slate-400" : "text-slate-800 dark:text-slate-100"
        )}>
          {title}
        </span>
        {!isLocked && (
          <div className="flex justify-center mt-0.5">
            <div className={cn(
              "px-1 py-0.5 rounded-full text-[5px] font-black uppercase tracking-tighter shadow-sm",
              theme.label
            )}>
              {type}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FavoriteItem({ icon, title, count, suffix, onClick }: any) {
  return (
    <button onClick={onClick} className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
          {icon}
        </div>
        <span className="font-semibold text-slate-700 dark:text-slate-300">{title}</span>
      </div>
      <div className="flex items-center space-x-2">
        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-xs font-bold text-slate-500">{count}{suffix}</span>
        <ChevronRight className="w-4 h-4 text-slate-300" />
      </div>
    </button>
  );
}

function SavedAyatsView({ onBack, ayats, title }: { onBack: () => void, ayats: any[], title: string }) {
  const { t } = useLanguage();
  return (
    <>
      <div className={cn(
        "sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-4 pb-4 flex items-center gap-4",
        Capacitor.isNativePlatform() ? "pt-12" : "pt-4"
      )}>
        {!Capacitor.isNativePlatform() && (
          <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-slate-600 dark:text-slate-400" />
          </button>
        )}
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h2>
      </div>

      <div className="p-4 space-y-4 max-w-2xl mx-auto">
        {ayats.length === 0 ? (
          <div className="text-center py-20">
            <Bookmark className="w-16 h-16 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
            <p className="text-slate-500 dark:text-slate-400">{t('no-saved-ayat' as any)}</p>
          </div>
        ) : (
          ayats.map((ayat) => (
            <div key={ayat.id} className="bg-white dark:bg-slate-900 rounded-lg p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <span className="px-3 py-1 bg-primary-light/20 dark:bg-primary-dark/20 text-primary dark:text-primary-light rounded-full text-xs font-medium">
                  {ayat.surahName} : {ayat.ayahNumber}
                </span>
              </div>
              <p className="font-arabic text-2xl text-right leading-loose text-slate-800 dark:text-slate-100 mb-4" dir="rtl">
                {ayat.arabic}
              </p>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {ayat.translation}
              </p>
            </div>
          ))
        )}
      </div>
    </>
  );
}

function SavedDuasView({ onBack, duas, title }: { onBack: () => void, duas: any[], title: string }) {
  const { t } = useLanguage();
  return (
    <>
      <div className={cn(
        "sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-4 pb-4 flex items-center gap-4",
        Capacitor.isNativePlatform() ? "pt-12" : "pt-4"
      )}>
        {!Capacitor.isNativePlatform() && (
          <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-slate-600 dark:text-slate-400" />
          </button>
        )}
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h2>
      </div>

      <div className="p-4 space-y-4 max-w-2xl mx-auto">
        {duas.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-16 h-16 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
            <p className="text-slate-500 dark:text-slate-400">{t('no-favorite-dua' as any) || "No favorite duas found"}</p>
          </div>
        ) : (
          duas.map((dua) => (
            <div key={dua.id} className="bg-white dark:bg-slate-900 rounded-lg p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
              <h3 className="font-bold text-slate-800 dark:text-white mb-2">{dua.title}</h3>
              {dua.arabic && (
                <p className="font-arabic text-xl text-right leading-loose text-slate-800 dark:text-slate-100 mb-3" dir="rtl">
                  {dua.arabic}
                </p>
              )}
              {dua.translation && (
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-50 dark:border-slate-800 pt-3">
                  {dua.translation}
                </p>
              )}
              {dua.reference && (
                <p className="text-[10px] text-slate-400 mt-2 italic">{dua.reference}</p>
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
}

function SavedHadithsView({ onBack, hadiths, title }: { onBack: () => void, hadiths: any[], title: string }) {
  const { t } = useLanguage();
  return (
    <>
      <div className={cn(
        "sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-4 pb-4 flex items-center gap-4",
        Capacitor.isNativePlatform() ? "pt-12" : "pt-4"
      )}>
        {!Capacitor.isNativePlatform() && (
          <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-slate-600 dark:text-slate-400" />
          </button>
        )}
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h2>
      </div>

      <div className="p-4 space-y-4 max-w-2xl mx-auto">
        {hadiths.length === 0 ? (
          <div className="text-center py-20">
            <Star className="w-16 h-16 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
            <p className="text-slate-500 dark:text-slate-400">{t('no-favorite-hadith' as any) || "No favorite hadiths found"}</p>
          </div>
        ) : (
          hadiths.map((hadith) => (
            <div key={hadith.id} className="bg-white dark:bg-slate-900 rounded-lg p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] font-bold text-primary dark:text-primary-light bg-primary-light/20 dark:bg-primary-dark/20 px-2 py-1 rounded-lg uppercase">
                  {hadith.title}
                </span>
              </div>
              {hadith.arabic && (
                <p className="font-arabic text-xl text-right leading-loose text-slate-800 dark:text-slate-100 mb-4" dir="rtl">
                  {hadith.arabic}
                </p>
              )}
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed mb-3">
                {hadith.content}
              </p>
              <div className="flex flex-col gap-1 pt-3 border-t border-slate-50 dark:border-slate-800">
                {hadith.narrator && (
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    বর্ণনায়: <span className="text-primary dark:text-primary-light">{hadith.narrator}</span>
                  </p>
                )}
                {hadith.reference && (
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">
                    সূত্র: {hadith.reference}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

function MenuItem({ icon, title, subtitle, isDanger, onClick }: any) {
  return (
    <button onClick={onClick} className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
          {icon}
        </div>
        <div className="text-left">
          <span className={cn(
            "font-semibold block",
            isDanger ? "text-rose-500" : "text-slate-700 dark:text-slate-300"
          )}>{title}</span>
          {subtitle && <span className="text-[10px] text-slate-400">{subtitle}</span>}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-300" />
    </button>
  );
}

function ReminderBadge({ label, active, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-lg text-xs font-bold flex items-center transition-all active:scale-95",
        active 
          ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/20" 
          : "bg-slate-50 dark:bg-slate-800/50 text-slate-400 border border-slate-100 dark:border-slate-800"
      )}
    >
      <div className={cn(
        "w-1.5 h-1.5 rounded-full mr-2",
        active ? "bg-indigo-600 animate-pulse" : "bg-slate-300"
      )} />
      {label}
    </button>
  );
}
