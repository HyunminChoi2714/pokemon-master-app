/**
 * src/engine/state.js - 전역 게임 상태 관리, EXP 영구 저장, 진화, 배틀 및 시설 UI 엔진
 */

const RANKS = ['Z', 'Y', 'X', 'W', 'V', 'U', 'T', 'S', 'R', 'Q', 'P', 'O', 'N', 'M', 'L', 'K', 'J', 'I', 'H', 'G', 'F', 'E', 'D', 'C', 'B', 'A', 'ELITE_FOUR', 'CHAMPION'];

// 1~9세대 주요 포켓몬 진화 레벨 데이터베이스
const EVOLUTION_MAP = {
  1: { nextId: 2, minLevel: 16 },   // 이상해씨 -> 이상해풀
  2: { nextId: 3, minLevel: 32 },   // 이상해풀 -> 이상해꽃
  4: { nextId: 5, minLevel: 16 },   // 파이리 -> 리자드
  5: { nextId: 6, minLevel: 36 },   // 리자드 -> 리자몽
  7: { nextId: 8, minLevel: 16 },   // 꼬부기 -> 어니부기
  8: { nextId: 9, minLevel: 36 },   // 어니부기 -> 거북왕
  10: { nextId: 11, minLevel: 7 },  // 캐터피 -> 단데기
  11: { nextId: 12, minLevel: 10 }, // 단데기 -> 버터플
  13: { nextId: 14, minLevel: 7 },  // 뿔충이 -> 딱충이
  14: { nextId: 15, minLevel: 10 }, // 딱충이 -> 독침붕
  16: { nextId: 17, minLevel: 18 }, // 구구 -> 피전트
  17: { nextId: 18, minLevel: 36 }, // 피전트 -> 피전투스
  19: { nextId: 20, minLevel: 20 }, // 꼬렛 -> 레트라
  25: { nextId: 26, minLevel: 20 }, // 피카츄 -> 라이츄
  74: { nextId: 75, minLevel: 25 }, // 꼬마돌 -> 데구리
  111: { nextId: 112, minLevel: 42 },// 뿔카노 -> 코뿌리
  129: { nextId: 130, minLevel: 20 },// 잉어킹 -> 갸라도스
  147: { nextId: 148, minLevel: 30 },// 미뇽 -> 신뇽
  148: { nextId: 149, minLevel: 55 } // 신뇽 -> 망나뇽
};

const SAVE_KEY = 'pokemon_master_save_v1';

let gameState = {
  player: {
    name: "한지우",
    rankIndex: 0,
    trainerWins: 0,
    eliteWins: 0,
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
let currentBattleState = null;

const TYPE_SYNERGIES = {
  "불꽃": { name: "타오르는 불사조", desc: "공격력 +15% & 공격 시 20% 화상" },
  "물": { name: "아쿠아마린", desc: "라운드 종료 시 HP 6% 회복 & 물 기술 +15%" },
  "풀": { name: "생명의 꽃봉오리", desc: "라운드 종료 시 HP 6% 회복 & 20% 상태이상 해제" },
  "전기": { name: "제우스의 분노", desc: "스피드 +15% & 공격 시 15% 마비(Spd-30%)" },
  "땅": { name: "레이지 그래비티", desc: "방어력 +15% & 땅 기술 적 방어 25% 무시" },
  "강철": { name: "불멸의 방호", desc: "피격 피해 -15% & 방어력 +10%" },
  "격투": { name: "맹호경파산", desc: "공격력 +15% & 크리티컬 확률 +15%" },
  "고스트": { name: "엑소시스트", desc: "회피율 +15% & 적 처치 시 HP 20% 회복" },
  "악": { name: "흑야의 잔영", desc: "크리티컬 피해 +25% & HP 30% 이하 시 공격력 +20%" },
  "노말": { name: "라스트 스탠드", desc: "전원 6대 능력치 +8% 상시 상승" },
  "페어리": { name: "요정의 축복", desc: "매 라운드 시작 시 최대 HP 8% 보호막" },
  "에스퍼": { name: "사이킥 오버로드", desc: "특수공격력 +15% & 공격 시 15% 혼란" },
  "독": { name: "멜트다운", desc: "공격 시 25% 확률로 중독(매 턴 HP 5% 피격)" },
  "드래곤": { name: "니벨룽겐의 포효", desc: "공격력 +10% & 크리티컬 +10% & 드래곤 기술 +15%" },
  "얼음": { name: "유키온나의 저주", desc: "피격 시 15% 확률로 적 1턴 간 빙결" },
  "벌레": { name: "인페스테이션", desc: "스피드 +10% & 20% 확률 1회 추가 공격" },
  "바위": { name: "천암만학", desc: "방어력 +20% & 피격 피해량 10% 감소" },
  "비행": { name: "갓스피드", desc: "스피드 +15% & 회피율 +10%" }
};

/* ===================================================
 * 1. 💾 데이터 영구 저장 및 복원 (LocalStorage Engine)
 * =================================================== */
function saveGameState() {
  try {
    const saveData = {
      player: gameState.player,
      inventory: gameState.inventory,
      squadIds: {
        front: gameState.squad.front.map(p => p ? p.instanceId : null),
        back: gameState.squad.back.map(p => p ? p.instanceId : null)
      },
      pokedex: Array.from(gameState.pokedex)
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
  } catch (err) {
    console.error("Save error:", err);
  }
}

function loadGameState() {
  try {
    const rawData = localStorage.getItem(SAVE_KEY);
    if (!rawData) return false;

    const parsed = JSON.parse(rawData);
    gameState.player = parsed.player || gameState.player;
    gameState.inventory = parsed.inventory || [];
    gameState.pokedex = new Set(parsed.pokedex || []);

    if (parsed.squadIds) {
      gameState.squad.front = parsed.squadIds.front.map(id => gameState.inventory.find(p => p && p.instanceId === id) || null);
      gameState.squad.back = parsed.squadIds.back.map(id => gameState.inventory.find(p => p && p.instanceId === id) || null);
    }
    return true;
  } catch (err) {
    console.error("Load error:", err);
    return false;
  }
}

/* ===================================================
 * 2. ⚡ 스탯 계산 & 영구 레벨/EXP/진화 반영 로직
 * =================================================== */
function getPlayerRankName() {
  const r = RANKS[gameState.player.rankIndex];
  if (r === 'ELITE_FOUR') return '사천왕 도전';
  if (r === 'CHAMPION') return '👑 챔피언';
  return `${r}-Rank`;
}

function updateTopBarUI() {
  const resGem = document.getElementById('resGem');
  const resGold = document.getElementById('resGold');
  const resCandy = document.getElementById('resCandy');
  const trainerRank = document.getElementById('trainerRank');
  const trainerName = document.getElementById('trainerName');

  if (resGem) resGem.innerText = gameState.player.gem;
  if (resGold) resGold.innerText = gameState.player.gold;
  if (resCandy) resCandy.innerText = gameState.player.candy;
  if (trainerRank) trainerRank.innerText = getPlayerRankName();
  if (trainerName) trainerName.innerText = gameState.player.name;
}

function createPokemonInstance(templateId, level = 5) {
  const template = (typeof POKEMON_DB !== 'undefined' ? POKEMON_DB.find(p => p.id === templateId) : null) || {
    id: templateId, name: "이상해씨", type1: "풀", type2: "독", stage: 1, hp: 45, atk: 49, def: 49, spAtk: 65, spDef: 65, spd: 45, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png"
  };
  
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
    saveGameState();
    return { poke: existingPoke, isNew: false, isUpgraded };
  } else {
    gameState.inventory.push(newInstance);
    gameState.pokedex.add(newInstance.id);
    saveGameState();
    return { poke: newInstance, isNew: true, isUpgraded: false };
  }
}

function recalculatePokemonStats(poke) {
  if (typeof POKEMON_DB === 'undefined') return;
  const template = POKEMON_DB.find(p => p.id === poke.id);
  if (!template) return;

  const baseSpAtk = template.spAtk || template.atk;
  const baseSpDef = template.spDef || template.def;

  poke.maxHp = Math.floor(((template.hp * 2 + poke.ivs.hp) * poke.level) / 100) + poke.level + 10;
  poke.atk = Math.floor(((template.atk * 2 + poke.ivs.atk) * poke.level) / 100) + 5;
  poke.def = Math.floor(((template.def * 2 + poke.ivs.def) * poke.level) / 100) + 5;
  poke.spAtk = Math.floor(((baseSpAtk * 2 + poke.spAtk) * poke.level) / 100) + 5;
  poke.spDef = Math.floor(((baseSpDef * 2 + poke.spDef) * poke.level) / 100) + 5;
  poke.spd = Math.floor(((template.spd * 2 + poke.ivs.spd) * poke.level) / 100) + 5;
}

function checkAndEvolvePokemon(poke) {
  if (!poke || !EVOLUTION_MAP[poke.id] || typeof POKEMON_DB === 'undefined') return null;

  const evoData = EVOLUTION_MAP[poke.id];
  if (poke.level >= evoData.minLevel) {
    const nextTemplate = POKEMON_DB.find(p => p.id === evoData.nextId);
    if (nextTemplate) {
      const oldName = poke.name;
      poke.id = nextTemplate.id;
      poke.name = nextTemplate.name;
      poke.img = nextTemplate.img;
      poke.type1 = nextTemplate.type1;
      poke.type2 = nextTemplate.type2;
      poke.stage = nextTemplate.stage;
      
      gameState.pokedex.add(nextTemplate.id);
      recalculatePokemonStats(poke);
      poke.currentHp = poke.maxHp;

      return `✨ <b>[진화!]</b> ${oldName} 이(가) <b style="color:#f1c40f;">${poke.name}</b> (으)로 진화했습니다!`;
    }
  }
  return null;
}

function addExpToPokemon(poke, amount) {
  const orig = gameState.inventory.find(inv => inv.instanceId === poke.instanceId);
  const target = orig || poke;

  target.exp = (target.exp || 0) + amount;
  let reqExp = target.level * 50;
  let levelUps = 0;
  const resultLogs = [];

  while (target.exp >= reqExp) {
    target.exp -= reqExp;
    target.level += 1;
    levelUps++;
    reqExp = target.level * 50;
  }

  if (levelUps > 0) {
    recalculatePokemonStats(target);
    target.currentHp = target.maxHp;
    resultLogs.push(`🎉 <b>[LEVEL UP!]</b> ${target.name} (Lv.${target.level})`);

    const evoLog = checkAndEvolvePokemon(target);
    if (evoLog) resultLogs.push(evoLog);
  }

  if (orig && orig !== poke) {
    poke.level = orig.level;
    poke.exp = orig.exp;
    poke.maxHp = orig.maxHp;
    poke.currentHp = orig.currentHp;
    poke.atk = orig.atk;
    poke.def = orig.def;
    poke.spAtk = orig.spAtk;
    poke.spDef = orig.spDef;
    poke.spd = orig.spd;
    poke.id = orig.id;
    poke.name = orig.name;
    poke.img = orig.img;
    poke.type1 = orig.type1;
    poke.type2 = orig.type2;
  }

  saveGameState();
  return resultLogs;
}

/* ===================================================
 * 3. 📊 포켓몬 세부 스탯 & 육각형 레이더 모달
 * =================================================== */
function getIvRatingText(iv) {
  if (iv === 31) return `<span style="color:#f1c40f; font-weight:bold;">최고! (31)</span>`;
  if (iv >= 26) return `<span style="color:#2ecc71;">훌륭하다 (${iv})</span>`;
  if (iv >= 16) return `<span style="color:#38bdf8;">잘함 (${iv})</span>`;
  if (iv >= 6) return `<span style="color:#ffffff;">보통 (${iv})</span>`;
  return `<span style="color:#ef4444;">별로 (${iv})</span>`;
}

function getPokemonSkills(poke) {
  const t = poke.type1 || '노말';
  return [
    { name: `${t}의 일격`, type: t, power: 40 + poke.level * 2, acc: 100 },
    { name: '몸통박치기', type: '노말', power: 35, acc: 100 },
    { name: `${t} 파동`, type: t, power: 65 + poke.level * 3, acc: 90 },
    { name: '파괴광선', type: '노말', power: 120, acc: 85 }
  ];
}

function openPokeDetailModal(instanceId) {
  const poke = gameState.inventory.find(p => p.instanceId === instanceId);
  if (!poke) return;

  const reqExp = poke.level * 50;
  const titleEl = document.getElementById('detailPokeTitle');
  if (titleEl) titleEl.innerText = `📊 ${poke.name} (Lv.${poke.level} / EXP: ${poke.exp || 0}/${reqExp})`;

  const ivBox = document.getElementById('detailIvRatings');
  const ivs = poke.ivs || { hp:0, atk:0, def:0, spd:0, spDef:0, spAtk:0 };
  if (ivBox) {
    ivBox.innerHTML = `
      <div class="iv-stat-row"><span>HP 개체값:</span> ${getIvRatingText(ivs.hp)}</div>
      <div class="iv-stat-row"><span>공격 개체값:</span> ${getIvRatingText(ivs.atk)}</div>
      <div class="iv-stat-row"><span>방어 개체값:</span> ${getIvRatingText(ivs.def)}</div>
      <div class="iv-stat-row"><span>스피드 개체값:</span> ${getIvRatingText(ivs.spd)}</div>
      <div class="iv-stat-row"><span>특수방어 개체값:</span> ${getIvRatingText(ivs.spDef)}</div>
      <div class="iv-stat-row"><span>특수공격 개체값:</span> ${getIvRatingText(ivs.spAtk)}</div>
    `;
  }

  const skillsContainer = document.getElementById('detailSkillsContainer');
  const skills = getPokemonSkills(poke);
  if (skillsContainer) {
    skillsContainer.innerHTML = skills.map(s => `
      <div class="skill-card">
        <span class="skill-type-badge">${s.type}</span>
        <div style="font-weight:bold;">${s.name}</div>
        <div style="color:#cbd5e1; font-size:0.75rem;">위력 ${s.power} / 명중 ${s.acc}%</div>
      </div>
    `).join('');
  }

  const modal = document.getElementById('pokeDetailModal');
  if (modal) modal.classList.remove('hidden');

  setTimeout(() => {
    const canvas = document.getElementById('statRadarCanvas');
    if (canvas) drawHexagonRadarChart(canvas, poke);
  }, 50);
}

function closePokeDetailModal() {
  const modal = document.getElementById('pokeDetailModal');
  if (modal) modal.classList.add('hidden');
}

function drawHexagonRadarChart(canvas, poke) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = 80;

  ctx.clearRect(0, 0, width, height);
  const labels = ["HP", "공격", "방어", "스피드", "특방", "특공"];
  const angles = [-Math.PI/2, -Math.PI/6, Math.PI/6, Math.PI/2, 5*Math.PI/6, -5*Math.PI/6];

  [0.33, 0.66, 1.0].forEach(scale => {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const x = centerX + radius * scale * Math.cos(angles[i]);
      const y = centerY + radius * scale * Math.sin(angles[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  ctx.font = "bold 11px sans-serif";
  ctx.fillStyle = "#f1c40f";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let i = 0; i < 6; i++) {
    const x = centerX + radius * Math.cos(angles[i]);
    const y = centerY + radius * Math.sin(angles[i]);
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(x, y);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.stroke();

    const lx = centerX + (radius + 20) * Math.cos(angles[i]);
    const ly = centerY + (radius + 20) * Math.sin(angles[i]);
    ctx.fillText(labels[i], lx, ly);
  }

  const ivs = poke.ivs || { hp:15, atk:15, def:15, spd:15, spDef:15, spAtk:15 };
  const values = [
    (ivs.hp || 0) / 31,
    (ivs.atk || 0) / 31,
    (ivs.def || 0) / 31,
    (ivs.spd || 0) / 31,
    (ivs.spDef || 0) / 31,
    (ivs.spAtk || 0) / 31
  ];

  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const valRatio = Math.max(0.1, values[i]);
    const x = centerX + radius * valRatio * Math.cos(angles[i]);
    const y = centerY + radius * valRatio * Math.sin(angles[i]);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = "rgba(56, 189, 248, 0.45)";
  ctx.fill();
  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 2;
  ctx.stroke();
}

/* ===================================================
 * 4. ⚔️ 승급전 & 배틀 진행 엔진
 * =================================================== */
function detectActiveSynergies(teamUnits) {
  const typeCounts = {};
  teamUnits.forEach(u => {
    if (!u) return;
    if (u.type1) typeCounts[u.type1] = (typeCounts[u.type1] || 0) + 1;
    if (u.type2) typeCounts[u.type2] = (typeCounts[u.type2] || 0) + 1;
  });

  const activeTypes = [];
  Object.keys(typeCounts).forEach(t => {
    if (typeCounts[t] >= 3 && TYPE_SYNERGIES[t]) {
      activeTypes.push({ type: t, ...TYPE_SYNERGIES[t] });
    }
  });
  return activeTypes;
}

function getMatchTitleInfo() {
  const rIndex = gameState.player.rankIndex;
  const rankStr = RANKS[rIndex];

  if (rankStr === 'CHAMPION') {
    return { title: '👑 세계 챔피언 방어전', sub: '최상위 챔피언 칭호를 보유 중입니다!' };
  }
  if (rankStr === 'ELITE_FOUR') {
    const eWins = gameState.player.eliteWins;
    if (eWins < 4) {
      return { title: `🗡️ 사천왕 ${eWins + 1}번째 도전`, sub: `사천왕 4연승 필요 (${eWins}/4 연승 중)` };
    } else {
      return { title: `👑 챔피언 최종 승급전`, sub: `세계 챔피언에 도전하세요!` };
    }
  }

  const tWins = gameState.player.trainerWins;
  if (tWins < 3) {
    return { title: `🏛️ ${rankStr}-랭크 트레이너 ${tWins + 1}번째 상대`, sub: `3연승 필요 (${tWins}/3 연승 중)` };
  } else {
    return { title: `🔥 ${rankStr}-랭크 관장 승급전`, sub: `관장을 격파하고 승급하세요!` };
  }
}

function renderGymUI() {
  const container = document.getElementById('gymContentContainer');
  if (!container) return;

  const matchInfo = getMatchTitleInfo();

  container.innerHTML = `
    <div class="battle-field">
      <div class="arena-display">
        <div class="sk-top-hud">
          <div class="sk-stage-name" id="stageTitle">${matchInfo.title}</div>
          <div class="sk-synergy-tag" id="synergyStatusTag">시너지: 계산 중</div>
        </div>

        <div class="sk-battle-zone">
          <div class="sk-team-side player-side">
            <div class="sk-line back-line" id="playerBackSide"></div>
            <div class="sk-line front-line" id="playerFrontSide"></div>
          </div>
          
          <div class="sk-vs-badge">VS</div>

          <div class="sk-team-side enemy-side">
            <div class="sk-line front-line" id="enemyFrontSide"></div>
            <div class="sk-line back-line" id="enemyBackSide"></div>
          </div>
        </div>
      </div>

      <div class="sk-dialogue-box" id="battleDialogue">
        ⚔️ ${matchInfo.sub} '배틀 시작' 버튼을 누르세요.
      </div>

      <div class="sk-bottom-control" style="display: flex; gap: 10px;">
        <button class="btn-action" id="startBattleBtn" onclick="startGymBattle()" style="flex: 1; padding: 12px; font-size: 1rem;">⚔️ 배틀 시작</button>
        <button class="btn-action" id="nextTurnBtn" onclick="nextTurnGymBattle()" style="display:none; flex: 1; background: var(--accent-yellow); color: #0f172a; padding: 12px; font-size: 1rem;">⚡ 1라운드 실행 ➡️</button>
      </div>
    </div>
  `;

  initBattleTeams();
}

function initBattleTeams() {
  const pFront = gameState.squad.front.map(p => p ? { ...p, currentHp: p.maxHp, side: 'player', position: 'front' } : null);
  const pBack = gameState.squad.back.map(p => p ? { ...p, currentHp: p.maxHp, side: 'player', position: 'back' } : null);

  for (let i = 0; i < 3; i++) {
    if (!pFront[i]) pFront[i] = { ...createPokemonInstance(1, 5), side: 'player', position: 'front' };
    if (!pBack[i]) pBack[i] = { ...createPokemonInstance(25, 5), side: 'player', position: 'back' };
  }

  const baseLvl = 5 + gameState.player.rankIndex * 3;

  const eFront = [
    { ...createPokemonInstance(74, baseLvl), side: 'enemy', position: 'front' },
    { ...createPokemonInstance(95, baseLvl), side: 'enemy', position: 'front' },
    { ...createPokemonInstance(111, baseLvl), side: 'enemy', position: 'front' }
  ];
  const eBack = [
    { ...createPokemonInstance(41, baseLvl), side: 'enemy', position: 'back' },
    { ...createPokemonInstance(21, baseLvl), side: 'enemy', position: 'back' },
    { ...createPokemonInstance(52, baseLvl), side: 'enemy', position: 'back' }
  ];

  const playerSynergies = detectActiveSynergies([...pFront, ...pBack]);
  
  const applySynergyStats = (team, synergies) => {
    synergies.forEach(s => {
      team.forEach(u => {
        if (!u) return;
        if (s.type === '불꽃' || s.type === '격투') u.atk = Math.floor(u.atk * 1.15);
        if (s.type === '전기' || s.type === '비행') u.spd = Math.floor(u.spd * 1.15);
        if (s.type === '땅' || s.type === '바위') u.def = Math.floor(u.def * 1.15);
        if (s.type === '노말') {
          u.atk = Math.floor(u.atk * 1.08);
          u.def = Math.floor(u.def * 1.08);
          u.spd = Math.floor(u.spd * 1.08);
        }
      });
    });
  };

  applySynergyStats([...pFront, ...pBack], playerSynergies);

  currentBattleState = {
    playerFront: pFront,
    playerBack: pBack,
    enemyFront: eFront,
    enemyBack: eBack,
    playerSynergies,
    round: 1,
    isFinished: false
  };

  const tag = document.getElementById('synergyStatusTag');
  if (tag) {
    if (playerSynergies.length > 0) {
      tag.innerText = `시너지: ${playerSynergies.map(s => s.name).join(', ')}`;
      tag.style.color = '#2ecc71';
    } else {
      tag.innerText = `시너지: 없음 (동일 타입 3마리 필요)`;
      tag.style.color = '#94a3b8';
    }
  }

  renderBattleArenaUnits();
}

function renderBattleArenaUnits() {
  if (!currentBattleState) return;

  const renderUnitHTML = (poke, isFlip = false) => {
    if (!poke) return `<div class="sk-unit empty" style="width:60px; height:60px;"></div>`;
    const isFainted = poke.currentHp <= 0;
    const hpPct = Math.max(0, Math.min(100, (poke.currentHp / poke.maxHp) * 100));
    const reqExp = poke.level * 50;
    const expPct = Math.max(0, Math.min(100, ((poke.exp || 0) / reqExp) * 100));

    return `
      <div class="sk-unit ${isFainted ? 'fainted' : ''}" id="unit-${poke.instanceId}">
        <div class="sk-hp-badge">
          <div class="sk-unit-info">
            <span class="sk-unit-lvl">Lv.${poke.level}</span>
            <span>${poke.name}</span>
          </div>
          <div class="sk-hp-bg">
            <div class="sk-hp-fill ${poke.side === 'enemy' ? 'enemy' : ''}" style="width: ${hpPct}%;"></div>
          </div>
          ${poke.side === 'player' ? `<div class="sk-exp-bg"><div class="sk-exp-fill" style="width: ${expPct}%;"></div></div>` : ''}
        </div>
        <div class="sk-sprite-wrapper">
          <img src="${poke.img}" class="sk-sprite ${isFlip ? 'flip' : ''}">
          <div class="sk-shadow"></div>
        </div>
      </div>
    `;
  };

  const pb = document.getElementById('playerBackSide');
  const pf = document.getElementById('playerFrontSide');
  if (pb) pb.innerHTML = currentBattleState.playerBack.map(p => renderUnitHTML(p, false)).join('');
  if (pf) pf.innerHTML = currentBattleState.playerFront.map(p => renderUnitHTML(p, false)).join('');

  const ef = document.getElementById('enemyFrontSide');
  const eb = document.getElementById('enemyBackSide');
  if (ef) ef.innerHTML = currentBattleState.enemyFront.map(e => renderUnitHTML(e, true)).join('');
  if (eb) eb.innerHTML = currentBattleState.enemyBack.map(e => renderUnitHTML(e, true)).join('');
}

function startGymBattle() {
  initBattleTeams();
  const startBtn = document.getElementById('startBattleBtn');
  if (startBtn) startBtn.style.display = 'none';

  const nextBtn = document.getElementById('nextTurnBtn');
  if (nextBtn) {
    nextBtn.style.display = 'block';
    nextBtn.innerText = `⚡ 1라운드 실행 ➡️`;
  }
  
  const dialogue = document.getElementById('battleDialogue');
  const matchInfo = getMatchTitleInfo();
  if (dialogue) {
    dialogue.innerHTML = `⚔️ ${matchInfo.title} 개시! 스피드 순서대로 라운드 행동이 진행됩니다.`;
  }
}

function nextTurnGymBattle() {
  if (!currentBattleState || currentBattleState.isFinished) return;

  const dialogue = document.getElementById('battleDialogue');
  const nextBtn = document.getElementById('nextTurnBtn');

  const hasWaterSynergy = currentBattleState.playerSynergies.some(s => s.type === '물' || s.type === '풀');
  const playerAliveUnits = [...currentBattleState.playerFront, ...currentBattleState.playerBack].filter(u => u && u.currentHp > 0);

  const logLines = [`<b>🔔 [제 ${currentBattleState.round} 라운드 전투 진행]</b>`];

  if (hasWaterSynergy && playerAliveUnits.length > 0) {
    playerAliveUnits.forEach(u => {
      const healAmt = Math.floor(u.maxHp * 0.06);
      u.currentHp = Math.min(u.maxHp, u.currentHp + healAmt);
    });
    logLines.push(`💧/🌿 <b>[타입 시너지]</b> 아군 전원 HP 6% 회복!`);
  }

  const roundQueue = [
    ...currentBattleState.playerFront, ...currentBattleState.playerBack,
    ...currentBattleState.enemyFront, ...currentBattleState.enemyBack
  ].filter(u => u && u.currentHp > 0);

  roundQueue.sort((a, b) => (b.spd || 0) - (a.spd || 0));

  for (let i = 0; i < roundQueue.length; i++) {
    const attacker = roundQueue[i];
    if (attacker.currentHp <= 0) continue;

    const isPlayerAttacker = attacker.side === 'player';
    const targetPoolFront = isPlayerAttacker ? currentBattleState.enemyFront : currentBattleState.playerFront;
    const targetPoolBack = isPlayerAttacker ? currentBattleState.enemyBack : currentBattleState.playerBack;

    let aliveTargets = targetPoolFront.filter(t => t && t.currentHp > 0);
    if (aliveTargets.length === 0) {
      aliveTargets = targetPoolBack.filter(t => t && t.currentHp > 0);
    }

    if (aliveTargets.length === 0) break;

    const target = aliveTargets[Math.floor(Math.random() * aliveTargets.length)];
    const baseDmg = Math.max(5, attacker.atk - Math.floor(target.def / 2));
    target.currentHp = Math.max(0, target.currentHp - baseDmg);

    const teamTag = isPlayerAttacker ? `<span style="color:#38bdf8;">[아군]</span>` : `<span style="color:#ef4444;">[적군]</span>`;
    let detailMsg = `• ${teamTag} <b>${attacker.name}</b> ➔ <b>${target.name}</b>에게 <b style="color:#f1c40f;">${baseDmg}</b> 피해!`;

    if (target.currentHp <= 0) {
      detailMsg += ` <b style="color:#ef4444;">💥(쓰러짐!)</b>`;
      if (isPlayerAttacker) {
        const gainedExp = Math.max(20, target.level * 35);
        detailMsg += ` <span style="color:#38bdf8;">(+${gainedExp} EXP)</span>`;

        playerAliveUnits.forEach(pUnit => {
          const logs = addExpToPokemon(pUnit, gainedExp);
          logs.forEach(l => logLines.push(l));
        });
      }
    }

    logLines.push(detailMsg);
  }

  renderBattleArenaUnits();

  const isPlayerAlive = [...currentBattleState.playerFront, ...currentBattleState.playerBack].some(u => u && u.currentHp > 0);
  const isEnemyAlive = [...currentBattleState.enemyFront, ...currentBattleState.enemyBack].some(u => u && u.currentHp > 0);

  const curRankStr = RANKS[gameState.player.rankIndex];

  if (!isEnemyAlive) {
    if (curRankStr === 'CHAMPION') {
      logLines.push(`<br><span style="color:#2ecc71; font-weight:bold;">🎉 [챔피언 방어 성공] 챔피언 자리를 지켜냈습니다! (+300 Gold, +30 Gem)</span>`);
    } else if (curRankStr === 'ELITE_FOUR') {
      if (gameState.player.eliteWins < 4) {
        gameState.player.eliteWins += 1;
        if (gameState.player.eliteWins === 4) {
          logLines.push(`<br><span style="color:#f1c40f; font-weight:bold;">🔥 [사천왕 4연승 달성!] 마침내 챔피언 도전권이 해금되었습니다!</span>`);
        } else {
          logLines.push(`<br><span style="color:#2ecc71; font-weight:bold;">🎉 [사천왕 승리] ${gameState.player.eliteWins}/4번째 사천왕 격파!</span>`);
        }
      } else {
        gameState.player.rankIndex = RANKS.indexOf('CHAMPION');
        logLines.push(`<br><span style="color:#f1c40f; font-weight:bold;">🏆 [최종 챔피언 등극!] 챔피언을 쓰러뜨리고 세계 챔피언이 되었습니다!</span>`);
      }
    } else {
      if (gameState.player.trainerWins < 3) {
        gameState.player.trainerWins += 1;
        if (gameState.player.trainerWins === 3) {
          logLines.push(`<br><span style="color:#f1c40f; font-weight:bold;">🔥 [3연승 성공!] ${curRankStr}-랭크 관장 승급전 도전권 해금!</span>`);
        } else {
          logLines.push(`<br><span style="color:#2ecc71; font-weight:bold;">🎉 [트레이너 승리] ${gameState.player.trainerWins}/3연승 달성!</span>`);
        }
      } else {
        gameState.player.rankIndex += 1;
        gameState.player.trainerWins = 0;
        const newRankStr = getPlayerRankName();
        logLines.push(`<br><span style="color:#f1c40f; font-weight:bold;">🎊 [관장 격파 승급!] 축하합니다! ${newRankStr}(으)로 승급하셨습니다!</span>`);
      }
    }

    gameState.player.gold += 200;
    gameState.player.gem += 20;
    saveGameState();
    updateTopBarUI();
    currentBattleState.isFinished = true;
    if (nextBtn) nextBtn.style.display = 'none';
    const startBtn = document.getElementById('startBattleBtn');
    if (startBtn) startBtn.style.display = 'block';

  } else if (!isPlayerAlive) {
    if (curRankStr === 'ELITE_FOUR') {
      gameState.player.eliteWins = 0;
      logLines.push(`<br><span style="color:#ef4444; font-weight:bold;">💀 [사천왕 패배] 사천왕 도전은 1번 사천왕부터 다시 도전해야 합니다!</span>`);
    } else if (curRankStr !== 'CHAMPION') {
      if (gameState.player.trainerWins < 3) {
        gameState.player.trainerWins = 0;
        logLines.push(`<br><span style="color:#ef4444; font-weight:bold;">💀 [트레이너 패배] 3연승 실패! 첫 번째 트레이너부터 다시 도전해야 합니다.</span>`);
      } else {
        logLines.push(`<br><span style="color:#ef4444; font-weight:bold;">💀 [관장전 패배] 관장 승급전 실패... 다시 관장전부터 도전하세요.</span>`);
      }
    }
    saveGameState();
    currentBattleState.isFinished = true;
    if (nextBtn) nextBtn.style.display = 'none';
    const startBtn = document.getElementById('startBattleBtn');
    if (startBtn) startBtn.style.display = 'block';
  } else {
    currentBattleState.round += 1;
    if (nextBtn) nextBtn.innerText = `⚡ ${currentBattleState.round}라운드 실행 ➡️`;
  }

  if (dialogue) {
    dialogue.innerHTML = logLines.join('<br>');
    dialogue.scrollTop = dialogue.scrollHeight;
  }
}

/* ===================================================
 * 5. 🏢 기타 시설 UI 렌더링 함수 세트
 * =================================================== */
function renderPartyUI() { renderSquadSlots(); renderInventoryList(); }
function renderSquadSlots() {
  const fc = document.getElementById('squadFrontContainer');
  const bc = document.getElementById('squadBackContainer');
  if (fc) fc.innerHTML = gameState.squad.front.map((p, idx) => createSlotHTML('front', idx, p)).join('');
  if (bc) bc.innerHTML = gameState.squad.back.map((p, idx) => createSlotHTML('back', idx, p)).join('');
}
function createSlotHTML(row, index, poke) {
  if (!poke) return `<div class="squad-slot empty" onclick="openSquadModal('${row}', ${index})"><span style="font-weight: bold; color: #94a3b8;">+ ${row === 'front' ? '전열' : '후열'} ${index + 1}</span></div>`;
  return `
    <div class="squad-slot occupied">
      <img src="${poke.img}" class="squad-poke-img" onclick="openPokeDetailModal('${poke.instanceId}')">
      <div onclick="openPokeDetailModal('${poke.instanceId}')" style="cursor:pointer;">
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
    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #94a3b8; padding: 20px;">보유한 포켓몬이 없습니다. 연구소에서 포켓몬을 채용해보세요!</div>`;
    return;
  }
  container.innerHTML = gameState.inventory.map(poke => {
    const totalIv = Object.values(poke.ivs || {}).reduce((a, b) => a + b, 0);
    const ivPct = Math.floor((totalIv / 186) * 100);
    return `
      <div class="inventory-card" onclick="openPokeDetailModal('${poke.instanceId}')">
        <img src="${poke.img}">
        <div style="font-weight: bold; margin-top: 4px;">${poke.name}</div>
        <div style="font-size: 0.8rem; color: #cbd5e1;">Lv.${poke.level}</div>
        <div style="font-size: 0.75rem; color: #f1c40f; font-weight: bold; margin-top: 4px;">IV ${ivPct}% (상세보기)</div>
      </div>
    `;
  }).join('');
}

function openSquadModal(row, index) {
  selectedSlotInfo = { row, index };
  const titleEl = document.getElementById('modalSlotTitle');
  if (titleEl) titleEl.innerText = `${row === 'front' ? '전열' : '후열'} ${index + 1} 슬롯 선택`;
  const modalList = document.getElementById('modalPokeList');
  if (modalList) {
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
  }
  const modal = document.getElementById('squadSelectModal');
  if (modal) modal.classList.remove('hidden');
}
function closeSquadModal() {
  const modal = document.getElementById('squadSelectModal');
  if (modal) modal.classList.add('hidden');
  selectedSlotInfo = null;
}
function selectPokeForSquad(instanceId) {
  if (!selectedSlotInfo) return;
  const poke = gameState.inventory.find(p => p.instanceId === instanceId);
  if (poke) {
    gameState.squad[selectedSlotInfo.row][selectedSlotInfo.index] = poke;
    saveGameState();
    closeSquadModal();
    renderSquadSlots();
  }
}
function removeFromSquad(row, index) {
  gameState.squad[row][index] = null;
  saveGameState();
  renderSquadSlots();
}

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
  if (gameState.player.gold < cost) { alert('Gold가 부족합니다!'); return; }
  gameState.player.gold -= cost;
  gameState.player[type] += amount;
  saveGameState();
  alert(`${type === 'candy' ? '이상한사탕' : 'Gem'} ${amount}개를 구매했습니다!`);
  updateTopBarUI();
}

function renderDaycareUI() {
  const container = document.getElementById('daycareContentContainer');
  if (!container) return;
  if (!gameState.inventory || gameState.inventory.length === 0) {
    container.innerHTML = `<p style="text-align: center; color: #94a3b8; padding: 30px;">레벨업할 포켓몬이 없습니다.</p>`;
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
  if (gameState.player.candy < 5) { alert('이상한사탕이 부족합니다!'); return; }
  const poke = gameState.inventory.find(p => p.instanceId === instanceId);
  if (poke) {
    gameState.player.candy -= 5;
    poke.level += 1;
    recalculatePokemonStats(poke);
    poke.currentHp = poke.maxHp;
    const evoLog = checkAndEvolvePokemon(poke);
    saveGameState();
    updateTopBarUI();
    renderDaycareUI();
    if (evoLog) {
      alert(`🎉 레벨업 성공!\n✨ ${poke.name}(으)로 진화했습니다!`);
    } else {
      alert(`🎉 ${poke.name} 레벨이 Lv.${poke.level}(으)로 상승했습니다!`);
    }
  }
}

function renderLabUI() {
  const container = document.getElementById('labContentContainer');
  if (!container) return;
  container.innerHTML = `
    <div style="text-align: center; padding: 30px; background: rgba(15, 23, 42, 0.6); border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.1);">
      <div style="font-size: 3rem; margin-bottom: 10px;">🔬</div>
      <h3 style="font-size: 1.4rem; color: #f1c40f; margin-bottom: 10px;">오박사 연구소 포켓몬 채용</h3>
      <p style="margin: 10px 0; color: #cbd5e1; font-size: 0.95rem;">기본 단계 포켓몬 무작위 채용 (중복 시 최고 IV 수치 자동 갱신)</p>
      <div style="display: flex; justify-content: center; gap: 15px; margin-top: 25px;">
        <button class="btn-action" onclick="summonLabPokemon(1)" style="padding: 12px 20px;">🎲 1회 소환 (10 Gem)</button>
        <button class="btn-action" style="background: var(--accent-yellow); color: #0f172a; padding: 12px 20px;" onclick="summonLabPokemon(10)">✨ 10연차 소환 (100 Gem)</button>
      </div>
    </div>
  `;
}

function summonLabPokemon(count) {
  const cost = count * 10;
  if (gameState.player.gem < cost) { alert('Gem이 부족합니다!'); return; }
  if (typeof POKEMON_DB === 'undefined') return;
  const basePool = POKEMON_DB.filter(p => p.isBaseStage || p.stage === 1);
  if (!basePool || basePool.length === 0) return;

  gameState.player.gem -= cost;
  const results = [];
  for (let i = 0; i < count; i++) {
    const template = basePool[Math.floor(Math.random() * basePool.length)];
    const res = addOrUpgradePokemon(template.id, 5);
    results.push(res.isNew ? `✨ [신규 획득] ${res.poke.name}` : (res.isUpgraded ? `📈 [IV 강화] ${res.poke.name}` : `🔄 [상태 유지] ${res.poke.name}`));
  }
  saveGameState();
  updateTopBarUI();
  alert(`🎲 소환 결과!\n\n` + results.join('\n'));
}

function renderDexUI() {
  const container = document.getElementById('dexContentContainer');
  if (!container || typeof POKEMON_DB === 'undefined') return;
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
 * 6. 🔄 탭 전환 관리 (switchTab)
 * =================================================== */
function switchTab(tabId) {
  document.querySelectorAll('.facility-panel').forEach(panel => panel.classList.remove('active'));
  const target = document.getElementById(`tab-${tabId}`);
  if (!target) return;

  target.classList.add('active');
  updateTopBarUI();

  switch (tabId) {
    case 'village': if (typeof window.refreshVillageUI === 'function') window.refreshVillageUI(); break;
    case 'party': renderPartyUI(); break;
    case 'gym': renderGymUI(); break;
    case 'mart': renderMartUI(); break;
    case 'daycare': renderDaycareUI(); break;
    case 'lab': renderLabUI(); break;
    case 'dex': renderDexUI(); break;
  }
}

// 데이터 초기 로드 및 기본 포켓몬 세팅
if (!loadGameState() || gameState.inventory.length === 0) {
  addOrUpgradePokemon(1, 5);  // 이상해씨
  addOrUpgradePokemon(4, 5);  // 파이리
  addOrUpgradePokemon(7, 5);  // 꼬부기
  saveGameState();
}

// 전역 스코프 바인딩
window.gameState = gameState;
window.saveGameState = saveGameState;
window.loadGameState = loadGameState;
window.addExpToPokemon = addExpToPokemon;
window.switchTab = switchTab;
window.updateTopBarUI = updateTopBarUI;
window.getPlayerRankName = getPlayerRankName;
window.renderGymUI = renderGymUI;
window.startGymBattle = startGymBattle;
window.nextTurnGymBattle = nextTurnGymBattle;
window.renderPartyUI = renderPartyUI;
window.openSquadModal = openSquadModal;
window.closeSquadModal = closeSquadModal;
window.selectPokeForSquad = selectPokeForSquad;
window.removeFromSquad = removeFromSquad;
window.openPokeDetailModal = openPokeDetailModal;
window.closePokeDetailModal = closePokeDetailModal;
window.renderMartUI = renderMartUI;
window.buyMartItem = buyMartItem;
window.renderDaycareUI = renderDaycareUI;
window.levelUpPokemon = levelUpPokemon;
window.renderLabUI = renderLabUI;
window.summonLabPokemon = summonLabPokemon;
window.renderDexUI = renderDexUI;