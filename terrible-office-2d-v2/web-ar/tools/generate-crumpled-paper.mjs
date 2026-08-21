import fs from 'node:fs';

const output = new URL('../assets/models/crumpled-paper.gltf', import.meta.url);
const rings = 24;
const segments = 40;
const points = [];

const radialNoise = (theta, phi) => {
  const broad = .12 * Math.sin(3 * theta + 2 * phi) + .08 * Math.cos(5 * phi - theta);
  const creases = .055 * Math.sin(11 * phi + 7 * theta) + .04 * Math.cos(17 * phi - 4 * theta);
  return Math.max(.34, .5 + broad + creases);
};

for (let ring = 0; ring <= rings; ring++) {
  const theta = Math.PI * ring / rings;
  for (let segment = 0; segment < segments; segment++) {
    const phi = Math.PI * 2 * segment / segments;
    const radius = radialNoise(theta, phi);
    points.push([
      radius * Math.sin(theta) * Math.cos(phi),
      radius * Math.cos(theta) * .9,
      radius * Math.sin(theta) * Math.sin(phi)
    ]);
  }
}

const positions = [];
const normals = [];
const colors = [];
const addTriangle = (a, b, c, shade) => {
  const ab = b.map((value, index) => value - a[index]);
  const ac = c.map((value, index) => value - a[index]);
  const normal = [
    ab[1] * ac[2] - ab[2] * ac[1],
    ab[2] * ac[0] - ab[0] * ac[2],
    ab[0] * ac[1] - ab[1] * ac[0]
  ];
  const length = Math.hypot(...normal) || 1;
  normal.forEach((value, index) => normal[index] = value / length);
  [a, b, c].forEach(vertex => {
    positions.push(...vertex);
    normals.push(...normal);
    colors.push(.88 + shade, .87 + shade, .82 + shade, 1);
  });
};

for (let ring = 0; ring < rings; ring++) {
  for (let segment = 0; segment < segments; segment++) {
    const next = (segment + 1) % segments;
    const a = points[ring * segments + segment];
    const b = points[(ring + 1) * segments + segment];
    const c = points[(ring + 1) * segments + next];
    const d = points[ring * segments + next];
    const shade = .035 * Math.sin(ring * 2.1 + segment * 1.7);
    addTriangle(a, b, c, shade);
    addTriangle(a, c, d, -shade);
  }
}

const chunks = [];
const views = [];
const accessors = [];
const addAttribute = (values, componentCount, type, normalized = false) => {
  const array = new Float32Array(values);
  const byteOffset = chunks.reduce((total, chunk) => total + chunk.byteLength, 0);
  chunks.push(new Uint8Array(array.buffer));
  views.push({buffer: 0, byteOffset, byteLength: array.byteLength, target: 34962});
  const accessor = {bufferView: views.length - 1, componentType: 5126, count: values.length / componentCount, type, normalized};
  if (values === positions) {
    accessor.min = [-.7, -.7, -.7];
    accessor.max = [.7, .7, .7];
  }
  accessors.push(accessor);
  return accessors.length - 1;
};

const positionAccessor = addAttribute(positions, 3, 'VEC3');
const normalAccessor = addAttribute(normals, 3, 'VEC3');
const colorAccessor = addAttribute(colors, 4, 'VEC4');
const byteLength = chunks.reduce((total, chunk) => total + chunk.byteLength, 0);
const binary = new Uint8Array(byteLength);
let offset = 0;
chunks.forEach(chunk => { binary.set(chunk, offset); offset += chunk.byteLength; });

const gltf = {
  asset: {version: '2.0', generator: 'IUI demo crumpled-paper generator'},
  scene: 0,
  scenes: [{nodes: [0]}],
  nodes: [{mesh: 0}],
  meshes: [{primitives: [{attributes: {POSITION: positionAccessor, NORMAL: normalAccessor, COLOR_0: colorAccessor}, material: 0, mode: 4}]}],
  materials: [{pbrMetallicRoughness: {baseColorFactor: [1, 1, 1, 1], metallicFactor: 0, roughnessFactor: .96}, doubleSided: true}],
  buffers: [{byteLength, uri: `data:application/octet-stream;base64,${Buffer.from(binary).toString('base64')}`}],
  bufferViews: views,
  accessors
};

fs.writeFileSync(output, `${JSON.stringify(gltf)}\n`);
console.log(`Generated ${output.pathname} (${positions.length / 3} vertices)`);
