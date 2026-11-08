/**
 * src/engine/village.js - 2D 라이브 마을 UI & 건물 노드 자동 렌더링 엔진
 */

const BUILDINGS_CONFIG = [
  { id: 'party', name: '트레이너 아지트', icon: '🎒', defaultBadge: '파티 관리' },
  { id: 'gym', name: '포켓몬 체육관', icon: '⚔️', defaultBadge: 'Z-Rank 배틀' },
  { id: 'mart', name: '프렌들리숍', icon: '🛒', defaultBadge: '아이템 상점' },
  { id: 'daycare', name: '포켓몬 키우미집', icon: '🍬', defaultBadge: '훈련 & 진화' },
  { id: 'lab', name: '오박사 연구소', icon: '🎲', defaultBadge: '10연차 소환' },
  { id: 'dex', name: '전국 도감 타워', icon: '📖', defaultBadge: '수집 도감' }
];

function init2DVillage() {
  renderVillageNodes();
}

/**
 * 마을 건물 카드 생성 및 렌더링
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
        console.warn(`Badge error on ${b.id}:`, e);
      }

      return `
        <div class="building-node-card" onclick="switchTab('${b.id}')">
          <div class="building-status-badge">${dynamicBadge}</div>
          <div class="building-icon">${b.icon}</div>
          <div class="building-title">${b.name}</div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error("Village node render error:", err);
  }
}

/**
 * 게임 상태에 맞춰 건물 간판 실시간 업데이트
 */
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

// 전역 스코프 등록
window.init2DVillage = init2DVillage;
window.renderVillageNodes = renderVillageNodes;
window.refreshVillageUI = refreshVillageUI;

// 스크립트 로드 타이밍과 관계없이 자동 가동 보장
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init2DVillage);
} else {
  init2DVillage();
}