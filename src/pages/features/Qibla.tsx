import React, { useState, useEffect } from 'react';
import { Compass, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { useLocation } from '@/hooks/useLocation';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export function QiblaView({ onBack }: { onBack: () => void }) {
  const { language, t } = useLanguage();
  const { latitude, longitude } = useLocation(language);
  const [heading, setHeading] = useState<number | null>(null);
  const [qiblaDirection, setQiblaDirection] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Calculate if pointing towards Qibla (within 5 degrees)
  const isPointingToQibla = heading !== null && qiblaDirection !== null && 
    Math.abs((heading - qiblaDirection + 360) % 360) < 5;

  useEffect(() => {
    if (latitude && longitude) {
      // Calculate Qibla direction (approximate formula)
      const latk = 21.4225 * Math.PI / 180.0;
      const longk = 39.8262 * Math.PI / 180.0;
      const phi = latitude * Math.PI / 180.0;
      const lambda = longitude * Math.PI / 180.0;
      
      const qibla = Math.atan2(
        Math.sin(longk - lambda),
        Math.cos(phi) * Math.tan(latk) - Math.sin(phi) * Math.cos(longk - lambda)
      );
      
      let qiblaDeg = qibla * 180.0 / Math.PI;
      if (qiblaDeg < 0) qiblaDeg += 360.0;
      
      setQiblaDirection(qiblaDeg);
    }
  }, [latitude, longitude]);

  const requestPermission = async () => {
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const response = await (DeviceOrientationEvent as any).requestPermission();
        if (response === 'granted') {
          window.addEventListener('deviceorientation', handleOrientation, true);
        } else {
          setError('Permission denied');
        }
      } catch (e) {
        setError('Error requesting permission');
      }
    } else {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }
  };

  const handleOrientation = (event: DeviceOrientationEvent) => {
    let alpha = 0;
    if ((event as any).webkitCompassHeading) {
      alpha = (event as any).webkitCompassHeading;
    } else if (event.alpha !== null) {
      alpha = 360 - event.alpha;
    }
    setHeading(alpha);
  };

  useEffect(() => {
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, []);

  return (
    <div className="flex flex-col min-h-full bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
      {/* Premium Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-20 dark:opacity-10">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl" />
      </div>

      <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-6 pt-[calc(env(safe-area-inset-top)+1.2rem)] pb-4 flex items-center justify-start shadow-sm">
        <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{t('qibla')}</h1>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 relative z-10">
        {error && <p className="text-red-500">{error}</p>}
        {heading === null && !error && (
          <div className="text-center space-y-4">
            <div className="w-24 h-24 bg-primary/10 dark:bg-primary-dark/30 text-primary dark:text-primary-light rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Compass className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">{t('qibla-compass')}</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto mb-8">
              {t('qibla-desc')}
            </p>
            <button 
              onClick={requestPermission} 
              className="px-10 py-4 bg-primary hover:bg-primary-dark text-white rounded-full font-bold shadow-xl shadow-primary/20 dark:shadow-none transition-all transform active:scale-95"
            >
              {t('enable-compass')}
            </button>
          </div>
        )}
        {heading !== null && (
          <div className="relative w-80 h-80 flex items-center justify-center">
            {/* Outer Ring with Glow */}
            <div className={cn(
              "absolute inset-0 rounded-full border-[10px] border-slate-200 dark:border-slate-800 transition-all duration-700",
              isPointingToQibla 
                ? "shadow-[0_0_60px_rgba(16,185,129,0.5)] border-primary-500/40 scale-105" 
                : "shadow-[0_0_30px_rgba(16,185,129,0.1)]"
            )}>
              {isPointingToQibla && (
                <motion.div 
                  animate={{ opacity: [0.2, 0.5, 0.2] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 rounded-full bg-primary-500/10"
                />
              )}
            </div>
            
            {/* Compass Card */}
            <motion.div 
              className="absolute inset-0 rounded-full border-[12px] border-white dark:border-slate-900 shadow-2xl flex items-center justify-center"
              style={{ rotate: -heading }}
              transition={{ type: 'spring', stiffness: 40, damping: 15 }}
            >
              {/* Cardinal Points */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 font-black text-red-500 text-2xl">N</div>
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 font-black text-slate-400 text-2xl">S</div>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-400 text-2xl">E</div>
              <div className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-400 text-2xl">W</div>
              
              {/* Degree Numbers */}
              {[0, 90, 180, 270].map((deg) => (
                <div 
                  key={deg} 
                  className="absolute inset-0 flex justify-center" 
                  style={{ rotate: deg }}
                >
                  <div className="mt-14 text-[10px] font-bold text-slate-400 dark:text-slate-600">
                    {deg}°
                  </div>
                </div>
              ))}

              {/* Degree Marks - Detailed */}
              {[...Array(72)].map((_, i) => (
                <div 
                  key={i} 
                  className="absolute inset-0 flex justify-center" 
                  style={{ rotate: i * 5 }}
                >
                  <div className={cn(
                    "w-0.5 bg-slate-200 dark:bg-slate-700 mt-1",
                    i % 6 === 0 ? "h-5 w-1 bg-slate-300 dark:bg-slate-600" : "h-3"
                  )}></div>
                </div>
              ))}

              {/* Qibla Indicator - Premium Design */}
              {qiblaDirection !== null && (
                <div 
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ rotate: qiblaDirection }}
                >
                  <div className="relative h-full w-full flex flex-col items-center">
                    <div className="absolute top-10 flex flex-col items-center">
                      {/* Needle */}
                      <div className={cn(
                        "w-2 h-32 rounded-full shadow-lg transition-all duration-500",
                        isPointingToQibla 
                          ? "bg-gradient-to-b from-primary-light via-primary to-primary-dark scale-y-110" 
                          : "bg-gradient-to-b from-slate-400 to-slate-600"
                      )}></div>
                      
                      {/* Kaaba Point */}
                      <div className={cn(
                        "w-12 h-12 rotate-45 -mt-6 flex items-center justify-center shadow-2xl border-2 transition-all duration-500",
                        isPointingToQibla 
                          ? "bg-primary-dark border-white scale-110" 
                          : "bg-slate-800 border-slate-600"
                      )}>
                        <div className="w-6 h-6 bg-white dark:bg-slate-900 rounded-sm -rotate-45 flex items-center justify-center">
                           <div className="w-4 h-4 bg-slate-900 dark:bg-white rounded-sm"></div>
                        </div>
                      </div>
                      
                      <div className="mt-3 bg-primary-dark text-white px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-md">
                        Qibla
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Center Display - Floating Look */}
            <div className={cn(
              "relative z-10 w-28 h-28 bg-white dark:bg-slate-800 rounded-full shadow-[0_10px_25px_rgba(0,0,0,0.1)] border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center transition-all duration-300",
              isPointingToQibla && "border-primary-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
            )}>
              <div className={cn(
                "text-4xl font-black leading-none tracking-tighter transition-colors duration-300",
                isPointingToQibla ? "text-primary dark:text-primary-light" : "text-slate-800 dark:text-white"
              )}>
                {Math.round(heading)}°
              </div>
              <div className={cn(
                "text-[10px] font-bold uppercase tracking-[0.2em] mt-2 transition-colors duration-300",
                isPointingToQibla ? "text-primary dark:text-primary-light" : "text-slate-500 dark:text-slate-400"
              )}>
                {isPointingToQibla ? 'Qibla Found' : 'Heading'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Rules Card - Pinned to bottom */}
      <div className="mt-auto border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 relative z-20">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg flex items-center justify-center flex-shrink-0">
              <Compass className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm leading-none mb-1">{t('qibla-rules-title' as any)}</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                {t('qibla-rules-desc' as any)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
