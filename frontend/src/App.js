import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import { Toaster } from './components/ui/sonner';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          {/* Main home page */}
          <Route path="/" element={<HomePage />} />
          
          {/* Dedicated tool routes for better SEO */}
          <Route path="/shrink-image" element={<HomePage activeTool="shrink" />} />
          <Route path="/remove-background" element={<HomePage activeTool="removebg" />} />
          <Route path="/crop-image" element={<HomePage activeTool="crop" />} />
          <Route path="/image-filters" element={<HomePage activeTool="filters" />} />
          <Route path="/moustachify" element={<HomePage activeTool="moustachify" />} />
          <Route path="/pdf-to-word" element={<HomePage activeTool="pdf2word" />} />
          <Route path="/word-to-pdf" element={<HomePage activeTool="word2pdf" />} />
          <Route path="/compress-video" element={<HomePage activeTool="compressvideo" />} />
          <Route path="/video-to-mp3" element={<HomePage activeTool="video2mp3" />} />
          <Route path="/text-to-image" element={<HomePage activeTool="texttoimage" />} />
          {/* Fallback for any invalid routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster richColors position="bottom-right" />
    </div>
  );
}

export default App;
