// Thành phần dùng chung cho các kịch bản video: hiệu ứng thời gian, chữ, khung phụ đề, nút Follow, camera.
import * as THREE from 'three';
import { FONT, wrap, roundRect } from '../overlay.js';

export const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const seg = (t, a, b) => clamp01((t - a) / (b - a));
export const smooth = (x) => x * x * (3 - 2 * x);
export const easeOut = (x) => 1 - Math.pow(1 - x, 3);
export const lerp = (a, b, k) => a + (b - a) * k;
export function bounce(x) {
  const n1 = 7.5625, d1 = 2.75;
  if (x < 1 / d1) return n1 * x * x;
  if (x < 2 / d1) return n1 * (x -= 1.5 / d1) * x + 0.75;
  if (x < 2.5 / d1) return n1 * (x -= 2.25 / d1) * x + 0.9375;
  return n1 * (x -= 2.625 / d1) * x + 0.984375;
}
export function pop(t, t0, dur = 0.35) {
  // phóng to có vượt nhẹ (easeOutBack)
  const x = seg(t, t0, t0 + dur);
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  return 1 + 2.70158 * Math.pow(x - 1, 3) + 1.70158 * Math.pow(x - 1, 2);
}

export const sqFR = (sq) => [sq.charCodeAt(0) - 97, Number(sq[1]) - 1];
export const sqName = (f, r) => String.fromCharCode(97 + f) + (r + 1);

export function text(ctx, str, x, y, { size = 60, weight = 800, color = '#fff', stroke = 10, alpha = 1, scale = 1, align = 'center', gradient = null, maxWidth = 0, lineHeight = 1.18, glow = null } = {}, u) {
  if (alpha <= 0 || scale <= 0) return 0;
  ctx.save();
  ctx.globalAlpha = Math.min(1, alpha);
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.font = `${weight} ${Math.round(size * u)}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  const lines = str.includes('\n') ? str.split('\n') : maxWidth ? wrap(ctx, str, maxWidth) : [str];
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
export function captionBox(ctx, str, W, H, yFrac, alpha, u, { color = '#fff', bg = 'rgba(0,0,0,0.66)', size = 50, accent = null } = {}) {
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
export const fade = (t, a, b, inD = 0.35, outD = 0.35) => Math.min(seg(t, a, a + inD), 1 - seg(t, b - outD, b));
export const GOLD_GRAD = ['#fff7d6', '#ffd56a', '#e09a1a'];

export function drawFollow(ctx, W, H, u, t, t0, t1, boxY, pillY) {
  const fA = fade(t, t0, t1, 0.35, 0.35);
  if (fA <= 0) return;
  captionBox(ctx, 'Follow Người Yêu Cờ để không bỏ lỡ câu đố tiếp theo!', W, H, boxY, fA, u, { size: 54, color: '#ffffff', accent: 'rgba(242,193,78,0.9)', bg: 'rgba(0,0,0,0.72)' });
  // nút "+ FOLLOW" nhịp đập
  const a = fade(t, t0 + 0.4, t1, 0.3, 0.35);
  const beat = 1 + 0.06 * Math.max(0, Math.sin((t - t0 - 0.4) * Math.PI * 2.2));
  const sc = pop(t, t0 + 0.4, 0.35) * beat;
  if (a <= 0 || sc <= 0) return;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.translate(W / 2, H * pillY);
  ctx.scale(sc, sc);
  ctx.font = `900 ${Math.round(56 * u)}px ${FONT}`;
  const label = '+ FOLLOW';
  const w = ctx.measureText(label).width + 90 * u, h = 104 * u;
  roundRect(ctx, -w / 2, -h / 2, w, h, h / 2);
  ctx.shadowColor = 'rgba(254,44,85,0.7)';
  ctx.shadowBlur = 30 * u;
  ctx.fillStyle = '#fe2c55';
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 0, 4 * u);
  ctx.restore();
}

// Nhãn đỏ nghiêng trên cover ("BẠN GIẢI ĐƯỢC KHÔNG?")
export function coverBadge(ctx, W, H, u, t, alpha, label = 'BẠN GIẢI ĐƯỢC KHÔNG?') {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(W / 2, H * 0.83);
  ctx.rotate(-0.04);
  const sc = pop(t, 1.0, 0.4);
  ctx.scale(sc, sc);
  ctx.font = `900 ${Math.round(64 * u)}px ${FONT}`;
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

// Camera chạy theo keyframe { t, az, polar, f (hệ số khoảng cách), target }
export function cameraRig(CAM, camera, fitDistance) {
  const sph = new THREE.Spherical();
  const target = new THREE.Vector3();
  return function updateCamera(t) {
    let i = 0;
    while (i < CAM.length - 2 && t > CAM[i + 1].t) i++;
    const a = CAM[i], b = CAM[i + 1];
    const k = smooth(seg(t, a.t, b.t));
    target.set(lerp(a.target[0], b.target[0], k), lerp(a.target[1], b.target[1], k), lerp(a.target[2], b.target[2], k));
    sph.set(lerp(a.f, b.f, k) * fitDistance(), lerp(a.polar, b.polar, k), lerp(a.az, b.az, k));
    camera.position.setFromSpherical(sph).add(target);
    camera.lookAt(target);
    return target;
  };
}

// ---------- Các khối chữ dùng lại cho video thế cờ ----------
// Cover: "ĐỐ CỜ #n" + tiêu đề vàng + câu hỏi + nhãn đỏ; mờ dần ở 2.7–3.2s
export function drawCover(ctx, W, H, u, t, { num, title, sub, titleSize = 124, badge }) {
  const cov = 1 - seg(t, 2.7, 3.2);
  if (cov <= 0) return;
  const g = ctx.createLinearGradient(0, 0, 0, H * 0.5);
  g.addColorStop(0, `rgba(0,0,0,${0.75 * cov})`);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H * 0.5);
  text(ctx, `ĐỐ CỜ #${num}`, W / 2, H * 0.1, { size: 76, weight: 900, stroke: 12, alpha: cov, scale: pop(t, 0.05, 0.4), glow: 'rgba(255,255,255,0.35)' }, u);
  const two = title.includes('\n');
  // thu nhỏ chữ cho vừa một dòng thay vì tự xuống dòng
  ctx.font = `900 ${Math.round(titleSize * u)}px ${FONT}`;
  const tw = Math.max(...title.split('\n').map((l) => ctx.measureText(l).width));
  titleSize = Math.min(titleSize, titleSize * (W * 0.9) / tw);
  text(ctx, title, W / 2, H * (two ? 0.2 : 0.19), { size: titleSize, weight: 900, gradient: GOLD_GRAD, stroke: 16, alpha: cov, scale: pop(t, 0.25, 0.45), glow: 'rgba(255,190,60,0.6)', maxWidth: W * 0.92 }, u);
  text(ctx, sub, W / 2, H * (two ? 0.305 : 0.285), { size: 56, weight: 700, alpha: cov * seg(t, 0.6, 0.9), maxWidth: W * 0.86, stroke: 9 }, u);
  coverBadge(ctx, W, H, u, t, cov * seg(t, 1.0, 1.3), badge);
}

// "ĐẾN LƯỢT BẠN!" + đếm ngược 3-2-1 bắt đầu ở cd
export function drawYourTurn(ctx, W, H, u, t, t0, t1, cd, caption, title = 'ĐẾN LƯỢT BẠN!', capY = 0.765) {
  text(ctx, title, W / 2, H * 0.1, { size: 84, weight: 900, gradient: GOLD_GRAD, stroke: 14, alpha: fade(t, t0, t1), scale: pop(t, t0, 0.4) }, u);
  if (caption) captionBox(ctx, caption, W, H, capY, fade(t, t0 + 0.3, t1), u, { accent: 'rgba(242,193,78,0.8)', size: 52 });
  for (let i = 0; i < 3; i++) {
    const a = cd + i;
    const x = seg(t, a, a + 1);
    if (x <= 0 || x >= 1) continue;
    text(ctx, String(3 - i), W / 2, H * 0.45, { size: 300, weight: 900, gradient: GOLD_GRAD, stroke: 24, alpha: 1 - seg(x, 0.7, 1), scale: 1.5 - 0.5 * easeOut(Math.min(1, x * 3)), glow: 'rgba(255,190,60,0.6)' }, u);
  }
}

// Chữ lớn bật lên giữa màn hình ("CHIẾU HẾT!", "CÓ!"...)
export function drawBang(ctx, W, H, u, t, str, t0, t1, { y = 0.12, size = 120, colors = ['#fff1f0', '#ff6b5e', '#d61f14'], glow = 'rgba(255,60,40,0.65)' } = {}) {
  text(ctx, str, W / 2, H * y, { size, weight: 900, gradient: colors, stroke: 18, alpha: fade(t, t0, t1, 0.2, 0.35), scale: pop(t, t0, 0.4), glow, maxWidth: W * 0.94 }, u);
}

// Hai lựa chọn kiểu bình chọn: [ 'CÓ', 'KHÔNG' ], đáp án đúng sáng lên lúc reveal
export function drawChoices(ctx, W, H, u, t, t0, t1, labels, correct, reveal, yFrac = 0.62) {
  const a = fade(t, t0, t1);
  if (a <= 0) return;
  const n = labels.length, bw = 380 * u, bh = 130 * u, gap = 60 * u;
  const x0 = W / 2 - (n * bw + (n - 1) * gap) / 2;
  labels.forEach((lab, i) => {
    const sc = pop(t, t0 + i * 0.15, 0.35);
    if (sc <= 0) return;
    const r = seg(t, reveal, reveal + 0.3);
    const ok = i === correct;
    ctx.save();
    ctx.globalAlpha = a * (ok ? 1 : 1 - 0.6 * r);
    const cx = x0 + i * (bw + gap) + bw / 2, cy = H * yFrac;
    ctx.translate(cx, cy);
    const s = sc * (ok ? 1 + 0.12 * r + 0.04 * r * Math.sin((t - reveal) * 8) : 1);
    ctx.scale(s, s);
    roundRect(ctx, -bw / 2, -bh / 2, bw, bh, 30 * u);
    ctx.fillStyle = ok && r > 0 ? `rgba(30,170,90,${0.55 + 0.4 * r})` : 'rgba(0,0,0,0.7)';
    ctx.fill();
    ctx.lineWidth = 6 * u;
    ctx.strokeStyle = ok && r > 0 ? '#5df59a' : 'rgba(242,193,78,0.9)';
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = `900 ${Math.round(64 * u)}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(lab, 0, 4 * u);
    ctx.restore();
  });
}
