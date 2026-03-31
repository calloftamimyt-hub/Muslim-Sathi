import { useState, useEffect, useMemo } from 'react';
import { MapPin, X, CheckCircle2, Search, Loader2, Globe, ChevronRight, ArrowLeft, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { updateUserLocation } from '@/hooks/useLocation';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';

const COUNTRIES_LIST = [
  { name: 'Afghanistan', code: 'AF', flag: '🇦🇫' },
  { name: 'Albania', code: 'AL', flag: '🇦🇱' },
  { name: 'Algeria', code: 'DZ', flag: '🇩🇿' },
  { name: 'Argentina', code: 'AR', flag: '🇦🇷' },
  { name: 'Australia', code: 'AU', flag: '🇦🇺' },
  { name: 'Austria', code: 'AT', flag: '🇦🇹' },
  { name: 'Azerbaijan', code: 'AZ', flag: '🇦🇿' },
  { name: 'Bahrain', code: 'BH', flag: '🇧🇭' },
  { name: 'Bangladesh', code: 'BD', flag: '🇧🇩' },
  { name: 'Belgium', code: 'BE', flag: '🇧🇪' },
  { name: 'Brazil', code: 'BR', flag: '🇧🇷' },
  { name: 'Brunei', code: 'BN', flag: '🇧🇳' },
  { name: 'Canada', code: 'CA', flag: '🇨🇦' },
  { name: 'China', code: 'CN', flag: '🇨🇳' },
  { name: 'Denmark', code: 'DK', flag: '🇩🇰' },
  { name: 'Egypt', code: 'EG', flag: '🇪🇬' },
  { name: 'Finland', code: 'FI', flag: '🇫🇮' },
  { name: 'France', code: 'FR', flag: '🇫🇷' },
  { name: 'Germany', code: 'DE', flag: '🇩🇪' },
  { name: 'Greece', code: 'GR', flag: '🇬🇷' },
  { name: 'India', code: 'IN', flag: '🇮🇳' },
  { name: 'Indonesia', code: 'ID', flag: '🇮🇩' },
  { name: 'Iran', code: 'IR', flag: '🇮🇷' },
  { name: 'Iraq', code: 'IQ', flag: '🇮🇶' },
  { name: 'Ireland', code: 'IE', flag: '🇮🇪' },
  { name: 'Italy', code: 'IT', flag: '🇮🇹' },
  { name: 'Japan', code: 'JP', flag: '🇯🇵' },
  { name: 'Jordan', code: 'JO', flag: '🇯🇴' },
  { name: 'Kazakhstan', code: 'KZ', flag: '🇰🇿' },
  { name: 'Kuwait', code: 'KW', flag: '🇰🇼' },
  { name: 'Lebanon', code: 'LB', flag: '🇱🇧' },
  { name: 'Libya', code: 'LY', flag: '🇱🇾' },
  { name: 'Malaysia', code: 'MY', flag: '🇲🇾' },
  { name: 'Maldives', code: 'MV', flag: '🇲🇻' },
  { name: 'Morocco', code: 'MA', flag: '🇲🇦' },
  { name: 'Netherlands', code: 'NL', flag: '🇳🇱' },
  { name: 'New Zealand', code: 'NZ', flag: '🇳🇿' },
  { name: 'Nigeria', code: 'NG', flag: '🇳🇬' },
  { name: 'Norway', code: 'NO', flag: '🇳🇴' },
  { name: 'Oman', code: 'OM', flag: '🇴🇲' },
  { name: 'Pakistan', code: 'PK', flag: '🇵🇰' },
  { name: 'Palestine', code: 'PS', flag: '🇵🇸' },
  { name: 'Philippines', code: 'PH', flag: '🇵🇭' },
  { name: 'Portugal', code: 'PT', flag: '🇵🇹' },
  { name: 'Qatar', code: 'QA', flag: '🇶🇦' },
  { name: 'Russia', code: 'RU', flag: '🇷🇺' },
  { name: 'Saudi Arabia', code: 'SA', flag: '🇸🇦' },
  { name: 'Singapore', code: 'SG', flag: '🇸🇬' },
  { name: 'South Africa', code: 'ZA', flag: '🇿🇦' },
  { name: 'South Korea', code: 'KR', flag: '🇰🇷' },
  { name: 'Spain', code: 'ES', flag: '🇪🇸' },
  { name: 'Sri Lanka', code: 'LK', flag: '🇱🇰' },
  { name: 'Sudan', code: 'SD', flag: '🇸🇩' },
  { name: 'Sweden', code: 'SE', flag: '🇸🇪' },
  { name: 'Switzerland', code: 'CH', flag: '🇨🇭' },
  { name: 'Syria', code: 'SY', flag: '🇸🇾' },
  { name: 'Thailand', code: 'TH', flag: '🇹🇭' },
  { name: 'Tunisia', code: 'TN', flag: '🇹🇳' },
  { name: 'Turkey', code: 'TR', flag: '🇹🇷' },
  { name: 'United Arab Emirates', code: 'AE', flag: '🇦🇪' },
  { name: 'United Kingdom', code: 'GB', flag: '🇬🇧' },
  { name: 'United States', code: 'US', flag: '🇺🇸' },
  { name: 'Uzbekistan', code: 'UZ', flag: '🇺🇿' },
  { name: 'Yemen', code: 'YE', flag: '🇾🇪' },
].sort((a, b) => a.name.localeCompare(b.name));

const NOMINATIM_CACHE: Record<string, any[]> = {};
const COUNTRY_COORDS_CACHE: Record<string, { lat: number; lon: number }> = {};

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCountry?: string | null;
  currentCity?: string | null;
  currentLat?: number | null;
  currentLon?: number | null;
  onSelect?: (location: { country: string; city: string; lat: number; lon: number }) => void;
}

type ViewStep = 'main' | 'country-list' | 'district-list';

export function LocationModal({ isOpen, onClose, currentCountry, currentCity, currentLat, currentLon, onSelect }: LocationModalProps) {
  const { t } = useLanguage();
  const [step, setStep] = useState<ViewStep>('main');
  const [selectedCountry, setSelectedCountry] = useState<{ name: string; code: string; flag: string } | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(currentCity || null);
  const [selectedLat, setSelectedLat] = useState<number | null>(currentLat || null);
  const [selectedLon, setSelectedLon] = useState<number | null>(currentLon || null);
  
  const [countrySearch, setCountrySearch] = useState('');
  const [districtSearch, setDistrictSearch] = useState('');
  const [districtResults, setDistrictResults] = useState<any[]>([]);
  const [isSearchingDistricts, setIsSearchingDistricts] = useState(false);
  const [mapZoom, setMapZoom] = useState(12);

  useEffect(() => {
    if (isOpen) {
      window.history.pushState({ modal: 'location', step }, '', '');
      
      const handlePopState = () => {
        if (step === 'main') {
          onClose();
        } else {
          setStep('main');
        }
      };
      
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [isOpen, step, onClose]);

  useEffect(() => {
    if (isOpen) {
      setStep('main');
      if (currentCity) setSelectedDistrict(currentCity);
      if (currentLat) setSelectedLat(currentLat);
      if (currentLon) setSelectedLon(currentLon);
      
      if (currentCountry && !selectedCountry) {
        const country = COUNTRIES_LIST.find(c => c.name === currentCountry);
        if (country) setSelectedCountry(country);
      }
      
      setMapZoom(currentCity ? 12 : 5);
    }
  }, [isOpen, currentCity, currentLat, currentLon, currentCountry]);

  const filteredCountries = useMemo(() => {
    return COUNTRIES_LIST.filter(c => 
      c.name.toLowerCase().includes(countrySearch.toLowerCase())
    );
  }, [countrySearch]);

  const searchDistricts = async (query: string) => {
    if (!query || query.length < 2) {
      setDistrictResults([]);
      return;
    }
    
    const countryFilter = selectedCountry ? `&countrycodes=${selectedCountry.code.toLowerCase()}` : '';
    const cacheKey = `${query}-${countryFilter}`;
    
    if (NOMINATIM_CACHE[cacheKey]) {
      setDistrictResults(NOMINATIM_CACHE[cacheKey]);
      return;
    }
    
    setIsSearchingDistricts(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=10&addressdetails=1&featuretype=city${countryFilter}`
      );
      const data = await response.json();
      NOMINATIM_CACHE[cacheKey] = data;
      setDistrictResults(data);
    } catch (error) {
      console.error('Error searching districts:', error);
    } finally {
      setIsSearchingDistricts(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (districtSearch) searchDistricts(districtSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [districtSearch, selectedCountry]);

  const handleCountrySelect = (country: typeof COUNTRIES_LIST[0]) => {
    setSelectedCountry(country);
    setStep('main');
    setMapZoom(5);
    
    if (COUNTRY_COORDS_CACHE[country.code]) {
      const { lat, lon } = COUNTRY_COORDS_CACHE[country.code];
      setSelectedLat(lat);
      setSelectedLon(lon);
      return;
    }

    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(country.name)}&limit=1`)
      .then(res => res.json())
      .then(data => {
        if (data[0]) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          COUNTRY_COORDS_CACHE[country.code] = { lat, lon };
          setSelectedLat(lat);
          setSelectedLon(lon);
        }
      });
  };

  const handleDistrictSelect = (district: any) => {
    const name = district.address.city || district.address.town || district.address.village || district.address.suburb || district.display_name.split(',')[0];
    setSelectedDistrict(name);
    setSelectedLat(parseFloat(district.lat));
    setSelectedLon(parseFloat(district.lon));
    setMapZoom(12);
    setStep('main');
  };

  const handleSave = () => {
    if (selectedDistrict && selectedLat && selectedLon) {
      const countryName = selectedCountry?.name || 'Unknown';
      if (onSelect) {
        onSelect({
          country: countryName,
          city: selectedDistrict,
          lat: selectedLat,
          lon: selectedLon
        });
      } else {
        updateUserLocation({
          latitude: selectedLat,
          longitude: selectedLon,
          city: selectedDistrict,
        });
      }
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[1000] bg-black/40 backdrop-blur-[2px]"
          />
          
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-[1001] flex flex-col bg-white dark:bg-slate-950 rounded-t-[32px] border-t border-slate-100 dark:border-slate-800 overflow-hidden max-h-[95vh] h-full sm:h-auto"
          >
            <AnimatePresence mode="wait">
              {step === 'main' && (
                <motion.div
                  key="main"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col h-full"
                >
                  <div className="flex items-center justify-between px-6 py-5">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                      {t('set-location')}
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto px-6 space-y-5 pb-24">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                        {t('country')}
                      </label>
                      <button 
                        onClick={() => setStep('country-list')}
                        className="w-full flex items-center justify-between py-3 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl group transition-all active:scale-[0.98] hover:border-slate-300 dark:hover:border-slate-700"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center border border-slate-100 dark:border-slate-700">
                            {selectedCountry ? (
                              <span className="text-lg">{selectedCountry.flag}</span>
                            ) : (
                              <Globe className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <span className={cn(
                            "text-sm font-semibold",
                            selectedCountry ? "text-slate-900 dark:text-white" : "text-slate-400"
                          )}>
                            {selectedCountry?.name || t('select-country')}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between ml-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                          {t('map-view')}
                        </label>
                        {selectedLat && (
                          <div className="flex items-center space-x-1">
                            <div className="w-1 h-1 bg-primary rounded-full animate-pulse" />
                            <span className="text-[8px] font-black text-primary uppercase tracking-wider">Live</span>
                          </div>
                        )}
                      </div>
                      <div className="w-full h-40 bg-slate-100 dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 relative">
                        {selectedLat && selectedLon ? (
                          <iframe
                            width="100%"
                            height="100%"
                            frameBorder="0"
                            style={{ border: 0 }}
                            src={`https://maps.google.com/maps?q=${selectedLat},${selectedLon}&z=${mapZoom}&output=embed`}
                            allowFullScreen
                            className="opacity-90 grayscale-[0.1] contrast-[1.05]"
                          ></iframe>
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
                            <MapPin className="w-6 h-6 opacity-20 mb-2" />
                            <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">Select Location</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                        {t('district')}
                      </label>
                      <button 
                        onClick={() => setStep('district-list')}
                        disabled={!selectedCountry}
                        className={cn(
                          "w-full flex items-center justify-between py-3 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl group transition-all active:scale-[0.98] hover:border-slate-300 dark:hover:border-slate-700",
                          !selectedCountry && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center border border-slate-100 dark:border-slate-700">
                            <MapPin className={cn("w-4 h-4", selectedDistrict ? "text-primary" : "text-slate-400")} />
                          </div>
                          <span className={cn(
                            "text-sm font-semibold",
                            selectedDistrict ? "text-slate-900 dark:text-white" : "text-slate-400"
                          )}>
                            {selectedDistrict || t('select-district')}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                      </button>
                    </div>
                  </div>

                  <div className="absolute bottom-0 inset-x-0 p-6 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={handleSave}
                      disabled={!selectedDistrict}
                      className="w-full flex items-center justify-center py-3.5 px-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black text-sm transition-all disabled:opacity-30 active:scale-[0.98]"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {t('save-location')}
                    </button>
                  </div>

                </motion.div>
              )}

              {step === 'country-list' && (
                <motion.div
                  key="country-list"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex flex-col h-full"
                >
                  <div className="p-6 space-y-4">
                    <div className="flex items-center space-x-4">
                      <button onClick={() => setStep('main')} className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{t('select-country')}</h3>
                    </div>

                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        autoFocus
                        type="text"
                        value={countrySearch}
                        onChange={(e) => setCountrySearch(e.target.value)}
                        placeholder={t('search-country')}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-11 pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/5 dark:focus:ring-white/5 transition-all"
                      />
                      {countrySearch && (
                        <button 
                          onClick={() => setCountrySearch('')}
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
                        >
                          <X className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-0.5 custom-scrollbar">
                    {filteredCountries.map((country) => (
                      <button
                        key={country.code}
                        onClick={() => handleCountrySelect(country)}
                        className="w-full flex items-center justify-between py-3 px-4 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-all group active:scale-[0.98]"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{country.name}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-xl grayscale-[0.2] group-hover:grayscale-0 transition-all">{country.flag}</span>
                          {selectedCountry?.code === country.code && (
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 'district-list' && (
                <motion.div
                  key="district-list"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex flex-col h-full"
                >
                  <div className="p-6 space-y-4">
                    <div className="flex items-center space-x-4">
                      <button onClick={() => setStep('main')} className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{t('select-district')}</h3>
                    </div>

                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        autoFocus
                        type="text"
                        value={districtSearch}
                        onChange={(e) => setDistrictSearch(e.target.value)}
                        placeholder={t('search-district')}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-11 pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/5 dark:focus:ring-white/5 transition-all"
                      />
                      {districtSearch && (
                        <button 
                          onClick={() => setDistrictSearch('')}
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
                        >
                          <X className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-0.5 custom-scrollbar">
                    {isSearchingDistricts ? (
                      <div className="flex flex-col items-center justify-center py-20 space-y-3">
                        <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Searching...</p>
                      </div>
                    ) : districtResults.length > 0 ? (
                      districtResults.map((district, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleDistrictSelect(district)}
                          className="w-full flex items-center justify-between py-3 px-4 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-all group active:scale-[0.98]"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            </div>
                            <div className="text-left">
                              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 block">
                                {district.address.city || district.address.town || district.address.village || district.address.suburb || district.display_name.split(',')[0]}
                              </span>
                              <span className="text-[9px] text-slate-400 truncate max-w-[200px] block font-medium">
                                {district.display_name}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-200" />
                        </button>
                      ))
                    ) : districtSearch.length > 1 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <Search className="w-6 h-6 opacity-20 mb-2" />
                        <p className="text-[9px] font-black uppercase tracking-widest">No results found</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <Navigation className="w-6 h-6 opacity-20 mb-2" />
                        <p className="text-[9px] font-black uppercase tracking-widest text-center">Type at least 2 characters<br/>to search in {selectedCountry?.name}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
