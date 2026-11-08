/**
 * src/engine/state.js - 세븐나이츠 배틀 시뮬레이터 & 육각형(Radar) 스탯/기술 모달 통합 엔진
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
let currentBattleState = null;

// 상단 재화 바 갱신
function updateTopBarUI() {
  document.getElementById('resGem').innerText = gameState.player.gem;
  document.getElementById('resGold').innerText = gameState.player.gold;
  document.getElementById('resCandy').innerText = gameState.player.candy;
  document.getElementById('trainerRank').innerText = `${gameState.player.rank}-Rank`;
  document.getElementById('trainerName').innerText = gameState.player.name;
}

// 포켓몬 인스턴스 생성 (6개 개체값 0~31 부여)
function createPokemonInstance(templateId, level = 5) {
  const template = POKEMON_DB.find(p => p.id === templateId) || POKEMON_DB[0];
  
  const ivs = {
    hp: Math.floor(Math.random() * 32),
    atk: Math.floor(Math.random() * 32),
    def: Math.floor(Math.random() * 32),
    spd: Math.floor(Math.random() * 32),
    spDef: Math.floor(Math.random() * 32),
    spAtk: Math.floor(Math.random() * 32)
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
    const statsList = ['hp', 'atk', 'def', 'spd', 'spDef', 'spAtk'];

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
 * 1. 📊 6축 육각형 레이더 스탯 그래프 & 기술 4종 모달
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

  document.getElementById('detailPokeTitle').innerText = `📊 ${poke.name} (Lv.${poke.level}) 스탯 / 개체값`;

  // 개체값 평가 표기
  const ivBox = document.getElementById('detailIvRatings');
  const ivs = poke.ivs || { hp:0, atk:0, def:0, spd:0, spDef:0, spAtk:0 };
  ivBox.innerHTML = `
    <div class="iv-stat-row"><span>HP 개체값:</span> ${getIvRatingText(ivs.hp)}</div>
    <div class="iv-stat-row"><span>공격 개체값:</span> ${getIvRatingText(ivs.atk)}</div>
    <div class="iv-stat-row"><span>방어 개체값:</span> ${getIvRatingText(ivs.def)}</div>
    <div class="iv-stat-row"><span>스피드 개체값:</span> ${getIvRatingText(ivs.spd)}</div>
    <div class="iv-stat-row"><span>특수방어 개체값:</span> ${getIvRatingText(ivs.spDef)}</div>
    <div class="iv-stat-row"><span>특수공격 개체값:</span> ${getIvRatingText(ivs.spAtk)}</div>
  `;

  // 기술 4종 표기
  const skillsContainer = document.getElementById('detailSkillsContainer');
  const skills = getPokemonSkills(poke);
  skillsContainer.innerHTML = skills.map(s => `
    <div class="skill-card">
      <span class="skill-type-badge">${s.type}</span>
      <div style="font-weight:bold;">${s.name}</div>
      <div style="color:#cbd5e1; font-size:0.75rem;">위력 ${s.power} / 명중 ${s.acc}%</div>
    </div>
  `).join('');

  document.getElementById('pokeDetailModal').classList.remove('hidden');

  // 육각형 레이더 캔버스 그리기
  setTimeout(() => {
    const canvas = document.getElementById('statRadarCanvas');
    if (canvas) drawHexagonRadarChart(canvas, poke);
  }, 50);
}

function closePokeDetailModal() {
  document.getElementById('pokeDetailModal').classList.add('hidden');
}

/**
 * 6축 육각형 레이더 그래프 캔버스 렌더링 함수
 */
function drawHexagonRadarChart(canvas, poke) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = 80;

  ctx.clearRect(0, 0, width, height);

  // 6개 축 라벨 (HP, 공격, 방어, 스피드, 특방, 특공)
  const labels = ["HP", "공격", "방어", "스피드", "특방", "특공"];
  const angles = [-Math.PI/2, -Math.PI/6, Math.PI/6, Math.PI/2, 5*Math.PI/6, -5*Math.PI/6];

  // 1) 격자 육각형 3단계 그리기 (33%, 66%, 100%)
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

  // 2) 축선 그리기 및 라벨 표시
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

    // 라벨 텍스트 위치 띄우기
    const lx = centerX + (radius + 20) * Math.cos(angles[i]);
    const ly = centerY + (radius + 20) * Math.sin(angles[i]);
    ctx.fillText(labels[i], lx, ly);
  }

  // 3) 개체값(IV 0~31) 스탯 다각형 영역 그리기
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
    const valRatio = Math.max(0.1, values[i]); // 최소 0.1 보장
    const x = centerX + radius * valRatio * Math.cos(angles[i]);
    const y = centerY + radius * valRatio * Math.sin(angles[i]);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();

  // 영역 채우기 & 테두리
  ctx.fillStyle = "rgba(56, 189, 248, 0.45)";
  ctx.fill();
  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 2;
  ctx.stroke();
}

/* ===================================================
 * 2. ⚔️ 세븐나이츠 형태 체육관 아레나 턴제 전투 시스템[cite: 1]
 * =================================================== */

function renderGymUI() {
  const container = document.getElementById('gymContentContainer');
  if (!container) return;

  container.innerHTML = `
    <div class="battle-field">
      <!-- 1) 세븐나이츠 대면 아레나 필드 -->
      <div class="arena-display">
        <div class="sk-top-hud">
          <div class="sk-stage-name" id="stageTitle">🏛️ Z-랭크 1단계 관장 도전전</div>
          <div class="sk-rank-info" id="rankProgress">승급 포인트: 0 / 100</div>
        </div>

        <div class="sk-battle-zone">
          <!-- 좌측 아군 진형 -->
          <div class="sk-team-side player-side" id="playerBattleSide"></div>
          
          <div class="sk-vs-badge">VS</div>

          <!-- 우측 적군 진형 (반전) -->
          <div class="sk-team-side enemy-side" id="enemyBattleSide"></div>
        </div>
      </div>

      <!-- 2) 하단 배틀 안내 대사 상자 -->
      <div class="sk-dialogue-box" id="battleDialogue">
        ⚔️ 배틀 준비 완료. '승급 배틀 시작' 버튼을 눌러 전투를 진행하세요.
      </div>

      <!-- 3) 하단 조작 버튼 -->
      <div class="sk-bottom-control" style="display: flex; gap: 10px;">
        <button class="btn-action" id="startBattleBtn" onclick="startGymBattle()" style="flex: 1; padding: 12px; font-size: 1rem;">⚔️ 승급 배틀 시작</button>
        <button class="btn-action" id="nextTurnBtn" onclick="nextTurnGymBattle()" style="display:none; flex: 1; background: var(--accent-yellow); color: #0f172a; padding: 12px; font-size: 1rem;">다음 턴 (1턴) ➡️</button>
      </div>
    </div>
  `;

  // initial arena state render
  initBattleTeams();
}

function initBattleTeams() {
  // 아군 파티
  const pTeam = getPlayerBattleTeam();
  // 적 관장 파티 (웅이 꼬마돌/롱스톤)
  const eTeam = [
    createPokemonInstance(74, 5), // 꼬마돌
    createPokemonInstance(95, 5)  // 롱스톤
  ];

  currentBattleState = {
    playerTeam: pTeam,
    enemyTeam: eTeam,
    turn: 1,
    isFinished: false
  };

  renderBattleArenaUnits();
}

function getPlayerBattleTeam() {
  const squadPokes = [...gameState.squad.front, ...gameState.squad.back].filter(p => p !== null);
  if (squadPokes.length > 0) return squadPokes.map(p => ({ ...p, currentHp: p.maxHp }));
  if (gameState.inventory.length > 0) return gameState.inventory.slice(0, 3).map(p => ({ ...p, currentHp: p.maxHp }));
  
  // 기본 피카츄 생성
  return [createPokemonInstance(25, 5)];
}

function renderBattleArenaUnits() {
  const pSide = document.getElementById('playerBattleSide');
  const eSide = document.getElementById('enemyBattleSide');
  if (!pSide || !eSide || !currentBattleState) return;

  // 아군 (좌측)
  pSide.innerHTML = currentBattleState.playerTeam.map(p => {
    const isFainted = p.currentHp <= 0;
    const hpPct = Math.max(0, Math.min(100, (p.currentHp / p.maxHp) * 100));
    return `
      <div class="sk-unit ${isFainted ? 'fainted' : ''}">
        <div class="sk-hp-badge">
          <div class="sk-unit-info">
            <span class="sk-unit-lvl">Lv.${p.level}</span>
            <span>${p.name}</span>
          </div>
          <div class="sk-hp-bg">
            <div class="sk-hp-fill" style="width: ${hpPct}%;"></div>
          </div>
        </div>
        <div class="sk-sprite-wrapper">
          <img src="${p.img}" class="sk-sprite">
          <div class="sk-shadow"></div>
        </div>
      </div>
    `;
  }).join('');

  // 적군 (우측 - 반전)
  eSide.innerHTML = currentBattleState.enemyTeam.map(e => {
    const isFainted = e.currentHp <= 0;
    const hpPct = Math.max(0, Math.min(100, (e.currentHp / e.maxHp) * 100));
    return `
      <div class="sk-unit ${isFainted ? 'fainted' : ''}">
        <div class="sk-hp-badge">
          <div class="sk-unit-info">
            <span class="sk-unit-lvl">Lv.${e.level}</span>
            <span>${e.name}</span>
          </div>
          <div class="sk-hp-bg">
            <div class="sk-hp-fill enemy" style="width: ${hpPct}%;"></div>
          </div>
        </div>
        <div class="sk-sprite-wrapper">
          <img src="${e.img}" class="sk-sprite flip">
          <div class="sk-shadow"></div>
        </div>
      </div>
    `;
  }).join('');
}

function startGymBattle() {
  initBattleTeams();
  document.getElementById('startBattleBtn').style.display = 'none';
  const nextBtn = document.getElementById('nextTurnBtn');
  nextBtn.style.display = 'block';
  nextBtn.innerText = `다음 턴 (1턴) ➡️`;
  
  const dialogue = document.getElementById('battleDialogue');
  dialogue.innerHTML = `⚔️ Z-Rank 체육관 관장 배틀 개시! '다음 턴' 버튼을 눌러 공격하세요.`;
}

function nextTurnGymBattle() {
  if (!currentBattleState || currentBattleState.isFinished) return;

  const dialogue = document.getElementById('battleDialogue');
  const alivePlayer = currentBattleState.playerTeam.find(p => p.currentHp > 0);
  const aliveEnemy = currentBattleState.enemyTeam.find(e => e.currentHp > 0);

  if (!alivePlayer) {
    dialogue.innerHTML = `<span style="color:#ef4444;">💀 아군 포켓몬이 모두 쓰러졌습니다... 체육관 관장 배틀 패배!</span>`;
    currentBattleState.isFinished = true;
    document.getElementById('nextTurnBtn').style.display = 'none';
    document.getElementById('startBattleBtn').style.display = 'block';
    return;
  }

  if (!aliveEnemy) {
    dialogue.innerHTML = `<span style="color:#2ecc71; font-weight:bold;">🎉 관장의 모든 포켓몬을 격파했습니다! 승리! (보상: 200 Gold, 20 Gem)</span>`;
    gameState.player.gold += 200;
    gameState.player.gem += 20;
    updateTopBarUI();
    currentBattleState.isFinished = true;
    document.getElementById('nextTurnBtn').style.display = 'none';
    document.getElementById('startBattleBtn').style.display = 'block';
    return;
  }

  // 1) 아군 공격
  const dmgToEnemy = Math.max(5, alivePlayer.atk - Math.floor(aliveEnemy.def / 2));
  aliveEnemy.currentHp = Math.max(0, aliveEnemy.currentHp - dmgToEnemy);

  // 2) 적군 반격
  let counterMsg = "";
  if (aliveEnemy.currentHp > 0) {
    const dmgToPlayer = Math.max(5, aliveEnemy.atk - Math.floor(alivePlayer.def / 2));
    alivePlayer.currentHp = Math.max(0, alivePlayer.currentHp - dmgToPlayer);
    counterMsg = ` / ${aliveEnemy.name}의 반격으로 ${dmgToPlayer} 피해!`;
  } else {
    counterMsg = ` / 💥 ${aliveEnemy.name}(이)가 쓰러졌습니다!`;
  }

  dialogue.innerHTML = `⚔️ [${currentBattleState.turn}턴] ${alivePlayer.name}의 공격! ${aliveEnemy.name}에게 ${dmgToEnemy} 피해!${counterMsg}`;
  
  currentBattleState.turn += 1;
  document.getElementById('nextTurnBtn').innerText = `다음 턴 (${currentBattleState.turn}턴) ➡️`;
  renderBattleArenaUnits();
}

/* ===================================================
 * 3. 파티 / 프렌들리숍 / 키우미집 / 연구소 / 도감 UI
 * =================================================== */

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
    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #94a3b8; padding: 20px;">보유한 포켓몬이 없습니다. 오박사 연구소에서 포켓몬을 채용해보세요!</div>`;
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

function switchTab(tabId) {
  document.querySelectorAll('.facility-panel').forEach(panel => panel.classList.remove('active'));
  const target = document.getElementById(`tab-${tabId}`);
  if (!target) return;
  
  target.classList.add('active');
  updateTopBarUI();

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

// 전역 바인딩
window.gameState = gameState;
window.updateTopBarUI = updateTopBarUI;
window.switchTab = switchTab;
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