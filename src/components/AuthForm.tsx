import React, { useState, useEffect } from 'react';
import { Mail, Lock, Phone, User, LogIn, UserPlus } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

interface AuthFormProps {
  onGoogleLogin: () => void;
  initialMode?: 'login' | 'register';
  onSuccess?: () => void;
}

export function AuthForm({ onGoogleLogin, initialMode = 'login', onSuccess }: AuthFormProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot-password'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [tempEmail, setTempEmail] = useState('');
  const [tempUid, setTempUid] = useState('');

  // Phone Auth States
  const [resetPhone, setResetPhone] = useState('');
  const [resetOtpSent, setResetOtpSent] = useState(false);
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    emailOrPhone: '',
  });

  useEffect(() => {
    // If user is logged in but not verified, show verification screen
    const currentUser = auth.currentUser;
    if (currentUser && !currentUser.emailVerified && currentUser.email) {
      setTempEmail(currentUser.email);
      setTempUid(currentUser.uid);
      setShowVerification(true);
      
      // Optionally send OTP automatically if not already sent
      fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/send-verification-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUser.email }),
      }).catch(console.error);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'register') {
        if (formData.password !== formData.confirmPassword) {
          throw new Error("Passwords do not match!");
        }
        if (formData.password.length < 6) {
          throw new Error("Password must be at least 6 characters!");
        }

        const userCredential = await createUserWithEmailAndPassword(auth, formData.email.trim(), formData.password);
        await updateProfile(userCredential.user, {
          displayName: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        });
        
        // Save user data to Firestore
        let formattedPhone = formData.phone.trim();
        if (formattedPhone.startsWith('01')) {
          formattedPhone = '+88' + formattedPhone;
        }
        
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          displayName: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
          phoneNumber: formattedPhone,
          role: 'client',
          updatedAt: new Date().toISOString(),
        }, { merge: true });
        
        // Send verification OTP
        setLoading(true);
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/send-verification-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: formData.email.trim() }),
          });
          
          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "Failed to send verification code");
          }
          
          setTempEmail(formData.email.trim());
          setTempUid(userCredential.user.uid);
          setShowVerification(true);
          setSuccess("Verification code sent to your email!");
        } catch (otpErr: any) {
          console.error("OTP Send Error:", otpErr);
          setError("Account created but failed to send verification code. Please try logging in to verify.");
        }
      } else {
        if (!isValidEmail(formData.emailOrPhone.trim())) {
          throw new Error("Please enter a valid email address.");
        }
        const userCredential = await signInWithEmailAndPassword(auth, formData.emailOrPhone.trim(), formData.password);
        
        if (!userCredential.user.emailVerified) {
          // Send verification OTP if not verified
          setLoading(true);
          try {
            await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/send-verification-otp`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: userCredential.user.email }),
            });
            
            setTempEmail(userCredential.user.email || '');
            setTempUid(userCredential.user.uid);
            setShowVerification(true);
            setSuccess("Email not verified. Verification code sent!");
            return; // Don't call onSuccess yet
          } catch (otpErr) {
            console.error("OTP Send Error on Login:", otpErr);
            // Even if OTP fails, we show the verification screen so they can resend
            setTempEmail(userCredential.user.email || '');
            setTempUid(userCredential.user.uid);
            setShowVerification(true);
            return;
          }
        }
        
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      let errorMessage = err.message || "Something went wrong. Please try again.";
      
      if (err.code === 'auth/invalid-email') {
        errorMessage = "Invalid email address.";
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        errorMessage = "Incorrect email or password.";
      } else if (err.code === 'auth/email-already-in-use') {
        errorMessage = "An account already exists with this email.";
      } else if (err.code === 'auth/weak-password') {
        errorMessage = "Password is too weak. Use at least 6 characters.";
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = "Check your internet connection.";
      } else if (err.code === 'auth/operation-not-allowed') {
        errorMessage = "Email/Password login is not enabled. Contact admin.";
      } else if (err.message && err.message.includes("Firebase:")) {
        // Hide raw firebase errors if not caught by above
        errorMessage = "Something went wrong. Please try again.";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setVerificationLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: tempEmail,
          otp: verificationCode,
          uid: tempUid
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Invalid verification code");
      }

      setSuccess("Email verified successfully!");
      
      // Reload user to get updated emailVerified status
      if (auth.currentUser) {
        await auth.currentUser.reload();
      }
      
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Verification failed");
    } finally {
      setVerificationLoading(false);
    }
  };

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved
        }
      });
    }
  };

  const handleSendResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      setupRecaptcha();
      let formattedPhone = resetPhone.trim();
      if (formattedPhone.startsWith('01')) {
        formattedPhone = '+88' + formattedPhone;
      }
      
      const appVerifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(result);
      setResetOtpSent(true);
      setSuccess("OTP sent to your phone!");
    } catch (err: any) {
      console.error("Phone Auth Error:", err);
      setError(err.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!confirmationResult) throw new Error("No OTP sent");
      if (newPassword.length < 6) throw new Error("Password must be at least 6 characters");
      
      // Verify OTP
      const result = await confirmationResult.confirm(resetOtp);
      const idToken = await result.user.getIdToken();
      
      // Call backend to reset password
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/reset-password-phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken,
          newPassword
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to reset password");
      }

      setSuccess("Password reset successfully! You can now login.");
      setTimeout(() => {
        setMode('login');
        setResetPhone('');
        setResetOtp('');
        setNewPassword('');
        setResetOtpSent(false);
        setConfirmationResult(null);
      }, 2000);
    } catch (err: any) {
      console.error("Reset Error:", err);
      setError(err.message || "Invalid OTP or failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (showVerification) {
    return (
      <div className="w-full h-full min-h-screen flex flex-col justify-center max-w-md mx-auto px-4 py-4 bg-white dark:bg-slate-950">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Verify Email</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            We've sent a 6-digit code to <span className="font-semibold text-slate-700 dark:text-slate-200">{tempEmail}</span>
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-100 dark:border-red-900/30">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-primary-light/20 dark:bg-primary-dark/20 text-primary dark:text-primary-light text-sm rounded-lg border border-primary-light/30 dark:border-primary-dark/30">
            {success}
          </div>
        )}

        <form onSubmit={handleVerifyEmail} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 text-center block">Enter 6-digit Code</label>
            <input
              type="text"
              maxLength={6}
              required
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
              className="w-full text-center text-2xl tracking-[0.5em] font-bold py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary outline-none dark:text-white"
              placeholder="000000"
            />
          </div>

          <button
            type="submit"
            disabled={verificationLoading || verificationCode.length !== 6}
            className="w-full flex items-center justify-center bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-70 font-medium"
          >
            {verificationLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Verify & Continue"
            )}
          </button>
          
          <button
            type="button"
            onClick={async () => {
              setError('');
              setSuccess('');
              try {
                await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/send-verification-otp`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: tempEmail }),
                });
                setSuccess("New code sent!");
              } catch (e) {
                setError("Failed to resend code");
              }
            }}
            className="w-full text-xs text-primary hover:underline font-medium"
          >
            Resend Code
          </button>

          <button
            type="button"
            onClick={async () => {
              await auth.signOut();
              setShowVerification(false);
              setMode('login');
              if (onSuccess) onSuccess(); // To close the auth view
            }}
            className="w-full text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 font-medium"
          >
            Logout & Try Again
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-screen flex flex-col justify-center max-w-md mx-auto px-4 py-4 bg-white dark:bg-slate-950">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
          {mode === 'login' ? 'Welcome Back' : mode === 'register' ? 'Create Account' : 'Reset Password'}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {mode === 'login' ? 'Login to your account' : mode === 'register' ? 'Fill in the details below to register' : 'Enter your phone number to reset password'}
        </p>
      </div>

      {mode !== 'forgot-password' && (
        <div className="flex space-x-2 mb-4 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
          <button
            onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              mode === 'login' 
                ? 'bg-white dark:bg-slate-800 text-primary dark:text-primary-light shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              mode === 'register' 
                ? 'bg-white dark:bg-slate-800 text-primary dark:text-primary-light shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Registration
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-100 dark:border-red-900/30">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-primary-light/20 dark:bg-primary-dark/20 text-primary dark:text-primary-light text-sm rounded-lg border border-primary-light/30 dark:border-primary-dark/30">
          {success}
        </div>
      )}

      <form onSubmit={mode === 'forgot-password' ? (resetOtpSent ? handleResetPassword : handleSendResetOtp) : handleSubmit} className="space-y-3">
        {mode === 'register' ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">First Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none dark:text-white"
                    placeholder="First Name"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Last Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none dark:text-white"
                    placeholder="Last Name"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none dark:text-white"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Mobile Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none dark:text-white"
                  placeholder="01XXXXXXXXX"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none dark:text-white"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none dark:text-white"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </>
        ) : mode === 'login' ? (
          <>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Email</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  name="emailOrPhone"
                  required
                  value={formData.emailOrPhone}
                  onChange={handleChange}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none dark:text-white"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none dark:text-white"
                  placeholder="••••••••"
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => { setMode('forgot-password'); setError(''); setSuccess(''); }}
                className="text-xs text-primary hover:underline font-medium"
              >
                Forgot Password?
              </button>
            </div>
          </>
        ) : mode === 'forgot-password' ? (
          <>
            {!resetOtpSent ? (
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Mobile Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={resetPhone}
                    onChange={(e) => setResetPhone(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none dark:text-white"
                    placeholder="01XXXXXXXXX"
                  />
                </div>
                <div id="recaptcha-container"></div>
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Enter 6-digit OTP</label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center text-2xl tracking-[0.5em] font-bold py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary outline-none dark:text-white"
                    placeholder="000000"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none dark:text-white"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </>
            )}
            
            <div className="flex justify-center mt-2">
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); setSuccess(''); setResetOtpSent(false); }}
                className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 font-medium"
              >
                Back to Login
              </button>
            </div>
          </>
        ) : null}

        <button
          type="submit"
          disabled={loading || (mode === 'forgot-password' && resetOtpSent && resetOtp.length !== 6)}
          className="w-full flex items-center justify-center bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-70 font-medium mt-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : mode === 'login' ? (
            <>
              <LogIn className="w-4 h-4 mr-2" />
              Login
            </>
          ) : mode === 'register' ? (
            <>
              <UserPlus className="w-4 h-4 mr-2" />
              Create Account
            </>
          ) : resetOtpSent ? (
            "Reset Password"
          ) : (
            "Send OTP"
          )}
        </button>
      </form>

      {mode !== 'forgot-password' && (
        <div className="mt-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400">OR</span>
            </div>
          </div>

          <button
            onClick={onGoogleLogin}
            type="button"
            className="mt-3 w-full flex items-center justify-center bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium text-sm"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Login with Google
          </button>
        </div>
      )}
    </div>
  );
}
