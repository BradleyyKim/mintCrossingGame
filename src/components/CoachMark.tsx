import { useEffect, useState } from 'react'

/**
 * 첫 플레이 조작 안내. 첫 입력(탭/스와이프/키) 또는 3.2초 후 사라진다.
 * pointer-events: none 이라 안내를 띄운 채로도 그 탭이 그대로 전진으로 전달된다.
 */
export function CoachMark({ onDismiss }: { onDismiss: () => void }) {
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const dismiss = () => setLeaving(true)
    const timer = window.setTimeout(dismiss, 3200)
    window.addEventListener('pointerdown', dismiss, { once: true })
    window.addEventListener('keydown', dismiss, { once: true })
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('pointerdown', dismiss)
      window.removeEventListener('keydown', dismiss)
    }
  }, [])

  useEffect(() => {
    if (!leaving) return
    const t = window.setTimeout(onDismiss, 320) // 페이드아웃 후 언마운트
    return () => window.clearTimeout(t)
  }, [leaving, onDismiss])

  return (
    <div className={`coach ${leaving ? 'coach-out' : ''}`}>
      <div className="coach-card">
        <div className="coach-finger">👆</div>
        <div className="coach-line">
          <b>탭</b> 하면 한 칸 전진
        </div>
        <div className="coach-line">
          <span className="coach-arrows">⇧ ⇩ ⇦ ⇨</span> 스와이프로 방향 이동
        </div>
      </div>
    </div>
  )
}
