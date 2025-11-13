# Five Flows

> Traditional Saju analysis based on the Five Elements for wellness and balance.

## 👥 Team Members

### 🚀 **연우 (Yeonwoo)**
* **역할**: 전체 개발 (Fullstack Developer)
* **담당**:  
   * 프론트엔드 & 백엔드 통합 개발  
   * 전체 시스템 아키텍처 설계  
   * 풀스택 기능 구현

### ⚙️ **서현 (Seohyeon)**
* **역할**: 통합, CI/CD, 백엔드 개발
* **담당**:  
   * CI/CD 파이프라인 구축 및 관리  
   * 백엔드 API 개발  
   * 시스템 통합 및 배포

### 🎨 **채연 (Chayeon)**
* **역할**: 디자인 & 프론트엔드 UI
* **담당**:  
   * UI/UX 디자인  
   * 프론트엔드 개발  
   * 사용자 인터페이스 구현

## Tech Stack

### Frontend
- **Next.js 14** - React 프레임워크
- **Tailwind CSS** - 유틸리티 기반 CSS 프레임워크
- **TypeScript** - 타입 안정성

### Backend
- **Express.js** - Node.js 웹 프레임워크
- **Better-SQLite3** - SQLite 데이터베이스
- **OpenAI API** - AI 분석 기능

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/seo1120/Startup.git
cd Startup
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp env.example .env
# Edit .env and add your OPENAI_API_KEY
```

4. Run the development servers

**Terminal 1 - Express API Server:**
```bash
npm run server
# Server runs on http://localhost:3001
```

**Terminal 2 - Next.js Frontend:**
```bash
npm run dev
# Frontend runs on http://localhost:3000
```

### Build for Production

```bash
# Build Next.js app
npm run build

# Start production server
npm start
```

## Project Structure

```
FiveFlows2/
├── app/                    # Next.js App Router
│   ├── components/         # React components
│   ├── globals.css        # Global styles with Tailwind
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── server.js              # Express API server
├── manseryuk.db          # SQLite database
├── next.config.js        # Next.js configuration
├── tailwind.config.js    # Tailwind CSS configuration
└── package.json          # Dependencies
```

## API Endpoints

- `POST /api/geocode` - Location to timezone conversion
- `POST /api/manseryeok` - Calculate Four Pillars of Destiny
- `POST /api/analyze` - Generate Saju analysis
- `POST /api/chat` - AI consultation chat

## Deployment

The project is configured for Vercel deployment. See `DEPLOY.md` for detailed deployment instructions.

## License

ISC
