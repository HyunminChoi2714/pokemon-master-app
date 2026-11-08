/**
 * src/data/pokemon.js - 기본 포켓몬 데이터베이스
 */

const POKEMON_DB = [
  { id: 1, name: "이상해씨", type1: "풀", type2: "독", stage: 1, isBaseStage: true, hp: 45, atk: 49, def: 49, spAtk: 65, spDef: 65, spd: 45, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png" },
  { id: 2, name: "이상해풀", type1: "풀", type2: "독", stage: 2, isBaseStage: false, hp: 60, atk: 62, def: 63, spAtk: 80, spDef: 80, spd: 60, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/2.png" },
  { id: 3, name: "이상해꽃", type1: "풀", type2: "독", stage: 3, isBaseStage: false, hp: 80, atk: 82, def: 83, spAtk: 100, spDef: 100, spd: 80, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/3.png" },
  { id: 4, name: "파이리", type1: "불꽃", type2: null, stage: 1, isBaseStage: true, hp: 39, atk: 52, def: 43, spAtk: 60, spDef: 50, spd: 65, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png" },
  { id: 5, name: "리자드", type1: "불꽃", type2: null, stage: 2, isBaseStage: false, hp: 58, atk: 64, def: 58, spAtk: 80, spDef: 65, spd: 80, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/5.png" },
  { id: 6, name: "리자몽", type1: "불꽃", type2: "비행", stage: 3, isBaseStage: false, hp: 78, atk: 84, def: 78, spAtk: 109, spDef: 85, spd: 100, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png" },
  { id: 7, name: "꼬부기", type1: "물", type2: null, stage: 1, isBaseStage: true, hp: 44, atk: 48, def: 65, spAtk: 50, spDef: 64, spd: 43, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/7.png" },
  { id: 8, name: "어니부기", type1: "물", type2: null, stage: 2, isBaseStage: false, hp: 59, atk: 63, def: 80, spAtk: 65, spDef: 80, spd: 58, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/8.png" },
  { id: 9, name: "거북왕", type1: "물", type2: null, stage: 3, isBaseStage: false, hp: 79, atk: 83, def: 100, spAtk: 85, spDef: 105, spd: 78, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/9.png" },
  { id: 25, name: "피카츄", type1: "전기", type2: null, stage: 1, isBaseStage: true, hp: 35, atk: 55, def: 40, spAtk: 50, spDef: 50, spd: 90, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png" },
  { id: 26, name: "라이츄", type1: "전기", type2: null, stage: 2, isBaseStage: false, hp: 60, atk: 90, def: 55, spAtk: 90, spDef: 80, spd: 110, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/26.png" },
  { id: 74, name: "꼬마돌", type1: "바위", type2: "땅", stage: 1, isBaseStage: true, hp: 40, atk: 80, def: 100, spAtk: 30, spDef: 30, spd: 20, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/74.png" },
  { id: 95, name: "롱스톤", type1: "바위", type2: "땅", stage: 1, isBaseStage: true, hp: 35, atk: 45, def: 160, spAtk: 30, spDef: 45, spd: 70, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/95.png" },
  { id: 111, name: "뿔카노", type1: "땅", type2: "바위", stage: 1, isBaseStage: true, hp: 80, atk: 85, def: 95, spAtk: 30, spDef: 30, spd: 25, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/111.png" },
  { id: 129, name: "잉어킹", type1: "물", type2: null, stage: 1, isBaseStage: true, hp: 20, atk: 10, def: 55, spAtk: 15, spDef: 20, spd: 80, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/129.png" },
  { id: 130, name: "갸라도스", type1: "물", type2: "비행", stage: 2, isBaseStage: false, hp: 95, atk: 125, def: 79, spAtk: 60, spDef: 100, spd: 81, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/130.png" }
];

window.POKEMON_DB = POKEMON_DB;