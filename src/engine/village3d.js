/**
 * village3d.js - Three.js 기반 3D 마을 렌더링 & 건물 자유 드래그 앤 드롭 엔진
 */

let scene, camera, renderer;
let buildings = [];
let selectedBuilding = null;
let isDragging = false;
let dragPlane;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();

// 건물 초기 그리드 좌표 및 데이터 정의
const BUILDING_DATA = [
  { id: 'party', name: '🎒 트레이너 아지트', color: 0xe74c3c, x: -6, z: -4, shape: 'house' },
  { id: 'gym', name: '⚔️ 포켓몬 체육관', color: 0xf39c12, x: 0, z: -6, shape: 'gym' },
  { id: 'mart', name: '🛒 프렌들리숍', color: 0x3498db, x: 6, z: -4, shape: 'shop' },
  { id: 'daycare', name: '🏕️ 키우미집', color: 0x2ecc71, x: -6, z: 4, shape: 'daycare' },
  { id: 'lab', name: '🔬 오박사 연구소', color: 0x9b59b6, x: 0, z: 4, shape: 'lab' },
  { id: 'dex', name: '📖 도감 타워', color: 0x1abc9c, x: 6, z: 4, shape: 'tower' }
];

function init3DVillage() {
  const container = document.getElementById('village3dContainer');
  if (!container) return;

  const width = container.clientWidth;
  const height = container.clientHeight;

  // 1. Scene & Camera (CoC 스타일 아이소메트릭 사선 뷰)
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x27ae60); // 잔디밭 색상

  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(0, 22, 22);
  camera.lookAt(0, 0, 0);

  // 2. Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // 3. 조명 (태양광 및 그림자)
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(20, 40, 20);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  scene.add(dirLight);

  // 4. 지형 그리드 판 (CoC 3D 필드)
  const gridHelper = new THREE.GridHelper(30, 30, 0xf39c12, 0x1e824c);
  gridHelper.position.y = 0.01;
  scene.add(gridHelper);

  // 평면 레이캐스팅용 판
  const planeGeo = new THREE.PlaneGeometry(50, 50);
  planeGeo.rotateX(-Math.PI / 2);
  dragPlane = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ visible: false }));
  scene.add(dragPlane);

  // 5. 3D 입체 건물 생성
  BUILDING_DATA.forEach(bData => {
    const buildingMesh = create3DBuildingMesh(bData);
    
    // 로컬 스토리지에 저장된 위치가 있으면 불러오기
    const savedPos = localStorage.getItem(`b_pos_${bData.id}`);
    if (savedPos) {
      const parsed = JSON.parse(savedPos);
      buildingMesh.position.x = parsed.x;
      buildingMesh.position.z = parsed.z;
    } else {
      buildingMesh.position.x = bData.x;
      buildingMesh.position.z = bData.z;
    }

    buildingMesh.userData = { id: bData.id, name: bData.name };
    scene.add(buildingMesh);
    buildings.push(buildingMesh);
  });

  // 6. 마우스 이벤트 등록 (드래그 & 클릭 탐지)
  const canvasEl = renderer.domElement;
  canvasEl.addEventListener('mousedown', onMouseDown);
  canvasEl.addEventListener('mousemove', onMouseMove);
  canvasEl.addEventListener('mouseup', onMouseUp);

  window.addEventListener('resize', onWindowResize);

  animate();
}

/**
 * Procedural Low-Poly 3D 건물 메쉬 생성
 */
function create3DBuildingMesh(data) {
  const group = new THREE.Group();

  // 기둥/본체
  const bodyGeo = new THREE.BoxGeometry(2.2, 2, 2.2);
  const bodyMat = new THREE.MeshStandardMaterial({ color: data.color, roughness: 0.4 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 1;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // 지붕 (삼각 지붕)
  const roofGeo = new THREE.ConeGeometry(1.8, 1.2, 4);
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x2c3e50, roughness: 0.3 });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = 2.6;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  group.add(roof);

  // 입구 기둥/표식
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
      // 3D 그리드 스냅 (Grid Snap 2 단위)
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
      // 드래그 종료 시 3D 건물 위치 저장
      const id = selectedBuilding.userData.id;
      localStorage.setItem(`b_pos_${id}`, JSON.stringify({
        x: selectedBuilding.position.x,
        z: selectedBuilding.position.z
      }));
    } else {
      // 제자리 단순 클릭 시 해당 시설로 화면 전환
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
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

// DOM 준비 시 3D 마을 엔진 가동
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(init3DVillage, 100);
});