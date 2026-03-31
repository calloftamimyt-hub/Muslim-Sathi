import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HeartHandshake } from 'lucide-react';

export const formatCount = (count: number) => {
  if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
  if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
  return count.toString();
};

export const ReactionIcon = ({ type, className = "w-5 h-5", textSize = "text-lg" }: { type: string, className?: string, textSize?: string }) => {
  switch (type) {
    case 'like':
      return <div className={`${className} flex items-center justify-center ${textSize} leading-none`}>👍</div>;
    case 'love':
      return <div className={`${className} flex items-center justify-center ${textSize} leading-none`}>❤️</div>;
    case 'haha':
      return <div className={`${className} flex items-center justify-center ${textSize} leading-none`}>😂</div>;
    case 'wow':
      return <div className={`${className} flex items-center justify-center ${textSize} leading-none`}>😮</div>;
    case 'sad':
      return <div className={`${className} flex items-center justify-center ${textSize} leading-none`}>😢</div>;
    case 'angry':
      return <div className={`${className} flex items-center justify-center ${textSize} leading-none`}>😡</div>;
    case 'ameen':
    default:
      return (
        <div className={`${className} rounded-full bg-emerald-500 flex items-center justify-center border border-white dark:border-slate-900 shadow-sm overflow-hidden`}>
          <HeartHandshake className="w-[60%] h-[60%] text-white" />
        </div>
      );
  }
};

interface Reaction {
  emoji: string;
  label: string;
  id: string;
}

const reactions: Reaction[] = [
  { emoji: '👍', label: 'Like', id: 'like' },
  { emoji: '❤️', label: 'Love', id: 'love' },
  { emoji: '😂', label: 'Haha', id: 'haha' },
  { emoji: '😮', label: 'Wow', id: 'wow' },
  { emoji: '😢', label: 'Sad', id: 'sad' },
  { emoji: '😡', label: 'Angry', id: 'angry' },
  { emoji: '🤲', label: 'Ameen', id: 'ameen' },
];

interface ReactionPopupProps {
  isOpen: boolean;
  onSelect: (reactionId: string) => void;
  onClose: () => void;
  position: { x: number; y: number };
}

export function ReactionPopup({ isOpen, onSelect, onClose, position }: ReactionPopupProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[1000]" 
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.5, y: 10, originX: 0 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.5, y: 10 }}
        className="fixed z-[1001] bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1.5 flex items-center space-x-1"
        style={{ 
          left: position.x + 10, // Starts from the extreme left of the button
          top: position.y - 60,
        }}
      >
        {reactions.map((reaction) => (
          <motion.button
            key={reaction.id}
            whileHover={{ scale: 1.3 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(reaction.id);
              onClose();
            }}
            className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors relative group"
          >
            <ReactionIcon type={reaction.id} className="w-8 h-8" textSize="text-2xl" />
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {reaction.label}
            </span>
          </motion.button>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
