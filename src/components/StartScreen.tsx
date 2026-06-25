interface StartScreenProps {
  best: number
  onPlay: () => void
}

/** 시작 화면. 디자인 레퍼런스 03 · Start 를 따랐다. */
export function StartScreen({ best, onPlay }: StartScreenProps) {
  return (
    <div className="screen start-screen">
      <div className="grid-vignette" />

      <div className="best-pill">
        <span className="best-ico">◆</span>
        <span className="best-label">BEST</span>
        <span className="best-num">{best}</span>
      </div>

      <div className="logo">
        <div className="logo-mint">MINT</div>
        <div className="logo-crossing">CROSSING</div>
        <div className="logo-sub">HOP · DODGE · SURVIVE</div>
      </div>

      <div className="start-bottom">
        <button className="btn-primary btn-pulse" onClick={onPlay}>
          <span className="btn-tri">▶</span> PLAY
        </button>
        <div className="how-to">
          <span>↑ 전진</span>
          <span>← → 좌우</span>
          <span>스와이프 · 탭</span>
        </div>
      </div>
    </div>
  )
}
