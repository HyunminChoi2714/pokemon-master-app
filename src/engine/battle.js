/**
 * battle.js - 1턴 = 필드의 모든 포켓몬 스피드 순 1회 행동 턴 엔진
 */

const battleState = {
  active: false,
  isProcessing: false,
  round: 1,
  playerTeam: [],
  enemyTeam: []
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 승급 배틀 시작 함수
 */
/**
 * 승급 배틀 시작 함수 (랭크별 적 난이도 조정)
 */
function startBattle() {
  // 포켓몬 센터 자동 치료
  gameState.inventory.forEach(p => p.currentHp = p.maxHp);

  const playerTeam = [...gameState.squad.front, ...gameState.squad.back]
    .filter(p => p !== null && p.currentHp > 0);

  if (playerTeam.length === 0) {
    alert('전투 가능한 포켓몬이 파티에 없습니다!');
    return;
  }

  // 랭크별 적 관장 파티 인원 및 레벨 밸런스 조정
  let enemyTeam = [];
  const currentRank = gameState.player.rank || "Z";

  if (currentRank === "Z") {
    // 💡 Z-랭크 초반 난이도 완치: Lv.5 관장 포켓몬 2마리 배치 (피카츄, 꼬부기)
    enemyTeam = [
      createPokemonInstance(25, 5), // 피카츄 (Lv.5)
      createPokemonInstance(7, 5)   // 꼬부기 (Lv.5)
    ];
  } else if (currentRank === "Y") {
    // Y-랭크: 3마리 배치 (Lv.8)
    enemyTeam = [
      createPokemonInstance(25, 8),
      createPokemonInstance(4, 8),
      createPokemonInstance(7, 8)
    ];
  } else {
    // 상위 랭크: 6마리 풀 엔트리 (Lv.12 이상)
    enemyTeam = [
      createPokemonInstance(25, 12),
      createPokemonInstance(4, 12),
      createPokemonInstance(7, 12),
      createPokemonInstance(152, 12),
      createPokemonInstance(155, 12),
      createPokemonInstance(158, 12)
    ];
  }

  battleState.active = true;
  battleState.isProcessing = false;
  battleState.round = 1;
  battleState.playerTeam = playerTeam;
  battleState.enemyTeam = enemyTeam;

  document.getElementById('startBattleBtn').style.display = 'none';
  const nextBtn = document.getElementById('nextTurnBtn');
  nextBtn.style.display = 'block';
  nextBtn.disabled = false;
  nextBtn.innerText = `다음 턴 (${battleState.round}턴) ➡️`;

  renderBattleArena(playerTeam, enemyTeam);
  setDialogueText("⚔️ Z-랭크 관장 도전 배틀이 시작되었습니다! (적 관장 2마리 대면)");
}

/**
 * [다음 턴 ➡️] 클릭 시: 필드의 모든 생존 포켓몬이 스피드 순서대로 1회씩 공격
 */
async function nextTurn() {
  if (!battleState.active || battleState.isProcessing) return;

  const activePlayer = battleState.playerTeam.filter(p => p.currentHp > 0);
  const activeEnemy = battleState.enemyTeam.filter(e => e.currentHp > 0);

  if (activePlayer.length === 0 || activeEnemy.length === 0) {
    finishBattle(activePlayer.length > 0);
    return;
  }

  battleState.isProcessing = true;
  const nextBtn = document.getElementById('nextTurnBtn');
  if (nextBtn) {
    nextBtn.disabled = true;
    nextBtn.innerText = `⏳ 제 ${battleState.round}턴 진행 중...`;
  }

  // 살아있는 모든 포켓몬을 스피드(spd) 내림차순 정렬
  const turnQueue = [
    ...activePlayer.map(p => ({ poke: p, isPlayer: true })),
    ...activeEnemy.map(e => ({ poke: e, isPlayer: false }))
  ].sort((a, b) => {
    if (b.poke.spd === a.poke.spd) return Math.random() - 0.5;
    return b.poke.spd - a.poke.spd;
  });

  setDialogueText(`⚔️ <b>[제 ${battleState.round}턴 시작]</b> 모든 포켓몬이 스피드 순서대로 행동을 시작합니다.`);
  await sleep(700);

  for (let i = 0; i < turnQueue.length; i++) {
    const unit = turnQueue[i];
    const attacker = unit.poke;
    const isPlayer = unit.isPlayer;

    // 공격 직전 이미 사망한 포켓몬 스킵
    if (attacker.currentHp <= 0) continue;

    const targets = isPlayer
      ? battleState.enemyTeam.filter(e => e.currentHp > 0)
      : battleState.playerTeam.filter(p => p.currentHp > 0);

    if (targets.length === 0) break;

    const defender = targets[Math.floor(Math.random() * targets.length)];
    const selectedMoveName = attacker.moves[Math.floor(Math.random() * attacker.moves.length)] || "몸통박치기";
    const moveData = (typeof MOVES_DB !== 'undefined' && MOVES_DB[selectedMoveName]) || {
      name: selectedMoveName, type: attacker.type1, power: 40, accuracy: 100
    };

    const hitRoll = Math.random() * 100;
    const sideTag = isPlayer ? "<span style='color:#2ecc71;'>[아군]</span>" : "<span style='color:#e74c3c;'>[적군]</span>";

    if (hitRoll > moveData.accuracy) {
      setDialogueText(`${sideTag} <b>${attacker.name}</b>(Spd ${attacker.spd})의 💥<b>[${moveData.name}]</b>! → 빗나갔습니다!`);
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

    // 전장 실시간 HP 및 상태 업데이트
    renderBattleArena(battleState.playerTeam, battleState.enemyTeam);
    await sleep(900);

    // 승패 중간 판정
    const curPlayerAlive = battleState.playerTeam.filter(p => p.currentHp > 0).length;
    const curEnemyAlive = battleState.enemyTeam.filter(e => e.currentHp > 0).length;

    if (curPlayerAlive === 0 || curEnemyAlive === 0) {
      finishBattle(curPlayerAlive > 0);
      battleState.isProcessing = false;
      return;
    }
  }

  // 1턴(전원 행동) 종료 후
  battleState.round++;
  battleState.isProcessing = false;

  if (nextBtn) {
    nextBtn.disabled = false;
    nextBtn.innerText = `다음 턴 (${battleState.round}턴) ➡️`;
  }

  setDialogueText(`✅ <b>[제 ${battleState.round - 1}턴 완료]</b> 모든 포켓몬이 행동을 마쳤습니다. 다음 턴을 시작하려면 버튼을 누르세요.`);
}

function setDialogueText(htmlContent) {
  const dialogueEl = document.getElementById('battleDialogue');
  if (dialogueEl) {
    dialogueEl.innerHTML = htmlContent;
  }
}

function finishBattle(isPlayerWin) {
  battleState.active = false;
  battleState.isProcessing = false;

  document.getElementById('startBattleBtn').style.display = 'block';
  document.getElementById('startBattleBtn').disabled = false;
  document.getElementById('nextTurnBtn').style.display = 'none';

  // 배틀 종료 시 완치
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

    setDialogueText(`🎉 <b>배틀 승리!</b> 승급 P+25, ${rewardGold} Gold, ${rewardCandy} Candy 획득!<br><span style="color:#2ecc71;">🏥 포켓몬 센터에서 모든 포켓몬의 체력이 완치되었습니다.</span>`);
  } else {
    setDialogueText(`❌ <b>배틀 패배...</b><br><span style="color:#2ecc71;">🏥 포켓몬 센터에서 쓰러진 포켓몬을 완전히 치료했습니다. 다시 도전하세요!</span>`);
  }

  renderBattleArena(battleState.playerTeam, battleState.enemyTeam);
  if (typeof renderUI === 'function') renderUI();
}