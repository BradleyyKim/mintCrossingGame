export type LaneType = 'grass' | 'road' | 'water'

export type Direction = 'forward' | 'back' | 'left' | 'right'

export type GameStatus = 'idle' | 'playing' | 'gameover'

/** 게임오버 사유 */
export type DeathCause = 'car' | 'water' | 'edge'

/** 엔진 → React 로 올라가는 이벤트 콜백 */
export interface EngineCallbacks {
  onScore?: (score: number) => void
  onCoins?: (coins: number) => void
  onStatus?: (status: GameStatus) => void
  onGameOver?: (result: { score: number; coins: number; cause: DeathCause }) => void
}
