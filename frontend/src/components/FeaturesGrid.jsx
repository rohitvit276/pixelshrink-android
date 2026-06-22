import React from 'react';
import { Lock, Cpu, Download, Smartphone, Zap, RefreshCw } from 'lucide-react';

const FEATURES = [
  {
    icon: Lock,
    title: 'Private by default',
    description: 'Your files never leave your device. All processing happens locally in the browser.',
  },
  {
    icon: Cpu,
    title: 'No installs needed',
    description: 'Open the page and start working. No plugins, no extensions, no downloads.',
  },
  {
    icon: Download,
    title: 'Instant downloads',
    description: 'Results are ready the moment processing is done — one click to save.',
  },
  {
    icon: Smartphone,
    title: 'Works on any device',
    description: 'Fully responsive and tested on desktop, tablet and mobile browsers.',
  },
  {
    icon: Zap,
    title: 'Fast processing',
    description: 'Leverages modern browser APIs for hardware-accelerated image and video processing.',
  },
  {
    icon: RefreshCw,
    title: 'Always free',
    description: 'Every tool is and will remain completely free — no hidden limits or paywalls.',
  },
];

export default function FeaturesGrid() {
  return (
    <section className="bg-slate-50 border-y border-stone-200 py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">Why PixelShrink</span>
          <h2 className="font-display text-3xl md:text-4xl font-extrabold text-slate-900 mt-2">
            Built for speed and privacy.
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex gap-4">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-emerald-100 grid place-items-center">
                <Icon className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">{title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
