import { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export function useFavorites<T extends { id: string | number }>(key: string) {
  const [favorites, setFavorites] = useState<T[]>(() => {
    try {
      const saved = localStorage.getItem(key);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return [];
    }
  });
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      localStorage.setItem(key, JSON.stringify(favorites));
      return;
    }

    const docRef = doc(db, 'user_data', user.uid);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const remoteFavorites = data[key];
        const validFavorites = Array.isArray(remoteFavorites) ? remoteFavorites.filter(Boolean) : [];
        setFavorites(validFavorites);
        localStorage.setItem(key, JSON.stringify(validFavorites));
      }
    });

    return () => unsubscribe();
  }, [user, key]);

  const saveToFirestore = async (newFavorites: T[]) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'user_data', user.uid), {
        [key]: newFavorites,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error("Error saving favorites to Firestore:", error);
    }
  };

  const addFavorite = (item: T) => {
    const newFavorites = [...favorites];
    if (newFavorites.some(f => f.id === item.id)) return;
    newFavorites.push(item);
    setFavorites(newFavorites);
    localStorage.setItem(key, JSON.stringify(newFavorites));
    if (user) saveToFirestore(newFavorites);
  };

  const removeFavorite = (id: string | number) => {
    const newFavorites = favorites.filter(f => f.id !== id);
    setFavorites(newFavorites);
    localStorage.setItem(key, JSON.stringify(newFavorites));
    if (user) saveToFirestore(newFavorites);
  };

  const isFavorite = (id: string | number) => {
    return favorites.some(f => f.id === id);
  };

  const toggleFavorite = (item: T) => {
    if (isFavorite(item.id)) {
      removeFavorite(item.id);
    } else {
      addFavorite(item);
    }
  };

  return {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
    count: favorites.length
  };
}
