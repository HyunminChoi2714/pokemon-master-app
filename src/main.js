/**
 * src/main.js - 게임 초기화 및 전역 연결 메인 스크립트
 */

document.addEventListener('DOMContentLoaded', () => {
  if (typeof updateTopBarUI === 'function') {
    updateTopBarUI();
  }

  if (typeof init2DVillage === 'function') {
    init2DVillage();
  }

  if (typeof switchTab === 'function') {
    switchTab('village');
  }
});