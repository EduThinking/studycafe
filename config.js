/* =============================================================
 *  제이 스터디 카페 — 설정 파일 (config.js)
 * =============================================================
 *  이 파일만 고치면 카페 이름·출석 회차·캐릭터·봇·실시간 연결이 바뀝니다.
 *
 *  1) 데모 모드 (기본값)
 *     - supabase.url / supabase.anonKey 를 비워 두면
 *       내 브라우저 안에서만 돌아가는 데모 모드로 실행됩니다.
 *     - 공부 친구 봇 3명(민지·준호·소연)이 자리에 앉아 공부하고 가끔 채팅을 겁니다.
 *     - 내 출석 기록은 브라우저 localStorage 에 저장됩니다.
 *
 *  2) 실시간 모드
 *     - supabase.url 과 supabase.anonKey 를 채우면
 *       Supabase Realtime(Presence + Broadcast)으로 여러 명이 함께 이용합니다.
 *     - supabase-schema.sql 을 Supabase SQL Editor 에서 한 번 실행해 주세요.
 * ============================================================= */

window.CAFE_CONFIG = {
  /* ---------- 카페 기본 정보 ---------- */
  title: '제이 스터디 카페',
  subtitle: '함께 공부하는 공간',

  /* 같은 방을 쓰려면 참가자 모두 이 값이 같아야 합니다. */
  roomKey: 'jey-study-cafe',

  /* 키오스크 출석 회차 (1 ~ kioskRounds) */
  kioskRounds: 5,

  /* ---------- Supabase (실시간 모드) ---------- */
  supabase: {
    url: 'https://vblrewgzijqvivoydsxl.supabase.co',       // 예: 'https://abcdefghijkl.supabase.co'
    anonKey: 'sb_publishable_Wilq2KM8vHJMytmF_gkHaA_3qH3bbPk',   // Supabase 프로젝트 설정 > API > anon public key
  },

  /* ---------- 움직임 ---------- */
  movement: {
    speed: 104,    // 초당 이동 픽셀
  },

  /* ---------- 채팅 ---------- */
  chat: {
    maxMessages: 80,
    quickReactions: ['👏', '🔥', '💛', '🎉', '☕'],
  },

  /* ---------- 캐릭터 10종 ----------
   * hairStyle: bob | short | long | ponytail | bun | afro | beanie | cap | hood
   * accessory: none | glasses | headphones | scarf
   */
  characters: [
    { id: 'haneul',  name: '하늘',  skin: '#F2C9A4', hair: '#2C2438', hairStyle: 'bob',      shirt: '#2E7B85', shirtDark: '#24606A', pants: '#33405A', shoes: '#241C2C', accessory: 'glasses', accent: '#8FD3D8' },
    { id: 'minji2',  name: '다홍',  skin: '#F8D3B0', hair: '#C24B4B', hairStyle: 'short',    shirt: '#E08A4B', shirtDark: '#C2713A', pants: '#4A3A56', shoes: '#2A2030', accessory: 'headphones', accent: '#F2B45E' },
    { id: 'junho2',  name: '도토리', skin: '#BC8055', hair: '#241B1B', hairStyle: 'afro',     shirt: '#7A5AA6', shirtDark: '#63478C', pants: '#2F3550', shoes: '#221A28', accessory: 'none', accent: '#B79BE0' },
    { id: 'soyeon2', name: '소연',  skin: '#F3CBA8', hair: '#6B4130', hairStyle: 'bob',      shirt: '#3F6FA8', shirtDark: '#335B8C', pants: '#2C3550', shoes: '#232030', accessory: 'none', accent: '#9AC0E8' },
    { id: 'daon',    name: '다온',  skin: '#EFC49F', hair: '#4A2E2A', hairStyle: 'ponytail', shirt: '#D27A9B', shirtDark: '#B36381', pants: '#3B3F5C', shoes: '#2A2230', accessory: 'scarf', accent: '#F6D78A' },
    { id: 'saessak', name: '새싹',  skin: '#F5CFA9', hair: '#3A2A26', hairStyle: 'hood',     shirt: '#5E9E52', shirtDark: '#4C8443', pants: '#35503C', shoes: '#26352A', accessory: 'none', accent: '#A6D68F' },
    { id: 'bora',    name: '보라',  skin: '#E8BB95', hair: '#2C2436', hairStyle: 'beanie',   shirt: '#8E6FB8', shirtDark: '#73599A', pants: '#40365A', shoes: '#2A2236', accessory: 'glasses', accent: '#C9A6E8' },
    { id: 'taeo',    name: '태오',  skin: '#A96A44', hair: '#201A1A', hairStyle: 'cap',      shirt: '#E07B3C', shirtDark: '#BC632E', pants: '#2D3550', shoes: '#221B26', accessory: 'none', accent: '#4E7FC0' },
    { id: 'eunho',   name: '은호',  skin: '#F6D3B0', hair: '#C79A5B', hairStyle: 'short',    shirt: '#6FA36B', shirtDark: '#578555', pants: '#4A4232', shoes: '#302A22', accessory: 'none', accent: '#A8C99B' },
    { id: 'haru',    name: '하루',  skin: '#EBC0A0', hair: '#B9B6C4', hairStyle: 'bun',      shirt: '#8A7BA8', shirtDark: '#6F6289', pants: '#4A4560', shoes: '#2E2A38', accessory: 'scarf', accent: '#D9D3E6' },
  ],

  /* ---------- 데모 모드 공부 친구 봇 ----------
   * zone: shared(파란 러그) | focus(초록 러그) | lounge(보라 러그)
   */
  demoBots: [
    {
      name: '민지',
      charId: 'soyeon2',
      zone: 'shared',
      lines: [
        '다들 오늘 목표 몇 페이지예요?',
        '저는 오늘 논문 2편 읽기 도전!',
        '이 카페 분위기 좋네요 ☕',
        '집중 안 될 때는 25분 타이머 켜요.',
        '출석 키오스크에 기록하고 왔어요.',
      ],
    },
    {
      name: '준호',
      charId: 'taeo',
      zone: 'focus',
      lines: [
        '부스 자리는 역시 조용해서 좋아요.',
        '코딩 과제 하는 중입니다 🧑‍💻',
        '한 시간 뒤에 같이 스트레칭해요.',
        '오늘 목표: 버그 3개 잡기.',
      ],
    },
    {
      name: '소연',
      charId: 'daon',
      zone: 'lounge',
      lines: [
        '라운지 소파가 제일 편해요.',
        '커피 한 잔 하고 다시 달릴게요 ☕',
        '다들 물 마시는 거 잊지 마세요!',
        '오늘 공부 시간 벌써 30분 넘었네요.',
      ],
    },
  ],
};
