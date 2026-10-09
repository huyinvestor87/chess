// Khung kịch bản chung cho các video "thế cờ": xếp quân, đi các nước theo thời gian,
// mũi tên / tô ô, ô Vua bị chiếu. Mỗi video chỉ khai báo dữ liệu + phần chữ (overlay).
import * as THREE from 'three';
import { Chess } from 'chess.js';
import { seg, smooth, easeOut, bounce, lerp, cameraRig } from './common.js';

const COLORS = { G: '#3fc463', R: '#ef3b2f', B: '#3d8ff0', Y: '#f2c14e', W: '#ffffff' };
const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,40,30,1)');
  grd.addColorStop(0.45, 'rgba(255,30,20,0.55)');
  grd.addColorStop(1, 'rgba(255,0,0,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// cfg: { meta, fen, moves: [{san, t, dur}], tries: [{from, to, t, dur, hold}], cam, marks, overlay(ctx, W, H, u, t, info) }
export function makeGameVideo(cfg) {
  const moves = cfg.moves || [];
  const tries = cfg.tries || [];
  const marks = cfg.marks || [];

  // ---- dựng sẵn quỹ đạo của từng quân bằng chess.js ----
  const game = new Chess(cfg.fen || START_FEN);
  const pieces = []; // { type, color, sq0, ev: [{t0, t1, from, to, arc}], gone, promo }
  const at = {}; // ô -> chỉ số quân
  for (const row of game.board()) for (const c of row) {
    if (!c) continue;
    at[c.square] = pieces.length;
    pieces.push({ type: c.type, color: c.color, sq0: c.square, ev: [], gone: Infinity, born: -Infinity });
  }
  const timeline = []; // sau mỗi nước: { t1, from, to, check: ô Vua bị chiếu, mate }
  for (const m of moves) {
    const dur = m.dur ?? 0.55;
    const t0 = m.t, t1 = m.t + dur;
    const mv = game.move(m.san);
    const id = at[mv.from];
    const arc = mv.piece === 'n' ? 0.9 : 0.32;
    pieces[id].ev.push({ t0, t1, from: mv.from, to: mv.to, arc });
    let capSq = null;
    if (mv.flags.includes('e')) capSq = mv.to[0] + mv.from[1];
    else if (mv.captured) capSq = mv.to;
    if (capSq) { pieces[at[capSq]].gone = t1 - dur * 0.15; delete at[capSq]; }
    delete at[mv.from];
    at[mv.to] = id;
    if (mv.flags.includes('k') || mv.flags.includes('q')) {
      const r = mv.from[1];
      const [rf, rt] = mv.flags.includes('k') ? ['h' + r, 'f' + r] : ['a' + r, 'd' + r];
      const rid = at[rf];
      pieces[rid].ev.push({ t0: t0 + dur * 0.25, t1: t1 + dur * 0.25, from: rf, to: rt, arc: 0.9 });
      delete at[rf];
      at[rt] = rid;
    }
    if (mv.promotion) {
      pieces[id].gone = t1 + 0.05;
      at[mv.to] = pieces.length;
      pieces.push({ type: mv.promotion, color: mv.color, sq0: mv.to, ev: [], gone: Infinity, born: t1 });
    }
    let check = null;
    if (game.inCheck()) {
      for (const row of game.board()) for (const c of row) if (c && c.type === 'k' && c.color === game.turn()) check = c.square;
    }
    timeline.push({ t0, t1, from: mv.from, to: mv.to, check, mate: game.isCheckmate() });
  }
  // nước "thử" (không hợp lệ / đi rồi quay lại)
  for (const tr of tries) {
    const p = pieces.find((pc) => pc.sq0 === tr.from) || pieces[at[tr.from]];
    const dur = tr.dur ?? 0.6;
    p.ev.push({ t0: tr.t, t1: tr.t + dur, from: tr.from, to: tr.to, arc: 0.3 });
    p.ev.push({ t0: tr.t + dur + tr.hold, t1: tr.t + dur * 2 + tr.hold, from: tr.to, to: tr.from, arc: 0.3 });
    p.ev.sort((a, b) => a.t0 - b.t0);
  }
  const N = pieces.length;
  // thứ tự rơi xuống lúc mở đầu: hàng gần camera trước
  const dropOrder = pieces.map((p, i) => i).sort((a, b) => (pieces[a].sq0[1] - pieces[b].sq0[1]) || (pieces[a].sq0.charCodeAt(0) - pieces[b].sq0.charCodeAt(0)));
  const dropStart = new Array(N).fill(0);
  const stagger = Math.min(0.03, 0.75 / Math.max(1, N));
  dropOrder.forEach((id, k) => (dropStart[id] = 0.05 + k * stagger));

  const meta = cfg.meta;

  function createVideo(api) {
    const { scene, camera, overlay, createPiece, squareToPosition, fitDistance, arrowShape } = api;
    const group = new THREE.Group();
    scene.add(group);
    const updateCamera = cameraRig(cfg.cam, camera, fitDistance);

    const objs = pieces.map((p) => {
      const o = createPiece(p.type, p.color);
      group.add(o);
      return o;
    });

    const tiles = {};
    const tileGeo = new THREE.PlaneGeometry(0.98, 0.98).rotateX(-Math.PI / 2);
    for (let f = 0; f < 8; f++) for (let r = 1; r <= 8; r++) {
      const sq = String.fromCharCode(97 + f) + r;
      const m = new THREE.Mesh(tileGeo, new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, opacity: 0 }));
      squareToPosition(sq, m.position);
      m.position.y = 0.004;
      m.renderOrder = 2;
      group.add(m);
      tiles[sq] = m;
    }
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 1.6).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ map: glowTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })
    );
    glow.position.y = 0.006;
    glow.renderOrder = 3;
    group.add(glow);

    const arrowMeshes = [];
    marks.forEach((mk) => {
      for (const [from, to, col = 'G'] of mk.arrows || []) {
        const m = new THREE.Mesh(arrowShape(from, to, { w: 0.13, headL: 0.48, headW: 0.34 }), new THREE.MeshBasicMaterial({ color: COLORS[col] || col, transparent: true, depthWrite: false, opacity: 0, side: THREE.DoubleSide }));
        m.position.y = 0.014;
        m.renderOrder = 4;
        group.add(m);
        arrowMeshes.push({ m, mk });
      }
    });

    const a = new THREE.Vector3(), b = new THREE.Vector3();
    function placePiece(i, t) {
      const p = pieces[i], o = objs[i];
      if (t < p.born || t > p.gone + 0.5) { o.visible = false; return; }
      o.visible = true;
      let sq = p.sq0, y = 0, s = 1, spin = 0;
      squareToPosition(sq, a);
      let x = a.x, z = a.z;
      for (const e of p.ev) {
        if (t < e.t0) break;
        squareToPosition(e.from, a);
        squareToPosition(e.to, b);
        const k = seg(t, e.t0, e.t1);
        const kk = smooth(k);
        x = lerp(a.x, b.x, kk);
        z = lerp(a.z, b.z, kk);
        y = e.arc * Math.sin(Math.PI * k);
      }
      // rơi xuống lúc mở đầu (chỉ quân có từ đầu)
      if (p.born === -Infinity) y += 2.6 * (1 - bounce(seg(t, dropStart[i], dropStart[i] + 0.55)));
      else s = easeOut(seg(t, p.born, p.born + 0.3));
      // bị ăn: bay lên, xoay, thu nhỏ
      if (t > p.gone) {
        const k = seg(t, p.gone, p.gone + 0.45);
        y += 1.8 * easeOut(k);
        s = 1 - k;
        spin = k * 4;
      }
      o.visible = s > 0.002;
      o.position.set(x, y, z);
      o.scale.setScalar(Math.max(0.002, s));
      o.rotation.set(0, spin, 0);
    }

    let T = 0;
    const info = { lastMove: null };
    function update(t) {
      T = t;
      updateCamera(t);
      for (let i = 0; i < N; i++) placePiece(i, t);

      for (const sq in tiles) tiles[sq].material.opacity = 0;
      const setTile = (sq, color, op) => {
        const m = tiles[sq].material;
        if (op > m.opacity) { m.color.set(COLORS[color] || color); m.opacity = op; }
      };
      // nước vừa đi
      let last = null;
      for (const e of timeline) if (t >= e.t0) last = e;
      info.lastMove = last;
      const hideLast = cfg.hideLastAfter !== undefined && t > cfg.hideLastAfter;
      if (last && !hideLast) {
        const k = seg(t, last.t0, last.t0 + 0.2);
        setTile(last.from, 'Y', 0.3 * k);
        setTile(last.to, 'Y', 0.3 * k);
      }
      // ô / mũi tên đánh dấu
      for (const mk of marks) {
        const fa = Math.min(seg(t, mk.t0, mk.t0 + 0.3), 1 - seg(t, mk.t1 - 0.3, mk.t1));
        if (fa <= 0) continue;
        const blink = mk.blink ? 0.6 + 0.4 * Math.sin((t - mk.t0) * 12) : 1;
        for (const [sq, col = 'R', op = 0.5] of mk.squares || []) setTile(sq, col, op * fa * blink);
      }
      for (const { m, mk } of arrowMeshes) {
        const fa = Math.min(seg(t, mk.t0, mk.t0 + 0.3), 1 - seg(t, mk.t1 - 0.3, mk.t1));
        m.material.opacity = 0.9 * fa;
        m.visible = fa > 0.001;
      }
      for (const sq in tiles) tiles[sq].visible = tiles[sq].material.opacity > 0.002;
      // Vua bị chiếu
      glow.visible = false;
      if (last && last.check && t >= last.t1 && !hideLast) {
        squareToPosition(last.check, glow.position);
        glow.position.y = 0.006;
        const k = seg(t, last.t1, last.t1 + 0.25);
        const pulse = last.mate ? 0.75 + 0.25 * Math.sin((t - last.t1) * 9) : 0.85;
        glow.material.opacity = k * pulse;
        glow.scale.setScalar(last.mate ? 1.15 : 1);
        glow.visible = true;
      }
    }

    overlay.custom = (ctx, W, H, _now, u) => cfg.overlay(ctx, W, H, u, T, info);
    return {
      meta,
      update,
      dispose() {
        overlay.custom = null;
        scene.remove(group);
      },
    };
  }
  return { meta, createVideo };
}

// Camera chuẩn: cover điện ảnh → nhìn từ phía Trắng → xoay vòng ở đoạn kết
export function standardCam(orbitAt, D, { cover = { az: 0.5, polar: 1.17, f: 0.62, target: [0.3, 0.35, 1.6] }, view = { az: 0, polar: 0.78, f: 0.95, target: [0, 0, 1.0] } } = {}) {
  return [
    { t: 0, ...cover },
    { t: 2.9, ...cover, az: cover.az - 0.16 },
    { t: 5.0, ...view },
    { t: orbitAt, ...view },
    { t: orbitAt + 2.6, az: 0.55, polar: 1.0, f: 0.7, target: [0, 0.2, 0.9] },
    { t: D, az: 1.0, polar: 1.04, f: 0.66, target: [0, 0.2, 0.9] },
  ];
}
