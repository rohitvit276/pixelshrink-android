// Mock data for PixelShrink Studio (frontend-only)
export const NAV_LINKS = [
  { label: 'Shrink Image', href: '#tool', tool: 'shrink' },
  { label: 'Remove Background', href: '#tool', tool: 'removebg' },
];

export const FAQ_ITEMS = [
  {
    q: 'Is this tool really free?',
    a: 'Yes. Both shrinking and background removal are completely free. You can process up to 3 photos per batch.',
  },
  {
    q: 'Can I use this on my phone?',
    a: 'Absolutely. PixelShrink works directly in any modern mobile browser — no app needed.',
  },
  {
    q: 'Will shrinking reduce image quality?',
    a: 'We use adaptive sampling under the hood to preserve detail. Some loss is unavoidable when downsizing, but our pipeline keeps your photos sharp and clean.',
  },
  {
    q: 'How does background removal work?',
    a: 'A lightweight AI model runs directly in your browser to detect the subject and erase the background. Your photo never leaves your device.',
  },
  {
    q: 'Which file formats are supported?',
    a: 'JPG, JPEG, PNG, WEBP, BMP and GIF — backgrounds are removed and saved as transparent PNG.',
  },
  {
    q: 'Are my files safe?',
    a: 'Your photos never leave your browser. All processing happens locally on your device — nothing is uploaded to a server.',
  },
];

export const USE_CASES = [
  'Publishing photos on websites for faster page loading',
  'Attaching lighter images to emails',
  'Posting pictures on blogs and forums',
  'Optimising visuals for Facebook, Instagram, LinkedIn, Pinterest and X',
  'Creating product photos with transparent backgrounds',
  'Building e-commerce listings on eBay, Etsy, Amazon and Allegro',
  'Reducing image weight in Word, PDF, PowerPoint and Keynote documents',
];
