/**
 * state.js - 중앙 게임 상태 및 포켓몬 관리 로직
 */

// 전역 게임 상태 객체
const gameState = {
  player: {
    rank: "Z",
    rankPoints: 0,
    gold: 1000,
    gem: 100,
    candy: 50
  },
  squad: {
    front: [null, null, null],
    back: [null, null, null]
  },
  inventory: [],
  pokedex: new Set(),
  purchasedCharms: {
    goldBonus: false,
    candyBonus: false
  }
};

/**
 * 포켓몬 현재 레벨에 맞춰 습득 가능한 기술 업데이트 (최대 4개)
 * @param {Object} poke - 포켓몬 인스턴스
 */
function updatePokemonMoves(poke) {
  const learnset = LEARNSETS_DB[poke.id] || [{ move: "몸통박치기", level: 1 }];
  const availableMoves = learnset
    .filter(l => poke.level >= l.level)
    .map(l => l.move);
  
  // 최근 습득한 기술 우선으로 최대 4개 보관
  poke.moves = availableMoves.slice(-4);
}

/**
 * 도감 템플릿 ID를 기반으로 포켓몬 개체 생성
 * @param {number} templateId - 포켓몬 도감 번호
 * @param {number} level - 초기 생성 레벨
 * @returns {Object} 포켓몬 개체 객체
 */
function createPokemonInstance(templateId, level = 1) {
  const template = POKEMON_DB.find(p => p.id === templateId) || POKEMON_DB[0];
  const iv = Math.floor(Math.random() * 32); // 개체값 0~31 Random IV
  
  const maxHp = Math.floor(((template.hp * 2 + iv) * level) / 100) + level + 10;
  
  const instance = {
    uid: 'poke_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    id: template.id,
    name: template.name,
    type1: template.type1,
    type2: template.type2,
    stage: template.stage,
    level: level,
    iv: iv,
    maxHp: maxHp,
    currentHp: maxHp,
    atk: Math.floor(((template.atk * 2 + iv) * level) / 100) + 5,
    def: Math.floor(((template.def * 2 + iv) * level) / 100) + 5,
    spd: Math.floor(((template.spd * 2 + iv) * level) / 100) + 5,
    img: template.img,
    moves: []
  };

  updatePokemonMoves(instance);
  return instance;
}

/**
 * 초기 상태 생성 및 기본 포켓몬 지급
 */
function initGame() {
  const p1 = createPokemonInstance(1, 5); // 이상해씨
  const p2 = createPokemonInstance(4, 5); // 파이리
  const p3 = createPokemonInstance(7, 5); // 꼬부기

  gameState.inventory.push(p1, p2, p3);
  gameState.pokedex.add(1).add(4).add(7);

  // 기본 파티 배치
  gameState.squad.front[0] = p1;
  gameState.squad.front[1] = p2;
  gameState.squad.back[0] = p3;

  renderUI();
}

/**
 * 포켓몬 레벨업 처리 및 능력치/기술 갱신
 * @param {string} uid - 포켓몬 고유 식별자
 */
function levelUpPokemon(uid) {
  const poke = gameState.inventory.find(p => p.uid === uid);
  if (!poke || gameState.player.candy < 10) return false;

  gameState.player.candy -= 10;
  poke.level += 1;
  poke.maxHp += 6;
  poke.currentHp = poke.maxHp;
  poke.atk += 3;
  poke.def += 3;
  poke.spd += 2;

  updatePokemonMoves(poke);
  renderUI();
  return true;
}

/**
 * 포켓몬 진화 조건 검사 및 진화 실행
 * @param {string} uid - 포켓몬 고유 식별자
 */
function evolvePokemon(uid) {
  const poke = gameState.inventory.find(p => p.uid === uid);
  if (!poke) return false;

  const evoInfo = EVOLUTION_MAP[poke.id];
  if (!evoInfo || poke.level < evoInfo.minLevel) return false;

  const nextTemplate = POKEMON_DB.find(p => p.id === evoInfo.nextId);
  if (!nextTemplate) return false;

  const oldName = poke.name;
  poke.id = nextTemplate.id;
  poke.name = nextTemplate.name;
  poke.type1 = nextTemplate.type1;
  poke.type2 = nextTemplate.type2;
  poke.stage = nextTemplate.stage;
  poke.img = nextTemplate.img;

  poke.maxHp += 20;
  poke.currentHp = poke.maxHp;
  poke.atk += 15;
  poke.def += 15;

  updatePokemonMoves(poke);
  gameState.pokedex.add(poke.id);

  alert(`✨ ${oldName}이(가) ${poke.name}(으)로 진화했습니다! 🎉`);
  renderUI();
  return true;
}

/**
 * 포켓몬 파티 자동 장착 로직
 * @param {Object} poke - 포켓몬 개체
 */
function equipPokemon(poke) {
  const isAlreadyEquipped = [...gameState.squad.front, ...gameState.squad.back]
    .some(p => p && p.uid === poke.uid);
  if (isAlreadyEquipped) return;

  let emptyFront = gameState.squad.front.findIndex(p => p === null);
  if (emptyFront !== -1) {
    gameState.squad.front[emptyFront] = poke;
  } else {
    let emptyBack = gameState.squad.back.findIndex(p => p === null);
    if (emptyBack !== -1) gameState.squad.back[emptyBack] = poke;
  }
  renderUI();
}

/**
 * 파티 슬롯 해제
 * @param {string} line - 'front' 또는 'back'
 * @param {number} index - 슬롯 인덱스 (0~2)
 */
function removeSlot(line, index) {
  gameState.squad[line][index] = null;
  renderUI();
}

/**
 * 오박사 연구소 포켓몬 소환(채용)
 * @param {number} count - 소환 횟수 (1회 또는 10회)
 */
function summonPokemon(count) {
  const cost = count * 10;
  if (gameState.player.gem < cost) {
    alert('Gem이 부족합니다!');
    return;
  }

  const stage1Pool = POKEMON_DB.filter(p => p.stage === 1);
  gameState.player.gem -= cost;
  let newPokes = [];

  for (let i = 0; i < count; i++) {
    const randomTemplate = stage1Pool[Math.floor(Math.random() * stage1Pool.length)];
    const newPoke = createPokemonInstance(randomTemplate.id, 5);
    gameState.inventory.push(newPoke);
    gameState.pokedex.add(newPoke.id);
    newPokes.push(newPoke.name);
  }

  alert(`🎉 포켓몬 채용 성공!\n획득 포켓몬: ${newPokes.join(', ')}`);
  renderUI();
}

/**
 * 현재 도감 수집률에 기반한 활성 지방 패시브 목록 반환
 */
function getActiveRegionalPassives() {
  const passives = [];
  REGION_DEFINITIONS.forEach(reg => {
    const count = [...gameState.pokedex].filter(id => id >= reg.minId && id <= reg.maxId).length;
    if (count >= 1) {
      passives.push({ region: reg.name, name: reg.effectName, desc: reg.effectDesc, count: count });
    }
  });
  return passives;
}

/**
 * 전체 포켓몬 HP 완치
 */
function healAllPokemon() {
  gameState.inventory.forEach(p => p.currentHp = p.maxHp);
  alert('🏥 모든 포켓몬의 체력이 완치되었습니다!');
  renderUI();
}