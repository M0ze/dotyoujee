// Subtle Three.js interactive background - Green hacker vibe
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg-canvas'),
  alpha: true
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.setZ(30);

// Create a group for lines
const linesGroup = new THREE.Group();
scene.add(linesGroup);

// Create many lines for matrix effect
function createLines() {
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.3 });
  const geometry = new THREE.BufferGeometry();
  
  const vertices = [];
  const count = 200; // number of lines
  for (let i = 0; i < count; i++) {
    const x1 = (Math.random() - 0.5) * 40;
    const y1 = (Math.random() - 0.5) * 40;
    const z1 = (Math.random() - 0.5) * 40;
    const x2 = x1 + (Math.random() - 0.5) * 5;
    const y2 = y1 + (Math.random() - 0.5) * 5;
    const z2 = z1 + (Math.random() - 0.5) * 5;
    vertices.push(x1, y1, z1, x2, y2, z2);
  }
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  
  const line = new THREE.LineSegments(geometry, lineMaterial);
  linesGroup.add(line);
}
createLines();

// Add a subtle torus for depth
const geometry = new THREE.TorusGeometry(8, 2, 16, 100);
const material = new THREE.MeshStandardMaterial({ color: 0x059669, wireframe: true });
const torus = new THREE.Mesh(geometry, material);
scene.add(torus);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7);
scene.add(directionalLight);

function animate() {
  requestAnimationFrame(animate);
  
  // Slow rotation
  linesGroup.rotation.y += 0.0005;
  linesGroup.rotation.x += 0.0002;
  
  torus.rotation.x += 0.005;
  torus.rotation.y += 0.003;
  
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});