"use client";

import { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

interface QuizQuestion {
  question: string;
  type: 'mcq' | 'short_answer';
  options?: string[];
  correctAnswer: string;
  explanation?: string;
}

interface QuizSectionProps {
  data: QuizQuestion[];
}

export default function QuizSection({ data }: QuizSectionProps) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);

  if (!data || data.length === 0) return null;

  const handleOptionChange = (qIndex: number, value: string) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [qIndex]: value }));
  };

  const calculateScore = () => {
    let score = 0;
    data.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswer) {
        score++;
      } else if (q.type === 'short_answer') {
        // Simple case-insensitive check for short answers
        if (answers[idx]?.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
          score++;
        }
      }
    });
    return score;
  };

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      {submitted && (
        <div className="mb-8 p-6 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Quiz Completed!</h3>
            <p className="text-gray-600">You scored {calculateScore()} out of {data.length}</p>
          </div>
          <div className="text-4xl font-black text-indigo-600">
            {Math.round((calculateScore() / data.length) * 100)}%
          </div>
        </div>
      )}

      <div className="space-y-8">
        {data.map((q, qIndex) => (
          <div key={qIndex} className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
            <h4 className="text-lg font-medium text-gray-900 mb-4">
              <span className="text-indigo-500 font-bold mr-2">{qIndex + 1}.</span>
              {q.question}
            </h4>
            
            {q.type === 'mcq' && q.options ? (
              <div className="space-y-3">
                {q.options.map((opt, oIndex) => {
                  const isSelected = answers[qIndex] === opt;
                  const isCorrect = opt === q.correctAnswer;
                  
                  let bgClass = "bg-gray-50 border-gray-200 hover:bg-gray-100";
                  if (submitted) {
                    if (isCorrect) bgClass = "bg-green-50 border-green-200";
                    else if (isSelected && !isCorrect) bgClass = "bg-red-50 border-red-200";
                  } else if (isSelected) {
                    bgClass = "bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500";
                  }
                  
                  return (
                    <label 
                      key={oIndex} 
                      className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${bgClass}`}
                    >
                      <input 
                        type="radio"
                        name={`question-${qIndex}`}
                        value={opt}
                        checked={isSelected}
                        onChange={() => handleOptionChange(qIndex, opt)}
                        disabled={submitted}
                        className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                      />
                      <span className="ml-3 text-gray-700">{opt}</span>
                      {submitted && isCorrect && <CheckCircle2 size={18} className="ml-auto text-green-500" />}
                      {submitted && isSelected && !isCorrect && <XCircle size={18} className="ml-auto text-red-500" />}
                    </label>
                  );
                })}
              </div>
            ) : (
              <div>
                <input 
                  type="text"
                  value={answers[qIndex] || ''}
                  onChange={(e) => handleOptionChange(qIndex, e.target.value)}
                  disabled={submitted}
                  placeholder="Type your answer here..."
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${
                    submitted 
                      ? answers[qIndex]?.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()
                        ? 'border-green-300 bg-green-50'
                        : 'border-red-300 bg-red-50'
                      : 'border-gray-300'
                  }`}
                />
                {submitted && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm">
                    <span className="font-semibold text-gray-700">Expected answer: </span>
                    <span className="text-green-600 font-medium">{q.correctAnswer}</span>
                  </div>
                )}
              </div>
            )}
            
            {submitted && q.explanation && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">
                <strong>Explanation: </strong> {q.explanation}
              </div>
            )}
          </div>
        ))}
      </div>

      {!submitted && (
        <div className="mt-8 flex justify-center">
          <button 
            onClick={() => setSubmitted(true)}
            className="bg-[#4F46E5] hover:bg-[#6366F1] text-white px-8 py-3 rounded-xl font-medium transition-colors shadow-sm"
          >
            Submit Quiz
          </button>
        </div>
      )}
    </div>
  );
}
