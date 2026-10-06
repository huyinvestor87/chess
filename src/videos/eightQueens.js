// Kịch bản video TikTok: "Thách đố 8 quân Hậu".
// Mọi thứ là hàm của thời gian t (giây) => phát trực tiếp trong app hoặc render từng khung hình.
import * as THREE from 'three';
import { FONT, wrap, roundRect } from '../overlay.js';

export const meta = {
  id: '8queens',
  name: 'Thách đố 8 quân Hậu',
  duration: 38,
  coverTime: 1.6,
};

// Một lời giải: cột a..h, hàng tương ứng
const SOLUTION = ['a1', 'b5', 'c8', 'd6', 'e3', 'f7', 'g2', 'h4'];
const SOL_START = 23.0; // giây bắt đầu đặt lời giải
const SOL_STEP = 1.2; // khoảng cách giữa 2 Hậu

// ---------- tiện ích thời gian ----------
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const seg = (t, a, b) => clamp01((t - a) / (b - a));
const smooth = (x) => x * x * (3 - 2 * x);
const easeOut = (x) => 1 - Math.pow(1 - x, 3);
const lerp = (a, b, k) => a + (b - a) * k;
function bounce(x) {
  const n1 = 7.5625, d1 = 2.75;
  if (x < 1 / d1) return n1 * x * x;
  if (x < 2 / d1) return n1 * (x -= 1.5 / d1) * x + 0.75;
  if (x < 2.5 / d1) return n1 * (x -= 2.25 / d1) * x + 0.9375;
  return n1 * (x -= 2.625 / d1) * x + 0.984375;
}
function pop(t, t0, dur = 0.35) {
  // phóng to có vượt nhẹ (easeOutBack)
  const x = seg(t, t0, t0 + dur);
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  return 1 + 2.70158 * Math.pow(x - 1, 3) + 1.70158 * Math.pow(x - 1, 2);
}

const sqFR = (sq) => [sq.charCodeAt(0) - 97, Number(sq[1]) - 1];
const sqName = (f, r) => String.fromCharCode(97 + f) + (r + 1);

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
  function text(ctx, str, x, y, { size = 60, weight = 800, color = '#fff', stroke = 10, alpha = 1, scale = 1, align = 'center', gradient = null, maxWidth = 0, lineHeight = 1.18, glow = null } = {}, u) {
    if (alpha <= 0 || scale <= 0) return 0;
    ctx.save();
    ctx.globalAlpha = Math.min(1, alpha);
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.font = `${weight} ${Math.round(size * u)}px ${FONT}`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    const lines = maxWidth ? wrap(ctx, str, maxWidth) : [str];
    const lh = size * u * lineHeight;
    const y0 = -((lines.length - 1) * lh) / 2;
    lines.forEach((l, i) => {
      const yy = y0 + i * lh;
      if (stroke) {
        ctx.lineWidth = stroke * u;
        ctx.strokeStyle = 'rgba(0,0,0,0.8)';
        ctx.strokeText(l, 0, yy);
      }
      if (glow) { ctx.shadowColor = glow; ctx.shadowBlur = 30 * u; }
      if (gradient) {
        const g = ctx.createLinearGradient(0, yy - size * u * 0.5, 0, yy + size * u * 0.5);
        gradient.forEach((c, j) => g.addColorStop(j / (gradient.length - 1), c));
        ctx.fillStyle = g;
      } else ctx.fillStyle = color;
      ctx.fillText(l, 0, yy);
      ctx.shadowBlur = 0;
    });
    ctx.restore();
    return lines.length * lh;
  }
  function captionBox(ctx, str, W, H, yFrac, alpha, u, { color = '#fff', bg = 'rgba(0,0,0,0.66)', size = 50, accent = null } = {}) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `700 ${Math.round(size * u)}px ${FONT}`;
    const lines = wrap(ctx, str, W * 0.8);
    const lh = size * 1.3 * u, pad = 30 * u;
    const bw = Math.min(W * 0.92, Math.max(...lines.map((l) => ctx.measureText(l).width)) + pad * 2.4);
    const bh = lines.length * lh + pad * 1.6;
    const y = H * yFrac - bh / 2 + (1 - alpha) * 24 * u;
    roundRect(ctx, W / 2 - bw / 2, y, bw, bh, 26 * u);
    ctx.fillStyle = bg;
    ctx.fill();
    if (accent) {
      ctx.lineWidth = 4 * u;
      ctx.strokeStyle = accent;
      ctx.stroke();
    }
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    lines.forEach((l, i) => ctx.fillText(l, W / 2, y + pad * 0.8 + lh * (i + 0.5)));
    ctx.restore();
  }
  const fade = (t, a, b, inD = 0.35, outD = 0.35) => Math.min(seg(t, a, a + inD), 1 - seg(t, b - outD, b));
  const GOLD_GRAD = ['#fff7d6', '#ffd56a', '#e09a1a'];

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
      text(ctx, 'THÁCH ĐỐ', W / 2, H * 0.1, { size: 64, weight: 800, color: '#ffffff', alpha: cov, scale: s0 }, u);
      text(ctx, '8 QUÂN HẬU', W / 2, H * 0.19, { size: 124, weight: 900, gradient: GOLD_GRAD, stroke: 16, alpha: cov, scale: pop(t, 0.25, 0.45), glow: 'rgba(255,190,60,0.6)' }, u);
      text(ctx, 'Xếp sao cho KHÔNG con nào ăn được con nào?', W / 2, H * 0.285, { size: 52, weight: 700, alpha: cov * seg(t, 0.6, 0.9), maxWidth: W * 0.84, stroke: 9 }, u);
      // nhãn "Bạn làm được không?"
      const a = cov * seg(t, 1.0, 1.3);
      if (a > 0) {
        ctx.save();
        ctx.globalAlpha = a;
        ctx.translate(W / 2, H * 0.83);
        ctx.rotate(-0.04);
        const sc = pop(t, 1.0, 0.4);
        ctx.scale(sc, sc);
        ctx.font = `900 ${Math.round(64 * u)}px ${FONT}`;
        const label = 'BẠN LÀM ĐƯỢC KHÔNG?';
        const w = ctx.measureText(label).width + 70 * u;
        roundRect(ctx, -w / 2, -58 * u, w, 116 * u, 24 * u);
        ctx.fillStyle = '#ef3b2f';
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, 0, 4 * u);
        ctx.restore();
      }
    }

    // ===== LUẬT =====
    const rA = fade(t, 3.3, 8.0);
    text(ctx, 'LUẬT CHƠI', W / 2, H * 0.1, { size: 54, gradient: GOLD_GRAD, alpha: rA, scale: pop(t, 3.3) }, u);
    captionBox(ctx, 'Đặt 8 quân Hậu lên bàn cờ 8×8', W, H, 0.18, fade(t, 3.6, 8.0), u, { size: 52 });
    captionBox(ctx, 'KHÔNG con nào được ăn con nào!', W, H, 0.765, fade(t, 4.6, 8.0), u, { size: 54, color: '#ffd56a', accent: 'rgba(242,193,78,0.8)' });

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
    const eA = fade(t, 33.0, 38.5, 0.3, 0.01);
    text(ctx, 'HOÀN THÀNH!', W / 2, H * 0.12, { size: 120, weight: 900, gradient: ['#eaffef', '#33d17a', '#16a34a'], stroke: 18, alpha: eA, scale: pop(t, 33.0, 0.4), glow: 'rgba(51,209,122,0.6)' }, u);
    captionBox(ctx, 'Có tất cả 92 cách xếp khác nhau!', W, H, 0.69, fade(t, 34.3, 38.5, 0.35, 0.01), u, { size: 54, color: '#ffd56a', accent: 'rgba(242,193,78,0.8)' });
    captionBox(ctx, 'Bạn tìm được cách nào? Comment nhé!', W, H, 0.785, fade(t, 35.5, 38.5, 0.35, 0.01), u, { size: 46 });
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
