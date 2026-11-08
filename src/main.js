/**
 * src/main.js - 게임 초기화 및 전역 이벤트 연결
 */

document.addEventListener('DOMContentLoaded', () => {
  // 상단 재화 바 최신화
  if (typeof updateTopBarUI === 'function') {
    updateTopBarUI();
  }

  // 초기 탭(마을) 강제 활성화 및 건물 렌더링
  if (typeof switchTab === 'function') {
    switchTab('village');
  } else if (typeof refreshVillageUI === 'function') {
    refreshVillageUI();
  }
});