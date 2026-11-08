/**
 * battle.js - 턴제 배틀 시뮬레이터 및 데미지/명중률 계산 엔진
 */

let isBattling = false;

/**
 * 승급 배틀 실행 함수
 */
function startBattle() {
  const playerTeam = [...gameState.squad.front, ...gameState.squad.back]
    .filter(p => p !== null && p.currentHp > 0);

  if (playerTeam.length === 0) {
    alert('전투 가능한 포켓몬이 파티에 없습니다!');
    return;
  }

  isBattling = true;
  document.getElementById('startBattleBtn').disabled = true;
  const logEl = document.getElementById('battleLog');
  logEl.innerHTML = '<div class="log-line log-highlight">⚔️ 랭크 승급 배틀이 시작되었습니다!</div>';

  // 관장 가상 상대 파티 생성
  const enemyTeam = [
    createPokemonInstance(25, 7),
    createPokemonInstance(4, 7),
    createPokemonInstance(7, 7)
  ];

  renderBattleArena(playerTeam, enemyTeam);

  let turn = 1;
  const battleInterval = setInterval(() => {
    if (!isBattling) {
      clearInterval(battleInterval);
      return;
    }

    const activePlayer = playerTeam.filter(p => p.currentHp > 0);
    const activeEnemy = enemyTeam.filter(p => p.currentHp > 0);

    // 승패 판정
    if (activePlayer.length === 0 || activeEnemy.length === 0) {
      clearInterval(battleInterval);
      isBattling = false;
      document.getElementById('startBattleBtn').disabled = false;

      if (activePlayer.length > 0) {
        // 도감 및 상점 부수 효과 수치 보정 적용
        let rewardGold = 200;
        let rewardCandy = 20;

        if (gameState.pokedex.has(1)) rewardGold = Math.floor(rewardGold * 1.2); // 관동의 부적 (+20%)
        if (gameState.pokedex.has(152)) rewardCandy += 5; // 성도의 부적 (+5 사탕)
        if (gameState.purchasedCharms.goldBonus) rewardGold = Math.floor(rewardGold * 1.1);

        logEl.innerHTML += `<div class="log-line log-highlight">🎉 배틀 승리! 승급 P+25, ${rewardGold} Gold, ${rewardCandy} Candy 획득!</div>`;
        gameState.player.gold += rewardGold;
        gameState.player.candy += rewardCandy;
        gameState.player.rankPoints += 25;
      } else {
        logEl.innerHTML += `<div class="log-line" style="color:var(--accent-red);">❌ 배틀 패배...</div>`;
      }
      renderUI();
      return;
    }

    // 임의의 공수 포켓몬 선택
    const attacker = activePlayer[Math.floor(Math.random() * activePlayer.length)];
    const defender = activeEnemy[Math.floor(Math.random() * activeEnemy.length)];

    // 기술 난수 선택
    const selectedMoveName = attacker.moves[Math.floor(Math.random() * attacker.moves.length)] || "몸통박치기";
    const moveData = MOVES_DB[selectedMoveName] || { name: selectedMoveName, type: attacker.type1, power: 40, accuracy: 100 };

    // 명중률 판정 ($HitRoll \le Accuracy$)
    const hitRoll = Math.random() * 100;
    if (hitRoll > moveData.accuracy) {
      logEl.innerHTML += `<div class="log-line log-miss">[턴 ${turn}] <b>${attacker.name}</b>의 💥<b>[${moveData.name}]</b> 시도 -> 빗나갔다!</div>`;
    } else {
      // 타입 상성 배율 계산
      const typeMult = (TYPE_CHART[moveData.type] && TYPE_CHART[moveData.type][defender.type1]) || 1.0;
      let damage = Math.max(5, Math.floor((attacker.atk / Math.max(1, defender.def)) * (moveData.power / 4) * typeMult));

      // 호연의 부적 (데미지 +10%)
      if (gameState.pokedex.has(252)) damage = Math.floor(damage * 1.1);

      defender.currentHp = Math.max(0, defender.currentHp - damage);

      let effectMsg = typeMult > 1.0 ? " 🔥 (효과가 굉장했다!)" : (typeMult < 1.0 ? " 🛡️ (효과가 별로다...)" : "");
      logEl.innerHTML += `<div class="log-line">[턴 ${turn}] <b>${attacker.name}</b>의 💥<b>[${moveData.name}]</b>! <b>${defender.name}</b>에게 ${damage} 데미지!${effectMsg}</div>`;
    }

    logEl.scrollTop = logEl.scrollHeight;
    renderBattleArena(playerTeam, enemyTeam);
    turn++;
  }, 1000);
}