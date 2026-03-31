import { useState, useEffect } from 'react';

export interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Sunset: string;
  Maghrib: string;
  Isha: string;
  Imsak: string;
  Midnight: string;
}

export interface HijriDateInfo {
  date: string;
  format: string;
  day: string;
  weekday: {
    en: string;
    ar: string;
    bn?: string;
  };
  month: {
    number: number;
    en: string;
    ar: string;
    bn?: string;
  };
  year: string;
  designation: {
    abbreviated: string;
    expanded: string;
  };
  holidays: string[];
}

export interface DayData {
  timings: PrayerTimes;
  date: {
    readable: string;
    timestamp: string;
    gregorian: any;
    hijri: HijriDateInfo;
  };
}

const BENGALI_WEEKDAYS = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
const BENGALI_HIJRI_MONTHS = [
  'মুহাররাম', 'সফর', 'রবিউল আউয়াল', 'রবিউস সানি', 'জমাদিউল আউয়াল', 'জমাদিউস সানি',
  'রজব', 'শা’বান', 'রমজান', 'শাওয়াল', 'জিলকদ', 'জিলহজ'
];

export function usePrayerTimes(latitude: number | null, longitude: number | null) {
  const [data, setData] = useState<DayData[] | null>(() => {
    const saved = localStorage.getItem('prayerTimesCache');
    const savedCoords = localStorage.getItem('prayerTimesCoords');
    const savedMonth = localStorage.getItem('prayerTimesMonth');
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${now.getMonth() + 1}`;

    if (saved && savedCoords && savedMonth === currentMonth) {
      const coords = JSON.parse(savedCoords);
      // If coordinates are very close (within ~1km), use cache
      if (latitude && longitude && 
          Math.abs(coords.lat - latitude) < 0.01 && 
          Math.abs(coords.lon - longitude) < 0.01) {
        return JSON.parse(saved);
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!latitude || !longitude) {
      if (!data) setLoading(false);
      return;
    }

    const fetchTimes = async () => {
      try {
        // If we have data but it's from a different location, show loading
        const savedCoords = localStorage.getItem('prayerTimesCoords');
        if (savedCoords) {
          const coords = JSON.parse(savedCoords);
          if (Math.abs(coords.lat - latitude) > 0.01 || Math.abs(coords.lon - longitude) > 0.01) {
            setLoading(true);
          }
        } else if (!data) {
          setLoading(true);
        }

        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1; // API expects 1-12
        const currentMonth = `${year}-${month}`;

        // Check if we already have valid cache for this month and location
        if (data && savedCoords && localStorage.getItem('prayerTimesMonth') === currentMonth) {
          const coords = JSON.parse(savedCoords);
          if (Math.abs(coords.lat - latitude) < 0.01 && Math.abs(coords.lon - longitude) < 0.01) {
            setLoading(false);
            return;
          }
        }

        const response = await fetch(`https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${latitude}&longitude=${longitude}&method=1&school=1`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch prayer times');
        }

        const json = await response.json();
        
        if (json.code === 200 && json.data) {
          // Format the data to match expected structure
          const formattedData: DayData[] = json.data.map((day: any) => {
            // Strip timezone string like " (PKT)" from timings
            const cleanTimings: any = {};
            for (const [key, value] of Object.entries(day.timings)) {
              cleanTimings[key] = (value as string).split(' ')[0];
            }

            // Add Bengali translations to Hijri date
            const hijriMonthNumber = day.date.hijri.month.number - 1;
            
            // Parse DD-MM-YYYY to get the correct day of week
            const [d, m, y] = day.date.gregorian.date.split('-');
            const gregorianDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
            
            return {
              ...day,
              timings: cleanTimings,
              date: {
                ...day.date,
                hijri: {
                  ...day.date.hijri,
                  weekday: {
                    ...day.date.hijri.weekday,
                    bn: BENGALI_WEEKDAYS[gregorianDate.getDay()]
                  },
                  month: {
                    ...day.date.hijri.month,
                    bn: BENGALI_HIJRI_MONTHS[hijriMonthNumber >= 0 && hijriMonthNumber < 12 ? hijriMonthNumber : 0]
                  }
                }
              }
            };
          });

          setData(formattedData);
          localStorage.setItem('prayerTimesCache', JSON.stringify(formattedData));
          localStorage.setItem('prayerTimesCoords', JSON.stringify({ lat: latitude, lon: longitude }));
          localStorage.setItem('prayerTimesMonth', `${year}-${month}`);
          setError(null);
        } else {
          throw new Error('Invalid data format from API');
        }
      } catch (err) {
        console.error('Error fetching prayer times:', err);
        setError('নামাজের সময়সূচি লোড করতে সমস্যা হয়েছে। দয়া করে ইন্টারনেট কানেকশন চেক করুন।');
      } finally {
        setLoading(false);
      }
    };

    fetchTimes();
  }, [latitude, longitude]);

  return { data, loading, error };
}
