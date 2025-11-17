# Analytics 설정 가이드

이 프로젝트는 사용자 행동 추적을 위해 **Vercel Analytics**와 **Google Analytics**를 사용합니다.

## 📊 추적되는 데이터

### 자동 추적
- **페이지 뷰**: 모든 페이지 방문 자동 추적
- **사용자 세션**: 방문 시간, 이탈률 등
- **성능 지표**: 페이지 로딩 속도, Core Web Vitals

### 커스텀 이벤트
- **사주 계산 버튼 클릭**: `calculate_click`
- **사주 계산 완료**: `calculate_complete`
- **분석 생성 완료**: `analysis_complete`
- **채팅 메시지 전송**: `chat_message` (메시지 길이 포함)
- **Explore Saju 버튼 클릭**: `explore_click`

## 🚀 설정 방법

### 1. Vercel Analytics (자동 활성화)

Vercel에 배포하면 자동으로 활성화됩니다. 별도 설정이 필요 없습니다.

**확인 방법:**
- Vercel 대시보드 > 프로젝트 > Analytics 탭
- 실시간 방문자, 페이지 뷰, 이벤트 등을 확인할 수 있습니다.

### 2. Google Analytics (선택사항)

더 상세한 분석이 필요하면 Google Analytics를 추가할 수 있습니다.

**설정 방법:**

1. [Google Analytics](https://analytics.google.com/)에서 계정 생성
2. 속성(Property) 생성 후 측정 ID(Measurement ID) 확인 (예: `G-XXXXXXXXXX`)
3. Vercel 대시보드에서 환경 변수 추가:
   - **Key**: `NEXT_PUBLIC_GA_ID`
   - **Value**: 측정 ID (예: `G-XXXXXXXXXX`)
4. 배포 후 자동으로 활성화됩니다.

**확인 방법:**
- Google Analytics 대시보드에서 실시간 데이터 확인
- 이벤트는 "이벤트" 섹션에서 확인 가능

## 📈 데이터 확인

### Vercel Analytics
- **대시보드**: Vercel 프로젝트 > Analytics
- **실시간**: 현재 방문자 수
- **이벤트**: 커스텀 이벤트 추적
- **성능**: 페이지 속도, Core Web Vitals

### Google Analytics
- **대시보드**: analytics.google.com
- **실시간**: 실시간 사용자
- **이벤트**: 이벤트 > 모든 이벤트
- **유입 경로**: 획득 > 개요
- **사용자 행동**: 행동 > 사이트 콘텐츠

## 🎯 주요 지표

### 사용자 행동
- **방문자 수**: 일일/주간/월간 방문자
- **세션 수**: 사용자 세션 수
- **이탈률**: 한 페이지만 보고 나간 비율
- **평균 세션 시간**: 사용자가 사이트에 머문 시간

### 전환 지표
- **사주 계산 완료율**: 계산 시작 대비 완료 비율
- **분석 생성 완료율**: 계산 완료 대비 분석 생성 비율
- **채팅 사용률**: 분석을 본 사용자 중 채팅 사용 비율

### 유입 경로
- **직접 방문**: URL 직접 입력 또는 북마크
- **검색 엔진**: Google, Naver 등 검색 결과
- **소셜 미디어**: Reddit, Twitter 등 공유 링크
- **기타 웹사이트**: 외부 링크 클릭

## 🔧 커스텀 이벤트 추가

새로운 이벤트를 추적하려면 `app/utils/analytics.ts`에 함수를 추가하세요:

```typescript
// analytics.ts에 추가
trackNewEvent: () => {
  trackEvent('click', 'category', 'label');
  trackVercelEvent('event_name');
},

// 컴포넌트에서 사용
import { analytics } from '../utils/analytics';
analytics.trackNewEvent();
```

## 📝 참고사항

- **개인정보 보호**: IP 주소는 익명화되어 저장됩니다.
- **GDPR 준수**: EU 사용자 데이터는 GDPR을 준수합니다.
- **성능 영향**: Analytics는 비동기로 로드되어 페이지 성능에 영향을 주지 않습니다.

