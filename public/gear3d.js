/* ============================================================
   gear3d.js — procedural 3D steel gears, no image needed.
   Needs three.js r128 (loaded before this file) and:
   <div class="gear-container" id="gearStage"><canvas id="gearCanvas"></canvas></div>
   ============================================================ */
(function () {
  const canvas = document.getElementById('gearCanvas');
  const stage = document.getElementById('gearStage');
  if (!canvas || !stage || !window.THREE) return;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch (e) { return; }                      // no WebGL: the dark hero background stays

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rebuildEnvironment = () => { scene.environment = pmrem.fromScene(env, 0.04).texture; };
  renderer.setClearColor(0x000000, 0);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 1, 100);
  camera.position.z = 30;
  const VIEW_H = 2 * 30 * Math.tan(THREE.MathUtils.degToRad(17.5));   // visible height at z = 0

  /* ---------- studio environment so the metal has something to reflect ---------- */
  const env = new THREE.Scene();
  env.add(new THREE.Mesh(new THREE.BoxGeometry(40, 40, 40), new THREE.MeshBasicMaterial({ color: 0x15181d, side: THREE.BackSide })));
  [[-14, 12, 10, 8, 3, 1.6], [16, 6, 8, 5, 9, 1.2], [0, -14, 12, 14, 2, 1.0], [0, 16, -6, 18, 2, 0.8]].forEach(([x, y, z, w, h, k]) => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(k, k, k), side: THREE.DoubleSide }));
    p.position.set(x, y, z); p.lookAt(0, 0, 0); env.add(p);
  });
  const pmrem = new THREE.PMREMGenerator(renderer);
  rebuildEnvironment();

  scene.add(new THREE.DirectionalLight(0xffffff, 1.1).translateX(-8).translateY(10).translateZ(14));
  const redRim = new THREE.PointLight(0xe63946, 0.9, 40); redRim.position.set(10, -6, 8); scene.add(redRim);

  const steel = new THREE.MeshStandardMaterial({ color: 0xa4a9af, metalness: 1, roughness: 0.4 });
  const dark  = new THREE.MeshStandardMaterial({ color: 0x5b6067, metalness: 1, roughness: 0.55 });

  /* ---------- geometry helpers ---------- */
  const TAU = Math.PI * 2;
  function gearShape(teeth, r, h, holeR) {
    const s = new THREE.Shape(), st = TAU / teeth, ro = r + h / 2, rr = r - h / 2;
    for (let i = 0; i < teeth; i++) {
      const a = i * st;
      [[-.32, rr], [-.16, ro], [.16, ro], [.32, rr]].forEach(([d, rad], j) => {
        const x = Math.cos(a + d * st) * rad, y = Math.sin(a + d * st) * rad;
        (i === 0 && j === 0) ? s.moveTo(x, y) : s.lineTo(x, y);
      });
    }
    s.closePath();
    s.holes.push(new THREE.Path().absarc(0, 0, holeR, 0, TAU, true));
    return s;
  }
  function ring(rOut, rIn, depth) {
    const s = new THREE.Shape(); s.absarc(0, 0, rOut, 0, TAU, false);
    s.holes.push(new THREE.Path().absarc(0, 0, rIn, 0, TAU, true));
    return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 48 });
  }
  function makeGear(d) {
    const g = new THREE.Group(), T = 0.7;
    const body = new THREE.Mesh(new THREE.ExtrudeGeometry(gearShape(d.n, d.r, 0.52, d.r * 0.3),
      { depth: T, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2, curveSegments: 6 }), steel);
    body.position.z = -T / 2; g.add(body);
    [1, -1].forEach(side => {                                          // raised rim on both faces
      const rm = new THREE.Mesh(ring(d.r * 0.82, d.r * 0.74, 0.1), dark);
      rm.position.z = side * (T / 2 + 0.01) - (side < 0 ? 0.1 : 0); g.add(rm);
    });
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(d.r * 0.3, d.r * 0.3, T + 0.5, 48), steel);
    hub.rotation.x = Math.PI / 2; g.add(hub);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(d.r * 0.14, d.r * 0.14, T + 0.7, 32), dark);
    cap.rotation.x = Math.PI / 2; g.add(cap);
    if (d.bolts) for (let i = 0; i < 3; i++) {                         // hex bolts like the photo
      const a = i * TAU / 3 + Math.PI / 2;
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.3, 6), steel);
      b.rotation.x = Math.PI / 2; b.position.set(Math.cos(a) * d.r * 0.55, Math.sin(a) * d.r * 0.55, T / 2 + 0.1); g.add(b);
    }
    g.position.set(d.x, d.y, 0); return g;
  }

  /* ---------- three meshing gears (module 0.25, so teeth = 8 × radius) ---------- */
  const A = { r: 3, n: 24, x: -3, y: 1,  dir: 1 };
  const C = { r: 2, n: 16, x: 0,  y: -3, dir: -1 };
  const B = { r: 3, n: 24, x: 4,  y: 0,  dir: 1, bolts: true };
  const gears = [A, C, B];

  // phase the teeth so they interlock (tooth of one lands in gap of the next)
  const mod1 = x => ((x % 1) + 1) % 1;
  A.rot = 0;
  const phi = Math.atan2(C.y - A.y, C.x - A.x);
  C.rot = phi + Math.PI - mod1((phi - A.rot) / (TAU / A.n) + 0.5) * (TAU / C.n);
  const psi = Math.atan2(B.y - C.y, B.x - C.x);
  B.rot = psi + Math.PI - mod1((psi - C.rot) / (TAU / C.n) + 0.5) * (TAU / B.n);

  /* ---------- one cluster of 3 gears, cloned so tall phone heroes get balanced top-to-bottom ---------- */
  const SCENE_W = 14, SCENE_H = 9.5, CX = 0.5, CY = -0.5, MAX_CLUSTERS = 6;
  const rig = new THREE.Group(); scene.add(rig);               // the pointer parallax tilts the whole rig
  const proto = new THREE.Group();
  gears.forEach(d => { d.mesh = makeGear(d); d.mesh.rotation.z = d.rot; proto.add(d.mesh); });
  const clusters = [proto];
  for (let i = 1; i < MAX_CLUSTERS; i++) clusters.push(proto.clone());   // clones share geometry and materials
  clusters.forEach(c => rig.add(c));
  let activeClusters = 1;

  function resize() {
    const w = stage.clientWidth || 1, h = stage.clientHeight || 1;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, w < 700 ? 1.5 : 1.75));
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();

    const fitW  = (VIEW_H * camera.aspect) / SCENE_W;          // cluster fits the width (phones)
    const cover = Math.max(fitW, VIEW_H / SCENE_H);            // cluster fills the hero (desktop)
    const k = Math.min(Math.max((camera.aspect - 0.9) / 0.6, 0), 1);   // 0 = portrait, 1 = wide
    const small = fitW * 1.08, big = cover * 1.02;             // raise/lower 1.08 to resize gears on phones
    const s = small + (big - small) * k;

    // how many clusters stack to fill the hero height (1 on desktop, several on a tall phone hero)
    const n = Math.min(MAX_CLUSTERS, Math.max(1, Math.round(VIEW_H / (SCENE_H * s * 1.05))));
    clusters.forEach((c, i) => {
      c.visible = i < n;
      c.scale.setScalar(s);
      c.position.set(-CX * s, (0.5 - (i + 0.5) / n) * VIEW_H - CY * s, 0);   // evenly spaced, centered on the hero
    });
    activeClusters = n;
    renderer.render(scene, camera);
  }
  new ResizeObserver(resize).observe(stage); resize();

  /* ---------- animation ---------- */
  const SPEED = 0.16;                               // rad/s of the big gear
  let t = 0, last = performance.now(), running = false, visible = true, px = 0, py = 0;
  stage.parentElement.addEventListener('pointermove', e => {
    px = (e.clientX / innerWidth - 0.5) * 0.18; py = (e.clientY / innerHeight - 0.5) * 0.12;
  }, { passive: true });

  function frame(now) {
    if (!running) return;
    t += Math.min((now - last) / 1000, 0.05); last = now;
    for (let c = 0; c < activeClusters; c++)
      gears.forEach((d, i) => { clusters[c].children[i].rotation.z = d.rot + d.dir * SPEED * (3 / d.r) * t; });
    rig.rotation.y += (px - rig.rotation.y) * 0.04;     // gentle parallax
    rig.rotation.x += (py - rig.rotation.x) * 0.04;
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  function start() { if (!running && visible && !document.hidden && !reduceMotion) { running = true; last = performance.now(); requestAnimationFrame(frame); } }
  function stop() { running = false; }

  // phones can drop the WebGL context (low memory, tab switching): recover instead of leaving a blank hero
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); stop(); });
  canvas.addEventListener('webglcontextrestored', () => { rebuildEnvironment(); resize(); start(); });

  renderer.render(scene, camera);                    // first paint / reduced-motion still frame
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop(); }).observe(stage);
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
  start();
})();