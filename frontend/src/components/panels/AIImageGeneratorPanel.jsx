import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Copy, Download, Image as ImageIcon, Loader2, RefreshCcw, Share2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';

const STYLE_OPTIONS = ['Realistic', 'Anime', 'Oil Painting', 'Digital Art', 'Cyberpunk', 'Fantasy', 'Watercolor'];
const SIZE_OPTIONS = [
  { label: 'Square (512×512)', width: 512, height: 512 },
  { label: 'Portrait (512×768)', width: 512, height: 768 },
  { label: 'Landscape (768×512)', width: 768, height: 512 },
  { label: 'Social (1024×1024)', width: 1024, height: 1024 },
];
const PROMPT_EXAMPLES = [
  'A futuristic emerald city floating above the clouds at sunrise',
  'A watercolor fox reading a book in a cozy forest library',
  'A cyberpunk street market in neon rain, ultra detailed',
];

const GALLERY_STORAGE_KEY = 'pixelshrink-ai-image-gallery';
const MAX_SEED = 2147483647;

export default function AIImageGeneratorPanel() {
  const [prompt, setPrompt] = useState('');
  const [debouncedPrompt, setDebouncedPrompt] = useState('');
  const [style, setStyle] = useState(STYLE_OPTIONS[0]);
  const [sizeIndex, setSizeIndex] = useState(0);
  const [guidanceScale, setGuidanceScale] = useState(8.5);
  const [inferenceSteps, setInferenceSteps] = useState(30);
  const [seed, setSeed] = useState('');
  const [downloadFormat, setDownloadFormat] = useState('png');
  const [imageData, setImageData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [gallery, setGallery] = useState([]);
  const [lastPayload, setLastPayload] = useState(null);
  const [canvasReady, setCanvasReady] = useState(false);
  const canvasRef = useRef(null);
  const progressIntervalRef = useRef(null);

  const size = SIZE_OPTIONS[sizeIndex];

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedPrompt(prompt.trim()), 300);
    return () => clearTimeout(timeout);
  }, [prompt]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(GALLERY_STORAGE_KEY);
      if (raw) setGallery(JSON.parse(raw));
    } catch {
      setGallery([]);
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(gallery.slice(0, 8)));
    } catch {}
  }, [gallery]);

  const imageSrc = useMemo(() => {
    if (!imageData?.imageBase64) return null;
    return `data:${imageData.mimeType || 'image/png'};base64,${imageData.imageBase64}`;
  }, [imageData]);

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        window.clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!imageSrc || !canvasRef.current) {
      setCanvasReady(false);
      return;
    }
    setCanvasReady(false);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new window.Image();
    let active = true;
    img.onload = () => {
      if (!active) return;
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.style.width = '100%';
      canvas.style.height = 'auto';
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      setCanvasReady(true);
      if (process.env.NODE_ENV === 'development') {
        console.debug('[AI Image] Canvas rendered:', canvas.width, 'x', canvas.height);
      }
    };
    img.onerror = () => {
      if (!active) return;
      toast.error('Failed to render generated image.');
    };
    img.src = imageSrc;
    return () => {
      active = false;
      img.onload = null;
      img.onerror = null;
    };
  }, [imageSrc]);

  const runGeneration = async (override = {}) => {
    const finalPrompt = prompt.trim();
    if (!finalPrompt) {
      toast.error('Please enter a prompt first.');
      return;
    }

    const normalizedSeed = override.seed !== undefined ? override.seed : seed;
    const payload = {
      prompt: finalPrompt,
      style: override.style || style,
      width: override.width || size.width,
      height: override.height || size.height,
      guidance_scale: override.guidanceScale ?? guidanceScale,
      num_inference_steps: override.inferenceSteps ?? inferenceSteps,
      seed: normalizedSeed === '' ? null : Number(normalizedSeed),
    };

    setLoading(true);
    setErrorMessage('');
    setProgress(10);
    setLastPayload(payload);

    if (process.env.NODE_ENV === 'development') {
      console.debug('[AI Image] Generation request:', { prompt: finalPrompt, style: payload.style, size: `${payload.width}x${payload.height}`, steps: payload.num_inference_steps });
    }

    try {
      progressIntervalRef.current = window.setInterval(() => {
        setProgress((prev) => (prev >= 90 ? 90 : prev + 8));
      }, 350);

      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const raw = await response.text();
      let result = {};
      try {
        result = raw ? JSON.parse(raw) : {};
      } catch {
        result = {};
      }

      if (process.env.NODE_ENV === 'development') {
        console.debug('[AI Image] Response:', { status: response.status, hasBase64: !!result.imageBase64, cached: !!result.cached, mimeType: result.mimeType });
      }

      if (!response.ok) {
        const detail = result?.detail || 'AI generation failed. Please try again.';
        throw new Error(detail);
      }

      if (!result.imageBase64) {
        throw new Error('AI generation returned no image data. The model may still be loading — please try again in a moment.');
      }

      setImageData(result);
      const galleryItem = {
        id: `${Date.now()}`,
        prompt: payload.prompt,
        mimeType: result.mimeType || 'image/png',
        src: `data:${result.mimeType || 'image/png'};base64,${result.imageBase64}`,
      };
      setGallery((prev) => [galleryItem, ...prev].slice(0, 8));
      setProgress(100);
      toast.success(result.cached ? 'Loaded from cache.' : 'Image generated successfully.');
    } catch (error) {
      let message;
      if (error instanceof TypeError) {
        message = 'Network error: could not reach the server. Please check your connection.';
      } else {
        message = error?.message || 'Something went wrong during generation.';
      }
      setErrorMessage(message);
      toast.error(message);
    } finally {
      window.clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
      setTimeout(() => setProgress(0), 500);
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!canvasRef.current || !canvasReady) {
      toast.info('Image is still rendering — please wait a moment and try again.');
      return;
    }
    const canvas = canvasRef.current;
    const mime = downloadFormat === 'jpg' ? 'image/jpeg' : 'image/png';
    const quality = downloadFormat === 'jpg' ? 0.92 : undefined;

    if (process.env.NODE_ENV === 'development') {
      console.debug('[AI Image] Download attempt:', canvas.width, 'x', canvas.height, mime);
    }

    canvas.toBlob((blob) => {
      let finalBlob = blob;
      if (!finalBlob) {
        try {
          const dataUrl = canvas.toDataURL(mime, quality);
          const byteStr = atob(dataUrl.split(',')[1]);
          const ab = Uint8Array.from(byteStr, (c) => c.charCodeAt(0));
          finalBlob = new Blob([ab], { type: mime });
        } catch {
          toast.error('Export failed: could not create image file.');
          return;
        }
      }
      const url = URL.createObjectURL(finalBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-image-${Date.now()}.${downloadFormat}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Image downloaded.');
    }, mime, quality);
  };

  const handleCopyPrompt = async () => {
    const finalPrompt = prompt.trim();
    if (!finalPrompt) return;
    try {
      await navigator.clipboard.writeText(finalPrompt);
      toast.success('Prompt copied.');
    } catch {
      toast.error('Copy failed.');
    }
  };

  const handleRegenerate = () => {
    const randomSeed = Math.floor(Math.random() * MAX_SEED);
    setSeed(String(randomSeed));
    runGeneration({ seed: randomSeed });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display font-extrabold text-2xl text-slate-900 flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-emerald-600" /> AI Image Generator
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Turn text prompts into art in ~2-10 seconds with Hugging Face free tier.
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          Fair-use limit: 5 images/minute
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Prompt (max 500 chars)</label>
            <textarea
              value={prompt}
              maxLength={500}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to create..."
              rows={5}
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-slate-900 resize-y focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <div className="text-xs text-slate-400 mt-1">{prompt.length}/500</div>
            {debouncedPrompt && (
              <p className="text-xs text-slate-500 mt-1">Live preview prompt: {debouncedPrompt}</p>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-700 mb-2">Prompt ideas</p>
            <div className="flex flex-wrap gap-2">
              {PROMPT_EXAMPLES.map((item) => (
                <button
                  key={item}
                  onClick={() => setPrompt(item)}
                  className="text-xs px-2.5 py-1.5 rounded-full border border-stone-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-600"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Style</label>
              <select value={style} onChange={(e) => setStyle(e.target.value)} className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm">
                {STYLE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Size</label>
              <select value={sizeIndex} onChange={(e) => setSizeIndex(Number(e.target.value))} className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm">
                {SIZE_OPTIONS.map((option, index) => <option key={option.label} value={index}>{option.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Guidance Scale <span className="text-emerald-700">({guidanceScale.toFixed(1)})</span>
            </label>
            <Slider value={[guidanceScale]} min={7} max={20} step={0.5} onValueChange={(v) => setGuidanceScale(v[0])} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Inference Steps <span className="text-emerald-700">({inferenceSteps})</span>
            </label>
            <Slider value={[inferenceSteps]} min={20} max={50} step={1} onValueChange={(v) => setInferenceSteps(v[0])} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Seed (optional, reproducible)</label>
            <input
              type="number"
              value={seed}
              min={0}
              max={MAX_SEED}
              onChange={(e) => setSeed(e.target.value)}
              placeholder="Leave blank for random"
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => runGeneration()} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {loading ? <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Generating…</span> : <span className="inline-flex items-center gap-2"><Sparkles className="w-4 h-4" /> Generate</span>}
            </Button>
            <Button type="button" variant="outline" onClick={handleRegenerate} disabled={loading || !lastPayload}>
              <RefreshCcw className="w-4 h-4 mr-1" /> Regenerate
            </Button>
            <Button type="button" variant="outline" onClick={handleCopyPrompt} disabled={!prompt.trim()}>
              <Copy className="w-4 h-4 mr-1" /> Copy Prompt
            </Button>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-2xl border border-stone-200 bg-stone-100 p-3 min-h-[300px] flex items-center justify-center relative">
            {loading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] rounded-2xl flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
                <p className="text-xs text-slate-600 font-medium">Generating image… {progress}%</p>
              </div>
            )}
            {imageSrc ? (
              <canvas ref={canvasRef} className="max-w-full rounded-xl shadow-sm" />
            ) : (
              <p className="text-sm text-slate-500 text-center px-8">Your generated image will appear here.</p>
            )}
          </div>

          {errorMessage && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 px-3 py-2 text-sm">
              {errorMessage}
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <select value={downloadFormat} onChange={(e) => setDownloadFormat(e.target.value)} className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm">
              <option value="png">PNG</option>
              <option value="jpg">JPG</option>
            </select>
            <Button type="button" variant="outline" onClick={handleDownload} disabled={!imageSrc || !canvasReady}>
              <Download className="w-4 h-4 mr-1" /> Download
            </Button>
            <Button type="button" variant="outline" onClick={() => toast.info('Social sharing integration coming soon.')} disabled={!imageSrc}>
              <Share2 className="w-4 h-4 mr-1" /> Share
            </Button>
          </div>

          {gallery.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-2">Session gallery</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {gallery.map((item) => {
                  const base64Data = item.src?.includes(',') ? item.src.split(',')[1] : '';
                  return (
                    <button
                      key={item.id}
                      onClick={() => base64Data && setImageData({ imageBase64: base64Data, mimeType: item.mimeType || 'image/png' })}
                      className="rounded-xl overflow-hidden border border-stone-200 hover:border-emerald-400 transition-colors"
                      title={item.prompt}
                    >
                      <img src={item.src} alt={item.prompt} className="w-full h-24 object-cover" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
