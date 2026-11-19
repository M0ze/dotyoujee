/* ==========================================================================
   dotyoujee — persistent Three.js stage (ES module)
   Particle globe + fresnel/scan shader + bloom postprocessing.
   Scroll drives the camera and globe from the hero through to the final CTA.
   ========================================================================== */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const canvas = document.getElementById('webgl-canvas');
const stage = document.getElementById('stage');

if (canvas && stage) {
  try { initScene(canvas, stage); }
  catch (err) { document.body.classList.add('no-webgl'); }
}

function initScene(canvas, stage) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MINT = 0x00f5d4;
  const IRIS = 0x8b7bff;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x05070a, 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 140);
  camera.position.set(0, 0, 15);

  // --- Glow pipeline ------------------------------------------------------
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.85, 0.55, 0.2);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  const world = new THREE.Group();
  scene.add(world);

  // --- Point-cloud globe --------------------------------------------------
  const pointMat = new THREE.PointsMaterial({
    color: 0x9dfff0, size: 0.042, sizeAttenuation: true,
    transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false
  });
  world.add(new THREE.Points(new THREE.IcosahedronGeometry(4.1, 5), pointMat));

  world.add(new THREE.Mesh(
    new THREE.SphereGeometry(4.02, 32, 24),
    new THREE.MeshBasicMaterial({ color: 0x05090d })
  ));

  world.add(new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.SphereGeometry(4.13, 26, 14)),
    new THREE.LineBasicMaterial({ color: MINT, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending, depthWrite: false })
  ));

  // --- Fresnel atmosphere + travelling scan band --------------------------
  const rimUniforms = {
    uColor: { value: new THREE.Color(MINT) },
    uTime: { value: 0 },
    uScan: { value: -4.2 }
  };
  const rim = new THREE.Mesh(new THREE.SphereGeometry(4.22, 48, 32), new THREE.ShaderMaterial({
    uniforms: rimUniforms,
    vertexShader: `
      varying vec3 vN; varying vec3 vV; varying float vY;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal);
        vV = normalize(-mv.xyz);
        vY = position.y;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 uColor; uniform float uTime; uniform float uScan;
      varying vec3 vN; varying vec3 vV; varying float vY;
      void main() {
        float fresnel = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 3.2);
        float breathe = 0.78 + 0.22 * sin(uTime * 1.2);
        float scan = exp(-pow((vY - uScan) * 2.2, 2.0));
        float alpha = fresnel * 0.55 * breathe + scan * 0.28;
        gl_FragColor = vec4(uColor + vec3(scan * 0.35), min(alpha, 0.9));
      }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.FrontSide
  }));
  world.add(rim);

  // --- Core ---------------------------------------------------------------
  const core = new THREE.Group();
  const coreWire = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.62, 1),
    new THREE.MeshBasicMaterial({ color: IRIS, wireframe: true, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending })
  );
  core.add(coreWire, new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.25, 1),
    new THREE.MeshBasicMaterial({ color: 0x0b1620 })
  ));
  world.add(core);

  // --- Rings --------------------------------------------------------------
  const rings = new THREE.Group();
  [
    { r: 5.35, tilt: [1.28, 0.2, 0.35], color: MINT, opacity: 0.42 },
    { r: 5.9, tilt: [0.5, -0.6, 0.2], color: IRIS, opacity: 0.3 },
    { r: 4.75, tilt: [1.75, 0.9, -0.4], color: MINT, opacity: 0.2 }
  ].forEach(spec => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(spec.r, 0.012, 6, 160),
      new THREE.MeshBasicMaterial({ color: spec.color, transparent: true, opacity: spec.opacity, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    ring.rotation.set(...spec.tilt);
    rings.add(ring);
  });
  world.add(rings);

  // --- Expanding pulse ring (audit runs + clicks on the globe) ------------
  const pulseMat = new THREE.MeshBasicMaterial({ color: MINT, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const pulseRing = new THREE.Mesh(new THREE.TorusGeometry(4.45, 0.035, 8, 128), pulseMat);
  pulseRing.visible = false;
  world.add(pulseRing);
  let pulseScale = 1;

  // --- Data arcs with travelling packets ----------------------------------
  const arcs = new THREE.Group();
  const packets = [];
  const packetGeo = new THREE.SphereGeometry(0.06, 8, 8);
  const packetMat = new THREE.MeshBasicMaterial({ color: 0xffffff, blending: THREE.AdditiveBlending });

  function spherePoint(radius) {
    const u = Math.random(), v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    return new THREE.Vector3(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.sin(phi) * Math.sin(theta),
      radius * Math.cos(phi)
    );
  }

  for (let i = 0; i < 9; i++) {
    const a = spherePoint(4.16), b = spherePoint(4.16);
    const mid = a.clone().add(b).multiplyScalar(0.5).normalize().multiplyScalar(5 + Math.random() * 0.8);
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    arcs.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(curve.getPoints(48)),
      new THREE.LineBasicMaterial({ color: i % 3 === 0 ? IRIS : MINT, transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false })
    ));
    const packet = new THREE.Mesh(packetGeo, packetMat);
    packet.userData = { curve, t: Math.random(), speed: 0.06 + Math.random() * 0.09 };
    arcs.add(packet);
    packets.push(packet);
  }
  world.add(arcs);

  // --- Starfield ----------------------------------------------------------
  const starPositions = [];
  for (let i = 0; i < 520; i++) {
    const p = spherePoint(11 + Math.random() * 26);
    starPositions.push(p.x, p.y, p.z);
  }
  const starsGeo = new THREE.BufferGeometry();
  starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
  const stars = new THREE.Points(starsGeo, new THREE.PointsMaterial({
    color: 0xbfe9ff, size: 0.045, transparent: true, opacity: 0.42, blending: THREE.AdditiveBlending, depthWrite: false
  }));
  scene.add(stars);

  // --- Responsive layout --------------------------------------------------
  let baseScale = 1, mobile = false;
  function layout() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (w < 2 || h < 2) return; // backgrounded tab can report zero size
    mobile = w < 900;
    baseScale = mobile ? (w < 560 ? 0.56 : 0.74) : Math.min(0.94, w / 1440 + 0.14);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(w, h, false);
    composer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    composer.setSize(Math.floor(w * 0.85), Math.floor(h * 0.85));
  }
  layout();

  // --- Interaction + scroll state -----------------------------------------
  const hero = document.getElementById('hero');
  const cta = document.querySelector('.cta');
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let heroTarget = 0, ctaTarget = 0, heroEase = 0, ctaEase = 0, pulse = 0, time = 0;

  function triggerPulse() {
    pulse = 1;
    pulseScale = 1;
    pulseRing.visible = true;
    pulseMat.opacity = 0.85;
  }
  window.addEventListener('dj:pulse', triggerPulse);
  window.addEventListener('pointermove', e => {
    pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });
  window.addEventListener('pointerdown', e => {
    if (hero && hero.contains(e.target) && !e.target.closest('a, button, input')) triggerPulse();
  }, { passive: true });

  function readScroll() {
    if (hero) {
      const h = hero.getBoundingClientRect();
      heroTarget = clamp(-h.top / Math.max(h.height, 1), 0, 1);
    }
    if (cta) {
      const c = cta.getBoundingClientRect();
      const center = c.top + c.height / 2;
      ctaTarget = clamp(1 - Math.abs(center - window.innerHeight / 2) / (window.innerHeight * 1.15), 0, 1);
    }
  }
  window.addEventListener('scroll', readScroll, { passive: true });
  window.addEventListener('resize', () => { layout(); readScroll(); }, { passive: true });
  readScroll();

  // --- Frame --------------------------------------------------------------
  const clock = new THREE.Clock();
  let running = true;

  function frame(delta) {
    if (window.innerWidth < 2 || window.innerHeight < 2) return;
    time += delta;
    heroEase += (heroTarget - heroEase) * 0.08;
    ctaEase += (ctaTarget - ctaEase) * 0.08;
    pointer.x += (pointer.tx - pointer.x) * 0.045;
    pointer.y += (pointer.ty - pointer.y) * 0.045;

    if (!reduced) {
      world.rotation.y += delta * (0.075 + heroEase * 0.06);
      rings.rotation.x += delta * 0.09;
      rings.rotation.z -= delta * 0.06;
      core.rotation.x -= delta * 0.22;
      core.rotation.y += delta * 0.17;
      stars.rotation.y += delta * 0.008;
      rimUniforms.uTime.value = time;
      rimUniforms.uScan.value = -4.3 + ((time * 0.85) % 8.6);

      world.rotation.x = -0.12 + heroEase * 0.34 + pointer.y * 0.12;
      world.rotation.z = pointer.x * 0.06;

      const targetX = mobile ? 0 : 3.85 * (1 - heroEase);
      world.position.x += (targetX - world.position.x) * 0.06;
      world.position.y += ((mobile ? 0 : -heroEase * 0.45) - world.position.y) * 0.06;
      world.scale.setScalar(baseScale * (1 + ctaEase * 0.16));

      const targetZ = (mobile ? 16 : 15) - heroEase * 2 - ctaEase * 2.2;
      camera.position.z += (targetZ - camera.position.z) * 0.05;

      packets.forEach(p => {
        p.userData.t = (p.userData.t + delta * p.userData.speed) % 1;
        p.position.copy(p.userData.curve.getPoint(p.userData.t));
      });

      if (pulse > 0.001) {
        pulse *= 0.95;
        pointMat.size = 0.042 + pulse * 0.06;
        coreWire.material.opacity = 0.75 + pulse * 0.25;
      } else if (pointMat.size !== 0.042) {
        pointMat.size = 0.042;
        coreWire.material.opacity = 0.75;
      }
      if (pulseRing.visible) {
        pulseScale += delta * 0.85;
        pulseRing.scale.setScalar(pulseScale);
        pulseMat.opacity = Math.max(0, 0.85 - (pulseScale - 1) * 1.4);
        if (pulseMat.opacity <= 0) pulseRing.visible = false;
      }
    }

    // Only draw while the hero or the final CTA is actually on screen.
    const h = hero ? hero.getBoundingClientRect() : { top: 0, bottom: 0 };
    const c = cta ? cta.getBoundingClientRect() : { top: -9999, bottom: -9999 };
    const visible = (h.bottom > -80 && h.top < window.innerHeight) || (c.bottom > -80 && c.top < window.innerHeight);
    if (visible || reduced) composer.render();
  }

  if (reduced) {
    frame(0);
    stage.classList.add('ready');
  } else {
    function tick() {
      if (!running) return;
      frame(Math.min(clock.getDelta(), 0.05));
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    stage.classList.add('ready');
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) running = false;
      else if (!running) { running = true; clock.getDelta(); requestAnimationFrame(tick); }
    });
  }
}
