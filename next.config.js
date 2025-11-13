/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Next.js API 라우트를 사용하므로 프록시 제거
  // Express 서버는 선택적으로 사용 가능 (포트 3001)
};

module.exports = nextConfig;

