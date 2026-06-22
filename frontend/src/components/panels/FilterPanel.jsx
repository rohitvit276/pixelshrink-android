import React, { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { Slider } from '../ui/slider';
import { Button } from '../ui/button';

export default function FilterPanel({ imageSrc, setUploadedImage }) {
  const [filters, setFilters] = useState({ brightness: 100, contrast: 100, grayscale: 0 });
  const imageRef = useRef(null);

  // Clean up the object URL when component unmounts
  useEffect(() => {
    return () => {
      if (imageSrc && imageSrc.startsWith('blob:')) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [imageSrc]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) setUploadedImage(URL.createObjectURL(file));
  };

  const handleDownload = async () => {
    if (imageRef.current) {
      // Small delay to ensure filters are applied before capture
      const canvas = await html2canvas(imageRef.current, { 
        backgroundColor: null, 
        useCORS: true, 
        logging: false 
      });
      const link = document.createElement('a');
      link.download = 'pixelshrink-filtered.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  if (!imageSrc) {
    return (
      <div className="p-10 text-center border-2 border-dashed rounded-lg">
        <input type="file" onChange={handleImageUpload} accept="image/*" className="mb-4" />
        <p>Upload an image to start filtering.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div ref={imageRef} className="relative w-fit">
        <img 
          src={imageSrc} 
          style={{ filter: `brightness(${filters.brightness}%) contrast(${filters.contrast}%) grayscale(${filters.grayscale}%)` }} 
          className="max-w-md" 
          alt="Filtered" 
        />
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Brightness ({filters.brightness}%)</label>
          <Slider value={[filters.brightness]} min={0} max={200} onValueChange={(v) => setFilters(prev => ({...prev, brightness: v[0]}))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Contrast ({filters.contrast}%)</label>
          <Slider value={[filters.contrast]} min={0} max={200} onValueChange={(v) => setFilters(prev => ({...prev, contrast: v[0]}))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Grayscale ({filters.grayscale}%)</label>
          <Slider value={[filters.grayscale]} min={0} max={100} onValueChange={(v) => setFilters(prev => ({...prev, grayscale: v[0]}))} />
        </div>
        <Button onClick={handleDownload} className="w-full mt-6">Download Filtered Image</Button>
      </div>
    </div>
  );
}
