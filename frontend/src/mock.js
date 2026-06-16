// Mock data for PixelShrink Studio (frontend-only)
import { Scissors, Eraser, Crop as CropIcon, FileText, FileType2, Video, Music } from 'lucide-react';

export const TOOLS = [
  {
    key: 'shrink',
    label: 'Shrink Image',
    short: 'Shrink',
    icon: Scissors,
    headline: 'Image Shrinker — resize images online, free.',
    sub: 'Shrink JPG, PNG, WEBP and more without losing crispness. Perfect for socials, email and the web.',
  },
  {
    key: 'removebg',
    label: 'Remove Background',
    short: 'No-BG',
    icon: Eraser,
    headline: 'Remove Background — instant, AI-powered, free.',
    sub: 'Erase backgrounds in one click. Get crisp transparent PNGs ready for product shots, designs and social posts.',
  },
  {
    key: 'crop',
    label: 'Crop Image',
    short: 'Crop',
    icon: CropIcon,
    headline: 'Crop Image — pick the perfect frame, free.',
    sub: 'Drag to crop, lock to a preset aspect ratio, and download the result. All in your browser.',
  },
  {
    key: 'pdf2word',
    label: 'PDF → Word',
    short: 'PDF→Word',
    icon: FileText,
    headline: 'PDF to Word — extract text from PDFs, free.',
    sub: 'Convert text-based PDFs into editable Word documents. Layout-light PDFs convert best.',
  },
  {
    key: 'word2pdf',
    label: 'Word → PDF',
    short: 'Word→PDF',
    icon: FileType2,
    headline: 'Word to PDF — turn docs into PDFs, free.',
    sub: 'Drop your .docx file and get back a clean, shareable PDF in seconds.',
  },
  {
    key: 'compressvideo',
    label: 'Compress Video',
    short: 'Video',
    icon: Video,
    headline: 'Video Compressor — shrink video files, free.',
    sub: 'Compress MP4, MOV and WebM files without losing too much quality. Runs entirely in your browser.',
  },
  {
    key: 'video2mp3',
    label: 'Video → MP3',
    short: 'V→MP3',
    icon: Music,
    headline: 'Video to MP3 — extract audio, free.',
    sub: 'Pull the audio out of any video file you own. Get a clean MP3 ready to share.',
  },
];

export const NAV_LINKS = TOOLS.map(({ key, label }) => ({ label, tool: key, href: '#tool' }));

export const FAQ_ITEMS = [
  {
    q: 'Are all the tools really free?',
    a: 'Yes. Every tool — shrinking, background removal, cropping, document conversion, video compression and audio extraction — is completely free, with no sign-up required.',
  },
  {
    q: 'Do my files get uploaded to a server?',
    a: 'No. Every tool runs entirely in your browser. Your photos, documents and videos never leave your device.',
  },
  {
    q: 'How accurate is the PDF → Word conversion?',
    a: 'It extracts the text and turns each page into Word paragraphs. Plain, text-heavy PDFs convert beautifully. Complex layouts, scanned PDFs, tables and images may not survive the trip — use a dedicated server-side converter for those.',
  },
  {
    q: 'How accurate is the Word → PDF conversion?',
    a: 'Standard documents with text, headings and lists convert cleanly. Heavily styled documents with custom fonts and complex tables may render slightly differently.',
  },
  {
    q: 'How big a video can I compress?',
    a: 'Videos up to around 500 MB work reliably in most modern browsers. Bigger files can hit your browser’s memory limit. Compression and audio extraction are CPU-heavy — expect a few minutes for longer videos.',
  },
  {
    q: 'Which file formats are supported?',
    a: 'Images: JPG, PNG, WEBP, BMP, GIF. Documents: PDF and DOCX. Video: MP4, MOV, WebM, MKV. Audio output: MP3.',
  },
  {
    q: 'Can I use these tools on my phone?',
    a: 'Yes. Everything works in modern mobile browsers — though background removal, video compression and document conversion are noticeably faster on a desktop.',
  },
];

export const USE_CASES = [
  'Publishing photos on websites for faster page loading',
  'Creating product shots with transparent backgrounds',
  'Cropping headshots and thumbnails to perfect dimensions',
  'Turning PDF notes back into editable Word documents',
  'Sharing Word reports as polished PDF attachments',
  'Compressing videos for email, messaging and social uploads',
  'Extracting audio from videos for podcasts and clips',
];
