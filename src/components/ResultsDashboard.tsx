"use client";

import { useState } from 'react';
import { Download, Copy, RefreshCw, FileText } from 'lucide-react';
import { toast } from 'sonner';
import SummaryCard from './SummaryCard';
import KeyPointsCard from './KeyPointsCard';
import FlashcardDeck from './FlashcardDeck';
import QuizSection from './QuizSection';
import RevisionSheet from './RevisionSheet';

interface ResultsDashboardProps {
  results: any;
  onReset: () => void;
}

export default function ResultsDashboard({ results, onReset }: ResultsDashboardProps) {
  const [activeTab, setActiveTab] = useState('summary');

  const tabs = [
    { id: 'summary', label: 'Summary' },
    { id: 'keypoints', label: 'Key Points' },
    { id: 'flashcards', label: 'Flashcards' },
    { id: 'quiz', label: 'Quiz' },
    { id: 'revision', label: 'Revision Sheet' }
  ];

  const handleDownloadAll = () => {
    let content = `# AI Study Assistant - Generated Results\n\n`;
    
    // Summary
    content += `## Summary\n\n${results.summary}\n\n`;
    
    // Key Points
    content += `## Key Points\n\n`;
    results.keyPoints?.forEach((kp: any) => {
      content += `### ${kp.title}\n${kp.explanation}\n\n`;
    });
    
    // Revision Sheet (simplified)
    content += `## Revision Sheet\n\n`;
    if (results.revisionSheet?.definitions) {
      content += `### Definitions\n`;
      results.revisionSheet.definitions.forEach((d: any) => content += `- **${d.term}**: ${d.definition}\n`);
      content += `\n`;
    }
    
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'study-materials.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Downloaded successfully!');
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-bold text-gray-900">Your Study Materials</h2>
        <div className="flex gap-2">
          <button 
            onClick={handleDownloadAll}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
          >
            <Download size={16} /> Download
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex overflow-x-auto border-b border-gray-100 hide-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 whitespace-nowrap font-medium transition-colors flex-1 text-center border-b-2
                ${activeTab === tab.id 
                  ? 'text-[#4F46E5] border-[#4F46E5] bg-[#F8FAFC]' 
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6 md:p-8 min-h-[500px]">
          {activeTab === 'summary' && <SummaryCard data={results.summary} />}
          {activeTab === 'keypoints' && <KeyPointsCard data={results.keyPoints} />}
          {activeTab === 'flashcards' && <FlashcardDeck data={results.flashcards} />}
          {activeTab === 'quiz' && <QuizSection data={results.quiz} />}
          {activeTab === 'revision' && <RevisionSheet data={results.revisionSheet} />}
        </div>
      </div>
      
      <div className="flex justify-center mt-4">
         <button 
            onClick={onReset}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors shadow-sm"
          >
            <RefreshCw size={18} /> Generate Another
          </button>
      </div>
    </div>
  );
}
