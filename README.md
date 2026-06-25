# Mint Crossing 🟢

로우폴리 아이소메트릭 **길건너기** 캐주얼 게임 — React + three.js.
[Claude Design 레퍼런스](design-reference/)의 다크 네이비 + 민트 디자인을 그대로 옮겨 구현했다.

큐브 캐릭터를 위로 한 칸씩 전진시키며 차를 피하고 통나무를 타고 강을 건넌다.
전진 거리가 곧 점수. 충돌하면 게임오버.

## 실행

```bash
npm install
npm run dev      # http://localhost:5180  (host:true → 같은 와이파이의 휴대폰에서도 접속)
```

> 포트는 5173 충돌을 피해 **5180**으로 설정(`vite.config.ts`). 휴대폰 테스트는
> 터미널에 찍히는 `Network: http://192.168.x.x:5180/` 주소를 모바일 브라우저에 입력.

## 조작

| | 키보드 | 모바일 |
|---|---|---|
| 전진 | ↑ / W | 위로 스와이프 · 화면 탭 · ▲ |
| 후진 | ↓ / S | 아래로 스와이프 · ▼ |
| 좌/우 | ← → / A D | 좌우 스와이프 · ◀ ▶ |

## 스크립트

```bash
npm run dev        # 개발 서버
npm run build      # 타입체크 + 프로덕션 빌드
npm run preview    # 빌드 결과 미리보기
npm run typecheck  # 타입 검사만
npm run lint       # ESLint
```

## 구조

```
src/
  game/
    engine.ts      # three.js 씬·게임 루프·차선/차량/충돌/카메라 (프레임워크 무관 순수 TS)
    constants.ts   # 게임 밸런싱 상수 (속도·확률·카메라)
    types.ts       # 공용 타입 + 엔진→React 콜백
  components/       # StartScreen / HUD / DPad / GameOverScreen
  hooks/
    useGameEngine.ts  # 엔진 인스턴스 ↔ React 상태 동기화 + 키보드 입력
  theme.ts         # 디자인 토큰(색·라운드·폰트) SSOT
  styles.css / ui.css
docs/FEATURES.md   # 향후 기능 로드맵(우선순위)
design-reference/  # 원본 디자인 내보내기(레퍼런스 전용)
```

엔진과 React는 **콜백 경계**로만 연결된다(`EngineCallbacks`). 엔진이 점수·코인·상태·게임오버를
보고하면 훅이 React 상태로 올린다. 덕분에 게임 로직은 UI 프레임워크에 의존하지 않는다.

## 라이선스·출처

- 3D 에셋은 전부 코드 생성(외부 모델/텍스처 없음).
- 폰트: [Pretendard](https://github.com/orioncactus/pretendard) (SIL OFL 1.1).
- 디자인 토큰·레이아웃 출처: `design-reference/`.
