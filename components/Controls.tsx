import React from 'react';
import { RECITERS } from '../constants';
import { Reciter } from '../types';

interface ControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  selectedReciter: Reciter;
  onSelectReciter: (reciter: Reciter) => void;
}

export const Controls: React.FC<ControlsProps> = ({
  isPlaying,
  onTogglePlay,
  onNext,
  onPrev,
  selectedReciter,
  onSelectReciter
}) => {
  return (
    <div className="bg-[#0a2a1f] border-t border-[#0f2d22] p-4 z-40">
      <div className="flex items-center justify-between gap-4 max-w-4xl mx-auto">
        
        {/* Playback Controls */}
        <div className="flex items-center gap-4 flex-1 justify-center">
          <button onClick={onNext} className="text-slate-400 hover:text-[#00b87c] transition-colors">
            <svg className="w-6 h-6 rotate-180" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
          </button>

          <button 
            onClick={onTogglePlay}
            className="w-12 h-12 rounded-full bg-[#00b87c] text-white flex items-center justify-center shadow-lg shadow-[#00b87c]/20 hover:scale-105 transition-all"
          >
            {isPlaying ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            ) : (
              <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            )}
          </button>

          <button onClick={onPrev} className="text-slate-400 hover:text-[#00b87c] transition-colors">
            <svg className="w-6 h-6 rotate-180" fill="currentColor" viewBox="0 0 24 24"><path d="M16 18V6h-2v12h2zM6 12l8.5 6V6z"/></svg>
          </button>
        </div>

        {/* Reciter Mini Selector */}
        <select 
          value={selectedReciter.id}
          onChange={(e) => {
            const reciter = RECITERS.find(r => r.id === e.target.value);
            if (reciter) onSelectReciter(reciter);
          }}
          className="bg-[#0f2d22] border-none text-[10px] font-bold text-[#00b87c] rounded-lg px-2 py-1 outline-none appearance-none"
        >
          {RECITERS.map(r => (
            <option key={r.id} value={r.id}>{r.name.split(' ').pop()}</option>
          ))}
        </select>
      </div>
    </div>
  );
};