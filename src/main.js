import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { Chess } from 'chess.js';

import './style.css';
import { createMaterials, createPieceObject, loadCustomModels, BASE_RADIUS, PIECE_SCALE } from './pieces.js';
import { createBoard, squareToPosition, positionToSquare, TABLE_Y } from './board.js';
import { createStudioEnvironment, createBackgroundTexture } from './studio.js';
import { Overlay } from './overlay.js';
import { Sound } from './sound.js';
import { SAMPLES } from './samples.js';
import * as eightQueens from './videos/eightQueens.js';
import * as knightTour from './videos/knightTour.js';
import * as fiveQueens from './videos/fiveQueens.js';

const VIDEOS = [eightQueens, knightTour, fiveQueens];

// ======================= Cài đặt =======================
const DEFAULTS = {
  aspect: '9:16',
  quality: 1, // 1 = 1080p, 0.667 = 720p
  whiteMetal: 'silver',
  moveDuration: 0.65,
  delay: 1.2,
  reflections: true,
  shadows: true,
  dof: false,
  coords: true,
  sound: true,
  autoClearArrows: true,
  autoQueen: false,
  hintStyle: 'dot', // 'dot' | 'square'
  hintColorDot: '#1b1b20',
  hintColorSquare: '#3fc463',
  hintOpacity: 0.45,
  captureColor: '#ef4a3e',
  captureGlow: true,
  banners: true,
  showTitle: true,
  showCaption: true,
  showMove: true,
  moveStyle: 'vi',
  title: '',
  caption: '',
  fps: 60,
};
const settings = { ...DEFAULTS };
try {
  Object.assign(settings, JSON.parse(localStorage.getItem('chess3d-settings') || '{}'));
} catch { /* bỏ qua */ }
const saveSettings = () => {
  try { localStorage.setItem('chess3d-settings', JSON.stringify(settings)); } catch { /* bỏ qua */ }
};

const ASPECTS = { '9:16': [1080, 1920], '1:1': [1080, 1080], '4:5': [1080, 1350], '16:9': [1920, 1080] };

// ======================= Three.js =======================
const stage = document.getElementById('stage');
const frameEl = document.getElementById('frame');
const overlayCanvas = document.getElementById('overlay');

const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(1);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.domElement.id = 'gl';
frameEl.prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.environment = createStudioEnvironment(renderer);
scene.background = createBackgroundTexture();

const camera = new THREE.PerspectiveCamera(32, 9 / 16, 0.1, 200);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: null };
controls.maxPolarAngle = Math.PI * 0.47;
controls.minDistance = 4;
controls.maxDistance = 60;
controls.autoRotateSpeed = 0.5;

// Ánh sáng
const key = new THREE.DirectionalLight(0xfff4e6, 2.4);
// Đèn chính gần như thẳng đứng => bóng ngắn, gọn, không đè lên quân bên cạnh
key.position.set(2.2, 15, 4.5);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -7.5, right: 7.5, top: 7.5, bottom: -7.5, near: 5, far: 30 });
key.shadow.bias = -0.0003;
key.shadow.normalBias = 0.015;
key.shadow.radius = 4;
scene.add(key);
const rim = new THREE.DirectionalLight(0xdfe8ff, 1.3);
rim.position.set(-6, 6, -9);
scene.add(rim);
scene.add(new THREE.HemisphereLight(0xffffff, 0x202024, 0.25));

const materials = createMaterials();
const board = createBoard();
scene.add(board.group);

// Hậu kỳ
const composerTarget = new THREE.WebGLRenderTarget(1080, 1920, { type: THREE.HalfFloatType, samples: 4 });
const composer = new EffectComposer(renderer, composerTarget);
composer.addPass(new RenderPass(scene, camera));
const bokeh = new BokehPass(scene, camera, { focus: 14, aperture: 0.0025, maxblur: 0.008 });
composer.addPass(bokeh);
composer.addPass(new OutputPass());

const overlay = new Overlay(overlayCanvas);
const sound = new Sound();

// Canvas ghép để quay video
const recCanvas = document.createElement('canvas');
const recCtx = recCanvas.getContext('2d');

let outW = 1080, outH = 1920;
function applySize() {
  const [w, h] = ASPECTS[settings.aspect] || ASPECTS['9:16'];
  outW = Math.round(w * settings.quality / 2) * 2;
  outH = Math.round(h * settings.quality / 2) * 2;
  renderer.setSize(outW, outH, false);
  composer.setSize(outW, outH);
  overlayCanvas.width = recCanvas.width = outW;
  overlayCanvas.height = recCanvas.height = outH;
  camera.aspect = outW / outH;
  camera.updateProjectionMatrix();
  fitFrame();
}
function fitFrame() {
  const r = stage.getBoundingClientRect();
  const pad = 24;
  const s = Math.min((r.width - pad) / outW, (r.height - pad) / outH);
  frameEl.style.width = `${Math.floor(outW * s)}px`;
  frameEl.style.height = `${Math.floor(outH * s)}px`;
}
new ResizeObserver(fitFrame).observe(stage);

// ======================= Hoạt ảnh =======================
const tweens = new Set();
const ease = {
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  out: (t) => 1 - Math.pow(1 - t, 3),
  back: (t) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2),
};
function tween({ dur, delay = 0, update, easing = ease.inOut }) {
  return new Promise((resolve) => {
    tweens.add({ start: performance.now() + delay * 1000, dur: Math.max(0.001, dur) * 1000, update, easing, resolve });
  });
}
function stepTweens(now) {
  for (const tw of tweens) {
    if (now < tw.start) continue;
    const t = Math.min(1, (now - tw.start) / tw.dur);
    tw.update(tw.easing(t), t);
    if (t >= 1) {
      tweens.delete(tw);
      tw.resolve();
    }
  }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ======================= Quân trên bàn =======================
const actors = []; // { type, color, obj, place: {kind:'sq', square} | {kind:'grave', color, idx} }
const UP = new THREE.Quaternion();

function metalFor(color) {
  const whiteIsSilver = settings.whiteMetal === 'silver';
  return (color === 'w') === whiteIsSilver ? materials.silver : materials.gold;
}

function placeTransform(place, type) {
  if (place.kind === 'sq') return { pos: squareToPosition(place.square), quat: UP.clone() };
  // Quân bị ăn nằm trên mặt bàn, phía người ăn
  const side = place.color === 'b' ? 1 : -1;
  const row = Math.floor(place.idx / 8), col = place.idx % 8;
  const x = side * (-3.15 + col * 0.9);
  const z = side * (5.05 + row * 1.7);
  const y = TABLE_Y + BASE_RADIUS[type] * PIECE_SCALE;
  const jitter = Math.sin(place.idx * 12.9898 + (side > 0 ? 3 : 7)) * 0.22;
  const tilt = new THREE.Quaternion().setFromEuler(new THREE.Euler(side * Math.PI / 2, 0, 0));
  const yaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), jitter);
  return { pos: new THREE.Vector3(x, y, z), quat: yaw.multiply(tilt) };
}

function spawnActor(type, color, place, animate) {
  const obj = createPieceObject(type, color, metalFor(color));
  const { pos, quat } = placeTransform(place, type);
  obj.position.copy(pos);
  obj.quaternion.copy(quat);
  const actor = { type, color, obj, place };
  obj.userData.actor = actor;
  scene.add(obj);
  actors.push(actor);
  if (animate) {
    obj.scale.setScalar(0.001);
    return tween({ dur: 0.45, easing: ease.back, update: (k) => obj.scale.setScalar(Math.max(0.001, k)) }).then(() => actor);
  }
  return Promise.resolve(actor);
}

function removeActor(actor, animate) {
  const i = actors.indexOf(actor);
  if (i >= 0) actors.splice(i, 1);
  if (!animate) {
    scene.remove(actor.obj);
    return Promise.resolve();
  }
  const s0 = actor.obj.scale.x;
  return tween({ dur: 0.3, update: (k) => actor.obj.scale.setScalar(Math.max(0.001, s0 * (1 - k))) }).then(() =>
    scene.remove(actor.obj)
  );
}

function animateActor(actor, place, { dur, delay = 0, arc = 0.3, sfx = 'move' }) {
  const obj = actor.obj;
  const { pos, quat } = placeTransform(place, actor.type);
  let p0, q0;
  return tween({
    dur,
    delay,
    update: (k, raw) => {
      if (!p0) {
        p0 = obj.position.clone();
        q0 = obj.quaternion.clone();
      }
      obj.position.lerpVectors(p0, pos, k);
      obj.position.y += arc * Math.sin(Math.PI * raw);
      obj.quaternion.slerpQuaternions(q0, quat, k);
    },
  }).then(() => {
    if (sfx) sound.play(sfx);
  });
}

const sameSquare = (a, sq) => a.place.kind === 'sq' && a.place.square === sq;
const actorAt = (sq) => actors.find((a) => sameSquare(a, sq));
const samePlace = (p1, p2) =>
  p1.kind === p2.kind && (p1.kind === 'sq' ? p1.square === p2.square : p1.color === p2.color && p1.idx === p2.idx);

// Đồng bộ quân 3D theo trạng thái ván cờ (dùng cho đi, lùi, nạp ván...)
async function syncBoard({ hint = null, animate = true } = {}) {
  const targets = [];
  for (const row of game.board()) for (const c of row) if (c) targets.push({ type: c.type, color: c.color, place: { kind: 'sq', square: c.square } });
  const graveCount = { w: 0, b: 0 };
  for (const e of past) {
    if (!e.captured) continue;
    const { type, color } = e.captured;
    targets.push({ type, color, place: { kind: 'grave', color, idx: graveCount[color]++ } });
  }

  const assigned = new Map();
  const used = new Set();
  const assign = (a, t) => { assigned.set(a, t); used.add(t); };
  let promo = null;
  let captureActor = null;
  let mover = null;

  if (hint) {
    const a = actorAt(hint.from);
    const t = targets.find((t) => t.place.kind === 'sq' && t.place.square === hint.to);
    if (a && t && a.color === t.color) {
      assign(a, t);
      mover = a;
      if (a.type !== t.type) promo = { actor: a, target: t };
    }
    if (hint.capturedSquare) {
      const c = actors.find((x) => sameSquare(x, hint.capturedSquare) && x !== a);
      if (c) {
        const graves = targets.filter((t) => t.place.kind === 'grave' && t.color === c.color && t.type === c.type && !used.has(t));
        const t2 = graves[graves.length - 1];
        if (t2) { assign(c, t2); captureActor = c; }
      }
    }
  }
  for (const t of targets) {
    if (used.has(t)) continue;
    const a = actors.find((a) => !assigned.has(a) && a.type === t.type && a.color === t.color && samePlace(a.place, t.place));
    if (a) assign(a, t);
  }
  for (const t of targets) {
    if (used.has(t)) continue;
    const tp = placeTransform(t.place, t.type).pos;
    let best = null, bestD = Infinity;
    for (const a of actors) {
      if (assigned.has(a) || a.type !== t.type || a.color !== t.color) continue;
      const d = a.obj.position.distanceTo(tp);
      if (d < bestD) { bestD = d; best = a; }
    }
    if (best) assign(best, t);
  }

  const jobs = [];
  const dur = settings.moveDuration;
  for (const a of [...actors]) {
    if (!assigned.has(a)) jobs.push(removeActor(a, animate));
  }
  for (const t of targets) {
    if (!used.has(t)) jobs.push(spawnActor(t.type, t.color, t.place, animate));
  }
  for (const [a, t] of assigned) {
    const moved = !samePlace(a.place, t.place);
    a.place = t.place;
    if (!animate) {
      const { pos, quat } = placeTransform(t.place, a.type);
      a.obj.position.copy(pos);
      a.obj.quaternion.copy(quat);
      a.obj.scale.setScalar(1);
      continue;
    }
    if (!moved) {
      // về đúng vị trí (vd. quân đang được nhấc lên)
      const { pos } = placeTransform(t.place, a.type);
      if (a.obj.position.distanceTo(pos) > 1e-3) jobs.push(animateActor(a, t.place, { dur: 0.2, arc: 0, sfx: null }));
      continue;
    }
    if (a === captureActor) {
      jobs.push(animateActor(a, t.place, { dur: dur * 1.25, delay: dur * 0.72, arc: 1.4, sfx: 'drop' }));
    } else if (a === mover) {
      const knight = a.type === 'n';
      const job = animateActor(a, t.place, {
        dur: knight ? dur * 1.1 : dur,
        arc: knight ? 0.9 : 0.35,
        sfx: captureActor ? 'capture' : 'move',
      });
      if (promo) {
        jobs.push(job.then(async () => {
          await removeActor(a, false);
          sound.play('check');
          await spawnActor(promo.target.type, promo.target.color, promo.target.place, true);
        }));
      } else jobs.push(job);
    } else {
      // quân phụ (vd. Xe khi nhập thành) hoặc khi lùi/nạp ván
      const toGrave = t.place.kind === 'grave';
      jobs.push(animateActor(a, t.place, {
        dur: toGrave ? dur * 1.2 : dur,
        delay: hint ? dur * 0.25 : 0,
        arc: toGrave || a.place.kind === 'grave' ? 1.0 : 0.35,
        sfx: hint ? 'move' : null,
      }));
    }
  }
  await Promise.all(jobs);
}

// ======================= Đánh dấu trên bàn =======================
const marks = new THREE.Group();
scene.add(marks);
const flatMat = (color, opacity) =>
  new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide });
const squareGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
const hintSquareGeo = new THREE.PlaneGeometry(0.96, 0.96).rotateX(-Math.PI / 2);
const dotGeo = new THREE.CircleGeometry(0.15, 32).rotateX(-Math.PI / 2);
const ringGeo = new THREE.RingGeometry(0.41, 0.49, 48).rotateX(-Math.PI / 2);
const markRingGeo = new THREE.RingGeometry(0.39, 0.46, 48).rotateX(-Math.PI / 2);

const COLORS = { G: '#3fc463', R: '#ef4a3e', B: '#3d8ff0', Y: '#f2c14e' };

function glowTexture(inner, outer) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, inner);
  g.addColorStop(0.45, inner.replace(/[\d.]+\)$/, '0.45)'));
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const checkGlow = new THREE.Mesh(
  new THREE.PlaneGeometry(1.5, 1.5).rotateX(-Math.PI / 2),
  new THREE.MeshBasicMaterial({ map: glowTexture('rgba(255,40,30,1)', 'rgba(255,0,0,0)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })
);
checkGlow.position.y = 0.006;
checkGlow.visible = false;
scene.add(checkGlow);

let selected = null; // square
let placeTool = null; // null | 'erase' | { type, color } (chế độ tự do)
let legalTargets = new Map(); // square -> move info
let arrows = []; // {from,to,color}
let circles = []; // {sq,color}

function addFlat(geo, mat, sq, y) {
  const m = new THREE.Mesh(geo, mat);
  squareToPosition(sq, m.position);
  m.position.y = y;
  m.renderOrder = 2;
  marks.add(m);
  return m;
}

function arrowShape(from, to) {
  const a = squareToPosition(from), b = squareToPosition(to);
  const dx = b.x - a.x, dz = b.z - a.z;
  const P = (x, z) => new THREE.Vector2(x, z);
  let pts;
  const isL = (Math.abs(dx) === 1 && Math.abs(dz) === 2) || (Math.abs(dx) === 2 && Math.abs(dz) === 1);
  if (isL) {
    const corner = Math.abs(dz) > Math.abs(dx) ? P(a.x, b.z) : P(b.x, a.z);
    pts = [P(a.x, a.z), corner, P(b.x, b.z)];
  } else pts = [P(a.x, a.z), P(b.x, b.z)];
  const w = 0.085, headL = 0.4, headW = 0.25;
  const d0 = pts[1].clone().sub(pts[0]).normalize();
  pts[0].addScaledVector(d0, 0.28);
  const n = pts.length;
  const dl = pts[n - 1].clone().sub(pts[n - 2]).normalize();
  pts[n - 1].addScaledVector(dl, -0.12);
  const tip = pts[n - 1].clone();
  pts[n - 1] = tip.clone().addScaledVector(dl, -headL);
  const perp = (d) => new THREE.Vector2(-d.y, d.x);
  const left = [], right = [];
  for (let i = 0; i < n; i++) {
    let m, len = w;
    if (i === 0) m = perp(pts[1].clone().sub(pts[0]).normalize());
    else if (i === n - 1) m = perp(pts[i].clone().sub(pts[i - 1]).normalize());
    else {
      const n1 = perp(pts[i].clone().sub(pts[i - 1]).normalize());
      const n2 = perp(pts[i + 1].clone().sub(pts[i]).normalize());
      m = n1.clone().add(n2).normalize();
      len = w / m.dot(n1);
    }
    left.push(pts[i].clone().addScaledVector(m, len));
    right.push(pts[i].clone().addScaledVector(m, -len));
  }
  const hp = perp(dl);
  const s = new THREE.Shape();
  s.moveTo(left[0].x, left[0].y);
  for (let i = 1; i < n; i++) s.lineTo(left[i].x, left[i].y);
  s.lineTo(pts[n - 1].x + hp.x * headW, pts[n - 1].y + hp.y * headW);
  s.lineTo(tip.x, tip.y);
  s.lineTo(pts[n - 1].x - hp.x * headW, pts[n - 1].y - hp.y * headW);
  for (let i = n - 1; i >= 0; i--) s.lineTo(right[i].x, right[i].y);
  s.closePath();
  const g = new THREE.ShapeGeometry(s);
  g.rotateX(Math.PI / 2);
  return g;
}

function renderMarks() {
  for (const c of [...marks.children]) {
    marks.remove(c);
    if (c.geometry.userData.temp) c.geometry.dispose();
    c.material.dispose();
  }
  const last = past[past.length - 1];
  if (last) {
    const mat = flatMat('#f2c14e', 0.26);
    if (last.from) addFlat(squareGeo, mat, last.from, 0.003);
    if (last.to) addFlat(squareGeo, mat, last.to, 0.003);
  }
  if (selected) {
    addFlat(squareGeo, flatMat('#ffd36b', 0.42), selected, 0.0035);
    const square = settings.hintStyle === 'square';
    const op = settings.hintOpacity;
    const moveColor = square ? settings.hintColorSquare : settings.hintColorDot;
    for (const [sq, info] of legalTargets) {
      if (info.capture) {
        addFlat(hintSquareGeo, flatMat(settings.captureColor, square ? op : op * 0.5), sq, 0.0038);
        if (!square) addFlat(ringGeo, flatMat(settings.captureColor, Math.min(1, op + 0.4)), sq, 0.004);
        // bắt tốt qua đường: quân bị ăn nằm ở ô khác
        if (info.capturedSquare && info.capturedSquare !== sq) {
          addFlat(hintSquareGeo, flatMat(settings.captureColor, op * 0.6), info.capturedSquare, 0.0038);
        }
      } else if (square) addFlat(hintSquareGeo, flatMat(moveColor, op), sq, 0.0038);
      else addFlat(dotGeo, flatMat(moveColor, Math.min(1, op * 0.85)), sq, 0.004);
    }
  }
  for (const c of circles) addFlat(markRingGeo, flatMat(COLORS[c.color] || COLORS.G, 0.85), c.sq, 0.0045);
  for (const a of arrows) {
    const g = arrowShape(a.from, a.to);
    g.userData.temp = true;
    const m = new THREE.Mesh(g, flatMat(COLORS[a.color] || COLORS.G, 0.82));
    m.position.y = 0.012;
    m.renderOrder = 3;
    marks.add(m);
  }
  // Ô Vua đang bị chiếu
  checkGlow.visible = false;
  if (mode === 'rules' && game.inCheck()) {
    const turn = game.turn();
    for (const row of game.board()) for (const c of row) {
      if (c && c.type === 'k' && c.color === turn) {
        squareToPosition(c.square, checkGlow.position);
        checkGlow.position.y = 0.006;
        checkGlow.visible = true;
      }
    }
  }
}

// ======================= Ván cờ =======================
let game = new Chess();
let mode = 'rules'; // 'rules' | 'free'
let past = []; // nước đã đi
let future = []; // nước có thể "tiến" (từ PGN hoặc sau khi lùi)
let comments = new Map(); // fen -> chú thích PGN
let busy = false;
let playing = false;

const PIECE_VI = { p: 'Tốt', n: 'Mã', b: 'Tượng', r: 'Xe', q: 'Hậu', k: 'Vua' };

function parseComment(text) {
  const out = { text: '', arrows: [], circles: [] };
  if (!text) return out;
  const cal = text.match(/\[%cal\s+([^\]]+)\]/);
  if (cal) for (const t of cal[1].split(',')) {
    const m = t.trim().match(/^([GRBY])([a-h][1-8])([a-h][1-8])$/);
    if (m) out.arrows.push({ color: m[1], from: m[2], to: m[3] });
  }
  const csl = text.match(/\[%csl\s+([^\]]+)\]/);
  if (csl) for (const t of csl[1].split(',')) {
    const m = t.trim().match(/^([GRBY])([a-h][1-8])$/);
    if (m) out.circles.push({ color: m[1], sq: m[2] });
  }
  out.text = text.replace(/\[%[^\]]*\]/g, '').replace(/\s+/g, ' ').trim();
  return out;
}

function fenNow() {
  return game.fen();
}

function applyAnnotations() {
  const c = parseComment(comments.get(fenNow()));
  if (c.arrows.length || c.circles.length) {
    arrows = c.arrows;
    circles = c.circles;
  } else if (settings.autoClearArrows) {
    arrows = [];
    circles = [];
  }
}

function currentCaption() {
  for (let i = past.length - 1; i >= 0; i--) {
    const t = parseComment(comments.get(past[i].fenAfter)).text;
    if (t) return t;
  }
  const first = past.length ? past[0].fenBefore : fenNow();
  return parseComment(comments.get(first)).text;
}

function describeMove(e) {
  if (!e) return '';
  const num = Number(e.fenBefore.split(' ')[5]) || 1;
  if (e.kind === 'place') {
    return e.piece
      ? `Đặt ${PIECE_VI[e.piece]} ${e.color === 'w' ? 'Trắng' : 'Đen'} ở ${e.to}`
      : `Bỏ ${PIECE_VI[e.removed.type]} ở ${e.to}`;
  }
  const prefix = e.kind === 'free' ? '' : e.color === 'w' ? `${num}. ` : `${num}... `;
  if (settings.moveStyle === 'san' && e.san) return prefix + e.san;
  let s;
  if (e.flags?.includes('k')) s = 'Nhập thành cánh Vua';
  else if (e.flags?.includes('q')) s = 'Nhập thành cánh Hậu';
  else {
    s = `${PIECE_VI[e.piece]} ${e.from} → ${e.to}`;
    if (e.captured) s += ` ăn ${PIECE_VI[e.captured.type]}`;
    if (e.promotion) s += `, phong ${PIECE_VI[e.promotion]}`;
  }
  if (e.san?.includes('#')) s += ' – Chiếu hết!';
  else if (e.san?.includes('+')) s += ' – Chiếu!';
  return prefix + s;
}

function refreshOverlay() {
  const pgnText = currentCaption();
  overlay.title = settings.title;
  overlay.setCaption(pgnText || settings.caption);
  overlay.moveText = describeMove(past[past.length - 1]);
  overlay.showTitle = settings.showTitle;
  overlay.showCaption = settings.showCaption;
  overlay.showMove = settings.showMove;
}

function afterPositionChange() {
  applyAnnotations();
  renderMarks();
  refreshOverlay();
  updateUI();
}

async function performAction(action, { fromFuture = false, animate = true } = {}) {
  if (busy && animate) return false;
  const fenBefore = game.fen();
  let entry;
  if (action.kind === 'free') {
    const p = game.get(action.from);
    const t = game.get(action.to);
    if (!p || (t && t.color === p.color)) return false;
    game.remove(action.from);
    if (t) game.remove(action.to);
    game.put(p, action.to);
    entry = {
      kind: 'free', fenBefore, fenAfter: game.fen(), action, from: action.from, to: action.to,
      piece: p.type, color: p.color, captured: t ? { type: t.type, color: t.color } : null,
      capturedSquare: t ? action.to : null,
    };
  } else if (action.kind === 'place') {
    const old = game.get(action.square);
    if (!old && !action.piece) return false;
    if (old) game.remove(action.square);
    if (action.piece) game.put(action.piece, action.square);
    entry = {
      kind: 'place', fenBefore, fenAfter: game.fen(), action, to: action.square,
      piece: action.piece?.type, color: action.piece?.color, removed: old || null, captured: null,
    };
    sound.play(action.piece ? 'move' : 'select');
  } else {
    let m;
    try {
      m = game.move({ from: action.from, to: action.to, promotion: action.promotion });
    } catch {
      return false;
    }
    const ep = m.flags.includes('e');
    entry = {
      kind: 'move', fenBefore, fenAfter: game.fen(),
      action: { kind: 'move', from: m.from, to: m.to, promotion: m.promotion },
      from: m.from, to: m.to, piece: m.piece, color: m.color, san: m.san, flags: m.flags, promotion: m.promotion,
      captured: m.captured ? { type: m.captured, color: m.color === 'w' ? 'b' : 'w' } : null,
      capturedSquare: m.captured ? (ep ? m.to[0] + m.from[1] : m.to) : null,
    };
  }
  if (!fromFuture) future = [];
  past.push(entry);
  clearSelection(false);
  if (!animate) return true;
  afterPositionChange();
  busy = true;
  try {
    await syncBoard({ hint: { from: entry.from, to: entry.to, capturedSquare: entry.capturedSquare } });
  } finally {
    busy = false;
  }
  if (mode === 'rules') {
    if (game.isCheckmate()) {
      sound.play('mate');
      if (settings.banners) overlay.flash('CHIẾU HẾT!', '#ff5a4f');
    } else if (game.isStalemate()) {
      if (settings.banners) overlay.flash('HẾT NƯỚC – HOÀ!', '#9fd0ff');
    } else if (game.inCheck()) {
      sound.play('check');
      if (settings.banners) overlay.flash('CHIẾU!', '#ffd36b');
    }
  }
  updateUI();
  return true;
}

async function undo({ animate = true } = {}) {
  if ((busy && animate) || !past.length) return false;
  const e = past.pop();
  game.load(e.fenBefore, { skipValidation: true });
  future.push(e.action);
  clearSelection(false);
  if (!animate) return true;
  afterPositionChange();
  busy = true;
  try { await syncBoard(); } finally { busy = false; }
  return true;
}

async function redo({ animate = true } = {}) {
  if ((busy && animate) || !future.length) return false;
  const action = future.pop();
  const ok = await performAction(action, { fromFuture: true, animate });
  if (!ok) future.push(action);
  return ok;
}

async function jumpTo(index) {
  if (busy) return;
  stopPlaying();
  while (past.length > index) await undo({ animate: false });
  while (past.length < index && future.length) if (!(await redo({ animate: false }))) break;
  afterPositionChange();
  busy = true;
  try { await syncBoard(); } finally { busy = false; }
}

function resetGame(fen) {
  stopPlaying();
  game = new Chess();
  if (fen) game.load(fen, { skipValidation: true });
  past = [];
  future = [];
  comments = new Map();
  arrows = [];
  circles = [];
  clearSelection(false);
  syncBoard({ animate: false });
  afterPositionChange();
}

function loadText(text) {
  text = text.trim();
  if (!text) return;
  const fenLike = /^([rnbqkpRNBQKP1-8]+\/){7}[rnbqkpRNBQKP1-8]+(\s|$)/.test(text);
  if (fenLike) {
    let fen = text;
    if (fen.split(/\s+/).length < 6) fen = fen.split(/\s+/)[0] + ' w - - 0 1';
    resetGame(fen);
    toast('Đã nạp thế cờ (FEN)');
    return;
  }
  const tmp = new Chess();
  tmp.loadPgn(text);
  const headers = tmp.getHeaders();
  const moves = tmp.history({ verbose: true });
  resetGame(headers.FEN || undefined);
  comments = new Map(tmp.getComments().map((c) => [c.fen, c.comment]));
  future = moves.map((m) => ({ kind: 'move', from: m.from, to: m.to, promotion: m.promotion })).reverse();
  if (headers.Title) settings.title = headers.Title;
  else if (headers.White && headers.White !== '?') settings.title = `${headers.White} – ${headers.Black}`;
  document.getElementById('title').value = settings.title;
  saveSettings();
  afterPositionChange();
  toast(`Đã nạp ${moves.length} nước. Bấm ▶ hoặc → để đi.`);
}

function exportPgn() {
  if (past.some((e) => e.kind !== 'move')) return game.fen();
  const g = new Chess();
  const startFen = past.length ? past[0].fenBefore : game.fen();
  const isStd = startFen === new Chess().fen();
  if (!isStd) g.load(startFen, { skipValidation: true });
  for (const e of past) {
    if (e.kind !== 'move') break;
    g.move({ from: e.from, to: e.to, promotion: e.promotion });
  }
  if (settings.title) g.setHeader('Title', settings.title);
  return g.pgn();
}

// ======================= Phát tự động =======================
async function play() {
  if (playing) return stopPlaying();
  if (!future.length) return;
  playing = true;
  updateUI();
  while (playing && future.length) {
    const before = currentCaption();
    const ok = await redo();
    if (!ok) break;
    const cap = currentCaption();
    const extra = cap && cap !== before ? Math.min(3.5, cap.length * 0.045) : 0;
    const mateExtra = game.isCheckmate() ? 1.5 : 0;
    await sleep((settings.delay + extra + mateExtra) * 1000);
  }
  playing = false;
  updateUI();
}
function stopPlaying() {
  playing = false;
  updateUI();
}

// ======================= Camera =======================
const PRESETS = {
  white: { az: 0, polar: 0.8, f: 0.95, target: [0, 0, 1.1] },
  black: { az: Math.PI, polar: 0.8, f: 0.95, target: [0, 0, -1.1] },
  top: { az: 0, polar: 0.0001, f: 0.92, target: [0, 0, 0.9] },
  cinematic: { az: 0.6, polar: 1.13, f: 0.52, target: [0, 0.35, 1.2] },
  side: { az: Math.PI / 2, polar: 0.82, f: 0.95, target: [0, 0, 0] },
};
let currentPreset = 'white';

function fitDistance() {
  const vfov = THREE.MathUtils.degToRad(camera.fov);
  const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
  return Math.max(5.1 / Math.tan(hfov / 2), 6.2 / Math.tan(vfov / 2));
}

function goToPreset(name, dur = 1.3) {
  const p = PRESETS[name];
  if (!p) return;
  currentPreset = name;
  const flipBase = name === 'white' || name === 'black';
  const target1 = new THREE.Vector3(...p.target);
  const r1 = fitDistance() * p.f;
  const sph0 = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
  const target0 = controls.target.clone();
  let az1 = p.az;
  let daz = az1 - sph0.theta;
  daz = Math.atan2(Math.sin(daz), Math.cos(daz));
  if (!flipBase && name === 'top') daz = Math.atan2(Math.sin(-sph0.theta), Math.cos(-sph0.theta));
  const sph = new THREE.Spherical();
  if (dur === 0) {
    controls.target.copy(target1);
    sph.set(r1, p.polar, sph0.theta + daz);
    camera.position.setFromSpherical(sph).add(target1);
    camera.lookAt(target1);
    return Promise.resolve();
  }
  return tween({
    dur,
    update: (k) => {
      controls.target.lerpVectors(target0, target1, k);
      sph.set(
        THREE.MathUtils.lerp(sph0.radius, r1, k),
        THREE.MathUtils.lerp(sph0.phi, p.polar, k),
        sph0.theta + daz * k
      );
      camera.position.setFromSpherical(sph).add(controls.target);
    },
  });
}

function flipBoard() {
  goToPreset(currentPreset === 'black' ? 'white' : 'black');
}

// ======================= Quay video =======================
let recorder = null;
let recChunks = [];
let recStart = 0;
let recMime = '';

function pickMime() {
  const list = [
    'video/mp4;codecs=avc1.640028,mp4a.40.2',
    'video/mp4;codecs=avc1,mp4a.40.2',
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ];
  return list.find((m) => window.MediaRecorder && MediaRecorder.isTypeSupported(m)) || '';
}

function download(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

const stamp = () => new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

function startRecording() {
  if (recorder) return;
  if (!window.MediaRecorder) return toast('Trình duyệt không hỗ trợ quay video. Hãy dùng Chrome/Edge.');
  composeFrame();
  const stream = recCanvas.captureStream(settings.fps);
  if (settings.sound) {
    const a = sound.stream;
    if (a) a.getAudioTracks().forEach((t) => stream.addTrack(t));
  }
  recMime = pickMime();
  recChunks = [];
  recorder = new MediaRecorder(stream, { mimeType: recMime || undefined, videoBitsPerSecond: 16_000_000 });
  recorder.ondataavailable = (e) => e.data.size && recChunks.push(e.data);
  recorder.onstop = () => {
    const type = recorder.mimeType || recMime || 'video/webm';
    const ext = type.includes('mp4') ? 'mp4' : 'webm';
    download(new Blob(recChunks, { type }), `co-vua-${stamp()}.${ext}`);
    recorder = null;
    updateUI();
    toast(ext === 'webm' ? 'Đã lưu video .webm (CapCut mở được; cần MP4 thì đổi bằng HandBrake/ffmpeg)' : 'Đã lưu video MP4');
  };
  recorder.start(250);
  recStart = performance.now();
  updateUI();
}
function stopRecording() {
  if (recorder && recorder.state !== 'inactive') recorder.stop();
}

async function recordWholeGame() {
  if (recorder || busy) return;
  if (!past.length && !future.length) return toast('Chưa có nước nào. Hãy nạp PGN hoặc chọn ván mẫu trước.');
  stopPlaying();
  await jumpTo(0);
  arrows = []; circles = [];
  afterPositionChange();
  startRecording();
  await sleep(1600);
  await play();
  await sleep(2600);
  stopRecording();
}

function composeFrame() {
  recCtx.drawImage(renderer.domElement, 0, 0, outW, outH);
  recCtx.drawImage(overlayCanvas, 0, 0, outW, outH);
}

function screenshot() {
  renderFrame(performance.now());
  composeFrame();
  recCanvas.toBlob((b) => download(b, `co-vua-${stamp()}.png`), 'image/png');
}

// ======================= Nhập liệu =======================
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const boardPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

function squareFromEvent(e) {
  const r = renderer.domElement.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const objs = actors.filter((a) => a.place.kind === 'sq').map((a) => a.obj);
  const hit = raycaster.intersectObjects(objs, true)[0];
  if (hit) {
    let o = hit.object;
    while (o && !o.userData.actor) o = o.parent;
    if (o) return o.userData.actor.place.square;
  }
  const p = new THREE.Vector3();
  if (raycaster.ray.intersectPlane(boardPlane, p)) return positionToSquare(p.x, p.z);
  return null;
}

function liftActor(a, up) {
  if (!a) return;
  const y0 = a.obj.position.y;
  const y1 = up ? 0.22 : 0;
  tween({ dur: 0.16, easing: ease.out, update: (k) => (a.obj.position.y = THREE.MathUtils.lerp(y0, y1, k)) });
}

// Quân có thể bị ăn: đổi tạm sang vật liệu phát sáng
const threatMats = new Map(); // color -> material
let threatened = []; // actors đang phát sáng
function threatMaterial(color) {
  const base = metalFor(color);
  let m = threatMats.get(base);
  if (!m) {
    m = base.clone();
    threatMats.set(base, m);
  }
  m.emissive.set(settings.captureColor);
  return m;
}
function setThreatGlow(squares) {
  for (const a of threatened) a.obj.traverse((o) => o.isMesh && (o.material = metalFor(a.color)));
  threatened = [];
  if (!settings.captureGlow) return;
  for (const sq of squares) {
    const a = actorAt(sq);
    if (!a) continue;
    const mat = threatMaterial(a.color);
    a.obj.traverse((o) => o.isMesh && (o.material = mat));
    threatened.push(a);
  }
}

function clearSelection(render = true) {
  setThreatGlow([]);
  if (selected) liftActor(actorAt(selected), false);
  selected = null;
  legalTargets = new Map();
  if (render) renderMarks();
}

// Các ô quân có thể đi theo cách đi của nó (không xét lượt, không xét chiếu) – dùng cho chế độ tự do
function pseudoMoves(sq) {
  const out = new Map();
  const p = game.get(sq);
  if (!p) return out;
  const f0 = sq.charCodeAt(0) - 97, r0 = Number(sq[1]) - 1;
  const at = (f, r) => (f < 0 || f > 7 || r < 0 || r > 7 ? undefined : String.fromCharCode(97 + f) + (r + 1));
  const tryAdd = (s) => {
    const t = game.get(s);
    if (t && t.color === p.color) return false;
    out.set(s, { capture: !!t });
    return !t;
  };
  const slide = (dirs) => {
    for (const [df, dr] of dirs) {
      for (let k = 1; k < 8; k++) {
        const s = at(f0 + df * k, r0 + dr * k);
        if (!s || !tryAdd(s)) break;
      }
    }
  };
  const step = (dirs) => dirs.forEach(([df, dr]) => { const s = at(f0 + df, r0 + dr); if (s) tryAdd(s); });
  const ORTHO = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const DIAG = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  switch (p.type) {
    case 'r': slide(ORTHO); break;
    case 'b': slide(DIAG); break;
    case 'q': slide([...ORTHO, ...DIAG]); break;
    case 'k': step([...ORTHO, ...DIAG]); break;
    case 'n': step([[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]]); break;
    case 'p': {
      const dir = p.color === 'w' ? 1 : -1;
      const one = at(f0, r0 + dir);
      if (one && !game.get(one)) {
        out.set(one, { capture: false });
        const two = at(f0, r0 + 2 * dir);
        if ((p.color === 'w' ? r0 === 1 : r0 === 6) && two && !game.get(two)) out.set(two, { capture: false });
      }
      for (const df of [-1, 1]) {
        const s = at(f0 + df, r0 + dir);
        const t = s && game.get(s);
        if (t && t.color !== p.color) out.set(s, { capture: true });
      }
      break;
    }
  }
  return out;
}

// Ô đích hợp lệ khi đi/thả quân
function canMoveTo(from, to) {
  if (!from || !to || from === to) return false;
  if (mode === 'rules') return legalTargets.has(to);
  const p = game.get(from), t = game.get(to);
  return !!p && !(t && t.color === p.color);
}

async function moveSelected(to) {
  const from = selected;
  stopPlaying();
  if (mode === 'free') return performAction({ kind: 'free', from, to });
  let promotion;
  if (legalTargets.get(to).promotion) promotion = settings.autoQueen ? 'q' : await askPromotion(game.turn());
  if (promotion === null) { clearSelection(); return syncBoard(); }
  return performAction({ kind: 'move', from, to, promotion });
}

function select(sq) {
  clearSelection(false);
  selected = sq;
  legalTargets = new Map();
  if (mode === 'rules') {
    for (const m of game.moves({ square: sq, verbose: true })) {
      const ep = m.flags.includes('e');
      legalTargets.set(m.to, {
        capture: !!m.captured, promotion: !!m.promotion,
        capturedSquare: m.captured ? (ep ? m.to[0] + m.from[1] : m.to) : null,
      });
    }
  } else {
    legalTargets = pseudoMoves(sq);
  }
  setThreatGlow([...legalTargets].filter(([, i]) => i.capture).map(([s, i]) => i.capturedSquare || s));
  liftActor(actorAt(sq), true);
  sound.play('select');
  renderMarks();
}

async function handleClick(sq) {
  if (busy || !sq) return;
  if (mode === 'free' && placeTool) {
    stopPlaying();
    const cur = game.get(sq);
    if (placeTool === 'erase') return cur && performAction({ kind: 'place', square: sq, piece: null });
    if (cur && cur.type === placeTool.type && cur.color === placeTool.color) {
      return performAction({ kind: 'place', square: sq, piece: null });
    }
    return performAction({ kind: 'place', square: sq, piece: { ...placeTool } });
  }
  if (selected && canMoveTo(selected, sq)) return moveSelected(sq);
  const p = game.get(sq);
  if (p && sq !== selected && (mode === 'free' || p.color === game.turn())) return select(sq);
  clearSelection();
}

let pointerStart = null;
let drag = null; // { from, actor, active }
const dragPoint = new THREE.Vector3();
const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.35);

function pointerToPlane(e, plane, out) {
  const r = renderer.domElement.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  return raycaster.ray.intersectPlane(plane, out);
}

// pointerdown chạy ở pha capture để kịp tắt xoay camera khi bắt đầu kéo quân
renderer.domElement.addEventListener('pointerdown', (e) => {
  sound.ensure();
  const sq = squareFromEvent(e);
  pointerStart = { x: e.clientX, y: e.clientY, button: e.button, sq, shift: e.shiftKey, alt: e.altKey, ctrl: e.ctrlKey };
  drag = null;
  if (e.button !== 0 || busy || !sq || (mode === 'free' && placeTool)) return;
  const p = game.get(sq);
  const a = actorAt(sq);
  if (p && a && (mode === 'free' || p.color === game.turn())) {
    controls.enabled = false;
    drag = { from: sq, actor: a, active: false };
  }
}, { capture: true });

window.addEventListener('pointermove', (e) => {
  if (!drag || !pointerStart) return;
  if (!drag.active) {
    if (Math.hypot(e.clientX - pointerStart.x, e.clientY - pointerStart.y) < 6) return;
    drag.active = true;
    if (selected !== drag.from) select(drag.from);
  }
  if (pointerToPlane(e, dragPlane, dragPoint)) {
    drag.actor.obj.position.set(dragPoint.x, 0.35, dragPoint.z);
  }
});

window.addEventListener('pointerup', async (e) => {
  if (!drag) return;
  const d = drag;
  drag = null;
  controls.enabled = true;
  if (!d.active) return; // chỉ là click -> để handler click xử lý
  pointerStart = null;
  const p = pointerToPlane(e, boardPlane, dragPoint);
  const to = p ? positionToSquare(dragPoint.x, dragPoint.z) : null;
  if (to && canMoveTo(d.from, to)) return moveSelected(to);
  if (!to && mode === 'free') {
    // kéo ra ngoài bàn = bỏ quân
    clearSelection(false);
    await performAction({ kind: 'place', square: d.from, piece: null });
    return;
  }
  clearSelection();
  syncBoard(); // trả quân về chỗ cũ
});

renderer.domElement.addEventListener('pointerup', (e) => {
  if (!pointerStart) return;
  const s = pointerStart;
  pointerStart = null;
  const moved = Math.hypot(e.clientX - s.x, e.clientY - s.y);
  if (s.button === 0 && moved < 6) {
    if (settings.autoClearArrows && (arrows.length || circles.length) && !comments.size) {
      arrows = []; circles = [];
    }
    handleClick(s.sq);
  } else if (s.button === 2) {
    const end = squareFromEvent(e);
    if (!s.sq || !end) return;
    const color = s.shift ? 'R' : s.alt ? 'B' : s.ctrl ? 'Y' : 'G';
    if (s.sq === end) {
      const i = circles.findIndex((c) => c.sq === end);
      if (i >= 0 && circles[i].color === color) circles.splice(i, 1);
      else { if (i >= 0) circles.splice(i, 1); circles.push({ sq: end, color }); }
    } else {
      const i = arrows.findIndex((a) => a.from === s.sq && a.to === end);
      if (i >= 0 && arrows[i].color === color) arrows.splice(i, 1);
      else { if (i >= 0) arrows.splice(i, 1); arrows.push({ from: s.sq, to: end, color }); }
    }
    renderMarks();
  }
});
renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());

// Hộp chọn phong cấp
function askPromotion(color) {
  const box = document.getElementById('promo');
  box.innerHTML = '';
  const glyphs = color === 'w' ? { q: '♕', r: '♖', b: '♗', n: '♘' } : { q: '♛', r: '♜', b: '♝', n: '♞' };
  return new Promise((resolve) => {
    for (const [t, g] of Object.entries(glyphs)) {
      const b = document.createElement('button');
      b.textContent = g;
      b.title = PIECE_VI[t];
      b.onclick = () => { box.hidden = true; resolve(t); };
      box.appendChild(b);
    }
    const cancel = document.createElement('button');
    cancel.textContent = '✕';
    cancel.className = 'cancel';
    cancel.onclick = () => { box.hidden = true; resolve(null); };
    box.appendChild(cancel);
    box.hidden = false;
  });
}

// ======================= Giao diện =======================
const $ = (id) => document.getElementById(id);

function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), 3200);
}

const GLYPH = { w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' }, b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' } };
function actionLabel(a, san) {
  if (san) return san;
  if (a.kind === 'place') return a.piece ? `+${GLYPH[a.piece.color][a.piece.type]}${a.square}` : `✕${a.square}`;
  return `${a.from}-${a.to}`;
}

function updateUI() {
  labelFuture();
  $('btn-play').textContent = playing ? '⏸' : '▶';
  $('btn-play').title = playing ? 'Dừng (Space)' : 'Tự động đi (Space)';
  $('btn-prev').disabled = !past.length;
  $('btn-start').disabled = !past.length;
  $('btn-next').disabled = !future.length;
  $('btn-end').disabled = !future.length;
  $('btn-play').disabled = !future.length && !playing;
  const recBtn = $('btn-rec');
  recBtn.textContent = recorder ? '■ Dừng quay' : '● Quay video';
  recBtn.classList.toggle('recording', !!recorder);
  $('rec-indicator').hidden = !recorder;
  $('turn').textContent =
    mode === 'free' ? 'Chế độ tự do' : game.isGameOver() ? (game.isCheckmate() ? 'Chiếu hết' : 'Hoà') : game.turn() === 'w' ? 'Lượt Trắng' : 'Lượt Đen';

  // Danh sách nước
  const list = $('moves');
  list.innerHTML = '';
  const all = [...past.map((e) => ({ label: actionLabel(e.action, e.san), done: true })),
    ...[...future].reverse().map((a) => ({ label: actionLabel(a, a.san), done: false }))];
  const startNum = Number((past[0]?.fenBefore || game.fen()).split(' ')[5]) || 1;
  const startBlack = (past[0]?.fenBefore || game.fen()).split(' ')[1] === 'b';
  all.forEach((m, i) => {
    const ply = i + (startBlack ? 1 : 0);
    if (ply % 2 === 0) {
      const n = document.createElement('span');
      n.className = 'num';
      n.textContent = `${startNum + Math.floor(ply / 2)}.`;
      list.appendChild(n);
    } else if (i === 0) {
      const n = document.createElement('span');
      n.className = 'num';
      n.textContent = `${startNum}...`;
      list.appendChild(n);
    }
    const b = document.createElement('button');
    b.textContent = m.label;
    b.className = 'mv' + (m.done ? ' done' : '') + (i === past.length - 1 ? ' cur' : '');
    b.onclick = () => jumpTo(i + 1);
    list.appendChild(b);
  });
  const cur = list.querySelector('.cur');
  if (cur) cur.scrollIntoView({ block: 'nearest' });
}

// Nhãn SAN cho các nước "tương lai" (tính từ vị trí hiện tại)
function labelFuture() {
  const g = new Chess();
  try { g.load(game.fen(), { skipValidation: true }); } catch { return; }
  for (let i = future.length - 1; i >= 0; i--) {
    const a = future[i];
    if (a.kind !== 'move') break;
    try { a.san = g.move({ from: a.from, to: a.to, promotion: a.promotion }).san; } catch { break; }
  }
}

function bindCheckbox(id, key, onChange) {
  const el = $(id);
  el.checked = !!settings[key];
  el.addEventListener('change', () => {
    settings[key] = el.checked;
    saveSettings();
    onChange?.(el.checked);
  });
}
function bindSelect(id, key, onChange, parse = (v) => v) {
  const el = $(id);
  el.value = String(settings[key]);
  el.addEventListener('change', () => {
    settings[key] = parse(el.value);
    saveSettings();
    onChange?.(settings[key]);
  });
}
function bindRange(id, key, onChange) {
  const el = $(id);
  const out = $(id + '-val');
  el.value = settings[key];
  const show = () => out && (out.textContent = Number(el.value).toFixed(2).replace(/\.?0+$/, '') + 's');
  show();
  el.addEventListener('input', () => {
    settings[key] = Number(el.value);
    show();
    saveSettings();
    onChange?.(settings[key]);
  });
}

function setPlaceTool(tool) {
  placeTool = tool;
  document.querySelectorAll('#palette button').forEach((b) => {
    const t = b.dataset.tool;
    const on = tool === 'erase' ? t === 'erase' : tool && t === tool.color + tool.type;
    b.classList.toggle('active', !!on);
  });
  renderer.domElement.style.cursor = tool ? 'copy' : '';
  if (tool) clearSelection();
}

function setupFreeTools() {
  const pal = $('palette');
  for (const color of ['w', 'b']) {
    for (const type of ['k', 'q', 'r', 'b', 'n', 'p']) {
      const b = document.createElement('button');
      b.textContent = GLYPH[color][type];
      b.title = `Đặt ${PIECE_VI[type]} ${color === 'w' ? 'Trắng' : 'Đen'}`;
      b.dataset.tool = color + type;
      b.onclick = () => setPlaceTool(placeTool && placeTool.color === color && placeTool.type === type ? null : { color, type });
      pal.appendChild(b);
    }
  }
  const er = document.createElement('button');
  er.textContent = '🧽';
  er.title = 'Cục tẩy: click quân để bỏ';
  er.dataset.tool = 'erase';
  er.onclick = () => setPlaceTool(placeTool === 'erase' ? null : 'erase');
  pal.appendChild(er);

  $('btn-empty').onclick = () => { setPlaceTool(null); resetGame('8/8/8/8/8/8/8/8 w - - 0 1'); };
  $('btn-initial').onclick = () => { setPlaceTool(null); resetGame(); };
  $('btn-turn').onclick = () => {
    const parts = game.fen().split(' ');
    parts[1] = parts[1] === 'w' ? 'b' : 'w';
    parts[3] = '-';
    game.load(parts.join(' '), { skipValidation: true });
    toast(parts[1] === 'w' ? 'Lượt đi tiếp theo: Trắng' : 'Lượt đi tiếp theo: Đen');
    afterPositionChange();
  };
  $('free-tools').hidden = mode !== 'free';
}

function setupHintControls() {
  const style = $('hint-style'), color = $('hint-color'), cap = $('capture-color'), op = $('hint-opacity');
  const rerender = () => { if (selected) select(selected); else renderMarks(); };
  const syncColor = () => (color.value = settings.hintStyle === 'square' ? settings.hintColorSquare : settings.hintColorDot);
  style.value = settings.hintStyle;
  syncColor();
  cap.value = settings.captureColor;
  op.value = settings.hintOpacity;
  style.onchange = () => { settings.hintStyle = style.value; syncColor(); saveSettings(); rerender(); };
  color.oninput = () => {
    settings[settings.hintStyle === 'square' ? 'hintColorSquare' : 'hintColorDot'] = color.value;
    saveSettings();
    rerender();
  };
  cap.oninput = () => { settings.captureColor = cap.value; saveSettings(); rerender(); };
  op.oninput = () => { settings.hintOpacity = Number(op.value); saveSettings(); rerender(); };
  bindCheckbox('opt-capture-glow', 'captureGlow', rerender);
  $('btn-hint-reset').onclick = () => {
    for (const k of ['hintStyle', 'hintColorDot', 'hintColorSquare', 'hintOpacity', 'captureColor', 'captureGlow']) settings[k] = DEFAULTS[k];
    style.value = settings.hintStyle; syncColor(); cap.value = settings.captureColor; op.value = settings.hintOpacity;
    $('opt-capture-glow').checked = settings.captureGlow;
    saveSettings();
    rerender();
  };
}

function setupUI() {
  $('btn-new').onclick = () => { resetGame(); settings.caption = ''; $('caption').value = ''; refreshOverlay(); };
  $('btn-prev').onclick = () => { stopPlaying(); undo(); };
  $('btn-next').onclick = () => { stopPlaying(); redo(); };
  $('btn-start').onclick = () => jumpTo(0);
  $('btn-end').onclick = () => jumpTo(past.length + future.length);
  $('btn-play').onclick = () => play();
  $('btn-flip').onclick = flipBoard;
  $('btn-rec').onclick = () => (recorder ? stopRecording() : startRecording());
  $('btn-rec-all').onclick = recordWholeGame;
  $('btn-shot').onclick = screenshot;
  $('btn-hide').onclick = () => document.body.classList.toggle('hide-ui');
  setupFreeTools();
  $('btn-clear-marks').onclick = () => { arrows = []; circles = []; renderMarks(); };

  const sel = $('samples');
  SAMPLES.forEach((s, i) => {
    const o = document.createElement('option');
    o.value = i;
    o.textContent = s.name;
    sel.appendChild(o);
  });
  sel.onchange = () => {
    if (sel.value === '') return;
    const s = SAMPLES[Number(sel.value)];
    $('pgn').value = s.pgn;
    try { loadText(s.pgn); } catch (e) { toast('Lỗi PGN: ' + e.message); }
  };
  $('btn-load').onclick = () => {
    try { loadText($('pgn').value); } catch (e) { toast('Không đọc được PGN/FEN: ' + e.message); }
  };
  $('btn-export').onclick = async () => {
    const pgn = exportPgn();
    $('pgn').value = pgn;
    try { await navigator.clipboard.writeText(pgn); toast('Đã chép PGN vào clipboard'); } catch { toast('PGN đã hiện trong ô bên dưới'); }
  };

  document.querySelectorAll('[data-cam]').forEach((b) => (b.onclick = () => goToPreset(b.dataset.cam)));
  bindCheckbox('auto-rotate', 'autoRotate', (v) => (controls.autoRotate = v));
  controls.autoRotate = !!settings.autoRotate;

  document.querySelectorAll('input[name=mode]').forEach((r) => {
    r.checked = r.value === mode;
    r.onchange = () => {
      mode = r.value;
      setPlaceTool(null);
      $('free-tools').hidden = mode !== 'free';
      clearSelection();
      if (mode === 'rules') {
        // đảm bảo trạng thái hợp lệ cho chess.js
        try { game.load(game.fen()); } catch { toast('Thế cờ hiện tại không hợp lệ theo luật – vẫn đi được ở chế độ tự do.'); }
      }
      afterPositionChange();
    };
  });

  bindSelect('aspect', 'aspect', () => { applySize(); goToPreset(currentPreset, 0.6); });
  bindSelect('quality', 'quality', applySize, Number);
  bindSelect('white-metal', 'whiteMetal', () => actors.forEach((a) => a.obj.traverse((o) => o.isMesh && (o.material = metalFor(a.color)))));
  bindSelect('move-style', 'moveStyle', refreshOverlay);
  bindRange('speed', 'moveDuration');
  bindRange('delay', 'delay');
  bindCheckbox('opt-reflect', 'reflections', (v) => board.setReflections(v));
  bindCheckbox('opt-shadows', 'shadows', (v) => (key.castShadow = v));
  bindCheckbox('opt-dof', 'dof', (v) => (bokeh.enabled = v));
  bindCheckbox('opt-coords', 'coords', (v) => (board.coords.visible = v));
  bindCheckbox('opt-sound', 'sound', (v) => (sound.enabled = v));
  bindCheckbox('opt-autoclear', 'autoClearArrows');
  bindCheckbox('opt-autoqueen', 'autoQueen');
  setupHintControls();
  bindCheckbox('opt-banners', 'banners');
  bindCheckbox('show-title', 'showTitle', refreshOverlay);
  bindCheckbox('show-caption', 'showCaption', refreshOverlay);
  bindCheckbox('show-move', 'showMove', refreshOverlay);
  board.setReflections(settings.reflections);
  key.castShadow = settings.shadows;
  bokeh.enabled = settings.dof;
  board.coords.visible = settings.coords;
  sound.enabled = settings.sound;

  const title = $('title');
  title.value = settings.title;
  title.oninput = () => { settings.title = title.value; saveSettings(); refreshOverlay(); };
  const caption = $('caption');
  caption.value = settings.caption;
  caption.oninput = () => { settings.caption = caption.value; saveSettings(); refreshOverlay(); };

  window.addEventListener('keydown', (e) => {
    if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)) return;
    const k = e.key;
    if (k === 'ArrowLeft') { stopPlaying(); undo(); }
    else if (k === 'ArrowRight') { stopPlaying(); redo(); }
    else if (k === ' ') { e.preventDefault(); play(); }
    else if (k === 'Home') jumpTo(0);
    else if (k === 'End') jumpTo(past.length + future.length);
    else if (k === 'h' || k === 'H') document.body.classList.toggle('hide-ui');
    else if (k === 'f' || k === 'F') flipBoard();
    else if (k === 'r' || k === 'R') (recorder ? stopRecording() : startRecording());
    else if (k === 'p' || k === 'P') screenshot();
    else if (k === 'Escape') { setPlaceTool(null); clearSelection(); }
    else if (k === '1') goToPreset('white');
    else if (k === '2') goToPreset('black');
    else if (k === '3') goToPreset('top');
    else if (k === '4') goToPreset('cinematic');
    else if (k === '5') goToPreset('side');
    else return;
    e.preventDefault();
  });
}

// ======================= Bóng tiếp xúc =======================
// Vệt bóng mềm ngay dưới chân mỗi quân; mờ & loang ra khi quân nhấc lên.
const blobTexture = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(0,0,0,0.95)');
  g.addColorStop(0.35, 'rgba(0,0,0,0.6)');
  g.addColorStop(0.7, 'rgba(0,0,0,0.15)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
})();
const blobGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
const blobs = new Map(); // actor -> mesh
const _up = new THREE.Vector3();

function updateContactShadows() {
  const show = settings.shadows;
  for (const [a, m] of blobs) {
    if (!actors.includes(a) || !show) {
      scene.remove(m);
      m.material.dispose();
      blobs.delete(a);
    }
  }
  if (!show) return;
  for (const a of actors) {
    let m = blobs.get(a);
    if (!m) {
      m = new THREE.Mesh(blobGeo, new THREE.MeshBasicMaterial({ map: blobTexture, transparent: true, depthWrite: false, opacity: 0 }));
      m.renderOrder = 1;
      scene.add(m);
      blobs.set(a, m);
    }
    const o = a.obj;
    const R = BASE_RADIUS[a.type] * PIECE_SCALE;
    _up.set(0, 1, 0).applyQuaternion(o.quaternion);
    const lying = 1 - Math.max(0, _up.y);
    const hx = _up.x, hz = _up.z;
    const hl = Math.hypot(hx, hz) || 1;
    const onBoard = Math.abs(o.position.x) < 4.05 && Math.abs(o.position.z) < 4.05;
    const ground = onBoard ? 0 : TABLE_Y;
    const h = Math.max(0, o.position.y - ground - lying * R);
    const len = R * 2.3 + lying * 1.1 * PIECE_SCALE;
    m.position.set(o.position.x + (hx / hl) * lying * 0.6, ground + 0.0015, o.position.z + (hz / hl) * lying * 0.6);
    m.rotation.y = Math.atan2(hx, hz);
    const spread = 1 + h * 0.8;
    m.scale.set(R * 2.3 * spread * o.scale.x, 1, len * spread * o.scale.x);
    m.material.opacity = 0.62 * Math.max(0, 1 - h * 1.1) * Math.min(1, o.scale.x);
  }
}

// ======================= Vòng lặp render =======================
const tmpV = new THREE.Vector3();
function renderFrame(now) {
  stepTweens(now);
  if (director) director.update(Math.min(director.meta.duration, (now - director.start) / 1000));
  else controls.update();
  if (bokeh.enabled) bokeh.uniforms.focus.value = camera.position.distanceTo(tmpV.copy(controls.target));
  updateContactShadows();
  if (threatened.length) {
    const k = 0.35 + 0.3 * (0.5 + 0.5 * Math.sin(now / 180));
    for (const m of threatMats.values()) m.emissiveIntensity = k;
  }
  if (checkGlow.visible) checkGlow.material.opacity = 0.75 + 0.25 * Math.sin(now / 160);
  composer.render();
  overlay.draw(now);
}

let paused = false;
function loop(now) {
  if (paused) return requestAnimationFrame(loop);
  renderFrame(now);
  if (recorder) {
    composeFrame();
    const s = Math.floor((now - recStart) / 1000);
    $('rec-time').textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  }
  requestAnimationFrame(loop);
}

// ======================= Kịch bản video =======================
let director = null;
let directorSaved = null;

function startVideo(index, { offline = false } = {}) {
  stopVideo();
  stopPlaying();
  clearSelection(false);
  resetGame('8/8/8/8/8/8/8/8 w - - 0 1');
  arrows = []; circles = [];
  renderMarks();
  directorSaved = { showTitle: overlay.showTitle, showCaption: overlay.showCaption, showMove: overlay.showMove, dof: bokeh.enabled, autoRotate: controls.autoRotate };
  overlay.showTitle = overlay.showCaption = overlay.showMove = false;
  overlay.banner = null;
  bokeh.enabled = false;
  controls.autoRotate = false;
  controls.enabled = false;
  const mod = VIDEOS[index];
  director = mod.createVideo({
    scene, camera, overlay, squareToPosition, fitDistance,
    createPiece: (type) => createPieceObject(type, 'b', materials.gold),
  });
  director.start = offline ? 0 : performance.now();
  document.body.classList.add('video-mode');
  return director;
}

function stopVideo() {
  if (!director) return;
  director.dispose();
  director = null;
  overlay.showTitle = directorSaved.showTitle;
  overlay.showCaption = directorSaved.showCaption;
  overlay.showMove = directorSaved.showMove;
  bokeh.enabled = directorSaved.dof;
  controls.autoRotate = directorSaved.autoRotate;
  controls.enabled = true;
  document.body.classList.remove('video-mode');
  resetGame();
  goToPreset(currentPreset, 0);
}

async function recordVideo(index) {
  if (recorder) return;
  startVideo(index);
  await sleep(300);
  director.start = performance.now();
  startRecording();
  await sleep(director.meta.duration * 1000 + 400);
  stopRecording();
}

function setupVideoUI() {
  const sel = $('video-script');
  VIDEOS.forEach((v, i) => {
    const o = document.createElement('option');
    o.value = i;
    o.textContent = `${v.meta.name} (${v.meta.duration}s)`;
    sel.appendChild(o);
  });
  $('btn-video-play').onclick = () => startVideo(Number(sel.value));
  $('btn-video-rec').onclick = () => recordVideo(Number(sel.value));
  $('btn-video-stop').onclick = () => { stopRecording(); stopVideo(); };
}

// ======================= Khởi động =======================
async function init() {
  setupUI();
  setupVideoUI();
  applySize();
  const custom = await loadCustomModels();
  if (custom.length) toast(`Đã dùng model riêng: ${custom.join(', ')}`);
  resetGame();
  goToPreset('white', 0);
  if (document.fonts) document.fonts.ready.then(refreshOverlay);
  requestAnimationFrame(loop);
  window.__chess = {
    pause: (v) => (paused = v),
    snapshot: () => { renderFrame(performance.now()); composeFrame(); return recCanvas.toDataURL('image/jpeg', 0.85); },
    camera, controls, scene, actors: () => actors, click: handleClick, setPlaceTool,
    game: () => game, loadText, goToPreset, redo, undo, jumpTo, settings, overlay };
  // Render từng khung hình (dùng để xuất video ngoài trình duyệt)
  window.__video = {
    list: VIDEOS.map((v) => v.meta),
    start: (i = 0) => { paused = true; return startVideo(i, { offline: true }).meta; },
    frame: (t, quality = 0.92) => {
      renderFrame(t * 1000);
      composeFrame();
      return recCanvas.toDataURL('image/jpeg', quality);
    },
  };
}
init();
