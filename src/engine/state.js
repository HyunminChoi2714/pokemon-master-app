/**
 * src/engine/state.js - 전역 데이터 및 탭 전환 상태 관리
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

function updateTopBarUI() {
  document.getElementById('resGem').innerText = gameState.player.gem;
  document.getElementById('resGold').innerText = gameState.player.gold;
  document.getElementById('resCandy').innerText = gameState.player.candy;
  document.getElementById('trainerRank').innerText = `${gameState.player.rank}-Rank`;
  document.getElementById('trainerName').innerText = gameState.player.name;
}

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

/**
 * src/engine/state.js - 디버깅 및 안전장치가 강화된 switchTab 함수
 */
function switchTab(tabId) {
  // 1. 모든 패널 비활성화 후 선택 패널 활성화
  document.querySelectorAll('.facility-panel').forEach(panel => panel.classList.remove('active'));
  const target = document.getElementById(`tab-${tabId}`);
  
  if (!target) {
    console.error(`❌ 'tab-${tabId}' ID를 가진 DOM 요소를 찾을 수 없습니다.`);
    return;
  }
  target.classList.add('active');

  // 2. 상단 재화 바 갱신
  if (typeof updateTopBarUI === 'function') updateTopBarUI();

  // 3. 탭별 렌더러 안전 호출
  try {
    switch (tabId) {
      case 'village':
        if (typeof refreshVillageUI === 'function') refreshVillageUI();
        break;
      case 'party':
        if (typeof renderPartyUI === 'function') renderPartyUI();
        else console.warn('⚠️ renderPartyUI 함수가 로드되지 않았습니다.');
        break;
      case 'gym':
        if (typeof renderGymUI === 'function') renderGymUI();
        else console.warn('⚠️ renderGymUI 함수가 로드되지 않았습니다.');
        break;
      case 'mart':
        if (typeof renderMartUI === 'function') renderMartUI();
        else console.warn('⚠️ renderMartUI 함수가 로드되지 않았습니다.');
        break;
      case 'daycare':
        if (typeof renderDaycareUI === 'function') renderDaycareUI();
        else console.warn('⚠️ renderDaycareUI 함수가 로드되지 않았습니다.');
        break;
      case 'lab':
        if (typeof renderLabUI === 'function') renderLabUI();
        else console.warn('⚠️ renderLabUI 함수가 로드되지 않았습니다.');
        break;
      case 'dex':
        if (typeof renderDexUI === 'function') renderDexUI();
        else console.warn('⚠️ renderDexUI 함수가 로드되지 않았습니다.');
        break;
    }
  } catch (err) {
    console.error(`❌ [${tabId}] 탭 렌더링 중 오류 발생:`, err);
  }
}

window.gameState = gameState;
window.updateTopBarUI = updateTopBarUI;
window.switchTab = switchTab;