/**
 * village3d.js - Three.js 3D 마을 & 건물 머리 위 실시간 라벨 추적 엔진
 */

let scene, camera, renderer;
let buildings = [];
let selectedBuilding = null;
let isDragging = false;
let dragPlane;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();

// 건물별 이름 및 기능 배지 데이터
const BUILDING_DATA = [
  { id: 'party', name: '트레이너 아지트', badge: '🎒 파티 관리', color: 0xe74c3c, x: -6, z: -4 },
  { id: 'gym', name: '포켓몬 체육관', badge: '⚔️ 랭크 배틀', color: 0xf39c12, x: 0, z: -6 },
  { id: 'mart', name: '프렌들리숍', badge: '🛒 아이템 상점', color: 0x3498db, x: 6, z: -4 },
  { id: 'daycare', name: '포켓몬 키우미집', badge: '🍬 훈련 & 진화', color: 0x2ecc71, x: -6, z: 4 },
  { id: 'lab', name: '오박사 연구소', badge: '🎲 10연차 소환', color: 0x9b59b6, x: 0, z: 4 },
  { id: 'dex', name: '전국 도감 타워', badge: '📖 수집 도감', color: 0x1abc9c, x: 6, z: 4 }
];

function init3DVillage() {
  const container = document.getElementById('village3dContainer');
  if (!container) return;

  const width = container.clientWidth;
  const height = container.clientHeight;

  // 1. Scene & Camera (아이소메트릭 사선 뷰)
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x27ae60);

  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(0, 22, 22);
  camera.lookAt(0, 0, 0);

  // 2. Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // 3. 조명
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(20, 40, 20);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  scene.add(dirLight);

  // 4. 그리드 필드
  const gridHelper = new THREE.GridHelper(30, 30, 0xf39c12, 0x1e824c);
  gridHelper.position.y = 0.01;
  scene.add(gridHelper);

  const planeGeo = new THREE.PlaneGeometry(50, 50);
  planeGeo.rotateX(-Math.PI / 2);
  dragPlane = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ visible: false }));
  scene.add(dragPlane);

  // 5. 3D 입체 건물 메쉬 생성
  buildings = [];
  BUILDING_DATA.forEach(bData => {
    const buildingMesh = create3DBuildingMesh(bData);
    
    const savedPos = localStorage.getItem(`b_pos_${bData.id}`);
    if (savedPos) {
      const parsed = JSON.parse(savedPos);
      buildingMesh.position.x = parsed.x;
      buildingMesh.position.z = parsed.z;
    } else {
      buildingMesh.position.x = bData.x;
      buildingMesh.position.z = bData.z;
    }

    buildingMesh.userData = { id: bData.id, name: bData.name, badge: bData.badge };
    scene.add(buildingMesh);
    buildings.push(buildingMesh);
  });

  // 6. 부유 라벨 DOM 생성
  createBuildingLabels();

  // 7. 이벤트 등록
  const canvasEl = renderer.domElement;
  canvasEl.addEventListener('mousedown', onMouseDown);
  canvasEl.addEventListener('mousemove', onMouseMove);
  canvasEl.addEventListener('mouseup', onMouseUp);

  window.addEventListener('resize', onWindowResize);

  animate();
}

/**
 * 건물 머리 위 부유 HTML 라벨 생성
 */
function createBuildingLabels() {
  const overlay = document.getElementById('buildingLabelsOverlay');
  if (!overlay) return;
  overlay.innerHTML = '';

  buildings.forEach(mesh => {
    const labelEl = document.createElement('div');
    labelEl.className = 'building-3d-label';
    labelEl.id = `label_3d_${mesh.userData.id}`;
    labelEl.innerHTML = `
      <div class="building-3d-badge">${mesh.userData.badge}</div>
      <div class="building-3d-title">${mesh.userData.name}</div>
    `;

    // 라벨 직접 클릭 시 시설 이동
    labelEl.onclick = (e) => {
      e.stopPropagation();
      if (typeof switchTab === 'function') {
        switchTab(mesh.userData.id);
      }
    };

    overlay.appendChild(labelEl);
    mesh.userData.labelEl = labelEl;
  });
}

/**
 * 3D 월드 좌표를 2D 화면 좌표로 변환하여 라벨 위치 동기화
 */
function updateLabelsPosition() {
  const container = document.getElementById('village3dContainer');
  if (!container || !camera || !renderer) return;

  const width = container.clientWidth;
  const height = container.clientHeight;
  const tempVec = new THREE.Vector3();

  buildings.forEach(mesh => {
    if (!mesh.userData.labelEl) return;

    // 건물 정수리 높이 (y + 3.4)
    tempVec.copy(mesh.position);
    tempVec.y += 3.4;
    tempVec.project(camera);

    const x = (tempVec.x * 0.5 + 0.5) * width;
    const y = (-tempVec.y * 0.5 + 0.5) * height;

    if (tempVec.z > 1.0) {
      mesh.userData.labelEl.style.display = 'none';
    } else {
      mesh.userData.labelEl.style.display = 'flex';
      mesh.userData.labelEl.style.left = `${x}px`;
      mesh.userData.labelEl.style.top = `${y}px`;
    }
  });
}

/**
 * 3D 건물 메쉬 생성
 */
function create3DBuildingMesh(data) {
  const group = new THREE.Group();

  const bodyGeo = new THREE.BoxGeometry(2.2, 2, 2.2);
  const bodyMat = new THREE.MeshStandardMaterial({ color: data.color, roughness: 0.4 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 1;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const roofGeo = new THREE.ConeGeometry(1.8, 1.2, 4);
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x2c3e50, roughness: 0.3 });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = 2.6;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  group.add(roof);

  const doorGeo = new THREE.BoxGeometry(0.6, 1, 0.1);
  const doorMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const door = new THREE.Mesh(doorGeo, doorMat);
  door.position.set(0, 0.5, 1.11);
  group.add(door);

  return group;
}

let mouseDownPos = { x: 0, y: 0 };

function onMouseDown(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  mouseDownPos = { x: event.clientX, y: event.clientY };

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(buildings, true);

  if (intersects.length > 0) {
    let obj = intersects[0].object;
    while (obj.parent && obj.parent !== scene) {
      obj = obj.parent;
    }
    selectedBuilding = obj;
    isDragging = false;
  }
}

function onMouseMove(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  const dist = Math.hypot(event.clientX - mouseDownPos.x, event.clientY - mouseDownPos.y);
  if (dist > 5 && selectedBuilding) {
    isDragging = true;
  }

  if (isDragging && selectedBuilding) {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(dragPlane);
    if (intersects.length > 0) {
      const point = intersects[0].point;
      const snapX = Math.round(point.x / 2) * 2;
      const snapZ = Math.round(point.z / 2) * 2;
      selectedBuilding.position.x = Math.max(-12, Math.min(12, snapX));
      selectedBuilding.position.z = Math.max(-12, Math.min(12, snapZ));
    }
  }
}

function onMouseUp(event) {
  if (selectedBuilding) {
    if (isDragging) {
      const id = selectedBuilding.userData.id;
      localStorage.setItem(`b_pos_${id}`, JSON.stringify({
        x: selectedBuilding.position.x,
        z: selectedBuilding.position.z
      }));
    } else {
      const facilityId = selectedBuilding.userData.id;
      if (typeof switchTab === 'function') {
        switchTab(facilityId);
      }
    }
  }
  selectedBuilding = null;
  isDragging = false;
}

function onWindowResize() {
  const container = document.getElementById('village3dContainer');
  if (!container || !renderer) return;
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
  updateLabelsPosition();
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  updateLabelsPosition(); // 프레임마다 라벨 위치 갱신
}

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(init3DVillage, 100);
});