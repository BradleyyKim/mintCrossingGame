import type { Direction } from '../game/types'
import { DPad } from './DPad'

interface HUDProps {
  score: number
  coins: number
  onMove: (dir: Direction) => void
}

/** 인게임 오버레이: 상단 코인 칩 + 대형 점수 + 방향 패드/힌트. */
export function HUD({ score, coins, onMove }: HUDProps) {
  return (
    <div className="hud">
      <div className="hud-top">
        <div className="coin-pill">
          <span className="coin-ico">◆</span>
          <span className="coin-num">{coins}</span>
        </div>
      </div>

      <div className="score-wrap">
        <div className="score-num">{score}</div>
        <div className="score-label">SCORE</div>
      </div>

      <div className="controls">
        <DPad onMove={onMove} />
        <div className="control-hint">스와이프 · 탭으로 점프</div>
      </div>
    </div>
  )
}
