# Vercel 배포 가이드

## 배포 전 준비사항

### 1. 환경 변수 설정
Vercel 대시보드에서 다음 환경 변수를 설정해야 합니다:

- `GOOGLE_API_KEY` 또는 `GEMINI_API_KEY`: Google Generative AI API 키

### 2. 데이터베이스 파일
`manseryuk.db` 파일이 프로젝트에 포함되어 있어야 합니다. (이미 포함되어 있음)

## 배포 방법

### 방법 1: Vercel CLI 사용

1. Vercel CLI 설치 (아직 설치하지 않은 경우):
```bash
npm i -g vercel
```

2. Vercel 로그인:
```bash
vercel login
```

3. 프로젝트 배포:
```bash
vercel
```

4. 프로덕션 배포:
```bash
vercel --prod
```

### 방법 2: GitHub 연동

1. GitHub 레포지토리에 코드 푸시
2. [Vercel 대시보드](https://vercel.com) 접속
3. "New Project" 클릭
4. GitHub 레포지토리 선택
5. 환경 변수 설정:
   - `GOOGLE_API_KEY` 또는 `GEMINI_API_KEY` 추가
6. "Deploy" 클릭

## 주의사항

- `better-sqlite3`는 네이티브 모듈이므로 Vercel에서 빌드 시간이 다소 걸릴 수 있습니다.
- 데이터베이스 파일(`manseryuk.db`)은 읽기 전용으로 사용됩니다.
- 환경 변수는 Vercel 대시보드에서 설정해야 합니다.

## 배포 후 확인

배포가 완료되면 Vercel에서 제공하는 URL로 접속하여 다음을 확인하세요:

1. 메인 페이지 로드 확인
2. 사주 계산 기능 테스트
3. AI 상담 기능 테스트 (환경 변수 설정 필요)

