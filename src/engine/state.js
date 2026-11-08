/**
 * src/engine/state.js - 1클릭 1라운드 완전 실행 및 스피드 순차 로그 렌더링 엔진
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
 * 1. 📊 육각형(Radar) 스탯 그래프 & 기술 4종 모달
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

  setTimeout(() => {
    const canvas = document.getElementById('statRadarCanvas');
    if (canvas) drawHexagonRadarChart(canvas, poke);
  }, 50);
}

function closePokeDetailModal() {
  document.getElementById('pokeDetailModal').classList.add('hidden');
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
 * 2. ⚔️ 1클릭 1라운드 순차 처리 및 대사창 순차 출력 엔진
 * =================================================== */

function renderGymUI() {
  const container = document.getElementById('gymContentContainer');
  if (!container) return;

  container.innerHTML = `
    <div class="battle-field">
      <div class="arena-display">
        <div class="sk-top-hud">
          <div class="sk-stage-name" id="stageTitle">🏛️ Z-랭크 1단계 관장 도전전</div>
          <div class="sk-rank-info" id="rankProgress">승급 포인트: 0 / 100</div>
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
        ⚔️ 배틀 준비 완료. '승급 배틀 시작' 버튼을 누르세요.
      </div>

      <div class="sk-bottom-control" style="display: flex; gap: 10px;">
        <button class="btn-action" id="startBattleBtn" onclick="startGymBattle()" style="flex: 1; padding: 12px; font-size: 1rem;">⚔️ 승급 배틀 시작</button>
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

  const eFront = [
    { ...createPokemonInstance(74, 5), side: 'enemy', position: 'front' },
    { ...createPokemonInstance(95, 5), side: 'enemy', position: 'front' },
    { ...createPokemonInstance(111, 5), side: 'enemy', position: 'front' }
  ];
  const eBack = [
    { ...createPokemonInstance(41, 5), side: 'enemy', position: 'back' },
    { ...createPokemonInstance(21, 5), side: 'enemy', position: 'back' },
    { ...createPokemonInstance(52, 5), side: 'enemy', position: 'back' }
  ];

  currentBattleState = {
    playerFront: pFront,
    playerBack: pBack,
    enemyFront: eFront,
    enemyBack: eBack,
    round: 1,
    isFinished: false
  };

  renderBattleArenaUnits();
}

function renderBattleArenaUnits() {
  if (!currentBattleState) return;

  const renderUnitHTML = (poke, isFlip = false) => {
    if (!poke) return `<div class="sk-unit empty" style="width:60px; height:60px;"></div>`;
    const isFainted = poke.currentHp <= 0;
    const hpPct = Math.max(0, Math.min(100, (poke.currentHp / poke.maxHp) * 100));
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
  document.getElementById('startBattleBtn').style.display = 'none';
  const nextBtn = document.getElementById('nextTurnBtn');
  nextBtn.style.display = 'block';
  nextBtn.innerText = `⚡ 1라운드 실행 ➡️`;
  
  const dialogue = document.getElementById('battleDialogue');
  dialogue.innerHTML = `⚔️ Z-Rank 승급전 개시! 버튼을 누르면 한 라운드 동안 모든 생존 포켓몬이 스피드 순으로 순차 공격합니다.`;
}

/**
 * 🌟 1클릭 = 1라운드 전체 완결 & 발생 활동 순차 로그 출력
 */
function nextTurnGymBattle() {
  if (!currentBattleState || currentBattleState.isFinished) return;

  const dialogue = document.getElementById('battleDialogue');
  const nextBtn = document.getElementById('nextTurnBtn');

  // 이번 라운드에 생존해 있는 전장의 모든 유닛 큐 구성 (스피드 내림차순)
  const roundQueue = [
    ...currentBattleState.playerFront, ...currentBattleState.playerBack,
    ...currentBattleState.enemyFront, ...currentBattleState.enemyBack
  ].filter(u => u && u.currentHp > 0);

  roundQueue.sort((a, b) => (b.spd || 0) - (a.spd || 0));

  const logLines = [`<b>🔔 [제 ${currentBattleState.round} 라운드 전원 행동 로그]</b>`];

  // 스피드 순서대로 라운드 내 모든 유닛 1회씩 행동 처리
  for (let i = 0; i < roundQueue.length; i++) {
    const attacker = roundQueue[i];
    if (attacker.currentHp <= 0) continue; // 라운드 진행 중 사망했으면 스킵

    const isPlayerAttacker = attacker.side === 'player';
    const targetPoolFront = isPlayerAttacker ? currentBattleState.enemyFront : currentBattleState.playerFront;
    const targetPoolBack = isPlayerAttacker ? currentBattleState.enemyBack : currentBattleState.playerBack;

    let aliveTargets = targetPoolFront.filter(t => t && t.currentHp > 0);
    if (aliveTargets.length === 0) {
      aliveTargets = targetPoolBack.filter(t => t && t.currentHp > 0);
    }

    if (aliveTargets.length === 0) break; // 상대 전원 사망 시 라운드 조기 종료

    const target = aliveTargets[Math.floor(Math.random() * aliveTargets.length)];
    const baseDmg = Math.max(5, attacker.atk - Math.floor(target.def / 2));
    target.currentHp = Math.max(0, target.currentHp - baseDmg);

    const teamTag = isPlayerAttacker ? `<span style="color:#38bdf8;">[아군]</span>` : `<span style="color:#ef4444;">[적군]</span>`;
    const faintedTag = target.currentHp <= 0 ? ' <b style="color:#ef4444;">💥(빈사!)</b>' : '';

    logLines.push(`• ${teamTag} <b>${attacker.name}</b>(Spd:${attacker.spd}) ➔ <b>${target.name}</b>에게 <b style="color:#f1c40f;">${baseDmg}</b> 피해! (HP: ${target.currentHp})${faintedTag}`);
  }

  // 체력 바 UI 업데이트
  renderBattleArenaUnits();

  // 승패 판정
  const isPlayerAlive = [...currentBattleState.playerFront, ...currentBattleState.playerBack].some(u => u && u.currentHp > 0);
  const isEnemyAlive = [...currentBattleState.enemyFront, ...currentBattleState.enemyBack].some(u => u && u.currentHp > 0);

  if (!isEnemyAlive) {
    logLines.push(`<br><span style="color:#2ecc71; font-weight:bold; font-size:1rem;">🎉 [승리] 체육관 관장의 포켓몬을 모두 격파했습니다! (+200 Gold, +20 Gem)</span>`);
    gameState.player.gold += 200;
    gameState.player.gem += 20;
    updateTopBarUI();
    currentBattleState.isFinished = true;
    nextBtn.style.display = 'none';
    document.getElementById('startBattleBtn').style.display = 'block';
  } else if (!isPlayerAlive) {
    logLines.push(`<br><span style="color:#ef4444; font-weight:bold; font-size:1rem;">💀 [패배] 아군 포켓몬 전원이 쓰러졌습니다... 다시 도전하세요!</span>`);
    currentBattleState.isFinished = true;
    nextBtn.style.display = 'none';
    document.getElementById('startBattleBtn').style.display = 'block';
  } else {
    currentBattleState.round += 1;
    nextBtn.innerText = `⚡ ${currentBattleState.round}라운드 실행 ➡️`;
  }

  // 대사창에 전체 행동 순차 기록 및 자동으로 맨 아래 스크롤
  dialogue.innerHTML = logLines.join('<br>');
  dialogue.scrollTop = dialogue.scrollHeight;
}

/* ===================================================
 * 3. 기타 시설 UI 렌더링
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
  document.getElementById('modalSlotTitle').innerText = `${row === 'front' ? '전열' : '후열'} ${index + 1} 슬롯 선택`;
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
function closeSquadModal() { document.getElementById('squadSelectModal').classList.add('hidden'); selectedSlotInfo = null; }
function selectPokeForSquad(instanceId) {
  if (!selectedSlotInfo) return;
  const poke = gameState.inventory.find(p => p.instanceId === instanceId);
  if (poke) {
    gameState.squad[selectedSlotInfo.row][selectedSlotInfo.index] = poke;
    closeSquadModal();
    renderSquadSlots();
  }
}
function removeFromSquad(row, index) { gameState.squad[row][index] = null; renderSquadSlots(); }

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
    updateTopBarUI();
    renderDaycareUI();
    alert(`🎉 ${poke.name} 레벨이 Lv.${poke.level}(으)로 상승했습니다!`);
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
  const basePool = POKEMON_DB.filter(p => p.isBaseStage || p.stage === 1);
  if (!basePool || basePool.length === 0) return;
  gameState.player.gem -= cost;
  const results = [];
  for (let i = 0; i < count; i++) {
    const template = basePool[Math.floor(Math.random() * basePool.length)];
    const res = addOrUpgradePokemon(template.id, 5);
    results.push(res.isNew ? `✨ [신규 획득] ${res.poke.name}` : (res.isUpgraded ? `📈 [IV 강화] ${res.poke.name}` : `🔄 [상태 유지] ${res.poke.name}`));
  }
  updateTopBarUI();
  alert(`🎲 소환 결과!\n\n` + results.join('\n'));
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
    case 'village': if (typeof refreshVillageUI === 'function') refreshVillageUI(); break;
    case 'party': renderPartyUI(); break;
    case 'gym': renderGymUI(); break;
    case 'mart': renderMartUI(); break;
    case 'daycare': renderDaycareUI(); break;
    case 'lab': renderLabUI(); break;
    case 'dex': renderDexUI(); break;
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