// Analytics 유틸리티 함수

// Google Analytics 이벤트 추적
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Vercel Analytics 이벤트 추적
export const trackVercelEvent = (name: string, data?: Record<string, any>) => {
  if (typeof window !== 'undefined' && (window as any).va) {
    (window as any).va('track', name, data);
  }
};

// 페이지 뷰 추적
export const trackPageView = (url: string) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
      page_path: url,
    });
  }
};

// 주요 이벤트 추적 함수들
export const analytics = {
  // 사주 계산 버튼 클릭
  trackCalculateClick: () => {
    trackEvent('click', 'saju_calculation', 'calculate_button');
    trackVercelEvent('calculate_click');
  },
  
  // 사주 계산 완료
  trackCalculateComplete: () => {
    trackEvent('complete', 'saju_calculation', 'calculation_success');
    trackVercelEvent('calculate_complete');
  },
  
  // 분석 생성 완료
  trackAnalysisComplete: () => {
    trackEvent('complete', 'saju_analysis', 'analysis_generated');
    trackVercelEvent('analysis_complete');
  },
  
  // 채팅 메시지 전송
  trackChatMessage: (messageLength: number) => {
    trackEvent('send', 'chat', 'message_sent', messageLength);
    trackVercelEvent('chat_message', { length: messageLength });
  },
  
  // Explore Saju 버튼 클릭
  trackExploreClick: () => {
    trackEvent('click', 'navigation', 'explore_saju_button');
    trackVercelEvent('explore_click');
  },
  
  // Shop 섹션 클릭
  trackShopClick: () => {
    trackEvent('click', 'navigation', 'shop_section');
    trackVercelEvent('shop_click');
  },
};

