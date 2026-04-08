# Wonder Car Design — 초등학생용 럭셔리 자동차 디자인 웹앱

## 1. 개요

초등학생들이 브라우저에서 실제 슈퍼 럭셔리 카를 기반으로 자동차를 커스터마이징하고, 갤러리에 공유하는 무료 3D 웹 애플리케이션.

### 핵심 가치
- 실제 럭셔리 브랜드(벤츠, 람보르기니, 부가티 등)의 외형을 재현
- 브랜드 베이스 모델 선택 + 파츠 단위 자유 조합 모두 지원
- 초등학생도 쉽게 사용할 수 있는 직관적 인터페이스
- 무료, 회원가입 불필요 (닉네임만으로 사용)

### 대상 사용자
- 초등학생 (개인 취미용, 향후 다수 사용자로 확장)

## 2. 기술 스택

| 계층 | 기술 | 이유 |
|------|------|------|
| 프론트엔드 프레임워크 | React | UI 구성, 컴포넌트 관리 |
| 3D 엔진 | react-three-fiber (Three.js) | WebGL 기반, React 통합, 커뮤니티 최대 |
| 백엔드 | Node.js + Express | REST API, 정적 파일 서빙 |
| 데이터베이스 | SQLite | 가볍고 별도 서버 불필요, Free Tier 적합 |
| 호스팅 | Oracle Cloud Free Tier (ARM 1코어, 1GB RAM) | 무료, VPS로 백엔드 운영 가능 |

### 클라이언트-서버 역할 분담
- **3D 렌더링**: 100% 클라이언트 (WebGL/GPU) — 서버 부담 제로
- **서버**: REST API (갤러리 CRUD) + 정적 파일 서빙 (React 빌드, 3D 모델, 썸네일)

## 3. 아키텍처

```
┌─────────────────────────────────────────────┐
│              사용자 브라우저                    │
│  ┌─────────────────────────────────────────┐ │
│  │   React App (react-three-fiber)         │ │
│  │  ┌──────────┐  ┌──────────┐  ┌───────┐ │ │
│  │  │ 3D 뷰어  │  │ 파츠 패널 │  │ 갤러리 │ │ │
│  │  │ (WebGL)  │  │  (UI)    │  │ (UI)  │ │ │
│  │  └──────────┘  └──────────┘  └───────┘ │ │
│  └─────────────────────────────────────────┘ │
└──────────────────┬──────────────────────────┘
                   │ REST API
┌──────────────────▼──────────────────────────┐
│         Oracle Cloud Free Tier VPS           │
│  ┌──────────────┐  ┌─────────────────────┐  │
│  │ Node.js +    │  │ SQLite DB           │  │
│  │ Express API  │  │ - designs           │  │
│  │              │  │ - likes             │  │
│  │ Static Files │  │                     │  │
│  │ (React 빌드) │  │ /uploads (이미지)    │  │
│  └──────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────┘
```

## 4. 페이지 구성 및 사용자 흐름

```
[랜딩 페이지] → [닉네임 입력] → [디자인 스튜디오]
                                      │
                                 ┌────┴────┐
                                 │         │
                            [저장/공유]  [갤러리]
                                 │         │
                                 └────┬────┘
                                      │
                              [디자인 상세보기]
                              (3D 뷰 + 좋아요)
```

### 4.1 랜딩 페이지
- 럭셔리 쇼룸 느낌: 어두운 배경 + 회전하는 쇼카
- "나만의 드림카를 디자인하세요" CTA 버튼
- 최근 인기 디자인 미리보기

### 4.2 닉네임 입력
- 간단한 모달 — 닉네임만 입력하면 바로 시작
- 로컬 스토리지에 저장해서 재방문 시 자동 인식

### 4.3 디자인 스튜디오 (3패널 레이아웃)

**데스크톱:**
```
┌──────────┬─────────────────────┬──────────┐
│ 브랜드    │                     │ 파츠     │
│ 선택     │     3D 캔버스        │ 카테고리  │
│          │   360° 회전/확대     │          │
│ 베이스    │                     │ 옵션     │
│ 모델     │  [Undo][Redo][Save] │ 그리드    │
└──────────┴─────────────────────┴──────────┘
  (좌 200px)    (중앙 flex)       (우 220px)
```

- 좌측 패널: 브랜드 목록 → 브랜드 클릭 시 베이스 모델 목록 표시
- 중앙: 3D 캔버스 (마우스 드래그로 360° 회전, 스크롤로 확대/축소)
- 우측 패널: 파츠 카테고리 탭 → 옵션 그리드
- 하단 바: Undo/Redo, 스크린샷 저장, 갤러리 공유

**모바일 (반응형):**
- 상단 바: 햄버거 메뉴(브랜드 선택), 로고, 공유 버튼
- 중앙: 3D 캔버스 (터치 회전, 핀치 확대/축소)
- 하단 시트(bottom sheet): 위로 스와이프하여 파츠 카테고리/옵션 표시

### 4.4 갤러리
- 카드 그리드 레이아웃 (썸네일 + 닉네임 + 좋아요 수)
- 정렬: 최신순 / 인기순
- 클릭 → 디자인 상세보기
- 모바일: 1열 카드 레이아웃

### 4.5 디자인 상세보기
- 해당 디자인을 3D로 돌려볼 수 있음 (parts_config 기반 재로드)
- 좋아요 버튼
- 사용된 파츠 정보 표시

## 5. 3D 디자인 시스템

### 5.1 인터랙션
- 마우스/터치: 360° 회전
- 스크롤/핀치: 확대/축소
- 파츠 선택 시: 해당 파츠 하이라이트 + 교체 애니메이션

### 5.2 렌더링
- 럭셔리 쇼룸 조명: 3점 조명 (key, fill, rim) + 환경 맵
- 어두운 배경 + 차량 강조 조명
- PBR(Physically Based Rendering) 머티리얼

### 5.3 파츠 커스터마이징

| 카테고리 | 적용 방식 |
|---------|----------|
| 차체(Body) | 베이스 모델 전체 교체 (.glb) |
| 바퀴(Wheels) | 메시 교체 (.glb) |
| 스포일러(Spoiler) | 메시 교체/제거 (.glb) |
| 그릴(Grille) | 메시 교체 (.glb) |
| 헤드라이트(Headlights) | 메시 교체 (.glb) |
| 범퍼(Bumper) | 메시 교체 (.glb) |
| 색상(Color) | 컬러 피커 + 프리셋, 머티리얼 색상 변경 |
| 마감(Finish) | Glossy/Matte/Metallic/Carbon Fiber, 머티리얼 roughness/metalness 변경 |

### 5.4 스크린샷 저장
- Three.js WebGLRenderer의 `toDataURL('image/png')`로 캔버스 캡처
- 캡처된 이미지를 서버에 POST → `/uploads/` 디렉토리에 저장
- 갤러리 썸네일로 사용

### 5.5 3D 모델 확보 전략
- 무료 3D 모델: Sketchfab 등에서 무료 라이선스 모델 확보
- AI 생성 + 수동 제작: 기본 형태를 AI 도구로 생성하여 보충
- 못 찾는 차량은 비슷한 스타일의 모델로 대체 가능

## 6. 차량 라인업 (30대, 13개 브랜드)

| 브랜드 | 모델 1 | 모델 2 | 모델 3 |
|--------|--------|--------|--------|
| Lamborghini | Aventador | Urus | Huracán |
| Mercedes-Benz | S-Class | AMG GT | G-Wagon |
| Mercedes-Maybach | S 680 | GLS 600 | - |
| Bugatti | Chiron | Veyron | - |
| Rolls-Royce | Phantom | Cullinan | - |
| Jaguar | F-Type | XJ | - |
| Ferrari | 488 | SF90 | LaFerrari |
| Porsche | 911 | Taycan | Cayenne |
| McLaren | 720S | P1 | - |
| BMW | M8 | X7 | i7 |
| Land Rover | Range Rover | Defender | - |
| Aston Martin | DB11 | Vantage | - |
| Tesla | Cybertruck | Model S | Roadster |

## 7. 데이터 모델

### designs 테이블
```sql
CREATE TABLE designs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  nickname    TEXT NOT NULL,
  title       TEXT NOT NULL,
  brand       TEXT NOT NULL,
  base_model  TEXT NOT NULL,
  parts_config TEXT NOT NULL,  -- JSON
  thumbnail   TEXT NOT NULL,   -- 이미지 파일 경로
  likes_count INTEGER DEFAULT 0,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### likes 테이블
```sql
CREATE TABLE likes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  design_id   INTEGER NOT NULL REFERENCES designs(id),
  nickname    TEXT NOT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(design_id, nickname)
);
```

### parts_config JSON 구조
```json
{
  "wheels": "sport-22",
  "spoiler": "gt-wing",
  "grille": "mesh-chrome",
  "headlights": "led-slim",
  "color": "#1a1a2e",
  "finish": "metallic",
  "bumper": "aggressive-01"
}
```

## 8. API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /api/designs | 갤러리 목록 (최신순/인기순, 페이지네이션) |
| GET | /api/designs/:id | 디자인 상세 (parts_config 포함) |
| POST | /api/designs | 새 디자인 저장 |
| POST | /api/designs/:id/like | 좋아요 토글 (닉네임 기반 중복 방지) |
| GET | /api/models | 브랜드/베이스 모델 목록 |
| GET | /api/parts/:category | 카테고리별 파츠 목록 |

### 정적 파일
```
/                → React SPA
/models/*.glb    → 3D 모델 파일
/uploads/*.png   → 갤러리 썸네일
```

## 9. UI 테마

- **럭셔리 쇼룸 콘셉트**: 어두운 배경, 메탈릭 톤, 고급스러운 분위기
- 주요 색상: 블랙(#0a0a0a) 배경, 골드(#c9a84c) 강조, 화이트/그레이 텍스트
- 3D 뷰어: 어두운 환경 + 차량 강조 3점 조명
- 타이포그래피: 고급스러운 산세리프 폰트

## 10. 반응형 디자인

### 브레이크포인트
- 데스크톱: 1024px 이상 — 3패널 레이아웃
- 태블릿: 768px~1023px — 좌측 패널 접기, 2패널
- 모바일: 767px 이하 — 전체 화면 3D + 하단 시트

### 모바일 터치 제스처
- 한 손가락 드래그: 3D 회전
- 두 손가락 핀치: 확대/축소
- 하단 시트 스와이프: 파츠 패널 열기/닫기

## 11. 사용자 인증

- 회원가입 없음
- 닉네임만 입력하면 바로 사용 가능
- 닉네임은 로컬 스토리지에 저장 (재방문 시 자동 인식)
- 좋아요 중복 방지: 닉네임 + 디자인 ID 조합으로 UNIQUE 제약

## 12. 배포 환경

### Oracle Cloud Free Tier
- ARM 1코어, 1GB RAM
- Node.js + Express + SQLite 운영
- Let's Encrypt로 HTTPS 설정
- Nginx 리버스 프록시

### 로컬 개발
- `npm run dev` — React dev server (Vite) + Express API 동시 실행
- 로컬 PC에서 먼저 테스트 후 VPS 배포
