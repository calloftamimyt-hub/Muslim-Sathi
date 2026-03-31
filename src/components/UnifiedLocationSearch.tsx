import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2, X, Check, Navigation, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface UnifiedLocationSearchProps {
  onSelect: (location: { name: string; fullName: string; lat: number; lon: number }) => void;
  placeholder?: string;
  initialValue?: string;
  className?: string;
}

const SEARCH_CACHE: Record<string, any[]> = {};

export function UnifiedLocationSearch({ onSelect, placeholder, initialValue = '', className }: UnifiedLocationSearchProps) {
  const [searchQuery, setSearchQuery] = useState(initialValue);
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchLocation = async () => {
      if (searchQuery.length < 2) {
        setResults([]);
        return;
      }

      if (SEARCH_CACHE[searchQuery]) {
        setResults(SEARCH_CACHE[searchQuery]);
        setShowResults(true);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=8&addressdetails=1`);
        const data = await response.json();
        SEARCH_CACHE[searchQuery] = data;
        setResults(data);
        setShowResults(true);
      } catch (error) {
        console.error("Error searching location:", error);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(searchLocation, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSelect = (res: any) => {
    const name = res.display_name.split(',')[0];
    const fullName = res.display_name;
    const lat = parseFloat(res.lat);
    const lon = parseFloat(res.lon);
    
    onSelect({ name, fullName, lat, lon });
    setSearchQuery(name);
    setShowResults(false);
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`);
          const data = await response.json();
          
          const name = data.address.city || data.address.town || data.address.village || data.display_name.split(',')[0];
          onSelect({
            name,
            fullName: data.display_name,
            lat: latitude,
            lon: longitude
          });
          setSearchQuery(name);
          setShowResults(false);
        } catch (error) {
          console.error("Error getting current location details:", error);
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        setIsGettingLocation(false);
        alert("Unable to retrieve your location");
      }
    );
  };

  return (
    <div ref={searchRef} className={cn("relative w-full", className)}>
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center space-x-2">
          {isSearching ? (
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          ) : (
            <Search className="w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
          )}
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (e.target.value.length < 2) setShowResults(false);
          }}
          onFocus={() => setShowResults(true)}
          placeholder={placeholder || "Search location..."}
          className="w-full pl-12 pr-10 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary text-slate-800 dark:text-white placeholder:text-slate-400 transition-all outline-none font-medium shadow-sm"
        />
        {searchQuery && (
          <button 
            onClick={() => {
              setSearchQuery('');
              setResults([]);
              setShowResults(false);
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            className="absolute z-[1000] w-full mt-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[24px] shadow-2xl overflow-hidden flex flex-col max-h-[400px]"
          >
            <div className="p-2 overflow-y-auto custom-scrollbar">
              {/* Current Location Option */}
              <button
                onClick={handleCurrentLocation}
                disabled={isGettingLocation}
                className="w-full flex items-center space-x-4 p-4 hover:bg-primary/5 dark:hover:bg-primary-dark/20 rounded-2xl transition-all text-left group border border-transparent hover:border-primary/10 dark:hover:border-primary-dark/50"
              >
                <div className="p-3 bg-primary/10 dark:bg-primary-dark/40 rounded-xl group-hover:bg-primary/20 dark:group-hover:bg-primary-dark/60 transition-colors">
                  {isGettingLocation ? (
                    <Loader2 className="w-5 h-5 text-primary-dark dark:text-primary-light animate-spin" />
                  ) : (
                    <Navigation className="w-5 h-5 text-primary-dark dark:text-primary-light" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-black text-primary-dark dark:text-primary-light text-[15px]">
                    Use Current Location
                  </div>
                  <div className="text-xs text-primary/70 dark:text-primary-light/70 font-bold mt-0.5">
                    {isGettingLocation ? 'Detecting location...' : 'Fastest way to set your city'}
                  </div>
                </div>
              </button>

              {results.length > 0 && <div className="h-px bg-slate-100 dark:bg-slate-800 my-2 mx-4" />}

              {/* Search Results */}
              {results.map((res, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelect(res)}
                  className="w-full flex items-start space-x-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl transition-all text-left group"
                >
                  <div className="mt-1 p-3 bg-slate-100 dark:bg-slate-800 rounded-xl group-hover:bg-white dark:group-hover:bg-slate-700 shadow-sm transition-all">
                    <MapPin className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-slate-900 dark:text-white text-[15px] truncate group-hover:text-primary-dark dark:group-hover:text-primary-light transition-colors">
                      {res.display_name.split(',')[0]}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 font-medium leading-relaxed">
                      {res.display_name}
                    </div>
                  </div>
                </button>
              ))}

              {searchQuery.length >= 2 && results.length === 0 && !isSearching && (
                <div className="p-12 text-center space-y-3">
                  <div className="inline-flex p-4 bg-slate-50 dark:bg-slate-800 rounded-full">
                    <Globe className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-sm font-bold text-slate-400">No locations found for "{searchQuery}"</p>
                </div>
              )}
            </div>

            {/* Attribution */}
            <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Powered by OpenStreetMap
              </span>
              <div className="flex space-x-1">
                <div className="w-1 h-1 bg-primary rounded-full" />
                <div className="w-1 h-1 bg-primary/50 rounded-full" />
                <div className="w-1 h-1 bg-primary/20 rounded-full" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
