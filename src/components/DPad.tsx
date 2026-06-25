import type { PointerEvent } from 'react'
import type { Direction } from '../game/types'

/** 모바일용 방향 패드. 디자인 레퍼런스의 3×2 그리드를 그대로 따랐다. */
export function DPad({ onMove }: { onMove: (dir: Direction) => void }) {
  const press = (dir: Direction) => (e: PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onMove(dir)
  }
  return (
    <div className="dpad">
      <span />
      <button className="dpad-btn dpad-up" onPointerDown={press('forward')} aria-label="앞으로">
        ▲
      </button>
      <span />
      <button className="dpad-btn" onPointerDown={press('left')} aria-label="왼쪽">
        ◀
      </button>
      <button className="dpad-btn" onPointerDown={press('back')} aria-label="뒤로">
        ▼
      </button>
      <button className="dpad-btn" onPointerDown={press('right')} aria-label="오른쪽">
        ▶
      </button>
    </div>
  )
}
