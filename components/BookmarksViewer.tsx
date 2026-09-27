import React from 'react';
import { BookmarkAyah } from '../types';

interface BookmarksViewerProps {
  bookmarks: BookmarkAyah[];
  onSelectBookmark: (bm: BookmarkAyah) => void;
  onRemoveBookmark: (bm: BookmarkAyah) => void;
  onClearAllBookmarks?: () => void;
}

export const BookmarksViewer: React.FC<BookmarksViewerProps> = ({
  bookmarks,
  onSelectBookmark,
  onRemoveBookmark,
  onClearAllBookmarks
}) => {
  return (
    <div className="w-full h-full flex flex-col bg-[#051d14] text-white overflow-hidden page-fade-in" dir="rtl">
      {/* Header */}
      <div className="p-4 pb-2 border-b border-[#0f2d22] bg-[#07251a] shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="text-right">
            <h1 className="text-xl font-bold text-[#dfb26d]">الآيات المرجعية والفواصل</h1>
            <p className="text-[10px] text-[#00b87c] font-bold">مواضع قراءتك المحفوظة لمتابعة الختمة والتلاوة</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#00b87c]/10 flex items-center justify-center text-[#00b87c]">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
          </div>
        </div>

        {bookmarks.length > 1 && onClearAllBookmarks && (
          <div className="flex justify-end pt-1">
            <button
              onClick={onClearAllBookmarks}
              className="text-[10px] text-slate-500 hover:text-red-400 font-bold transition-colors"
            >
              حذف جميع العلامات المرجعية
            </button>
          </div>
        )}
      </div>

      {/* Bookmarks List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {bookmarks.length > 0 ? (
          bookmarks.map((bm, index) => (
            <div
              key={index}
              onClick={() => onSelectBookmark(bm)}
              className="bg-[#0a2a1f] p-5 rounded-3xl border border-[#0f2d22] hover:border-[#00b87c]/40 transition-all cursor-pointer relative group text-right shadow-lg"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-2xl bg-[#00b87c]/20 text-[#00b87c] flex items-center justify-center font-extrabold text-xs">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#dfb26d]">سورة {bm.surahName}</h4>
                    <p className="text-[10px] text-[#00b87c] font-bold">فاصلة عند الآية {bm.ayahNumberInSurah}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(`${bm.text} [سورة ${bm.surahName}: ${bm.ayahNumberInSurah}]`);
                    }}
                    className="p-1.5 text-slate-500 hover:text-white rounded-lg transition-colors"
                    title="نسخ الآية"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveBookmark(bm);
                    }}
                    className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
                    title="حذف الفاصلة"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>

              <p className="quran-text text-lg text-white leading-relaxed mb-3">
                {bm.text}
              </p>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/5">
                <span className="flex items-center gap-1 text-[#00b87c] font-bold group-hover:underline">
                  <span>متابعة القراءة من هذا الموضع</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </span>
                <span className="text-[10px] text-slate-500">انقر للفتح</span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 opacity-60 flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-[#00b87c]/10 flex items-center justify-center text-[#00b87c]">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
            </div>
            <h3 className="text-sm font-bold text-white">لا توجد علامات مرجعية محفوظة</h3>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
              لحفظ موضع قراءتك، انقر على رمز الفاصلة 🔖 أعلى أي آية في المصحف لتتمكن من العودة إليها فوراً ومتابعة وردك القرآني.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
