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

// 본가 포켓몬 레벨 스탯을 반영한 진화 데이터베이스 (EVOLUTION_MAP)
const EVOLUTION_MAP = {
  // --- 1세대 관동 스타팅 ---
  1: { nextId: 2, minLevel: 16 },   // 이상해씨 -> 이상해풀
  2: { nextId: 3, minLevel: 32 },   // 이상해풀 -> 이상해꽃
  4: { nextId: 5, minLevel: 16 },   // 파이리 -> 리자드
  5: { nextId: 6, minLevel: 36 },   // 리자드 -> 리자몽
  7: { nextId: 8, minLevel: 16 },   // 꼬부기 -> 어니부기
  8: { nextId: 9, minLevel: 36 },   // 어니부기 -> 거북왕

  // --- 초반 벌레/새 포켓몬 (빠른 진화) ---
  10: { nextId: 11, minLevel: 7 },  // 캐터피 -> 단데기
  11: { nextId: 12, minLevel: 10 }, // 단데기 -> 버터플
  13: { nextId: 14, minLevel: 7 },  // 뿔충이 -> 딱충이
  14: { nextId: 15, minLevel: 10 }, // 딱충이 -> 독침붕
  16: { nextId: 17, minLevel: 18 }, // 구구 -> 피전트
  17: { nextId: 18, minLevel: 36 }, // 피전트 -> 피전투

  // --- 일반 2단계 진화계 ---
  19: { nextId: 20, minLevel: 20 }, // 꼬렛 -> 레트라
  21: { nextId: 22, minLevel: 20 }, // 깨비참 -> 깨비드릴조
  23: { nextId: 24, minLevel: 22 }, // 아보 -> 아보크
  27: { nextId: 28, minLevel: 22 }, // 모래두지 -> 고지
  29: { nextId: 30, minLevel: 16 }, // 니드런♀ -> 니드리나
  32: { nextId: 33, minLevel: 16 }, // 니드런♂ -> 니드리노
  41: { nextId: 42, minLevel: 22 }, // 주뱃 -> 골뱃
  43: { nextId: 44, minLevel: 21 }, // 뚜벅쵸 -> 냄새꼬
  46: { nextId: 47, minLevel: 24 }, // 파라스 -> 파라섹트
  48: { nextId: 49, minLevel: 31 }, // 콘팡 -> 도나리
  50: { nextId: 51, minLevel: 26 }, // 디그다 -> 닥트리오
  52: { nextId: 53, minLevel: 28 }, // 나옹 -> 페르시온
  54: { nextId: 55, minLevel: 33 }, // 고라파덕 -> 골덕
  56: { nextId: 57, minLevel: 28 }, // 망키 -> 성원숭
  60: { nextId: 61, minLevel: 25 }, // 올챙이 -> 수륙챙이
  63: { nextId: 64, minLevel: 16 }, // 캐이시 -> 윤겔라
  66: { nextId: 67, minLevel: 28 }, // 알통몬 -> 근육몬
  69: { nextId: 70, minLevel: 21 }, // 모다피 -> 우츠동
  72: { nextId: 73, minLevel: 30 }, // 왕눈해 -> 독파리
  74: { nextId: 75, minLevel: 25 }, // 꼬마돌 -> 데구리
  77: { nextId: 78, minLevel: 40 }, // 포니타 -> 날쌩마
  79: { nextId: 80, minLevel: 37 }, // 야돈 -> 야도란
  81: { nextId: 82, minLevel: 30 }, // 코일 -> 레어코일
  84: { nextId: 85, minLevel: 31 }, // 두두 -> 두트리오
  86: { nextId: 87, minLevel: 34 }, // 쥬쥬 -> 쥬레곤
  88: { nextId: 89, minLevel: 38 }, // 질퍽이 -> 질뻐기
  92: { nextId: 93, minLevel: 25 }, // 고스통 -> 고스트
  96: { nextId: 97, minLevel: 26 }, // 슬리프 -> 슬리퍼
  98: { nextId: 99, minLevel: 28 }, // 크랩 -> 킹크랩
  100: { nextId: 101, minLevel: 30 },// 찌리리공 -> 붐볼
  104: { nextId: 105, minLevel: 28 },// 탕구리 -> 텅구리
  109: { nextId: 110, minLevel: 35 },// 또가스 -> 또도가스
  111: { nextId: 112, minLevel: 42 },// 뿔카노 -> 코뿌리
  116: { nextId: 117, minLevel: 32 },// 쏘드라 -> 시드라
  118: { nextId: 119, minLevel: 33 },// 콘치 -> 왕콘치
  129: { nextId: 130, minLevel: 20 },// 잉어킹 -> 갸라도스
  138: { nextId: 139, minLevel: 40 },// 암나이트 -> 암스타
  140: { nextId: 141, minLevel: 40 },// 투구 -> 투구푸스

  // --- 드래곤/전설 계열 ---
  147: { nextId: 148, minLevel: 30 },// 미뇽 -> 신뇽
  148: { nextId: 149, minLevel: 55 },// 신뇽 -> 망나뇽
  246: { nextId: 247, minLevel: 30 },// 애버라스 -> 데기라스
  247: { nextId: 248, minLevel: 55 },// 데기라스 -> 마기라스
  371: { nextId: 372, minLevel: 30 },// 아공이 -> 쉘곤
  372: { nextId: 373, minLevel: 50 },// 쉘곤 -> 보만다
  374: { nextId: 375, minLevel: 20 },// 메탕 -> 메탕구
  375: { nextId: 376, minLevel: 45 },// 메탕구 -> 메타그로스

  // --- 2세대~9세대 스타팅 ---
  152: { nextId: 153, minLevel: 16 }, 153: { nextId: 154, minLevel: 32 }, // 치코리타
  155: { nextId: 156, minLevel: 14 }, 156: { nextId: 157, minLevel: 36 }, // 브케인
  158: { nextId: 159, minLevel: 18 }, 159: { nextId: 160, minLevel: 30 }, // 리아코
  252: { nextId: 253, minLevel: 16 }, 253: { nextId: 254, minLevel: 36 }, // 나무지기
  255: { nextId: 256, minLevel: 16 }, 256: { nextId: 257, minLevel: 36 }, // 아차모
  258: { nextId: 259, minLevel: 16 }, 259: { nextId: 260, minLevel: 36 }, // 물짱이
  387: { nextId: 388, minLevel: 18 }, 388: { nextId: 389, minLevel: 32 }, // 모부기
  390: { nextId: 391, minLevel: 14 }, 391: { nextId: 392, minLevel: 36 }, // 불꽃숭이
  393: { nextId: 394, minLevel: 16 }, 394: { nextId: 395, minLevel: 36 }, // 팽도리
  495: { nextId: 496, minLevel: 17 }, 496: { nextId: 497, minLevel: 36 }, // 주리비얀
  498: { nextId: 499, minLevel: 17 }, 499: { nextId: 500, minLevel: 36 }, // 뚜꾸리
  501: { nextId: 502, minLevel: 17 }, 502: { nextId: 503, minLevel: 36 }, // 수쟁이
  650: { nextId: 651, minLevel: 16 }, 651: { nextId: 652, minLevel: 36 }, // 도치마론
  653: { nextId: 654, minLevel: 16 }, 654: { nextId: 655, minLevel: 36 }, // 푸호꼬
  656: { nextId: 657, minLevel: 16 }, 657: { nextId: 658, minLevel: 36 }, // 개구마르
  722: { nextId: 723, minLevel: 17 }, 723: { nextId: 724, minLevel: 34 }, // 나몰빼미
  725: { nextId: 726, minLevel: 17 }, 726: { nextId: 727, minLevel: 34 }, // 냐오불
  728: { nextId: 729, minLevel: 17 }, 729: { nextId: 730, minLevel: 34 }, // 누리공
  810: { nextId: 811, minLevel: 16 }, 811: { nextId: 812, minLevel: 35 }, // 흥나숭
  813: { nextId: 814, minLevel: 16 }, 814: { nextId: 815, minLevel: 35 }, // 염버니
  816: { nextId: 817, minLevel: 16 }, 817: { nextId: 818, minLevel: 35 }, // 울머기
  906: { nextId: 907, minLevel: 16 }, 907: { nextId: 908, minLevel: 36 }, // 나오하
  909: { nextId: 910, minLevel: 16 }, 910: { nextId: 911, minLevel: 36 }, // 뜨아거
  912: { nextId: 913, minLevel: 16 }, 913: { nextId: 914, minLevel: 36 }  // 꾸왁스
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