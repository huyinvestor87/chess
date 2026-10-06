// Kịch bản video TikTok: "Hack Não #2 – Mã đi tuần" (Mã đi qua cả 64 ô, mỗi ô đúng 1 lần).
import * as THREE from 'three';
import {
  seg, easeOut, lerp, bounce, pop, fade, GOLD_GRAD, sqFR, sqName, text, captionBox, drawFollow, coverBadge, cameraRig,
} from './common.js';

export const meta = {
  id: 'knight-tour',
  name: 'Hack Não #2 – Mã đi tuần',
  duration: 42,
  coverTime: 1.6,
};

// Hành trình hợp lệ (quy tắc Warnsdorff, bắt đầu từ g1) – đã kiểm tra: 64 ô khác nhau, mọi bước là nước Mã
const TOUR = ['g1', 'h3', 'f2', 'h1', 'g3', 'f1', 'h2', 'g4', 'h6', 'g8', 'e7', 'c8', 'a7', 'b5', 'a3', 'b1', 'd2', 'b3', 'a1', 'c2', 'e1', 'g2', 'h4', 'f3', 'g5', 'h7', 'f8', 'g6', 'h8', 'f7', 'd8', 'b7', 'a5', 'c6', 'b8', 'a6', 'b4', 'a2', 'c1', 'e2', 'd4', 'f5', 'g7', 'h5', 'f4', 'e6', 'c7', 'a8', 'b6', 'a4', 'b2', 'd1', 'c3', 'd5', 'e3', 'c4', 'd6', 'e8', 'f6', 'e4', 'c5', 'd7', 'e5', 'd3'];
// Lần thử bị kẹt: tới góc h8 thì f7 và g6 đều đã đi qua
const DEAD = ['g1', 'h3', 'g5', 'f7', 'e5', 'g6', 'h8'];
const KNIGHT_MOVES = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]];
const knightTargets = (sq) => {
  const [f, r] = sqFR(sq);
  return KNIGHT_MOVES.map(([a, b]) => [f + a, r + b]).filter(([x, y]) => x >= 0 && x < 8 && y >= 0 && y < 8).map(([x, y]) => sqName(x, y));
};

// Mốc thời gian
const DEMO_START = 8.6; // Mã đi thế nào
const DEAD_START = 14.0; // lần thử bị kẹt
const DEAD_STEP = 0.55;
const STUCK_T = DEAD_START + (DEAD.length - 1) * DEAD_STEP + 0.2; // 17.5
const SOL_START = 24.2; // lời giải
const SOL_TIMES = (() => {
  // thời điểm bắt đầu mỗi bước: chậm lúc đầu, nhanh dần
  const ts = [SOL_START];
  for (let k = 1; k < 63; k++) ts.push(ts[k - 1] + 0.12 + 0.33 * Math.exp(-k / 8));
  return ts; // ts[k] = lúc nhảy từ TOUR[k] sang TOUR[k+1]
})();
const SOL_END = SOL_TIMES[62] + 0.12; // ~34.4
const FINISH = SOL_END + 0.2;

const CAM = [
  { t: 0, az: 0.5, polar: 1.18, f: 0.36, target: [-0.5, 0.5, 0.5] },
  { t: 2.9, az: 0.32, polar: 1.12, f: 0.38, target: [-0.5, 0.5, 0.5] },
  { t: 5.2, az: 0, polar: 0.78, f: 0.95, target: [0, 0, 1.0] },
  { t: 19.6, az: 0, polar: 0.78, f: 0.95, target: [0, 0, 1.0] },
  { t: 21.2, az: 0, polar: 0.4, f: 0.95, target: [0, 0, 0.7] },
  { t: FINISH, az: 0, polar: 0.4, f: 0.95, target: [0, 0, 0.7] },
  { t: FINISH + 2.6, az: 0.5, polar: 0.92, f: 0.7, target: [0, 0.1, 0.9] },
  { t: 42, az: 1.05, polar: 1.0, f: 0.66, target: [0, 0.1, 0.9] },
];

export function createVideo(api) {
  const { scene, camera, overlay, createPiece, squareToPosition, fitDistance } = api;
  const group = new THREE.Group();
  scene.add(group);
  const updateCamera = cameraRig(CAM, camera, fitDistance);

  // ---- ô tô màu + số thứ tự ----
  const tiles = {}, labels = {};
  const tileGeo = new THREE.PlaneGeometry(0.96, 0.96).rotateX(-Math.PI / 2);
  const labelGeo = new THREE.PlaneGeometry(0.62, 0.62).rotateX(-Math.PI / 2);
  const numTex = {};
  function numberTexture(n) {
    if (numTex[n]) return numTex[n];
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const ctx = c.getContext('2d');
    ctx.font = '900 70px "Be Vietnam Pro", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 12;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(0,0,0,0.85)';
    ctx.strokeText(String(n), 64, 68);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(String(n), 64, 68);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return (numTex[n] = t);
  }
  for (let f = 0; f < 8; f++) for (let r = 0; r < 8; r++) {
    const sq = sqName(f, r);
    const m = new THREE.Mesh(tileGeo, new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, opacity: 0 }));
    squareToPosition(sq, m.position);
    m.position.y = 0.004;
    m.renderOrder = 2;
    group.add(m);
    tiles[sq] = m;
    const l = new THREE.Mesh(labelGeo, new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, opacity: 0 }));
    squareToPosition(sq, l.position);
    l.position.y = 0.014;
    l.renderOrder = 5;
    l.visible = false;
    group.add(l);
    labels[sq] = l;
  }
  const RED = new THREE.Color('#ef3b2f'), GREEN = new THREE.Color('#33d17a'), GOLD = new THREE.Color('#f2c14e');

  // ---- vệt đường đi ----
  const beamGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  function makeBeam(a, b, color, width = 0.07) {
    const pa = squareToPosition(a), pb = squareToPosition(b);
    const m = new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({
      color, transparent: true, depthWrite: false, opacity: 0, blending: THREE.AdditiveBlending,
    }));
    m.userData = { pa, pb, len: pa.distanceTo(pb), width };
    m.rotation.y = -Math.atan2(pb.z - pa.z, pb.x - pa.x);
    m.renderOrder = 4;
    m.visible = false;
    group.add(m);
    return m;
  }
  // vẽ đoạn a→b mọc dần theo k (0..1)
  function setBeam(m, k, opacity) {
    m.visible = k > 0 && opacity > 0;
    if (!m.visible) return;
    const { pa, pb, len, width } = m.userData;
    m.position.lerpVectors(pa, pb, k / 2);
    m.position.y = 0.012;
    m.scale.set(Math.max(0.001, len * k), 1, width);
    m.material.opacity = opacity;
  }
  const tourBeams = TOUR.slice(1).map((sq, i) => makeBeam(TOUR[i], sq, '#ffc93c'));
  const deadBeams = DEAD.slice(1).map((sq, i) => makeBeam(DEAD[i], sq, '#ffc93c'));
  const demoTargets = knightTargets('d4');
  const demoBeams = demoTargets.map((sq) => makeBeam('d4', sq, '#33d17a', 0.05));

  // ---- quân Mã ----
  const knight = createPiece('n');
  group.add(knight);
  const innerYaw = knight.children[0]?.rotation.y || 0;
  const pA = new THREE.Vector3(), pB = new THREE.Vector3();
  const yawFor = (a, b) => {
    squareToPosition(a, pA);
    squareToPosition(b, pB);
    return Math.atan2(-(pB.z - pA.z), pB.x - pA.x) - innerYaw;
  };
  const angLerp = (a, b, k) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * k;
  // nhảy từ ô a sang ô b, tiến độ k (0..1)
  function jump(a, b, k, h = 0.6, yawFrom = null) {
    squareToPosition(a, pA);
    squareToPosition(b, pB);
    const e = easeOut(k);
    knight.position.lerpVectors(pA, pB, k < 1 ? (k * 0.4 + e * 0.6) : 1);
    knight.position.y = h * Math.sin(Math.PI * k);
    const y1 = yawFor(a, b);
    knight.rotation.y = yawFrom === null ? y1 : angLerp(yawFrom, y1, Math.min(1, k * 2.5));
    knight.scale.setScalar(1);
    knight.visible = true;
  }
  function standAt(sq, yaw, y = 0, s = 1) {
    squareToPosition(sq, knight.position);
    knight.position.y = y;
    knight.rotation.y = yaw;
    knight.scale.setScalar(Math.max(0.001, s));
    knight.visible = s > 0.001;
  }
  const YAW_DEFAULT = Math.PI - innerYaw; // quay mặt sang trái màn hình

  // ---------- chữ ----------
  let T = 0;
  function drawOverlay(ctx, W, H, _now, u) {
    const t = T;
    // ===== COVER =====
    const cov = 1 - seg(t, 2.7, 3.2);
    if (cov > 0) {
      const g = ctx.createLinearGradient(0, 0, 0, H * 0.5);
      g.addColorStop(0, `rgba(0,0,0,${0.75 * cov})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H * 0.5);
      text(ctx, 'HACK NÃO #2', W / 2, H * 0.1, { size: 76, weight: 900, stroke: 12, alpha: cov, scale: pop(t, 0.05, 0.4), glow: 'rgba(255,255,255,0.35)' }, u);
      text(ctx, 'MÃ ĐI TUẦN', W / 2, H * 0.19, { size: 132, weight: 900, gradient: GOLD_GRAD, stroke: 16, alpha: cov, scale: pop(t, 0.25, 0.45), glow: 'rgba(255,190,60,0.6)' }, u);
      text(ctx, 'Đi qua cả 64 ô – mỗi ô đúng 1 lần?', W / 2, H * 0.285, { size: 54, weight: 700, alpha: cov * seg(t, 0.6, 0.9), maxWidth: W * 0.86, stroke: 9 }, u);
      coverBadge(ctx, W, H, u, t, cov * seg(t, 1.0, 1.3));
    }

    // ===== LUẬT =====
    text(ctx, 'LUẬT CHƠI', W / 2, H * 0.1, { size: 54, gradient: GOLD_GRAD, alpha: fade(t, 3.3, 8.5), scale: pop(t, 3.3) }, u);
    captionBox(ctx, 'Con Mã phải đi qua TẤT CẢ 64 ô', W, H, 0.18, fade(t, 3.6, 8.5), u, { size: 52 });
    drawFollow(ctx, W, H, u, t, 3.4, 6.0, 0.765, 0.665);
    captionBox(ctx, 'Mỗi ô chỉ được đến ĐÚNG 1 lần!', W, H, 0.765, fade(t, 6.0, 8.5), u, { size: 54, color: '#ffd56a', accent: 'rgba(242,193,78,0.8)' });

    // ===== MÃ ĐI THẾ NÀO =====
    text(ctx, 'MÃ ĐI THẾ NÀO?', W / 2, H * 0.1, { size: 58, gradient: GOLD_GRAD, alpha: fade(t, DEMO_START, 13.8), scale: pop(t, DEMO_START) }, u);
    captionBox(ctx, 'Mã đi hình chữ L: 2 ô thẳng rồi rẽ 1 ô', W, H, 0.765, fade(t, DEMO_START + 0.3, 11.4), u);
    captionBox(ctx, 'Từ giữa bàn cờ, Mã có tới 8 hướng nhảy', W, H, 0.765, fade(t, 11.4, 13.8), u, { color: '#8ff0b5' });

    // ===== THỬ ĐI =====
    text(ctx, 'THỬ ĐI XEM...', W / 2, H * 0.1, { size: 58, gradient: GOLD_GRAD, alpha: fade(t, 13.9, 19.6), scale: pop(t, 13.9) }, u);
    if (t > DEAD_START - 0.2 && t < 19.6) {
      const n = deadCount(t);
      text(ctx, `${n} / 64`, W / 2, H * 0.17, { size: 64, weight: 900, color: t > STUCK_T ? '#ff8a80' : '#ffffff', alpha: fade(t, 13.9, 19.6) }, u);
    }
    text(ctx, 'HẾT ĐƯỜNG!', W / 2, H * 0.47, { size: 140, weight: 900, color: '#ff3b2f', stroke: 20, alpha: fade(t, STUCK_T, STUCK_T + 1.2, 0.12, 0.3), scale: pop(t, STUCK_T, 0.3), glow: 'rgba(255,40,30,0.7)' }, u);
    captionBox(ctx, 'Kẹt ở góc! Mới đi được 7/64 ô...', W, H, 0.765, fade(t, STUCK_T + 0.2, 19.6), u, { color: '#ff8a80' });

    // ===== ĐẾN LƯỢT BẠN =====
    text(ctx, 'ĐẾN LƯỢT BẠN!', W / 2, H * 0.1, { size: 84, weight: 900, gradient: GOLD_GRAD, stroke: 14, alpha: fade(t, 19.7, 24.2), scale: pop(t, 19.7, 0.4) }, u);
    captionBox(ctx, 'Dừng video và thử cho Mã đi hết 64 ô nhé', W, H, 0.765, fade(t, 20.0, 24.2), u, { accent: 'rgba(242,193,78,0.8)' });
    for (let i = 0; i < 3; i++) {
      const t0 = 21.1 + i;
      const x = seg(t, t0, t0 + 1);
      if (x <= 0 || x >= 1) continue;
      text(ctx, String(3 - i), W / 2, H * 0.45, { size: 300, weight: 900, gradient: GOLD_GRAD, stroke: 24, alpha: 1 - seg(x, 0.7, 1), scale: 1.5 - 0.5 * easeOut(Math.min(1, x * 3)), glow: 'rgba(255,190,60,0.6)' }, u);
    }

    // ===== LỜI GIẢI =====
    const sA = fade(t, SOL_START - 0.4, FINISH + 0.1);
    text(ctx, 'LỜI GIẢI', W / 2, H * 0.09, { size: 64, weight: 900, gradient: GOLD_GRAD, alpha: sA, scale: pop(t, SOL_START - 0.4) }, u);
    if (sA > 0) {
      const n = visitedCount(t);
      text(ctx, `${n} / 64`, W / 2, H * 0.16, { size: 72, weight: 900, color: n === 64 ? '#33d17a' : '#ffffff', alpha: sA }, u);
    }
    captionBox(ctx, 'Mẹo: luôn nhảy vào ô có ÍT lối ra nhất', W, H, 0.765, fade(t, SOL_START + 0.6, 29.8), u);
    captionBox(ctx, 'Đó là quy tắc Warnsdorff, có từ năm 1823', W, H, 0.765, fade(t, 29.8, SOL_END), u, { color: '#ffd56a' });

    // ===== KẾT =====
    text(ctx, 'HOÀN THÀNH!', W / 2, H * 0.12, { size: 120, weight: 900, gradient: ['#eaffef', '#33d17a', '#16a34a'], stroke: 18, alpha: fade(t, FINISH, 43, 0.3, 0.01), scale: pop(t, FINISH, 0.4), glow: 'rgba(51,209,122,0.6)' }, u);
    captionBox(ctx, 'Bài toán này đã có từ hơn 1.000 năm trước!', W, H, 0.69, fade(t, FINISH + 1.2, 38.4, 0.35, 0.4), u, { size: 52, color: '#ffd56a', accent: 'rgba(242,193,78,0.8)' });
    captionBox(ctx, 'Bạn đi được bao nhiêu ô? Comment nhé!', W, H, 0.785, fade(t, FINISH + 2.2, 38.4, 0.35, 0.4), u, { size: 46 });
    drawFollow(ctx, W, H, u, t, 38.3, 43, 0.7, 0.805);
  }

  const deadArrive = (i) => (i === 0 ? DEAD_START : DEAD_START + (i - 1) * DEAD_STEP + DEAD_STEP * 0.85);
  const deadCount = (t) => DEAD.reduce((n, _, i) => (t >= deadArrive(i) ? i + 1 : n), 1);

  // số ô đã đi trong lời giải tại thời điểm t
  function visitedCount(t) {
    if (t < SOL_START) return 1;
    let n = 1;
    for (let k = 0; k < 63; k++) if (t >= SOL_TIMES[k] + stepDur(k) * 0.85) n = k + 2;
    return n;
  }
  const stepDur = (k) => (k < 62 ? SOL_TIMES[k + 1] - SOL_TIMES[k] : 0.12) * 0.92;

  // ---------- cập nhật theo thời gian ----------
  function update(t) {
    T = t;
    updateCamera(t);
    for (const sq in tiles) {
      tiles[sq].material.opacity = 0;
      labels[sq].visible = false;
    }
    for (const b of [...tourBeams, ...deadBeams, ...demoBeams]) b.visible = false;
    const setTile = (sq, color, op) => {
      const m = tiles[sq].material;
      if (op > m.opacity) { m.color.copy(color); m.opacity = op; }
    };
    const showLabel = (sq, n, op) => {
      const l = labels[sq];
      if (op <= 0) return;
      l.material.map = numberTexture(n);
      l.material.opacity = op;
      l.visible = true;
    };

    // ---- quân Mã ----
    if (t < 13.3) {
      // cover / luật / minh hoạ: đứng ở d4 (rơi xuống lúc đầu)
      const x = seg(t, 0.1, 0.75);
      standAt('d4', YAW_DEFAULT, 2.4 * (1 - bounce(x)));
      // minh hoạ một cú nhảy d4 → f5 → d4
      if (t > 10.0 && t < 11.3) {
        const k1 = seg(t, 10.0, 10.55), k2 = seg(t, 10.75, 11.3);
        if (k2 <= 0) jump('d4', 'f5', k1, 0.8, YAW_DEFAULT);
        else jump('f5', 'd4', k2, 0.8);
      }
    } else if (t < DEAD_START) {
      // bay từ d4 về g1
      jump('d4', 'g1', seg(t, 13.3, 13.9), 1.4);
    } else if (t < 19.3) {
      let k = 0;
      while (k < DEAD.length - 2 && t >= DEAD_START + (k + 1) * DEAD_STEP) k++;
      const prevYaw = k > 0 ? yawFor(DEAD[k - 1], DEAD[k]) : null;
      jump(DEAD[k], DEAD[k + 1], seg(t, DEAD_START + k * DEAD_STEP, DEAD_START + k * DEAD_STEP + DEAD_STEP * 0.85), 0.6, prevYaw);
      // rung khi bị kẹt
      if (t > STUCK_T && t < STUCK_T + 1) knight.position.x += Math.sin(t * 60) * 0.05 * (1 - seg(t, STUCK_T, STUCK_T + 1));
    } else if (t < SOL_START) {
      // về lại g1 để giải
      jump('h8', 'g1', seg(t, 19.3, 20.0), 1.6, yawFor('g6', 'h8'));
    } else {
      let k = 0;
      while (k < 62 && t >= SOL_TIMES[k + 1]) k++;
      const prevYaw = k > 0 ? yawFor(TOUR[k - 1], TOUR[k]) : null;
      const d = stepDur(k);
      jump(TOUR[k], TOUR[k + 1], seg(t, SOL_TIMES[k], SOL_TIMES[k] + d), 0.25 + 0.4 * Math.min(1, d / 0.45), prevYaw);
    }

    // ---- 64 ô sáng lan (minh hoạ "tất cả 64 ô") ----
    if (t > 3.8 && t < 6.2) {
      for (let f = 0; f < 8; f++) for (let r = 0; r < 8; r++) {
        const d = Math.hypot(f - 3, r - 3);
        const t0 = 3.9 + d * 0.16;
        const k = seg(t, t0, t0 + 0.25) * (1 - seg(t, t0 + 0.6, t0 + 1.0));
        setTile(sqName(f, r), GOLD, 0.45 * k);
      }
    }

    // ---- minh hoạ cách đi ----
    if (t > DEMO_START && t < 13.6) {
      const out = 1 - seg(t, 13.1, 13.6);
      setTile('d4', GOLD, 0.5 * seg(t, DEMO_START, DEMO_START + 0.3) * out);
      demoTargets.forEach((sq, i) => {
        const t0 = DEMO_START + 0.3 + i * 0.18;
        const k = easeOut(seg(t, t0, t0 + 0.3));
        setBeam(demoBeams[i], k, 0.9 * out);
        setTile(sq, GREEN, 0.55 * seg(t, t0 + 0.2, t0 + 0.4) * out);
      });
    }

    // ---- lần thử bị kẹt ----
    if (t > DEAD_START - 0.1 && t < 19.6) {
      const out = 1 - seg(t, 19.2, 19.6);
      DEAD.forEach((sq, i) => {
        const tArrive = deadArrive(i);
        if (t < tArrive) return;
        setTile(sq, GOLD, 0.35 * out);
        showLabel(sq, i + 1, out * seg(t, tArrive, tArrive + 0.15));
        if (i > 0) setBeam(deadBeams[i - 1], 1, 0.85 * out);
      });
      if (t > DEAD_START) {
        // đoạn đang vẽ
        let k = 0;
        while (k < DEAD.length - 2 && t >= DEAD_START + (k + 1) * DEAD_STEP) k++;
        const p = seg(t, DEAD_START + k * DEAD_STEP, DEAD_START + k * DEAD_STEP + DEAD_STEP * 0.85);
        if (p < 1) setBeam(deadBeams[k], p, 0.85 * out);
      }
      // 2 lối ra của h8 đã bị đi qua → nháy đỏ
      if (t > STUCK_T) {
        const blink = 0.5 + 0.5 * Math.sin((t - STUCK_T) * 14);
        for (const sq of ['f7', 'g6']) setTile(sq, RED, (0.4 + 0.3 * blink) * out);
        setTile('h8', RED, 0.55 * out);
      }
    }

    // ---- lời giải ----
    if (t >= SOL_START - 0.2) {
      const fadeAll = 1 - seg(t, 41.4, 42);
      for (let i = 0; i < 64; i++) {
        const tArrive = i === 0 ? SOL_START - 0.2 : SOL_TIMES[i - 1] + stepDur(i - 1) * 0.85;
        if (t < tArrive) break;
        const sq = TOUR[i];
        const done = seg(t, FINISH, FINISH + 0.6);
        setTile(sq, done > 0 ? GREEN : GOLD, (0.3 + 0.1 * done) * fadeAll);
        showLabel(sq, i + 1, seg(t, tArrive, tArrive + 0.1) * (1 - 0.35 * seg(t, FINISH + 1.5, FINISH + 2.5)) * fadeAll);
        if (i > 0) setBeam(tourBeams[i - 1], 1, 0.75 * fadeAll);
      }
      if (t < SOL_END) {
        let k = 0;
        while (k < 62 && t >= SOL_TIMES[k + 1]) k++;
        const p = seg(t, SOL_TIMES[k], SOL_TIMES[k] + stepDur(k) * 0.85);
        if (p < 1 && p > 0) setBeam(tourBeams[k], p, 0.75);
      }
    }
    for (const sq in tiles) tiles[sq].visible = tiles[sq].material.opacity > 0.002;
  }

  overlay.custom = drawOverlay;
  return {
    meta,
    update,
    dispose() {
      overlay.custom = null;
      scene.remove(group);
    },
  };
}
