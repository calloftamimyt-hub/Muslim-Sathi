import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Trophy, Timer, CheckCircle2, XCircle, RotateCcw, ChevronRight, BookOpen, Star, HelpCircle, Home, Heart, History } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

interface QuizCategory {
  id: string;
  title: string;
  icon: any;
  color: string;
  bg: string;
  questions: Question[];
}

const QUIZ_DATA: QuizCategory[] = [
  {
    id: 'quran',
    title: 'আল কুরআন',
    icon: BookOpen,
    color: 'text-primary-600',
    bg: 'bg-primary-100 dark:bg-primary-900/30',
    questions: [
      { id: 1, question: 'পবিত্র কুরআনের মোট সূরার সংখ্যা কত?', options: ['১১০টি', '১১৪টি', '১১৬টি', '১২০টি'], correctAnswer: 1 },
      { id: 2, question: 'কুরআনের দীর্ঘতম সূরার নাম কী?', options: ['সূরা বাকারা', 'সূরা নিসা', 'সূরা ইমরান', 'সূরা মায়েদা'], correctAnswer: 0 },
      { id: 3, question: 'কুরআনের ক্ষুদ্রতম সূরার নাম কী?', options: ['সূরা ইখলাস', 'সূরা নাস', 'সূরা কাউসার', 'সূরা ফালাক'], correctAnswer: 2 },
      { id: 4, question: 'কুরআনের প্রথম অবতীর্ণ সূরা কোনটি?', options: ['সূরা ফাতিহা', 'সূরা ইখলাস', 'সূরা আলাক', 'সূরা মুযযাম্মিল'], correctAnswer: 2 },
      { id: 5, question: 'কুরআনের কোন সূরায় বিসমিল্লাহ নেই?', options: ['সূরা তওবা', 'সূরা নামল', 'সূরা হুদ', 'সূরা ইউনুস'], correctAnswer: 0 },
      { id: 6, question: 'কুরআনের কোন সূরায় দুবার বিসমিল্লাহ আছে?', options: ['সূরা তওবা', 'সূরা নামল', 'সূরা হুদ', 'সূরা ইয়াসিন'], correctAnswer: 1 },
      { id: 7, question: 'কুরআনের মোট পারার সংখ্যা কত?', options: ['২০টি', '২৫টি', '৩০টি', '৩৫টি'], correctAnswer: 2 },
      { id: 8, question: 'কুরআনের মোট মানজিলের সংখ্যা কত?', options: ['৫টি', '৭টি', '৯টি', '১১টি'], correctAnswer: 1 },
      { id: 9, question: 'কুরআনের মোট রুকুর সংখ্যা কত?', options: ['৫৪০টি', '৫৫৬টি', '৫৮০টি', '৬০০টি'], correctAnswer: 1 },
      { id: 10, question: 'কুরআনের মোট সিজদার সংখ্যা কত?', options: ['১০টি', '১২টি', '১৪টি', '১৬টি'], correctAnswer: 2 },
      { id: 11, question: 'কুরআনের কোন সূরায় দুইবার সিজদা আছে?', options: ['সূরা হাজ্জ', 'সূরা নামল', 'সূরা সাজদাহ', 'সূরা আলাক'], correctAnswer: 0 },
      { id: 12, question: 'কুরআনের কোন সূরাকে কুরআনের জননী বলা হয়?', options: ['সূরা বাকারা', 'সূরা ইয়াসিন', 'সূরা ফাতিহা', 'সূরা ইখলাস'], correctAnswer: 2 },
      { id: 13, question: 'কুরআনের কোন সূরাকে কুরআনের হৃদয় বলা হয়?', options: ['সূরা ইয়াসিন', 'সূরা আর-রাহমান', 'সূরা ইখলাস', 'সূরা মুলক'], correctAnswer: 0 },
      { id: 14, question: 'কুরআনের কোন সূরাকে কুরআনের অলংকার বলা হয়?', options: ['সূরা আর-রাহমান', 'সূরা ইয়াসিন', 'সূরা ওয়াকিআ', 'সূরা মুলক'], correctAnswer: 0 },
      { id: 15, question: 'কুরআনের কোন সূরায় সবচেয়ে বেশি হুকুম-আহকাম বর্ণিত হয়েছে?', options: ['সূরা বাকারা', 'সূরা নিসা', 'সূরা মায়েদা', 'সূরা আনআম'], correctAnswer: 0 },
      { id: 16, question: 'কুরআনের কোন সূরায় মীরাস বা উত্তরাধিকার আইন বর্ণিত হয়েছে?', options: ['সূরা বাকারা', 'সূরা নিসা', 'সূরা ইমরান', 'সূরা নূর'], correctAnswer: 1 },
      { id: 17, question: 'কুরআনের কোন সূরায় পর্দার বিধান বর্ণিত হয়েছে?', options: ['সূরা নূর ও আহযাব', 'সূরা নিসা', 'সূরা বাকারা', 'সূরা মায়েদা'], correctAnswer: 0 },
      { id: 18, question: 'কুরআনের কোন সূরায় ওযুর বিধান বর্ণিত হয়েছে?', options: ['সূরা মায়েদা', 'সূরা বাকারা', 'সূরা নিসা', 'সূরা ইমরান'], correctAnswer: 0 },
      { id: 19, question: 'কুরআনের কোন সূরায় রোজার বিধান বর্ণিত হয়েছে?', options: ['সূরা বাকারা', 'সূরা ইমরান', 'সূরা নিসা', 'সূরা মায়েদা'], correctAnswer: 0 },
      { id: 20, question: 'কুরআনের কোন সূরায় হজ্জের বিধান বর্ণিত হয়েছে?', options: ['সূরা হাজ্জ ও বাকারা', 'সূরা ইমরান', 'সূরা নিসা', 'সূরা মায়েদা'], correctAnswer: 0 },
    ]
  },
  {
    id: 'seerah',
    title: 'সীরাতুন্নবী (সা.)',
    icon: Heart,
    color: 'text-rose-600',
    bg: 'bg-rose-100 dark:bg-rose-900/30',
    questions: [
      { id: 1, question: 'রাসূলুল্লাহ (সা.) কত সালে জন্মগ্রহণ করেন?', options: ['৫৭০ খ্রিস্টাব্দে', '৫৭১ খ্রিস্টাব্দে', '৫৭২ খ্রিস্টাব্দে', '৫৭৫ খ্রিস্টাব্দে'], correctAnswer: 1 },
      { id: 2, question: 'রাসূলুল্লাহ (সা.)-এর পিতার নাম কী?', options: ['আবদুল মুত্তালিব', 'আবদুল্লাহ', 'আবু তালিব', 'হামজা'], correctAnswer: 1 },
      { id: 3, question: 'রাসূলুল্লাহ (সা.)-এর মাতার নাম কী?', options: ['হালিমা', 'আমিনা', 'খাদিজা', 'ফাতিমা'], correctAnswer: 1 },
      { id: 4, question: 'রাসূলুল্লাহ (সা.)-এর দুধমাতার নাম কী?', options: ['আমিনা', 'হালিমা', 'সাফিয়া', 'ফাতিমা'], correctAnswer: 1 },
      { id: 5, question: 'রাসূলুল্লাহ (সা.) কত বছর বয়সে নবুওয়াত লাভ করেন?', options: ['২৫ বছর', '৩০ বছর', '৩৫ বছর', '৪০ বছর'], correctAnswer: 3 },
      { id: 6, question: 'রাসূলুল্লাহ (সা.)-এর প্রথম স্ত্রীর নাম কী?', options: ['আয়েশা (রা.)', 'খাদিজা (রা.)', 'সাউদা (রা.)', 'হাফসা (রা.)'], correctAnswer: 1 },
      { id: 7, question: 'রাসূলুল্লাহ (সা.) কত বছর বয়সে ইন্তেকাল করেন?', options: ['৬০ বছর', '৬২ বছর', '৬৩ বছর', '৬৫ বছর'], correctAnswer: 2 },
      { id: 8, question: 'রাসূলুল্লাহ (সা.) কোন গুহায় ধ্যানমগ্ন থাকতেন?', options: ['হেরা গুহা', 'সওর গুহা', 'উহুদ গুহা', 'বদর গুহা'], correctAnswer: 0 },
      { id: 9, question: 'রাসূলুল্লাহ (সা.)-এর প্রিয় সাহাবী ও প্রথম খলিফা কে ছিলেন?', options: ['উমর (রা.)', 'উসমান (রা.)', 'আবু বকর (রা.)', 'আলী (রা.)'], correctAnswer: 2 },
      { id: 10, question: 'রাসূলুল্লাহ (সা.)-এর হিজরতের সাথী কে ছিলেন?', options: ['আলী (রা.)', 'আবু বকর (রা.)', 'উমর (রা.)', 'উসমান (রা.)'], correctAnswer: 1 },
      { id: 11, question: 'রাসূলুল্লাহ (সা.)-এর কনিষ্ঠ কন্যার নাম কী?', options: ['যয়নব', 'রুকাইয়া', 'উম্মে কুলসুম', 'ফাতিমা'], correctAnswer: 3 },
      { id: 12, question: 'রাসূলুল্লাহ (সা.)-এর কতজন পুত্র সন্তান ছিল?', options: ['১ জন', '২ জন', '৩ জন', '৪ জন'], correctAnswer: 2 },
      { id: 13, question: 'রাসূলুল্লাহ (সা.)-এর কতজন কন্যা সন্তান ছিল?', options: ['২ জন', '৩ জন', '৪ জন', '৫ জন'], correctAnswer: 2 },
      { id: 14, question: 'রাসূলুল্লাহ (সা.) মক্কা থেকে কোথায় হিজরত করেছিলেন?', options: ['মদীনা', 'হাবশা', 'তায়েফ', 'সিরিয়া'], correctAnswer: 0 },
      { id: 15, question: 'রাসূলুল্লাহ (সা.)-এর আংটিতে কী লেখা ছিল?', options: ['আল্লাহু আকবার', 'মুহাম্মাদুর রাসূলুল্লাহ', 'লা ইলাহা ইল্লাল্লাহ', 'সুবহানাল্লাহ'], correctAnswer: 1 },
      { id: 16, question: 'রাসূলুল্লাহ (সা.)-এর তলোয়ারের নাম কী ছিল?', options: ['যুলফিকার', 'আল-বাততার', 'মাছুর', 'সবগুলো'], correctAnswer: 3 },
      { id: 17, question: 'রাসূলুল্লাহ (সা.)-এর উটনীর নাম কী ছিল?', options: ['কাসওয়া', 'আদবা', 'জাদয়া', 'সবগুলো'], correctAnswer: 0 },
      { id: 18, question: 'রাসূলুল্লাহ (সা.)-এর ঘোড়ার নাম কী ছিল?', options: ['সাকাব', 'মুরতাযায', 'লুহাফ', 'সবগুলো'], correctAnswer: 3 },
      { id: 19, question: 'রাসূলুল্লাহ (সা.)-এর খচ্চরের নাম কী ছিল?', options: ['দুলদুল', 'ফিজ্জাহ', 'ইয়াকুব', 'সবগুলো'], correctAnswer: 0 },
      { id: 20, question: 'রাসূলুল্লাহ (সা.)-এর গাধার নাম কী ছিল?', options: ['উফাইর', 'ইয়াকুব', 'সবগুলো', 'কোনটিই নয়'], correctAnswer: 2 },
    ]
  },
  {
    id: 'history',
    title: 'ইসলামের ইতিহাস',
    icon: History,
    color: 'text-amber-600',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    questions: [
      { id: 1, question: 'ইসলামের প্রথম যুদ্ধের নাম কী?', options: ['বদর যুদ্ধ', 'উহুদ যুদ্ধ', 'খন্দক যুদ্ধ', 'খায়বার যুদ্ধ'], correctAnswer: 0 },
      { id: 2, question: 'বদর যুদ্ধ কত হিজরীতে সংঘটিত হয়?', options: ['১ হিজরী', '২ হিজরী', '৩ হিজরী', '৪ হিজরী'], correctAnswer: 1 },
      { id: 3, question: 'উহুদ যুদ্ধ কত হিজরীতে সংঘটিত হয়?', options: ['২ হিজরী', '৩ হিজরী', '৪ হিজরী', '৫ হিজরী'], correctAnswer: 1 },
      { id: 4, question: 'খন্দক যুদ্ধের অপর নাম কী?', options: ['আহযাব যুদ্ধ', 'বদর যুদ্ধ', 'উহুদ যুদ্ধ', 'তাবুক যুদ্ধ'], correctAnswer: 0 },
      { id: 5, question: 'মক্কা বিজয় কত হিজরীতে হয়?', options: ['৬ হিজরী', '৭ হিজরী', '৮ হিজরী', '৯ হিজরী'], correctAnswer: 2 },
      { id: 6, question: 'ইসলামের প্রথম খলিফা কে ছিলেন?', options: ['উমর (রা.)', 'আবু বকর (রা.)', 'উসমান (রা.)', 'আলী (রা.)'], correctAnswer: 1 },
      { id: 7, question: 'ইসলামের দ্বিতীয় খলিফা কে ছিলেন?', options: ['আবু বকর (রা.)', 'উমর (রা.)', 'উসমান (রা.)', 'আলী (রা.)'], correctAnswer: 1 },
      { id: 8, question: 'ইসলামের তৃতীয় খলিফা কে ছিলেন?', options: ['উমর (রা.)', 'উসমান (রা.)', 'আলী (রা.)', 'আবু বকর (রা.)'], correctAnswer: 1 },
      { id: 9, question: 'ইসলামের চতুর্থ খলিফা কে ছিলেন?', options: ['আলী (রা.)', 'উসমান (রা.)', 'উমর (রা.)', 'আবু বকর (রা.)'], correctAnswer: 0 },
      { id: 10, question: 'ইসলামের প্রথম মুয়াজ্জিন কে ছিলেন?', options: ['আবু বকর (রা.)', 'বিলাল (রা.)', 'উমর (রা.)', 'আলী (রা.)'], correctAnswer: 1 },
      { id: 11, question: 'কারবালা যুদ্ধ কত হিজরীতে সংঘটিত হয়?', options: ['৬০ হিজরী', '৬১ হিজরী', '৬২ হিজরী', '৬৩ হিজরী'], correctAnswer: 1 },
      { id: 12, question: 'স্পেন বিজয়ী মুসলিম সেনাপতির নাম কী?', options: ['তারিক বিন যিয়াদ', 'মুসা বিন নুসাইর', 'মুহাম্মদ বিন কাসিম', 'খালিদ বিন ওয়ালিদ'], correctAnswer: 0 },
      { id: 13, question: 'সিন্ধু বিজয়ী মুসলিম সেনাপতির নাম কী?', options: ['মুহাম্মদ বিন কাসিম', 'তারিক বিন যিয়াদ', 'কুতাইবা বিন মুসলিম', 'সালাহউদ্দীন আইয়ুবী'], correctAnswer: 0 },
      { id: 14, question: 'জেরুজালেম বিজয়ী মুসলিম সুলতানের নাম কী?', options: ['সালাহউদ্দীন আইয়ুবী', 'সুলতান মাহমুদ', 'মুহাম্মদ ঘুরী', 'বাবর'], correctAnswer: 0 },
      { id: 15, question: 'উমাইয়া বংশের প্রতিষ্ঠাতা কে?', options: ['মুয়াবিয়া (রা.)', 'ইয়াজিদ', 'মারওয়ান', 'আবদুল মালিক'], correctAnswer: 0 },
      { id: 16, question: 'আব্বাসীয় বংশের প্রতিষ্ঠাতা কে?', options: ['আবুল আব্বাস আস-সাফফাহ', 'হারুনুর রশীদ', 'মামুন', 'মনসুর'], correctAnswer: 0 },
      { id: 17, question: 'অটোমান বা উসমানীয় সাম্রাজ্যের প্রতিষ্ঠাতা কে?', options: ['প্রথম উসমান', 'আরতুগ্রুল', 'দ্বিতীয় মুহাম্মদ', 'সুলাইমান'], correctAnswer: 0 },
      { id: 18, question: 'মুঘল সাম্রাজ্যের প্রতিষ্ঠাতা কে?', options: ['বাবর', 'হুমায়ুন', 'আকবর', 'শাহজাহান'], correctAnswer: 0 },
      { id: 19, question: 'প্রথম নৌ-যুদ্ধ কার আমলে সংঘটিত হয়?', options: ['উসমান (রা.)', 'উমর (রা.)', 'আলী (রা.)', 'মুয়াবিয়া (রা.)'], correctAnswer: 0 },
      { id: 20, question: 'ইসলামের ইতিহাসে প্রথম শহীদ নারী কে?', options: ['সুমাইয়া (রা.)', 'খাদিজা (রা.)', 'ফাতিমা (রা.)', 'আসমা (রা.)'], correctAnswer: 0 },
    ]
  }
];

type QuizState = 'selection' | 'playing' | 'results';

// Helper to shuffle array
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export function QuizView({ onBack }: { onBack: () => void }) {
  const { t } = useLanguage();
  const [state, setState] = useState<QuizState>('selection');
  const [selectedCategory, setSelectedCategory] = useState<QuizCategory | null>(null);
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [shuffledOptions, setShuffledOptions] = useState<{ text: string, originalIdx: number }[]>([]);

  // Handle internal back button
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (state !== 'selection') {
        setState('selection');
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [state]);

  // Timer logic
  useEffect(() => {
    let timer: any;
    if (state === 'playing' && !isAnswered && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && !isAnswered) {
      handleAnswer(-1); // Time out
    }
    return () => clearInterval(timer);
  }, [state, isAnswered, timeLeft]);

  const handleStartQuiz = (category: QuizCategory) => {
    const shuffled = shuffleArray(category.questions).slice(0, 15); // Take 15 questions per session
    setSelectedCategory(category);
    setShuffledQuestions(shuffled);
    setCurrentQuestionIdx(0);
    setScore(0);
    prepareQuestion(shuffled[0]);
    
    // Push state for internal navigation
    window.history.pushState({ tab: 'quiz', internal: true }, '', '');
    setState('playing');
  };

  const prepareQuestion = (question: Question) => {
    const options = question.options.map((text, idx) => ({ text, originalIdx: idx }));
    setShuffledOptions(shuffleArray(options));
    setTimeLeft(15);
    setIsAnswered(false);
    setSelectedOption(null);
  };

  const handleAnswer = (shuffledIdx: number) => {
    if (isAnswered) return;
    
    const originalIdx = shuffledIdx === -1 ? -1 : shuffledOptions[shuffledIdx].originalIdx;
    setSelectedOption(shuffledIdx);
    setIsAnswered(true);
    
    if (originalIdx === shuffledQuestions[currentQuestionIdx].correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIdx < shuffledQuestions.length - 1) {
      const nextIdx = currentQuestionIdx + 1;
      setCurrentQuestionIdx(nextIdx);
      prepareQuestion(shuffledQuestions[nextIdx]);
    } else {
      setState('results');
    }
  };

  const handleRestart = (toSelection: boolean = false) => {
    if (toSelection) {
      window.history.back(); // This will trigger popstate and set state to 'selection'
    } else if (selectedCategory) {
      handleStartQuiz(selectedCategory);
    } else {
      setState('selection');
    }
  };

  const getScoreMessage = () => {
    const percentage = (score / shuffledQuestions.length) * 100;
    if (percentage === 100) return "মাশাআল্লাহ! আপনি সব প্রশ্নের সঠিক উত্তর দিয়েছেন।";
    if (percentage >= 80) return "অসাধারণ! আপনার জ্ঞান সত্যিই প্রশংসনীয়।";
    if (percentage >= 60) return "খুব ভালো! আপনি বেশ ভালো জানেন।";
    if (percentage >= 40) return "ভালো চেষ্টা! আরও একটু পড়লে আরও ভালো করবেন।";
    return "চেষ্টা চালিয়ে যান! জ্ঞান অর্জনে কোনো লজ্জা নেই।";
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50 dark:bg-slate-950 font-sans pb-8">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 pt-safe pb-3 flex items-center justify-center">
        <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          ইসলামিক কুইজ
        </h1>
      </header>

      <div className="flex-1">
        <AnimatePresence mode="wait">
          {state === 'selection' && (
            <motion.div 
              key="selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-4 space-y-4"
            >
              <div className="bg-white dark:bg-slate-900 px-5 py-3 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center shrink-0">
                  <Trophy className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">আপনার জ্ঞান যাচাই করুন</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-[10px]">একটি বিষয় বেছে নিয়ে কুইজ শুরু করুন</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {QUIZ_DATA.map((category, idx) => (
                  <motion.button
                    key={category.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    onClick={() => handleStartQuiz(category)}
                    className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", category.bg)}>
                        <category.icon className={cn("w-6 h-6", category.color)} />
                      </div>
                      <div className="text-left">
                        <h3 className="font-bold text-slate-900 dark:text-white">{category.title}</h3>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{category.questions.length}টি প্রশ্ন</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary-500 transition-colors" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {state === 'playing' && selectedCategory && (
            <motion.div 
              key="playing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="p-4 flex flex-col"
            >
              {/* Progress Bar */}
              <div className="mb-4 shrink-0">
                <div className="flex justify-between items-end mb-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">প্রশ্ন {currentQuestionIdx + 1}/{shuffledQuestions.length}</span>
                  <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <Timer className="w-3.5 h-3.5" />
                    <span className="text-xs font-mono font-bold">{timeLeft}s</span>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentQuestionIdx + 1) / shuffledQuestions.length) * 100}%` }}
                    className="h-full bg-primary-500"
                  />
                </div>
              </div>

              {/* Question Card */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 mb-4 shrink-0">
                <h2 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                  {shuffledQuestions[currentQuestionIdx].question}
                </h2>
              </div>

              {/* Options */}
              <div className="space-y-2.5 overflow-y-auto pr-1 custom-scrollbar flex-1">
                {shuffledOptions.map((option, idx) => {
                  const isCorrect = option.originalIdx === shuffledQuestions[currentQuestionIdx].correctAnswer;
                  const isSelected = idx === selectedOption;
                  
                  return (
                    <button
                      key={idx}
                      disabled={isAnswered}
                      onClick={() => handleAnswer(idx)}
                      className={cn(
                        "w-full p-3.5 rounded-xl border-2 text-left font-bold transition-all flex items-center justify-between text-sm",
                        !isAnswered && "border-slate-100 dark:border-slate-800 hover:border-primary-200 dark:hover:border-primary-900/30 bg-white dark:bg-slate-900",
                        isAnswered && isCorrect && "border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400",
                        isAnswered && isSelected && !isCorrect && "border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400",
                        isAnswered && !isSelected && !isCorrect && "border-slate-100 dark:border-slate-800 opacity-50 bg-white dark:bg-slate-900"
                      )}
                    >
                      <span>{option.text}</span>
                      {isAnswered && isCorrect && <CheckCircle2 className="w-4 h-4 text-primary-500" />}
                      {isAnswered && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-500" />}
                    </button>
                  );
                })}
              </div>

              {/* Next Button */}
              <div className="pt-4 shrink-0">
                <button
                  disabled={!isAnswered}
                  onClick={handleNextQuestion}
                  className={cn(
                    "w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm",
                    isAnswered 
                      ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20 active:scale-95" 
                      : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                  )}
                >
                  {currentQuestionIdx === shuffledQuestions.length - 1 ? 'ফলাফল দেখুন' : 'পরবর্তী প্রশ্ন'}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {state === 'results' && (
            <motion.div 
              key="results"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 flex flex-col items-center justify-center min-h-[60vh] text-center"
            >
              <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <Trophy className="w-10 h-10 text-amber-500 drop-shadow-sm" />
              </div>
              
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">কুইজ সম্পন্ন!</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 px-4 leading-relaxed">
                {getScoreMessage()}
              </p>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 w-full max-w-xs mb-8">
                <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">আপনার স্কোর</div>
                <div className="text-5xl font-black text-primary-600 dark:text-primary-400 mb-1">
                  {score}
                  <span className="text-xl text-slate-300 dark:text-slate-700 ml-1">/ {shuffledQuestions.length}</span>
                </div>
                <div className="h-1.5 w-24 bg-slate-100 dark:bg-slate-800 rounded-full mx-auto overflow-hidden">
                  <div 
                    className="h-full bg-primary-500 rounded-full" 
                    style={{ width: `${(score / shuffledQuestions.length) * 100}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
                <button
                  onClick={() => handleRestart(true)}
                  className="flex-1 py-2.5 px-4 rounded-xl border-2 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-900 transition-all flex items-center justify-center gap-2"
                >
                  <Home className="w-3.5 h-3.5" />
                  হোমে যান
                </button>
                <button
                  onClick={() => handleRestart(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-primary-600 text-white font-bold text-xs shadow-lg shadow-primary-600/20 hover:bg-primary-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  আবার খেলুন
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
