"use client";

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File, X } from 'lucide-react';
import { toast } from 'sonner';

interface FileUploadProps {
  file: File | null;
  setFile: (file: File | null) => void;
}

export default function FileUpload({ file, setFile }: FileUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    if (fileRejections.length > 0) {
      const rejection = fileRejections[0];
      if (rejection.errors[0]?.code === 'file-invalid-type') {
        toast.error('Please upload a PDF.');
      } else if (rejection.errors[0]?.code === 'file-too-large') {
        toast.error('Maximum file size is 20 MB.');
      } else {
        toast.error('Invalid file.');
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, [setFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxSize: 20 * 1024 * 1024, // 20MB
    multiple: false
  });

  if (file) {
    return (
      <div className="border border-gray-200 rounded-xl p-6 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-[#4F46E5] text-white p-2 rounded-lg">
            <File size={24} />
          </div>
          <div>
            <p className="font-medium text-gray-900 truncate max-w-[200px] sm:max-w-[400px]">{file.name}</p>
            <p className="text-sm text-gray-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
          </div>
        </div>
        <button 
          onClick={() => setFile(null)}
          className="text-gray-400 hover:text-red-500 p-2 transition-colors"
          aria-label="Remove file"
        >
          <X size={20} />
        </button>
      </div>
    );
  }

  return (
    <div 
      {...getRootProps()} 
      className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
        ${isDragActive ? 'border-[#4F46E5] bg-indigo-50' : 'border-gray-300 hover:border-[#4F46E5] hover:bg-gray-50'}`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-4">
        <div className={`p-4 rounded-full ${isDragActive ? 'bg-[#4F46E5] text-white' : 'bg-gray-100 text-gray-500'}`}>
          <UploadCloud size={32} />
        </div>
        <div>
          <p className="text-lg font-medium text-gray-900">
            {isDragActive ? 'Drop your PDF here' : 'Drag & drop your PDF here'}
          </p>
          <p className="text-sm text-gray-500 mt-1">or click to browse from your computer</p>
        </div>
        <p className="text-xs text-gray-400 mt-2">Maximum file size: 20 MB</p>
      </div>
    </div>
  );
}
