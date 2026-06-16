import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { TOOLS } from '../mock';
import ShrinkPanel from './panels/ShrinkPanel';
import RemoveBgPanel from './panels/RemoveBgPanel';
import CropPanel from './panels/CropPanel';
import PdfToWordPanel from './panels/PdfToWordPanel';
import WordToPdfPanel from './panels/WordToPdfPanel';
import VideoCompressPanel from './panels/VideoCompressPanel';
import VideoToMp3Panel from './panels/VideoToMp3Panel';

export default function ToolSection({ activeTool, onToolChange }) {
  const tool = TOOLS.find((t) => t.key === activeTool) || TOOLS[0];

  return (
    <section id="tool" className="relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 md:pt-14 pb-6">
        <div className="flex flex-col items-center text-center mb-8">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-100 rounded-full px-3 py-1">
            <ShieldCheck className="w-3.5 h-3.5" /> 100% browser-side processing
          </span>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 mt-5 max-w-3xl leading-[1.05]">
            {tool.headline}
          </h1>
          <p className="text-slate-600 mt-4 max-w-xl">{tool.sub}</p>

          {/* Tool switcher */}
          <div className="mt-7 inline-flex flex-wrap justify-center gap-1.5 bg-white border border-stone-200 rounded-2xl p-1.5 shadow-sm max-w-full">
            {TOOLS.map((t) => {
              const Icon = t.icon;
              const active = t.key === activeTool;
              return (
                <button
                  key={t.key}
                  onClick={() => onToolChange(t.key)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2 transition-all whitespace-nowrap ${active ? 'bg-emerald-600 text-white shadow' : 'text-slate-600 hover:text-slate-900 hover:bg-stone-50'}`}
                >
                  <Icon className="w-4 h-4" /> {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {activeTool === 'shrink' && <ShrinkPanel />}
        {activeTool === 'removebg' && <RemoveBgPanel />}
        {activeTool === 'crop' && <CropPanel />}
        {activeTool === 'pdf2word' && <PdfToWordPanel />}
        {activeTool === 'word2pdf' && <WordToPdfPanel />}
        {activeTool === 'compressvideo' && <VideoCompressPanel />}
        {activeTool === 'video2mp3' && <VideoToMp3Panel />}
      </div>
    </section>
  );
}
