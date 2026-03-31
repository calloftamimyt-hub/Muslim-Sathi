/**
 * Maps Firebase technical errors to user-friendly messages.
 * This hides the underlying infrastructure (Firebase) from users/hackers.
 */
export function getFriendlyErrorMessage(error: any): string {
  if (!error) return '';
  
  // Extract error code/message
  let errorCode = '';
  if (typeof error === 'string') {
    errorCode = error;
  } else if (error.code) {
    errorCode = error.code;
  } else if (error.message) {
    errorCode = error.message;
  }

  const code = errorCode.toLowerCase();

  // Network errors (Hide "Firebase" and "auth/network-request-failed")
  if (
    code.includes('network-request-failed') || 
    code.includes('unavailable') || 
    code.includes('network') ||
    code.includes('offline')
  ) {
    return 'নেটওয়ার্ক সমস্যা। অনুগ্রহ করে আপনার ইন্টারনেট সংযোগ চেক করুন।';
  }

  // Auth errors
  if (
    code.includes('auth/user-not-found') || 
    code.includes('auth/wrong-password') || 
    code.includes('auth/invalid-credential') ||
    code.includes('auth/invalid-email')
  ) {
    return 'আপনার দেওয়া তথ্য সঠিক নয়। অনুগ্রহ করে আবার চেষ্টা করুন।';
  }
  
  if (code.includes('auth/email-already-in-use')) {
    return 'এই ইমেইলটি ইতিমধ্যে ব্যবহার করা হয়েছে। অন্য একটি ইমেইল ব্যবহার করুন।';
  }

  if (code.includes('auth/weak-password')) {
    return 'পাসওয়ার্ডটি খুব দুর্বল। অন্তত ৬টি অক্ষর ব্যবহার করুন।';
  }

  if (code.includes('permission-denied')) {
    return 'আপনার এই কাজটি করার অনুমতি নেই। অনুগ্রহ করে অ্যাডমিনের সাথে যোগাযোগ করুন।';
  }

  if (code.includes('too-many-requests')) {
    return 'অতিরিক্ত রিকোয়েস্ট পাঠানো হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।';
  }

  if (code.includes('quota-exceeded')) {
    return 'আজকের লিমিট শেষ হয়ে গেছে। আগামীকাল আবার চেষ্টা করুন।';
  }

  // Default generic error (Never show technical details to user)
  return 'দুঃখিত, একটি সমস্যা হয়েছে। অনুগ্রহ করে আপনার ইন্টারনেট সংযোগ চেক করে আবার চেষ্টা করুন।';
}
