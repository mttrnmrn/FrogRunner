import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * Creates a simple Three.js scene with a rotating 'frog orb'.
 * Returns a cleanup function to stop animation & dispose resources.
 *
 * Copied from the provided reference project (3D part) and lightly adapted
 * to respect the container's current height when embedded in responsive layouts.
 */
export function initThreeScene(container, { height } = {}) {
  if (!container) throw new Error('Missing container');

  const resolvedHeight = height ?? container.clientHeight ?? 360;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b1020);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(container.clientWidth, resolvedHeight);
  container.appendChild(renderer.domElement);

  const camera = new THREE.PerspectiveCamera(55, container.clientWidth / resolvedHeight, 0.1, 100);
  camera.position.set(0, 1.2, 3.2);

  // Mouse/touch controls: drag to rotate view, scroll/pinch to zoom
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minDistance = 1.6;
  controls.maxDistance = 7.0;
  controls.target.set(0, 0, 0);
  controls.update();

  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);

  const dir = new THREE.DirectionalLight(0xffffff, 1.0);
  dir.position.set(2, 3, 1);
  scene.add(dir);

  // --- Frog character (simple, stylized) ---
  // Built from primitive meshes (no external model needed).
  const frog = new THREE.Group();
  frog.position.set(0, 0, 0);
  scene.add(frog);

  const greenMat = new THREE.MeshStandardMaterial({ color: 0x2fd36f, roughness: 0.55, metalness: 0.03 });
  const bellyMat = new THREE.MeshStandardMaterial({ color: 0xaeecc2, roughness: 0.75, metalness: 0.0 });

  const bodyGeo = new THREE.SphereGeometry(0.85, 32, 24);
  const bellyGeo = new THREE.SphereGeometry(0.6, 28, 20);
  const headGeo = new THREE.SphereGeometry(0.55, 32, 24);
  const footGeo = new THREE.SphereGeometry(0.16, 18, 14);

  // Body (slightly squashed sphere)
  const body = new THREE.Mesh(bodyGeo, greenMat);
  body.scale.set(1.25, 0.9, 1.15);
  body.position.set(0, -0.05, 0);
  frog.add(body);

  // Belly
  const belly = new THREE.Mesh(bellyGeo, bellyMat);
  belly.scale.set(1.1, 0.9, 0.75);
  belly.position.set(0, -0.12, 0.38);
  frog.add(belly);

  // Head
  const head = new THREE.Mesh(headGeo, greenMat);
  head.scale.set(1.1, 0.95, 1.0);
  head.position.set(0, 0.33, 0.55);
  frog.add(head);

  // Legs (simple capsules)
  const legGeo = new THREE.CapsuleGeometry(0.11, 0.45, 6, 14);
  function addLeg(x, z, rotY) {
    const leg = new THREE.Mesh(legGeo, greenMat);
    leg.position.set(x, -0.55, z);
    leg.rotation.set(Math.PI * 0.12, rotY, Math.PI * 0.45);
    frog.add(leg);
    // foot
    const foot = new THREE.Mesh(footGeo, greenMat);
    foot.scale.set(1.35, 0.55, 1.0);
    foot.position.set(x + Math.sign(x) * 0.18, -0.78, z + 0.12);
    frog.add(foot);
  }
  addLeg(-0.55, -0.15, Math.PI * -0.05);
  addLeg(0.55, -0.15, Math.PI * 0.05);

  // Arms
  const armGeo = new THREE.CapsuleGeometry(0.085, 0.32, 6, 12);
  function addArm(x) {
    const arm = new THREE.Mesh(armGeo, greenMat);
    arm.position.set(x, -0.18, 0.55);
    arm.rotation.set(Math.PI * 0.08, 0, Math.PI * 0.22 * (x < 0 ? 1 : -1));
    frog.add(arm);
  }
  addArm(-0.65);
  addArm(0.65);

  const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2 });
  const eyeGeo = new THREE.SphereGeometry(0.16, 24, 24);
  const pupilGeo = new THREE.SphereGeometry(0.06, 16, 16);

  function makeEye(x) {
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    // Place eyes on top/front of the head
    eye.position.set(x, 0.68, 0.98);
    const pupil = new THREE.Mesh(pupilGeo, pupilMat);
    pupil.position.set(0, 0, 0.14);
    eye.add(pupil);
    frog.add(eye);
    return { eye, pupil };
  }

  const leftEye = makeEye(-0.35);
  const rightEye = makeEye(0.35);

  // Subtle ground
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(4, 64),
    new THREE.MeshStandardMaterial({ color: 0x141a33, roughness: 1.0 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1.25;
  scene.add(ground);

  // Simple pointer interaction: move pointer to tilt the frog.
  let targetRX = 0;
  let targetRY = 0;
  function onPointerMove(e) {
    const rect = container.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    targetRY = nx * 0.6;
    targetRX = -ny * 0.35;
  }
  container.addEventListener('pointermove', onPointerMove);

  let raf = 0;
  function animate() {
    raf = requestAnimationFrame(animate);

    // Gentle idle motion
    frog.rotation.y += 0.01;
    frog.rotation.x += 0.004;

    // Ease toward pointer tilt
    frog.rotation.y += (targetRY - frog.rotation.y) * 0.02;
    frog.rotation.x += (targetRX - frog.rotation.x) * 0.02;

    // Eyes follow a bit
    leftEye.eye.rotation.y = targetRY * 0.6;
    rightEye.eye.rotation.y = targetRY * 0.6;

    controls.update();

    renderer.render(scene, camera);
  }
  animate();

  function resize() {
    const w = container.clientWidth;
    const h = (height ?? container.clientHeight) || 360;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  const ro = new ResizeObserver(() => resize());
  ro.observe(container);

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    container.removeEventListener('pointermove', onPointerMove);
    renderer.dispose();
    controls.dispose();

    // Frog resources
    bodyGeo.dispose();
    bellyGeo.dispose();
    headGeo.dispose();
    footGeo.dispose();
    legGeo.dispose();
    armGeo.dispose();
    greenMat.dispose();
    bellyMat.dispose();

    ground.geometry.dispose();
    ground.material.dispose();
    eyeGeo.dispose();
    pupilGeo.dispose();
    eyeMat.dispose();
    pupilMat.dispose();

    container.innerHTML = '';
  };
}