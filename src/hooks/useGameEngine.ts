import { useCallback, useEffect, useRef, useState } from 'react'
import { GameEngine } from '../game/engine'
import type { Direction, GameStatus, DeathCause } from '../game/types'

const BEST_KEY = 'mint-crossing-best'

export interface GameResult {
  score: number
  coins: number
  cause: DeathCause
}

/** three.js 엔진 인스턴스를 만들고 React 상태와 동기화한다. */
export function useGameEngine() {
  const containerRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<GameEngine | null>(null)

  const [status, setStatus] = useState<GameStatus>('idle')
  const [score, setScore] = useState(0)
  const [coins, setCoins] = useState(0)
  const [best, setBest] = useState(() =>
    Number(localStorage.getItem(BEST_KEY) ?? 0),
  )
  const [result, setResult] = useState<GameResult | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const engine = new GameEngine(container, {
      onScore: setScore,
      onCoins: setCoins,
      onStatus: setStatus,
      onGameOver: (r) => {
        setResult(r)
        setBest((b) => {
          const next = Math.max(b, r.score)
          if (next !== b) localStorage.setItem(BEST_KEY, String(next))
          return next
        })
      },
    })
    engineRef.current = engine

    return () => {
      engine.dispose()
      engineRef.current = null
    }
  }, [])

  // 키보드(개발/데스크톱용)
  useEffect(() => {
    const map: Record<string, Direction> = {
      ArrowUp: 'forward',
      KeyW: 'forward',
      ArrowDown: 'back',
      KeyS: 'back',
      ArrowLeft: 'left',
      KeyA: 'left',
      ArrowRight: 'right',
      KeyD: 'right',
    }
    const onKey = (e: KeyboardEvent) => {
      const dir = map[e.code]
      if (dir) {
        e.preventDefault()
        engineRef.current?.move(dir)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const start = useCallback(() => {
    setResult(null)
    setScore(0)
    setCoins(0)
    engineRef.current?.start()
  }, [])

  const move = useCallback((dir: Direction) => {
    engineRef.current?.move(dir)
  }, [])

  const home = useCallback(() => {
    setResult(null)
    setScore(0)
    setCoins(0)
    engineRef.current?.home()
  }, [])

  return { containerRef, status, score, coins, best, result, start, move, home }
}
