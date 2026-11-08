/**
 * shop.js - 프렌들리숍 상점 아이템 및 특수 부적(Charm) 데이터베이스
 */

// 프렌들리숍 판매 아이템 데이터베이스 (SHOP_ITEMS)
const SHOP_ITEMS = [
  {
    id: "candy_10",
    name: "소형 경험치 사탕 (10개)",
    icon: "🍬",
    desc: "포켓몬 레벨 강화용 사탕 10개",
    cost: 300,
    type: "candy",
    amount: 10
  },
  {
    id: "candy_50",
    name: "대형 경험치 사탕 (50개)",
    icon: "🍬",
    desc: "포켓몬 레벨 강화용 사탕 50개",
    cost: 1300,
    type: "candy",
    amount: 50
  },
  {
    id: "gem_10",
    name: "소형 보석 상자 (10 Gem)",
    icon: "💎",
    desc: "연구소 채용 전용 젬 10개",
    cost: 500,
    type: "gem",
    amount: 10
  },
  {
    id: "gem_50",
    name: "대형 보석 상자 (50 Gem)",
    icon: "💎",
    desc: "연구소 10연속 채용 젬 50개",
    cost: 2200,
    type: "gem",
    amount: 50
  },
  {
    id: "charm_kanto_shop",
    name: "황금의 포켓몬 상징",
    icon: "🔱",
    desc: "보유 시 배틀 골드 획득 +10% 추가 적용",
    cost: 1500,
    type: "charm",
    charmKey: "goldBonus"
  },
  {
    id: "charm_exp_shop",
    name: "행운의 사탕 부적",
    icon: "🍀",
    desc: "보유 시 배틀 승리 사탕 획득 +5개 추가 적용",
    cost: 2000,
    type: "charm",
    charmKey: "candyBonus"
  }
];

/**
 * 상점 아이템 구매 처리 함수
 * @param {string} itemId - 구매할 아이템 ID
 */
function buyShopItem(itemId) {
  const item = SHOP_ITEMS.find(i => i.id === itemId);
  if (!item) return;

  if (gameState.player.gold < item.cost) {
    alert('골드(Gold)가 부족합니다!');
    return;
  }

  gameState.player.gold -= item.cost;

  if (item.type === 'candy') {
    gameState.player.candy += item.amount;
    alert(`🍬 경험치 사탕 ${item.amount}개를 구매했습니다!`);
  } else if (item.type === 'gem') {
    gameState.player.gem += item.amount;
    alert(`💎 보석(Gem) ${item.amount}개를 구매했습니다!`);
  } else if (item.type === 'charm') {
    gameState.purchasedCharms[item.charmKey] = true;
    alert(`✨ ${item.name}을(를) 구매하여 지속 부수 효과가 적용됩니다!`);
  }

  renderUI();
}