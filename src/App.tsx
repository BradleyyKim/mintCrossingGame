import { useCallback, useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import { useGameEngine } from './hooks/useGameEngine'
import { HUD } from './components/HUD'
import { CoachMark } from './components/CoachMark'
import { StartScreen } from './components/StartScreen'
import { GameOverScreen } from './components/GameOverScreen'

const SWIPE_THRESHOLD = 24 // px — 이만큼 끌면 방향 스와이프로 인정
const COACH_KEY = 'mint-crossing-coached'

interface Gesture {
  id: number
  x: number
  y: number
  consumed: boolean // 이 제스처가 이미 방향 이동을 발동했는지
}

export default function App() {
  const { containerRef, status, score, coins, best, result, start, move, home } =
    useGameEngine()

  const gesture = useRef<Gesture | null>(null)

  const [coachDone, setCoachDone] = useState(
    () => !!localStorage.getItem(COACH_KEY),
  )
  const dismissCoach = useCallback(() => {
    setCoachDone(true)
    localStorage.setItem(COACH_KEY, '1')
  }, [])

  // 화면 전체가 조작면: 탭=전진, 스와이프=방향(드래그 중 임계값 넘으면 즉시 발동).
  // 포인터 기반이라 모바일 터치·데스크톱 마우스 모두 동작한다.
  const onPointerDown = (e: PointerEvent) => {
    if (status !== 'playing') return
    if (gesture.current) return // 멀티터치: 첫 손가락만 추적
    gesture.current = { id: e.pointerId, x: e.clientX, y: e.clientY, consumed: false }
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // 일부 환경에서 캡처 실패는 무시
    }
  }

  const onPointerMove = (e: PointerEvent) => {
    const g = gesture.current
    if (!g || e.pointerId !== g.id || g.consumed) return
    const dx = e.clientX - g.x
    const dy = e.clientY - g.y
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_THRESHOLD) return
    g.consumed = true
    if (Math.abs(dy) >= Math.abs(dx)) move(dy < 0 ? 'forward' : 'back')
    else move(dx < 0 ? 'left' : 'right')
  }

  const endGesture = (e: PointerEvent, tap: boolean) => {
    const g = gesture.current
    if (!g || e.pointerId !== g.id) return
    gesture.current = null
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      // 무시
    }
    if (tap && !g.consumed) move('forward') // 임계값 미달로 끝남 = 탭 = 전진
  }

  const onPointerUp = (e: PointerEvent) => endGesture(e, true)
  const onPointerCancel = (e: PointerEvent) => endGesture(e, false)

  return (
    <div className="app-frame">
      <div
        className="game-layer"
        ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      />

      {status === 'playing' && <HUD score={score} coins={coins} />}

      {status === 'playing' && !coachDone && <CoachMark onDismiss={dismissCoach} />}

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
