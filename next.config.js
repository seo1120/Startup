/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // SQLite 데이터베이스 파일을 public 디렉토리에서 제공하지 않도록 설정
  // 데이터베이스는 서버 사이드에서만 접근 가능
}

module.exports = nextConfig

