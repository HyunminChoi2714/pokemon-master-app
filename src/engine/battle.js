/**
 * battle.js - [다음 턴] 수동 진행 & 배틀 종료 후 포켓몬 센터 자동 치료 엔진
 */

const battleState = {
  active: false,
  round: 1,
  queue: [],
  playerTeam: [],
  enemyTeam: []
};

/**
 * 승급 배틀 시작 함수
 */
function startBattle() {
  // 배틀 전 모든 아군 HP 완치 (자동 준비)
  gameState.inventory.forEach(p => p.currentHp = p.maxHp);

  const playerTeam = [...gameState.squad.front, ...gameState.squad.back]
    .filter(p => p !== null && p.currentHp > 0);

  if (playerTeam.length === 0) {
    alert('전투 가능한 포켓몬이 파티에 없습니다! 파티를 배치해 주세요.');
    return;
  }

  // 적 파티 6마리 생성 (2열 진형)
  const enemyTeam = [
    createPokemonInstance(25, 7),
    createPokemonInstance(4, 7),
    createPokemonInstance(7, 7),
    createPokemonInstance(152, 7),
    createPokemonInstance(155, 7),
    createPokemonInstance(158, 7)
  ];

  battleState.active = true;
  battleState.round = 1;
  battleState.playerTeam = playerTeam;
  battleState.enemyTeam = enemyTeam;
  battleState.queue = [];

  // 버튼 토글
  document.getElementById('startBattleBtn').style.display = 'none';
  document.getElementById('nextTurnBtn').style.display = 'block';

  renderBattleArena(playerTeam, enemyTeam);
  setDialogueText("⚔️ 승급 배틀이 시작되었습니다! <b>'다음 턴 ➡️'</b> 버튼을 눌러 첫 기술을 시전하세요.");
}

/**
 * [다음 턴 ➡️] 버튼 클릭 시 호출되는 함수
 */
function nextTurn() {
  if (!battleState.active) return;

  const activePlayer = battleState.playerTeam.filter(p => p.currentHp > 0);
  const activeEnemy = battleState.enemyTeam.filter(p => p.currentHp > 0);

  // 1. 승패 판정 검사
  if (activePlayer.length === 0 || activeEnemy.length === 0) {
    finishBattle(activePlayer.length > 0);
    return;
  }

  // 2. 현재 라운드 큐가 비어있으면 스피드(spd) 기준으로 큐 재생성
  if (battleState.queue.length === 0) {
    const queueCandidates = [
      ...activePlayer.map(p => ({ poke: p, isPlayer: true })),
      ...activeEnemy.map(e => ({ poke: e, isPlayer: false }))
    ].sort((a, b) => {
      if (b.poke.spd === a.poke.spd) return Math.random() - 0.5;
      return b.poke.spd - a.poke.spd;
    });

    battleState.queue = queueCandidates;
  }

  // 3. 큐에서 가장 빠른 다음 포켓몬 꺼내기
  let nextUnit = battleState.queue.shift();

  // 이미 사망한 포켓몬 스킵
  while (nextUnit && nextUnit.poke.currentHp <= 0 && battleState.queue.length > 0) {
    nextUnit = battleState.queue.shift();
  }

  if (!nextUnit || nextUnit.poke.currentHp <= 0) {
    battleState.round++;
    nextTurn();
    return;
  }

  // 4. 기술 공격 수행
  const attacker = nextUnit.poke;
  const isPlayer = nextUnit.isPlayer;
  const targets = isPlayer
    ? battleState.enemyTeam.filter(e => e.currentHp > 0)
    : battleState.playerTeam.filter(p => p.currentHp > 0);

  if (targets.length === 0) {
    finishBattle(isPlayer);
    return;
  }

  const defender = targets[Math.floor(Math.random() * targets.length)];
  const selectedMoveName = attacker.moves[Math.floor(Math.random() * attacker.moves.length)] || "몸통박치기";
  const moveData = (typeof MOVES_DB !== 'undefined' && MOVES_DB[selectedMoveName]) || {
    name: selectedMoveName, type: attacker.type1, power: 40, accuracy: 100
  };

  const hitRoll = Math.random() * 100;
  const sideTag = isPlayer ? "<span style='color:#2ecc71;'>[아군]</span>" : "<span style='color:#e74c3c;'>[적군]</span>";

  if (hitRoll > moveData.accuracy) {
    setDialogueText(`${sideTag} <b>${attacker.name}</b>의 💥<b>[${moveData.name}]</b> 시도! → 빗나갔습니다!`);
  } else {
    const typeMult = (typeof TYPE_CHART !== 'undefined' && TYPE_CHART[moveData.type] && TYPE_CHART[moveData.type][defender.type1]) || 1.0;
    let damage = Math.max(5, Math.floor((attacker.atk / Math.max(1, defender.def)) * (moveData.power / 4) * typeMult));

    if (isPlayer && gameState.pokedex.has(252)) {
      damage = Math.floor(damage * 1.1);
    }

    defender.currentHp = Math.max(0, defender.currentHp - damage);

    let effectMsg = typeMult > 1.0 ? " 🔥 (효과가 굉장했다!)" : (typeMult < 1.0 ? " 🛡️ (효과가 별로다...)" : "");
    let faintedMsg = defender.currentHp <= 0 ? ` 💀 <b>${defender.name}</b> 쓰러짐!` : '';

    setDialogueText(`${sideTag} <b>${attacker.name}</b>의 💥<b>[${moveData.name}]</b>! <b>${defender.name}</b>에게 <b>${damage}</b> 데미지!${effectMsg}${faintedMsg}`);
  }

  // 실시간 아레나 HP바 감량 연출 갱신
  renderBattleArena(battleState.playerTeam, battleState.enemyTeam);

  // 공격 후 승패 판정 검사
  const postPlayerAlive = battleState.playerTeam.filter(p => p.currentHp > 0).length;
  const postEnemyAlive = battleState.enemyTeam.filter(e => e.currentHp > 0).length;

  if (postPlayerAlive === 0 || postEnemyAlive === 0) {
    document.getElementById('nextTurnBtn').innerText = "결과 확인 🏆";
  } else {
    document.getElementById('nextTurnBtn').innerText = "다음 턴 ➡️";
  }
}

/**
 * 대사 상자 텍스트 설정 함수
 */
function setDialogueText(htmlContent) {
  const dialogueEl = document.getElementById('battleDialogue');
  if (dialogueEl) {
    dialogueEl.innerHTML = htmlContent;
  }
}

/**
 * 배틀 종료 및 자동 완치 처리
 */
function finishBattle(isPlayerWin) {
  battleState.active = false;

  document.getElementById('startBattleBtn').style.display = 'block';
  document.getElementById('startBattleBtn').disabled = false;
  document.getElementById('nextTurnBtn').style.display = 'none';

  // ★ 핵심: 배틀 종료 시 포켓몬 센터 자동 치료 실행
  gameState.inventory.forEach(p => p.currentHp = p.maxHp);

  if (isPlayerWin) {
    let rewardGold = 250;
    let rewardCandy = 25;

    if (gameState.pokedex.has(1)) rewardGold = Math.floor(rewardGold * 1.2);
    if (gameState.pokedex.has(152)) rewardCandy += 5;
    if (gameState.purchasedCharms && gameState.purchasedCharms.goldBonus) rewardGold = Math.floor(rewardGold * 1.1);

    gameState.player.gold += rewardGold;
    gameState.player.candy += rewardCandy;
    gameState.player.rankPoints += 25;

    setDialogueText(`🎉 <b>배틀 승리!</b> P+25, ${rewardGold} Gold, ${rewardCandy} Candy 획득!<br><span style="color:#2ecc71;">🏥 포켓몬 센터에서 모든 포켓몬의 체력이 자동으로 완치되었습니다.</span>`);
  } else {
    setDialogueText(`❌ <b>배틀 패배...</b><br><span style="color:#2ecc71;">🏥 포켓몬 센터에서 쓰러진 모든 포켓몬을 치료하고 완치시켰습니다.</span>`);
  }

  renderBattleArena(battleState.playerTeam, battleState.enemyTeam);
  if (typeof renderUI === 'function') renderUI();
}