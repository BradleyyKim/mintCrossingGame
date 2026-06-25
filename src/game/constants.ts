/** 게임 튜닝 상수. 한 곳에 모아 밸런싱을 쉽게 한다. (단위: 타일 = 월드 1) */

export const TILE = 1

/** 좌우 플레이 가능한 열 범위: [-HALF_COLS, HALF_COLS] */
export const HALF_COLS = 4
/** 차량/통나무가 화면 밖에서 재활용되는 경계 */
export const EDGE = 7
/** 물 위에서 통나무에 실려 이 경계를 넘으면 추락 */
export const PLAY_EDGE = HALF_COLS + 0.6

/** 한 칸 점프 애니메이션 */
export const HOP_DURATION = 0.13
export const HOP_HEIGHT = 0.55

/** 시작 시 안전한 잔디 줄 수(0 ~ START_SAFE_ROWS-1) */
export const START_SAFE_ROWS = 4
/** 시작 지점 뒤로 채워두는 잔디 줄(빈 공간 방지) */
export const FILLER_BEHIND = 4
/** 플레이어 앞으로 미리 생성해 둘 줄 수 */
export const VISIBLE_AHEAD = 18
/** 플레이어 뒤로 이만큼 지난 줄은 제거 */
export const KEEP_BEHIND = 6

/** 차량/통나무 속도(타일/초). 난이도에 따라 가산 */
export const ROAD_BASE_SPEED = 2.1
export const WATER_BASE_SPEED = 1.5
export const SPEED_PER_ROW = 0.018
export const MAX_EXTRA_SPEED = 2.6

/** 충돌 판정용 플레이어 반폭 */
export const PLAYER_HALF = 0.4

/** 차량 색(테마 accent에서) */
export const CAR_COLORS = ['#07b4ff', '#ffc53d', '#0d67f7', '#fa27d1'] as const

/** 카메라: 아이소메트릭 오프셋 방향(대략 azimuth 45°, elevation ~56°) */
export const CAMERA_OFFSET: [number, number, number] = [10, 21, 10]
/** 직교 카메라 프러스텀 세로 높이(타일) */
export const FRUSTUM_TILES = 12
/** 카메라가 플레이어보다 이만큼 앞을 본다(플레이어를 화면 하단으로) */
export const LOOK_AHEAD = 2.6

/** 잔디 줄에 나무가 생길 확률(칸당) */
export const TREE_CHANCE = 0.18
/** 잔디 줄에 코인이 생길 확률(줄당) */
export const COIN_CHANCE = 0.45
