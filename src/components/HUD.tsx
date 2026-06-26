interface HUDProps {
  score: number
  coins: number
}

/** 인게임 오버레이: 상단 코인 칩 + 대형 점수. 조작은 화면 전체 제스처(탭/스와이프). */
export function HUD({ score, coins }: HUDProps) {
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
    </div>
  )
}
