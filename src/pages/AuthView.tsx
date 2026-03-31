import React from 'react';
import { AuthForm } from '../components/AuthForm';
import { useLanguage } from '../contexts/LanguageContext';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AuthViewProps {
  onBack: () => void;
  initialMode?: 'login' | 'register';
}

export function AuthView({ onBack, initialMode = 'login' }: AuthViewProps) {
  const { t } = useLanguage();

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onBack(); // Go back after successful login
    } catch (error) {
      console.error("Error signing in with Google", error);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-white dark:bg-slate-950 flex flex-col overflow-hidden">
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <AuthForm onGoogleLogin={handleGoogleLogin} initialMode={initialMode} onSuccess={onBack} />
      </div>
    </div>
  );
}
