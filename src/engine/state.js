/**
 * state.js - 중앙 게임 상태 및 포켓몬 관리 로직 (수정본)
 */

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

let isGameInitialized = false;

function updatePokemonMoves(poke) {
  const learnset = (typeof LEARNSETS_DB !== 'undefined' && LEARNSETS_DB[poke.id]) || [{ move: "몸통박치기", level: 1 }];
  const availableMoves = learnset
    .filter(l => poke.level >= l.level)
    .map(l => l.move);
  
  poke.moves = availableMoves.slice(-4);
}

/**
 * 포켓몬 인스턴스 생성 (6종 스탯 & 6종 IV 세분화)
 */
function createPokemonInstance(templateId, level = 1) {
  const template = (typeof POKEMON_DB !== 'undefined' && POKEMON_DB.find(p => p.id === templateId)) || {
    id: 1, name: "이상해씨", type1: "풀", type2: "독", stage: 1, hp: 45, atk: 49, def: 49, spAtk: 65, spDef: 65, spd: 45, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png"
  };

  // 6종 개체값 (0~31) 무작위 생성
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

  const instance = {
    uid: 'poke_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    id: template.id,
    name: template.name,
    type1: template.type1,
    type2: template.type2,
    stage: template.stage,
    level: level,
    ivs: ivs,
    maxHp: maxHp,
    currentHp: maxHp,
    atk: atk,
    def: def,
    spAtk: spAtk,
    spDef: spDef,
    spd: spd,
    img: template.img,
    moves: []
  };

  updatePokemonMoves(instance);
  return instance;
}

function initGame() {
  if (isGameInitialized) return;
  isGameInitialized = true;

  const p1 = createPokemonInstance(1, 5);
  const p2 = createPokemonInstance(4, 5);
  const p3 = createPokemonInstance(7, 5);

  gameState.inventory.push(p1, p2, p3);
  gameState.pokedex.add(1).add(4).add(7);

  gameState.squad.front[0] = p1;
  gameState.squad.front[1] = p2;
  gameState.squad.back[0] = p3;

  if (typeof renderUI === 'function') {
    renderUI();
  }
}

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
  if (typeof renderUI === 'function') renderUI();
  return true;
}

function evolvePokemon(uid) {
  const poke = gameState.inventory.find(p => p.uid === uid);
  if (!poke || typeof EVOLUTION_MAP === 'undefined') return false;

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
  if (typeof renderUI === 'function') renderUI();
  return true;
}

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
  if (typeof renderUI === 'function') renderUI();
}

function removeSlot(line, index) {
  gameState.squad[line][index] = null;
  if (typeof renderUI === 'function') renderUI();
}

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
  if (typeof renderUI === 'function') renderUI();
}

function getActiveRegionalPassives() {
  const passives = [];
  if (typeof REGION_DEFINITIONS === 'undefined') return passives;

  REGION_DEFINITIONS.forEach(reg => {
    const count = [...gameState.pokedex].filter(id => id >= reg.minId && id <= reg.maxId).length;
    if (count >= 1) {
      passives.push({ region: reg.name, name: reg.effectName, desc: reg.effectDesc, count: count });
    }
  });
  return passives;
}

function healAllPokemon() {
  gameState.inventory.forEach(p => p.currentHp = p.maxHp);
  alert('🏥 모든 포켓몬의 체력이 완치되었습니다!');
  if (typeof renderUI === 'function') renderUI();
}