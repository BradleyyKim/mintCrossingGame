import type { GameResult } from '../hooks/useGameEngine'

interface GameOverScreenProps {
  result: GameResult
  best: number
  onRetry: () => void
  onHome: () => void
}

const CAUSE_TEXT: Record<GameResult['cause'], string> = {
  car: '🚗 차에 부딪혔어요',
  water: '🌊 물에 빠졌어요',
  edge: '💧 강물에 떠내려갔어요',
}

/** 게임오버 화면. 디자인 레퍼런스 05 · Game Over 를 따랐다. */
export function GameOverScreen({ result, best, onRetry, onHome }: GameOverScreenProps) {
  const isRecord = result.score >= best && result.score > 0
  const toRecord = Math.max(0, best - result.score)

  const onShare = () => {
    const text = `Mint Crossing에서 ${result.score}점! 도전해봐 🟢`
    if (navigator.share) {
      void navigator.share({ title: 'Mint Crossing', text }).catch(() => {})
    } else {
      void navigator.clipboard?.writeText(text).catch(() => {})
    }
  }

  return (
    <div className="screen over-screen">
      <div className="grid-vignette" />

      <div className="over-title">GAME OVER</div>
      <div className="over-cause">{CAUSE_TEXT[result.cause]}</div>

      <div className="score-card">
        <div className="score-card-label">SCORE</div>
        <div className="score-card-num">{result.score}</div>
        <div className="stat-row">
          <div className="stat-box">
            <div className="stat-label">BEST</div>
            <div className="stat-val">{best}</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">COINS</div>
            <div className="stat-val stat-amber">+{result.coins}</div>
          </div>
        </div>
        <div className={`record-pill ${isRecord ? 'is-record' : ''}`}>
          {isRecord ? '🎉 신기록!' : `▲ 신기록까지 ${toRecord}`}
        </div>
      </div>

      <div className="over-bottom">
        <button className="btn-primary" onClick={onRetry}>
          <span className="btn-tri">↻</span> 다시하기
        </button>
        <div className="over-actions">
          <button className="btn-ghost btn-cyan" onClick={onShare}>
            ↗ 공유
          </button>
          <button className="btn-ghost" onClick={onHome}>
            ⌂ 홈
          </button>
        </div>
      </div>
    </div>
  )
}
