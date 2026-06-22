import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import HeroSection from '../components/HeroSection';
import ToolsShowcase from '../components/ToolsShowcase';
import FeaturesGrid from '../components/FeaturesGrid';
import ToolSection from '../components/ToolSection';
import InfoSections from '../components/InfoSections';
import FAQSection from '../components/FAQSection';
import Footer from '../components/Footer';
import { Helmet } from 'react-helmet-async';

export default function HomePage({ activeTool: routeTool }) {
  const [activeTool, setActiveTool] = useState(routeTool || 'shrink');
  const [uploadedImage, setUploadedImage] = useState(null);

  useEffect(() => {
    if (routeTool) setActiveTool(routeTool);
  }, [routeTool]);

  const scrollToTool = (toolKey) => {
    if (toolKey) setActiveTool(toolKey);
    // Small delay allows React to commit the state update before scrolling
    setTimeout(() => {
      const el = document.getElementById('tool');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  return (
    <div className="min-h-screen bg-[#fafaf7]">
      <Helmet>
        <title>Free Online Image Filters & Photo Editor | PixelShrink Studio</title>
        <meta name="description" content="Apply professional photo filters and adjust brightness, contrast, and grayscale instantly in your browser." />
      </Helmet>
      
      <Header onToolSelect={setActiveTool} />
      <main>
        {!routeTool && <HeroSection onGetStarted={() => scrollToTool(null)} />}
        {!routeTool && <ToolsShowcase onToolSelect={scrollToTool} />}
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
