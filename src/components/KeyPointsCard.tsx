"use client";

import CopyButton from './CopyButton';

interface KeyPoint {
  title: string;
  explanation: string;
}

interface KeyPointsCardProps {
  data: KeyPoint[];
}

export default function KeyPointsCard({ data }: KeyPointsCardProps) {
  if (!data || data.length === 0) return null;

  const textToCopy = data.map(kp => `${kp.title}\n${kp.explanation}`).join('\n\n');

  return (
    <div className="relative animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="absolute top-0 right-0">
        <CopyButton text={textToCopy} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pr-12">
        {data.map((kp, idx) => (
          <div key={idx} className="bg-gray-50 rounded-xl p-5 border border-gray-100 hover:shadow-sm transition-shadow">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{kp.title}</h3>
            <p className="text-gray-600 text-sm leading-relaxed">{kp.explanation}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
