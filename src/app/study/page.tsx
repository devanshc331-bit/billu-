"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { BookOpen, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Component Imports
import FileUpload from '@/components/FileUpload';
import NotesInput from '@/components/NotesInput';
import ProcessingState from '@/components/ProcessingState';
import ResultsDashboard from '@/components/ResultsDashboard';

function StudyAppContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [mode, setMode] = useState<'upload' | 'paste'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    const queryMode = searchParams.get('mode');
    if (queryMode === 'paste') {
      setMode('paste');
    } else {
      setMode('upload');
    }
  }, [searchParams]);

  const handleGenerate = async () => {
    if (mode === 'upload' && !file) {
      toast.error('Please upload a PDF.');
      return;
    }
    
    if (mode === 'paste' && (!notes || notes.trim() === '')) {
      toast.error('Please upload a file or paste notes.');
      return;
    }

    setIsProcessing(true);
    setResults(null);

    try {
      let extractedText = '';
      
      if (mode === 'upload' && file) {
        const formData = new FormData();
        formData.append('file', file);
        
        const extractRes = await fetch('/api/extract', {
          method: 'POST',
          body: formData,
        });
        
        const extractData = await extractRes.json();
        if (!extractRes.ok) {
          throw new Error(extractData.error || 'Failed to extract text from file.');
        }
        extractedText = extractData.text;
      } else {
        extractedText = notes;
      }

      const generateRes = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: extractedText }),
      });
      
      const generateData = await generateRes.json();
      if (!generateRes.ok) {
        throw new Error(generateData.error || 'Failed to generate study materials.');
      }
      
      setResults(generateData);
      toast.success('Study materials generated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'An error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setNotes('');
    setResults(null);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-6 py-4 flex justify-between items-center border-b border-gray-100 bg-white shadow-sm sticky top-0 z-10">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="bg-[#4F46E5] text-white p-1.5 rounded-lg">
            <BookOpen size={20} />
          </div>
          <h1 className="text-lg font-bold">AI Study Assistant</h1>
        </Link>
        {results && (
          <button 
            onClick={handleReset}
            className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1"
          >
            <ArrowLeft size={16} /> New Study Session
          </button>
        )}
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6 lg:p-8">
        {!isProcessing && !results && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex border-b border-gray-100">
              <button
                className={`flex-1 py-4 text-center font-medium transition-colors ${mode === 'upload' ? 'bg-[#F8FAFC] text-[#4F46E5] border-b-2 border-[#4F46E5]' : 'text-gray-500 hover:bg-gray-50'}`}
                onClick={() => setMode('upload')}
              >
                Upload PDF
              </button>
              <button
                className={`flex-1 py-4 text-center font-medium transition-colors ${mode === 'paste' ? 'bg-[#F8FAFC] text-[#4F46E5] border-b-2 border-[#4F46E5]' : 'text-gray-500 hover:bg-gray-50'}`}
                onClick={() => setMode('paste')}
              >
                Paste Notes
              </button>
            </div>
            
            <div className="p-6">
              {mode === 'upload' ? (
                <FileUpload file={file} setFile={setFile} />
              ) : (
                <NotesInput notes={notes} setNotes={setNotes} />
              )}
              
              <div className="mt-8 flex justify-center">
                <button
                  onClick={handleGenerate}
                  disabled={isProcessing || (mode === 'upload' && !file) || (mode === 'paste' && !notes.trim())}
                  className="bg-[#4F46E5] hover:bg-[#6366F1] disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-medium transition-colors shadow-sm w-full md:w-auto md:min-w-[200px]"
                >
                  Generate Study Materials
                </button>
              </div>
            </div>
          </div>
        )}

        {isProcessing && <ProcessingState />}

        {results && !isProcessing && (
          <ResultsDashboard results={results} onReset={handleReset} />
        )}
      </main>
    </div>
  );
}

export default function StudyApp() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <StudyAppContent />
    </Suspense>
  );
}
