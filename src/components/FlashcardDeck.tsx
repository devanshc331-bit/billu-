"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shuffle, ArrowLeft, ArrowRight } from 'lucide-react';

interface Flashcard {
  front: string;
  back: string;
}

interface FlashcardDeckProps {
  data: Flashcard[];
}

export default function FlashcardDeck({ data }: FlashcardDeckProps) {
  const [cards, setCards] = useState<Flashcard[]>(data || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (!cards || cards.length === 0) return null;

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % cards.length);
    }, 150);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    }, 150);
  };

  const handleShuffle = () => {
    setIsFlipped(false);
    setTimeout(() => {
      const shuffled = [...cards].sort(() => Math.random() - 0.5);
      setCards(shuffled);
      setCurrentIndex(0);
    }, 150);
  };

  return (
    <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="w-full max-w-2xl perspective-1000">
        <div 
          className="relative w-full h-[300px] cursor-pointer"
          style={{ perspective: "1000px" }}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <motion.div
            className="w-full h-full relative preserve-3d transition-all duration-500"
            initial={false}
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 60, damping: 20 }}
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Front */}
            <div 
              className="absolute w-full h-full backface-hidden bg-white border-2 border-indigo-100 rounded-2xl shadow-sm p-8 flex flex-col items-center justify-center text-center"
              style={{ backfaceVisibility: "hidden" }}
            >
              <span className="absolute top-4 left-4 text-xs font-bold text-indigo-400 uppercase tracking-wider">Question</span>
              <h3 className="text-2xl font-bold text-gray-800">{cards[currentIndex].front}</h3>
              <p className="absolute bottom-4 text-sm text-gray-400">Click to flip</p>
            </div>
            
            {/* Back */}
            <div 
              className="absolute w-full h-full backface-hidden bg-indigo-50 border-2 border-indigo-200 rounded-2xl shadow-sm p-8 flex flex-col items-center justify-center text-center"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            >
              <span className="absolute top-4 left-4 text-xs font-bold text-indigo-500 uppercase tracking-wider">Answer</span>
              <p className="text-xl text-gray-800 font-medium">{cards[currentIndex].back}</p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="flex items-center gap-6 mt-8">
        <button 
          onClick={handlePrev}
          className="p-3 rounded-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors shadow-sm"
        >
          <ArrowLeft size={20} />
        </button>
        
        <div className="text-sm font-medium text-gray-500">
          {currentIndex + 1} / {cards.length}
        </div>
        
        <button 
          onClick={handleNext}
          className="p-3 rounded-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors shadow-sm"
        >
          <ArrowRight size={20} />
        </button>
        
        <button 
          onClick={handleShuffle}
          className="p-3 ml-4 rounded-full bg-indigo-100 border border-indigo-200 hover:bg-indigo-200 text-indigo-700 transition-colors shadow-sm"
          title="Shuffle deck"
        >
          <Shuffle size={20} />
        </button>
      </div>
    </div>
  );
}
