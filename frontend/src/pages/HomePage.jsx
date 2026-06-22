import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import ToolSection from '../components/ToolSection';
import InfoSections from '../components/InfoSections';
import FAQSection from '../components/FAQSection';
import Footer from '../components/Footer';

export default function HomePage({ activeTool: routeTool }) {
  // Initialize state from prop, fallback to 'shrink'
  const [activeTool, setActiveTool] = useState(routeTool || 'shrink');

  // Update state if the route changes
  useEffect(() => {
    if (routeTool) {
      setActiveTool(routeTool);
    }
  }, [routeTool]);

  return (
    <div className="min-h-screen bg-[#fafaf7]">
      <Header onToolSelect={setActiveTool} />
      <main>
        <ToolSection activeTool={activeTool} onToolChange={setActiveTool} />
        {/* Only show landing page content if no specific tool is active */}
        {!routeTool && (
          <>
            <InfoSections />
            <FAQSection />
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
