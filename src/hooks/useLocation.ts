import { useState, useEffect } from 'react';
import { auth, db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export interface LocationState {
  latitude: number | null;
  longitude: number | null;
  country: string | null;
  city: string | null;
  error: string | null;
  loading: boolean;
}

export function useLocation(language: string = 'bn') {
  const [location, setLocation] = useState<LocationState>(() => {
    const saved = localStorage.getItem('userLocation');
    const savedLang = localStorage.getItem('userLocationLang');
    if (saved && savedLang === language) {
      return { ...JSON.parse(saved), loading: false };
    }
    return {
      latitude: null,
      longitude: null,
      country: null,
      city: null,
      error: null,
      loading: true,
    };
  });

  useEffect(() => {
    const handleLocationUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<LocationState>;
      setLocation(customEvent.detail);
    };

    window.addEventListener('locationUpdated', handleLocationUpdate);

    // Sync with Firestore if user is logged in
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const path = `users/${user.uid}`;
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists() && userDoc.data().location) {
            const firestoreLocation = userDoc.data().location;
            const saved = localStorage.getItem('userLocation');
            const current = saved ? JSON.parse(saved) : null;
            
            // If firestore location is different from local, update local
            if (!current || current.city !== firestoreLocation) {
              // We don't have lat/lon from firestore string usually, 
              // but we can at least sync the city name if that's all we have.
              // For now, let's assume if it's in firestore, it's the source of truth for the city.
            }
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, path);
        }
      }
    });

    // Only fetch if not already saved or if explicitly requested
    const saved = localStorage.getItem('userLocation');
    const savedLang = localStorage.getItem('userLocationLang');
    
    if (!saved || savedLang !== language) {
      const fetchByIP = async () => {
        try {
          const res = await fetch('https://ipapi.co/json/');
          const data = await res.json();
          if (data.latitude && data.longitude) {
            // Try to get localized city name using coordinates from IP
            try {
              const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${data.latitude}&longitude=${data.longitude}&localityLanguage=${language}`);
              const geoData = await geoRes.json();
              const unknownCity = language === 'bn' ? 'অজানা স্থান' : language === 'ar' ? 'موقع غير معروف' : language === 'hi' ? 'अज्ञात स्थान' : 'Unknown Location';
              const city = geoData.city || geoData.locality || data.city || data.region || unknownCity;
              const country = geoData.countryName || data.country_name || null;
              
              const newLocation = { 
                latitude: data.latitude, 
                longitude: data.longitude, 
                country,
                city, 
                error: null, 
                loading: false 
              };
              setLocation(newLocation);
              localStorage.setItem('userLocation', JSON.stringify(newLocation));
              localStorage.setItem('userLocationLang', language);
              return true;
            } catch (e) {
              const unknownCity = language === 'bn' ? 'অজানা স্থান' : language === 'ar' ? 'موقع غير معروف' : language === 'hi' ? 'अज्ञात स्थान' : 'Unknown Location';
              const newLocation = { 
                latitude: data.latitude, 
                longitude: data.longitude, 
                country: data.country_name || null,
                city: data.city || data.region || unknownCity, 
                error: null, 
                loading: false 
              };
              setLocation(newLocation);
              localStorage.setItem('userLocation', JSON.stringify(newLocation));
              localStorage.setItem('userLocationLang', language);
              return true;
            }
          }
        } catch (e) {
          return false;
        }
        return false;
      };

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            try {
              const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=${language}`);
              const data = await res.json();
              const unknownCity = language === 'bn' ? 'অজানা স্থান' : language === 'ar' ? 'موقع غير معروف' : language === 'hi' ? 'अज्ञात स्थान' : 'Unknown Location';
              const city = data.city || data.locality || unknownCity;
              const country = data.countryName || null;
              
              const newLocation = { latitude, longitude, country, city, error: null, loading: false };
              setLocation(newLocation);
              localStorage.setItem('userLocation', JSON.stringify(newLocation));
              localStorage.setItem('userLocationLang', language);
            } catch (e) {
              const unknownCity = language === 'bn' ? 'অজানা স্থান' : language === 'ar' ? 'موقع غير معروف' : language === 'hi' ? 'अज्ञात स्थान' : 'Unknown Location';
              const newLocation = { latitude, longitude, country: null, city: unknownCity, error: null, loading: false };
              setLocation(newLocation);
              localStorage.setItem('userLocation', JSON.stringify(newLocation));
              localStorage.setItem('userLocationLang', language);
            }
          },
          async (error) => {
            const success = await fetchByIP();
            if (!success) {
              const defaultCity = language === 'bn' ? 'ঢাকা' : language === 'ar' ? 'دكا' : language === 'hi' ? 'ढाका' : 'Dhaka';
              const defaultError = language === 'bn' ? 'লোকেশন পাওয়া যায়নি। ডিফল্ট ঢাকা ব্যবহার করা হচ্ছে।' : language === 'ar' ? 'لم يتم العثور على الموقع. استخدام دكا الافتراضي.' : language === 'hi' ? 'स्थान नहीं मिला। डिफ़ॉल्ट ढाका का उपयोग कर रहा है।' : 'Location not found. Using default Dhaka.';
              const defaultLocation = { latitude: 23.8103, longitude: 90.4125, country: language === 'bn' ? 'বাংলাদেশ' : 'Bangladesh', city: defaultCity, error: defaultError, loading: false };
              setLocation(defaultLocation);
              localStorage.setItem('userLocation', JSON.stringify(defaultLocation));
              localStorage.setItem('userLocationLang', language);
            }
          },
          { timeout: 5000 }
        );
      } else {
        fetchByIP().then(success => {
          if (!success) {
            const defaultCity = language === 'bn' ? 'ঢাকা' : language === 'ar' ? 'دكا' : language === 'hi' ? 'ढाका' : 'Dhaka';
            const defaultError = language === 'bn' ? 'আপনার ব্রাউজার লোকেশন সাপোর্ট করে না।' : language === 'ar' ? 'متصفحك لا يدعم الموقع.' : language === 'hi' ? 'आपका ब्राउज़र स्थान का समर्थन नहीं करता है।' : 'Browser does not support location.';
            const defaultLocation = { latitude: 23.8103, longitude: 90.4125, country: language === 'bn' ? 'বাংলাদেশ' : 'Bangladesh', city: defaultCity, error: defaultError, loading: false };
            setLocation(defaultLocation);
            localStorage.setItem('userLocation', JSON.stringify(defaultLocation));
            localStorage.setItem('userLocationLang', language);
          }
        });
      }
    }

    return () => {
      window.removeEventListener('locationUpdated', handleLocationUpdate);
      unsubscribeAuth();
    };
  }, [language]);

  return location;
}

export const updateUserLocation = async (newLocation: Partial<LocationState>) => {
  const saved = localStorage.getItem('userLocation');
  const current = saved ? JSON.parse(saved) : {
    latitude: 23.8103,
    longitude: 90.4125,
    country: 'Bangladesh',
    city: 'Dhaka',
    error: null,
    loading: false,
  };
  
  const updated = { ...current, ...newLocation, loading: false };
  localStorage.setItem('userLocation', JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('locationUpdated', { detail: updated }));

  // Update Firestore if user is logged in
  const user = auth.currentUser;
  if (user && updated.city) {
    const path = `users/${user.uid}`;
    try {
      await setDoc(doc(db, 'users', user.uid), {
        location: {
          city: updated.city,
          country: updated.country,
          latitude: updated.latitude,
          longitude: updated.longitude
        },
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }
};
