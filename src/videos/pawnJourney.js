// Clip truyền cảm hứng "Hành trình con Tốt": Tốt trắng d2 → phong Hậu ở e8 (41s, canh theo nhạc The Champion).
// Chuỗi nước đi hợp lệ (đã kiểm tra bằng chess.js): 1. d4 Nc6 2. d5 Nb4 3. dxe6 Kb6 4. e7 Nc6 5. e8=Q – sau đó không quân đen nào canh e8.
import * as THREE from 'three';
import { seg, fade, pop, easeOut, GOLD_GRAD, text, captionBox, drawFollow, drawCover, drawBang } from './common.js';
import { makeGameVideo } from './gameVideo.js';

const D = 41;
const PROMO = 25.8, PROMO_DUR = 1.0, CROWN = PROMO + PROMO_DUR; // 26.8: Hậu xuất hiện
const FEN = '1n6/k7/3pp1pb/7p/8/8/3P1PPP/6K1 w - - 0 1';

// toạ độ ô trên bàn: x = cột - 3.5, z = 3.5 - hàng
const CAM = [
  { t: 0, az: 0.45, polar: 1.28, f: 0.3, target: [-0.5, 0.45, 2.5] },
  { t: 3.0, az: 0.25, polar: 1.24, f: 0.32, target: [-0.5, 0.45, 2.5] },
  { t: 5.4, az: 0.12, polar: 1.06, f: 0.55, target: [-0.5, 0.3, 1.3] },
  { t: 10.4, az: -0.18, polar: 1.0, f: 0.6, target: [-0.6, 0.3, 0.3] },
  { t: 15.6, az: 0.12, polar: 0.98, f: 0.6, target: [-0.1, 0.3, -0.7] },
  { t: 20.6, az: 0.3, polar: 1.0, f: 0.56, target: [0.4, 0.3, -1.9] },
  { t: 25.6, az: 0.22, polar: 1.12, f: 0.4, target: [0.5, 0.55, -3.2] },
  { t: 27.4, az: 0.4, polar: 1.18, f: 0.34, target: [0.5, 0.75, -3.5] },
  { t: 31.0, az: 0.75, polar: 1.2, f: 0.36, target: [0.5, 0.75, -3.5] },
  { t: 36.6, az: 1.7, polar: 1.16, f: 0.42, target: [0.5, 0.6, -3.3] },
  { t: D, az: 2.3, polar: 1.12, f: 0.46, target: [0.5, 0.6, -3.3] },
];

// vị trí Hậu trên màn hình (để vẽ tia sáng / hạt lấp lánh ở overlay)
const crown = { x: 0, y: 0, ok: false };

function goldGlowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 2, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,240,190,1)');
  grd.addColorStop(0.35, 'rgba(255,200,80,0.6)');
  grd.addColorStop(1, 'rgba(255,170,40,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
function beamTexture() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 256;
  const g = c.getContext('2d');
  const v = g.createLinearGradient(0, 0, 0, 256);
  v.addColorStop(0, 'rgba(255,220,140,0)');
  v.addColorStop(0.6, 'rgba(255,220,140,0.55)');
  v.addColorStop(1, 'rgba(255,240,200,0.9)');
  g.fillStyle = v;
  g.fillRect(0, 0, 64, 256);
  // mờ hai mép
  const h = g.createLinearGradient(0, 0, 64, 0);
  h.addColorStop(0, 'rgba(0,0,0,1)');
  h.addColorStop(0.5, 'rgba(0,0,0,0)');
  h.addColorStop(1, 'rgba(0,0,0,1)');
  g.globalCompositeOperation = 'destination-out';
  g.fillStyle = h;
  g.fillRect(0, 0, 64, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const path = (t0, squares) => ({ t0, t1: 36.4, squares: squares.map((sq) => [sq, 'Y', 0.3]) });

export const { meta, createVideo } = makeGameVideo({
  meta: { id: 'pawn-journey', name: 'Hành trình con Tốt – Phong Hậu', duration: D, coverTime: 1.6 },
  fen: FEN,
  hideLastAfter: CROWN,
  moves: [
    { san: 'd4', t: 5.6, dur: 0.8 },
    { san: 'Nc6', t: 7.8, dur: 0.6 },
    { san: 'd5', t: 10.6, dur: 0.7 },
    { san: 'Nb4', t: 12.4, dur: 0.6 },
    { san: 'dxe6', t: 15.8, dur: 0.7 },
    { san: 'Kb6', t: 18.2, dur: 0.5 },
    { san: 'e7', t: 20.8, dur: 0.8 },
    { san: 'Nc6', t: 22.6, dur: 0.6 },
    { san: 'e8=Q', t: PROMO, dur: PROMO_DUR },
  ],
  marks: [
    // dấu chân vàng trên đường đã đi
    path(6.4, ['d2', 'd3', 'd4']),
    path(11.3, ['d5']),
    path(16.5, ['e6']),
    path(21.6, ['e7']),
    // nguy hiểm
    { t0: 8.3, t1: 10.6, arrows: [['c6', 'd4', 'R']], squares: [['d4', 'R', 0.5]], blink: true },
    { t0: 12.9, t1: 15.8, arrows: [['b4', 'd5', 'R'], ['e6', 'd5', 'R']], squares: [['d5', 'R', 0.5]], blink: true },
    { t0: 11.6, t1: 15.0, squares: [['d6', 'R', 0.55]] },
    // tự mở đường
    { t0: 14.9, t1: 16.6, arrows: [['d5', 'e6', 'G']] },
    // thử thách cuối
    { t0: 23.1, t1: 25.8, arrows: [['c6', 'e7', 'R']], squares: [['e7', 'R', 0.5]], blink: true },
    { t0: 23.6, t1: 26.0, squares: [['e8', 'G', 0.55]], blink: true },
  ],
  cam: CAM,
  setup({ group, objs, pieces, squareToPosition, camera }) {
    const qi = pieces.findIndex((p) => p.born > -Infinity);
    const queen = objs[qi];
    // Hậu mới phong phát sáng vàng
    const mats = [];
    queen.traverse((o) => {
      if (o.isMesh) {
        o.material = o.material.clone();
        o.material.emissive = new THREE.Color('#ffb02e');
        mats.push(o.material);
      }
    });
    const pos = squareToPosition('e8');
    const light = new THREE.PointLight('#ffc45a', 0, 6, 1.6);
    light.position.set(pos.x, 1.6, pos.z + 0.6);
    group.add(light);
    const disk = new THREE.Mesh(
      new THREE.PlaneGeometry(2.6, 2.6).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ map: goldGlowTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })
    );
    disk.position.set(pos.x, 0.008, pos.z);
    disk.renderOrder = 3;
    group.add(disk);
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.5, 7, 32, 1, true),
      new THREE.MeshBasicMaterial({ map: beamTexture(), transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })
    );
    beam.position.set(pos.x, 3.5, pos.z);
    beam.renderOrder = 5;
    group.add(beam);
    const v = new THREE.Vector3();
    return (t) => {
      const k = seg(t, CROWN - 0.15, CROWN + 0.25); // bùng sáng
      const settle = 1 - 0.55 * seg(t, CROWN + 0.6, CROWN + 2.2); // dịu lại
      const pulse = 0.85 + 0.15 * Math.sin((t - CROWN) * 3.2);
      const a = k * settle * pulse;
      for (const m of mats) m.emissiveIntensity = 0.35 * a;
      light.intensity = 9 * a;
      disk.material.opacity = a;
      disk.visible = a > 0.001;
      disk.scale.setScalar(0.6 + 0.6 * easeOut(k));
      // cột sáng từ trên chiếu xuống, mờ dần
      const b = seg(t, PROMO + 0.3, CROWN) * (1 - seg(t, CROWN + 0.8, CROWN + 3.5));
      beam.material.opacity = 0.45 * b;
      beam.visible = b > 0.001;
      beam.rotation.y = t * 0.6;
      // vị trí Hậu trên màn hình
      camera.updateMatrixWorld();
      v.set(pos.x, 0.95, pos.z).project(camera);
      crown.x = (v.x + 1) / 2;
      crown.y = (1 - v.y) / 2;
      crown.ok = v.z < 1;
    };
  },
  overlay(ctx, W, H, u, t) {
    drawCover(ctx, W, H, u, t, { kicker: 'NGƯỜI YÊU CỜ', title: 'HÀNH TRÌNH\nCON TỐT', titleSize: 118, sub: 'Quân yếu nhất đi được bao xa?', badge: 'XEM ĐẾN CUỐI!' });
    captionBox(ctx, 'Tốt: quân nhỏ bé nhất. Chỉ đi thẳng, không bao giờ được lùi.', W, H, 0.14, fade(t, 3.4, 5.6), u, { size: 48 });
    drawFollow(ctx, W, H, u, t, 3.4, 6.0, 0.765, 0.665);

    const chapter = (label, t0, t1) => text(ctx, label, W / 2, H * 0.1, { size: 62, weight: 900, gradient: GOLD_GRAD, stroke: 12, alpha: fade(t, t0, t1), scale: pop(t, t0) }, u);
    chapter('BƯỚC 1', 5.7, 10.4);
    captionBox(ctx, 'Bước đầu tiên luôn khó nhất', W, H, 0.765, fade(t, 6.1, 8.2), u, { size: 54 });
    captionBox(ctx, 'Nguy hiểm ập đến ngay lập tức!', W, H, 0.765, fade(t, 8.2, 10.4), u, { size: 54, color: '#ff8a80' });
    chapter('BƯỚC 2', 10.5, 15.6);
    captionBox(ctx, 'Không lùi bước – vẫn tiến lên!', W, H, 0.765, fade(t, 10.7, 12.8), u, { size: 54 });
    captionBox(ctx, 'Phía trước bị chặn, xung quanh bị tấn công...', W, H, 0.765, fade(t, 12.8, 15.6), u, { size: 52, color: '#ff8a80' });
    chapter('BƯỚC 3', 15.7, 20.6);
    captionBox(ctx, 'Không có đường? Hãy tự mở đường!', W, H, 0.765, fade(t, 15.9, 18.3), u, { size: 54, color: '#ffd56a', accent: 'rgba(242,193,78,0.8)' });
    captionBox(ctx, 'Đối thủ vẫn dồn tới...', W, H, 0.765, fade(t, 18.3, 20.6), u, { size: 54 });
    chapter('BƯỚC CUỐI', 20.7, 25.7);
    captionBox(ctx, 'Chỉ còn 1 bước nữa thôi...', W, H, 0.765, fade(t, 20.9, 23.0), u, { size: 54 });
    captionBox(ctx, 'Thử thách cuối cùng!', W, H, 0.765, fade(t, 23.0, 25.7), u, { size: 56, color: '#ff8a80' });

    // khoảnh khắc phong Hậu: chớp sáng + tia sáng + hạt lấp lánh
    const fl = seg(t, CROWN - 0.1, CROWN + 0.05) * (1 - seg(t, CROWN + 0.05, CROWN + 0.9));
    if (fl > 0) {
      const cx = crown.x * W, cy = crown.y * H;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, H * 0.7);
      g.addColorStop(0, `rgba(255,248,220,${0.95 * fl})`);
      g.addColorStop(0.4, `rgba(255,210,110,${0.5 * fl})`);
      g.addColorStop(1, 'rgba(255,190,80,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
    if (crown.ok && t > CROWN - 0.1 && t < 36.6) {
      const cx = crown.x * W, cy = crown.y * H;
      const life = 1 - seg(t, 34.5, 36.6);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      // tia sáng xoay chậm
      const rays = 14, rA = 0.18 * seg(t, CROWN - 0.1, CROWN + 0.4) * life;
      for (let i = 0; i < rays; i++) {
        const ang = (i / rays) * Math.PI * 2 + t * 0.25;
        const len = H * (0.32 + 0.06 * Math.sin(i * 3.7 + t * 2));
        const gr = ctx.createLinearGradient(cx, cy, cx + Math.cos(ang) * len, cy + Math.sin(ang) * len);
        gr.addColorStop(0, `rgba(255,220,130,${rA})`);
        gr.addColorStop(1, 'rgba(255,200,90,0)');
        ctx.fillStyle = gr;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, len, ang - 0.05, ang + 0.05);
        ctx.closePath();
        ctx.fill();
      }
      // hạt lấp lánh bắn ra (tất định theo thời gian)
      for (let i = 0; i < 70; i++) {
        const seed = Math.sin(i * 91.7) * 43758.5453;
        const r1 = seed - Math.floor(seed);
        const r2 = Math.sin(i * 12.9) * 0.5 + 0.5;
        const born = CROWN + (i % 35) * 0.11 + (i >= 35 ? 1.6 : 0);
        const age = t - born;
        if (age < 0 || age > 1.8) continue;
        const ang = r1 * Math.PI * 2;
        const dist = (90 + 300 * r2) * u * easeOut(age / 1.8);
        const px = cx + Math.cos(ang) * dist, py = cy + Math.sin(ang) * dist - age * 40 * u;
        const a = (1 - age / 1.8) * life;
        const sz = (4 + 7 * r2) * u * (1 - age / 1.8 * 0.5);
        ctx.fillStyle = `rgba(255,${200 + Math.round(50 * r1)},120,${a})`;
        ctx.beginPath();
        ctx.arc(px, py, sz, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    drawBang(ctx, W, H, u, t, 'PHONG HẬU!', CROWN, 31.0, { size: 132, colors: ['#fff7d6', '#ffd56a', '#e09a1a'], glow: 'rgba(255,190,60,0.7)' });
    captionBox(ctx, 'Từ quân yếu nhất... thành quân mạnh nhất!', W, H, 0.765, fade(t, CROWN + 0.6, 31.0), u, { size: 52, color: '#ffd56a', accent: 'rgba(242,193,78,0.8)' });

    // thông điệp
    text(ctx, 'Đường đến vinh quang', W / 2, H * 0.11, { size: 70, weight: 900, gradient: GOLD_GRAD, stroke: 14, alpha: fade(t, 31.1, 36.6), scale: pop(t, 31.1, 0.4), glow: 'rgba(255,190,60,0.5)' }, u);
    text(ctx, 'luôn khó khăn...', W / 2, H * 0.165, { size: 60, weight: 800, stroke: 12, alpha: fade(t, 31.7, 36.6) }, u);
    captionBox(ctx, '...nhưng thành quả sẽ tuyệt vời.', W, H, 0.765, fade(t, 33.0, 36.6), u, { size: 58, color: '#ffd56a', accent: 'rgba(242,193,78,0.9)' });

    captionBox(ctx, 'Bạn đang ở bước nào trên hành trình của mình?', W, H, 0.14, fade(t, 36.8, D + 1), u, { size: 48 });
    drawFollow(ctx, W, H, u, t, 36.8, D + 1, 0.7, 0.805);
  },
});
