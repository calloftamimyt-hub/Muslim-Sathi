import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Capacitor } from '@capacitor/core';
import { 
  X, User, Mail, Phone, Lock, CheckCircle2, AlertCircle, 
  Loader2, ChevronLeft, Camera, Shield, Eye, EyeOff
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { 
  updateProfile, 
  updatePassword, 
  reauthenticateWithCredential, 
  EmailAuthProvider,
  GoogleAuthProvider,
  linkWithCredential
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  limit
} from 'firebase/firestore';
import { cn } from '@/lib/utils';

interface EditProfilePageProps {
  currentUser: any;
  onBack: () => void;
  onUpdate: (newData: any) => void;
  language: 'en' | 'bn';
}

export function EditProfilePage({ currentUser, onBack, onUpdate, language }: EditProfilePageProps) {
  const [fullName, setFullName] = useState(currentUser?.displayName || '');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const t = {
    en: {
      title: "Edit Profile",
      fullName: "Full Name",
      username: "Username",
      email: "Email Address",
      phone: "Phone Number",
      password: "Set Password",
      confirmPassword: "Confirm Password",
      save: "Save Changes",
      checking: "Checking availability...",
      available: "Username is available",
      taken: "Username is already taken",
      invalid: "Invalid username format",
      googleUserNote: "You signed up with Google. You can set a password for direct login.",
      success: "Profile updated successfully!",
      error: "Something went wrong. Please try again.",
      usernameHint: "Only lowercase letters, numbers, and underscores (_)",
      reauthRequired: "Please re-login to change your password.",
      passwordMismatch: "Passwords do not match"
    },
    bn: {
      title: "প্রোফাইল এডিট করুন",
      fullName: "পুরো নাম",
      username: "ইউজারনেম",
      email: "ইমেইল ঠিকানা",
      phone: "ফোন নম্বর",
      password: "পাসওয়ার্ড সেট করুন",
      confirmPassword: "পাসওয়ার্ড নিশ্চিত করুন",
      save: "পরিবর্তন সেভ করুন",
      checking: "যাচাই করা হচ্ছে...",
      available: "ইউজারনেমটি পাওয়া যাবে",
      taken: "এই ইউজারনেমটি ইতিমধ্যে নেয়া হয়েছে",
      invalid: "ইউজারনেম ফরম্যাট সঠিক নয়",
      googleUserNote: "আপনি গুগল দিয়ে সাইন আপ করেছেন। সরাসরি লগইনের জন্য পাসওয়ার্ড সেট করতে পারেন।",
      success: "প্রোফাইল সফলভাবে আপডেট করা হয়েছে!",
      error: "কিছু সমস্যা হয়েছে। আবার চেষ্টা করুন।",
      usernameHint: "শুধুমাত্র ছোট হাতের অক্ষর, সংখ্যা এবং আন্ডারস্কোর (_) ব্যবহার করা যাবে।",
      reauthRequired: "পাসওয়ার্ড পরিবর্তনের জন্য পুনরায় লগইন করা প্রয়োজন।",
      passwordMismatch: "পাসওয়ার্ড দুটি মিলছে না"
    }
  }[language];

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUsername(data.username || '');
          setPhoneNumber(data.phoneNumber || '');
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    };
    fetchUserData();
  }, [currentUser]);

  const checkUsername = async (val: string) => {
    if (!val || val === username) {
      setUsernameStatus('idle');
      return;
    }
    
    if (!/^[a-z0-9_]{3,20}$/.test(val)) {
      setUsernameStatus('taken'); // Or 'invalid'
      return;
    }

    setUsernameStatus('checking');
    try {
      const q = query(collection(db, 'users'), where('username', '==', val), limit(1));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        setUsernameStatus('available');
      } else {
        setUsernameStatus('taken');
      }
    } catch (err) {
      console.error("Error checking username:", err);
      setUsernameStatus('idle');
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (username) checkUsername(username);
    }, 500);
    return () => clearTimeout(timer);
  }, [username]);

  const handleSave = async () => {
    if (!currentUser) return;
    if (usernameStatus === 'taken') {
      setError(t.taken);
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      setError(t.passwordMismatch);
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // 1. Update Firebase Auth Profile (Display Name)
      if (fullName !== currentUser.displayName) {
        await updateProfile(currentUser, { displayName: fullName });
      }

      // 2. Update Firestore User Document
      await setDoc(doc(db, 'users', currentUser.uid), {
        displayName: fullName,
        username: username.toLowerCase(),
        phoneNumber: phoneNumber,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // 3. Update Password if provided
      if (newPassword) {
        try {
          await updatePassword(currentUser, newPassword);
        } catch (pwErr: any) {
          if (pwErr.code === 'auth/requires-recent-login') {
            setError(t.reauthRequired);
            setIsSaving(false);
            return;
          }
          throw pwErr;
        }
      }

      setSuccess(true);
      onUpdate({ displayName: fullName, username, phoneNumber });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error("Error saving profile:", err);
      setError(err.message || t.error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[150] bg-white dark:bg-slate-950 flex flex-col"
    >
      {/* Header */}
      <div className={cn(
        "flex items-center justify-between px-4 pb-4 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-10",
        "pt-safe"
      )}>
        <div className="flex items-center space-x-3">
          {!Capacitor.isNativePlatform() && (
            <button 
              onClick={onBack}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-slate-600 dark:text-slate-400" />
            </button>
          )}
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">{t.title}</h1>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving || usernameStatus === 'checking' || usernameStatus === 'taken'}
          className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white px-6 py-2 rounded-full font-bold transition-all shadow-lg shadow-primary-500/20 flex items-center space-x-2"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>{t.save}</span>}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 max-w-2xl mx-auto w-full">
        {/* Profile Picture Section */}
        <div className="flex flex-col items-center py-6">
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-900 shadow-xl overflow-hidden flex items-center justify-center">
              {currentUser?.photoURL ? (
                <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User className="w-12 h-12 text-slate-400" />
              )}
            </div>
            <button className="absolute bottom-0 right-0 p-2 bg-primary-600 text-white rounded-full shadow-lg border-2 border-white dark:border-slate-900 hover:scale-110 transition-transform">
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{currentUser?.email}</p>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">{t.fullName}</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                placeholder="Your full name"
              />
            </div>
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">{t.username}</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">@</span>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                className={cn(
                  "w-full bg-slate-50 dark:bg-slate-900 border rounded-2xl py-3.5 pl-12 pr-12 focus:ring-2 outline-none transition-all",
                  usernameStatus === 'available' ? "border-primary-500 focus:ring-primary-500" :
                  usernameStatus === 'taken' ? "border-rose-500 focus:ring-rose-500" :
                  "border-slate-200 dark:border-slate-800 focus:ring-primary-500"
                )}
                placeholder="username"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                {usernameStatus === 'checking' && <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />}
                {usernameStatus === 'available' && <CheckCircle2 className="w-5 h-5 text-primary-500" />}
                {usernameStatus === 'taken' && <AlertCircle className="w-5 h-5 text-rose-500" />}
              </div>
            </div>
            <p className="text-[10px] text-slate-500 ml-1">{t.usernameHint}</p>
          </div>

          {/* Email (Read-only) */}
          <div className="space-y-1.5 opacity-60">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">{t.email}</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="email" 
                value={currentUser?.email || ''} 
                readOnly 
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-3.5 pl-12 pr-4 outline-none cursor-not-allowed"
              />
            </div>
          </div>

          {/* Phone Number */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">{t.phone}</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="tel" 
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                placeholder="+8801XXXXXXXXX"
              />
            </div>
          </div>

          {/* Password Section */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2 mb-4">
              <Shield className="w-5 h-5 text-primary-600" />
              <h3 className="font-bold text-slate-800 dark:text-white">{t.password}</h3>
            </div>
            
            {currentUser?.providerData.some((p: any) => p.providerId === 'google.com') && (
              <div className="bg-primary-50 dark:bg-primary-900/20 p-3 rounded-xl mb-4">
                <p className="text-xs text-primary-700 dark:text-primary-400 leading-relaxed">
                  {t.googleUserNote}
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 pl-12 pr-12 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                  placeholder="New password"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                  placeholder="Confirm new password"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-rose-50 dark:bg-rose-900/20 p-4 rounded-2xl flex items-start space-x-3"
            >
              <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
            </motion.div>
          )}

          {success && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-2xl flex items-start space-x-3"
            >
              <CheckCircle2 className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-primary-600 dark:text-primary-400">{t.success}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="h-20" /> {/* Spacer */}
      </div>
    </motion.div>
  );
}
