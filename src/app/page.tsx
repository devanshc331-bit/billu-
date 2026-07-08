import Link from 'next/link';
import { BookOpen, Lightbulb, FileText, CheckSquare, Layers } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-8 py-6 flex justify-between items-center border-b border-gray-100 bg-white">
        <div className="flex items-center gap-2">
          <div className="bg-[#4F46E5] text-white p-2 rounded-lg">
            <BookOpen size={24} />
          </div>
          <h1 className="text-xl font-bold">AI Study Assistant</h1>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center py-16">
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 max-w-3xl">
          Learn faster with AI-powered study materials
        </h2>
        <p className="text-lg text-gray-600 mb-10 max-w-2xl">
          Upload your lecture slides or paste your notes, and we'll instantly generate summaries, flashcards, quizzes, and revision sheets to help you ace your exams.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-20">
          <Link href="/study?mode=upload" className="bg-[#4F46E5] hover:bg-[#6366F1] text-white px-8 py-3 rounded-xl font-medium transition-colors shadow-sm">
            Upload PDF
          </Link>
          <Link href="/study?mode=paste" className="bg-white hover:bg-gray-50 text-[#111827] border border-gray-200 px-8 py-3 rounded-xl font-medium transition-colors shadow-sm">
            Paste Notes
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6 w-full max-w-6xl px-4">
          <FeatureCard icon={<FileText />} title="Summary" desc="Concise overviews" />
          <FeatureCard icon={<Lightbulb />} title="Key Points" desc="Main concepts explained" />
          <FeatureCard icon={<Layers />} title="Flashcards" desc="Active recall practice" />
          <FeatureCard icon={<CheckSquare />} title="Quiz" desc="Test your knowledge" />
          <FeatureCard icon={<BookOpen />} title="Revision Sheet" desc="5-minute quick review" />
        </div>
      </main>

      <footer className="py-8 text-center text-gray-500 text-sm border-t border-gray-100 bg-white">
        <p>&copy; {new Date().getFullYear()} AI Study Assistant. All rights reserved.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center hover:shadow-md transition-shadow">
      <div className="text-[#4F46E5] mb-4">
        {icon}
      </div>
      <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500">{desc}</p>
    </div>
  );
}
