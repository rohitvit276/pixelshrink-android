import React, { useState } from 'react';
import Header from '../components/Header';
import ToolSection from '../components/ToolSection';
import InfoSections from '../components/InfoSections';
import FAQSection from '../components/FAQSection';
import Footer from '../components/Footer';

export default function HomePage() {
  const [activeTool, setActiveTool] = useState('shrink'); // 'shrink' | 'removebg'

  return (
    <div className="min-h-screen bg-[#fafaf7]">
      <Header onToolSelect={setActiveTool} />
      <main>
        <ToolSection activeTool={activeTool} onToolChange={setActiveTool} />
        <InfoSections />
        <FAQSection />
      </main>
      <Footer />
    </div>
  );
}
