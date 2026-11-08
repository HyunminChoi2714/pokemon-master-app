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
 * 배틀 아레나 UI 렌더링
 */
function renderBattleArena(playerTeam, enemyTeam) {
  const pSide = document.getElementById('playerBattleSide');
  const eSide = document.getElementById('enemyBattleSide');
  if (!pSide || !eSide) return;

  pSide.innerHTML = playerTeam.map(p => `
    <div class="battle-poke-unit">
      <img src="${p.img}" width="34" alt="${p.name}"/>
      <div style="flex:1; margin-left:6px;">
        <div style="font-size:0.75rem; font-weight:bold;">${p.name}</div>
        <div class="hp-bar-bg"><div class="hp-bar-fill" style="width:${(p.currentHp / p.maxHp) * 100}%"></div></div>
      </div>
    </div>
  `).join('');

  eSide.innerHTML = enemyTeam.map(e => `
    <div class="battle-poke-unit">
      <div style="flex:1; margin-right:6px; text-align:right;">
        <div style="font-size:0.75rem; font-weight:bold;">${e.name}</div>
        <div class="hp-bar-bg"><div class="hp-bar-fill" style="width:${(e.currentHp / e.maxHp) * 100}%; background:var(--accent-red);"></div></div>
      </div>
      <img src="${e.img}" width="34" alt="${e.name}"/>
    </div>
  `).join('');
}

// DOM 생성이 완료되는 즉시 게임 데이터 및 UI 초기화
document.addEventListener('DOMContentLoaded', function() {
  if (typeof initGame === 'function') {
    initGame();
  }
});