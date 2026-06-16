import React, { useState, useRef, useCallback } from 'react';
import { Upload, Download, Loader2, RefreshCcw, Lock, Music, FileDown, Info, Video } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { downloadBlob } from '../../lib/download';
import { getFFmpeg, fetchFile } from '../../lib/ffmpeg';

const ACCEPT = 'video/mp4,video/quicktime,video/webm,video/x-matroska,video/*';
const MAX_SIZE = 500 * 1024 * 1024;

const BITRATE_OPTIONS = [
  { key: '128k', label: '128 kbps', sub: 'Smallest file' },
  { key: '192k', label: '192 kbps', sub: 'Balanced' },
  { key: '256k', label: '256 kbps', sub: 'High quality' },
  { key: '320k', label: '320 kbps', sub: 'Best quality' },
];

export default function VideoToMp3Panel() {
  const [file, setFile] = useState(null);
  const [bitrate, setBitrate] = useState('192k');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState('');
  const [pct, setPct] = useState(0);
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleFile = useCallback((f) => {
    if (!f.type.startsWith('video/') && !f.type.startsWith('audio/')) { toast.error('Choose a video (or audio) file.'); return; }
    if (f.size > MAX_SIZE) toast.warning('Files larger than ~500 MB may fail in some browsers.');
    setFile({ file: f, name: f.name, size: f.size, type: f.type });
    setResult(null);
  }, []);

  const onInputChange = (e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = ''; };
  const onDrop = (e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]); };
  const onSelectClick = () => inputRef.current?.click();
  const reset = () => { setFile(null); setResult(null); setPct(0); };
  const formatBytes = (b) => b < 1024 ? `${b} B` : b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(2)} MB`;

  const extract = async () => {
    if (!file) { toast.error('Choose a video first.'); return; }
    setProcessing(true); setResult(null); setPct(0); setProgress('Loading audio engine (first run downloads ~30 MB)…');
    try {
      const ffmpeg = await getFFmpeg();
      ffmpeg.on('progress', ({ progress: p }) => {
        const pp = Math.max(0, Math.min(100, Math.round(p * 100)));
        setPct(pp); setProgress(`Extracting audio… ${pp}%`);
      });
      setProgress('Reading video…');
      const ext = (file.name.split('.').pop() || 'mp4').toLowerCase();
      const inputName = `input.${ext}`;
      const outputName = 'output.mp3';
      await ffmpeg.writeFile(inputName, await fetchFile(file.file));
      setProgress('Extracting audio…');
      await ffmpeg.exec([
        '-i', inputName,
        '-vn',
        '-acodec', 'libmp3lame',
        '-b:a', bitrate,
        outputName,
      ]);
      const data = await ffmpeg.readFile(outputName);
      const blob = new Blob([data.buffer], { type: 'audio/mpeg' });
      await ffmpeg.deleteFile(inputName).catch(() => {});
      await ffmpeg.deleteFile(outputName).catch(() => {});
      const baseName = file.name.replace(/\.[^.]+$/, '');
      const outName = `${baseName}.mp3`;
      const previewUrl = URL.createObjectURL(blob);
      setResult({ blob, name: outName, size: blob.size, previewUrl });
      toast.success(`Audio extracted (${formatBytes(blob.size)}).`);
      downloadBlob(blob, outName);
    } catch (e) {
      console.error('[Video→MP3] failed:', e);
      toast.error(`Audio extraction failed: ${e?.message || 'unknown error'}`);
    } finally {
      setProcessing(false); setProgress(''); setPct(0);
    }
  };

  const triggerDownload = () => {
    if (!result) return;
    const ok = downloadBlob(result.blob, result.name);
    if (!ok) toast.error('Download blocked by browser. Try right-clicking the link instead.');
  };

  return (
    <>
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white border border-stone-200 rounded-3xl p-5 md:p-7 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-600">Upload one video to extract audio from.</p>
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
          <h3 className="font-display font-extrabold text-xl text-slate-900">Audio quality</h3>
          <p className="text-sm text-slate-500 mt-1">Higher bitrate = better sound, larger file.</p>

          <div className="grid grid-cols-2 gap-2 mt-5">
            {BITRATE_OPTIONS.map((b) => (
              <button key={b.key} onClick={() => setBitrate(b.key)} className={`rounded-xl border px-3 py-3 text-left transition-all ${bitrate === b.key ? 'border-emerald-600 bg-emerald-50' : 'border-stone-200 bg-white hover:border-stone-400'}`}>
                <p className={`text-sm font-semibold ${bitrate === b.key ? 'text-emerald-800' : 'text-slate-900'}`}>{b.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{b.sub}</p>
              </button>
            ))}
          </div>

          <div className="mt-5 rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900">Use only with files you own</p>
                <p className="text-amber-800/90 mt-0.5 text-xs leading-relaxed">This tool extracts audio from video files you upload. Please respect copyright — only use it on content you have the rights to.</p>
              </div>
            </div>
          </div>

          <Button onClick={extract} disabled={processing || !file} className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-6 text-base rounded-xl btn-press disabled:opacity-60 disabled:cursor-not-allowed">
            {processing ? <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> {progress || 'Extracting…'}</span> : <span className="inline-flex items-center gap-2"><Music className="w-4 h-4" /> Extract Audio</span>}
          </Button>
          <div className="flex items-center gap-2 mt-4 text-xs text-slate-500"><Lock className="w-3.5 h-3.5" /> Your file never leaves your device.</div>
        </div>
      </div>

      {result && (
        <div className="mt-6 bg-white border border-stone-200 rounded-3xl p-5 md:p-7 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
            <div><h3 className="font-display font-extrabold text-xl text-slate-900">Your MP3</h3><p className="text-sm text-slate-500">Preview or download the audio.</p></div>
            <Button variant="outline" onClick={reset} className="border-stone-300">Extract another</Button>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5 flex flex-col md:flex-row md:items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-emerald-50 grid place-items-center shrink-0"><Music className="w-7 h-7 text-emerald-600" /></div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 truncate">{result.name}</p>
              <p className="text-sm text-slate-500 mt-0.5">{formatBytes(result.size)}</p>
              {result.previewUrl && (
                <audio controls src={result.previewUrl} className="mt-3 w-full" />
              )}
            </div>
            <button onClick={triggerDownload} className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg px-5 py-2.5 btn-press shrink-0"><Download className="w-4 h-4" /> Download MP3</button>
          </div>
        </div>
      )}
    </>
  );
}
