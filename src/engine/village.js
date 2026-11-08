/**
 * src/engine/village.js - 2D 라이브 마을 UI & 이벤트 위임(Event Delegation) 기반 클릭 보장 엔진
 */

const BUILDINGS_CONFIG = [
  { id: 'party', name: '트레이너 아지트', icon: '🎒', defaultBadge: '파티 관리' },
  { id: 'gym', name: '포켓몬 체육관', icon: '⚔️', defaultBadge: 'Z-Rank 배틀' },
  { id: 'mart', name: '프렌들리숍', icon: '🛒', defaultBadge: '아이템 상점' },
  { id: 'daycare', name: '포켓몬 키우미집', icon: '🍬', defaultBadge: '훈련 & 진화' },
  { id: 'lab', name: '오박사 연구소', icon: '🎲', defaultBadge: '10연차 소환' },
  { id: 'dex', name: '전국 도감 타워', icon: '📖', defaultBadge: '수집 도감' }
];

let isVillageInitialized = false;

function init2DVillage() {
  renderVillageNodes();
  bindVillageClickEvents();
}

/**
 * 마을 건물 노드 생성
 */
function renderVillageNodes() {
  const container = document.getElementById('buildingNodesContainer');
  if (!container) return;

  try {
    container.innerHTML = BUILDINGS_CONFIG.map(b => {
      let dynamicBadge = b.defaultBadge;
      try {
        dynamicBadge = getDynamicBadge(b.id, b.defaultBadge);
      } catch (e) {
        console.warn(`Badge error:`, e);
      }

      return `
        <div class="building-node-card" data-building-id="${b.id}">
          <div class="building-status-badge">${dynamicBadge}</div>
          <div class="building-icon">${b.icon}</div>
          <div class="building-title">${b.name}</div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error("Village render error:", err);
  }
}

/**
 * 이벤트 위임(Event Delegation)으로 어떤 요소나 자식 노드가 클릭되어도 100% 포착
 */
function bindVillageClickEvents() {
  if (isVillageInitialized) return;
  
  const container = document.getElementById('buildingNodesContainer');
  if (!container) return;

  container.addEventListener('click', (e) => {
    const card = e.target.closest('.building-node-card');
    if (card) {
      const targetId = card.getAttribute('data-building-id');
      if (typeof window.switchTab === 'function') {
        window.switchTab(targetId);
      } else if (typeof switchTab === 'function') {
        switchTab(targetId);
      }
    }
  });

  isVillageInitialized = true;
}

function getDynamicBadge(buildingId, defaultText) {
  if (typeof gameState === 'undefined' || !gameState) return defaultText;

  switch (buildingId) {
    case 'party':
      const partyCount = (gameState.inventory && Array.isArray(gameState.inventory)) ? gameState.inventory.length : 0;
      return `🎒 보유 중: ${partyCount}마리`;

    case 'lab':
      const gem = (gameState.player && gameState.player.gem !== undefined) ? gameState.player.gem : 0;
      return gem >= 10 ? `🎲 소환 가능! (${gem} Gem)` : `💎 Gem 필요`;

    case 'gym':
      const rName = (typeof getPlayerRankName === 'function') ? getPlayerRankName() : 'Z-Rank';
      return `⚔️ ${rName} 도전 중`;

    default:
      return defaultText;
  }
}

function refreshVillageUI() {
  renderVillageNodes();
}

window.init2DVillage = init2DVillage;
window.renderVillageNodes = renderVillageNodes;
window.refreshVillageUI = refreshVillageUI;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init2DVillage);
} else {
  init2DVillage();
}