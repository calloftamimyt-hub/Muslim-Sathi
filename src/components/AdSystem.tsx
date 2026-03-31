import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ExternalLink } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

interface Ad {
  id: string;
  imageUrl: string;
  redirectLink: string;
  category: 'home' | 'social' | 'all';
  type: 'small' | 'large';
  active: boolean;
}

export const SlimBannerAd = ({ category }: { category: 'home' | 'social' }) => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Force HMR reload
    const adsRef = collection(db, 'ads');
    const q = query(adsRef, where('active', '==', true), where('type', '==', 'small'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const adsData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Ad))
        .filter(ad => ad.category === category || ad.category === 'all');
      setAds(adsData);
    }, (error) => {
      console.warn('Firestore Small Ads Permission Error:', error.message);
    });

    return () => unsubscribe();
  }, [category]);

  useEffect(() => {
    if (ads.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [ads]);

  if (ads.length === 0) return null;

  const ad = ads[currentIndex];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative w-full h-20 rounded-xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800"
    >
      <img src={ad.imageUrl} alt="Ad" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
      <button 
        onClick={() => window.open(ad.redirectLink, '_blank')}
        className="absolute bottom-2 right-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold text-slate-900 dark:text-white flex items-center gap-1 shadow-sm"
      >
        Visit <ExternalLink className="w-3 h-3" />
      </button>
    </motion.div>
  );
};

export const LargeBannerAd = ({ category }: { category: 'social' }) => {
  const [ads, setAds] = useState<Ad[]>([]);

  useEffect(() => {
    const adsRef = collection(db, 'ads');
    const q = query(adsRef, where('active', '==', true), where('type', '==', 'large'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const adsData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Ad))
        .filter(ad => ad.category === category || ad.category === 'all');
      setAds(adsData);
    }, (error) => {
      console.warn('Firestore Large Ads Permission Error:', error.message);
    });

    return () => unsubscribe();
  }, [category]);

  if (ads.length === 0) return null;

  const ad = ads[0];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full rounded-xl overflow-hidden shadow-md border border-slate-100 dark:border-slate-800 my-4 flex justify-center"
    >
      <div style={{ width: '300px', height: '250px' }}>
        <img src={ad.imageUrl} alt="Ad" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
      </div>
      <div className="p-3 bg-white dark:bg-slate-900 flex justify-between items-center absolute bottom-0 w-full">
        <span className="text-[10px] font-bold text-slate-500">Sponsored</span>
        <button 
          onClick={() => window.open(ad.redirectLink, '_blank')}
          className="bg-primary-dark text-white px-4 py-1.5 rounded-full text-[12px] font-bold flex items-center gap-1"
        >
          Visit <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
};
