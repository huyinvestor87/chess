// Bàn cờ: mặt bàn phản chiếu, khung viền bóng, mặt bàn đặt cờ, toạ độ.
import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';

export const FRAME_HALF = 4.55; // nửa cạnh ngoài của khung
export const TABLE_Y = -0.28; // cao độ mặt bàn (đáy khung)

const reflectorVertex = /* glsl */ `
  uniform mat4 textureMatrix;
  varying vec4 vProj;
  varying vec2 vUv2;
  #include <common>
  #include <logdepthbuf_pars_vertex>
  void main() {
    vUv2 = uv;
    vProj = textureMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    #include <logdepthbuf_vertex>
  }
`;

const boardFragment = /* glsl */ `
  uniform vec3 color;
  uniform vec3 lightColor;
  uniform vec3 darkColor;
  uniform float reflectivity;
  uniform sampler2D tDiffuse;
  varying vec4 vProj;
  varying vec2 vUv2;
  #include <logdepthbuf_pars_fragment>
  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  void main() {
    #include <logdepthbuf_fragment>
    vec2 g = floor(vUv2 * 8.0);
    float isDark = 1.0 - mod(g.x + g.y, 2.0);
    vec3 sq = mix(lightColor, darkColor, isDark);
    // vân xước kim loại nhẹ trong từng ô
    vec2 f = fract(vUv2 * 8.0);
    float brushed = hash(vec2(floor(f.y * 260.0), g.x * 7.0 + g.y)) * 0.06 - 0.03;
    sq *= 1.0 + brushed;
    // vignette: giữa sáng hơn mép
    float vig = 1.0 - smoothstep(0.25, 0.85, length(vUv2 - 0.5));
    sq *= 0.82 + 0.28 * vig;
    // đường chỉ mảnh giữa các ô
    vec2 edge = min(f, 1.0 - f);
    float line = 1.0 - smoothstep(0.0, 0.012, min(edge.x, edge.y));
    sq = mix(sq, sq * 0.75, line * 0.5);
    vec3 refl = texture2DProj(tDiffuse, vProj).rgb;
    float r = reflectivity * mix(1.0, 1.6, isDark);
    gl_FragColor = vec4(sq * (1.0 - r * 0.5) + refl * r, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const tableFragment = /* glsl */ `
  uniform vec3 color;
  uniform float reflectivity;
  uniform sampler2D tDiffuse;
  varying vec4 vProj;
  varying vec2 vUv2;
  #include <logdepthbuf_pars_fragment>
  void main() {
    #include <logdepthbuf_fragment>
    float d = length(vUv2 - 0.5) * 2.0;
    float fade = 1.0 - smoothstep(0.35, 1.0, d);
    vec3 refl = texture2DProj(tDiffuse, vProj).rgb;
    vec3 col = color * (0.6 + 0.4 * fade) + refl * reflectivity * fade;
    gl_FragColor = vec4(col, fade);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

function makeReflectorShader(fragmentShader, extraUniforms) {
  return {
    name: 'CustomReflector',
    uniforms: {
      color: { value: null },
      tDiffuse: { value: null },
      textureMatrix: { value: null },
      ...extraUniforms,
    },
    vertexShader: reflectorVertex,
    fragmentShader,
  };
}

function labelTexture(text, color = '#c9c9cf') {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = color;
  ctx.font = '600 84px "Be Vietnam Pro", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 64, 68);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export function createBoard({ reflectionSize = 1024 } = {}) {
  const group = new THREE.Group();

  // Mặt ô cờ (phản chiếu)
  const board = new Reflector(new THREE.PlaneGeometry(8, 8), {
    textureWidth: reflectionSize,
    textureHeight: reflectionSize,
    color: 0xffffff,
    shader: makeReflectorShader(boardFragment, {
      lightColor: { value: new THREE.Color('#b4b6bb') },
      darkColor: { value: new THREE.Color('#2a2b2f') },
      reflectivity: { value: 0.22 },
    }),
  });
  board.rotation.x = -Math.PI / 2;
  group.add(board);

  // Lớp nhận bóng đổ phủ trên mặt ô
  const shadowCatcher = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 8),
    new THREE.ShadowMaterial({ opacity: 0.45 })
  );
  shadowCatcher.rotation.x = -Math.PI / 2;
  shadowCatcher.position.y = 0.0005;
  shadowCatcher.receiveShadow = true;
  group.add(shadowCatcher);

  // Khung viền đen bóng
  const outer = new THREE.Shape();
  const h = FRAME_HALF - 0.04;
  outer.moveTo(-h, -h); outer.lineTo(h, -h); outer.lineTo(h, h); outer.lineTo(-h, h); outer.closePath();
  const hole = new THREE.Path();
  const ih = 4.02;
  hole.moveTo(-ih, -ih); hole.lineTo(-ih, ih); hole.lineTo(ih, ih); hole.lineTo(ih, -ih); hole.closePath();
  outer.holes.push(hole);
  const frameGeo = new THREE.ExtrudeGeometry(outer, {
    depth: Math.abs(TABLE_Y) + 0.0, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.04, bevelSegments: 4,
  });
  frameGeo.rotateX(-Math.PI / 2);
  frameGeo.translate(0, TABLE_Y, 0);
  const frameMat = new THREE.MeshPhysicalMaterial({
    color: 0x0c0c0f, metalness: 0.35, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.06,
  });
  const frame = new THREE.Mesh(frameGeo, frameMat);
  frame.castShadow = false;
  frame.receiveShadow = true;
  group.add(frame);

  // Khối thân bàn (che phần dưới mặt ô để mặt bàn không phản chiếu xuyên qua)
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(8.2, Math.abs(TABLE_Y) - 0.02, 8.2),
    new THREE.MeshStandardMaterial({ color: 0x050506, roughness: 0.6 })
  );
  body.position.y = TABLE_Y / 2 - 0.01;
  group.add(body);

  // Viền chỉ bạc bên trong khung
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x9a9ca3, metalness: 1, roughness: 0.3 });
  const trimShape = new THREE.Shape();
  const t0 = 4.07, t1 = 4.11;
  trimShape.moveTo(-t1, -t1); trimShape.lineTo(t1, -t1); trimShape.lineTo(t1, t1); trimShape.lineTo(-t1, t1); trimShape.closePath();
  const trimHole = new THREE.Path();
  trimHole.moveTo(-t0, -t0); trimHole.lineTo(-t0, t0); trimHole.lineTo(t0, t0); trimHole.lineTo(t0, -t0); trimHole.closePath();
  trimShape.holes.push(trimHole);
  const trim = new THREE.Mesh(new THREE.ShapeGeometry(trimShape), trimMat);
  trim.rotation.x = -Math.PI / 2;
  trim.position.y = 0.0265;
  group.add(trim);

  // Toạ độ
  const coords = new THREE.Group();
  const files = 'abcdefgh';
  const planeGeo = new THREE.PlaneGeometry(0.32, 0.32);
  const labelY = 0.027;
  for (let i = 0; i < 8; i++) {
    for (const side of [1, -1]) {
      const fm = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ map: labelTexture(files[i]), transparent: true, depthWrite: false }));
      fm.rotation.x = -Math.PI / 2;
      fm.position.set(i - 3.5, labelY, side * 4.31);
      coords.add(fm);
      const rm = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ map: labelTexture(String(i + 1)), transparent: true, depthWrite: false }));
      rm.rotation.x = -Math.PI / 2;
      rm.position.set(side * -4.31, labelY, 3.5 - i);
      coords.add(rm);
    }
  }
  group.add(coords);

  // Mặt bàn đen bóng bên dưới (phản chiếu, mờ dần ra xa)
  const table = new Reflector(new THREE.PlaneGeometry(34, 34), {
    textureWidth: reflectionSize,
    textureHeight: reflectionSize,
    color: 0x050507,
    shader: makeReflectorShader(tableFragment, { reflectivity: { value: 0.35 } }),
  });
  table.material.transparent = true;
  table.rotation.x = -Math.PI / 2;
  table.position.y = TABLE_Y - 0.001;
  group.add(table);

  const tableShadow = new THREE.Mesh(new THREE.PlaneGeometry(34, 34), new THREE.ShadowMaterial({ opacity: 0.5 }));
  tableShadow.rotation.x = -Math.PI / 2;
  tableShadow.position.y = TABLE_Y + 0.001;
  tableShadow.receiveShadow = true;
  group.add(tableShadow);

  board.__obr = board.onBeforeRender;
  table.__obr = table.onBeforeRender;

  return {
    group,
    board,
    table,
    coords,
    setColors(light, dark) {
      board.material.uniforms.lightColor.value.set(light);
      board.material.uniforms.darkColor.value.set(dark);
    },
    setReflections(on) {
      board.material.uniforms.reflectivity.value = on ? 0.22 : 0.0;
      table.material.uniforms.reflectivity.value = on ? 0.35 : 0.0;
      // Tắt phản chiếu thì bỏ render phụ cho nhẹ máy
      board.onBeforeRender = on ? board.__obr : () => {};
      table.onBeforeRender = on ? table.__obr : () => {};
    },
  };
}

export function squareToPosition(square, target = new THREE.Vector3()) {
  const file = square.charCodeAt(0) - 97;
  const rank = Number(square[1]) - 1;
  return target.set(file - 3.5, 0, 3.5 - rank);
}

export function positionToSquare(x, z) {
  const file = Math.floor(x + 4);
  const rank = Math.floor(4 - z);
  if (file < 0 || file > 7 || rank < 0 || rank > 7) return null;
  return String.fromCharCode(97 + file) + (rank + 1);
}
