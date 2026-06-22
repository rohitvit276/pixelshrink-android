import React from 'react';
import ShrinkPanel from './panels/ShrinkPanel';
import RemoveBgPanel from './panels/RemoveBgPanel';
import CropPanel from './panels/CropPanel';
import PdfToWordPanel from './panels/PdfToWordPanel';
import WordToPdfPanel from './panels/WordToPdfPanel';
import VideoCompressPanel from './panels/VideoCompressPanel';
import VideoToMp3Panel from './panels/VideoToMp3Panel';
import FilterPanel from './panels/FilterPanel'; // 1. Import the new panel

export default function ToolSection({ activeTool, onToolChange }) {
  
  // 2. Logic to render the panel based on activeTool
  const renderTool = () => {
    switch (activeTool) {
      case 'shrink':
        return <ShrinkPanel />;
      case 'removebg':
        return <RemoveBgPanel />;
      case 'crop':
        return <CropPanel />;
      case 'pdf2word':
        return <PdfToWordPanel />;
      case 'word2pdf':
        return <WordToPdfPanel />;
      case 'compressvideo':
        return <VideoCompressPanel />;
      case 'video2mp3':
        return <VideoToMp3Panel />;
      case 'filters':
        // 3. Add the case for the new Filter tool
        // Note: Replace 'imageSrc' with the state variable that holds your uploaded image
        return <FilterPanel imageSrc={null} />; 
      default:
        return <ShrinkPanel />;
    }
  };

  return (
    <section className="py-12 px-4 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
        {renderTool()}
      </div>
    </section>
  );
}
