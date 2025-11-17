'use client';

import { useState, useEffect, useRef } from 'react';
import FourPillarsDisplay from './FourPillarsDisplay';
import FiveElementsChart from './FiveElementsChart';
import AnalysisCard from './AnalysisCard';
import ChatSection from './ChatSection';

interface ResultsSectionProps {
  sajuData: any;
  sajuAnalysis: string | null;
  sajuAnalysisData: any;
  onAnalysisUpdate: (analysis: string, analysisData?: any) => void;
}

const ResultsSection = ({ sajuData, sajuAnalysis, sajuAnalysisData, onAnalysisUpdate }: ResultsSectionProps) => {
  const resultRef = useRef<HTMLDivElement>(null);
  const userName = sajuData?.input?.name || '';

  useEffect(() => {
    if (resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [sajuData]);

  return (
    <div ref={resultRef} className="mt-6 md:mt-10 animate-fadeIn space-y-6 md:space-y-8">
      <FourPillarsDisplay pillars={sajuData.pillars} />
      <FiveElementsChart elements={sajuData.fiveElements.elements} />
      <AnalysisCard 
        analysis={sajuAnalysis} 
        analysisData={sajuAnalysisData}
        userName={userName} 
      />
      <ChatSection 
        sajuData={sajuData} 
        sajuAnalysis={sajuAnalysis} 
        onAnalysisUpdate={(analysis: string) => {
          // ChatSection에서 분석 업데이트 시 analysisData도 함께 업데이트
          try {
            const parsed = JSON.parse(analysis);
            onAnalysisUpdate(analysis, parsed);
          } catch {
            onAnalysisUpdate(analysis);
          }
        }} 
      />
    </div>
  );
};

export default ResultsSection;

