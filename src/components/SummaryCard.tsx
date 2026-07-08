"use client";

import CopyButton from './CopyButton';

interface SummaryCardProps {
  data: string;
}

export default function SummaryCard({ data }: SummaryCardProps) {
  if (!data) return null;
  
  // Format the text into paragraphs if it's just a long string
  const paragraphs = data.split('\n').filter(p => p.trim() !== '');

  return (
    <div className="relative animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="absolute top-0 right-0">
        <CopyButton text={data} />
      </div>
      <div className="prose prose-indigo max-w-none pr-12">
        {paragraphs.map((p, idx) => (
          <p key={idx} className="text-gray-700 leading-relaxed mb-4 text-lg">
            {p}
          </p>
        ))}
      </div>
    </div>
  );
}
