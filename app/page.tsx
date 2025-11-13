'use client';

import { useState, useRef, useEffect } from 'react';
import Navigation from './components/Navigation';
import HeroSection from './components/HeroSection';
import CalculatorForm from './components/CalculatorForm';
import ResultsSection from './components/ResultsSection';
import ShopSection from './components/ShopSection';
import Footer from './components/Footer';

export default function Home() {
  const [sajuData, setSajuData] = useState<any>(null);
  const [sajuAnalysis, setSajuAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCalculate = async (formData: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/manseryeok', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        let errorMessage = `Server error: ${response.status} ${response.statusText}`;
        try {
          const errorText = await response.text();
          // HTML 에러 페이지인 경우
          if (errorText.includes('<!DOCTYPE') || errorText.includes('<html')) {
            errorMessage = `Express 서버가 실행되지 않았거나 연결할 수 없습니다. 포트 3001에서 서버가 실행 중인지 확인하세요.`;
          } else {
            errorMessage = errorText || errorMessage;
          }
        } catch (e) {
          // 텍스트 파싱 실패 시 기본 메시지 사용
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (result.success) {
        setSajuData(result.data);
        
        // 자동으로 분석 생성
        try {
          const analysisResponse = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sajuData: result.data,
            }),
          });

          if (analysisResponse.ok) {
            try {
              const analysisResult = await analysisResponse.json();
              if (analysisResult.success) {
                setSajuAnalysis(analysisResult.analysis);
              }
            } catch (e) {
              console.error('Failed to parse analysis response:', e);
            }
          }
        } catch (err) {
          console.error('Failed to generate analysis:', err);
        }
      } else {
        setError(result.error || 'Failed to calculate Saju');
      }
    } catch (err) {
      setError('Failed to connect to server. Please check if the server is running.');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="bg-background min-h-screen">
      <Navigation />
      <HeroSection />
      <div className="max-w-[1200px] mx-auto px-4 md:px-5 py-8 md:py-10 relative">
        {/* 좌우 장식 점선 */}
        <div className="absolute left-2 md:left-4 top-0 bottom-8 md:bottom-10">
          <div className="h-full flex flex-col">
            <div className="flex-1 border-dashed-custom self-center"></div>
            <div className="w-1 h-1 bg-primary rotate-45 self-center"></div>
          </div>
        </div>
        <div className="absolute right-2 md:right-4 top-0 bottom-8 md:bottom-10">
          <div className="h-full flex flex-col">
            <div className="flex-1 border-dashed-custom self-center"></div>
            <div className="w-1 h-1 bg-primary rotate-45 self-center"></div>
          </div>
        </div>
        {/* 하단 가로 점선 */}
        <div className="absolute left-2 md:left-4 right-2 md:right-4 bottom-8 md:bottom-10 flex items-center justify-center">
          <div className="flex items-center gap-2 max-w-[600px] w-full">
            <div className="w-1 h-1 bg-primary rotate-45"></div>
            <div className="flex-1 border-dashed-custom-horizontal"></div>
            <div className="w-1 h-1 bg-primary rotate-45"></div>
          </div>
        </div>
        <div className="card" id="saju">
          <div className="p-5 md:p-10">
            <CalculatorForm onSubmit={handleCalculate} isLoading={isLoading} error={error} />
            {sajuData && (
              <ResultsSection 
                sajuData={sajuData} 
                sajuAnalysis={sajuAnalysis}
                onAnalysisUpdate={setSajuAnalysis}
              />
            )}
          </div>
        </div>
      </div>
      <ShopSection />
      <Footer />
    </main>
  );
}

