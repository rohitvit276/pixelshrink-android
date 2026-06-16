import React, { useState, useRef, useCallback } from 'react';
import { Upload, Download, Loader2, RefreshCcw, Lock, Video, FileDown, Info } from 'lucide-react';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { toast } from 'sonner';
import { downloadBlob } from '../../lib/download';
import { getFFmpeg, fetchFile } from '../../lib/ffmpeg';

const ACCEPT = 'video/mp4,video/quicktime,video/webm,video/x-matroska,video/*';
const MAX_SIZE = 500 * 1024 * 1024; // 500 MB warning threshold

export default function VideoCompressPanel() {
  const [file, setFile] = useState(null);
  const [crf, setCrf] = useState(28); // lower = better quality, higher = smaller
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState('');
  const [pct, setPct] = useState(0);
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleFile = useCallback((f) => {
    if (!f.type.startsWith('video/')) { toast.error('Choose a video file.'); return; }
    if (f.size > MAX_SIZE) toast.warning('Videos larger than ~500 MB may fail in some browsers.');
    setFile({ file: f, name: f.name, size: f.size, type: f.type });
    setResult(null);
  }, []);

  const onInputChange = (e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = ''; };
  const onDrop = (e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]); };
  const onSelectClick = () => inputRef.current?.click();
  const reset = () => { setFile(null); setResult(null); setPct(0); };
  const formatBytes = (b) => b < 1024 ? `${b} B` : b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(2)} MB`;

  const qualityLabel = crf <= 22 ? 'High quality' : crf <= 28 ? 'Balanced' : crf <= 32 ? 'Small file' : 'Smallest file';

  const compress = async () => {
    if (!file) { toast.error('Choose a video first.'); return; }
    setProcessing(true); setResult(null); setPct(0); setProgress('Loading video engine (first run downloads ~30 MB)…');
    try {
      const ffmpeg = await getFFmpeg();
      ffmpeg.on('progress', ({ progress: p }) => {
        const pp = Math.max(0, Math.min(100, Math.round(p * 100)));
        setPct(pp); setProgress(`Compressing… ${pp}%`);
      });
      setProgress('Reading video…');
      const ext = (file.name.split('.').pop() || 'mp4').toLowerCase();
      const inputName = `input.${ext}`;
      const outputName = 'output.mp4';
      await ffmpeg.writeFile(inputName, await fetchFile(file.file));
      setProgress('Compressing…');
      await ffmpeg.exec([
        '-i', inputName,
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-crf', String(crf),
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart',
        outputName,
      ]);
      const data = await ffmpeg.readFile(outputName);
      const blob = new Blob([data.buffer], { type: 'video/mp4' });
      await ffmpeg.deleteFile(inputName).catch(() => {});
      await ffmpeg.deleteFile(outputName).catch(() => {});
      const baseName = file.name.replace(/\.[^.]+$/, '');
      const outName = `${baseName}-compressed.mp4`;
      setResult({ blob, name: outName, size: blob.size, originalSize: file.size });
      const url = URL.createObjectURL(blob);
      setResult((r) => ({ ...r, previewUrl: url }));
      toast.success(`Compressed to ${formatBytes(blob.size)}.`);
      downloadBlob(blob, outName);
    } catch (e) {
      console.error('[VideoCompress] failed:', e);
      toast.error(`Compression failed: ${e?.message || 'unknown error'}`);
    } finally {
      setProcessing(false); setProgress(''); setPct(0);
    }
  };

  const triggerDownload = () => {
    if (!result) return;
    const ok = downloadBlob(result.blob, result.name);
    if (!ok) toast.error('Download blocked by browser. Try right-clicking the link instead.');
  };

  const savedPct = result ? Math.round(((result.originalSize - result.size) / result.originalSize) * 100) : 0;

  return (
    <>
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white border border-stone-200 rounded-3xl p-5 md:p-7 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-600">Upload one video to compress.</p>
            {file && (<button onClick={reset} className="text-xs font-semibold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1"><RefreshCcw className="w-3.5 h-3.5" /> Reset</button>)}
          </div>
          {!file ? (
            <div onClick={onSelectClick} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={onDrop} className={`dashed-upload rounded-2xl border-2 border-dashed cursor-pointer transition-all p-10 md:p-14 grid place-items-center text-center ${dragOver ? 'border-emerald-600 bg-emerald-50/60' : 'border-stone-300 hover:border-emerald-500 hover:bg-emerald-50/40'}`}>
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 grid place-items-center mb-4"><Upload className="w-7 h-7 text-emerald-700" /></div>
              <p className="font-display text-xl font-bold text-slate-900">Drop a video or click to browse</p>
              <p className="text-slate-500 text-sm mt-1">MP4 · MOV · WebM · MKV — best under 500 MB</p>
              <Button className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-5 rounded-xl btn-press" type="button">Select Video</Button>
            </div>
          ) : (
            <div className="rounded-2xl bg-stone-50 border border-stone-200 p-5 flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-purple-50 grid place-items-center shrink-0"><Video className="w-7 h-7 text-purple-600" /></div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 truncate">{file.name}</p>
                <p className="text-sm text-slate-500 mt-0.5">{formatBytes(file.size)}</p>
                {processing && (
                  <div className="mt-3">
                    <div className="h-2 bg-stone-200 rounded-full overflow-hidden"><div className="h-full bg-emerald-600 transition-all duration-200" style={{ width: `${pct}%` }} /></div>
                    <p className="text-xs text-slate-500 mt-1.5">{progress}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <input ref={inputRef} type="file" accept={ACCEPT} hidden onChange={onInputChange} />
        </div>

        <div className="lg:col-span-2 bg-white border border-stone-200 rounded-3xl p-5 md:p-7 shadow-sm">
          <h3 className="font-display font-extrabold text-xl text-slate-900">Compression strength</h3>
          <p className="text-sm text-slate-500 mt-1">Higher value = smaller file, lower quality.</p>

          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-700">CRF <span className="font-bold text-emerald-700 text-lg">{crf}</span></span>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">{qualityLabel}</span>
            </div>
            <Slider value={[crf]} onValueChange={(v) => setCrf(v[0])} min={18} max={35} step={1} />
            <div className="flex justify-between text-xs text-slate-400 mt-2"><span>High quality</span><span>Smallest file</span></div>
          </div>

          <div className="mt-5 rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900">Takes a minute</p>
                <p className="text-amber-800/90 mt-0.5 text-xs leading-relaxed">Video compression is CPU-heavy and runs locally in your browser. Long videos can take several minutes. The first run downloads ~30 MB of video engine code (cached afterwards).</p>
              </div>
            </div>
          </div>

          <Button onClick={compress} disabled={processing || !file} className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-6 text-base rounded-xl btn-press disabled:opacity-60 disabled:cursor-not-allowed">
            {processing ? <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> {progress || 'Compressing…'}</span> : <span className="inline-flex items-center gap-2"><FileDown className="w-4 h-4" /> Compress Video</span>}
          </Button>
          <div className="flex items-center gap-2 mt-4 text-xs text-slate-500"><Lock className="w-3.5 h-3.5" /> Your video never leaves your device.</div>
        </div>
      </div>

      {result && (
        <div className="mt-6 bg-white border border-stone-200 rounded-3xl p-5 md:p-7 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
            <div><h3 className="font-display font-extrabold text-xl text-slate-900">Your compressed video</h3><p className="text-sm text-slate-500">Preview below or download the MP4.</p></div>
            <Button variant="outline" onClick={reset} className="border-stone-300">Compress another</Button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {result.previewUrl && (
              <video src={result.previewUrl} controls className="w-full rounded-2xl bg-black" style={{ maxHeight: 360 }} />
            )}
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-50 grid place-items-center shrink-0"><Video className="w-6 h-6 text-purple-600" /></div>
                <div className="min-w-0 flex-1"><p className="font-semibold text-slate-900 truncate">{result.name}</p><p className="text-sm text-slate-500 mt-0.5">{formatBytes(result.size)}</p></div>
              </div>
              <div className="text-sm space-y-1">
                <p className="text-slate-600">Original: <span className="font-semibold text-slate-900">{formatBytes(result.originalSize)}</span></p>
                <p className="text-slate-600">Compressed: <span className="font-semibold text-slate-900">{formatBytes(result.size)}</span></p>
                {savedPct > 0 && <p className="text-emerald-700 font-semibold">↓ {savedPct}% smaller</p>}
              </div>
              <button onClick={triggerDownload} className="mt-1 inline-flex items-center justify-center gap-2 w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg py-2.5 btn-press"><Download className="w-4 h-4" /> Download MP4</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
