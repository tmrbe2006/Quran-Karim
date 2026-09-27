import React, { useState } from 'react';
import { usePWAInstall } from './usePWAInstall';

export const PWAInstallButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#dfb26d] to-[#c99a4e] px-3 py-1.5 text-xs font-bold text-[#051d14] shadow-md hover:brightness-110 active:scale-95 transition-all ${className}`}
        title="تثبيت التطبيق على جهازك"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        <span>تثبيت التطبيق</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 rounded-xl border border-[#dfb26d]/40 bg-[#dfb26d]/10 px-2.5 py-1 text-[11px] font-bold text-[#dfb26d] hover:bg-[#dfb26d]/20 transition-all ${className}`}
          title="تثبيت على آيفون"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>تثبيت على الهاتف</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn" dir="rtl">
            <div className="w-full max-w-sm rounded-3xl bg-[#0a2a1f] border border-[#00b87c]/30 p-6 shadow-2xl text-white text-right">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-[#dfb26d]">تثبيت التطبيق على آيفون / آيباد</h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                <div className="flex items-start gap-2 bg-[#051d14] p-3 rounded-2xl border border-white/5">
                  <span className="w-5 h-5 rounded-full bg-[#00b87c]/20 text-[#00b87c] flex items-center justify-center font-bold text-[10px] shrink-0">1</span>
                  <p>اضغط على زر <strong className="text-white">المشاركة (Share)</strong> في شريط متصفح سفاري السفلي.</p>
                </div>
                <div className="flex items-start gap-2 bg-[#051d14] p-3 rounded-2xl border border-white/5">
                  <span className="w-5 h-5 rounded-full bg-[#00b87c]/20 text-[#00b87c] flex items-center justify-center font-bold text-[10px] shrink-0">2</span>
                  <p>مرر للأسفل واضغط على <strong className="text-white">"إضافة إلى الصفحة الرئيسية" (Add to Home Screen)</strong>.</p>
                </div>
                <div className="flex items-start gap-2 bg-[#051d14] p-3 rounded-2xl border border-white/5">
                  <span className="w-5 h-5 rounded-full bg-[#00b87c]/20 text-[#00b87c] flex items-center justify-center font-bold text-[10px] shrink-0">3</span>
                  <p>اضغط <strong className="text-white">"إضافة" (Add)</strong> وسيصبح التطبيق متاحاً على شاشتك يعمل بدون إنترنت!</p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-2xl bg-[#00b87c] py-2.5 text-xs font-bold text-white hover:bg-[#00d892] transition-colors"
              >
                حسناً، فهمت
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
