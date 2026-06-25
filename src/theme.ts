/**
 * Mint Crossing 디자인 토큰.
 * 출처: design-reference/Mint Crossing.dc.html 의 컬러 팔레트 / 타이포 / 라운드.
 * 이 파일이 색·간격의 단일 진실원천(SSOT)이다. 새 색을 하드코딩하지 말고 여기서 참조한다.
 */
export const colors = {
  // Surfaces (어두운 네이비 계열)
  bg: '#050b16',
  bg2: '#081427',
  surface: '#0e1e35',
  card: '#16233c',
  border: '#243349',
  border2: '#2c3d58',

  // Mint / Accent
  mint: '#07e696',
  mint2: '#1ce8a5',
  mintDark: '#06c281',
  cyan: '#07b4ff',
  blue: '#0d67f7',
  amber: '#ffc53d',
  pink: '#fa27d1',

  // Scene materials (three.js 큐브 색)
  grass: '#17a363',
  road: '#222f47',
  water: '#0f5ef0',
  waterRipple: '#1f7bff',
  log: '#7a4a24',
  logTop: '#8a5530',
  foliage: '#0e7a4e',
  trunk: '#6b4326',
  rock: '#3a4a63',
  laneDivider: '#5a6a84',

  // Text
  textHi: '#eaf1fb',
  textMid: '#8fa0b8',
  textLo: '#5a6a84',

  // 캐릭터(치킨 큐브)
  charBody: '#1ce8a5',
  charBeak: '#ffc53d',
  charComb: '#fa27d1',
} as const

/** 라운드(px). 무드보드 기준 8 / 14 / 22. */
export const radius = {
  sm: 8,
  md: 14,
  lg: 22,
  pill: 999,
} as const

export const font = {
  family:
    'Pretendard, "Apple SD Gothic Neo", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
} as const

/** three.js 머티리얼에 쓰기 위한 16진수 숫자 변환. */
export const hex = (c: string): number => parseInt(c.replace('#', ''), 16)
