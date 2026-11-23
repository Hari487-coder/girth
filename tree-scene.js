/** Local Three.js scenes. Every mount returns a cleanup; nothing survives navigation. */
const THREE_URL = './vendor/three.module.js';

export function treeFallback() {
  return `<svg class="girth-scene-fallback" viewBox="0 0 640 570" role="img" aria-label="A flourishing tree rooted in a small green island">
    <defs><linearGradient id="girth-soil" x2="0" y2="1"><stop stop-color="#b18a5e"/><stop offset="1" stop-color="#73513c"/></linearGradient><linearGradient id="girth-leaf" x2=".7" y2="1"><stop stop-color="#9fbd69"/><stop offset="1" stop-color="#365b38"/></linearGradient><radialGradient id="girth-shadow"><stop stop-color="#537c5b" stop-opacity=".2"/><stop offset="1" stop-color="#537c5b" stop-opacity="0"/></radialGradient></defs>
    <ellipse cx="320" cy="502" rx="180" ry="29" fill="url(#girth-shadow)"/>
    <path d="M151 429c28-57 304-61 338 0l-26 38c-63 38-222 29-280-4Z" fill="url(#girth-soil)"/>
    <ellipse cx="320" cy="424" rx="170" ry="48" fill="#a5b67b"/><ellipse cx="318" cy="421" rx="149" ry="33" fill="#b8c790"/>
    <path d="M315 430c-13-57 1-98-9-133-17-28-46-44-67-67m77 105c20-59 50-69 84-92m-83 81c-2-68 15-113 8-152m-11 221c-21-29-35-42-64-49" fill="none" stroke="#796044" stroke-width="21" stroke-linecap="round"/>
    <path d="M316 400c-4 23-36 27-61 32m66-25c7 22 35 25 65 25m-71-19c-10 14-12 24-12 32" fill="none" stroke="#796044" stroke-width="9" stroke-linecap="round"/>
    <g fill="url(#girth-leaf)"><ellipse cx="243" cy="222" rx="74" ry="65"/><ellipse cx="321" cy="162" rx="85" ry="75"/><ellipse cx="400" cy="219" rx="77" ry="70"/><ellipse cx="306" cy="241" rx="89" ry="78"/><ellipse cx="218" cy="265" rx="55" ry="52"/><ellipse cx="419" cy="276" rx="59" ry="53"/><ellipse cx="351" cy="286" rx="72" ry="54"/></g>
    <g fill="#adca78" opacity=".6"><ellipse cx="271" cy="166" rx="43" ry="35"/><ellipse cx="345" cy="135" rx="46" ry="30"/><ellipse cx="387" cy="205" rx="38" ry="34"/><ellipse cx="238" cy="242" rx="33" ry="25"/></g>
    <g stroke="#6f8c4f" stroke-width="3" stroke-linecap="round"><path d="m222 425 2-14m0 10-8-5m190 12-1-16m0 9 7-6m-163 34-3-12m112 10 3-15"/></g><g fill="#cfccb7"><ellipse cx="211" cy="440" rx="10" ry="6"/><ellipse cx="395" cy="440" rx="13" ry="7"/><ellipse cx="424" cy="417" rx="7" ry="5"/></g>
  </svg>`;
}

function random(seed = 41) {
  let state = seed;
  return () => { state = (state * 16807) % 2147483647; return (state - 1) / 2147483646; };
}

function branch(THREE, from, to, bottom, top, material) {
  const start = new THREE.Vector3(...from), end = new THREE.Vector3(...to);
  const delta = end.clone().sub(start);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(top, bottom, delta.length(), 9), material);
  mesh.position.copy(start.add(end).multiplyScalar(.5));
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
  mesh.castShadow = true;
  return mesh;
}

function makeHero(THREE, scene) {
  const rng = random(71);
  const island = new THREE.Group();
  scene.add(island);
  const bark = new THREE.MeshStandardMaterial({ color: '#816044', roughness: .97 });
  const dirt = new THREE.MeshStandardMaterial({ color: '#a7815a', roughness: 1, flatShading: true });
  const groundMaterial = new THREE.MeshStandardMaterial({ color: '#a6b97b', roughness: 1 });
  const soil = new THREE.Mesh(new THREE.CylinderGeometry(2.18, 1.82, .48, 13), dirt);
  soil.position.y = -.33; soil.castShadow = true; soil.receiveShadow = true; island.add(soil);
  const turf = new THREE.Mesh(new THREE.CylinderGeometry(2.19, 2.17, .12, 40), groundMaterial);
  turf.position.y = -.04; turf.receiveShadow = true; island.add(turf);
  const tree = new THREE.Group(); island.add(tree);

  const trunk = [[0, .02, 0], [.04, .8, .04], [-.09, 1.52, 0], [.03, 2.17, -.03], [-.08, 2.92, -.01], [.05, 3.52, 0]];
  for (let i = 0; i < trunk.length - 1; i++) tree.add(branch(THREE, trunk[i], trunk[i + 1], .18 - i * .025, .155 - i * .025, bark));
  const branches = [
    [[-.04, 1.27, 0], [-.7, 2.04, .15], .12, .085],
    [[-.7, 2.04, .15], [-1.19, 2.72, .18], .085, .025],
    [[-.7, 2.04, .15], [-1.37, 2.29, .64], .06, .018],
    [[0, 1.73, -.02], [.7, 2.31, -.1], .11, .065],
    [[.7, 2.31, -.1], [1.28, 2.82, .08], .065, .02],
    [[.06, 2.16, -.03], [.48, 2.89, -.75], .085, .025],
    [[-.04, 1.89, 0], [-.32, 2.69, .79], .09, .03],
    [[-.03, 2.44, 0], [-.73, 3.22, -.5], .075, .022],
    [[-.06, 2.84, 0], [.48, 3.54, .38], .065, .018],
    [[-.05, 2.38, 0], [-.45, 3.27, .49], .06, .018],
  ];
  branches.forEach(([a, b, bottom, top]) => tree.add(branch(THREE, a, b, bottom, top, bark)));
  for (let i = 0; i < 8; i++) {
    const angle = i / 8 * Math.PI * 2;
    island.add(branch(THREE, [0, .13, 0], [Math.cos(angle) * (.6 + rng() * .5), .025, Math.sin(angle) * (.6 + rng() * .5)], .095, .018, bark));
  }

  const canopy = new THREE.Group(); tree.add(canopy);
  const leafGeometry = new THREE.IcosahedronGeometry(1, 2);
  const vertices = leafGeometry.attributes.position;
  for (let i = 0; i < vertices.count; i++) {
    const x = vertices.getX(i), y = vertices.getY(i), z = vertices.getZ(i);
    const wave = 1 + Math.sin(x * 7 + y * 3) * Math.sin(z * 5 + y * 6) * .06;
    vertices.setXYZ(i, x * wave, y * wave, z * wave);
  }
  leafGeometry.computeVertexNormals();
  const leafMaterial = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .88 });
  const centers = [
    [-1.02, 2.72, .2, .76], [-.6, 3.26, -.44, .78], [.03, 3.7, -.05, .87],
    [.71, 3.31, .03, .87], [1.18, 2.81, .08, .74], [.6, 2.91, -.72, .72],
    [-.33, 2.82, .75, .81], [.54, 3.5, .55, .66], [-.45, 3.42, .49, .68],
    [-1.28, 2.32, .61, .49], [1.22, 2.45, .53, .52], [.35, 2.53, .79, .65],
    [-.68, 2.65, -.68, .6], [.3, 3.23, -.75, .66],
  ];
  const colors = ['#4c7844', '#678d4b', '#789e53', '#8eb360', '#598246', '#a0bb68'];
  const cluster = new THREE.InstancedMesh(leafGeometry, leafMaterial, centers.length);
  const dummy = new THREE.Object3D();
  centers.forEach(([x, y, z, scale], i) => {
    dummy.position.set(x, y, z); dummy.rotation.set(rng(), rng(), rng());
    dummy.scale.set(scale * (1.08 + rng() * .12), scale * (.85 + rng() * .15), scale);
    dummy.updateMatrix(); cluster.setMatrixAt(i, dummy.matrix);
    cluster.setColorAt(i, new THREE.Color(colors[i % colors.length]));
  });
  cluster.castShadow = true; cluster.receiveShadow = true; canopy.add(cluster);

  const leaflets = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.14, 0), leafMaterial, 105);
  for (let i = 0; i < 105; i++) {
    const [cx, cy, cz, radius] = centers[i % centers.length];
    const angle = rng() * Math.PI * 2, elevation = (rng() - .5) * Math.PI;
    dummy.position.set(cx + Math.cos(angle) * Math.cos(elevation) * radius * .91, cy + Math.sin(elevation) * radius * .79, cz + Math.sin(angle) * Math.cos(elevation) * radius * .91);
    dummy.rotation.set(rng() * 3, rng() * 3, rng() * 3); dummy.scale.set(.8, .45, 1.5); dummy.updateMatrix();
    leaflets.setMatrixAt(i, dummy.matrix); leaflets.setColorAt(i, new THREE.Color(colors[(i + 3) % colors.length]));
  }
  leaflets.castShadow = true; canopy.add(leaflets);

  const grass = new THREE.InstancedMesh(new THREE.ConeGeometry(.024, .18, 3), new THREE.MeshStandardMaterial({ color: '#617c3e', roughness: 1 }), 130);
  for (let i = 0; i < 130; i++) {
    const angle = rng() * Math.PI * 2, radius = .35 + Math.sqrt(rng()) * 1.65;
    dummy.position.set(Math.cos(angle) * radius, .09, Math.sin(angle) * radius);
    dummy.rotation.set((rng() - .5) * .4, angle, (rng() - .5) * .3); dummy.scale.set(1, .55 + rng(), 1); dummy.updateMatrix(); grass.setMatrixAt(i, dummy.matrix);
  }
  island.add(grass);
  const pebbles = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(.11, 0), new THREE.MeshStandardMaterial({ color: '#c7c2a9', roughness: 1 }), 19);
  for (let i = 0; i < 19; i++) {
    const angle = rng() * Math.PI * 2, radius = .55 + rng() * 1.45;
    dummy.position.set(Math.cos(angle) * radius, .025, Math.sin(angle) * radius); dummy.rotation.set(rng(), rng(), rng()); dummy.scale.set(1 + rng(), .5, .8 + rng()); dummy.updateMatrix(); pebbles.setMatrixAt(i, dummy.matrix);
  }
  pebbles.castShadow = true; island.add(pebbles);

  const pollenPositions = new Float32Array(24 * 3);
  for (let i = 0; i < 24; i++) { pollenPositions[i * 3] = (rng() - .5) * 5.5; pollenPositions[i * 3 + 1] = .5 + rng() * 4; pollenPositions[i * 3 + 2] = (rng() - .5) * 4.2; }
  const pollenGeometry = new THREE.BufferGeometry(); pollenGeometry.setAttribute('position', new THREE.BufferAttribute(pollenPositions, 3));
  const pollen = new THREE.Points(pollenGeometry, new THREE.PointsMaterial({ color: '#c4a75a', size: .035, transparent: true, opacity: .65, depthWrite: false }));
  scene.add(pollen);
  return {
    cameraPosition: [6.3, 4.0, 7.8], lookAt: [0, 1.86, 0], viewHeight: 6.1,
    animate(time, intro, pointer) {
      tree.scale.setScalar(.88 + intro * .12);
      canopy.rotation.z = Math.sin(time * .6) * .018;
      canopy.rotation.x = Math.cos(time * .45) * .012;
      island.rotation.y = pointer.x * .1;
      island.position.y = Math.sin(time * .65) * .022;
      pollen.rotation.y = time * .025; pollen.position.y = Math.sin(time * .4) * .11;
    },
  };
}

export function groveGrowthScale(stage = 'current', variation = 0) {
  const scale = { baseline: .46, young: .46, funded: .46, current: .85, future: 1.35 }[stage] ?? .85;
  return scale * (1 + Math.max(0, Math.min(1, variation)) * .12);
}

function makeGrove(THREE, scene, count, stage) {
  const rng = random(19), groupCount = Math.max(1, Math.min(36, count));
  const perGroup = Math.ceil(count / groupCount), actualGroups = Math.ceil(count / perGroup);
  const columns = Math.ceil(Math.sqrt(actualGroups)), rows = Math.ceil(actualGroups / columns);
  const grove = new THREE.Group(); scene.add(grove);
  const width = columns * 1.12 + .55, depth = rows * 1.12 + .55;
  const soil = new THREE.Mesh(new THREE.BoxGeometry(width, .32, depth), new THREE.MeshStandardMaterial({ color: '#aa8865', roughness: 1 }));
  soil.position.y = -.24; soil.receiveShadow = true; soil.castShadow = true; grove.add(soil);
  const turf = new THREE.Mesh(new THREE.BoxGeometry(width + .03, .08, depth + .03), new THREE.MeshStandardMaterial({ color: '#b4c18d', roughness: 1 }));
  turf.position.y = -.035; turf.receiveShadow = true; grove.add(turf);
  const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(.035, .06, .85, 7), new THREE.MeshStandardMaterial({ color: '#806247', roughness: 1 }), actualGroups);
  const leaves = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.4, 1), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .9 }), actualGroups * 4);
  const dummy = new THREE.Object3D(), ranges = [];
  const colors = ['#4d7844', '#648a47', '#769c50', '#86a65a'];
  for (let i = 0; i < actualGroups; i++) {
    const col = i % columns, row = Math.floor(i / columns);
    const x = (col - (columns - 1) / 2) * 1.12, z = (row - (rows - 1) / 2) * 1.12;
    const scale = groveGrowthScale(stage, rng());
    dummy.position.set(x, .4 * scale, z); dummy.rotation.set(0, 0, 0); dummy.scale.set(scale, scale, scale); dummy.updateMatrix(); trunks.setMatrixAt(i, dummy.matrix);
    const offsets = [[-.17, .94, 0], [.19, .97, .06], [0, 1.24, -.02], [.03, .99, -.2]];
    offsets.forEach(([ox, oy, oz], j) => {
      dummy.position.set(x + ox * scale, oy * scale, z + oz * scale); dummy.rotation.set(rng(), rng(), rng()); dummy.scale.set(scale, scale * 1.04, scale); dummy.updateMatrix();
      leaves.setMatrixAt(i * 4 + j, dummy.matrix); leaves.setColorAt(i * 4 + j, new THREE.Color(colors[(i + j) % colors.length]));
    });
    ranges.push({ index: i, start: i * perGroup, end: Math.min(count, (i + 1) * perGroup) });
  }
  trunks.castShadow = true; leaves.castShadow = true; leaves.receiveShadow = true;
  grove.add(trunks, leaves);
  const irrigationMaterial = new THREE.MeshStandardMaterial({ color: '#79968c', roughness: 1 });
  for (let row = 0; row < rows; row++) grove.add(branch(THREE, [-width / 2 + .1, .025, (row - (rows - 1) / 2) * 1.12 + .3], [width / 2 - .1, .025, (row - (rows - 1) / 2) * 1.12 + .3], .018, .018, irrigationMaterial));
  return {
    cameraPosition: [8, 7, 9], lookAt: [0, .35, 0], viewHeight: Math.max(5.4, rows * 1.05 + 2.3),
    ranges, hitTargets: [leaves, trunks],
    rangeForHit(hit) { return ranges[hit.object === leaves ? Math.floor(hit.instanceId / 4) : hit.instanceId]; },
    animate(time, intro, pointer) { grove.rotation.y = pointer.x * .045; grove.position.y = Math.sin(time * .45) * .007; },
  };
}

function mountScene(element, { mode = 'hero', count = 500, stage = 'current', onSelect, pauseButton } = {}) {
  if (!element) return () => {};
  let disposed = false, resourcesDisposed = false, renderer, scene, frame = 0, observer, resizeObserver, content;
  let manualPaused = false, isVisible = true, webglLost = false, elapsed = 0, lastFrame = 0, hasRendered = false;
  const cleanups = [], pointer = { x: 0, y: 0 }, currentPointer = { x: 0, y: 0 };
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = motion.matches;
  element.classList.add('girth-scene');
  if (!element.querySelector('.girth-scene-fallback')) element.insertAdjacentHTML('afterbegin', treeFallback());
  const setControl = () => {
    if (!pauseButton) return;
    const paused = manualPaused || reduced;
    pauseButton.textContent = paused ? 'Play animation' : 'Pause animation';
    pauseButton.setAttribute('aria-pressed', String(paused));
    pauseButton.hidden = !hasRendered;
  };
  setControl();

  function disposeResources() {
    if (resourcesDisposed) return;
    resourcesDisposed = true;
    const geometries = new Set(), materials = new Set();
    scene?.traverse(object => {
      if (object.geometry) geometries.add(object.geometry);
      if (object.material) (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => materials.add(material));
    });
    geometries.forEach(geometry => geometry.dispose());
    materials.forEach(material => material.dispose());
    renderer?.dispose();
    renderer?.forceContextLoss();
  }

  import(THREE_URL).then(THREE => {
    if (disposed) return;
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.className = 'girth-scene-canvas';
    renderer.domElement.setAttribute('aria-hidden', 'true');
    element.append(renderer.domElement);
    scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight('#e6f1e9', '#776b43', 2.5));
    const sunlight = new THREE.DirectionalLight('#fff6df', 3.1); sunlight.position.set(-3, 7, 5); sunlight.castShadow = true;
    sunlight.shadow.mapSize.set(1024, 1024); sunlight.shadow.camera.left = -6; sunlight.shadow.camera.right = 6; sunlight.shadow.camera.top = 7; sunlight.shadow.camera.bottom = -6;
    sunlight.shadow.normalBias = .03; sunlight.shadow.bias = -.0004; scene.add(sunlight);
    scene.add(new THREE.DirectionalLight('#e8f2e0', .4));
    content = mode === 'grove' ? makeGrove(THREE, scene, count, stage) : makeHero(THREE, scene);
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ color: '#577354', opacity: .12 }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = mode === 'grove' ? -.52 : -.83; shadow.receiveShadow = true; scene.add(shadow);
    const camera = new THREE.OrthographicCamera(-4, 4, 3, -3, .1, 60);
    camera.position.set(...content.cameraPosition); camera.lookAt(...content.lookAt);
    function renderOnce() {
      if (disposed || webglLost) return;
      content.animate(elapsed, reduced || manualPaused ? 1 : Math.min(1, elapsed / 1.3), currentPointer);
      renderer.render(scene, camera);
      if (!hasRendered) { hasRendered = true; element.classList.add('girth-scene-ready'); setControl(); }
    }
    function resize() {
      if (disposed) return;
      const width = Math.max(1, element.clientWidth), height = Math.max(1, element.clientHeight);
      const aspect = width / height, viewHeight = content.viewHeight * (aspect < .8 ? .8 / aspect : 1);
      camera.left = -viewHeight * aspect / 2; camera.right = viewHeight * aspect / 2; camera.top = viewHeight / 2; camera.bottom = -viewHeight / 2; camera.updateProjectionMatrix();
      renderer.setSize(width, height, false); renderOnce();
    }
    function animate(now) {
      frame = 0;
      if (disposed || document.hidden || !isVisible || manualPaused || reduced || webglLost) return;
      if (!lastFrame) lastFrame = now;
      const delta = now - lastFrame;
      if (delta >= 32) {
        elapsed += Math.min(delta / 1000, .06); lastFrame = now;
        currentPointer.x += (pointer.x - currentPointer.x) * .06;
        currentPointer.y += (pointer.y - currentPointer.y) * .06;
        renderOnce();
      }
      frame = requestAnimationFrame(animate);
    }
    function syncAnimation() {
      cancelAnimationFrame(frame); frame = 0; lastFrame = 0;
      if (!disposed && !document.hidden && isVisible && !manualPaused && !reduced && !webglLost) frame = requestAnimationFrame(animate);
      else renderOnce();
      setControl();
    }
    const onVisibility = () => syncAnimation();
    const onMotion = event => { reduced = event.matches; syncAnimation(); };
    const onPause = event => { event.preventDefault(); manualPaused = !(manualPaused || reduced); if (!manualPaused) reduced = false; syncAnimation(); };
    const onPointer = event => {
      if (event.pointerType === 'touch' || reduced) return;
      const bounds = element.getBoundingClientRect(); pointer.x = (event.clientX - bounds.left) / bounds.width * 2 - 1; pointer.y = (event.clientY - bounds.top) / bounds.height * 2 - 1;
    };
    const onLeave = () => { pointer.x = 0; pointer.y = 0; };
    const onContextLost = event => { event.preventDefault(); webglLost = true; element.classList.remove('girth-scene-ready'); if (pauseButton) pauseButton.hidden = true; cancelAnimationFrame(frame); };
    const onContextRestored = () => { webglLost = false; hasRendered = false; resize(); syncAnimation(); };
    document.addEventListener('visibilitychange', onVisibility);
    motion.addEventListener('change', onMotion);
    pauseButton?.addEventListener('click', onPause);
    element.addEventListener('pointermove', onPointer); element.addEventListener('pointerleave', onLeave);
    renderer.domElement.addEventListener('webglcontextlost', onContextLost); renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);
    cleanups.push(() => { document.removeEventListener('visibilitychange', onVisibility); motion.removeEventListener('change', onMotion); pauseButton?.removeEventListener('click', onPause); element.removeEventListener('pointermove', onPointer); element.removeEventListener('pointerleave', onLeave); renderer.domElement.removeEventListener('webglcontextlost', onContextLost); renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored); });
    if ('ResizeObserver' in window) { resizeObserver = new ResizeObserver(resize); resizeObserver.observe(element); }
    else { window.addEventListener('resize', resize); cleanups.push(() => window.removeEventListener('resize', resize)); }
    if ('IntersectionObserver' in window) { observer = new IntersectionObserver(entries => { isVisible = entries[0].isIntersecting; syncAnimation(); }, { threshold: .04 }); observer.observe(element); }

    if (mode === 'grove' && typeof onSelect === 'function') {
      const raycaster = new THREE.Raycaster(), mouse = new THREE.Vector2();
      let pointerDown = null;
      const down = event => { pointerDown = { x: event.clientX, y: event.clientY }; };
      const up = event => {
        if (!pointerDown || Math.hypot(pointerDown.x - event.clientX, pointerDown.y - event.clientY) > 8) return;
        pointerDown = null;
        const bounds = renderer.domElement.getBoundingClientRect(); mouse.set((event.clientX - bounds.left) / bounds.width * 2 - 1, -((event.clientY - bounds.top) / bounds.height) * 2 + 1);
        raycaster.setFromCamera(mouse, camera); const hit = raycaster.intersectObjects(content.hitTargets, false)[0];
        if (hit) onSelect(content.rangeForHit(hit));
      };
      element.addEventListener('pointerdown', down); element.addEventListener('pointerup', up);
      cleanups.push(() => { element.removeEventListener('pointerdown', down); element.removeEventListener('pointerup', up); });
      renderer.domElement.style.cursor = 'pointer';
    }
    resize(); syncAnimation();
  }).catch(error => {
    if (disposed) return;
    console.warn('Girth scene is using its static illustration:', error.message);
    webglLost = true; cancelAnimationFrame(frame); observer?.disconnect(); resizeObserver?.disconnect(); cleanups.forEach(cleanup => cleanup());
    element.classList.remove('girth-scene-ready');
    if (pauseButton) pauseButton.hidden = true;
    disposeResources(); renderer?.domElement.remove();
  });

  return () => {
    disposed = true; cancelAnimationFrame(frame); observer?.disconnect(); resizeObserver?.disconnect(); cleanups.forEach(cleanup => cleanup());
    disposeResources(); renderer?.domElement.remove(); element.classList.remove('girth-scene-ready');
  };
}

export function mountTree(element, { pauseButton } = {}) {
  return mountScene(element, { mode: 'hero', pauseButton });
}

/** onSelect receives { index, start, end }; start is zero-based, end exclusive. */
export function mountGrove(element, { count = 500, onSelect, stage = 'current' } = {}) {
  const safeCount = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
  element.classList.add('girth-grove-scene');
  element.dataset.growthStage = stage;
  if (safeCount === 0) {
    element.innerHTML = '<div class="girth-grove-empty"><strong>Your grove starts here.</strong><p>Fund a planting batch to begin growing this scene.</p></div>';
    return () => {};
  }
  const groupCount = Math.min(36, safeCount), perGroup = Math.ceil(safeCount / groupCount), actualGroups = Math.ceil(safeCount / perGroup);
  const browse = document.createElement('details'); browse.className = 'girth-grove-browse';
  const summary = document.createElement('summary'); summary.textContent = 'Browse tree groups'; browse.append(summary);
  const list = document.createElement('div'); list.className = 'girth-grove-group-list';
  for (let i = 0; i < actualGroups; i++) {
    const start = i * perGroup, end = Math.min(safeCount, (i + 1) * perGroup);
    const button = document.createElement('button'); button.type = 'button'; button.textContent = `${start + 1}–${end}`; button.setAttribute('aria-label', `Inspect trees ${start + 1} to ${end}`);
    button.addEventListener('click', () => onSelect?.({ index: i, start, end })); list.append(button);
  }
  browse.append(list); element.append(browse);
  const pauseButton = document.createElement('button'); pauseButton.type = 'button'; pauseButton.className = 'girth-grove-pause'; pauseButton.textContent = 'Pause animation'; pauseButton.hidden = true; element.append(pauseButton);
  const stop = mountScene(element, { mode: 'grove', count: safeCount, stage, onSelect, pauseButton });
  return () => { stop(); browse.remove(); pauseButton.remove(); };
}
