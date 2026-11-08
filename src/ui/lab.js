/**
 * src/ui/lab.js - 포켓몬 뽑기/채용 UI
 */

function renderLabUI() {
  const container = document.getElementById('labContentContainer');
  if (!container) return;

  container.innerHTML = `
    <div style="text-align: center; padding: 20px;">
      <h3>🔬 오박사 연구소 포켓몬 채용</h3>
      <p style="margin: 10px 0; color: #94a3b8;">1,025마리 중 기본 단계 포켓몬이 채용됩니다. (중복 시 최고 IV로 자동 강화)</p>
      <div style="display: flex; justify-content: center; gap: 15px; margin-top: 20px;">
        <button class="btn-action" onclick="summonLabPokemon(1)">🎲 1회 소환 (10 Gem)</button>
        <button class="btn-action" style="background: var(--accent-yellow);" onclick="summonLabPokemon(10)">✨ 10연차 소환 (100 Gem)</button>
      </div>
    </div>
  `;
}

function summonLabPokemon(count) {
  const cost = count * 10;
  if (gameState.player.gem < cost) {
    alert('Gem이 부족합니다!');
    return;
  }

  const basePool = POKEMON_DB.filter(p => p.isBaseStage || p.stage === 1);
  if (basePool.length === 0) return;

  gameState.player.gem -= cost;
  const results = [];

  for (let i = 0; i < count; i++) {
    const template = basePool[Math.floor(Math.random() * basePool.length)];
    const res = addOrUpgradePokemon(template.id, 5);
    results.push(res.isNew ? `✨ [신규] ${res.poke.name}` : (res.isUpgraded ? `📈 [IV 강화] ${res.poke.name}` : `🔄 [유지] ${res.poke.name}`));
  }

  updateTopBarUI();
  alert(`🎲 소환 결과!\n\n` + results.join('\n'));
}

window.renderLabUI = renderLabUI;
window.summonLabPokemon = summonLabPokemon;