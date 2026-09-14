# QR 투표 웹앱 (Vercel + Upstash Redis)

## 무엇이 되나요?
- **프로젝터 화면**: `.../screen.html`
  - QR을 띄워두면 학생이 스마트폰으로 접속
  - 1/2 카운트가 실시간에 가깝게(폴링) 갱신
  - 많이 선택될수록 숫자 크기가 커져 상대 비교 가능
- **학생 투표 화면**: `.../vote.html`

## 필요한 것
- Vercel 계정
- GitHub(권장)
- Upstash Redis DB 1개

## 1) Upstash Redis 만들기
1. Upstash 가입 → Redis DB 생성
2. 다음 값 2개 복사
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

## 2) Vercel 환경변수 설정
Vercel 프로젝트 Settings → Environment Variables
- `UPSTASH_REDIS_REST_URL` = Upstash 값
- `UPSTASH_REDIS_REST_TOKEN` = Upstash 값
- (선택) `RESET_CODE` = 리셋 코드 (기본: `reset`)

설정 후 Redeploy.

## 3) 배포
### (권장) GitHub로 배포
1. 이 폴더를 GitHub repo로 올림
2. Vercel → New Project → Import Git Repository
3. Framework: Other, Build Command: 없음
4. Deploy

## 4) 사용
- 화면(프로젝터): `https://<도메인>/screen.html`
- 학생(투표): `https://<도메인>/vote.html`

## API
- `GET /api/state` → `{ ok, counts: {one, two} }`
- `POST /api/vote` body `{ choice: 1 | 2 }`
- `POST /api/reset` body `{ code: string }`

## 튜닝
- `public/screen.html`의 `intervalMs`(기본 1200ms)를 800~1500 사이에서 조절 가능

## 주의
- 동시 접속이 많아도 SSE/WebSocket처럼 연결을 유지하지 않아서 서버리스에 더 적합합니다.
