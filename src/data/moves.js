/**
 * moves.js - 기술(Moves) 데이터베이스 및 포켓몬별 레벨업 습득(Learnset) 정보
 */

// 기술 마스터 데이터베이스 (타입, 분류, 위력, 명중률, PP, 부가효과)
const MOVES_DB = {
  // 노말 타입
  "몸통박치기": { name: "몸통박치기", type: "노말", category: "물리", power: 40, accuracy: 100, pp: 35, effect: "상대에게 부딪쳐 공격한다." },
  "울음소리": { name: "울음소리", type: "노말", category: "변화", power: 0, accuracy: 100, pp: 40, effect: "상대의 공격력을 떨어뜨린다." },
  "할퀴기": { name: "할퀴기", type: "노말", category: "물리", power: 40, accuracy: 100, pp: 35, effect: "손톱으로 상대를 할퀴어 공격한다." },
  "전광석화": { name: "전광석화", type: "노말", category: "물리", power: 40, accuracy: 100, pp: 30, effect: "빠른 스피드로 선공한다." },
  "연막": { name: "연막", type: "노말", category: "변화", power: 0, accuracy: 100, pp: 20, effect: "상대의 명중률을 낮춘다." },

  // 풀 타입
  "덩굴채찍": { name: "덩굴채찍", type: "풀", category: "물리", power: 45, accuracy: 100, pp: 25, effect: "채찍 덩굴로 상대를 쳐서 공격한다." },
  "잎날가르기": { name: "잎날가르기", type: "풀", category: "물리", power: 55, accuracy: 95, pp: 25, effect: "날카로운 잎사귀로 공격하며 급소율이 높다." },
  "씨뿌리기": { name: "씨뿌리기", type: "풀", category: "변화", power: 0, accuracy: 90, pp: 10, effect: "매 턴 상대의 HP를 흡수한다." },
  "솔라빔": { name: "솔라빔", type: "풀", category: "특수", power: 120, accuracy: 100, pp: 10, effect: "강력한 빛 에너지를 모아 발사한다." },
  "기가드레인": { name: "기가드레인", type: "풀", category: "특수", power: 75, accuracy: 100, pp: 10, effect: "주어진 데미지의 절반만큼 HP를 회복한다." },
  "리프스톰": { name: "리프스톰", type: "풀", category: "특수", power: 130, accuracy: 90, pp: 5, effect: "시전 후 자신의 특공이 2단계 감소한다." },
  "리프블레이드": { name: "리프블레이드", type: "풀", category: "물리", power: 90, accuracy: 100, pp: 15, effect: "급소에 맞기 쉽다." },
  "우드해머": { name: "우드해머", type: "풀", category: "물리", power: 120, accuracy: 100, pp: 15, effect: "강력한 반동 데미지를 입는다." },
  "플라워트릭": { name: "플라워트릭", type: "풀", category: "물리", power: 70, accuracy: 100, pp: 20, effect: "반드시 급소에 맞으며 100% 명중한다." },

  // 불꽃 타입
  "불꽃세례": { name: "불꽃세례", type: "불꽃", category: "특수", power: 40, accuracy: 100, pp: 25, effect: "10% 확률로 화상 상태에 빠뜨린다." },
  "화염자동차": { name: "화염자동차", type: "불꽃", category: "물리", power: 60, accuracy: 100, pp: 20, effect: "10% 확률로 화상 상태에 빠뜨린다." },
  "화염방사": { name: "화염방사", type: "불꽃", category: "특수", power: 90, accuracy: 100, pp: 15, effect: "거센 불꽃으로 공격하며 10% 확률로 화상." },
  "불대문자": { name: "불대문자", type: "불꽃", category: "특수", power: 110, accuracy: 85, pp: 5, effect: "대문자 모양의 거대한 불꽃으로 공격한다." },
  "플레어드라이브": { name: "플레어드라이브", type: "불꽃", category: "물리", power: 120, accuracy: 100, pp: 15, effect: "반동 데미지를 입으며 10% 확률로 화상." },
  "플레어송": { name: "플레어송", type: "불꽃", category: "특수", power: 80, accuracy: 100, pp: 10, effect: "100% 확률로 자신의 특공이 1단계 상승한다." },

  // 물 타입
  "물대포": { name: "물대포", type: "물", category: "특수", power: 40, accuracy: 100, pp: 25, effect: "세찬 물기를 뿜어 공격한다." },
  "껍질에숨기": { name: "껍질에숨기", type: "물", category: "변화", power: 0, accuracy: 100, pp: 40, effect: "자신의 방어력을 1단계 올린다." },
  "물경포": { name: "물경포", type: "물", category: "특수", power: 60, accuracy: 100, pp: 20, effect: "20% 확률로 상대를 혼란 상태로 만든다." },
  "파도타기": { name: "파도타기", type: "물", category: "특수", power: 90, accuracy: 100, pp: 15, effect: "거대한 파도로 적 전체를 공격한다." },
  "하이드로펌프": { name: "하이드로펌프", type: "물", category: "특수", power: 110, accuracy: 80, pp: 5, effect: "엄청난 수압의 물을 발사한다." },
  "물수리검": { name: "물수리검", type: "물", category: "특수", power: 15, accuracy: 100, pp: 20, effect: "2~5회 연속으로 선공 공격한다." },
  "아쿠아스텝": { name: "아쿠아스텝", type: "물", category: "물리", power: 80, accuracy: 100, pp: 10, effect: "100% 확률로 자신의 스피드가 1단계 상승한다." },

  // 전기 / 땅 / 드래곤 / 격투 / 고스트 / 악 / 얼음
  "전기쇼크": { name: "전기쇼크", type: "전기", category: "특수", power: 40, accuracy: 100, pp: 30, effect: "10% 확률로 상대를 마비시킨다." },
  "10만볼트": { name: "10만볼트", type: "전기", category: "특수", power: 90, accuracy: 100, pp: 15, effect: "10% 확률로 상대를 마비시킨다." },
  "번개": { name: "번개", type: "전기", category: "특수", power: 110, accuracy: 70, pp: 10, effect: "30% 확률로 상대를 마비시킨다." },
  "지진": { name: "지진", type: "땅", category: "물리", power: 100, accuracy: 100, pp: 10, effect: "강력한 진동으로 전장 전체를 공격한다." },
  "드래곤클로": { name: "드래곤클로", type: "드래곤", category: "물리", power: 80, accuracy: 100, pp: 15, effect: "날카로운 손톱으로 찢어 공격한다." },
  "역린": { name: "역린", type: "드래곤", category: "물리", power: 120, accuracy: 100, pp: 10, effect: "연속 공격 후 자신에게 혼란이 올 수 있다." },
  "마하펀치": { name: "마하펀치", type: "격투", category: "물리", power: 40, accuracy: 100, pp: 30, effect: "음속의 펀치를 날리는 선공기." },
  "인파이트": { name: "인파이트", type: "격투", category: "물리", power: 120, accuracy: 100, pp: 5, effect: "사용 후 방어와 특방이 1단계 떨어진다." },
  "섀도볼": { name: "섀도볼", type: "고스트", category: "특수", power: 80, accuracy: 100, pp: 15, effect: "20% 확률로 상대의 특방을 1단계 낮춘다." },
  "악의파동": { name: "악의파동", type: "악", category: "특수", power: 80, accuracy: 100, pp: 15, effect: "20% 확률로 상대를 풀죽게 만든다." },
  "냉동빔": { name: "냉동빔", type: "얼음", category: "특수", power: 90, accuracy: 100, pp: 10, effect: "10% 확률로 상대를 얼음 상태에 빠뜨린다." }
};

// 포켓몬 도감 번호별 레벨 습득 기술 목록 (LEARNSETS_DB)
const LEARNSETS_DB = {
  // 1세대 스타팅
  1: [{ move: "몸통박치기", level: 1 }, { move: "울음소리", level: 3 }, { move: "덩굴채찍", level: 7 }, { move: "잎날가르기", level: 13 }, { move: "솔라빔", level: 36 }],
  2: [{ move: "몸통박치기", level: 1 }, { move: "덩굴채찍", level: 1 }, { move: "잎날가르기", level: 14 }, { move: "솔라빔", level: 44 }],
  3: [{ move: "덩굴채찍", level: 1 }, { move: "잎날가르기", level: 1 }, { move: "솔라빔", level: 32 }, { move: "기가드레인", level: 45 }],
  4: [{ move: "할퀴기", level: 1 }, { move: "불꽃세례", level: 7 }, { move: "화염방사", level: 19 }, { move: "불대문자", level: 36 }],
  5: [{ move: "할퀴기", level: 1 }, { move: "불꽃세례", level: 1 }, { move: "화염방사", level: 24 }, { move: "불대문자", level: 42 }],
  6: [{ move: "드래곤클로", level: 1 }, { move: "화염방사", level: 1 }, { move: "불대문자", level: 36 }, { move: "플레어드라이브", level: 62 }],
  7: [{ move: "몸통박치기", level: 1 }, { move: "물대포", level: 7 }, { move: "물경포", level: 15 }, { move: "하이드로펌프", level: 36 }],
  8: [{ move: "물대포", level: 1 }, { move: "물경포", level: 16 }, { move: "하이드로펌프", level: 41 }],
  9: [{ move: "물경포", level: 1 }, { move: "하이드로펌프", level: 36 }, { move: "냉동빔", level: 40 }, { move: "파도타기", level: 50 }],
  25: [{ move: "전기쇼크", level: 1 }, { move: "전광석화", level: 4 }, { move: "10만볼트", level: 18 }, { move: "번개", level: 36 }],

  // 2세대 스타팅
  152: [{ move: "몸통박치기", level: 1 }, { move: "울음소리", level: 3 }, { move: "잎날가르기", level: 6 }, { move: "솔라빔", level: 36 }],
  155: [{ move: "몸통박치기", level: 1 }, { move: "불꽃세례", level: 10 }, { move: "화염자동차", level: 19 }, { move: "화염방사", level: 31 }],
  158: [{ move: "할퀴기", level: 1 }, { move: "물대포", level: 6 }, { move: "파도타기", level: 30 }, { move: "하이드로펌프", level: 43 }],

  // 3세대 스타팅
  252: [{ move: "몸통박치기", level: 1 }, { move: "리프블레이드", level: 21 }, { move: "리프스톰", level: 46 }],
  255: [{ move: "할퀴기", level: 1 }, { move: "불꽃세례", level: 6 }, { move: "플레어드라이브", level: 50 }],
  258: [{ move: "몸통박치기", level: 1 }, { move: "물대포", level: 6 }, { move: "지진", level: 42 }],

  // 4세대 스타팅
  387: [{ move: "몸통박치기", level: 1 }, { move: "잎날가르기", level: 9 }, { move: "우드해머", level: 45 }, { move: "지진", level: 50 }],
  390: [{ move: "할퀴기", level: 1 }, { move: "불꽃세례", level: 7 }, { move: "마하펀치", level: 14 }, { move: "인파이트", level: 53 }],
  393: [{ move: "몸통박치기", level: 1 }, { move: "물대포", level: 8 }, { move: "하이드로펌프", level: 43 }],

  // 6세대 & 9세대 스타팅
  658: [{ move: "물수리검", level: 1 }, { move: "파도타기", level: 25 }, { move: "악의파동", level: 36 }, { move: "하이드로펌프", level: 52 }],
  906: [{ move: "할퀴기", level: 1 }, { move: "플라워트릭", level: 36 }],
  909: [{ move: "몸통박치기", level: 1 }, { move: "플레어송", level: 36 }],
  912: [{ move: "몸통박치기", level: 1 }, { move: "아쿠아스텝", level: 36 }]
};