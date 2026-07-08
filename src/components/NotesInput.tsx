"use client";

interface NotesInputProps {
  notes: string;
  setNotes: (notes: string) => void;
}

export default function NotesInput({ notes, setNotes }: NotesInputProps) {
  const MAX_LENGTH = 100000;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_LENGTH) {
      setNotes(value);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={notes}
        onChange={handleChange}
        placeholder="Paste your study notes here..."
        className="w-full h-64 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent outline-none resize-y"
      />
      <div className="text-right text-xs text-gray-400 font-medium">
        {notes.length.toLocaleString()} / {MAX_LENGTH.toLocaleString()} characters
      </div>
    </div>
  );
}
