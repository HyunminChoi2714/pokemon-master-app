/**
 * src/ui/mart.js - 상점 UI
 */

function renderMartUI() {
  const container = document.getElementById('martContentContainer');
  if (!container) return;

  container.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;">
      <div class="inventory-card">
        <h4>🍬 이상한사탕 x 10</h4>
        <p style="margin: 8px 0; color: #f1c40f;">100 Gold</p>
        <button class="btn-action" onclick="buyMartItem('candy', 10, 100)">구매하기</button>
      </div>
      <div class="inventory-card">
        <h4>💎 보석(Gem) x 50</h4>
        <p style="margin: 8px 0; color: #f1c40f;">500 Gold</p>
        <button class="btn-action" onclick="buyMartItem('gem', 50, 500)">구매하기</button>
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
  alert(`${type === 'candy' ? '이상한사탕' : 'Gem'} ${amount}개를 구매했습니다!`);
  updateTopBarUI();
}

window.renderMartUI = renderMartUI;
window.buyMartItem = buyMartItem;