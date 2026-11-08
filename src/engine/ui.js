/**
 * ui.js - DOM 렌더링, 이벤트 바인딩 및 화면 인터페이스 제어
 */

/**
 * 네비게이션 탭 전환 처리 함수
 * @param {string} tabId - 이동할 탭 ID ('party', 'gym', 'mart', 'center', 'daycare', 'lab', 'dex')
 * @param {Event} evt - 클릭 이벤트 객체
 */
function switchTab(tabId, evt) {
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.facility-panel').forEach(panel => panel.classList.remove('active'));

  if (evt && evt.target) {
    evt.target.classList.add('active');
  }

  const targetPanel = document.getElementById('tab-' + tabId);
  if (targetPanel) {
    targetPanel.classList.add('active');
  }

  renderUI();
}

/**
 * 전체 화면 UI 요소 동기화 렌더링 함수
 */
function renderUI() {
  // 재화 및 랭크 정보 동기화
  const rankEl = document.getElementById('playerRank');
  const goldEl = document.getElementById('goldAmount');
  const gemEl = document.getElementById('gemAmount');
  const candyEl = document.getElementById('candyAmount');

  if (rankEl) rankEl.innerText = `${gameState.player.rank}-랭크 트레이너`;
  if (goldEl) goldEl.innerText = gameState.player.gold.toLocaleString();
  if (gemEl) gemEl.innerText = gameState.player.gem.toLocaleString();
  if (candyEl) candyEl.innerText = gameState.player.candy.toLocaleString();

  // 각 세부 패널 UI 렌더링
  renderSquadSlots();
  renderBuffs();
  renderInventory();
  renderShop();
  renderDaycare();
  renderPokedex();
}

/**
 * 엔트리 파티 (전방/후방) 슬롯 렌더링
 */
function renderSquadSlots() {
  ['front', 'back'].forEach(line => {
    const slotsContainer = document.getElementById(line + 'Slots');
    if (!slotsContainer) return;
    slotsContainer.innerHTML = '';

    gameState.squad[line].forEach((poke, index) => {
      const slotEl = document.createElement('div');
      slotEl.className = `slot ${poke ? 'occupied' : ''}`;
      slotEl.onclick = () => removeSlot(line, index);

      if (poke) {
        slotEl.innerHTML = `
          <img src="${poke.img}" class="poke-img" alt="${poke.name}" />
          <div class="slot-poke-name">${poke.name} (Lv.${poke.level})</div>
          <span class="poke-moves-tag">⚔️ ${poke.moves.join(', ')}</span>
        `;
      } else {
        slotEl.innerHTML = `<span style="color:#666;">[${line === 'front' ? '전방' : '후방'} ${index + 1}]</span>`;
      }
      slotsContainer.appendChild(slotEl);
    });
  });
}

/**
 * 파티 시너지 버프 및 지방별 도감 부수 효과 패시브 출력
 */
function renderBuffs() {
  const buffListEl = document.getElementById('activeBuffList');
  if (!buffListEl) return;
  buffListEl.innerHTML = '';

  const typeCounts = {};
  [...gameState.squad.front, ...gameState.squad.back].forEach(poke => {
    if (poke) {
      typeCounts[poke.type1] = (typeCounts[poke.type1] || 0) + 1;
      if (poke.type2) typeCounts[poke.type2] = (typeCounts[poke.type2] || 0) + 1;
    }
  });

  let hasBuff = false;
  for (const [type, count] of Object.entries(typeCounts)) {
    if (count >= 2) {
      hasBuff = true;
      const tag = document.createElement('span');
      tag.className = 'buff-tag';
      tag.innerText = `[${type}] 타입 ${count}마리 배치`;
      buffListEl.appendChild(tag);
    }
  }

  // 지방별 부수 효과 패시브 태그 렌더링
  const activePassives = getActiveRegionalPassives();
  activePassives.forEach(pas => {
    hasBuff = true;
    const tag = document.createElement('span');
    tag.className = 'passive-tag';
    tag.innerText = `✨ ${pas.name} (${pas.desc})`;
    buffListEl.appendChild(tag);
  });

  if (!hasBuff) {
    buffListEl.innerHTML = '<span style="color:#aaa;">현재 발동 중인 버프 없음</span>';
  }
}

/**
 * 보유 포켓몬 인벤토리 목록 렌더링
 */
function renderInventory() {
  const grid = document.getElementById('inventoryGrid');
  if (!grid) return;
  grid.innerHTML = '';

  gameState.inventory.forEach(poke => {
    const isEquipped = [...gameState.squad.front, ...gameState.squad.back]
      .some(p => p && p.uid === poke.uid);

    const card = document.createElement('div');
    card.className = 'poke-card';
    if (isEquipped) card.style.opacity = '0.5';

    card.onclick = () => equipPokemon(poke);
    card.