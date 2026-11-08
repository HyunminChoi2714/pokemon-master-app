/**
 * src/data/pokemon.js - 외부 CSV 미사용 / 자체 내장 포켓몬 데이터셋 & 진화 구조
 */

// 진화 결과물(2, 3단계 포켓몬) ID 목록 (소환 풀 제외용)
const EVOLUTION_MAP = {
  1: { nextId: 2, minLevel: 16 }, 2: { nextId: 3, minLevel: 32 },  // 이상해씨 -> 이상해풀 -> 이상해꽃
  4: { nextId: 5, minLevel: 16 }, 5: { nextId: 6, minLevel: 36 },  // 파이리 -> 리자드 -> 리자몽
  7: { nextId: 8, minLevel: 16 }, 8: { nextId: 9, minLevel: 36 },  // 꼬부기 -> 어니부기 -> 거북왕
  10: { nextId: 11, minLevel: 7 }, 11: { nextId: 12, minLevel: 10 },// 캐터피 -> 단데기 -> 버터플
  25: { nextId: 26, minLevel: 22 },                                // 피카츄 -> 라이츄
  133: { nextId: 134, minLevel: 25 },                              // 이브이 -> 샤미드
  147: { nextId: 148, minLevel: 30 }, 148: { nextId: 149, minLevel: 55 } // 미뇽 -> 신뇽 -> 망나뇽
};

// 진화된 포켓몬 ID 집합
const EVOLVED_TARGET_IDS = new Set(Object.values(EVOLUTION_MAP).map(item => item.nextId));

// 💡 100% 로컬 내장 포켓몬 데이터베이스 (기본 단계 및 주요 포켓몬 세트)
const POKEMON_DB = [
  // 1세대 스타팅 & 기본 포켓몬
  { id: 1, name: "이상해씨", type1: "풀", type2: "독", stage: 1, isBaseStage: true, hp: 45, atk: 49, def: 49, spAtk: 65, spDef: 65, spd: 45 },
  { id: 2, name: "이상해풀", type1: "풀", type2: "독", stage: 2, isBaseStage: false, hp: 60, atk: 62, def: 63, spAtk: 80, spDef: 80, spd: 60 },
  { id: 3, name: "이상해꽃", type1: "풀", type2: "독", stage: 3, isBaseStage: false, hp: 80, atk: 82, def: 83, spAtk: 100, spDef: 100, spd: 80 },
  { id: 4, name: "파이리", type1: "불꽃", type2: null, stage: 1, isBaseStage: true, hp: 39, atk: 52, def: 43, spAtk: 60, spDef: 50, spd: 65 },
  { id: 5, name: "리자드", type1: "불꽃", type2: null, stage: 2, isBaseStage: false, hp: 58, atk: 64, def: 58, spAtk: 80, spDef: 65, spd: 80 },
  { id: 6, name: "리자몽", type1: "불꽃", type2: "비행", stage: 3, isBaseStage: false, hp: 78, atk: 84, def: 78, spAtk: 109, spDef: 85, spd: 100 },
  { id: 7, name: "꼬부기", type1: "물", type2: null, stage: 1, isBaseStage: true, hp: 44, atk: 48, def: 65, spAtk: 50, spDef: 64, spd: 43 },
  { id: 8, name: "어니부기", type1: "물", type2: null, stage: 2, isBaseStage: false, hp: 59, atk: 63, def: 80, spAtk: 65, spDef: 80, spd: 58 },
  { id: 9, name: "거북왕", type1: "물", type2: null, stage: 3, isBaseStage: false, hp: 79, atk: 83, def: 100, spAtk: 85, spDef: 105, spd: 78 },
  { id: 10, name: "캐터피", type1: "벌레", type2: null, stage: 1, isBaseStage: true, hp: 45, atk: 30, def: 35, spAtk: 20, spDef: 20, spd: 45 },
  { id: 25, name: "피카츄", type1: "전기", type2: null, stage: 1, isBaseStage: true, hp: 35, atk: 55, def: 40, spAtk: 50, spDef: 50, spd: 90 },
  { id: 39, name: "푸린", type1: "노말", type2: "페어리", stage: 1, isBaseStage: true, hp: 115, atk: 45, def: 20, spAtk: 45, spDef: 25, spd: 20 },
  { id: 52, name: "나옹", type1: "노말", type2: null, stage: 1, isBaseStage: true, hp: 40, atk: 45, def: 35, spAtk: 40, spDef: 40, spd: 90 },
  { id: 54, name: "고라파덕", type1: "물", type2: null, stage: 1, isBaseStage: true, hp: 50, atk: 52, def: 48, spAtk: 65, spDef: 50, spd: 55 },
  { id: 129, name: "잉어킹", type1: "물", type2: null, stage: 1, isBaseStage: true, hp: 20, atk: 10, def: 55, spAtk: 15, spDef: 20, spd: 80 },
  { id: 133, name: "이브이", type1: "노말", type2: null, stage: 1, isBaseStage: true, hp: 55, atk: 55, def: 50, spAtk: 45, spDef: 65, spd: 55 },
  { id: 143, name: "잠만보", type1: "노말", type2: null, stage: 1, isBaseStage: true, hp: 160, atk: 110, def: 65, spAtk: 65, spDef: 110, spd: 30 },
  { id: 147, name: "미뇽", type1: "드래곤", type2: null, stage: 1, isBaseStage: true, hp: 41, atk: 64, def: 45, spAtk: 50, spDef: 50, spd: 50 },

  // 2세대 스타팅
  { id: 152, name: "치코리타", type1: "풀", type2: null, stage: 1, isBaseStage: true, hp: 45, atk: 49, def: 65, spAtk: 49, spDef: 65, spd: 45 },
  { id: 155, name: "브케인", type1: "불꽃", type2: null, stage: 1, isBaseStage: true, hp: 39, atk: 52, def: 43, spAtk: 60, spDef: 50, spd: 65 },
  { id: 158, name: "리아코", type1: "물", type2: null, stage: 1, isBaseStage: true, hp: 50, atk: 65, def: 64, spAtk: 44, spDef: 48, spd: 43 },

  // 3~9세대 주요 기본 포켓몬
  { id: 252, name: "나무지기", type1: "풀", type2: null, stage: 1, isBaseStage: true, hp: 40, atk: 45, def: 35, spAtk: 65, spDef: 55, spd: 70 },
  { id: 255, name: "아차모", type1: "불꽃", type2: null, stage: 1, isBaseStage: true, hp: 45, atk: 60, def: 40, spAtk: 70, spDef: 50, spd: 45 },
  { id: 258, name: "물짱이", type1: "물", type2: null, stage: 1, isBaseStage: true, hp: 50, atk: 70, def: 50, spAtk: 50, spDef: 50, spd: 40 },
  { id: 387, name: "모부기", type1: "풀", type2: null, stage: 1, isBaseStage: true, hp: 55, atk: 68, def: 64, spAtk: 45, spDef: 55, spd: 31 },
  { id: 390, name: "불꽃숭이", type1: "불꽃", type2: null, stage: 1, isBaseStage: true, hp: 44, atk: 58, def: 44, spAtk: 58, spDef: 44, spd: 61 },
  { id: 393, name: "팽도리", type1: "물", type2: null, stage: 1, isBaseStage: true, hp: 53, atk: 51, def: 53, spAtk: 61, spDef: 56, spd: 40 },
  { id: 443, name: "딥상어동", type1: "드래곤", type2: "땅", stage: 1, isBaseStage: true, hp: 58, atk: 70, def: 45, spAtk: 40, spDef: 45, spd: 42 },
  { id: 722, name: "나몰빼미", type1: "풀", type2: "비행", stage: 1, isBaseStage: true, hp: 68, atk: 55, def: 55, spAtk: 50, spDef: 50, spd: 42 },
  { id: 810, name: "흥나숭", type1: "풀", type2: null, stage: 1, isBaseStage: true, hp: 50, atk: 64, def: 50, spAtk: 40, spDef: 40, spd: 65 },
  { id: 906, name: "나오하", type1: "풀", type2: null, stage: 1, isBaseStage: true, hp: 40, atk: 61, def: 54, spAtk: 45, spDef: 45, spd: 65 }
].map(p => ({
  ...p,
  img: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`
}));

/**
 * 데이터베이스 초기화 함수 (비동기 fetch 없이 동기식 동기화 처리)
 */
function loadPokemonDatabase() {
  console.log(`✅ ${POKEMON_DB.length}마리 기본 내장 포켓몬 데이터 준비 완료!`);
  return Promise.resolve();
}

// 전역 스코프 등록
window.POKEMON_DB = POKEMON_DB;
window.EVOLUTION_MAP = EVOLUTION_MAP;
window.loadPokemonDatabase = loadPokemonDatabase;