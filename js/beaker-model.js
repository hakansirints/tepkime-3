import * as THREE from './vendor/three/three.module.js?v=cfeeea0217f0';

// One glassware model for the laboratory and the rendered reagent cards.
export const BEAKER_HEIGHT = 1.1;
const beakerUnit = BEAKER_HEIGHT / 6.68;
export const BEAKER_RADIUS = 2.60 * beakerUnit;

export function createBeakerFactory(renderer, scene) {
  function standard(color, roughness = 0.4) {
    return new THREE.MeshStandardMaterial({ color, roughness });
  }
  function mesh(geometry, material, parent = scene, x = 0, y = 0, z = 0) {
    const item = new THREE.Mesh(geometry, material);
    item.position.set(x, y, z);
    item.castShadow = !material.transparent;
    item.receiveShadow = true;
    parent.add(item);
    return item;
  }
  function cylinder(radius, height, material, parent, x = 0, y = 0, z = 0) {
    return mesh(new THREE.CylinderGeometry(radius, radius, height, 40), material, parent, x, y, z);
  }

  function canvasTexture(width, height, draw) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    draw(canvas.getContext('2d'), width, height);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    return texture;
  }

  // Cam Atolyesi's 52 x 67 mm, 100 ml model, normalized to the existing height.
  // Its reflection cards belong only to the glass materials, not to the room.
  const glassStudio = new THREE.Scene();
  glassStudio.background = new THREE.Color(0x53615f);
  for (const [x, y, z, w, h, color, intensity, targetY] of [
    [-12, 7, 3, 8, 18, 0xffffff, 3, 4],
    [10, 10, -5, 6, 19, 0xffffff, 2.5, 4],
    [0, 18, 0, 18, 16, 0xffffff, 2, 0],
    [0, 7, 16, 5, 15, 0xffffff, 1.5, 4],
    [-9, 6, -7, 3, 16, 0x172321, 0.7, 4],
    [7, 6, 9, 1.4, 17, 0x26332e, 0.6, 4]
  ]) {
    const card = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }));
    card.material.color.multiplyScalar(intensity);
    card.position.set(x, y, z);
    card.lookAt(0, targetY, 0);
    glassStudio.add(card);
  }
  const glassPMREM = new THREE.PMREMGenerator(renderer);
  const glassEnvironment = glassPMREM.fromScene(glassStudio, 0.025);
  glassPMREM.dispose();
  glassStudio.traverse(object => {
    if (object.isMesh) { object.geometry.dispose(); object.material.dispose(); }
  });
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xf5ffff, metalness: 0, roughness: 0.055, transmission: 1, ior: 1.47,
    thickness: 0.13 * beakerUnit, envMap: glassEnvironment.texture, envMapIntensity: 1.15,
    clearcoat: 0.13, clearcoatRoughness: 0.08, attenuationColor: 0xc9ebe7,
    attenuationDistance: 28 * beakerUnit, side: THREE.FrontSide, depthWrite: false
  });
  glassMaterial.onBeforeCompile = shader => {
    shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `
      float glassEdge = pow(1.0 - abs(dot(normal, normalize(vViewPosition))), 3.0);
      outgoingLight = mix(outgoingLight, vec3(0.14, 0.18, 0.17), glassEdge * 0.78);
      float softboxStripe = pow(max(0.0, 1.0 - abs(normal.x + 0.42) * 9.0), 3.0);
      outgoingLight += vec3(0.25) * softboxStripe;
      #include <opaque_fragment>
    `);
  };

  function createBeaker(radius, height) {
    const group = new THREE.Group();
    scene.add(group);
    const profile = [
      [0, -0.005], [2.20, -0.005], [2.40, 0.006], [2.52, 0.040], [2.585, 0.115], [2.60, 0.24],
      [2.60, 0.46], [2.60, 1.1], [2.60, 2.0], [2.60, 3.2], [2.60, 4.4], [2.60, 5.1],
      [2.60, 5.55], [2.60, 5.90], [2.60, 6.15], [2.615, 6.40], [2.66, 6.53],
      [2.69, 6.59], [2.67, 6.65], [2.61, 6.675], [2.55, 6.655], [2.505, 6.60],
      [2.478, 6.52], [2.47, 6.38], [2.47, 6.13], [2.47, 5.90], [2.47, 5.55],
      [2.47, 5.1], [2.47, 4.4], [2.47, 3.2], [2.47, 2.0], [2.47, 1.1], [2.47, 0.52],
      [2.455, 0.40], [2.415, 0.32], [2.33, 0.285], [2.1, 0.28], [0, 0.28]
    ];
    const spout = theta => {
      // Face left toward the receiving beaker; keep the decal facing the camera.
      const d = Math.atan2(Math.sin(theta + Math.PI / 2), Math.cos(theta + Math.PI / 2));
      return Math.exp(-Math.pow(d / 0.24, 2));
    };
    const segments = 192;
    const positions = [], indices = [];
    for (const [r, y] of profile) {
      for (let j = 0; j <= segments; j++) {
        const theta = j / segments * Math.PI * 2;
        const s = spout(theta) * THREE.MathUtils.smoothstep(y, 5.18, 6.57);
        const rr = (r + 0.79 * s) * beakerUnit;
        positions.push(Math.sin(theta) * rr, (y - 0.145 * s + 0.005) * beakerUnit, Math.cos(theta) * rr);
      }
    }
    for (let i = 0; i < profile.length - 1; i++) {
      for (let j = 0; j < segments; j++) {
        const a = i * (segments + 1) + j, b = a + 1, c = a + segments + 1, d = c + 1;
        indices.push(a, b, c, b, d, c);
      }
    }
    const glassGeometry = new THREE.BufferGeometry();
    glassGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    glassGeometry.setIndex(indices);
    glassGeometry.computeVertexNormals();
    const body = mesh(glassGeometry, glassMaterial, group);
    body.name = 'beaker-glass-100ml';
    body.castShadow = false;
    const edgeMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x9eafab, roughness: 0.045, transmission: 0.63, ior: 1.47,
      thickness: 0.08 * beakerUnit, envMap: glassEnvironment.texture, envMapIntensity: 1.5, depthWrite: false
    });
    const lipPoints = [];
    for (let j = 0; j < segments; j++) {
      const theta = j / segments * Math.PI * 2, s = spout(theta);
      const r = (2.615 + 0.79 * s) * beakerUnit;
      lipPoints.push(new THREE.Vector3(Math.sin(theta) * r, (6.635 - 0.145 * s + 0.005) * beakerUnit, Math.cos(theta) * r));
    }
    const lip = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(lipPoints, true), 256,
      0.034 * beakerUnit, 8, true), edgeMaterial, group);
    lip.name = 'beaker-spout-rim';
    lip.castShadow = false;
    const foot = mesh(new THREE.TorusGeometry(2.545 * beakerUnit, 0.038 * beakerUnit, 8, segments),
      edgeMaterial, group, 0, 0.115 * beakerUnit, 0);
    foot.rotation.x = Math.PI / 2;
    foot.castShadow = false;
    const floor = 0.285 * beakerUnit;
    const innerRadius = 2.47 * beakerUnit;
    const rimHeight = 6.585 * beakerUnit;
    const spoutPoint = new THREE.Vector3(-(2.615 + 0.79) * beakerUnit, (6.635 - 0.145 + 0.005) * beakerUnit, 0);
    const marks = canvasTexture(512, 1024, (ctx) => {
      ctx.clearRect(0, 0, 512, 1024);
      ctx.strokeStyle = '#526763';
      ctx.fillStyle = '#526763';
      ctx.lineWidth = 3;
      const pixelY = ml => 1024 - (0.28 + ml / (Math.PI * 2.47 * 2.47)) / 6.58 * 1024;
      ctx.beginPath(); ctx.moveTo(120, pixelY(10)); ctx.lineTo(120, pixelY(100)); ctx.stroke();
      for (let ml = 10; ml <= 100; ml += 10) {
        const y = pixelY(ml);
        ctx.beginPath(); ctx.moveTo(120, y); ctx.lineTo(ml % 20 === 0 ? 180 : 151, y); ctx.stroke();
        if (ml % 20 === 0) { ctx.font = '500 42px Arial'; ctx.fillText(String(ml), 199, y + 13); }
      }
      ctx.font = '32px Arial'; ctx.fillText('ml', 200, pixelY(100) - 48);
      ctx.font = '25px Arial'; ctx.fillStyle = '#627873'; ctx.fillText('100 ml', 245, 966);
    });
    const decalPositions = [], decalUV = [], decalIndices = [];
    for (let i = 0; i <= 64; i++) {
      const u = i / 64, theta = 0.03 + (u - 0.5) * 0.85;
      for (const y of [0, 6.58]) {
        decalPositions.push(2.607 * beakerUnit * Math.sin(theta), (y + 0.005) * beakerUnit, 2.607 * beakerUnit * Math.cos(theta));
        decalUV.push(u, y / 6.58);
      }
      if (i < 64) { const a = i * 2; decalIndices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    }
    const decalGeometry = new THREE.BufferGeometry();
    decalGeometry.setAttribute('position', new THREE.Float32BufferAttribute(decalPositions, 3));
    decalGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(decalUV, 2));
    decalGeometry.setIndex(decalIndices);
    decalGeometry.computeVertexNormals();
    const graduation = mesh(decalGeometry, new THREE.MeshBasicMaterial({
      map: marks, transparent: true, side: THREE.DoubleSide, depthWrite: false, opacity: 0.83,
      polygonOffset: true, polygonOffsetFactor: -2
    }), group);
    graduation.name = 'graduations-100ml';
    graduation.renderOrder = 8;
    graduation.castShadow = false;
    const liquidMaterial = new THREE.MeshPhysicalMaterial({
      color: '#a7d6e0', transparent: true, opacity: 0.58,
      roughness: 0.21, metalness: 0, side: THREE.DoubleSide, depthWrite: false, envMapIntensity: 0.45
    });
    const liquidGeometry = new THREE.CylinderGeometry(innerRadius - 0.002, innerRadius - 0.002, 1, 64);
    const liquid = mesh(liquidGeometry, liquidMaterial, group);
    liquid.name = 'solution';
    const liquidBaseY = Array.from(liquidGeometry.attributes.position.array).filter((value, index) => index % 3 === 1);
    const surface = mesh(new THREE.CircleGeometry(innerRadius - 0.001, 48), liquidMaterial, group);
    surface.rotation.x = -Math.PI / 2;
    const powder = cylinder(radius - 0.035, 1, standard('#ffffff', 0.95), group);
    powder.name = 'powder';
    const sediment = cylinder(radius - 0.033, 1, standard('#ffffff', 0.92), group);
    sediment.name = 'precipitate';
    sediment.visible = false;
    const grains = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.020, 0), standard('#ffffff', 0.95), 60);
    grains.name = 'solid-grains';
    const dummy = new THREE.Object3D();
    for (let i = 0; i < 60; i++) {
      const angle = i * 2.39996;
      const r = Math.sqrt((i + 0.5) / 60) * (radius - 0.075);
      dummy.position.set(Math.cos(angle) * r, 0.088 + 0.022 * Math.sin(i * 1.7), Math.sin(angle) * r);
      dummy.updateMatrix();
      grains.setMatrixAt(i, dummy.matrix);
    }
    group.add(grains);
    return { group, radius, innerRadius, floor, rimHeight, spoutPoint, height,
      liquid, liquidBaseY, surface, powder, sediment, grains, level: 0.4 };
  }

  return createBeaker;
}
