# Analytics 데이터 확인 가이드

## Shop 클릭 추적 확인 방법

### 1. Vercel Analytics에서 확인

**접속 경로:**
1. Vercel 대시보드 접속
2. 프로젝트 선택
3. **Analytics** 탭 클릭
4. **Events** 섹션 확인

**확인할 이벤트:**
- `shop_click` - Shop 버튼/메뉴 클릭 횟수

**데이터 확인:**
- 실시간: 현재 클릭 수
- 시간대별: 일/주/월별 클릭 추이
- 이벤트 상세: 클릭 시간, 사용자 정보

### 2. Google Analytics에서 확인

**접속 경로:**
1. https://analytics.google.com 접속
2. 속성 선택
3. **보고서** > **이벤트** 클릭
4. **이벤트 이름**에서 `click` 검색
5. **이벤트 레이블**에서 `shop_section` 필터링

**확인할 데이터:**
- **이벤트 이름**: `click`
- **이벤트 카테고리**: `navigation`
- **이벤트 레이블**: `shop_section`
- **이벤트 수**: 총 클릭 횟수
- **사용자 수**: Shop을 클릭한 고유 사용자 수

**상세 분석:**
- **이벤트** > **이벤트 상세**에서:
  - 시간대별 클릭 추이
  - 디바이스별 클릭 (모바일/데스크톱)
  - 지역별 클릭
  - 사용자 흐름 (어디서 Shop으로 이동했는지)

### 3. 모든 추적 이벤트 목록

| 이벤트 이름 | 카테고리 | 설명 | 확인 위치 |
|------------|---------|------|----------|
| `calculate_click` | `saju_calculation` | 사주 계산 버튼 클릭 | Vercel: `calculate_click`<br>GA: 이벤트 레이블 `calculate_button` |
| `calculate_complete` | `saju_calculation` | 사주 계산 완료 | Vercel: `calculate_complete`<br>GA: 이벤트 레이블 `calculation_success` |
| `analysis_complete` | `saju_analysis` | 분석 생성 완료 | Vercel: `analysis_complete`<br>GA: 이벤트 레이블 `analysis_generated` |
| `chat_message` | `chat` | 채팅 메시지 전송 | Vercel: `chat_message`<br>GA: 이벤트 레이블 `message_sent` |
| `explore_click` | `navigation` | Explore Saju 버튼 클릭 | Vercel: `explore_click`<br>GA: 이벤트 레이블 `explore_saju_button` |
| `shop_click` | `navigation` | Shop 버튼/메뉴 클릭 | Vercel: `shop_click`<br>GA: 이벤트 레이블 `shop_section` |

### 4. 실시간 모니터링

**Vercel Analytics:**
- 대시보드에서 실시간 이벤트 확인
- 최근 24시간 이벤트 추이

**Google Analytics:**
- **보고서** > **실시간** > **이벤트**
- 현재 발생 중인 이벤트 확인
- 지난 30분간의 이벤트

### 5. 유용한 리포트

**Google Analytics에서:**
1. **획득** > **개요**: 어디서 유입되었는지
2. **행동** > **사이트 콘텐츠**: 어떤 페이지를 많이 봤는지
3. **이벤트** > **이벤트 상세**: 각 이벤트별 상세 분석
4. **대상** > **사용자 속성**: 사용자 특성 분석

**Vercel Analytics에서:**
1. **Overview**: 전체 트래픽 개요
2. **Events**: 커스텀 이벤트 추적
3. **Performance**: 페이지 성능 지표

## 팁

- **데이터 수집 시간**: 이벤트 발생 후 몇 분 후에 데이터가 표시됩니다
- **필터링**: Google Analytics에서 날짜 범위, 디바이스, 지역 등으로 필터링 가능
- **비교**: 기간 비교 기능으로 전주/전월 대비 성장률 확인 가능

