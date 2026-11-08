/**
 * src/main.js - 게임 진입점 및 초기 실행
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. CSV 데이터베이스 로드
  await loadPokemonDatabase();
  
  // 2. 상단 재화 및 프로필 바 렌더링
  updateTopBarUI();
  
  // 3. 메인 탭(마을)로 기본 설정
  switchTab('village');
  
  console.log("🎮 포켓몬 게임 초기화 완료!");
});