/**
 * pokemon.js - 포켓몬 기본 능률 도감, 진화 트리, 상성표, 지방 패시브 정의
 */

// 포켓몬 마스터 도감 데이터베이스 (POKEMON_DB)
const POKEMON_DB = [
  // 1세대
  { id: 1, name: "이상해씨", type1: "풀", type2: "독", hp: 45, atk: 49, def: 49, spAtk: 65, spDef: 65, spd: 45, stage: 1, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png" },
  { id: 2, name: "이상해풀", type1: "풀", type2: "독", hp: 60, atk: 62, def: 63, spAtk: 80, spDef: 80, spd: 60, stage: 2, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/2.png" },
  { id: 3, name: "이상해꽃", type1: "풀", type2: "독", hp: 80, atk: 82, def: 83, spAtk: 100, spDef: 100, spd: 80, stage: 3, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/3.png" },
  { id: 4, name: "파이리", type1: "불꽃", type2: null, hp: 39, atk: 52, def: 43, spAtk: 60, spDef: 50, spd: 65, stage: 1, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png" },
  { id: 5, name: "리자드", type1: "불꽃", type2: null, hp: 58, atk: 64, def: 58, spAtk: 80, spDef: 65, spd: 80, stage: 2, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/5.png" },
  { id: 6, name: "리자몽", type1: "불꽃", type2: "비행", hp: 78, atk: 84, def: 78, spAtk: 109, spDef: 85, spd: 100, stage: 3, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png" },
  { id: 7, name: "꼬부기", type1: "물", type2: null, hp: 44, atk: 48, def: 65, spAtk: 50, spDef: 64, spd: 43, stage: 1, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/7.png" },
  { id: 8, name: "어니부기", type1: "물", type2: null, hp: 59, atk: 63, def: 80, spAtk: 65, spDef: 80, spd: 58, stage: 2, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/8.png" },
  { id: 9, name: "거북왕", type1: "물", type2: null, hp: 79, atk: 83, def: 100, spAtk: 85, spDef: 105, spd: 78, stage: 3, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/9.png" },
  { id: 25, name: "피카츄", type1: "전기", type2: null, hp: 35, atk: 55, def: 40, spAtk: 50, spDef: 50, spd: 90, stage: 1, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png" },

  // 2세대
  { id: 152, name: "치코리타", type1: "풀", type2: null, hp: 45, atk: 49, def: 65, spAtk: 49, spDef: 65, spd: 45, stage: 1, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/152.png" },
  { id: 155, name: "브케인", type1: "불꽃", type2: null, hp: 39, atk: 52, def: 43, spAtk: 60, spDef: 50, spd: 65, stage: 1, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/155.png" },
  { id: 158, name: "리아코", type1: "물", type2: null, hp: 50, atk: 65, def: 64, spAtk: 44, spDef: 48, spd: 43, stage: 1, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/158.png" },

  // 3세대
  { id: 252, name: "나무지기", type1: "풀", type2: null, hp: 40, atk: 45, def: 35, spAtk: 65, spDef: 55, spd: 70, stage: 1, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/252.png" },
  { id: 255, name: "아차모", type1: "불꽃", type2: null, hp: 45, atk: 60, def: 40, spAtk: 70, spDef: 50, spd: 45, stage: 1, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/255.png" },
  { id: 258, name: "물짱이", type1: "물", type2: null, hp: 50, atk: 70, def: 50, spAtk: 50, spDef: 50, spd: 40, stage: 1, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/258.png" },

  // 4세대
  { id: 387, name: "모부기", type1: "풀", type2: null, hp: 55, atk: 68, def: 64, spAtk: 45, spDef: 55, spd: 31, stage: 1, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/387.png" },
  { id: 390, name: "불꽃숭이", type1: "불꽃", type2: null, hp: 44, atk: 58, def: 44, spAtk: 58, spDef: 44, spd: 61, stage: 1, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/390.png" },
  { id: 393, name: "팽도리", type1: "물", type2: null, hp: 53, atk: 51, def: 53, spAtk: 61, spDef: 56, spd: 40, stage: 1, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/393.png" },

  // 6세대 & 9세대
  { id: 658, name: "개굴닌자", type1: "물", type2: "악", hp: 72, atk: 95, def: 67, spAtk: 103, spDef: 71, spd: 122, stage: 3, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/658.png" },
  { id: 906, name: "나오하", type1: "풀", type2: null, hp: 40, atk: 61, def: 54, spAtk: 45, spDef: 45, spd: 65, stage: 1, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/906.png" },
  { id: 909, name: "뜨아거", type1: "불꽃", type2: null, hp: 67, atk: 45, def: 59, spAtk: 63, spDef: 40, spd: 36, stage: 1, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/909.png" },
  { id: 912, name: "꾸꾸아", type1: "물", type2: null, hp: 55, atk: 65, def: 45, spAtk: 50, spDef: 45, spd: 50, stage: 1, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/912.png" }
];

// 포켓몬 진화 트리 지도 (EVOLUTION_MAP)
const EVOLUTION_MAP = {
  1: { nextId: 2, minLevel: 10 },
  2: { nextId: 3, minLevel: 20 },
  4: { nextId: 5, minLevel: 10 },
  5: { nextId: 6, minLevel: 20 },
  7: { nextId: 8, minLevel: 10 },
  8: { nextId: 9, minLevel: 20 }
};

// 속성 상성 배율표 (TYPE_CHART)
const TYPE_CHART = {
  "불꽃": { "풀": 2.0, "물": 0.5, "불꽃": 0.5, "땅": 1.0 },
  "물": { "불꽃": 2.0, "풀": 0.5, "물": 0.5, "땅": 2.0 },
  "풀": { "물": 2.0, "불꽃": 0.5, "풀": 0.5, "땅": 2.0 },
  "전기": { "물": 2.0, "전기": 0.5, "풀": 0.5, "땅": 0.0 },
  "땅": { "불꽃": 2.0, "전기": 2.0, "풀": 0.5 }
};

// 9개 지방별 도감 부수 효과 정의 (REGION_DEFINITIONS)
const REGION_DEFINITIONS = [
  { name: "관동 지방", gen: 1, minId: 1, maxId: 151, effectName: "관동의 부적", effectDesc: "전투 획득 골드 +20%" },
  { name: "성도 지방", gen: 2, minId: 152, maxId: 251, effectName: "성도의 부적", effectDesc: "전투 획득 사탕 +25%" },
  { name: "호연 지방", gen: 3, minId: 252, maxId: 386, effectName: "호연의 부적", effectDesc: "파티 전체 데미지 +10%" },
  { name: "신오 지방", gen: 4, minId: 387, maxId: 493, effectName: "신오의 부적", effectDesc: "파티 방어력 +15%" },
  { name: "하나 지방", gen: 5, minId: 494, maxId: 649, effectName: "하나의 부적", effectDesc: "기술 명중률 +5%" },
  { name: "칼로스 지방", gen: 6, minId: 650, maxId: 721, effectName: "칼로스의 부적", effectDesc: "채용 젬 소모 -10%" },
  { name: "알롤라 지방", gen: 7, minId: 722, maxId: 809, effectName: "알롤라의 부적", effectDesc: "스타팅 스탯 +5%" },
  { name: "가라르 지방", gen: 8, minId: 810, maxId: 905, effectName: "가라르의 부적", effectDesc: "전투 승급 포인트 +5P" },
  { name: "팔데아 지방", gen: 9, minId: 906, maxId: 1025, effectName: "팔데아의 부적", effectDesc: "파티 크리티컬 확률 +10%" }
];