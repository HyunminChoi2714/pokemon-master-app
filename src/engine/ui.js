/**
 * ui.js - DOM 렌더링, 이벤트 바인딩 및 화면 인터페이스 제어 (수정본)
 */

/**
 * 네비게이션 탭 전환 처리 함수
 * @param {string} tabId - 이동할 탭 ID
 * @param {Event} evt - 클릭 이벤트 객체
 */
function switchTab(tabId, evt) {
  // 모든 탭 버튼 및 패널 비활성화
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.facility-panel').forEach(panel => panel.classList.remove('active'));

  // 클릭된 버튼 요소 정확히 탐색 및 활성화
  if (evt) {
    const targetBtn = evt.currentTarget || (evt.target ? evt.target.closest('.nav-btn') : null);
    if (targetBtn) {
      targetBtn.classList.add('active');
    }
  }

  // 대상 패널 활성화
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
  const rankEl = document.getElementById('playerRank');
  const goldEl = document.getElementById('goldAmount');
  const gemEl = document.getElementById('gemAmount');
  const candyEl = document.getElementById('candyAmount');

  if (rankEl) rankEl.innerText = `${gameState.player.rank}-랭크 트레이너`;
  if (goldEl) goldEl.innerText = gameState.player.gold.toLocaleString();
  if (gemEl) gemEl.innerText = gameState.player.gem.toLocaleString();
  if (candyEl) candyEl.innerText = gameState.player.candy.toLocaleString();

  renderSquadSlots();
  renderBuffs();
  renderInventory();
  renderShop();
  renderDaycare();
  renderPokedex();
}

/**
 * 엔트리 파티 슬롯 렌더링
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
      slotEl.onclick = () => openPokemonDetail(poke.uid);

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
 * 파티 시너지 버프 및 지방 패시브 렌더링
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

  const activePassives = typeof getActiveRegionalPassives === 'function' ? getActiveRegionalPassives() : [];
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
 * 인벤토리 목록 렌더링
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
    card.onclick = () => equipPokemonDetail(poke.uid);
    card.innerHTML = `
      <span class="stage-badge">${poke.stage === 1 ? '🌱 기본체' : (poke.stage === 2 ? '⚡ 2단계' : '🔥 최종체')}</span>
      <img src="${poke.img}" class="poke-img" alt="${poke.name}" />
      <div style="font-weight:bold; font-size:0.85rem;">${poke.name}</div>
      <div class="poke-stats">Lv.${poke.level} | HP ${poke.currentHp}/${poke.maxHp}</div>
      <span class="poke-moves-tag">기술: ${poke.moves.join(', ')}</span>
    `;
    grid.appendChild(card);
  });
}

/**
 * 프렌들리숍 아이템 카드 렌더링
 */
function renderShop() {
  const grid = document.getElementById('shopGrid');
  if (!grid || typeof SHOP_ITEMS === 'undefined') return;
  grid.innerHTML = '';

  SHOP_ITEMS.forEach(item => {
    const isPurchasedCharm = item.type === 'charm' && gameState.purchasedCharms[item.charmKey];
    const card = document.createElement('div');
    card.className = 'shop-card';
    card.innerHTML = `
      <div>
        <div class="shop-icon">${item.icon}</div>
        <div class="shop-name">${item.name}</div>
        <div class="shop-desc">${item.desc}</div>
      </div>
      <div>
        <div style="font-weight:bold; margin-bottom:8px; color:var(--accent-yellow);">🪙 ${item.cost.toLocaleString()} Gold</div>
        <button class="shop-buy-btn" ${isPurchasedCharm ? 'disabled style="background:#555;"' : ''} onclick="buyShopItem('${item.id}')">
          ${isPurchasedCharm ? '✅ 보유 중' : '🛒 구매하기'}
        </button>
      </div>
    `;
    grid.appendChild(card);
  });
}

/**
 * 키우미집 육성 렌더링
 */
function renderDaycare() {
  const grid = document.getElementById('daycareGrid');
  if (!grid) return;
  grid.innerHTML = '';

  gameState.inventory.forEach(poke => {
    const evoInfo = typeof EVOLUTION_MAP !== 'undefined' ? EVOLUTION_MAP[poke.id] : null;
    const canEvolve = evoInfo && poke.level >= evoInfo.minLevel;

    const card = document.createElement('div');
    card.className = 'poke-card';
    card.innerHTML = `
      <img src="${poke.img}" class="poke-img" alt="${poke.name}" />
      <div style="font-weight:bold; font-size:0.85rem;">${poke.name} (Lv.${poke.level})</div>
      <span class="poke-moves-tag">기술: ${poke.moves.join(', ')}</span>
      <button style="margin-top:6px; padding:4px 8px; background:var(--accent-yellow); border:none; border-radius:4px; font-weight:bold; cursor:pointer; width:100%;" onclick="levelUpPokemon('${poke.uid}')">🍬 레벨업 (10 Candy)</button>
      ${canEvolve ? `<button class="evo-btn" onclick="evolvePokemon('${poke.uid}')">✨ 진화 가능</button>` : ''}
    `;
    grid.appendChild(card);
  });
}

/**
 * 전국 도감 렌더링
 */
function renderPokedex() {
  const regGrid = document.getElementById('regionGrid');
  if (regGrid && typeof REGION_DEFINITIONS !== 'undefined') {
    regGrid.innerHTML = '';
    REGION_DEFINITIONS.forEach(reg => {
      const count = [...gameState.pokedex].filter(id => id >= reg.minId && id <= reg.maxId).length;
      const isUnlocked = count >= 1;

      const regCard = document.createElement('div');
      regCard.className = 'region-card';
      regCard.style.borderColor = isUnlocked ? 'var(--accent-yellow)' : 'rgba(255,255,255,0.1)';
      regCard.innerHTML = `
        <div class="region-title">${reg.name}</div>
        <div style="font-size:0.75rem; color:#aaa; margin-top:2px;">수집: ${count}마리</div>
        <div class="region-buff">${isUnlocked ? '✨ ' + reg.effectName + ' 발동 중' : '🔒 미발동'}</div>
      `;
      regGrid.appendChild(regCard);
    });
  }

  const grid = document.getElementById('pokedexGrid');
  const progressText = document.getElementById('dexProgressText');
  if (typeof POKEMON_DB === 'undefined') return;

  if (progressText) {
    const pct = Math.round((gameState.pokedex.size / POKEMON_DB.length) * 100);
    progressText.innerText = `도감 수집 진행도: ${gameState.pokedex.size} / ${POKEMON_DB.length} (${pct}%)`;
  }

  if (grid) {
    grid.innerHTML = '';
    POKEMON_DB.forEach(template => {
      const isCaught = gameState.pokedex.has(template.id);
      const card = document.createElement('div');
      card.className = 'poke-card';
      card.style.opacity = isCaught ? '1' : '0.35';

      card.innerHTML = `
        <img src="${template.img}" class="poke-img" style="${isCaught ? '' : 'filter:brightness(0);'}" alt="${template.name}" />
        <div style="font-weight:bold; font-size:0.8rem;">No.${template.id} ${isCaught ? template.name : '???'}</div>
      `;
      grid.appendChild(card);
    });
  }
}

/**
 * 전방 3마리 / 후방 3마리 2열 진형 배틀 아레나 UI 렌더링
 * @param {Array} playerTeam - 플레이어 파티
 * @param {Array} enemyTeam - 관장 포켓몬 파티
 */
function renderBattleArena(playerTeam, enemyTeam) {
  const pSide = document.getElementById('playerBattleSide');
  const eSide = document.getElementById('enemyBattleSide');
  if (!pSide || !eSide) return;

  // 플레이어 파티 전방(front) / 후방(back) 라인 추출
  const playerBack = gameState.squad.back.filter(p => p !== null);
  const playerFront = gameState.squad.front.filter(p => p !== null);

  // 적 파티 전방 / 후방 추출 (최대 6마리 대응)
  const enemyFront = enemyTeam.slice(0, 3);
  const enemyBack = enemyTeam.slice(3, 6);

  const renderUnit = (p, isEnemy = false) => {
    if (!p) return '';
    const isFainted = p.currentHp <= 0;
    const hpPct = Math.max(0, Math.min(100, (p.currentHp / p.maxHp) * 100));

    return `
      <div class="sk-unit ${isEnemy ? 'enemy' : ''} ${isFainted ? 'fainted' : ''}">
        <div class="sk-hp-badge">
          <div class="sk-unit-info">
            <span class="sk-unit-lvl">Lv.${p.level}</span>
            <span class="sk-unit-name">${p.name}</span>
          </div>
          <div class="sk-hp-bg">
            <div class="sk-hp-fill ${isEnemy ? 'enemy' : ''}" style="width:${hpPct}%;"></div>
          </div>
        </div>
        <div class="sk-sprite-wrapper">
          <img src="${p.img}" class="sk-sprite ${isEnemy ? 'flip' : ''}" alt="${p.name}" />
          <div class="sk-shadow"></div>
        </div>
      </div>
    `;
  };

  // 아군 (좌측: 후방 라인 -> 전방 라인)
  pSide.innerHTML = `
    <div class="sk-line back-line">
      ${playerBack.map(p => renderUnit(p, false)).join('')}
    </div>
    <div class="sk-line front-line">
      ${playerFront.map(p => renderUnit(p, false)).join('')}
    </div>
  `;

  // 적군 (우측: 전방 라인 -> 후방 라인)
  eSide.innerHTML = `
    <div class="sk-line front-line">
      ${enemyFront.map(e => renderUnit(e, true)).join('')}
    </div>
    <div class="sk-line back-line">
      ${enemyBack.map(e => renderUnit(e, true)).join('')}
    </div>
  `;
}

// DOM 생성이 완료되는 즉시 게임 데이터 및 UI 초기화
document.addEventListener('DOMContentLoaded', function() {
  if (typeof initGame === 'function') {
    initGame();
  }
});

/**
 * 개체값(IV) 텍스트 판정 변환 함수 (포켓몬 본가 심사위원 멘트)
 */
function getIvGradeText(iv) {
  if (iv === 31) return { text: "최고!", color: "#2ecc71" };
  if (iv >= 30) return { text: "훌륭하다", color: "#3498db" };
  if (iv >= 26) return { text: "잘함", color: "#f39c12" };
  if (iv >= 16) return { text: "보통", color: "#e67e22" };
  return { text: "별로", color: "#e74c3c" };
}

/**
 * 포켓몬 상세 정보 모달 열기
 */
function openPokemonDetail(uid) {
  const poke = gameState.inventory.find(p => p.uid === uid);
  if (!poke) return;

  const modal = document.getElementById('pokeDetailModal');
  const imgEl = document.getElementById('modalPokeImg');
  const nameEl = document.getElementById('modalPokeName');
  const typesEl = document.getElementById('modalPokeTypes');
  const movesGrid = document.getElementById('modalMovesGrid');
  const statsTable = document.getElementById('modalStatsTable');
  const summaryEl = document.getElementById('modalOverallJudge');

  imgEl.src = poke.img;
  nameEl.innerText = `${poke.name} (Lv.${poke.level})`;
  typesEl.innerHTML = `
    <span class="type-badge type-${poke.type1}">${poke.type1}</span>
    ${poke.type2 ? `<span class="type-badge type-${poke.type2}">${poke.type2}</span>` : ''}
  `;

  // 기술 4종 카드 출력
  movesGrid.innerHTML = poke.moves.map(mName => {
    const move = (typeof MOVES_DB !== 'undefined' && MOVES_DB[mName]) || { name: mName, type: poke.type1, category: "물리", power: 40, accuracy: 100 };
    return `
      <div class="move-card">
        <div class="move-card-header">
          <span class="move-card-name">${move.name}</span>
          <span class="type-badge type-${move.type}">${move.type}</span>
        </div>
        <div class="move-card-detail">
          <span>${move.category}</span>
          <span>위력: ${move.power || '-'} | 명중: ${move.accuracy || '-'}</span>
        </div>
      </div>
    `;
  }).join('');

  // 6개 세부 스탯 및 개체값 판정표 출력
  const ivs = poke.ivs || { hp: 15, atk: 15, def: 15, spAtk: 15, spDef: 15, spd: 15 };
  const statList = [
    { name: "HP", val: poke.maxHp, iv: ivs.hp },
    { name: "공격", val: poke.atk, iv: ivs.atk },
    { name: "방어", val: poke.def, iv: ivs.def },
    { name: "스피드", val: poke.spd, iv: ivs.spd },
    { name: "특수방어", val: poke.spDef || poke.def, iv: ivs.spDef },
    { name: "특수공격", val: poke.spAtk || poke.atk, iv: ivs.spAtk }
  ];

  statsTable.innerHTML = statList.map(s => {
    const grade = getIvGradeText(s.iv);
    return `
      <div class="stat-row-item">
        <span class="stat-row-name">${s.name}:</span>
        <span class="stat-row-val">${s.val}</span>
        <span class="stat-row-iv" style="color:${grade.color};">[${grade.text}]</span>
      </div>
    `;
  }).join('');

  // 개체값 총점 평가
  const ivSum = Object.values(ivs).reduce((a, b) => a + b, 0);
  if (ivSum >= 151) summaryEl.innerText = "🌟 훌륭한 능력!";
  else if (ivSum >= 121) summaryEl.innerText = "✨ 상당한 능력!";
  else if (ivSum >= 91) summaryEl.innerText = "👍 평균 이상의 능력!";
  else summaryEl.innerText = "🌱 성장 가능성이 있는 능력!";

  // 캔버스 육각형 레이더 그래프 그리기
  const canvas = document.getElementById('statHexCanvas');
  drawHexagonChart(canvas, statList);

  modal.classList.add('active');
}

/**
 * 포켓몬 상세 정보 모달 닫기
 */
function closePokemonDetail(evt) {
  if (evt && evt.target && !evt.target.classList.contains('modal-overlay') && !evt.target.classList.contains('modal-close-btn')) return;
  const modal = document.getElementById('pokeDetailModal');
  if (modal) modal.classList.remove('active');
}

/**
 * HTML5 Canvas 6축 육각형 레이더 그래프 렌더링 함수
 */
function drawHexagonChart(canvas, statList) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const centerX = width / 2;
  const centerY = height / 2 + 5;
  const radius = 80;

  ctx.clearRect(0, 0, width, height);

  // 6축 각도 (12시 방향 HP부터 시계 방향 순서)
  const angles = [
    -Math.PI / 2,         // HP (상단)
    -Math.PI / 6,         // 공격 (우상단)
    Math.PI / 6,          // 방어 (우하단)
    Math.PI / 2,          // 스피드 (하단)
    (5 * Math.PI) / 6,    // 특수방어 (좌하단)
    (-5 * Math.PI) / 6    // 특수공격 (좌상단)
  ];

  // 1. 그리드 베이스 육각형 (3단계)
  [0.33, 0.66, 1.0].forEach(scale => {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const x = centerX + radius * scale * Math.cos(angles[i]);
      const y = centerY + radius * scale * Math.sin(angles[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = scale === 1.0 ? 'rgba(243, 156, 18, 0.6)' : 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = scale === 1.0 ? 2 : 1;
    ctx.fillStyle = scale === 1.0 ? 'rgba(46, 204, 113, 0.08)' : 'transparent';
    ctx.fill();
    ctx.stroke();
  });

  // 2. 중심 축선 그리기
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + radius * Math.cos(angles[i]), centerY + radius * Math.sin(angles[i]));
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.stroke();
  }

  // 3. 실측 IV 데이터 파란색 다각형 폴리곤 그리기 (개체값 0~31 스케일링)
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const ivRatio = Math.max(0.15, statList[i].iv / 31);
    const x = centerX + radius * ivRatio * Math.cos(angles[i]);
    const y = centerY + radius * ivRatio * Math.sin(angles[i]);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(52, 152, 219, 0.55)';
  ctx.fill();
  ctx.strokeStyle = '#3498db';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // 4. 라벨 및 텍스트 표시
  ctx.font = 'bold 11px Pretendard, sans-serif';
  ctx.textAlign = 'center';

  for (let i = 0; i < 6; i++) {
    const labelRadius = radius + 22;
    const x = centerX + labelRadius * Math.cos(angles[i]);
    const y = centerY + labelRadius * Math.sin(angles[i]) + 4;

    ctx.fillStyle = '#f39c12';
    ctx.fillText(statList[i].name, x, y - 6);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(statList[i].val, x, y + 7);
  }
}