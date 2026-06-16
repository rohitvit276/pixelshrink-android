import React from 'react';
import { Check } from 'lucide-react';
import { USE_CASES } from '../mock';

export default function InfoSections() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
      <div className="grid md:grid-cols-2 gap-12">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">Free online photo tools</span>
          <h2 className="font-display text-3xl md:text-4xl font-extrabold text-slate-900 mt-3 leading-tight">
            Shrink and clean up images, without sacrificing the moment.
          </h2>
          <p className="text-slate-700 mt-4 leading-relaxed">
            When the size of your photos matters, you often have to give up quality. With PixelShrink Studio you don’t have to make that compromise. Resize pictures or strip out their background right in your browser — no installs, no uploads, no friction.
          </p>
          <p className="text-slate-700 mt-4 leading-relaxed">
            Supported formats: <span className="font-semibold">JPEG, JPG, PNG, WEBP, BMP</span> and <span className="font-semibold">GIF</span>.
          </p>
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">Common uses</span>
          <h2 className="font-display text-3xl md:text-4xl font-extrabold text-slate-900 mt-3 leading-tight">
            Photos sized and cleaned for every place they’ll live.
          </h2>
          <ul className="mt-6 space-y-3">
            {USE_CASES.map((u) => (
              <li key={u} className="flex items-start gap-3">
                <span className="mt-1 w-5 h-5 rounded-full bg-emerald-100 grid place-items-center shrink-0">
                  <Check className="w-3 h-3 text-emerald-700" strokeWidth={3} />
                </span>
                <span className="text-slate-700">{u}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
