// Đầu ngựa "điêu khắc" bằng hàm khoảng cách (SDF) + marching cubes => bề mặt hữu cơ, mượt.
import * as THREE from 'three';
import { MarchingCubes } from 'three/addons/objects/MarchingCubes.js';

// ---- primitive SDF ----
function sdRoundCone(px, py, pz, ax, ay, az, bx, by, bz, r1, r2) {
  // iq: round cone giữa a (r1) và b (r2)
  const bax = bx - ax, bay = by - ay, baz = bz - az;
  const l2 = bax * bax + bay * bay + baz * baz;
  const rr = r1 - r2;
  const a2 = l2 - rr * rr;
  const il2 = 1 / l2;
  const pax = px - ax, pay = py - ay, paz = pz - az;
  const y = pax * bax + pay * bay + paz * baz;
  const z = y - l2;
  const xx = pax * l2 - bax * y, xy = pay * l2 - bay * y, xz = paz * l2 - baz * y;
  const x2 = xx * xx + xy * xy + xz * xz;
  const y2 = y * y * l2;
  const z2 = z * z * l2;
  const k = Math.sign(rr) * rr * rr * x2;
  if (Math.sign(z) * a2 * z2 > k) return Math.sqrt(x2 + z2) * il2 - r2;
  if (Math.sign(y) * a2 * y2 < k) return Math.sqrt(x2 + y2) * il2 - r1;
  return (Math.sqrt(x2 * a2 * il2) + y * rr) * il2 - r1;
}

function sdEllipsoid(px, py, pz, cx, cy, cz, rx, ry, rz) {
  const x = (px - cx) / rx, y = (py - cy) / ry, z = (pz - cz) / rz;
  const k0 = Math.sqrt(x * x + y * y + z * z);
  const x1 = x / rx, y1 = y / ry, z1 = z / rz;
  const k1 = Math.sqrt(x1 * x1 + y1 * y1 + z1 * z1);
  return k1 === 0 ? -Math.min(rx, ry, rz) : (k0 * (k0 - 1)) / k1;
}

function smin(a, b, k) {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}
function smax(a, b, k) {
  return -smin(-a, -b, k);
}

// Bờm: các múi dọc sống cổ
const MANE = [];
{
  const pts = [[-0.215, 0.03], [-0.205, 0.17], [-0.185, 0.3], [-0.16, 0.42], [-0.12, 0.53], [-0.075, 0.62]];
  const curve = new THREE.CatmullRomCurve3(pts.map(([x, y]) => new THREE.Vector3(x, y, 0)));
  for (let i = 0; i <= 7; i++) {
    const p = curve.getPointAt(i / 7);
    MANE.push([p.x, p.y]);
  }
}

function knightSDF(x, y, z) {
  const az = Math.abs(z);
  // Cổ (dẹt theo z)
  const zn = z / 0.8;
  let d = sdRoundCone(x, y, zn, -0.07, -0.02, 0, -0.03, 0.46, 0, 0.175, 0.115);
  // Ngực
  d = smin(d, sdEllipsoid(x, y, z, 0.05, 0.15, 0, 0.14, 0.18, 0.13), 0.08);
  // Đầu: từ gáy xuống mõm
  const zh = z / 0.78;
  d = smin(d, sdRoundCone(x, y, zh, -0.02, 0.585, 0, 0.245, 0.385, 0, 0.112, 0.07), 0.07);
  // Má / hàm
  d = smin(d, sdEllipsoid(x, y, z, 0.035, 0.475, 0, 0.12, 0.1, 0.092), 0.05);
  // Mõm
  d = smin(d, sdEllipsoid(x, y, z, 0.255, 0.365, 0, 0.075, 0.072, 0.066), 0.04);
  // Trán gồ nhẹ
  d = smin(d, sdEllipsoid(x, y, z, 0.07, 0.6, 0, 0.1, 0.05, 0.075), 0.04);
  // Tai
  d = smin(d, sdRoundCone(x, y, az, -0.035, 0.65, 0.05, -0.06, 0.76, 0.068, 0.036, 0.014), 0.03);
  // Mắt (u nhỏ)
  d = smin(d, sdEllipsoid(x, y, az, 0.085, 0.565, 0.072, 0.026, 0.018, 0.016), 0.012);
  // Bờm
  for (let i = 0; i < MANE.length; i++) {
    const [mx, my] = MANE[i];
    d = smin(d, sdEllipsoid(x, y, z, mx, my, 0, 0.055, 0.06, 0.042), 0.035);
  }
  // Lỗ mũi
  d = smax(d, -sdEllipsoid(x, y, az, 0.3, 0.385, 0.032, 0.02, 0.016, 0.02), 0.01);
  // Khe miệng
  d = smax(d, -sdEllipsoid(x, y, z, 0.3, 0.318, 0, 0.075, 0.007, 0.2), 0.008);
  // Cắt phẳng đáy
  d = Math.max(d, -(y + 0.02));
  return d;
}

export function buildKnightHead(resolution = 104) {
  const C = new THREE.Vector3(0.03, 0.42, 0);
  const S = 0.5; // nửa cạnh khối lưới
  const mc = new MarchingCubes(resolution, new THREE.MeshBasicMaterial(), false, false, 400000);
  const n = mc.size, half = mc.halfsize, f = mc.field;
  for (let k = 0; k < n; k++) {
    const z = ((k - half) / half) * S + C.z;
    for (let j = 0; j < n; j++) {
      const y = ((j - half) / half) * S + C.y;
      const off = k * n * n + j * n;
      for (let i = 0; i < n; i++) {
        const x = ((i - half) / half) * S + C.x;
        f[off + i] = -knightSDF(x, y, z);
      }
    }
  }
  mc.isolation = 0;
  mc.update();
  const count = mc.count;
  const pos = mc.positionArray.slice(0, count * 3);
  const nor = mc.normalArray.slice(0, count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = pos[i * 3] * S + C.x;
    pos[i * 3 + 1] = pos[i * 3 + 1] * S + C.y;
    pos[i * 3 + 2] = pos[i * 3 + 2] * S + C.z;
    const nx = nor[i * 3], ny = nor[i * 3 + 1], nz = nor[i * 3 + 2];
    const l = Math.hypot(nx, ny, nz) || 1;
    nor[i * 3] = nx / l;
    nor[i * 3 + 1] = ny / l;
    nor[i * 3 + 2] = nz / l;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  mc.geometry.dispose();
  return geo;
}
