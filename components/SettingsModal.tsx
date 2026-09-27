import React, { useState, useEffect } from 'react';
import { AppSettings } from '../types';
import { DEFAULT_SETTINGS, TAFSIR_EDITIONS } from '../constants';
import { 
  loadNotificationSettings, 
  saveNotificationSettings, 
  requestBrowserNotificationPermission,
  NotificationSettings 
} from '../utils/notificationService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onUpdateSettings }) => {
  if (!isOpen) return null;

  const isTrueDark = !!settings.trueDarkMode;

  const [notifConfig, setNotifConfig] = useState<NotificationSettings>(loadNotificationSettings());
  const [permissionStatus, setPermissionStatus] = useState<string>(notifConfig.browserPermission);

  useEffect(() => {
    setNotifConfig(loadNotificationSettings());
  }, [isOpen]);

  const handleToggleTrueDarkMode = () => {
    const nextVal = !isTrueDark;
    onUpdateSettings({
      ...settings,
      trueDarkMode: nextVal,
      ...(nextVal
        ? {
            textColor: '#d4c5a9',
            backgroundColor: '#0a0a0a'
          }
        : {
            textColor: '#1e293b',
            backgroundColor: '#ffffff'
          })
    });
  };

  const handleToggleNotifications = async () => {
    const nextEnabled = !notifConfig.enabled;
    const updated = { ...notifConfig, enabled: nextEnabled };
    setNotifConfig(updated);
    saveNotificationSettings(updated);

    if (nextEnabled && ('Notification' in window) && Notification.permission !== 'granted') {
      const perm = await requestBrowserNotificationPermission();
      setPermissionStatus(perm);
    }
  };

  const handleTimeChange = (type: 'morningTime' | 'eveningTime', val: string) => {
    const updated = { ...notifConfig, [type]: val };
    setNotifConfig(updated);
    saveNotificationSettings(updated);
  };

  const handleEnableBrowserPermission = async () => {
    const perm = await requestBrowserNotificationPermission();
    setPermissionStatus(perm);
    setNotifConfig(loadNotificationSettings());
  };

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className={`relative rounded-3xl shadow-2xl w-full max-w-sm max-h-[90vh] flex flex-col overflow-hidden transition-colors border ${
        isTrueDark 
          ? 'bg-[#121212] border-amber-900/30 text-amber-100' 
          : 'bg-white border-slate-100 text-slate-800'
      }`}>
        {/* Header */}
        <div className={`p-4 px-5 border-b flex items-center justify-between shrink-0 ${
          isTrueDark ? 'border-neutral-800 bg-[#161616]' : 'border-slate-100 bg-slate-50/50'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-xl ${isTrueDark ? 'bg-amber-500/10 text-[#dfb26d]' : 'bg-emerald-50 text-emerald-600'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066" />
              </svg>
            </div>
            <h3 className="text-base font-bold">الإعدادات والتفضيلات</h3>
          </div>
          <button 
            onClick={onClose} 
            className={`p-1.5 rounded-full transition-colors ${
              isTrueDark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-slate-100 text-slate-400'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Body content scrollable */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* Notifications Section (تنبيهات أذكار الصباح والمساء) */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isTrueDark
              ? 'bg-[#181510] border-[#292218]'
              : 'bg-emerald-50/60 border-emerald-100'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  isTrueDark ? 'bg-amber-500/20 text-[#dfb26d]' : 'bg-emerald-500/15 text-emerald-600'
                }`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold block">تنبيهات الأذكار اليومية</span>
                  <span className="text-[10px] text-slate-400">تذكير الصباح والمساء حسب التوقيت المحلي</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleToggleNotifications}
                className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  notifConfig.enabled ? (isTrueDark ? 'bg-[#dfb26d]' : 'bg-emerald-600') : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    notifConfig.enabled ? '-translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {notifConfig.enabled && (
              <div className="pt-2 border-t border-black/5 space-y-2.5 animate-fadeIn text-right" dir="rtl">
                {/* Morning alert time */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span>☀️</span>
                    <span>تذكير أذكار الصباح:</span>
                  </div>
                  <input
                    type="time"
                    value={notifConfig.morningTime}
                    onChange={(e) => handleTimeChange('morningTime', e.target.value)}
                    className={`px-2 py-1 rounded-lg border text-xs font-bold outline-none cursor-pointer ${
                      isTrueDark 
                        ? 'bg-[#100e0b] border-neutral-700 text-amber-200' 
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  />
                </div>

                {/* Evening alert time */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span>🌙</span>
                    <span>تذكير أذكار المساء:</span>
                  </div>
                  <input
                    type="time"
                    value={notifConfig.eveningTime}
                    onChange={(e) => handleTimeChange('eveningTime', e.target.value)}
                    className={`px-2 py-1 rounded-lg border text-xs font-bold outline-none cursor-pointer ${
                      isTrueDark 
                        ? 'bg-[#100e0b] border-neutral-700 text-amber-200' 
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  />
                </div>

                {/* System notification permission request if not granted */}
                {typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted' && (
                  <button
                    onClick={handleEnableBrowserPermission}
                    className={`w-full mt-2 py-1.5 px-2 rounded-xl text-[10px] font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      isTrueDark 
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20' 
                        : 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200/70'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    تفعيل إشعارات المتصفح والنظام
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Tafsir Edition Selector (اختيار التفسير المعتمد) */}
          <div className={`p-4 rounded-2xl border transition-all text-right ${
            isTrueDark
              ? 'bg-[#181510] border-[#292218]'
              : 'bg-slate-50 border-slate-200/80 hover:border-slate-300'
          }`} dir="rtl">
            <div className="flex items-center gap-2 mb-2.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                isTrueDark ? 'bg-amber-400/20 text-[#dfb26d]' : 'bg-emerald-500/15 text-emerald-600'
              }`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <span className="text-xs font-bold block">كتاب التفسير المعتمد</span>
                <span className="text-[10px] text-slate-400">اختر التفسير الذي يظهر عند فتح تفسير أي آية</span>
              </div>
            </div>

            <div className="space-y-2 mt-3">
              {TAFSIR_EDITIONS.map((ed) => {
                const isSelected = (settings.tafsirEdition || 'ar.muyassar') === ed.identifier;
                return (
                  <button
                    key={ed.identifier}
                    type="button"
                    onClick={() => onUpdateSettings({ ...settings, tafsirEdition: ed.identifier })}
                    className={`w-full p-2.5 rounded-xl border text-right transition-all flex items-center justify-between ${
                      isSelected
                        ? (isTrueDark 
                            ? 'bg-[#dfb26d]/15 border-[#dfb26d] text-[#dfb26d]' 
                            : 'bg-emerald-50 border-emerald-500 text-emerald-800')
                        : (isTrueDark 
                            ? 'bg-[#100e0b] border-neutral-800 text-neutral-300 hover:border-neutral-700' 
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300')
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">{ed.name}</div>
                      <div className="text-[10px] opacity-70 mt-0.5">{ed.author}</div>
                    </div>
                    {isSelected && (
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                        isTrueDark ? 'bg-[#dfb26d] text-black' : 'bg-emerald-600 text-white'
                      }`}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* True Dark Mode Toggle (الوضع الليلي الحقيقي لراحة العين) */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isTrueDark
              ? 'bg-[#1a1813] border-amber-500/30 shadow-inner shadow-amber-950/20'
              : 'bg-slate-50 border-slate-200/80 hover:border-slate-300'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  isTrueDark ? 'bg-amber-400/20 text-[#dfb26d]' : 'bg-slate-200 text-slate-600'
                }`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold">الوضع الليلي الحقيقي</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-500 font-extrabold border border-amber-500/20">
                      راحة العين
                    </span>
                  </div>
                  <p className={`text-[10px] mt-0.5 leading-snug ${isTrueDark ? 'text-amber-200/70' : 'text-slate-500'}`}>
                    تقليل التباين والضوء الأزرق، سواد عميق
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleToggleTrueDarkMode}
                className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isTrueDark ? 'bg-[#dfb26d]' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isTrueDark ? '-translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Font Size */}
          <div className="space-y-2 text-right">
            <div className="flex justify-between items-center">
              <label className={`text-xs font-bold ${isTrueDark ? 'text-neutral-300' : 'text-slate-600'}`}>حجم الخط</label>
              <span className={`font-bold text-xs ${isTrueDark ? 'text-[#dfb26d]' : 'text-emerald-600'}`}>{settings.fontSize}px</span>
            </div>
            <input 
              type="range" 
              min="18" max="72" step="2"
              value={settings.fontSize}
              onChange={(e) => onUpdateSettings({...settings, fontSize: parseInt(e.target.value)})}
              className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                isTrueDark ? 'bg-neutral-800 accent-[#dfb26d]' : 'bg-slate-200 accent-emerald-600'
              }`}
            />
          </div>

          {/* Color Customizations */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Text Color */}
            <div className={`p-2.5 rounded-2xl border flex items-center justify-between ${
              isTrueDark ? 'bg-neutral-900 border-neutral-800' : 'bg-slate-50 border-slate-200/70'
            }`}>
              <span className={`text-[11px] font-bold ${isTrueDark ? 'text-neutral-300' : 'text-slate-600'}`}>لون النص</span>
              <input 
                type="color"
                value={settings.textColor}
                onChange={(e) => onUpdateSettings({...settings, textColor: e.target.value})}
                className="w-7 h-7 rounded-lg border border-white/20 cursor-pointer p-0.5 bg-transparent"
              />
            </div>

            {/* Background Color */}
            <div className={`p-2.5 rounded-2xl border flex items-center justify-between ${
              isTrueDark ? 'bg-neutral-900 border-neutral-800' : 'bg-slate-50 border-slate-200/70'
            }`}>
              <span className={`text-[11px] font-bold ${isTrueDark ? 'text-neutral-300' : 'text-slate-600'}`}>لون الخلفية</span>
              <input 
                type="color"
                value={settings.backgroundColor}
                onChange={(e) => onUpdateSettings({...settings, backgroundColor: e.target.value})}
                className="w-7 h-7 rounded-lg border border-white/20 cursor-pointer p-0.5 bg-transparent"
              />
            </div>
          </div>

          {/* Reset */}
          <button 
            onClick={() => onUpdateSettings(DEFAULT_SETTINGS)}
            className={`w-full py-2.5 rounded-xl font-bold text-xs transition-colors border ${
              isTrueDark 
                ? 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400 border-neutral-800' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200/60'
            }`}
          >
            استعادة الإعدادات الافتراضية
          </button>
        </div>
      </div>
    </div>
  );
};
