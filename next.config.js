/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Next.js 14에서는 API 라우트가 App Router를 사용하므로
  // 요청 크기 제한은 middleware에서 처리합니다.
  
  // better-sqlite3 네이티브 모듈을 위한 webpack 설정
  webpack: (config, { isServer }) => {
    if (isServer) {
      // 서버 사이드 빌드 시 better-sqlite3가 올바르게 번들링되도록 설정
      // Vercel의 서버리스 환경에서 네이티브 모듈이 정상 작동하도록 함
      config.resolve = config.resolve || {};
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;

