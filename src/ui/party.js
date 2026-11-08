/**
 * src/engine/village.js - 2D 라이브 마을 UI 엔진
 */

const BUILDINGS_CONFIG = [
  { id: 'party', name: '트레이너 아지트', icon: '🎒', defaultBadge: '파티 관리' },
  { id: 'gym', name: '포켓몬 체육관', icon: '⚔️', defaultBadge: 'Z-Rank 체육관' },
  { id: 'mart', name: '프렌들리숍', icon: '🛒', defaultBadge: '상점' },
  { id: 'daycare', name: '포켓몬 키우미집', icon: '🍬', defaultBadge: '훈련 & 진화' },
  { id: 'lab', name: '오박사 연구소', icon: '🎲', defaultBadge: '10연차 소환' },
  { id: 'dex', name: '전국 도감 타워', icon: '📖', defaultBadge: '도감' }
];

function renderVillageNodes() {
  const container = document.getElementById('buildingNodesContainer');
  if (!container) return;

  container.innerHTML = BUILDINGS_CONFIG.map(b => {
    const dynamicBadge = getDynamicBadge(b.id, b.defaultBadge);
    return `
      <div class="building-node-card" onclick="switchTab('${b.id}')">
        <div class="building-status-badge">${dynamicBadge}</div>
        <div class="building-icon">${b.icon}</div>
        <div class="building-title">${b.name}</div>
      </div>
    `;
  }).join('');
}

function getDynamicBadge(buildingId, defaultText) {
  if (typeof gameState === 'undefined' || !gameState) return defaultText;

  switch (buildingId) {
    case 'party':
      const count = gameState.inventory ? gameState.inventory.length : 0;
      return `🎒 보유: ${count}마리`;
    case 'lab':
      const gem = gameState.player ? gameState.player.gem : 0;
      return gem >= 10 ? `🎲 소환 가능!` : `💎 Gem 필요`;
    default:
      return defaultText;
  }
}

function refreshVillageUI() {
  renderVillageNodes();
}

window.refreshVillageUI = refreshVillageUI;