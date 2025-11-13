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
- **Next.js 14** - React 프레임워크 (App Router)
- **Tailwind CSS** - 유틸리티 기반 CSS 프레임워크
- **TypeScript** - 타입 안정성

### Backend
- **Next.js API Routes** - 서버리스 API 엔드포인트
- **Better-SQLite3** - SQLite 데이터베이스 (만세력 데이터)
- **OpenAI API** - AI 분석 및 상담 기능

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
# Create .env file
OPENAI_API_KEY=sk-your-openai-api-key-here
```

4. Run the development server
```bash
npm run dev
# Server runs on http://localhost:3000
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
fiveflows/
├── app/                    # Next.js App Router
│   ├── api/                # API Routes
│   │   ├── analyze/        # Saju analysis generation
│   │   ├── chat/           # AI consultation chat
│   │   ├── geocode/        # Location to timezone
│   │   └── manseryeok/     # Four Pillars calculation
│   ├── components/         # React components
│   │   ├── AnalysisCard.tsx
│   │   ├── CalculatorForm.tsx
│   │   ├── ChatSection.tsx
│   │   ├── FiveElementsChart.tsx
│   │   ├── FourPillarsDisplay.tsx
│   │   └── ...
│   ├── globals.css         # Global styles with Tailwind
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── middleware.ts           # Rate limiting & security headers
├── manseryuk.db           # SQLite database (만세력 데이터)
├── next.config.js          # Next.js configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── vercel.json             # Vercel deployment configuration
└── package.json            # Dependencies
```

## API Endpoints

All API endpoints are Next.js API Routes:

- `POST /api/geocode` - Location to timezone conversion
- `POST /api/manseryeok` - Calculate Four Pillars of Destiny (사주 계산)
- `POST /api/analyze` - Generate Saju analysis (사주 풀이 생성)
- `POST /api/chat` - AI consultation chat (AI 상담)

## Security Features

- **Rate Limiting**: 
  - General API: 100 requests per 15 minutes
  - AI endpoints: 20 requests per hour
- **Security Headers**: XSS, CSRF, clickjacking protection
- **Input Validation**: All user inputs are validated and sanitized
- **Error Handling**: Sensitive information is never exposed in error messages

## Deployment

The project is configured for Vercel deployment. See `DEPLOY.md` for detailed deployment instructions.

### Environment Variables

Set the following environment variables in Vercel:
- `OPENAI_API_KEY`: Your OpenAI API key

## License

ISC
