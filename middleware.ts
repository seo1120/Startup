import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rate limiting을 위한 간단한 메모리 기반 저장소
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Rate limit 설정
const RATE_LIMIT = {
  windowMs: 15 * 60 * 1000, // 15분
  maxRequests: 100, // 최대 100 요청
  aiWindowMs: 60 * 60 * 1000, // 1시간 (AI 엔드포인트)
  aiMaxRequests: 20, // 최대 20 요청 (AI 엔드포인트)
};

function getRateLimitKey(request: NextRequest): string {
  // IP 주소 기반 (Vercel에서는 x-forwarded-for 헤더 사용)
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : 
             request.headers.get('x-real-ip') || 
             'unknown';
  return ip;
}

function checkRateLimit(key: string, isAIEndpoint: boolean): boolean {
  const now = Date.now();
  const config = isAIEndpoint 
    ? { windowMs: RATE_LIMIT.aiWindowMs, maxRequests: RATE_LIMIT.aiMaxRequests }
    : { windowMs: RATE_LIMIT.windowMs, maxRequests: RATE_LIMIT.maxRequests };

  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    // 새 윈도우 시작
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return true;
  }

  if (record.count >= config.maxRequests) {
    return false; // Rate limit 초과
  }

  record.count++;
  return true;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 보안 헤더 추가
  const response = NextResponse.next();
  
  // 보안 헤더 설정
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'"
  );

  // API 라우트에만 rate limiting 적용
  if (pathname.startsWith('/api/')) {
    const isAIEndpoint = pathname.startsWith('/api/chat') || pathname.startsWith('/api/analyze');
    const key = getRateLimitKey(request);
    
    if (!checkRateLimit(key, isAIEndpoint)) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Too many requests. Please try again later.' 
        }),
        { 
          status: 429,
          headers: { 
            'Content-Type': 'application/json',
            'Retry-After': '900', // 15분
          }
        }
      );
    }
  }

  // 요청 크기 제한 (10MB)
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
    return new NextResponse(
      JSON.stringify({ error: 'Request too large.' }),
      { 
        status: 413,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
  ],
};

