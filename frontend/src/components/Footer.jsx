import React from 'react';
import { Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-stone-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 grid place-items-center">
              <Sparkles className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-display font-extrabold text-white">PixelShrink</span>
              <span className="text-[10px] uppercase tracking-[0.18em] text-emerald-400 font-semibold">Studio</span>
            </div>
          </div>
          <p className="text-sm text-stone-400 max-w-md md:text-right">
            Shrink and clean up images right in your browser. No uploads, no watermarks, no compromise.
          </p>
        </div>
        <div className="border-t border-white/10 mt-8 pt-6 text-sm text-stone-500 text-center">
          © {new Date().getFullYear()} PixelShrink Studio. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
