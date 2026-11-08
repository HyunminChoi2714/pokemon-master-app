/**
 * src/ui/dex.js - 전국 도감 1025마리 렌더링 UI
 */

function renderDexUI() {
  const container = document.getElementById('dexContentContainer');
  if (!container) return;

  const totalCount = POKEMON_DB.length || 1025;
  const collectedCount = gameState.pokedex.size;

  container.innerHTML = `
    <div style="margin-bottom: 15px;">
      <strong>수집률: ${collectedCount} / ${totalCount} 마리 (${Math.floor((collectedCount/totalCount)*100)}%)</strong>
    </div>
    <div class="inventory-grid">
      ${POKEMON_DB.map(p => {
        const isCaught = gameState.pokedex.has(p.id);
        return `
          <div class="inventory-card" style="opacity: ${isCaught ? 1 : 0.4}; filter: ${isCaught ? 'none' : 'grayscale(100%)'};">
            <img src="${p.img}">
            <div style="font-size: 0.8rem; color: #94a3b8;">No.${String(p.id).padStart(4, '0')}</div>
            <div style="font-weight: bold;">${isCaught ? p.name : '???'}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

window.renderDexUI = renderDexUI;