/**
 * src/engine/state.js - 게임 데이터, 스탯 계산 및 통합 UI 렌더링 엔진
 */

const gameState = {
  player: {
    name: "한지우",
    rank: "Z",
    gold: 1000,
    gem: 500,
    candy: 50
  },
  inventory: [],
  squad: {
    front: [null, null, null],
    back: [null, null, null]
  },
  pokedex: new Set()
};

let selectedSlotInfo = null;

// 상단 재화 바 갱신
function updateTopBarUI() {
  document.getElementById('resGem').innerText = gameState.player.gem;
  document.getElementById('resGold').innerText = gameState.player.gold;
  document.getElementById('resCandy').innerText = gameState.player.candy;
  document.getElementById('trainerRank').innerText = `${gameState.player.rank}-Rank`;
  document.getElementById('trainerName').innerText = gameState.player.name;
}

// 포켓몬 인스턴스 생성
function createPokemonInstance(templateId, level = 5) {
  const template = POKEMON_DB.find(p => p.id === templateId) || POKEMON_DB[0];
  
  const ivs = {
    hp: Math.floor(Math.random() * 32),
    atk: Math.floor(Math.random() * 32),
    def: Math.floor(Math.random() * 32),
    spAtk: Math.floor(Math.random() * 32),
    spDef: Math.floor(Math.random() * 32),
    spd: Math.floor(Math.random() * 32)
  };

  const baseSpAtk = template.spAtk || template.atk;
  const baseSpDef = template.spDef || template.def;

  const maxHp = Math.floor(((template.hp * 2 + ivs.hp) * level) / 100) + level + 10;
  const atk = Math.floor(((template.atk * 2 + ivs.atk) * level) / 100) + 5;
  const def = Math.floor(((template.def * 2 + ivs.def) * level) / 100) + 5;
  const spAtk = Math.floor(((baseSpAtk * 2 + ivs.spAtk) * level) / 100) + 5;
  const spDef = Math.floor(((baseSpDef * 2 + ivs.spDef) * level) / 100) + 5;
  const spd = Math.floor(((template.spd * 2 + ivs.spd) * level) / 100) + 5;

  return {
    instanceId: 'poke_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    id: template.id,
    name: template.name,
    type1: template.type1,
    type2: template.type2,
    stage: template.stage,
    level,
    exp: 0,
    maxHp,
    currentHp: maxHp,
    atk, def, spAtk, spDef, spd,
    ivs,
    img: template.img
  };
}

// 포켓몬 획득 및 중복 IV 갱신
function addOrUpgradePokemon(templateId, level = 5) {
  const newInstance = createPokemonInstance(templateId, level);
  const existingPoke = gameState.inventory.find(p => p.id === templateId);

  if (existingPoke) {
    let isUpgraded = false;
    const statsList = ['hp', 'atk', 'def', 'spAtk', 'spDef', 'spd'];

    statsList.forEach(stat => {
      if (newInstance.ivs[stat] > existingPoke.ivs[stat]) {
        existingPoke.ivs[stat] = newInstance.ivs[stat];
        isUpgraded = true;
      }
    });

    if (isUpgraded) recalculatePokemonStats(existingPoke);
    return { poke: existingPoke, isNew: false, isUpgraded };
  } else {
    gameState.inventory.push(newInstance);
    gameState.pokedex.add(newInstance.id);
    return { poke: newInstance, isNew: true, isUpgraded: false };
  }
}

function recalculatePokemonStats(poke) {
  const template = POKEMON_DB.find(p => p.id === poke.id);
  if (!template) return;

  const baseSpAtk = template.spAtk || template.atk;
  const baseSpDef = template.spDef || template.def;

  poke.maxHp = Math.floor(((template.hp * 2 + poke.ivs.hp) * poke.level) / 100) + poke.level + 10;
  poke.currentHp = poke.maxHp;
  poke.atk = Math.floor(((template.atk * 2 + poke.ivs.atk) * poke.level) / 100) + 5;
  poke.def = Math.floor(((template.def * 2 + poke.ivs.def) * poke.level) / 100) + 5;
  poke.spAtk = Math.floor(((baseSpAtk * 2 + poke.ivs.spAtk) * poke.level) / 100) + 5;
  poke.spDef = Math.floor(((baseSpDef * 2 + poke.ivs.spDef) * poke.level) / 100) + 5;
  poke.spd = Math.floor(((template.spd * 2 + poke.ivs.spd) * poke.level) / 100) + 5;
}

/* ===================================================
 * 시설별 통합 UI 렌더링 함수 세트
 * =================================================== */

// 1. 체육관 UI 렌더링
function renderGymUI() {
  const container = document.getElementById('gymContentContainer');
  if (!container) return;

  container.innerHTML = `
    <div style="text-align: center; padding: 30px; background: rgba(15, 23, 42, 0.6); border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.1);">
      <h3 style="font-size: 1.4rem; color: #f1c40f; margin-bottom: 10px;">🏆 Z-Rank 체육관 관장 도전</h3>
      <p style="margin: 10px 0; color: #cbd5e1; font-size: 1rem;">상대 관장: <b>웅이</b> (꼬마돌 Lv.5 / 롱스톤 Lv.5)</p>
      <button class="btn-action" onclick="startGymBattle()" style="font-size: 1.1rem; padding: 12px 24px; margin-top: 15px;">⚔️ 배틀 시작</button>
      <div id="battleLog" style="margin-top: 25px; text-align: left; background: rgba(0,0,0,0.5); padding: 15px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); min-height: 80px; max-height: 200px; overflow-y: auto;">
        <span style="color: #94a3b8;">배틀 시작 버튼을 누르면 전투 결과가 표시됩니다.</span>
      </div>
    </div>
  `;
}

function startGymBattle() {
  const log = document.getElementById('battleLog');
  if (!log) return;

  const hasSquad = gameState.squad.front.some(p => p !== null) || gameState.squad.back.some(p => p !== null);
  if (!hasSquad) {
    log.innerHTML = `<div style="color: #ef4444; font-weight: bold;">⚠️ 출전 파티에 포켓몬을 먼저 등록해주세요! (트레이너 아지트에서 설정)</div>`;
    return;
  }

  log.innerHTML = `
    <div style="color: #38bdf8;">🔔 Z-Rank 체육관 배틀 시작!</div>
    <div style="margin-top: 5px;">⚔️ 내 파티 포켓몬들이 웅이의 포켓몬과 격돌합니다...</div>
    <div style="color: #2ecc71; margin-top: 10px; font-weight: bold; font-size: 1.1rem;">🎉 축하합니다! 승리하였습니다! (보상: 200 Gold, 20 Gem)</div>
  `;
  gameState.player.gold += 200;
  gameState.player.gem += 20;
  updateTopBarUI();
}

// 2. 파티 & 인벤토리 UI 렌더링
function renderPartyUI() {
  renderSquadSlots();
  renderInventoryList();
}

function renderSquadSlots() {
  const frontContainer = document.getElementById('squadFrontContainer');
  const backContainer = document.getElementById('squadBackContainer');

  if (frontContainer) {
    frontContainer.innerHTML = gameState.squad.front.map((poke, idx) => 
      createSlotHTML('front', idx, poke)
    ).join('');
  }
  if (backContainer) {
    backContainer.innerHTML = gameState.squad.back.map((poke, idx) => 
      createSlotHTML('back', idx, poke)
    ).join('');
  }
}

function createSlotHTML(row, index, poke) {
  if (!poke) {
    return `
      <div class="squad-slot empty" onclick="openSquadModal('${row}', ${index})">
        <span style="font-weight: bold; color: #94a3b8;">+ ${row === 'front' ? '전열' : '후열'} ${index + 1}</span>
      </div>
    `;
  }
  return `
    <div class="squad-slot occupied">
      <img src="${poke.img}" class="squad-poke-img">
      <div>
        <div style="font-weight: bold;">${poke.name}</div>
        <div style="font-size: 0.8rem; color: #cbd5e1;">Lv.${poke.level}</div>
      </div>
      <button class="squad-remove-btn" onclick="removeFromSquad('${row}', ${index})">✕</button>
    </div>
  `;
}

function renderInventoryList() {
  const container = document.getElementById('partyInventoryContainer');
  if (!container) return;

  if (!gameState.inventory || gameState.inventory.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #94a3b8; padding: 20px;">보유한 포켓몬이 없습니다. 오박사 연구소에서 포켓몬을 채용해보세요!</div>`;
    return;
  }

  container.innerHTML = gameState.inventory.map(poke => {
    const totalIv = Object.values(poke.ivs || {}).reduce((a, b) => a + b, 0);
    const ivPct = Math.floor((totalIv / 186) * 100);

    return `
      <div class="inventory-card">
        <img src="${poke.img}">
        <div style="font-weight: bold; margin-top: 4px;">${poke.name}</div>
        <div style="font-size: 0.8rem; color: #cbd5e1;">Lv.${poke.level}</div>
        <div style="font-size: 0.75rem; color: #f1c40f; font-weight: bold; margin-top: 4px;">IV ${ivPct}%</div>
      </div>
    `;
  }).join('');
}

function openSquadModal(row, index) {
  selectedSlotInfo = { row, index };
  document.getElementById('modalSlotTitle').innerText = `${row === 'front' ? '전열' : '후열'} ${index + 1} 슬롯 포켓몬 선택`;
  
  const modalList = document.getElementById('modalPokeList');
  if (gameState.inventory.length === 0) {
    modalList.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #94a3b8; padding: 20px;">선택 가능한 포켓몬이 없습니다.</div>`;
  } else {
    modalList.innerHTML = gameState.inventory.map(poke => `
      <div class="inventory-card" onclick="selectPokeForSquad('${poke.instanceId}')">
        <img src="${poke.img}">
        <div style="font-weight: bold;">${poke.name}</div>
        <div style="font-size: 0.8rem; color: #cbd5e1;">Lv.${poke.level}</div>
      </div>
    `).join('');
  }

  document.getElementById('squadSelectModal').classList.remove('hidden');
}

function closeSquadModal() {
  document.getElementById('squadSelectModal').classList.add('hidden');
  selectedSlotInfo = null;
}

function selectPokeForSquad(instanceId) {
  if (!selectedSlotInfo) return;
  const poke = gameState.inventory.find(p => p.instanceId === instanceId);
  if (poke) {
    gameState.squad[selectedSlotInfo.row][selectedSlotInfo.index] = poke;
    closeSquadModal();
    renderSquadSlots();
  }
}

function removeFromSquad(row, index) {
  gameState.squad[row][index] = null;
  renderSquadSlots();
}

// 3. 프렌들리숍 UI 렌더링
function renderMartUI() {
  const container = document.getElementById('martContentContainer');
  if (!container) return;

  container.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; padding: 10px;">
      <div class="inventory-card" style="padding: 20px;">
        <div style="font-size: 2.5rem; margin-bottom: 10px;">🍬</div>
        <h4 style="font-size: 1.1rem; color: #f1c40f;">이상한사탕 x 10</h4>
        <p style="margin: 10px 0; color: #cbd5e1;">가격: 100 Gold</p>
        <button class="btn-action" onclick="buyMartItem('candy', 10, 100)" style="width: 100%;">구매하기</button>
      </div>
      <div class="inventory-card" style="padding: 20px;">
        <div style="font-size: 2.5rem; margin-bottom: 10px;">💎</div>
        <h4 style="font-size: 1.1rem; color: #38bdf8;">보석(Gem) x 50</h4>
        <p style="margin: 10px 0; color: #cbd5e1;">가격: 500 Gold</p>
        <button class="btn-action" onclick="buyMartItem('gem', 50, 500)" style="width: 100%;">구매하기</button>
      </div>
    </div>
  `;
}

function buyMartItem(type, amount, cost) {
  if (gameState.player.gold < cost) {
    alert('Gold가 부족합니다!');
    return;
  }
  gameState.player.gold -= cost;
  gameState.player[type] += amount;
  alert(`${type === 'candy' ? '이상한사탕' : 'Gem'} ${amount}개를 성공적으로 구매했습니다!`);
  updateTopBarUI();
}

// 4. 포켓몬 키우미집 UI 렌더링
function renderDaycareUI() {
  const container = document.getElementById('daycareContentContainer');
  if (!container) return;

  if (!gameState.inventory || gameState.inventory.length === 0) {
    container.innerHTML = `<p style="text-align: center; color: #94a3b8; padding: 30px;">레벨업할 포켓몬이 없습니다. 먼저 연구소에서 포켓몬을 소환하세요!</p>`;
    return;
  }

  container.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 15px;">
      ${gameState.inventory.map(poke => `
        <div class="inventory-card">
          <img src="${poke.img}">
          <div style="font-weight: bold; margin-top: 5px;">${poke.name}</div>
          <div style="font-size: 0.85rem; color: #cbd5e1; margin-bottom: 8px;">Lv.${poke.level} (HP: ${poke.maxHp})</div>
          <button class="btn-action" style="width: 100%; font-size: 0.85rem;" onclick="levelUpPokemon('${poke.instanceId}')">🍬 레벨업 (사탕 5개)</button>
        </div>
      `).join('')}
    </div>
  `;
}

function levelUpPokemon(instanceId) {
  if (gameState.player.candy < 5) {
    alert('이상한사탕이 부족합니다!');
    return;
  }
  const poke = gameState.inventory.find(p => p.instanceId === instanceId);
  if (poke) {
    gameState.player.candy -= 5;
    poke.level += 1;
    recalculatePokemonStats(poke);
    updateTopBarUI();
    renderDaycareUI();
    alert(`🎉 ${poke.name}의 레벨이 Lv.${poke.level}(으)로 상승했습니다!`);
  }
}

// 5. 오박사 연구소 UI 렌더링
function renderLabUI() {
  const container = document.getElementById('labContentContainer');
  if (!container) return;

  container.innerHTML = `
    <div style="text-align: center; padding: 30px; background: rgba(15, 23, 42, 0.6); border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.1);">
      <div style="font-size: 3rem; margin-bottom: 10px;">🔬</div>
      <h3 style="font-size: 1.4rem; color: #f1c40f; margin-bottom: 10px;">오박사 연구소 포켓몬 채용</h3>
      <p style="margin: 10px 0; color: #cbd5e1; font-size: 0.95rem;">기본 단계 포켓몬이 무작위로 채용됩니다. (중복 시 더 높은 IV 수치로 자동 강화)</p>
      <div style="display: flex; justify-content: center; gap: 15px; margin-top: 25px;">
        <button class="btn-action" onclick="summonLabPokemon(1)" style="padding: 12px 20px;">🎲 1회 소환 (10 Gem)</button>
        <button class="btn-action" style="background: var(--accent-yellow); color: #0f172a; padding: 12px 20px;" onclick="summonLabPokemon(10)">✨ 10연차 소환 (100 Gem)</button>
      </div>
    </div>
  `;
}

function summonLabPokemon(count) {
  const cost = count * 10;
  if (gameState.player.gem < cost) {
    alert('Gem이 부족합니다!');
    return;
  }

  const basePool = POKEMON_DB.filter(p => p.isBaseStage || p.stage === 1);
  if (!basePool || basePool.length === 0) {
    alert('소환 가능한 포켓몬 데이터가 없습니다!');
    return;
  }

  gameState.player.gem -= cost;
  const results = [];

  for (let i = 0; i < count; i++) {
    const template = basePool[Math.floor(Math.random() * basePool.length)];
    const res = addOrUpgradePokemon(template.id, 5);
    results.push(res.isNew ? `✨ [신규 획득] ${res.poke.name}` : (res.isUpgraded ? `📈 [IV 강화] ${res.poke.name}` : `🔄 [상태 유지] ${res.poke.name}`));
  }

  updateTopBarUI();
  alert(`🎲 포켓몬 소환 결과!\n\n` + results.join('\n'));
}

// 6. 전국 도감 UI 렌더링
function renderDexUI() {
  const container = document.getElementById('dexContentContainer');
  if (!container) return;

  const totalCount = POKEMON_DB.length;
  const collectedCount = gameState.pokedex.size;

  container.innerHTML = `
    <div style="margin-bottom: 20px; text-align: center; font-size: 1.1rem;">
      <span>📖 도감 수집률: <b style="color: #f1c40f;">${collectedCount}</b> / ${totalCount} 마리 (${totalCount > 0 ? Math.floor((collectedCount/totalCount)*100) : 0}%)</span>
    </div>
    <div class="inventory-grid">
      ${POKEMON_DB.map(p => {
        const isCaught = gameState.pokedex.has(p.id);
        return `
          <div class="inventory-card" style="opacity: ${isCaught ? 1 : 0.35}; filter: ${isCaught ? 'none' : 'grayscale(100%)'};">
            <img src="${p.img}">
            <div style="font-size: 0.8rem; color: #cbd5e1;">No.${String(p.id).padStart(4, '0')}</div>
            <div style="font-weight: bold; margin-top: 2px;">${isCaught ? p.name : '???'}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/* ===================================================
 * 탭 전환 바인딩 함수 (switchTab)
 * =================================================== */
function switchTab(tabId) {
  document.querySelectorAll('.facility-panel').forEach(panel => panel.classList.remove('active'));
  const target = document.getElementById(`tab-${tabId}`);
  if (!target) return;
  
  target.classList.add('active');
  updateTopBarUI();

  // 탭 변경 즉시 해당 시설 UI 렌더링 실행
  switch (tabId) {
    case 'village':
      if (typeof refreshVillageUI === 'function') refreshVillageUI();
      break;
    case 'party':
      renderPartyUI();
      break;
    case 'gym':
      renderGymUI();
      break;
    case 'mart':
      renderMartUI();
      break;
    case 'daycare':
      renderDaycareUI();
      break;
    case 'lab':
      renderLabUI();
      break;
    case 'dex':
      renderDexUI();
      break;
  }
}

// 전역 스코프 등록
window.gameState = gameState;
window.updateTopBarUI = updateTopBarUI;
window.switchTab = switchTab;
window.renderGymUI = renderGymUI;
window.startGymBattle = startGymBattle;
window.renderPartyUI = renderPartyUI;
window.openSquadModal = openSquadModal;
window.closeSquadModal = closeSquadModal;
window.selectPokeForSquad = selectPokeForSquad;
window.removeFromSquad = removeFromSquad;
window.renderMartUI = renderMartUI;
window.buyMartItem = buyMartItem;
window.renderDaycareUI = renderDaycareUI;
window.levelUpPokemon = levelUpPokemon;
window.renderLabUI = renderLabUI;
window.summonLabPokemon = summonLabPokemon;
window.renderDexUI = renderDexUI;