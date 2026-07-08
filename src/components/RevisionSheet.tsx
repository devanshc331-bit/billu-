"use client";

import CopyButton from './CopyButton';

interface RevisionSheetProps {
  data: {
    definitions?: { term: string, definition: string }[];
    formulas?: { name: string, formula: string }[];
    dates?: { event: string, date: string }[];
    vocabulary?: { word: string, meaning: string }[];
    importantFacts?: string[];
    conceptsToMemorize?: string[];
  };
}

export default function RevisionSheet({ data }: RevisionSheetProps) {
  if (!data) return null;

  const handleCopy = () => {
    let content = ``;
    if (data.definitions) {
      content += `DEFINITIONS\n` + data.definitions.map(d => `${d.term}: ${d.definition}`).join('\n') + `\n\n`;
    }
    if (data.formulas) {
      content += `FORMULAS\n` + data.formulas.map(f => `${f.name}: ${f.formula}`).join('\n') + `\n\n`;
    }
    if (data.importantFacts) {
      content += `IMPORTANT FACTS\n` + data.importantFacts.join('\n') + `\n\n`;
    }
    return content;
  };

  return (
    <div className="relative animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="absolute top-0 right-0">
        <CopyButton text={handleCopy()} />
      </div>
      
      <div className="max-w-4xl mx-auto pr-12 space-y-8">
        
        {data.definitions && data.definitions.length > 0 && (
          <section>
            <h3 className="text-xl font-bold text-gray-900 border-b-2 border-indigo-100 pb-2 mb-4">Definitions</h3>
            <ul className="space-y-3">
              {data.definitions.map((item, idx) => (
                <li key={idx} className="flex flex-col sm:flex-row sm:items-baseline gap-2">
                  <span className="font-bold text-indigo-700 min-w-[150px]">{item.term}</span>
                  <span className="text-gray-700">{item.definition}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {data.formulas && data.formulas.length > 0 && (
          <section>
            <h3 className="text-xl font-bold text-gray-900 border-b-2 border-indigo-100 pb-2 mb-4">Key Formulas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.formulas.map((item, idx) => (
                <div key={idx} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div className="text-sm text-gray-500 mb-1">{item.name}</div>
                  <div className="font-mono text-lg font-medium text-gray-900">{item.formula}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {data.dates && data.dates.length > 0 && (
          <section>
            <h3 className="text-xl font-bold text-gray-900 border-b-2 border-indigo-100 pb-2 mb-4">Important Dates</h3>
            <ul className="space-y-2">
              {data.dates.map((item, idx) => (
                <li key={idx} className="flex gap-4">
                  <span className="font-bold text-gray-800 min-w-[120px]">{item.date}</span>
                  <span className="text-gray-600">{item.event}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
        
        {data.vocabulary && data.vocabulary.length > 0 && (
          <section>
            <h3 className="text-xl font-bold text-gray-900 border-b-2 border-indigo-100 pb-2 mb-4">Vocabulary</h3>
            <ul className="space-y-3">
              {data.vocabulary.map((item, idx) => (
                <li key={idx} className="flex flex-col sm:flex-row sm:items-baseline gap-2">
                  <span className="font-bold text-indigo-700 min-w-[150px]">{item.word}</span>
                  <span className="text-gray-700">{item.meaning}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {data.importantFacts && data.importantFacts.length > 0 && (
          <section>
            <h3 className="text-xl font-bold text-gray-900 border-b-2 border-indigo-100 pb-2 mb-4">Important Facts</h3>
            <ul className="list-disc pl-5 space-y-2">
              {data.importantFacts.map((fact, idx) => (
                <li key={idx} className="text-gray-700">{fact}</li>
              ))}
            </ul>
          </section>
        )}
        
        {data.conceptsToMemorize && data.conceptsToMemorize.length > 0 && (
          <section>
            <h3 className="text-xl font-bold text-gray-900 border-b-2 border-indigo-100 pb-2 mb-4">Concepts to Memorize</h3>
            <ul className="list-disc pl-5 space-y-2">
              {data.conceptsToMemorize.map((concept, idx) => (
                <li key={idx} className="text-gray-700">{concept}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
