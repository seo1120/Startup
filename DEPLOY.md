# Vercel 배포 가이드

## 배포 전 준비사항

### 1. 환경 변수 설정
Vercel 대시보드에서 다음 환경 변수를 설정해야 합니다:

- `OPENAI_API_KEY`: OpenAI API 키

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
   - `OPENAI_API_KEY` 추가
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

## 문제 해결

### DEPLOYMENT_NOT_FOUND 오류

이 오류가 발생하는 경우 다음을 확인하세요:

1. **배포 상태 확인**
   - Vercel 대시보드에서 배포가 성공적으로 완료되었는지 확인
   - 배포 로그에서 빌드 오류가 없는지 확인

2. **빌드 설정 확인**
   - `vercel.json` 파일이 프로젝트 루트에 있는지 확인
   - `next.config.js`에 webpack 설정이 올바르게 되어 있는지 확인

3. **네이티브 모듈 빌드**
   - `better-sqlite3`는 네이티브 모듈이므로 빌드 시간이 오래 걸릴 수 있습니다
   - 빌드 로그에서 컴파일 오류가 없는지 확인

4. **데이터베이스 파일**
   - `manseryuk.db` 파일이 프로젝트에 포함되어 있는지 확인
   - `.gitignore`에서 제외되지 않았는지 확인

5. **환경 변수**
   - 필요한 환경 변수가 모두 설정되어 있는지 확인
   - Vercel 대시보드 > Settings > Environment Variables에서 확인

### 빌드 실패 시

1. 로컬에서 빌드 테스트:
```bash
npm run build
```

2. Vercel CLI로 배포 테스트:
```bash
vercel --debug
```

3. 빌드 로그 확인:
   - Vercel 대시보드 > Deployments > 해당 배포 > Build Logs

