import { useState, useEffect } from 'react';
import { ArrowLeft, Calculator, DollarSign } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Capacitor } from '@capacitor/core';

export function ZakatView({ onBack }: { onBack: () => void }) {
  const { t } = useLanguage();
  const isMobile = Capacitor.isNativePlatform() || window.innerWidth < 768;

  const [cash, setCash] = useState<number>(0);
  const [gold, setGold] = useState<number>(0);
  const [silver, setSilver] = useState<number>(0);
  const [business, setBusiness] = useState<number>(0);
  const [debts, setDebts] = useState<number>(0);

  const totalAssets = cash + gold + silver + business;
  const netAssets = totalAssets - debts;
  const zakatAmount = netAssets > 0 ? netAssets * 0.025 : 0;

  return (
    <div className="min-h-full w-full bg-slate-50 dark:bg-slate-950 pb-8">
      <header className="sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-20 px-4 pt-safe pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-start">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('zakat-calculator')}</h1>
        </div>
      </header>

      <main className="p-2 max-w-3xl mx-auto space-y-4 py-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center">
              <div className="p-2 bg-primary-light/20 dark:bg-primary-dark/20 rounded-xl mr-3">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              {t('your-assets')}
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField label={t('cash-bank')} value={cash} onChange={setCash} />
              <InputField label={t('gold-value')} value={gold} onChange={setGold} />
              <InputField label={t('silver-value')} value={silver} onChange={setSilver} />
              <InputField label={t('business-assets')} value={business} onChange={setBusiness} />
            </div>
          </div>

          <div className="h-px w-full bg-slate-100 dark:bg-slate-800"></div>

          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center">
              <div className="p-2 bg-rose-50 dark:bg-rose-900/20 rounded-xl mr-3">
                <Calculator className="w-5 h-5 text-rose-500" />
              </div>
              {t('your-debts')}
            </h2>
            
            <InputField label={t('payable-debts')} value={debts} onChange={setDebts} />
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary dark:bg-primary-dark rounded-xl p-6 text-white shadow-xl shadow-primary/20 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-4">
              <span className="text-primary-light/80 font-medium">{t('total-assets')}</span>
              <span className="font-bold text-lg">৳ {totalAssets.toLocaleString('bn-BD')}</span>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-primary-light/80 font-medium">{t('total-debts')}</span>
              <span className="font-bold text-rose-200">- ৳ {debts.toLocaleString('bn-BD')}</span>
            </div>
            <div className="h-px w-full bg-primary-light/30 my-6"></div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-primary-light/80 text-sm mb-2">{t('zakat-payable')}</p>
                <h3 className="text-4xl font-black">৳ {Math.max(0, zakatAmount).toLocaleString('bn-BD', { maximumFractionDigits: 2 })}</h3>
              </div>
            </div>
            <div className="mt-6 p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
              <p className="text-xs text-primary-light/70 leading-relaxed">
                {t('nisab-note')}
              </p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

function InputField({ label, value, onChange }: { label: string, value: number, onChange: (val: number) => void }) {
  return (
    <div className="flex flex-col space-y-2">
      <label className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">৳</span>
        <input 
          type="number" 
          min="0"
          value={value || ''}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="w-full pl-8 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          placeholder="0"
        />
      </div>
    </div>
  );
}
