import { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const DEFAULT_ADMIN_EMAIL = "tamim.personalpro@gmail.com";

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // Check if default admin email
      if (user.email === DEFAULT_ADMIN_EMAIL && user.emailVerified) {
        setIsAdmin(true);
        setLoading(false);
        return;
      }

      // Check role in Firestore
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (err) {
        console.error("Error checking admin status:", err);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { isAdmin, loading };
}
