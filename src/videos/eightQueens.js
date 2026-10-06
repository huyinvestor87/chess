// Kịch bản video TikTok: "Thách đố 8 quân Hậu".
// Mọi thứ là hàm của thời gian t (giây) => phát trực tiếp trong app hoặc render từng khung hình.
import * as THREE from 'three';
import {
  clamp01, seg, smooth, easeOut, lerp, bounce, pop, fade, GOLD_GRAD, sqFR, sqName, text, captionBox, drawFollow, coverBadge,
} from './common.js';

export const meta = {
  id: '8queens',
  name: 'Thách đố 8 quân Hậu',
  duration: 41.5,
  coverTime: 1.6,
};

// Một lời giải: cột a..h, hàng tương ứng
const SOLUTION = ['a1', 'b5', 'c8', 'd6', 'e3', 'f7', 'g2', 'h4'];
const SOL_START = 23.0; // giây bắt đầu đặt lời giải
const SOL_STEP = 1.2; // khoảng cách giữa 2 Hậu

// ---------- tiện ích thời gian ----------


function attacks(sq) {
  const [f0, r0] = sqFR(sq);
  const out = [];
  for (const [df, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    for (let k = 1; k < 8; k++) {
      const f = f0 + df * k, r = r0 + dr * k;
      if (f < 0 || f > 7 || r < 0 || r > 7) break;
      out.push({ sq: sqName(f, r), d: k });
    }
  }
  return out;
}

// ---------- camera keyframes ----------
// az: góc quanh trục Y (0 = phía Trắng), polar: góc từ đỉnh, f: hệ số khoảng cách, target
const CAM = [
  { t: 0, az: 0.42, polar: 1.2, f: 0.5, target: [0, 0.45, 2.4] },
  { t: 2.9, az: 0.28, polar: 1.16, f: 0.5, target: [0, 0.45, 2.3] },
  { t: 5.2, az: 0, polar: 0.78, f: 0.95, target: [0, 0, 1.0] },
  { t: 18.0, az: 0, polar: 0.78, f: 0.95, target: [0, 0, 1.0] },
  { t: 19.6, az: 0, polar: 0.42, f: 0.95, target: [0, 0, 0.7] },
  { t: 32.6, az: 0, polar: 0.42, f: 0.95, target: [0, 0, 0.7] },
  { t: 35.0, az: 0.55, polar: 1.0, f: 0.68, target: [0, 0.2, 0.9] },
  { t: 38.0, az: 0.95, polar: 1.04, f: 0.64, target: [0, 0.2, 0.9] },
  { t: 41.5, az: 1.25, polar: 1.06, f: 0.66, target: [0, 0.2, 0.9] },
];

export function createVideo(api) {
  const { scene, camera, overlay, createPiece, squareToPosition, fitDistance } = api;
  const group = new THREE.Group();
  scene.add(group);

  // 64 ô tô màu
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
  const RED = new THREE.Color('#ef3b2f'), GREEN = new THREE.Color('#33d17a'), GOLD = new THREE.Color('#f2c14e');

  // Tia "ăn" phát sáng giữa 2 ô
  const beamGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  function makeBeam(a, b) {
    const pa = squareToPosition(a), pb = squareToPosition(b);
    const m = new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({
      color: '#ff3b2f', transparent: true, depthWrite: false, opacity: 0, blending: THREE.AdditiveBlending,
    }));
    const len = pa.distanceTo(pb);
    m.position.copy(pa).add(pb).multiplyScalar(0.5);
    m.position.y = 0.02;
    m.rotation.y = -Math.atan2(pb.z - pa.z, pb.x - pa.x);
    m.userData.len = len;
    m.scale.set(len, 1, 0.14);
    m.renderOrder = 4;
    group.add(m);
    return m;
  }
  const beam1 = makeBeam('d4', 'a7');
  const beam2 = makeBeam('d4', 'd8');

  // Quân Hậu: 8 cho lời giải + 1 Hậu minh hoạ (d4) + 2 Hậu "đặt sai"
  const queens = SOLUTION.map(() => createPiece('q'));
  const demo = createPiece('q');
  const wrong1 = createPiece('q');
  const wrong2 = createPiece('q');
  for (const q of [...queens, demo, wrong1, wrong2]) group.add(q);

  const tmp = new THREE.Vector3();
  function place(obj, sq, { y = 0, s = 1, visible = true, shake = 0, spin = 0 } = {}) {
    obj.visible = visible && s > 0.001;
    if (!obj.visible) return;
    squareToPosition(sq, tmp);
    obj.position.set(tmp.x + shake, y, tmp.z);
    obj.scale.setScalar(Math.max(0.001, s));
    obj.rotation.set(0, spin, 0);
  }
  // Hậu rơi xuống ô (nảy nhẹ)
  function dropY(t, t0, dur = 0.55, h = 3.2) {
    const x = seg(t, t0, t0 + dur);
    return h * (1 - bounce(x));
  }

  // ---------- camera ----------
  const sph = new THREE.Spherical();
  const target = new THREE.Vector3();
  function updateCamera(t) {
    let i = 0;
    while (i < CAM.length - 2 && t > CAM[i + 1].t) i++;
    const a = CAM[i], b = CAM[i + 1];
    const k = smooth(seg(t, a.t, b.t));
    const fit = fitDistance();
    target.set(lerp(a.target[0], b.target[0], k), lerp(a.target[1], b.target[1], k), lerp(a.target[2], b.target[2], k));
    sph.set(lerp(a.f, b.f, k) * fit, lerp(a.polar, b.polar, k), lerp(a.az, b.az, k));
    camera.position.setFromSpherical(sph).add(target);
    camera.lookAt(target);
    return target;
  }

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
      const s0 = pop(t, 0.05, 0.4);
      text(ctx, 'HACK NÃO #1', W / 2, H * 0.1, { size: 76, weight: 900, color: '#ffffff', stroke: 12, alpha: cov, scale: s0, glow: 'rgba(255,255,255,0.35)' }, u);
      text(ctx, '8 QUÂN HẬU', W / 2, H * 0.19, { size: 124, weight: 900, gradient: GOLD_GRAD, stroke: 16, alpha: cov, scale: pop(t, 0.25, 0.45), glow: 'rgba(255,190,60,0.6)' }, u);
      text(ctx, 'Xếp sao cho KHÔNG con nào ăn được con nào?', W / 2, H * 0.285, { size: 52, weight: 700, alpha: cov * seg(t, 0.6, 0.9), maxWidth: W * 0.84, stroke: 9 }, u);
      coverBadge(ctx, W, H, u, t, cov * seg(t, 1.0, 1.3));
    }

    // ===== LUẬT =====
    const rA = fade(t, 3.3, 8.0);
    text(ctx, 'LUẬT CHƠI', W / 2, H * 0.1, { size: 54, gradient: GOLD_GRAD, alpha: rA, scale: pop(t, 3.3) }, u);
    captionBox(ctx, 'Đặt 8 quân Hậu lên bàn cờ 8×8', W, H, 0.18, fade(t, 3.6, 8.0), u, { size: 52 });
    captionBox(ctx, 'KHÔNG con nào được ăn con nào!', W, H, 0.765, fade(t, 6.0, 8.0), u, { size: 54, color: '#ffd56a', accent: 'rgba(242,193,78,0.8)' });

    // ===== HẬU ĐI THẾ NÀO =====
    text(ctx, 'HẬU ĂN THẾ NÀO?', W / 2, H * 0.1, { size: 58, gradient: GOLD_GRAD, alpha: fade(t, 8.1, 13.0), scale: pop(t, 8.1) }, u);
    captionBox(ctx, 'Hậu ăn theo hàng ngang, hàng dọc và cả 2 đường chéo', W, H, 0.765, fade(t, 8.4, 10.9), u);
    captionBox(ctx, 'Ô đỏ = KHÔNG được đặt Hậu khác vào', W, H, 0.765, fade(t, 10.9, 13.0), u, { color: '#ff8a80' });

    // ===== THỬ SAI =====
    text(ctx, 'THỬ XẾP XEM...', W / 2, H * 0.1, { size: 58, gradient: GOLD_GRAD, alpha: fade(t, 13.1, 18.0), scale: pop(t, 13.1) }, u);
    for (const [t0, label] of [[14.25, 'BỊ ĂN!'], [16.75, 'SAI RỒI!']]) {
      const a = fade(t, t0, t0 + 1.1, 0.12, 0.3);
      text(ctx, label, W / 2, H * 0.47, { size: 140, weight: 900, color: '#ff3b2f', stroke: 20, alpha: a, scale: pop(t, t0, 0.3), glow: 'rgba(255,40,30,0.7)' }, u);
    }
    captionBox(ctx, 'Nghe thì dễ... nhưng rất dễ sai!', W, H, 0.765, fade(t, 15.3, 18.0), u);

    // ===== ĐẾN LƯỢT BẠN =====
    const yA = fade(t, 18.1, 22.6);
    text(ctx, 'ĐẾN LƯỢT BẠN!', W / 2, H * 0.1, { size: 84, weight: 900, gradient: GOLD_GRAD, stroke: 14, alpha: yA, scale: pop(t, 18.1, 0.4) }, u);
    captionBox(ctx, 'Dừng video và thử tự xếp 8 quân Hậu nhé', W, H, 0.765, fade(t, 18.4, 22.6), u, { accent: 'rgba(242,193,78,0.8)' });
    for (let i = 0; i < 3; i++) {
      const t0 = 19.6 + i;
      const x = seg(t, t0, t0 + 1);
      if (x <= 0 || x >= 1) continue;
      const s = 1.5 - 0.5 * easeOut(Math.min(1, x * 3));
      text(ctx, String(3 - i), W / 2, H * 0.45, { size: 300, weight: 900, gradient: GOLD_GRAD, stroke: 24, alpha: 1 - seg(x, 0.7, 1), scale: s, glow: 'rgba(255,190,60,0.6)' }, u);
    }

    // ===== LỜI GIẢI =====
    const sA = fade(t, SOL_START - 0.4, 33.0);
    text(ctx, 'LỜI GIẢI', W / 2, H * 0.09, { size: 64, weight: 900, gradient: GOLD_GRAD, alpha: sA, scale: pop(t, SOL_START - 0.4) }, u);
    const placed = Math.max(0, Math.min(8, Math.floor((t - SOL_START) / SOL_STEP) + 1));
    if (sA > 0 && placed > 0) {
      const sc = pop(t, SOL_START + (placed - 1) * SOL_STEP, 0.3);
      text(ctx, `${placed} / 8`, W / 2, H * 0.16, { size: 72, weight: 900, color: placed === 8 ? '#33d17a' : '#ffffff', alpha: sA, scale: 0.85 + 0.15 * sc }, u);
    }
    captionBox(ctx, 'Mỗi Hậu mới phải nằm ở ô KHÔNG bị tô đỏ', W, H, 0.765, fade(t, SOL_START, 32.4), u);

    // ===== KẾT =====
    const eA = fade(t, 33.0, 42, 0.3, 0.01);
    text(ctx, 'HOÀN THÀNH!', W / 2, H * 0.12, { size: 120, weight: 900, gradient: ['#eaffef', '#33d17a', '#16a34a'], stroke: 18, alpha: eA, scale: pop(t, 33.0, 0.4), glow: 'rgba(51,209,122,0.6)' }, u);
    captionBox(ctx, 'Có tất cả 92 cách xếp khác nhau!', W, H, 0.69, fade(t, 34.3, 38.4, 0.35, 0.4), u, { size: 54, color: '#ffd56a', accent: 'rgba(242,193,78,0.8)' });
    captionBox(ctx, 'Bạn tìm được cách nào? Comment nhé!', W, H, 0.785, fade(t, 35.5, 38.4, 0.35, 0.4), u, { size: 46 });

    // ===== KÊU GỌI FOLLOW: ngay sau cover (đông người xem nhất) + nhắc lại ở cuối =====
    drawFollow(ctx, W, H, u, t, 3.4, 6.0, 0.765, 0.665);
    drawFollow(ctx, W, H, u, t, 38.3, 42, 0.7, 0.805);
  }

  // ---------- cập nhật theo thời gian ----------
  function update(t) {
    T = t;
    updateCamera(t);

    // Cover + luật: 8 Hậu đứng hàng 1, sau đó bay lên biến mất
    queens.forEach((q, i) => {
      const home = sqName(i, 0);
      const tLeave = 5.4 + i * 0.12;
      const tDrop = SOL_START + i * SOL_STEP;
      if (t < tDrop - 0.01) {
        // đứng ở hàng 1 rồi bay lên
        const x = seg(t, tLeave, tLeave + 0.55);
        place(q, home, { y: 2.5 * easeOut(x), s: 1 - x, spin: x * 3, visible: x < 1 });
        // xuất hiện nối tiếp lúc mở đầu
        if (t < 0.9) place(q, home, { y: dropY(t, i * 0.06, 0.6, 2.2) });
      } else {
        // lời giải: rơi xuống ô
        place(q, SOLUTION[i], { y: dropY(t, tDrop, 0.55) });
      }
    });

    // Hậu minh hoạ ở d4
    {
      const tIn = 7.2, tOut = 18.2;
      if (t < tIn || t > tOut + 0.5) demo.visible = false;
      else {
        const out = seg(t, tOut, tOut + 0.5);
        place(demo, 'd4', { y: dropY(t, tIn, 0.6) + 2.5 * easeOut(out), s: 1 - out });
      }
    }
    // 2 Hậu đặt sai
    for (const [obj, sq, tIn, tHit, tOut] of [[wrong1, 'a7', 13.6, 14.25, 15.2], [wrong2, 'd8', 16.1, 16.75, 17.7]]) {
      if (t < tIn || t > tOut + 0.35) { obj.visible = false; continue; }
      const sh = t > tHit && t < tOut ? Math.sin(t * 60) * 0.06 * (1 - seg(t, tHit, tOut)) : 0;
      const out = seg(t, tOut, tOut + 0.35);
      place(obj, sq, { y: dropY(t, tIn, 0.5), s: 1 - out, shake: sh });
    }
    // Tia "ăn"
    for (const [b, tHit, tOut] of [[beam1, 14.25, 15.4], [beam2, 16.75, 17.9]]) {
      const grow = easeOut(seg(t, tHit - 0.05, tHit + 0.25));
      const a = Math.min(grow, 1 - seg(t, tOut - 0.3, tOut));
      b.material.opacity = a > 0 ? a * (0.75 + 0.25 * Math.sin(t * 25)) : 0;
      b.visible = a > 0;
      b.scale.x = b.userData.len * Math.max(0.001, grow);
    }

    // Tô ô
    for (const sq in tiles) {
      tiles[sq].material.opacity = 0;
    }
    const setTile = (sq, color, op) => {
      const m = tiles[sq].material;
      if (op > m.opacity) { m.color.copy(color); m.opacity = op; }
    };
    // Minh hoạ tầm ăn của Hậu d4: lan dần ra theo khoảng cách
    {
      const a = fade(t, 8.3, 18.2, 0.01, 0.4);
      if (a > 0) {
        for (const { sq, d } of attacks('d4')) {
          const k = easeOut(seg(t, 8.3 + d * 0.14, 8.3 + d * 0.14 + 0.25));
          setTile(sq, RED, 0.5 * k * a * (t > 13 ? 0.75 : 1));
        }
        setTile('d4', GOLD, 0.45 * a * seg(t, 7.6, 8.0));
      }
    }
    // Lời giải: vùng bị ăn tích luỹ + ô an toàn nhấp nháy xanh
    if (t > SOL_START - 0.2) {
      const endFade = 1 - seg(t, 33.4, 34.6);
      SOLUTION.forEach((sq, i) => {
        const t0 = SOL_START + i * SOL_STEP;
        if (t < t0) {
          // ô sắp đặt: nhấp nháy xanh ngay trước khi Hậu rơi
          const pre = seg(t, t0 - 0.45, t0);
          if (pre > 0) setTile(sq, GREEN, 0.6 * pre * endFade);
          return;
        }
        setTile(sq, GOLD, 0.5 * endFade);
        for (const { sq: s2, d } of attacks(sq)) {
          const k = easeOut(seg(t, t0 + 0.35 + d * 0.05, t0 + 0.6 + d * 0.05));
          setTile(s2, RED, 0.3 * k * endFade);
        }
      });
      // khi xong: các ô Hậu sáng xanh
      const ok = seg(t, 32.6, 33.0) * endFade;
      if (ok > 0) SOLUTION.forEach((sq) => { tiles[sq].material.color.copy(GREEN); tiles[sq].material.opacity = 0.6 * ok; });
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
