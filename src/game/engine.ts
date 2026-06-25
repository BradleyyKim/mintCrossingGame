import * as THREE from 'three'
import { colors, hex } from '../theme'
import {
  TILE,
  HALF_COLS,
  EDGE,
  PLAY_EDGE,
  HOP_DURATION,
  HOP_HEIGHT,
  START_SAFE_ROWS,
  FILLER_BEHIND,
  VISIBLE_AHEAD,
  KEEP_BEHIND,
  ROAD_BASE_SPEED,
  WATER_BASE_SPEED,
  SPEED_PER_ROW,
  MAX_EXTRA_SPEED,
  PLAYER_HALF,
  CAR_COLORS,
  CAMERA_OFFSET,
  FRUSTUM_TILES,
  LOOK_AHEAD,
  TREE_CHANCE,
  COIN_CHANCE,
} from './constants'
import type {
  Direction,
  EngineCallbacks,
  GameStatus,
  LaneType,
  DeathCause,
} from './types'

/* ── 월드 높이값(타일 기준) ── */
const SOLID_TOP = 0.3 // 잔디/도로 윗면 = 플레이어 발 높이
const WATER_TOP = 0.16 // 물 윗면(살짝 가라앉은 채널)
const LANE_W = 20 // 차선 슬래브 가로 길이(화면 가득)
const LOG_H = 0.3
const LOG_TOP = WATER_TOP + LOG_H // 통나무 윗면 = 물 위 플레이어 발 높이

const CAM_DIST = 70 // 직교 카메라를 타깃에서 떨어뜨리는 거리(포그 깊이 기준)

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v))
const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo)

interface Vehicle {
  mesh: THREE.Object3D
  x: number
  halfW: number
}

interface Lane {
  row: number
  type: LaneType
  group: THREE.Group
  dir: number
  speed: number
  vehicles: Vehicle[]
  span: number // 차량 재활용 주기 총합
  trees: Set<number>
  coinCol: number | null
  coinMesh: THREE.Object3D | null
}

export class GameEngine {
  private readonly container: HTMLElement
  private readonly cb: EngineCallbacks

  private renderer: THREE.WebGLRenderer
  private scene: THREE.Scene
  private camera: THREE.OrthographicCamera
  private readonly box: THREE.BoxGeometry
  private readonly mats = new Map<string, THREE.MeshStandardMaterial>()

  private lanes = new Map<number, Lane>()
  private worldRoot: THREE.Group

  private character!: THREE.Group
  private charYaw = Math.PI // 정면(=−Z, 전진 방향)을 보게

  /* 플레이어 논리/렌더 상태 */
  private row = 0
  private worldX = 0
  private renderX = 0
  private renderZ = 0
  private feetY = SOLID_TOP

  private hopping = false
  private hopT = 0
  private hopFrom = { x: 0, z: 0, y: SOLID_TOP }
  private hopTo = { x: 0, z: 0, y: SOLID_TOP, row: 0 }
  private queued: Direction | null = null

  private status: GameStatus = 'idle'
  private score = 0
  private coins = 0
  private maxGenerated = 0

  /* 사망 연출 */
  private dyingT = 0
  private deathCause: DeathCause | null = null

  private camFollowZ = 0
  private clock = new THREE.Clock()
  private raf = 0
  private readonly camOffsetDir = new THREE.Vector3(...CAMERA_OFFSET).normalize()

  constructor(container: HTMLElement, callbacks: EngineCallbacks = {}) {
    this.container = container
    this.cb = callbacks

    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setClearColor(hex(colors.bg), 1)
    this.renderer.shadowMap.enabled = false
    container.appendChild(this.renderer.domElement)

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(hex(colors.bg))
    // 직교 카메라가 CAM_DIST 만큼 떨어져 있으므로 그 깊이 근처에서 페이드
    this.scene.fog = new THREE.Fog(hex(colors.bg), CAM_DIST + 3, CAM_DIST + 12)

    this.camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 1, 200)

    this.box = new THREE.BoxGeometry(1, 1, 1)
    this.worldRoot = new THREE.Group()
    this.scene.add(this.worldRoot)

    this.setupLights()
    this.buildCharacter()
    this.resize()
    this.home() // 시작 화면 뒤로 보일 idle 씬을 미리 구성

    window.addEventListener('resize', this.resize)
    this.clock.start()
    this.loop()
  }

  /* ───────── 셋업 ───────── */

  private setupLights() {
    // 한 방향 광원 + 강한 앰비언트 = 면마다 평평한 3톤(플랫 셰이딩)
    const amb = new THREE.AmbientLight(0xffffff, 1.45)
    this.scene.add(amb)
    const dir = new THREE.DirectionalLight(0xffffff, 1.7)
    dir.position.set(5, 14, 9) // 위 + 카메라 쪽 → 윗면 가장 밝고 측면 2톤
    this.scene.add(dir)
    const dir2 = new THREE.DirectionalLight(hex(colors.cyan), 0.18)
    dir2.position.set(-8, 4, -6)
    this.scene.add(dir2)
  }

  private mat(color: string): THREE.MeshStandardMaterial {
    let m = this.mats.get(color)
    if (!m) {
      m = new THREE.MeshStandardMaterial({
        color: hex(color),
        flatShading: true,
        roughness: 1,
        metalness: 0,
      })
      this.mats.set(color, m)
    }
    return m
  }

  /** 바닥(baseY)에서 위로 높이 h 만큼 올라오는 박스. cx/cz는 중심. */
  private makeBox(
    cx: number,
    cz: number,
    baseY: number,
    w: number,
    h: number,
    d: number,
    color: string,
  ): THREE.Mesh {
    const m = new THREE.Mesh(this.box, this.mat(color))
    m.scale.set(w, h, d)
    m.position.set(cx, baseY + h / 2, cz)
    return m
  }

  private buildCharacter() {
    const g = new THREE.Group()
    // 몸통(민트 큐브)
    g.add(this.makeBox(0, 0, 0, 0.62, 0.6, 0.62, colors.charBody))
    // 볏(핑크) — 머리 위
    g.add(this.makeBox(0, 0.06, 0.6, 0.26, 0.14, 0.22, colors.charComb))
    // 부리(앰버) — 정면(−Z)
    g.add(this.makeBox(0, -0.34, 0.42, 0.16, 0.14, 0.2, colors.charBeak))
    // 눈 두 개(어두운)
    g.add(this.makeBox(0.16, -0.18, 0.42, 0.08, 0.08, 0.06, colors.bg))
    g.add(this.makeBox(-0.16, -0.18, 0.42, 0.08, 0.08, 0.06, colors.bg))
    g.position.set(0, SOLID_TOP, 0)
    g.rotation.y = this.charYaw
    this.character = g
    this.scene.add(g)
  }

  /* ───────── 차선 생성 ───────── */

  private laneTypeFor(row: number): LaneType {
    if (row < START_SAFE_ROWS) return 'grass'
    // 직전 2줄을 보고 같은 위험이 과도하게 연속되지 않게
    const prev = this.lanes.get(row - 1)?.type
    const prev2 = this.lanes.get(row - 2)?.type
    const r = Math.random()
    let t: LaneType = r < 0.36 ? 'grass' : r < 0.72 ? 'road' : 'water'
    if (t !== 'grass' && prev === t && prev2 === t) t = 'grass'
    if (t === 'water' && prev === 'water') {
      // 물 2연속까지만(난이도 완화)
      if (prev2 === 'water') t = 'grass'
    }
    return t
  }

  private difficultyExtra(row: number) {
    return Math.min(MAX_EXTRA_SPEED, row * SPEED_PER_ROW)
  }

  private createLane(row: number): Lane {
    const type = this.laneTypeFor(row)
    const group = new THREE.Group()
    const z = -row * TILE
    const lane: Lane = {
      row,
      type,
      group,
      dir: Math.random() < 0.5 ? 1 : -1,
      speed: 0,
      vehicles: [],
      span: 0,
      trees: new Set(),
      coinCol: null,
      coinMesh: null,
    }

    if (type === 'grass') {
      group.add(this.makeBox(0, z, 0, LANE_W, SOLID_TOP, TILE, colors.grass))
      this.populateGrass(lane, z)
    } else if (type === 'road') {
      group.add(this.makeBox(0, z, 0, LANE_W, SOLID_TOP, TILE, colors.road))
      // 차선 점선
      for (let k = -4; k <= 4; k++) {
        group.add(
          this.makeBox(k * 1.0, z, SOLID_TOP, 0.5, 0.02, 0.08, colors.laneDivider),
        )
      }
      this.populateVehicles(lane, z, false)
    } else {
      // water: 살짝 가라앉은 채널 + 잔물결
      group.add(this.makeBox(0, z, 0, LANE_W, WATER_TOP, TILE, colors.water))
      for (let k = -5; k <= 5; k++) {
        group.add(
          this.makeBox(
            k * 1.0 + rand(-0.1, 0.1),
            z + rand(-0.18, 0.18),
            WATER_TOP - 0.02,
            0.5,
            0.04,
            0.32,
            colors.waterRipple,
          ),
        )
      }
      this.populateVehicles(lane, z, true)
    }

    this.worldRoot.add(group)
    this.lanes.set(row, lane)
    return lane
  }

  private populateGrass(lane: Lane, z: number) {
    for (let c = -HALF_COLS; c <= HALF_COLS; c++) {
      // 시작 줄과 중앙 통로는 비워 둔다
      if (lane.row < START_SAFE_ROWS) continue
      if (c === 0 && lane.row === this.row) continue
      if (Math.random() < TREE_CHANCE) {
        lane.trees.add(c)
        lane.group.add(this.makeBox(c, z + 0.0, SOLID_TOP, 0.28, 0.32, 0.28, colors.trunk))
        lane.group.add(this.makeBox(c, z + 0.0, SOLID_TOP + 0.26, 0.6, 0.62, 0.6, colors.foliage))
      }
    }
    // 코인: 나무 없는 칸 하나에
    if (lane.row >= START_SAFE_ROWS && Math.random() < COIN_CHANCE) {
      const free: number[] = []
      for (let c = -HALF_COLS; c <= HALF_COLS; c++)
        if (!lane.trees.has(c)) free.push(c)
      if (free.length) {
        const col = free[Math.floor(Math.random() * free.length)]
        lane.coinCol = col
        const coin = this.makeBox(col, z, SOLID_TOP + 0.34, 0.26, 0.26, 0.06, colors.amber)
        coin.rotation.x = Math.PI / 2
        lane.coinMesh = coin
        lane.group.add(coin)
      }
    }
  }

  private populateVehicles(lane: Lane, z: number, isWater: boolean) {
    const extra = this.difficultyExtra(lane.row)
    lane.speed = (isWater ? WATER_BASE_SPEED : ROAD_BASE_SPEED) + extra
    const halfW = isWater ? rand(1.0, 1.5) : 0.8 // 통나무 길게 / 차 1.6폭
    const gap = isWater ? rand(1.3, 2.2) : rand(2.2, 3.6)
    const period = halfW * 2 + gap
    const count = Math.ceil((EDGE * 2) / period) + 1
    lane.span = count * period
    const phase = rand(0, period)
    const color = isWater
      ? colors.log
      : CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)]

    for (let i = 0; i < count; i++) {
      const x = -EDGE + i * period + phase
      let mesh: THREE.Object3D
      if (isWater) {
        mesh = this.makeBox(x, z, WATER_TOP, halfW * 2, LOG_H, 0.74, color)
      } else {
        const carG = new THREE.Group()
        carG.add(this.makeBox(0, 0, SOLID_TOP, halfW * 2, 0.4, 0.66, color))
        // 차창(어둡게) + 지붕
        carG.add(this.makeBox(0, 0, SOLID_TOP + 0.36, halfW * 1.3, 0.18, 0.6, colors.bg2))
        carG.position.set(x, 0, z)
        mesh = carG
      }
      lane.group.add(mesh)
      lane.vehicles.push({ mesh, x, halfW })
    }
  }

  /* ───────── 게임 흐름 ───────── */

  start() {
    this.reset()
    this.status = 'playing'
    this.cb.onStatus?.('playing')
  }

  /** 시작 화면(idle): 씬을 새로 깔고 멈춰 둔다(배경 차량은 계속 움직임). */
  home() {
    this.reset()
    this.status = 'idle'
    this.cb.onStatus?.('idle')
  }

  private reset() {
    // 기존 차선 제거
    for (const lane of this.lanes.values()) {
      this.worldRoot.remove(lane.group)
      this.disposeGroup(lane.group)
    }
    this.lanes.clear()

    this.row = 0
    this.worldX = 0
    this.renderX = 0
    this.renderZ = 0
    this.feetY = SOLID_TOP
    this.hopping = false
    this.hopT = 0
    this.queued = null
    this.score = 0
    this.coins = 0
    this.dyingT = 0
    this.deathCause = null
    this.charYaw = Math.PI
    this.maxGenerated = -1

    for (let r = -FILLER_BEHIND; r <= VISIBLE_AHEAD; r++) {
      this.createLane(r)
      this.maxGenerated = r
    }
    this.camFollowZ = -this.row * TILE - LOOK_AHEAD
    this.character.position.set(0, SOLID_TOP, 0)
    this.character.rotation.set(0, this.charYaw, 0)
    this.character.scale.set(1, 1, 1)
    this.cb.onScore?.(0)
    this.cb.onCoins?.(0)
  }

  /** 외부(키보드·터치·버튼) 입력 진입점 */
  move(dir: Direction) {
    if (this.status !== 'playing') return
    if (this.hopping) {
      this.queued = dir
      return
    }
    this.tryHop(dir)
  }

  private tryHop(dir: Direction) {
    const fromRow = this.row
    const fromX = Math.round(this.worldX) // 통나무에 실려 있어도 가까운 칸 기준
    let toRow = fromRow
    let toX = fromX

    if (dir === 'forward') toRow = fromRow + 1
    else if (dir === 'back') toRow = fromRow - 1
    else if (dir === 'left') toX = fromX - 1
    else if (dir === 'right') toX = fromX + 1

    if (toRow < 0) return // 시작 줄 뒤로는 못 감
    toX = clamp(toX, -HALF_COLS, HALF_COLS)

    // 목적지 차선의 나무/바위에 막히면 점프 취소
    const destLane = this.lanes.get(toRow)
    if (destLane && destLane.type === 'grass' && destLane.trees.has(toX)) {
      if (toRow !== fromRow || toX !== fromX) return // 막힘
    }
    if (toRow === fromRow && toX === fromX) return // 제자리

    // 방향 회전(부리가 향하는 쪽)
    if (dir === 'forward') this.charYaw = Math.PI
    else if (dir === 'back') this.charYaw = 0
    else if (dir === 'left') this.charYaw = -Math.PI / 2
    else if (dir === 'right') this.charYaw = Math.PI / 2

    const toFeet = this.lanes.get(toRow)?.type === 'water' ? LOG_TOP : SOLID_TOP
    this.hopFrom = { x: this.renderX, z: this.renderZ, y: this.feetY }
    this.hopTo = { x: toX, z: -toRow * TILE, y: toFeet, row: toRow }
    this.hopT = 0
    this.hopping = true
  }

  private finishHop() {
    this.hopping = false
    this.row = this.hopTo.row
    this.worldX = this.hopTo.x
    this.renderX = this.hopTo.x
    this.renderZ = this.hopTo.z
    this.feetY = this.hopTo.y

    // 점수 = 가장 멀리 전진한 줄
    if (this.row > this.score) {
      this.score = this.row
      this.cb.onScore?.(this.score)
    }

    // 코인 획득
    const lane = this.lanes.get(this.row)
    if (lane && lane.coinCol === Math.round(this.worldX) && lane.coinMesh) {
      lane.group.remove(lane.coinMesh)
      lane.coinCol = null
      lane.coinMesh = null
      this.coins += 1
      this.cb.onCoins?.(this.coins)
    }

    this.ensureLanes()

    // 큐에 쌓인 다음 입력 즉시 소비
    if (this.queued) {
      const q = this.queued
      this.queued = null
      this.tryHop(q)
    }
  }

  private ensureLanes() {
    const need = this.row + VISIBLE_AHEAD
    while (this.maxGenerated < need) {
      this.maxGenerated += 1
      this.createLane(this.maxGenerated)
    }
    // 뒤로 지나간 차선 제거
    const minKeep = this.row - KEEP_BEHIND
    for (const [r, lane] of this.lanes) {
      if (r < minKeep) {
        this.worldRoot.remove(lane.group)
        this.disposeGroup(lane.group)
        this.lanes.delete(r)
      }
    }
  }

  private die(cause: DeathCause) {
    if (this.status !== 'playing') return
    this.status = 'gameover'
    this.deathCause = cause
    this.dyingT = 0
    this.hopping = false
    this.queued = null
    this.cb.onStatus?.('gameover')
    this.cb.onGameOver?.({ score: this.score, coins: this.coins, cause })
  }

  /* ───────── 매 프레임 ───────── */

  private loop = () => {
    this.raf = requestAnimationFrame(this.loop)
    const dt = Math.min(this.clock.getDelta(), 0.05)
    this.update(dt)
    this.renderer.render(this.scene, this.camera)
  }

  private update(dt: number) {
    this.updateVehicles(dt)

    if (this.status === 'playing') {
      this.updatePlayer(dt)
      this.checkHazards()
    } else if (this.status === 'gameover') {
      this.updateDeath(dt)
    }

    this.updateCharacterTransform()
    this.updateCamera(dt)
    this.animateCoins(dt)
  }

  private updateVehicles(dt: number) {
    for (const lane of this.lanes.values()) {
      if (lane.vehicles.length === 0) continue
      const v = lane.dir * lane.speed * dt
      for (const veh of lane.vehicles) {
        veh.x += v
        if (lane.dir > 0 && veh.x > EDGE) veh.x -= lane.span
        else if (lane.dir < 0 && veh.x < -EDGE) veh.x += lane.span
        veh.mesh.position.x = veh.x
      }
    }
  }

  private updatePlayer(dt: number) {
    if (this.hopping) {
      this.hopT += dt / HOP_DURATION
      const t = clamp(this.hopT, 0, 1)
      const ease = t * t * (3 - 2 * t)
      this.renderX = lerp(this.hopFrom.x, this.hopTo.x, ease)
      this.renderZ = lerp(this.hopFrom.z, this.hopTo.z, ease)
      this.feetY = lerp(this.hopFrom.y, this.hopTo.y, ease) + Math.sin(t * Math.PI) * HOP_HEIGHT
      if (this.hopT >= 1) this.finishHop()
      return
    }

    // 물 위: 통나무에 실려 표류
    const lane = this.lanes.get(this.row)
    if (lane && lane.type === 'water') {
      const log = this.logUnder(lane, this.worldX)
      if (log) {
        this.worldX += lane.dir * lane.speed * dt
        this.renderX = this.worldX
      }
    }
  }

  private logUnder(lane: Lane, x: number): Vehicle | null {
    for (const veh of lane.vehicles) {
      if (Math.abs(x - veh.x) <= veh.halfW + 0.05) return veh
    }
    return null
  }

  private checkHazards() {
    if (this.hopping) return // 점프 중에는 무적
    const lane = this.lanes.get(this.row)
    if (!lane) return

    if (lane.type === 'road') {
      for (const veh of lane.vehicles) {
        if (Math.abs(this.worldX - veh.x) < veh.halfW + PLAYER_HALF) {
          this.die('car')
          return
        }
      }
    } else if (lane.type === 'water') {
      if (Math.abs(this.worldX) > PLAY_EDGE) {
        this.die('edge')
        return
      }
      if (!this.logUnder(lane, this.worldX)) {
        this.die('water')
        return
      }
    }
  }

  private updateDeath(dt: number) {
    this.dyingT += dt
    if (this.deathCause === 'car') {
      // 납작하게 눌리며 살짝 튐
      const s = clamp(1 - this.dyingT * 3, 0.2, 1)
      this.character.scale.set(1 + (1 - s) * 0.8, s, 1 + (1 - s) * 0.8)
    } else {
      // 물/추락: 가라앉음
      this.feetY = lerp(this.feetY, WATER_TOP - 0.6, clamp(this.dyingT * 2, 0, 1))
      this.character.rotation.z = lerp(0, 0.5, clamp(this.dyingT, 0, 1))
    }
  }

  private updateCharacterTransform() {
    this.character.position.set(this.renderX, this.feetY, this.renderZ)
    // 부드러운 회전
    let dy = this.charYaw - this.character.rotation.y
    while (dy > Math.PI) dy -= Math.PI * 2
    while (dy < -Math.PI) dy += Math.PI * 2
    this.character.rotation.y += dy * 0.35
  }

  private updateCamera(dt: number) {
    const targetZ = -this.row * TILE - LOOK_AHEAD
    const k = 1 - Math.exp(-dt * 7)
    this.camFollowZ = lerp(this.camFollowZ, targetZ, k)
    const tx = 0
    const tz = this.camFollowZ
    this.camera.position.set(
      tx + this.camOffsetDir.x * CAM_DIST,
      this.camOffsetDir.y * CAM_DIST,
      tz + this.camOffsetDir.z * CAM_DIST,
    )
    this.camera.lookAt(tx, 0, tz)
  }

  private animateCoins(dt: number) {
    for (const lane of this.lanes.values()) {
      if (lane.coinMesh) lane.coinMesh.rotation.z += dt * 2.4
    }
  }

  /* ───────── 리사이즈 / 정리 ───────── */

  private resize = () => {
    const w = this.container.clientWidth || window.innerWidth
    const h = this.container.clientHeight || window.innerHeight
    this.renderer.setSize(w, h)
    const aspect = w / h
    // 세로/가로 어느 쪽이든 좌우 플레이 폭과 세로 시야를 모두 확보
    const targetW = HALF_COLS * 2 + 2.5
    const fw = Math.max(targetW, FRUSTUM_TILES * aspect)
    const fh = fw / aspect
    this.camera.left = -fw / 2
    this.camera.right = fw / 2
    this.camera.top = fh / 2
    this.camera.bottom = -fh / 2
    this.camera.updateProjectionMatrix()
  }

  private disposeGroup(group: THREE.Group) {
    // geometry(this.box)·material(this.mats) 은 공유 자원이라 dispose 하지 않고
    // 자식 참조만 끊어 GC 를 돕는다.
    group.clear()
  }

  dispose() {
    cancelAnimationFrame(this.raf)
    window.removeEventListener('resize', this.resize)
    for (const m of this.mats.values()) m.dispose()
    this.box.dispose()
    this.renderer.dispose()
    if (this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement)
    }
  }
}
