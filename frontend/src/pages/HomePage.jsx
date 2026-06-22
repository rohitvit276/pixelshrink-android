import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import HeroSection from '../components/HeroSection';
import ToolsShowcase from '../components/ToolsShowcase';
import FeaturesGrid from '../components/FeaturesGrid';
import ToolSection from '../components/ToolSection';
import InfoSections from '../components/InfoSections';
import FAQSection from '../components/FAQSection';
import Footer from '../components/Footer';
import MoustachifyShowcase from '../components/MoustachifyShowcase';
import { Helmet } from 'react-helmet-async';

const SEO_META = {
  default: {
    title: 'PixelShrink Studio — Free Online Image, PDF & Video Tools',
    description: 'Free online tools to shrink images, remove backgrounds, crop, convert PDF to Word, Word to PDF, compress videos, add moustaches and extract audio. 100% browser-based.',
    keywords: 'image resizer, image shrinker, remove background, crop image, pdf to word, word to pdf, compress video, video to mp3, moustachify, free online tools',
  },
  shrink: {
    title: 'Free Image Resizer Online | Shrink Images Without Quality Loss',
    description: 'Resize and compress JPG, PNG, WEBP images online for free. Shrink images for web, email and social media while maintaining quality. No uploads needed.',
    keywords: 'image resizer, shrink image, compress image, resize image online, image compressor, reduce image size',
  },
  removebg: {
    title: 'Remove Background from Image | Free AI-Powered Background Remover',
    description: 'Remove image backgrounds instantly with AI. Get transparent PNGs for product photos, designs and social media. 100% browser-based, no uploads.',
    keywords: 'remove background, background remover, transparent PNG, AI background removal, remove white background',
  },
  crop: {
    title: 'Free Online Image Cropper | Crop Photos to Perfect Size',
    description: 'Crop images online with preset aspect ratios. Perfect for thumbnails, profile pictures and social media. Drag to select, download instantly.',
    keywords: 'image cropper, crop photo, resize aspect ratio, thumbnail maker, crop image online',
  },
  filters: {
    title: 'Free Online Photo Filters & Editor | Adjust Brightness, Contrast & Grayscale',
    description: 'Apply professional photo filters instantly. Adjust brightness, contrast, and grayscale on your images. No installation, no uploads required.',
    keywords: 'photo filters, image editor, brightness contrast adjustment, photo effects, online photo editor, grayscale filter',
  },
  moustachify: {
    title: 'Moustachify — Add Moustache to Photos | Free Face Detection Tool',
    description: 'Add fun moustaches to any face in your photos with AI face detection. Choose from 6 styles: handlebar, pencil, walrus, curly, chevron and dutch. Download instantly.',
    keywords: 'moustachify, add moustache, face detection, fun photo editor, mustache filter, face effects, photo fun app',
  },
  pdf2word: {
    title: 'Convert PDF to Word Online | Free PDF to Docx Converter',
    description: 'Convert text-based PDF files to editable Word documents online. Extract text and maintain formatting. No uploads, 100% browser-based.',
    keywords: 'pdf to word, convert pdf to docx, pdf converter, pdf to word converter, extract text from pdf',
  },
  word2pdf: {
    title: 'Convert Word to PDF Online | Free DOCX to PDF Converter',
    description: 'Convert Word documents (.docx) to PDF instantly. Create professional PDFs for sharing and printing. No uploads required.',
    keywords: 'word to pdf, convert docx to pdf, pdf converter, docx to pdf converter, word document to pdf',
  },
  compressvideo: {
    title: 'Compress Video Online | Free MP4, MOV & WebM Compressor',
    description: 'Reduce video file size without losing quality. Compress MP4, MOV, WebM files for email, messaging and social media. 100% browser-based.',
    keywords: 'video compressor, compress video, reduce video size, video compression online, mp4 compressor',
  },
  video2mp3: {
    title: 'Convert Video to MP3 | Free Audio Extraction Tool',
    description: 'Extract audio from videos and download as MP3. Works with MP4, MOV, WebM files. Perfect for podcasts and music clips.',
    keywords: 'video to mp3, extract audio, convert video to audio, mp3 converter, audio extractor',
  },
  texttoimage: {
    title: 'Text to Image Creator | Free Online Generator',
    description: 'Create beautiful images from text. Customize fonts, colors, effects and download instantly. Perfect for social media graphics and quote images.',
    keywords: 'text to image, image generator, create images, text graphics, quote maker, social media graphics',
  },
};

export default function HomePage({ activeTool: routeTool }) {
  const [activeTool, setActiveTool] = useState(routeTool || 'shrink');
  const [uploadedImage, setUploadedImage] = useState(null);

  useEffect(() => {
    if (routeTool) setActiveTool(routeTool);
  }, [routeTool]);

  const scrollToTool = (toolKey) => {
    if (toolKey) setActiveTool(toolKey);
    setTimeout(() => {
      const el = document.getElementById('tool');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  // Get SEO meta for current tool or use default
  const currentSeo = SEO_META[routeTool] || SEO_META.default;

  return (
    <div className="min-h-screen bg-[#fafaf7]">
      <Helmet>
        <title>{currentSeo.title}</title>
        <meta name="description" content={currentSeo.description} />
        <meta name="keywords" content={currentSeo.keywords} />
        <meta property="og:title" content={currentSeo.title} />
        <meta property="og:description" content={currentSeo.description} />
        <meta property="og:url" content={`https://pixelshrinkstudio.com${routeTool ? '/' + routeTool : '/'}`} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={currentSeo.title} />
        <meta name="twitter:description" content={currentSeo.description} />
        <link rel="canonical" href={`https://pixelshrinkstudio.com${routeTool ? '/' + routeTool : '/'}`} />
      </Helmet>
      
      <Header onToolSelect={setActiveTool} />
      <main>
        {!routeTool && <HeroSection onGetStarted={() => scrollToTool(null)} />}
        {!routeTool && <ToolsShowcase onToolSelect={scrollToTool} />}
        {!routeTool && <MoustachifyShowcase onTryNow={scrollToTool} />}
        <ToolSection 
          activeTool={activeTool} 
          imageSrc={uploadedImage} 
          setUploadedImage={setUploadedImage} 
        />
        {!routeTool && (
          <>
            <FeaturesGrid />
            <InfoSections />
            <FAQSection />
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
