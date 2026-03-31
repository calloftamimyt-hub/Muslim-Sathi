import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Shield, MapPin, Activity, AlertOctagon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';

interface DataPermissionProps {
  settings: Record<string, any>;
  onToggle: (id: string) => void;
}

export function DataPermissionView({ settings, onToggle }: DataPermissionProps) {
  const { language } = useLanguage();
  const isBn = language === 'bn';

  const permissions = [
    {
      id: 'location-permission',
      icon: MapPin,
      title: isBn ? 'লোকেশন অ্যাক্সেস' : 'Location Access',
      desc: isBn ? 'নামাজের সময় এবং কিবলা নির্ণয়ের জন্য লোকেশন ব্যবহার করতে দিন।' : 'Allow location access for prayer times and Qibla direction.',
    },
    {
      id: 'analytics-permission',
      icon: Activity,
      title: isBn ? 'অ্যাপ ব্যবহারের পরিসংখ্যান' : 'Usage Analytics',
      desc: isBn ? 'অ্যাপের মান উন্নয়নে বেনামী ব্যবহারের ডেটা শেয়ার করুন।' : 'Share anonymous usage data to help us improve the app.',
    },
    {
      id: 'crash-permission',
      icon: AlertOctagon,
      title: isBn ? 'ক্র্যাশ রিপোর্ট' : 'Crash Reports',
      desc: isBn ? 'অ্যাপ ক্র্যাশ করলে স্বয়ংক্রিয়ভাবে রিপোর্ট পাঠান।' : 'Automatically send reports when the app crashes.',
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans">
      <div className="flex-grow p-4 space-y-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-center justify-center flex-col text-center mt-2">
          <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/40 rounded-full flex items-center justify-center mb-3">
            <Shield className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
            {isBn ? 'আপনার ডেটার উপর আপনার পূর্ণ নিয়ন্ত্রণ রয়েছে। আপনি চাইলে যেকোনো পারমিশন বন্ধ করতে পারেন।' : 'You have full control over your data. You can disable any permission at any time.'}
          </p>
        </motion.div>

        {permissions.map((perm, idx) => (
          <motion.div key={perm.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-between group hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 dark:bg-indigo-600 rounded-l-xl opacity-80 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="flex items-start space-x-4 pr-4 pl-2">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 mt-1">
                <perm.icon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">{perm.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{perm.desc}</p>
              </div>
            </div>
            <button onClick={() => onToggle(perm.id)} className={cn("w-12 h-6 rounded-full transition-colors relative flex-shrink-0", settings[perm.id] ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-700")}>
              <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all", settings[perm.id] ? "left-7" : "left-1")} />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
