// Quân cờ 3D dựng bằng code (lathe + extrude), phong cách Staunton kim loại.
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { buildKnightHead } from './knight.js';

const LATHE_SEGMENTS = 72;

// Bán kính đế của từng quân (dùng cho bố trí quân bị ăn nằm trên bàn)
export const BASE_RADIUS = { p: 0.27, r: 0.31, n: 0.31, b: 0.3, q: 0.33, k: 0.34 };

// ---------- Vật liệu ----------
export function createMaterials() {
  const gold = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(1.0, 0.64, 0.2),
    metalness: 1,
    roughness: 0.2,
    clearcoat: 0.6,
    clearcoatRoughness: 0.12,
  });
  const silver = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0.86, 0.88, 0.92),
    metalness: 1,
    roughness: 0.18,
    clearcoat: 0.6,
    clearcoatRoughness: 0.1,
  });
  return { gold, silver };
}

// ---------- Tiện ích hình học ----------
function smoothProfile(pts, samples = 220) {
  const curve = new THREE.CatmullRomCurve3(
    pts.map(([x, y]) => new THREE.Vector3(x, y, 0)),
    false,
    'centripetal'
  );
  return curve.getSpacedPoints(samples).map((p) => new THREE.Vector2(Math.max(0, p.x), p.y));
}

function arc(cx, cy, r, a0, a1, n = 14) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return out;
}

function lathe(pts, samples) {
  const geo = new THREE.LatheGeometry(smoothProfile(pts, samples), LATHE_SEGMENTS);
  geo.computeVertexNormals();
  return geo;
}

function smoothExtrude(shape, opts) {
  let geo = new THREE.ExtrudeGeometry(shape, opts);
  geo.deleteAttribute('normal');
  geo.deleteAttribute('uv');
  geo = mergeVertices(geo, 1e-4);
  geo.computeVertexNormals();
  return geo;
}

// Đế chung: chân tròn, bậc, rãnh lõm, vòng chỉ
function base(R) {
  return [
    [0, 0], [R * 0.5, 0], [R * 0.93, 0], [R, 0.012], [R, 0.045], [R * 0.97, 0.065],
    [R * 0.9, 0.075], [R * 0.88, 0.09], [R * 0.9, 0.105], [R * 0.86, 0.12],
    [R * 0.74, 0.135], [R * 0.7, 0.155], [R * 0.74, 0.175], [R * 0.72, 0.19],
  ];
}

// ---------- Từng quân ----------
function pawnParts() {
  const head = arc(0, 0.585, 0.125, -Math.acos(0.085 / 0.125), Math.PI / 2, 16);
  const pts = [
    ...base(BASE_RADIUS.p),
    [0.16, 0.22], [0.12, 0.28], [0.095, 0.36], [0.088, 0.41],
    [0.12, 0.42], [0.16, 0.43], [0.165, 0.445], [0.15, 0.46], [0.1, 0.47], [0.085, 0.48],
    ...head,
  ];
  return [lathe(pts)];
}

function rookParts() {
  const pts = [
    ...base(BASE_RADIUS.r),
    [0.2, 0.23], [0.185, 0.35], [0.18, 0.48], [0.19, 0.53], [0.215, 0.56],
    [0.25, 0.575], [0.255, 0.595], [0.24, 0.61], [0.225, 0.62],
    [0.225, 0.64], [0.23, 0.72], [0.24, 0.745], [0.24, 0.76], [0.225, 0.768],
    [0.19, 0.77], [0.17, 0.768], [0.16, 0.755], [0.15, 0.73], [0.08, 0.725], [0, 0.725],
  ];
  const parts = [lathe(pts, 260)];
  // Răng cưa (merlon)
  const n = 6;
  const span = ((Math.PI * 2) / n) * 0.62;
  for (let i = 0; i < n; i++) {
    const a0 = (i * Math.PI * 2) / n + 0.3;
    const s = new THREE.Shape();
    s.absarc(0, 0, 0.228, a0, a0 + span, false);
    s.absarc(0, 0, 0.175, a0 + span, a0, true);
    s.closePath();
    const g = smoothExtrude(s, {
      depth: 0.07, bevelEnabled: true, bevelThickness: 0.014, bevelSize: 0.012,
      bevelSegments: 4, curveSegments: 16,
    });
    g.rotateX(-Math.PI / 2);
    g.translate(0, 0.765, 0);
    parts.push(g);
  }
  return parts;
}

function bishopParts() {
  const pts = [
    ...base(BASE_RADIUS.b),
    [0.19, 0.23], [0.15, 0.33], [0.115, 0.45], [0.095, 0.56], [0.09, 0.6],
    [0.14, 0.61], [0.175, 0.625], [0.178, 0.64], [0.16, 0.655], [0.12, 0.662],
    [0.1, 0.675], [0.13, 0.687], [0.135, 0.7], [0.11, 0.712],
    [0.1, 0.725], [0.13, 0.765], [0.15, 0.815], [0.148, 0.865], [0.13, 0.915],
    [0.1, 0.958], [0.062, 0.99], [0.035, 1.01],
    [0.03, 1.02], [0.045, 1.035], [0.048, 1.055], [0.035, 1.075], [0, 1.085],
  ];
  const parts = [lathe(pts, 260)];
  // Rãnh chéo trên mũ (vòng xuyến dẹt)
  const groove = new THREE.TorusGeometry(0.135, 0.012, 10, 48, Math.PI * 0.8);
  groove.rotateZ(Math.PI * 0.1);
  groove.rotateX(Math.PI / 2);
  groove.rotateZ(-0.55);
  groove.translate(0, 0.86, 0);
  parts.push(groove);
  return parts;
}

function queenParts() {
  const pts = [
    ...base(BASE_RADIUS.q),
    [0.21, 0.23], [0.17, 0.33], [0.13, 0.47], [0.105, 0.6], [0.1, 0.7],
    [0.15, 0.715], [0.2, 0.73], [0.205, 0.75], [0.185, 0.765], [0.13, 0.775],
    [0.11, 0.79], [0.14, 0.8], [0.145, 0.815], [0.12, 0.83],
    [0.115, 0.85], [0.14, 0.92], [0.18, 0.99], [0.205, 1.03], [0.21, 1.045], [0.195, 1.052],
    [0.17, 1.048], [0.13, 1.062], [0.09, 1.09], [0.06, 1.12], [0.04, 1.132],
    [0.05, 1.147], [0.06, 1.17], [0.045, 1.195], [0, 1.205],
  ];
  const parts = [lathe(pts, 280)];
  const n = 10;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const tip = new THREE.SphereGeometry(0.03, 20, 14);
    tip.translate(Math.cos(a) * 0.198, 1.072, Math.sin(a) * 0.198);
    parts.push(tip);
  }
  return parts;
}

function kingParts() {
  const pts = [
    ...base(BASE_RADIUS.k),
    [0.22, 0.23], [0.18, 0.34], [0.14, 0.5], [0.115, 0.65], [0.11, 0.75],
    [0.16, 0.765], [0.21, 0.78], [0.215, 0.8], [0.195, 0.815], [0.14, 0.825],
    [0.12, 0.84], [0.15, 0.85], [0.155, 0.865], [0.13, 0.88],
    [0.125, 0.9], [0.15, 0.97], [0.19, 1.05], [0.205, 1.09], [0.2, 1.11], [0.17, 1.12],
    [0.14, 1.14], [0.1, 1.158], [0.06, 1.17], [0.05, 1.18], [0.055, 1.19], [0.04, 1.2], [0, 1.202],
  ];
  const parts = [lathe(pts, 280)];
  // Thánh giá pattée
  const c = 0.02;
  const s = new THREE.Shape();
  s.moveTo(0.045, 0);
  s.lineTo(c, 0.12); s.lineTo(0.1, 0.095); s.lineTo(0.1, 0.185); s.lineTo(c, 0.16);
  s.lineTo(0.045, 0.24); s.lineTo(-0.045, 0.24); s.lineTo(-c, 0.16); s.lineTo(-0.1, 0.185);
  s.lineTo(-0.1, 0.095); s.lineTo(-c, 0.12); s.lineTo(-0.045, 0);
  s.closePath();
  const cross = smoothExtrude(s, {
    depth: 0.04, bevelEnabled: true, bevelThickness: 0.014, bevelSize: 0.011, bevelSegments: 4,
  });
  cross.translate(0, 1.17, -0.02);
  parts.push(cross);
  return parts;
}

function knightParts() {
  const R = BASE_RADIUS.n;
  const pts = [
    ...base(R),
    [0.24, 0.2], [0.25, 0.215], [0.235, 0.232], [0.15, 0.236], [0, 0.236],
  ];
  const parts = [lathe(pts)];

  const head = buildKnightHead();
  head.translate(0, 0.215, 0);
  parts.push(head);
  return parts;
}

const BUILDERS = { p: pawnParts, r: rookParts, n: knightParts, b: bishopParts, q: queenParts, k: kingParts };
export const PIECE_SCALE = 1.12;

// ---------- Kho hình học (dùng chung cho mọi quân cùng loại) ----------
const geometryCache = {};
const customModels = {}; // type -> THREE.Object3D (từ file .glb nếu có)

export function getPartGeometries(type) {
  if (!geometryCache[type]) geometryCache[type] = BUILDERS[type]();
  return geometryCache[type];
}

// Hướng mặt quân Mã (radian, quanh trục Y)
export const KNIGHT_YAW = { w: Math.PI * 0.8, b: -Math.PI * 0.2 };

export function createPieceObject(type, color, material) {
  const root = new THREE.Group();
  const inner = new THREE.Group();
  root.add(inner);
  if (customModels[type]) {
    const clone = customModels[type].clone(true);
    clone.traverse((o) => {
      if (o.isMesh) {
        o.material = material;
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    inner.add(clone);
  } else {
    for (const g of getPartGeometries(type)) {
      const m = new THREE.Mesh(g, material);
      m.castShadow = true;
      m.receiveShadow = true;
      inner.add(m);
    }
    inner.scale.setScalar(PIECE_SCALE);
  }
  if (type === 'n') inner.rotation.y = KNIGHT_YAW[color];
  if (type === 'k') inner.rotation.y = color === 'w' ? 0 : Math.PI;
  root.userData = { type, color };
  return root;
}

// ---------- Nạp model tuỳ chỉnh (public/models/<tên>.glb) ----------
const MODEL_FILES = { p: 'pawn', r: 'rook', n: 'knight', b: 'bishop', q: 'queen', k: 'king' };
const TARGET_HEIGHT = { p: 0.8, r: 0.88, n: 1.0, b: 1.2, q: 1.35, k: 1.5 };

export async function loadCustomModels(baseUrl = './models/') {
  const loader = new GLTFLoader();
  const loaded = [];
  await Promise.all(
    Object.entries(MODEL_FILES).map(async ([type, name]) => {
      const url = `${baseUrl}${name}.glb`;
      try {
        const res = await fetch(url, { method: 'HEAD' });
        const ct = res.headers.get('content-type') || '';
        if (!res.ok || ct.includes('text/html')) return;
        const gltf = await loader.loadAsync(url);
        const obj = gltf.scene;
        const box = new THREE.Box3().setFromObject(obj);
        const size = box.getSize(new THREE.Vector3());
        const s = TARGET_HEIGHT[type] / size.y;
        const holder = new THREE.Group();
        obj.position.set(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);
        holder.add(obj);
        holder.scale.setScalar(s);
        customModels[type] = holder;
        loaded.push(name);
      } catch {
        /* không có file -> dùng quân dựng sẵn */
      }
    })
  );
  return loaded;
}
