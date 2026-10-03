import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Camera,
  X,
  Link,
  Image as ImageIcon,
  Loader2,
  Check,
} from 'lucide-react';
import { compressImageFile } from '../utils/imageUpload';

interface DeviceImagePickerProps {
  value: string;
  onChange: (dataUrl: string) => void;
  label?: string;
}

export const DeviceImagePicker: React.FC<DeviceImagePickerProps> = ({
  value,
  onChange,
  label = 'Situation Photo / Evidence',
}) => {
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [isCompressing, setIsCompressing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSizeKb, setFileSizeKb] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select an image file (PNG, JPG, WEBP, HEIC)');
      return;
    }

    setErrorMessage(null);
    setIsCompressing(true);
    try {
      const processed = await compressImageFile(file, 1200, 0.84);
      onChange(processed.dataUrl);
      setFileName(processed.fileName);
      setFileSizeKb(processed.sizeKb);
    } catch (err: any) {
      console.error('Image compression error:', err);
      setErrorMessage('Could not process this image. Please try another file.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
    // reset input so same file can be re-selected if desired
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleClear = () => {
    onChange('');
    setFileName(null);
    setFileSizeKb(null);
    setErrorMessage(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-slate-300 font-semibold text-xs flex items-center gap-1.5">
          <Camera className="w-3.5 h-3.5 text-rose-400" />
          <span>{label}</span>
          <span className="text-[10px] text-slate-500 font-normal">(optional)</span>
        </label>

        {/* Mode Toggle: Device Upload vs URL */}
        <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700 text-[10px]">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-2 py-0.5 rounded-md font-semibold transition-colors flex items-center gap-1 ${
              mode === 'upload'
                ? 'bg-rose-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UploadCloud className="w-3 h-3" />
            <span>From Device</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-2 py-0.5 rounded-md font-semibold transition-colors flex items-center gap-1 ${
              mode === 'url'
                ? 'bg-rose-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Link className="w-3 h-3" />
            <span>Image URL</span>
          </button>
        </div>
      </div>

      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* If an image is already imported, show preview */}
      {value ? (
        <div className="relative rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-950 p-2.5 flex items-center gap-3 shadow-inner">
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 flex-shrink-0 relative group">
            <img
              src={value}
              alt="Imported preview"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 min-w-0 pr-8">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white truncate">
              <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span className="truncate">
                {fileName || 'Image imported successfully'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
              {fileSizeKb && <span>{fileSizeKb} KB compressed</span>}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-rose-400 hover:text-rose-300 font-semibold underline"
              >
                Change photo
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClear}
            className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-slate-800/80 hover:bg-red-950/80 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/50 transition-colors"
            title="Remove image"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : mode === 'upload' ? (
        /* Device File Upload & Drag/Drop Zone */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-4 text-center transition-all ${
            dragOver
              ? 'border-rose-500 bg-rose-950/30 scale-[1.01]'
              : 'border-slate-700 hover:border-rose-500/60 bg-slate-800/40 hover:bg-slate-800/70'
          }`}
        >
          {isCompressing ? (
            <div className="flex flex-col items-center justify-center py-2 space-y-1.5 text-slate-300">
              <Loader2 className="w-6 h-6 animate-spin text-rose-400" />
              <p className="text-xs font-semibold">Processing image from device...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-1.5 text-slate-400">
              <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-rose-400 shadow-sm group-hover:scale-105 transition-transform">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div className="text-xs text-slate-200">
                <span className="font-bold text-rose-400 hover:underline">
                  Click to import photo from device
                </span>{' '}
                or drag & drop
              </div>
              <p className="text-[10px] text-slate-500">
                Supports camera snapshot, JPG, PNG, WEBP from your phone or desktop
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Manual URL Input fallback */
        <div className="relative">
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://images.unsplash.com/..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-3 pr-8 py-2 text-white text-xs focus:outline-none focus:border-rose-500 placeholder-slate-500"
          />
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {errorMessage && (
        <p className="text-[11px] text-red-400 font-medium pl-1">
          {errorMessage}
        </p>
      )}
    </div>
  );
};
