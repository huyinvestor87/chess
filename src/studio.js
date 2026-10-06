// Môi trường phản chiếu kiểu studio chụp sản phẩm: nền tối + các softbox sáng.
import * as THREE from 'three';

export function createStudioEnvironment(renderer) {
  const env = new THREE.Scene();
  env.background = new THREE.Color(0x0a0a0c);

  const box = new THREE.BoxGeometry(1, 1, 1);
  const panel = (intensity, color = 0xffffff) =>
    new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity) });

  const add = (mat, pos, scale, rotY = 0) => {
    const m = new THREE.Mesh(box, mat);
    m.position.set(...pos);
    m.scale.set(...scale);
    m.rotation.y = rotY;
    env.add(m);
  };

  // Softbox lớn trên đầu
  add(panel(6), [0, 9, 0], [9, 0.2, 5]);
  // Dải sáng hai bên (tạo vệt sáng dọc trên thân quân)
  add(panel(9), [-8, 3, 2], [0.2, 6, 1.2]);
  add(panel(7, 0xfff3e0), [8, 3, -1], [0.2, 6, 1.2]);
  // Đèn phía trước, phía sau
  add(panel(4), [0, 2.5, 9], [6, 2, 0.2]);
  add(panel(3, 0xdde6ff), [0, 3, -9], [8, 1.2, 0.2]);
  // Vài điểm sáng nhỏ để kim loại lấp lánh
  add(panel(14), [5, 6, 6], [1, 1, 1]);
  add(panel(10), [-6, 5, -5], [0.8, 0.8, 0.8]);
  // Sàn tối hơi xám để phần dưới quân không đen kịt
  add(panel(0.25), [0, -2, 0], [30, 0.2, 30]);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const rt = pmrem.fromScene(env, 0.03);
  pmrem.dispose();
  return rt.texture;
}

export function createBackgroundTexture(top = '#2b2b33', bottom = '#060607') {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 1024;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(256, 380, 40, 256, 520, 760);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 1024);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
