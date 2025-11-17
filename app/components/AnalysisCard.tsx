'use client';

import { useState, useEffect } from 'react';

interface AnalysisCardProps {
  analysis: string | null;
  analysisData?: any;
  userName?: string;
}

// 마크다운 볼드 표시 제거 함수
const removeMarkdownBold = (text: string): string => {
  if (!text) return '';
  // **text** 형식을 text로 변환
  return text.replace(/\*\*(.*?)\*\*/g, '$1');
};

const AnalysisCard = ({ analysis, analysisData, userName }: AnalysisCardProps) => {
  const displayTitle = userName 
    ? `${userName}'s Saju Analysis`
    : 'Saju Analysis';

  // 로딩 메시지 배열
  const loadingMessages = [
    userName ? `Analyzing ${userName}'s Saju...` : 'Analyzing your Saju...',
    'Balancing the five elements...',
    'Almost there, please wait a moment...'
  ];

  const [currentLoadingMessageIndex, setCurrentLoadingMessageIndex] = useState(0);

  // 로딩 중일 때 메시지를 순환
  useEffect(() => {
    if (!analysis || !analysisData) {
      const interval = setInterval(() => {
        setCurrentLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 2000); // 2초마다 메시지 변경

      return () => clearInterval(interval);
    }
  }, [analysis, analysisData, loadingMessages.length]);

  if (!analysis || !analysisData) {
    return (
      <div className="bg-background p-6 md:p-8 rounded-design">
        <h3 className="mb-4 md:mb-6 text-gloock-base font-gloock text-primary">{displayTitle}</h3>
        <div className="leading-[1.8] text-afacad-sm-light font-afacad text-primary">
          <p className="text-center">
            {loadingMessages[currentLoadingMessageIndex]}
          </p>
        </div>
      </div>
    );
  }

  // 카드 스타일
  const cardStyle = "bg-white p-5 md:p-6 rounded-design border border-primary/10 shadow-sm";

  return (
    <div className="space-y-6 md:space-y-8">
      <h3 className="text-gloock-base font-gloock text-primary text-center mb-6 md:mb-8">
        {displayTitle}
      </h3>

      {/* Core Hook Card */}
      {analysisData.coreHook && (
        <div className={cardStyle}>
          <h4 className="text-gloock-sm font-gloock text-primary mb-3 md:mb-4">
            Core Energy
          </h4>
          <p className="text-afacad-base font-afacad text-primary leading-relaxed">
            {removeMarkdownBold(analysisData.coreHook)}
          </p>
        </div>
      )}

      {/* Top Card (UI Highlight) */}
      {analysisData.uiHighlights?.topCard && (
        <div className={`${cardStyle} bg-primary/5`}>
          <h4 className="text-gloock-sm font-gloock text-primary mb-2">
            {analysisData.uiHighlights.topCard.title}
          </h4>
          <p className="text-afacad-sm-light font-afacad text-primary/80">
            {analysisData.uiHighlights.topCard.subtext}
          </p>
        </div>
      )}

      {/* Precision Insights Card */}
      {analysisData.precisionInsights && analysisData.precisionInsights.length > 0 && (
        <div className={cardStyle}>
          <h4 className="text-gloock-sm font-gloock text-primary mb-3 md:mb-4">
            Precision Insights
          </h4>
          <ul className="space-y-2 md:space-y-3">
            {analysisData.precisionInsights.map((insight: string, index: number) => (
              <li key={index} className="text-afacad-sm-light font-afacad text-primary leading-relaxed flex items-start">
                <span className="text-primary mr-2 mt-1">•</span>
                <span>{removeMarkdownBold(insight)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Energy Summary Card */}
      {analysisData.energySummary && (
        <div className={cardStyle}>
          <h4 className="text-gloock-sm font-gloock text-primary mb-3 md:mb-4">
            Energy Summary
          </h4>
          <p className="text-afacad-sm-light font-afacad text-primary leading-relaxed">
            {removeMarkdownBold(analysisData.energySummary)}
          </p>
        </div>
      )}

      {/* Element Balance Card - Overall Balance만 표시 */}
      {analysisData.elementBalance?.overallBalance && (
        <div className={cardStyle}>
          <h4 className="text-gloock-sm font-gloock text-primary mb-3 md:mb-4">
            Element Balance
          </h4>
          <p className="text-afacad-sm-light font-afacad text-primary leading-relaxed">
            {removeMarkdownBold(analysisData.elementBalance.overallBalance)}
          </p>
        </div>
      )}

      {/* Life Domains Card */}
      {analysisData.lifeDomains && (
        <div className={cardStyle}>
          <h4 className="text-gloock-sm font-gloock text-primary mb-3 md:mb-4">
            Life Domains
          </h4>
          <div className="space-y-4 md:space-y-5">
            {analysisData.lifeDomains.foundation && (
              <div>
                <h5 className="text-afacad-base font-afacad text-primary font-semibold mb-2">
                  Foundation (Year Pillar)
                </h5>
                <p className="text-afacad-sm-light font-afacad text-primary/90 leading-relaxed">
                  {removeMarkdownBold(analysisData.lifeDomains.foundation)}
                </p>
              </div>
            )}
            {analysisData.lifeDomains.socialFlow && (
              <div>
                <h5 className="text-afacad-base font-afacad text-primary font-semibold mb-2">
                  Social Flow (Month Pillar)
                </h5>
                <p className="text-afacad-sm-light font-afacad text-primary/90 leading-relaxed">
                  {removeMarkdownBold(analysisData.lifeDomains.socialFlow)}
                </p>
              </div>
            )}
            {analysisData.lifeDomains.coreSelf && (
              <div>
                <h5 className="text-afacad-base font-afacad text-primary font-semibold mb-2">
                  Core Self (Day Pillar)
                </h5>
                <p className="text-afacad-sm-light font-afacad text-primary/90 leading-relaxed">
                  {removeMarkdownBold(analysisData.lifeDomains.coreSelf)}
                </p>
              </div>
            )}
            {analysisData.lifeDomains.innerWorld && (
              <div>
                <h5 className="text-afacad-base font-afacad text-primary font-semibold mb-2">
                  Inner World (Hour Pillar)
                </h5>
                <p className="text-afacad-sm-light font-afacad text-primary/90 leading-relaxed">
                  {removeMarkdownBold(analysisData.lifeDomains.innerWorld)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Strengths Card */}
      {analysisData.strengths && analysisData.strengths.length > 0 && (
        <div className={cardStyle}>
          <h4 className="text-gloock-sm font-gloock text-primary mb-3 md:mb-4">
            Your Natural Strengths
          </h4>
          <ul className="space-y-2 md:space-y-3">
            {analysisData.strengths.map((strength: string, index: number) => (
              <li key={index} className="text-afacad-sm-light font-afacad text-primary leading-relaxed flex items-start">
                <span className="text-primary mr-2 mt-1">•</span>
                <span>{removeMarkdownBold(strength)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Growth Opportunities Card (약점 포함) */}
      {analysisData.growthOpportunities && analysisData.growthOpportunities.length > 0 && (
        <div className={cardStyle}>
          <h4 className="text-gloock-sm font-gloock text-primary mb-3 md:mb-4">
            Growth Opportunities
          </h4>
          <ul className="space-y-2 md:space-y-3">
            {analysisData.growthOpportunities.map((opportunity: string, index: number) => (
              <li key={index} className="text-afacad-sm-light font-afacad text-primary leading-relaxed flex items-start">
                <span className="text-primary mr-2 mt-1">•</span>
                <span>{removeMarkdownBold(opportunity)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Flow Guidance Card */}
      {analysisData.flowGuidance && (
        <div className={cardStyle}>
          <h4 className="text-gloock-sm font-gloock text-primary mb-3 md:mb-4">
            Flow Guidance
          </h4>
          <div className="space-y-4 md:space-y-5">
            {analysisData.flowGuidance.currentEnergy && (
              <div>
                <h5 className="text-afacad-base font-afacad text-primary font-semibold mb-2">
                  Current Energy
                </h5>
                <p className="text-afacad-sm-light font-afacad text-primary/90 leading-relaxed">
                  {removeMarkdownBold(analysisData.flowGuidance.currentEnergy)}
                </p>
              </div>
            )}
            {analysisData.flowGuidance.upcomingInfluence && (
              <div>
                <h5 className="text-afacad-base font-afacad text-primary font-semibold mb-2">
                  Upcoming Influence
                </h5>
                <p className="text-afacad-sm-light font-afacad text-primary/90 leading-relaxed">
                  {removeMarkdownBold(analysisData.flowGuidance.upcomingInfluence)}
                </p>
              </div>
            )}
            {analysisData.flowGuidance.supportiveActions && analysisData.flowGuidance.supportiveActions.length > 0 && (
              <div>
                <h5 className="text-afacad-base font-afacad text-primary font-semibold mb-2">
                  Supportive Actions
                </h5>
                <ul className="space-y-2">
                  {analysisData.flowGuidance.supportiveActions.map((action: string, index: number) => (
                    <li key={index} className="text-afacad-sm-light font-afacad text-primary/90 leading-relaxed flex items-start">
                      <span className="text-primary mr-2 mt-1">•</span>
                      <span>{removeMarkdownBold(action)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {analysisData.flowGuidance.cautions && analysisData.flowGuidance.cautions.length > 0 && (
              <div>
                <h5 className="text-afacad-base font-afacad text-primary font-semibold mb-2">
                  Cautions
                </h5>
                <ul className="space-y-2">
                  {analysisData.flowGuidance.cautions.map((caution: string, index: number) => (
                    <li key={index} className="text-afacad-sm-light font-afacad text-primary/90 leading-relaxed flex items-start">
                      <span className="text-primary mr-2 mt-1">•</span>
                      <span>{removeMarkdownBold(caution)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Long Form Narrative Card */}
      {analysisData.longFormNarrative && (
        <div className={`${cardStyle} bg-primary/5`}>
          <h4 className="text-gloock-sm font-gloock text-primary mb-3 md:mb-4">
            Deep Insight
          </h4>
          <p className="text-afacad-sm-light font-afacad text-primary leading-relaxed whitespace-pre-line">
            {removeMarkdownBold(analysisData.longFormNarrative)}
          </p>
        </div>
      )}

      {/* Keywords Card */}
      {analysisData.keywords && analysisData.keywords.length > 0 && (
        <div className={cardStyle}>
          <h4 className="text-gloock-sm font-gloock text-primary mb-3 md:mb-4">
            Keywords
          </h4>
          <div className="flex flex-wrap gap-2 md:gap-3">
            {analysisData.keywords.map((keyword: string, index: number) => (
              <span 
                key={index}
                className="px-3 py-1.5 bg-primary/10 text-primary text-afacad-sm font-afacad rounded-design-sm"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisCard;
