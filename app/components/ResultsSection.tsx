'use client';

import { useState, useEffect, useRef } from 'react';
import FourPillarsDisplay from './FourPillarsDisplay';
import FiveElementsChart from './FiveElementsChart';
import AnalysisCard from './AnalysisCard';
import ChatSection from './ChatSection';

interface ResultsSectionProps {
  sajuData: any;
  sajuAnalysis: string | null;
  onAnalysisUpdate: (analysis: string) => void;
}

const ResultsSection = ({ sajuData, sajuAnalysis, onAnalysisUpdate }: ResultsSectionProps) => {
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [sajuData]);

  return (
    <div ref={resultRef} className="mt-6 md:mt-10 animate-fadeIn space-y-6 md:space-y-8">
      <FourPillarsDisplay pillars={sajuData.pillars} />
      <FiveElementsChart elements={sajuData.fiveElements.elements} />
      <AnalysisCard analysis={sajuAnalysis} />
      <ChatSection sajuData={sajuData} sajuAnalysis={sajuAnalysis} onAnalysisUpdate={onAnalysisUpdate} />
    </div>
  );
};

export default ResultsSection;

