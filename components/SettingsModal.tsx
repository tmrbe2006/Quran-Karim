import React from 'react';
import { AppSettings } from '../types';
import { DEFAULT_SETTINGS } from '../constants';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onUpdateSettings }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-800">إعدادات العرض</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 space-y-8">
          {/* Font Size */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-slate-600">حجم الخط</label>
              <span className="text-emerald-600 font-bold">{settings.fontSize}px</span>
            </div>
            <input 
              type="range" 
              min="16" max="72" step="2"
              value={settings.fontSize}
              onChange={(e) => onUpdateSettings({...settings, fontSize: parseInt(e.target.value)})}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
          </div>

          {/* Text Color */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-600">لون الخط</label>
            <input 
              type="color"
              value={settings.textColor}
              onChange={(e) => onUpdateSettings({...settings, textColor: e.target.value})}
              className="w-12 h-12 rounded-lg border-2 border-slate-100 cursor-pointer p-1"
            />
          </div>

          {/* Background Color */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-600">لون الخلفية</label>
            <input 
              type="color"
              value={settings.backgroundColor}
              onChange={(e) => onUpdateSettings({...settings, backgroundColor: e.target.value})}
              className="w-12 h-12 rounded-lg border-2 border-slate-100 cursor-pointer p-1"
            />
          </div>

          {/* Reset */}
          <button 
            onClick={() => onUpdateSettings(DEFAULT_SETTINGS)}
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-colors"
          >
            استعادة الإعدادات الافتراضية
          </button>
        </div>
      </div>
    </div>
  );
};