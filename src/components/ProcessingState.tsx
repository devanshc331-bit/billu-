"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const messages = [
  "Reading PDF...",
  "Extracting text...",
  "Understanding content...",
  "Creating summary...",
  "Building flashcards...",
  "Writing quiz...",
  "Preparing revision sheet...",
  "Almost finished..."
];

export default function ProcessingState() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
      <div className="relative w-20 h-20 mb-8">
        <motion.div
          className="absolute inset-0 border-4 border-gray-100 rounded-full"
        />
        <motion.div
          className="absolute inset-0 border-4 border-[#4F46E5] rounded-full border-t-transparent border-l-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
      </div>
      
      <div className="h-10 relative w-full flex justify-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={messageIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="text-lg font-medium text-gray-700 absolute"
          >
            {messages[messageIndex]}
          </motion.p>
        </AnimatePresence>
      </div>
      <p className="text-sm text-gray-400 mt-2">This may take up to a minute.</p>
    </div>
  );
}
