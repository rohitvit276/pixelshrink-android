import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Download, RefreshCcw, Type, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { toast } from 'sonner';

const FONTS = [
  'Arial',
  'Georgia',
  'Courier New',
  'Trebuchet MS',
  'Comic Sans MS',
  'Verdana',
  'Times New Roman',
];

const CANVAS_PRESETS = [
  { label: 'Instagram Square', width: 1080, height: 1080 },
  { label: 'Instagram Story', width: 1080, height: 1920 },
  { label: 'Instagram Reel', width: 1080, height: 1920 },
  { label: 'Twitter / X', width: 1024, height: 512 },
  { label: 'Facebook', width: 1200, height: 628 },
  { label: 'LinkedIn', width: 1200, height: 628 },
  { label: 'Custom', width: null, height: null },
];

const ALIGNMENTS = ['left', 'center', 'right'];

const DEFAULT_STATE = {
  text: 'Hello, World!',
  font: 'Arial',
  fontSize: 64,
  textColor: '#ffffff',
  bgColor: '#10b981',
  useGradient: false,
  gradientColor: '#065f46',
  bold: false,
  italic: false,
  shadow: true,
  stroke: false,
  alignment: 'center',
  presetIndex: 0,
  customWidth: 800,
  customHeight: 600,
  format: 'png',
};

function wrapText(ctx, text, x, maxWidth, lineHeight) {
  const paragraphs = text.split('\n');
  const lines = [];
  for (const paragraph of paragraphs) {
    if (paragraph === '') {
      lines.push('');
      continue;
    }
    const words = paragraph.split(' ');
    let current = '';
    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

export default function TextToImagePanel() {
  const [state, setState] = useState(DEFAULT_STATE);
  const [rendering, setRendering] = useState(false);
  const canvasRef = useRef(null);
  const debounceRef = useRef(null);

  const set = (key, val) => setState((prev) => ({ ...prev, [key]: val }));

  const preset = CANVAS_PRESETS[state.presetIndex];
  const isCustom = preset.label === 'Custom';
  const canvasW = isCustom ? state.customWidth : preset.width;
  const canvasH = isCustom ? state.customHeight : preset.height;

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const SCALE = 2;
    canvas.width = canvasW * SCALE;
    canvas.height = canvasH * SCALE;
    canvas.style.width = '100%';
    canvas.style.height = 'auto';

    const ctx = canvas.getContext('2d');
    ctx.scale(SCALE, SCALE);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Background
    if (state.useGradient) {
      const grad = ctx.createLinearGradient(0, 0, canvasW, canvasH);
      grad.addColorStop(0, state.bgColor);
      grad.addColorStop(1, state.gradientColor);
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = state.bgColor;
    }
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Font string
    const weight = state.bold ? 'bold ' : '';
    const style = state.italic ? 'italic ' : '';
    ctx.font = `${style}${weight}${state.fontSize}px "${state.font}", sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = state.alignment;

    const padding = Math.max(40, state.fontSize * 0.8);
    const maxWidth = canvasW - padding * 2;
    const lineHeight = state.fontSize * 1.35;

    let textX;
    if (state.alignment === 'left') textX = padding;
    else if (state.alignment === 'right') textX = canvasW - padding;
    else textX = canvasW / 2;

    const lines = wrapText(ctx, state.text || ' ', textX, maxWidth, lineHeight);
    const totalHeight = lines.length * lineHeight;
    let startY = (canvasH - totalHeight) / 2 + lineHeight / 2;

    lines.forEach((line) => {
      if (state.shadow) {
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = state.fontSize * 0.15;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
      } else {
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }

      if (state.stroke) {
        ctx.strokeStyle = state.textColor === '#ffffff' ? '#000000' : '#ffffff';
        ctx.lineWidth = Math.max(1, state.fontSize * 0.04);
        ctx.lineJoin = 'round';
        ctx.strokeText(line, textX, startY);
      }

      ctx.fillStyle = state.textColor;
      ctx.fillText(line, textX, startY);
      startY += lineHeight;
    });
  }, [state, canvasW, canvasH]);

  // Debounced redraw on state change
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      drawCanvas();
    }, 80);
    return () => clearTimeout(debounceRef.current);
  }, [drawCanvas]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setRendering(true);
    if (process.env.NODE_ENV === 'development') {
      console.debug('[Text Image] Download attempt:', canvas.width, 'x', canvas.height, state.format);
    }
    try {
      const mime = state.format === 'jpg' ? 'image/jpeg' : 'image/png';
      const quality = state.format === 'jpg' ? 0.95 : undefined;
      canvas.toBlob(
        (blob) => {
          let finalBlob = blob;
          if (!finalBlob) {
            try {
              const dataUrl = canvas.toDataURL(mime, quality);
              const byteStr = atob(dataUrl.split(',')[1]);
              const ab = Uint8Array.from(byteStr, (c) => c.charCodeAt(0));
              finalBlob = new Blob([ab], { type: mime });
            } catch {
              toast.error('Export failed: could not render canvas to image.');
              setRendering(false);
              return;
            }
          }
          const url = URL.createObjectURL(finalBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `text-image-${Date.now()}.${state.format}`;
          a.click();
          URL.revokeObjectURL(url);
          toast.success('Image downloaded!');
          setRendering(false);
        },
        mime,
        quality,
      );
    } catch {
      toast.error('Download failed.');
      setRendering(false);
    }
  };

  const handleReset = () => {
    setState(DEFAULT_STATE);
    toast.success('Reset to defaults.');
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display font-extrabold text-2xl text-slate-900 flex items-center gap-2">
            <Type className="w-6 h-6 text-emerald-600" /> Text to Image
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">Create beautiful images from text. Customize fonts, colors &amp; effects.</p>
        </div>
        <button
          onClick={handleReset}
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1"
        >
          <RefreshCcw className="w-3.5 h-3.5" /> Reset
        </button>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* ── Controls ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Text input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Your Text</label>
            <textarea
              rows={4}
              value={state.text}
              onChange={(e) => set('text', e.target.value)}
              placeholder="Type something…"
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-slate-900 resize-y focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* Font family */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Font Family</label>
            <select
              value={state.font}
              onChange={(e) => set('font', e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {FONTS.map((f) => (
                <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
              ))}
            </select>
          </div>

          {/* Font size */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Font Size — <span className="text-emerald-700">{state.fontSize}px</span>
            </label>
            <Slider
              value={[state.fontSize]}
              min={12}
              max={120}
              step={2}
              onValueChange={(v) => set('fontSize', v[0])}
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1"><span>12px</span><span>120px</span></div>
          </div>

          {/* Colors */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Text Color</label>
              <div className="flex items-center gap-2 border border-stone-200 rounded-xl px-3 py-2 bg-stone-50">
                <input
                  type="color"
                  value={state.textColor}
                  onChange={(e) => set('textColor', e.target.value)}
                  className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent p-0"
                />
                <span className="text-xs font-mono text-slate-600">{state.textColor}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Background</label>
              <div className="flex items-center gap-2 border border-stone-200 rounded-xl px-3 py-2 bg-stone-50">
                <input
                  type="color"
                  value={state.bgColor}
                  onChange={(e) => set('bgColor', e.target.value)}
                  className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent p-0"
                />
                <span className="text-xs font-mono text-slate-600">{state.bgColor}</span>
              </div>
            </div>
          </div>

          {/* Gradient */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">Background Gradient</label>
              <button
                onClick={() => set('useGradient', !state.useGradient)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${state.useGradient ? 'bg-emerald-600' : 'bg-stone-300'}`}
              >
                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${state.useGradient ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
              </button>
            </div>
            {state.useGradient && (
              <div className="flex items-center gap-2 border border-stone-200 rounded-xl px-3 py-2 bg-stone-50">
                <input
                  type="color"
                  value={state.gradientColor}
                  onChange={(e) => set('gradientColor', e.target.value)}
                  className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent p-0"
                />
                <span className="text-xs text-slate-500">Gradient end color</span>
              </div>
            )}
          </div>

          {/* Effects */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Text Effects</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'bold', label: 'Bold' },
                { key: 'italic', label: 'Italic' },
                { key: 'shadow', label: 'Shadow' },
                { key: 'stroke', label: 'Stroke / Outline' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => set(key, !state[key])}
                  className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all ${state[key] ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-stone-200 bg-white text-slate-600 hover:border-stone-400'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Alignment */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Text Alignment</label>
            <div className="grid grid-cols-3 gap-2">
              {ALIGNMENTS.map((a) => (
                <button
                  key={a}
                  onClick={() => set('alignment', a)}
                  className={`rounded-xl border py-2.5 text-xs font-semibold capitalize transition-all ${state.alignment === a ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-stone-200 bg-white text-slate-600 hover:border-stone-400'}`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Canvas preset */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Canvas Size</label>
            <select
              value={state.presetIndex}
              onChange={(e) => set('presetIndex', Number(e.target.value))}
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {CANVAS_PRESETS.map((p, i) => (
                <option key={p.label} value={i}>
                  {p.label}{p.width ? ` (${p.width}×${p.height})` : ''}
                </option>
              ))}
            </select>
            {isCustom && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Width (px)</label>
                  <input
                    type="number"
                    min={100}
                    max={4000}
                    value={state.customWidth}
                    onChange={(e) => set('customWidth', Math.max(100, Number(e.target.value)))}
                    className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Height (px)</label>
                  <input
                    type="number"
                    min={100}
                    max={4000}
                    value={state.customHeight}
                    onChange={(e) => set('customHeight', Math.max(100, Number(e.target.value)))}
                    className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Format selector + Download */}
          <div className="flex items-center gap-3">
            <select
              value={state.format}
              onChange={(e) => set('format', e.target.value)}
              className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="png">PNG</option>
              <option value="jpg">JPG</option>
            </select>
            <Button
              onClick={handleDownload}
              disabled={rendering}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-6 rounded-xl btn-press disabled:opacity-60"
            >
              {rendering
                ? <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Saving…</span>
                : <span className="inline-flex items-center gap-2"><Download className="w-4 h-4" /> Download</span>
              }
            </Button>
          </div>
        </div>

        {/* ── Preview ── */}
        <div className="lg:col-span-3">
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Live Preview — {canvasW}×{canvasH}px
          </label>
          <div className="rounded-2xl border border-stone-200 bg-stone-100 overflow-hidden flex items-center justify-center p-2">
            <canvas
              ref={canvasRef}
              className="rounded-xl shadow-sm max-w-full"
            />
          </div>
          <p className="text-xs text-slate-400 mt-2 text-center">
            Preview is scaled to fit. Download is full resolution (2× for sharpness).
          </p>
        </div>
      </div>
    </div>
  );
}
