import { useRef } from 'react'
import type { PointerEvent } from 'react'
import { useGameEngine } from './hooks/useGameEngine'
import { HUD } from './components/HUD'
import { StartScreen } from './components/StartScreen'
import { GameOverScreen } from './components/GameOverScreen'

const TAP_THRESHOLD = 14 // px 이하 이동 = 탭

export default function App() {
  const { containerRef, status, score, coins, best, result, start, move, home } =
    useGameEngine()

  const swipeStart = useRef<{ x: number; y: number } | null>(null)

  const onPointerDown = (e: PointerEvent) => {
    swipeStart.current = { x: e.clientX, y: e.clientY }
  }

  const onPointerUp = (e: PointerEvent) => {
    const s = swipeStart.current
    swipeStart.current = null
    if (!s || status !== 'playing') return
    const dx = e.clientX - s.x
    const dy = e.clientY - s.y
    const adx = Math.abs(dx)
    const ady = Math.abs(dy)
    if (adx < TAP_THRESHOLD && ady < TAP_THRESHOLD) {
      move('forward') // 탭 = 전진
    } else if (ady > adx) {
      move(dy < 0 ? 'forward' : 'back') // 위로 스와이프 = 전진
    } else {
      move(dx < 0 ? 'left' : 'right')
    }
  }

  return (
    <div className="app-frame">
      <div
        className="game-layer"
        ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      />

      {status === 'playing' && <HUD score={score} coins={coins} onMove={move} />}

      {status === 'idle' && <StartScreen best={best} onPlay={start} />}

      {status === 'gameover' && result && (
        <GameOverScreen
          result={result}
          best={best}
          onRetry={start}
          onHome={home}
        />
      )}
    </div>
  )
}
