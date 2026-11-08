/**
 * src/main.js - 앱 진입점
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 데이터셋 초기화
  if (typeof loadPokemonDatabase === 'function') {
    await loadPokemonDatabase();
  }
  
  // 상단 바 및 기본 마을 화면 렌더링
  if (typeof updateTopBarUI === 'function') updateTopBarUI();
  if (typeof switchTab === 'function') switchTab('village');
  
  console.log("🎮 포켓몬 게임 시스템 초기화 완료!");
});