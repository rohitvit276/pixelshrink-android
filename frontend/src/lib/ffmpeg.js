// Shared FFmpeg.wasm loader (single-threaded, no SharedArrayBuffer required)
// Reuses the same FFmpeg instance across panels to avoid re-downloading the WASM core.
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const CORE_BASE = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';

let _ffmpeg = null;
let _loadPromise = null;

export async function getFFmpeg(onLog) {
  if (_ffmpeg && _ffmpeg.loaded) {
    if (onLog) _ffmpeg.on('log', onLog);
    return _ffmpeg;
  }
  if (_loadPromise) {
    await _loadPromise;
    return _ffmpeg;
  }
  _ffmpeg = new FFmpeg();
  if (onLog) _ffmpeg.on('log', onLog);

  _loadPromise = _ffmpeg.load({
    coreURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, 'application/wasm'),
  });
  await _loadPromise;
  return _ffmpeg;
}

export { fetchFile };
