// 프로덕션 환경에서 안전한 로깅 유틸리티

const isDevelopment = process.env.NODE_ENV === 'development';

// 개발 환경에서만 상세 로그 출력
export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  error: (message: string, error?: any) => {
    if (isDevelopment) {
      console.error(message, error);
    } else {
      // 프로덕션: 최소한의 정보만 로깅
      console.error(message);
      // 에러 객체의 메시지만 로깅 (스택 트레이스 제외)
      if (error instanceof Error) {
        console.error('Error message:', error.message);
      }
    }
  },
  
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
};

// 클라이언트 사이드용 logger (브라우저 환경)
export const clientLogger = {
  error: (message: string, error?: any) => {
    // 클라이언트에서는 프로덕션에서도 최소한의 에러만 표시
    if (isDevelopment) {
      console.error(message, error);
    } else {
      // 프로덕션: 에러 메시지만 표시 (스택 트레이스 숨김)
      console.error(message);
    }
  },
  
  log: (...args: any[]) => {
    // 클라이언트 로그는 개발 환경에서만
    if (isDevelopment) {
      console.log(...args);
    }
  },
};

