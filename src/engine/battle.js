/**
 * battle.js - 스피드 기반 턴 순서 및 적 포켓몬 반격 AI 배틀 엔진
 */

let isBattling = false;
let battleInterval = null;

/**
 * 승급 배틀 시작 함수
 */
function startBattle() {
  const playerTeam = [...gameState.squad.front, ...gameState.squad.back]
    .filter(p => p !== null && p.currentHp > 0);

  if (playerTeam.length === 0) {
    alert('전투 가능한 포켓몬이 파티에 없습니다! 포켓몬 센터에서 회복하거나 파티를 배치하세요.');
    return;
  }

  isBattling = true;
  document.getElementById('startBattleBtn').disabled = true;
  const logEl = document.getElementById('battleLog');
  logEl.innerHTML = '<div class="log-line log-highlight">⚔️ 랭크 승급 배틀이 시작되었습니다!</div>';

  // 적 관장 파티 생성 (개체값, 스피드, 기술 4종이 부여된 6마리 2열 엔트리)
  const enemyTeam = [
    createPokemonInstance(25, 7),  // 피카츄
    createPokemonInstance(4, 7),   // 파이리
    createPokemonInstance(7, 7),   // 꼬부기
    createPokemonInstance(152, 7), // 치코리타
    createPokemonInstance(155, 7), // 브케인
    createPokemonInstance(158, 7)  // 리아코
  ];

  renderBattleArena(playerTeam, enemyTeam);

  let round = 1;

  battleInterval = setInterval(() => {
    if (!isBattling) {
      clearInterval(battleInterval);
      return;
    }

    // 1. 현재 살아있는 포켓몬 확인
    const activePlayer = playerTeam.filter(p => p.currentHp > 0);
    const activeEnemy = enemyTeam.filter(p => p.currentHp > 0);

    // 2. 승패 검사
    if (activePlayer.length === 0 || activeEnemy.length === 0) {
      endBattle(activePlayer.length > 0, playerTeam, enemyTeam, logEl);
      return;
    }

    logEl.innerHTML += `<div class="log-line log-highlight">--- [ 라운드 ${round} ] ---</div>`;

    // 3. 모든 생존 포켓몬(아군+적군)을 스피드(spd) 내림차순으로 정렬
    const turnQueue = [
      ...activePlayer.map(p => ({ poke: p, isPlayer: true })),
      ...activeEnemy.map(e => ({ poke: e, isPlayer: false }))
    ].sort((a, b) => {
      if (b.poke.spd === a.poke.spd) return Math.random() - 0.5;
      return b.poke.spd - a.poke.spd;
    });

    // 4. 스피드 순서대로 공격 행동 실행
    for (const unit of turnQueue) {
      const attacker = unit.poke;
      const isPlayer = unit.isPlayer;

      // 이전 공격으로 인해 이미 쓰러진 경우 행동 스킵
      if (attacker.currentHp <= 0) continue;

      // 타겟(상대 생존 포켓몬) 무작위 지정
      const targets = isPlayer
        ? enemyTeam.filter(e => e.currentHp > 0)
        : playerTeam.filter(p => p.currentHp > 0);

      if (targets.length === 0) break; // 상대 팀 전멸 시 라운드 중단

      const defender = targets[Math.floor(Math.random() * targets.length)];

      // 사용 기술 선택
      const selectedMoveName = attacker.moves[Math.floor(Math.random() * attacker.moves.length)] || "몸통박치기";
      const moveData = (typeof MOVES_DB !== 'undefined' && MOVES_DB[selectedMoveName]) || {
        name: selectedMoveName, type: attacker.type1, power: 40, accuracy: 100
      };

      const hitRoll = Math.random() * 100;
      const sideTag = isPlayer ? "🟢 [아군]" : "🔴 [적군]";

      if (hitRoll > moveData.accuracy) {
        logEl.innerHTML += `<div class="log-line log-miss">${sideTag} <b>${attacker.name}</b>(Spd ${attacker.spd})의 💥<b>[${moveData.name}]</b> -> 빗나갔다!</div>`;
      } else {
        // 타입 상성 배율 계산
        const typeMult = (typeof TYPE_CHART !== 'undefined' && TYPE_CHART[moveData.type] && TYPE_CHART[moveData.type][defender.type1]) || 1.0;
        let damage = Math.max(5, Math.floor((attacker.atk / Math.max(1, defender.def)) * (moveData.power / 4) * typeMult));

        // 호연의 부적 (아군 데미지 +10% 패시브)
        if (isPlayer && gameState.pokedex.has(252)) {
          damage = Math.floor(damage * 1.1);
        }

        defender.currentHp = Math.max(0, defender.currentHp - damage);

        let effectMsg = typeMult > 1.0 ? " 🔥 (효과가 굉장했다!)" : (typeMult < 1.0 ? " 🛡️ (효과가 별로다...)" : "");
        logEl.innerHTML += `<div class="log-line">${sideTag} <b>${attacker.name}</b>(Spd ${attacker.spd})의 💥<b>[${moveData.name}]</b>! <b>${defender.name}</b>에게 ${damage} 데미지!${effectMsg}</div>`;

        if (defender.currentHp <= 0) {
          logEl.innerHTML += `<div class="log-line" style="color:#e74c3c;">💀 <b>${defender.name}</b>이(가) 쓰러졌습니다!</div>`;
        }
      }
    }

    logEl.scrollTop = logEl.scrollHeight;
    renderBattleArena(playerTeam, enemyTeam);
    round++;
  }, 1200);
}

/**
 * 배틀 종료 및 보상 처리
 */
function endBattle(isPlayerWin, playerTeam, enemyTeam, logEl) {
  if (battleInterval) clearInterval(battleInterval);
  isBattling = false;
  document.getElementById('startBattleBtn').disabled = false;

  if (isPlayerWin) {
    let rewardGold = 250;
    let rewardCandy = 25;

    if (gameState.pokedex.has(1)) rewardGold = Math.floor(rewardGold * 1.2);
    if (gameState.pokedex.has(152)) rewardCandy += 5;
    if (gameState.purchasedCharms && gameState.purchasedCharms.goldBonus) rewardGold = Math.floor(rewardGold * 1.1);
    if (gameState.purchasedCharms && gameState.purchasedCharms.candyBonus) rewardCandy += 5;

    logEl.innerHTML += `<div class="log-line log-highlight">🎉 승리! 승급 P+25, ${rewardGold} Gold, ${rewardCandy} Candy 획득!</div>`;
    gameState.player.gold += rewardGold;
    gameState.player.candy += rewardCandy;
    gameState.player.rankPoints += 25;
  } else {
    logEl.innerHTML += `<div class="log-line" style="color:var(--accent-red);">❌ 패배... 아군 포켓몬이 모두 쓰러졌습니다. 포켓몬 센터에서 치료 후 다시 도전하세요!</div>`;
  }

  renderBattleArena(playerTeam, enemyTeam);
  if (typeof renderUI === 'function') renderUI();
}