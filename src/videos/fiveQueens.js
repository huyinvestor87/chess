// Kịch bản video TikTok: "Hack Não #3 – 5 quân Hậu canh cả bàn cờ".
// Số liệu đã kiểm chứng bằng vét cạn: 1 Hậu ở d4 canh 28 ô; 4 Hậu tối đa canh 62/64 ô;
// có đúng 4.860 cách đặt 5 Hậu canh cả 64 ô (728 cách trong đó 5 Hậu không ăn nhau).
import * as THREE from 'three';
import {
  seg, easeOut, bounce, pop, fade, GOLD_GRAD, sqFR, sqName, text, captionBox, drawFollow, coverBadge, cameraRig,
} from './common.js';

export const meta = {
  id: 'five-queens',
  name: 'Hack Não #3 – 5 Hậu canh cả bàn',
  duration: 42,
  coverTime: 1.6,
};

const COVER_ROW = ['c1', 'd1', 'e1', 'f1', 'g1'];
const ATTEMPT = ['a1', 'e2', 'h5', 'b8']; // 4 Hậu tốt nhất: còn trống c6, d7
const ATTEMPT_HOLES = ['c6', 'd7'];
const SOLUTION = ['a1', 'e2', 'f5', 'h6', 'b8']; // canh đủ 64 ô và không con nào ăn nhau

const DEMO_IN = 7.6;
const ATT_START = 14.0, ATT_STEP = 0.6;
const HOLES_T = 16.8;
const SOL_START = 24.4, SOL_STEP = 1.5;
const FINISH = SOL_START + 4 * SOL_STEP + 1.2; // 31.6

const CAM = [
  { t: 0, az: 0.42, polar: 1.2, f: 0.5, target: [0.5, 0.45, 2.4] },
  { t: 2.9, az: 0.28, polar: 1.16, f: 0.5, target: [0.5, 0.45, 2.3] },
  { t: 5.2, az: 0, polar: 0.78, f: 0.95, target: [0, 0, 1.0] },
  { t: 19.6, az: 0, polar: 0.78, f: 0.95, target: [0, 0, 1.0] },
  { t: 21.2, az: 0, polar: 0.42, f: 0.95, target: [0, 0, 0.7] },
  { t: FINISH, az: 0, polar: 0.42, f: 0.95, target: [0, 0, 0.7] },
  { t: FINISH + 2.6, az: 0.55, polar: 1.0, f: 0.68, target: [0, 0.2, 0.9] },
  { t: 42, az: 1.1, polar: 1.04, f: 0.64, target: [0, 0.2, 0.9] },
];

// các ô một Hậu canh được, kèm khoảng cách (để tô lan dần)
function coverage(sq) {
  const [f0, r0] = sqFR(sq);
  const out = [{ sq, d: 0 }];
  for (const [df, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    for (let k = 1; k < 8; k++) {
      const f = f0 + df * k, r = r0 + dr * k;
      if (f < 0 || f > 7 || r < 0 || r > 7) break;
      out.push({ sq: sqName(f, r), d: k });
    }
  }
  return out;
}
// thời điểm mỗi ô bắt đầu được canh, cho một nhóm Hậu rơi xuống lần lượt
function coverTimes(squares, landTimes) {
  const ct = {};
  squares.forEach((q, i) => {
    for (const { sq, d } of coverage(q)) {
      const tc = landTimes[i] + 0.3 + d * 0.06;
      if (ct[sq] === undefined || tc < ct[sq]) ct[sq] = tc;
    }
  });
  return ct;
}
const DROP = 0.55;
const ATT_LAND = ATTEMPT.map((_, i) => ATT_START + i * ATT_STEP + DROP);
const SOL_LAND = SOLUTION.map((_, i) => SOL_START + i * SOL_STEP + DROP);
const DEMO_CT = coverTimes(['d4'], [DEMO_IN + 0.6]);
const ATT_CT = coverTimes(ATTEMPT, ATT_LAND);
const SOL_CT = coverTimes(SOLUTION, SOL_LAND);
const countAt = (ct, t) => Object.values(ct).filter((x) => x <= t).length;

export function createVideo(api) {
  const { scene, camera, overlay, createPiece, squareToPosition, fitDistance } = api;
  const group = new THREE.Group();
  scene.add(group);
  const updateCamera = cameraRig(CAM, camera, fitDistance);

  const tiles = {};
  const tileGeo = new THREE.PlaneGeometry(0.96, 0.96).rotateX(-Math.PI / 2);
  for (let f = 0; f < 8; f++) for (let r = 0; r < 8; r++) {
    const sq = sqName(f, r);
    const m = new THREE.Mesh(tileGeo, new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, opacity: 0 }));
    squareToPosition(sq, m.position);
    m.position.y = 0.004;
    m.renderOrder = 2;
    group.add(m);
    tiles[sq] = m;
  }
  const BLUE = new THREE.Color('#3d8ff0'), RED = new THREE.Color('#ef3b2f'), GREEN = new THREE.Color('#33d17a'), GOLD = new THREE.Color('#f2c14e');

  // Hậu: 5 cho cover/lời giải, 1 minh hoạ, 4 cho lần thử
  const solQ = SOLUTION.map(() => createPiece('q'));
  const demo = createPiece('q');
  const attQ = ATTEMPT.map(() => createPiece('q'));
  for (const q of [...solQ, demo, ...attQ]) group.add(q);

  const tmp = new THREE.Vector3();
  function place(obj, sq, { y = 0, s = 1, visible = true, spin = 0 } = {}) {
    obj.visible = visible && s > 0.001;
    if (!obj.visible) return;
    squareToPosition(sq, tmp);
    obj.position.set(tmp.x, y, tmp.z);
    obj.scale.setScalar(Math.max(0.001, s));
    obj.rotation.set(0, spin, 0);
  }
  const dropY = (t, t0, dur = DROP, h = 3.2) => h * (1 - bounce(seg(t, t0, t0 + dur)));
  // bay lên rồi biến mất
  const leave = (t, t0) => { const x = seg(t, t0, t0 + 0.55); return { y: 2.5 * easeOut(x), s: 1 - x, spin: x * 3 }; };

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
      text(ctx, 'HACK NÃO #3', W / 2, H * 0.1, { size: 76, weight: 900, stroke: 12, alpha: cov, scale: pop(t, 0.05, 0.4), glow: 'rgba(255,255,255,0.35)' }, u);
      text(ctx, '5 QUÂN HẬU', W / 2, H * 0.19, { size: 132, weight: 900, gradient: GOLD_GRAD, stroke: 16, alpha: cov, scale: pop(t, 0.25, 0.45), glow: 'rgba(255,190,60,0.6)' }, u);
      text(ctx, 'Canh giữ được TẤT CẢ 64 ô?', W / 2, H * 0.285, { size: 56, weight: 700, alpha: cov * seg(t, 0.6, 0.9), maxWidth: W * 0.86, stroke: 9 }, u);
      coverBadge(ctx, W, H, u, t, cov * seg(t, 1.0, 1.3));
    }

    // ===== LUẬT =====
    text(ctx, 'LUẬT CHƠI', W / 2, H * 0.1, { size: 54, gradient: GOLD_GRAD, alpha: fade(t, 3.3, 8.5), scale: pop(t, 3.3) }, u);
    captionBox(ctx, 'Đặt 5 quân Hậu lên bàn cờ', W, H, 0.18, fade(t, 3.6, 8.5), u, { size: 52 });
    drawFollow(ctx, W, H, u, t, 3.4, 6.0, 0.765, 0.665);
    captionBox(ctx, 'Ô nào cũng phải bị ít nhất 1 Hậu canh giữ!', W, H, 0.765, fade(t, 6.0, 8.5), u, { size: 52, color: '#ffd56a', accent: 'rgba(242,193,78,0.8)' });

    // ===== 1 HẬU CANH BAO NHIÊU Ô =====
    text(ctx, '1 HẬU CANH ĐƯỢC MẤY Ô?', W / 2, H * 0.1, { size: 56, gradient: GOLD_GRAD, alpha: fade(t, 8.6, 13.8), scale: pop(t, 8.6) }, u);
    if (t > 8.6 && t < 13.8) text(ctx, `${countAt(DEMO_CT, t)} / 64`, W / 2, H * 0.17, { size: 64, weight: 900, alpha: fade(t, 8.8, 13.8) }, u);
    captionBox(ctx, 'Hậu đứng giữa bàn canh được 28 ô', W, H, 0.765, fade(t, 8.9, 11.4), u, { color: '#9ccbff' });
    captionBox(ctx, 'Vậy cần ÍT NHẤT mấy Hậu để canh hết 64 ô?', W, H, 0.765, fade(t, 11.4, 13.8), u);

    // ===== THỬ VỚI 4 HẬU =====
    text(ctx, 'THỬ VỚI 4 HẬU...', W / 2, H * 0.1, { size: 58, gradient: GOLD_GRAD, alpha: fade(t, 13.9, 19.6), scale: pop(t, 13.9) }, u);
    if (t > 13.9 && t < 19.6) {
      const n = countAt(ATT_CT, t);
      text(ctx, `${n} / 64`, W / 2, H * 0.17, { size: 64, weight: 900, color: t > HOLES_T ? '#ff8a80' : '#ffffff', alpha: fade(t, 14.0, 19.6) }, u);
    }
    text(ctx, 'CÒN 2 Ô TRỐNG!', W / 2, H * 0.47, { size: 118, weight: 900, color: '#ff3b2f', stroke: 20, alpha: fade(t, HOLES_T + 0.1, HOLES_T + 1.3, 0.12, 0.3), scale: pop(t, HOLES_T + 0.1, 0.3), glow: 'rgba(255,40,30,0.7)' }, u);
    captionBox(ctx, '4 Hậu đặt khéo nhất cũng chỉ canh được 62/64 ô', W, H, 0.765, fade(t, HOLES_T + 0.4, 19.6), u, { color: '#ff8a80' });

    // ===== ĐẾN LƯỢT BẠN =====
    text(ctx, 'ĐẾN LƯỢT BẠN!', W / 2, H * 0.1, { size: 84, weight: 900, gradient: GOLD_GRAD, stroke: 14, alpha: fade(t, 19.7, 24.2), scale: pop(t, 19.7, 0.4) }, u);
    captionBox(ctx, 'Dừng video và thử đặt 5 Hậu canh cả bàn nhé', W, H, 0.765, fade(t, 20.0, 24.2), u, { accent: 'rgba(242,193,78,0.8)' });
    for (let i = 0; i < 3; i++) {
      const t0 = 21.1 + i;
      const x = seg(t, t0, t0 + 1);
      if (x <= 0 || x >= 1) continue;
      text(ctx, String(3 - i), W / 2, H * 0.45, { size: 300, weight: 900, gradient: GOLD_GRAD, stroke: 24, alpha: 1 - seg(x, 0.7, 1), scale: 1.5 - 0.5 * easeOut(Math.min(1, x * 3)), glow: 'rgba(255,190,60,0.6)' }, u);
    }

    // ===== LỜI GIẢI =====
    const sA = fade(t, SOL_START - 0.4, FINISH + 0.2);
    text(ctx, 'LỜI GIẢI', W / 2, H * 0.09, { size: 64, weight: 900, gradient: GOLD_GRAD, alpha: sA, scale: pop(t, SOL_START - 0.4) }, u);
    if (sA > 0) {
      const n = countAt(SOL_CT, t);
      text(ctx, `${n} / 64`, W / 2, H * 0.16, { size: 72, weight: 900, color: n === 64 ? '#33d17a' : '#ffffff', alpha: sA }, u);
    }
    captionBox(ctx, 'Mỗi Hậu mới phải canh thêm những ô còn trống', W, H, 0.765, fade(t, SOL_START + 0.3, 29.0), u);
    captionBox(ctx, 'Bonus: 5 Hậu này còn KHÔNG ăn được nhau!', W, H, 0.765, fade(t, 29.0, FINISH + 0.2), u, { color: '#ffd56a' });

    // ===== KẾT =====
    text(ctx, 'HOÀN THÀNH!', W / 2, H * 0.12, { size: 120, weight: 900, gradient: ['#eaffef', '#33d17a', '#16a34a'], stroke: 18, alpha: fade(t, FINISH, 43, 0.3, 0.01), scale: pop(t, FINISH, 0.4), glow: 'rgba(51,209,122,0.6)' }, u);
    captionBox(ctx, 'Có đúng 4.860 cách đặt 5 Hậu như vậy!', W, H, 0.69, fade(t, FINISH + 1.0, 38.4, 0.35, 0.4), u, { size: 52, color: '#ffd56a', accent: 'rgba(242,193,78,0.8)' });
    captionBox(ctx, 'Bạn tìm được cách nào? Comment nhé!', W, H, 0.785, fade(t, FINISH + 2.2, 38.4, 0.35, 0.4), u, { size: 46 });
    drawFollow(ctx, W, H, u, t, 38.3, 43, 0.7, 0.805);
  }

  // ---------- cập nhật theo thời gian ----------
  function update(t) {
    T = t;
    updateCamera(t);

    // 5 Hậu: đứng hàng 1 ở cover → bay đi → rơi xuống ô lời giải
    solQ.forEach((q, i) => {
      const tDrop = SOL_START + i * SOL_STEP;
      if (t < tDrop - 0.01) {
        const l = leave(t, 5.4 + i * 0.12);
        place(q, COVER_ROW[i], { y: t < 0.9 ? dropY(t, i * 0.07, 0.6, 2.2) : l.y, s: l.s, spin: l.spin, visible: l.s > 0 });
      } else {
        place(q, SOLUTION[i], { y: dropY(t, tDrop) });
      }
    });
    // Hậu minh hoạ ở d4
    if (t < DEMO_IN || t > 14.2) demo.visible = false;
    else { const l = leave(t, 13.5); place(demo, 'd4', { y: dropY(t, DEMO_IN, 0.6) + l.y, s: l.s, spin: l.spin }); }
    // 4 Hậu thử
    attQ.forEach((q, i) => {
      const t0 = ATT_START + i * ATT_STEP;
      if (t < t0 || t > 20.0) { q.visible = false; return; }
      const l = leave(t, 19.3 + i * 0.08);
      place(q, ATTEMPT[i], { y: dropY(t, t0) + l.y, s: l.s, spin: l.spin });
    });

    // ---- tô ô ----
    for (const sq in tiles) tiles[sq].material.opacity = 0;
    const setTile = (sq, color, op) => {
      const m = tiles[sq].material;
      if (op > m.opacity) { m.color.copy(color); m.opacity = op; }
    };
    const paint = (ct, queens, a, color = BLUE) => {
      for (const sq in ct) setTile(sq, color, 0.42 * easeOut(seg(t, ct[sq], ct[sq] + 0.2)) * a);
      for (const q of queens) setTile(q, GOLD, 0.55 * a);
    };
    // minh hoạ 1 Hậu
    if (t > DEMO_IN && t < 14.0) paint(DEMO_CT, t > DEMO_IN + 0.6 ? ['d4'] : [], 1 - seg(t, 13.4, 13.9));
    // thử 4 Hậu
    if (t > ATT_START && t < 19.8) {
      const a = 1 - seg(t, 19.2, 19.7);
      paint(ATT_CT, ATTEMPT.filter((_, i) => t > ATT_LAND[i]), a);
      if (t > HOLES_T) {
        const blink = 0.5 + 0.5 * Math.sin((t - HOLES_T) * 14);
        for (const sq of ATTEMPT_HOLES) setTile(sq, RED, (0.45 + 0.35 * blink) * a);
      }
    }
    // lời giải
    if (t > SOL_START) {
      const a = 1 - seg(t, FINISH + 2.0, FINISH + 3.2);
      const done = seg(t, FINISH - 0.2, FINISH + 0.3);
      paint(SOL_CT, SOLUTION.filter((_, i) => t > SOL_LAND[i]), a, done > 0.5 ? GREEN : BLUE);
      // các ô trống còn lại nhấp nháy nhẹ để người xem thấy cần lấp
      if (t < FINISH - 0.3) {
        const blink = 0.5 + 0.5 * Math.sin(t * 9);
        for (let f = 0; f < 8; f++) for (let r = 0; r < 8; r++) {
          const sq = sqName(f, r);
          if (SOL_CT[sq] > t + 0.05) setTile(sq, RED, 0.05 + 0.07 * blink);
        }
      }
      if (done > 0) SOLUTION.forEach((q) => setTile(q, GOLD, 0.6 * a));
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
