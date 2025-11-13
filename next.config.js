/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Next.js 14에서는 API 라우트가 App Router를 사용하므로
  // 요청 크기 제한은 middleware에서 처리합니다.
};

module.exports = nextConfig;

