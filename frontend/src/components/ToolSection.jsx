import React from 'react';
import ShrinkPanel from './panels/ShrinkPanel';
import RemoveBgPanel from './panels/RemoveBgPanel';
import CropPanel from './panels/CropPanel';
import PdfToWordPanel from './panels/PdfToWordPanel';
import WordToPdfPanel from './panels/WordToPdfPanel';
import VideoCompressPanel from './panels/VideoCompressPanel';
import VideoToMp3Panel from './panels/VideoToMp3Panel';
import FilterPanel from './panels/FilterPanel';

export default function ToolSection({ activeTool, imageSrc, setUploadedImage }) {
  const renderTool = () => {
    switch (activeTool) {
      case 'shrink': return <ShrinkPanel />;
      case 'removebg': return <RemoveBgPanel />;
      case 'crop': return <CropPanel />;
      case 'pdf2word': return <PdfToWordPanel />;
      case 'word2pdf': return <WordToPdfPanel />;
      case 'compressvideo': return <VideoCompressPanel />;
      case 'video2mp3': return <VideoToMp3Panel />;
      case 'filters': 
        return <FilterPanel imageSrc={imageSrc} setUploadedImage={setUploadedImage} />;
      default: return <ShrinkPanel />;
    }
  };

  return (
    <section id="tool" className="py-12 px-4 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
        {renderTool()}
      </div>
    </section>
  );
}
