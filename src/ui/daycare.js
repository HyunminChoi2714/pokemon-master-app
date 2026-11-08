/**
 * src/ui/daycare.js - 키우미집 레벨업 UI
 */

function renderDaycareUI() {
  const container = document.getElementById('daycareContentContainer');
  if (!container) return;

  if (gameState.inventory.length === 0) {
    container.innerHTML = `<p style="text-align: center; color: #94a3b8;">레벨업할 포켓몬이 없습니다.</p>`;
    return;
  }

  container.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 15px;">
      ${gameState.inventory.map(poke => `
        <div class="inventory-card">
          <img src="${poke.img}">
          <div style="font-weight: bold;">${poke.name} (Lv.${poke.level})</div>
          <button class="btn-action" style="margin-top: 8px;" onclick="levelUpPokemon('${poke.instanceId}')">🍬 레벨업 (사탕 5개)</button>
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
    alert(`${poke.name}의 레벨이 ${poke.level}로 올라갔습니다!`);
  }
}

window.renderDaycareUI = renderDaycareUI;
window.levelUpPokemon = levelUpPokemon;