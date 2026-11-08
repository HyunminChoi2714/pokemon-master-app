/**
 * src/ui/gym.js - 체육관 도전 UI
 */

function renderGymUI() {
  const container = document.getElementById('gymContentContainer');
  if (!container) return;

  container.innerHTML = `
    <div style="text-align: center; padding: 20px;">
      <h3>🏆 Z-Rank 체육관 관장 도전</h3>
      <p style="margin: 10px 0; color: #94a3b8;">상대: 관장 웅이 (꼬마돌 Lv.5 / 롱스톤 Lv.5)</p>
      <button class="btn-action" onclick="startGymBattle()">⚔️ 배틀 시작</button>
      <div id="battleLog" style="margin-top: 20px; text-align: left; background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; max-height: 200px; overflow-y: auto;"></div>
    </div>
  `;
}

function startGymBattle() {
  const log = document.getElementById('battleLog');
  if (!log) return;

  const hasSquad = gameState.squad.front.some(p => p !== null) || gameState.squad.back.some(p => p !== null);
  if (!hasSquad) {
    log.innerHTML = `<div style="color: #ef4444;">⚠️ 출전 파티에 포켓몬을 먼저 등록해주세요! (아지트에서 설정)</div>`;
    return;
  }

  log.innerHTML = `
    <div>🔔 Z-Rank 체육관 배틀 시작!</div>
    <div>⚔️ 내 파티가 웅이의 포켓몬과 격돌합니다...</div>
    <div style="color: #2ecc71; margin-top: 8px; font-weight: bold;">🎉 승리하였습니다! (보상: 200 Gold, 20 Gem)</div>
  `;
  gameState.player.gold += 200;
  gameState.player.gem += 20;
  updateTopBarUI();
}

window.renderGymUI = renderGymUI;
window.startGymBattle = startGymBattle;