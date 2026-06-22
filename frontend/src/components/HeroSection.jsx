import React from 'react';
import { Zap, Shield, Globe } from 'lucide-react';

const TAGS = [
  { icon: Zap, label: 'Free forever' },
  { icon: Globe, label: 'Browser-based' },
  { icon: Shield, label: 'No uploads' },
];

export default function HeroSection({ onGetStarted }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-20 md:py-28">
      {/* decorative blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-emerald-100 opacity-40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-teal-100 opacity-40 blur-3xl" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <span className="inline-block text-xs font-bold uppercase tracking-widest text-emerald-700 mb-4">
          PixelShrink Studio
        </span>

        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 leading-tight">
          Powerful image tools,{' '}
          <span className="text-emerald-600">right in your browser.</span>
        </h1>

        <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Resize, crop, filter, convert documents and compress videos — all for free, with no sign-up and no file uploads.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {TAGS.map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="flex items-center gap-2 bg-white border border-stone-200 text-slate-700 text-sm font-medium px-4 py-2 rounded-full shadow-sm"
            >
              <Icon className="w-4 h-4 text-emerald-600" />
              {label}
            </span>
          ))}
        </div>

        <button
          onClick={onGetStarted}
          className="mt-10 inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-base px-8 py-3.5 rounded-xl shadow-md transition-colors"
        >
          Get started — it's free
        </button>
      </div>
    </section>
  );
}
