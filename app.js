/* =============================================================
 *  제이 스터디 카페 — app.js
 *  - 픽셀 카페 화면 · 이동 · 좌석 · 공부 타이머 · 채팅 · 키오스크
 *  - 데모 모드(봇 3명 + localStorage) / Supabase 실시간 모드
 * ============================================================= */

(function () {
  'use strict';

  var CFG = window.CAFE_CONFIG || {};
  var S = window.SPRITES;

  var $ = function (id) { return document.getElementById(id); };

  /* =============================================================
   *  0. 기본값
   * ============================================================= */
  var TITLE = CFG.title || '제이 스터디 카페';
  var SUBTITLE = CFG.subtitle || '함께 공부하는 공간';
  var ROUNDS = Math.max(1, Math.min(10, CFG.kioskRounds || 5));
  var SPEED = (CFG.movement && CFG.movement.speed) || 84;
  var charDefs = CFG.characters || [];

  var MAP = { w: 640, h: 400, wallTop: 46 };
  MAP.zones = {
    shared: { x: 40, y: 56, w: 316, h: 196 },
    focus: { x: 378, y: 56, w: 212, h: 196 },
    lounge: { x: 378, y: 258, w: 212, h: 120 }
  };

  /* =============================================================
   *  1. 카페 배치 (가구 · 좌석 · 충돌)
   * ============================================================= */
  var FURNITURE = [];   // 그리는 순서와 무관하게 y 기준 정렬해서 그림
  var SEATS = [];
  var COLLIDERS = [];

  var KIOSK = { x: 74, y: 314, w: 34, h: 44, interact: { x: 91, y: 368 } };

  function collider(x, y, w, h) { COLLIDERS.push({ x: x, y: y, w: w, h: h }); }

  function addChair(cx, chairY, back) {
    FURNITURE.push({ type: 'chair', x: cx - 9, y: chairY, w: 18, h: 14, back: back });
  }

  function addSeat(id, zone, cx, feetY, face, interactY) {
    SEATS.push({
      id: id, zone: zone, x: cx, y: feetY, face: face,
      interact: { x: cx, y: interactY },
      occupant: null
    });
  }

  function buildRoom() {
    /* ---- 벽 ---- */
    collider(0, 0, MAP.w, MAP.wallTop);
    collider(0, 0, 12, MAP.h);
    collider(MAP.w - 12, 0, 12, MAP.h);
    collider(0, MAP.h - 9, MAP.w, 9);

    /* ---- 공용 스터디 존 (파란 러그) ---- */
    FURNITURE.push({
      type: 'table', x: 64, y: 92, w: 268, h: 26,
      items: [
        { t: 'laptop', dx: 28 }, { t: 'books', dx: 74 }, { t: 'lamp', dx: 132 },
        { t: 'laptop', dx: 186 }, { t: 'mug', dx: 228 }
      ]
    });
    FURNITURE.push({
      type: 'table', x: 64, y: 200, w: 268, h: 26,
      items: [
        { t: 'laptop', dx: 26 }, { t: 'lamp', dx: 92 }, { t: 'books', dx: 142 },
        { t: 'laptop', dx: 200 }, { t: 'plant', dx: 246 }
      ]
    });
    collider(64, 92, 268, 30);
    collider(64, 200, 268, 30);

    var chairXs = [84, 152, 220, 288];
    /* 1행: 첫 번째 테이블 위쪽 (테이블 쪽을 봄) */
    chairXs.forEach(function (cx, i) {
      addChair(cx, 72, 'top');
      addSeat('shared-a-top-' + i, 'shared', cx, 85, 'down', 64);
    });
    /* 2행: 첫 번째 테이블 아래쪽 */
    chairXs.forEach(function (cx, i) {
      addChair(cx, 124, 'bottom');
      addSeat('shared-a-bot-' + i, 'shared', cx, 137, 'up', 148);
    });
    /* 3행: 두 번째 테이블 위쪽 */
    chairXs.forEach(function (cx, i) {
      addChair(cx, 176, 'top');
      addSeat('shared-b-top-' + i, 'shared', cx, 189, 'down', 166);
    });
    /* 4행: 두 번째 테이블 아래쪽 */
    chairXs.forEach(function (cx, i) {
      addChair(cx, 232, 'bottom');
      addSeat('shared-b-bot-' + i, 'shared', cx, 245, 'up', 256);
    });

    /* ---- 개인 집중 부스 (초록 러그) ---- */
    var boothX = [386, 452, 518];
    boothX.forEach(function (bx, i) {
      FURNITURE.push({ type: 'booth', x: bx, y: 64, w: 60, h: 62 });
      collider(bx, 64, 60, 48);
      addChair(bx + 30, 124, 'bottom');
      addSeat('focus-top-' + i, 'focus', bx + 30, 137, 'up', 148);
    });
    boothX.forEach(function (bx, i) {
      FURNITURE.push({ type: 'desk', x: bx, y: 190, w: 60, h: 20 });
      collider(bx, 190, 60, 22);
      addChair(bx + 30, 168, 'top');
      addSeat('focus-bot-' + i, 'focus', bx + 30, 181, 'down', 160);
    });

    /* ---- 라운지 (보라 러그) ---- */
    FURNITURE.push({ type: 'sofa', x: 392, y: 262, w: 150, h: 26, back: 'top' });
    collider(392, 262, 150, 26);
    [415, 467, 519].forEach(function (cx, i) {
      addSeat('lounge-top-' + i, 'lounge', cx, 283, 'down', 293);
    });

    FURNITURE.push({ type: 'coffeeTable', x: 428, y: 298, w: 76, h: 22 });
    collider(428, 298, 76, 22);

    FURNITURE.push({ type: 'sofa', x: 392, y: 328, w: 150, h: 26, back: 'bottom' });
    collider(392, 328, 150, 26);
    [415, 467, 519].forEach(function (cx, i) {
      addSeat('lounge-bot-' + i, 'lounge', cx, 344, 'up', 322);
    });

    FURNITURE.push({ type: 'armchair', x: 552, y: 300, w: 32, h: 30 });
    collider(552, 300, 32, 30);
    addSeat('lounge-chair-0', 'lounge', 568, 326, 'down', 337);

    FURNITURE.push({ type: 'plant', x: 570, y: 352, w: 0, h: 24 });
    collider(563, 367, 14, 9);

    /* ---- 아래쪽 바 카운터 ---- */
    FURNITURE.push({ type: 'counter', x: 222, y: 320, w: 140, h: 26 });
    collider(222, 320, 140, 26);
    [246, 288, 330].forEach(function (cx, i) {
      FURNITURE.push({ type: 'stool', x: cx - 7, y: 348, w: 14, h: 13 });
      addSeat('bar-' + i, 'bar', cx, 359, 'up', 368);
    });

    /* ---- 창가 티 테이블 (작은 2인석) ---- */
    FURNITURE.push({ type: 'sideTable', x: 132, y: 316, w: 44, h: 22 });
    collider(132, 316, 44, 22);
    addChair(154, 298, 'top');
    addSeat('nook-top-0', 'nook', 154, 311, 'down', 288);
    addChair(154, 342, 'bottom');
    addSeat('nook-bot-0', 'nook', 154, 355, 'up', 364);

    /* ---- 스탠드 조명 ---- */
    FURNITURE.push({ type: 'floorLamp', x: 196, y: 286, w: 2, h: 54 });
    collider(190, 332, 13, 8);

    /* ---- 키오스크 ---- */
    FURNITURE.push({
      type: 'kiosk', x: KIOSK.x, y: KIOSK.y, w: KIOSK.w, h: KIOSK.h,
      label: '출석·퇴장'
    });
    collider(KIOSK.x, KIOSK.y, KIOSK.w, KIOSK.h);

    /* ---- 가운데 책 수레 · 화분 ---- */
    FURNITURE.push({ type: 'bookCart', x: 186, y: 150, w: 38, h: 20 });
    collider(186, 150, 38, 20);
    FURNITURE.push({ type: 'plant', x: 312, y: 142, w: 0, h: 24 });
    collider(305, 157, 14, 9);

    /* ---- 화분 ---- */
    [
      { x: 26, y: 64 }, { x: 352, y: 64 }, { x: 604, y: 64 },
      { x: 30, y: 344 }, { x: 600, y: 350 }, { x: 196, y: 250 }
    ].forEach(function (p) {
      FURNITURE.push({ type: 'plant', x: p.x, y: p.y, w: 0, h: 24 });
      collider(p.x - 7, p.y + 15, 14, 9);
    });
  }

  function seatById(id) {
    for (var i = 0; i < SEATS.length; i++) if (SEATS[i].id === id) return SEATS[i];
    return null;
  }

  /* =============================================================
   *  2. 상태
   * ============================================================= */
  var state = {
    mode: 'demo',
    started: false,
    me: null,
    players: {},        // 원격 참가자
    bots: [],
    chat: [],
    chatSeen: {},
    reactions: [],
    attendance: { date: '', rounds: {} },
    keys: {},
    pendingSeat: null,
    pendingKiosk: false,
    prompt: null,
    time: 0
  };

  var MY_ID = 'u-' + Math.random().toString(36).slice(2, 9);

  /* =============================================================
   *  3. 캔버스 / 배경 캐시
   * ============================================================= */
  var canvas = $('game');
  var ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  var bgCanvas = document.createElement('canvas');
  bgCanvas.width = MAP.w * 2;
  bgCanvas.height = MAP.h * 2;
  var bgCtx = bgCanvas.getContext('2d');
  bgCtx.setTransform(2, 0, 0, 2, 0, 0);
  S.drawBackground(bgCtx, MAP);

  function paint() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(bgCanvas, 0, 0);
    ctx.setTransform(2, 0, 0, 2, 0, 0);
  }

  /* =============================================================
   *  4. 도구
   * ============================================================= */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  function fmtTime(sec) {
    sec = Math.max(0, Math.floor(sec || 0));
    return pad2(Math.floor(sec / 3600)) + ':' + pad2(Math.floor((sec % 3600) / 60)) + ':' + pad2(sec % 60);
  }
  function ymd(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function hhmm(d) { return pad2(d.getHours()) + ':' + pad2(d.getMinutes()); }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function charOf(id) {
    for (var i = 0; i < charDefs.length; i++) if (charDefs[i].id === id) return charDefs[i];
    return charDefs[0] || { id: 'x', name: '나', skin: '#F2C9A4', hair: '#2C2438', hairStyle: 'bob', shirt: '#2E7B85', pants: '#33405A', accent: '#8FD3D8' };
  }
  function nameColor(name) {
    var h = 0;
    for (var i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
    return 'hsl(' + h + ', 42%, 40%)';
  }

  var toastTimer = null;
  function toast(msg) {
    var el = $('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2200);
  }

  /* =============================================================
   *  5. 충돌 / 길찾기
   * ============================================================= */
  function blockedAt(x, y) {
    if (y < MAP.wallTop + 6 || y > MAP.h - 12 || x < 16 || x > MAP.w - 16) return true;
    var bx = x - 4, by = y - 6, bw = 8, bh = 7;
    for (var i = 0; i < COLLIDERS.length; i++) {
      var c = COLLIDERS[i];
      if (bx < c.x + c.w && bx + bw > c.x && by < c.y + c.h && by + bh > c.y) return true;
    }
    return false;
  }

  var NAV = { cols: 0, rows: 0, grid: [] };

  function buildNav() {
    NAV.cols = Math.floor(MAP.w / 8);
    NAV.rows = Math.floor(MAP.h / 8);
    NAV.grid = [];
    for (var gy = 0; gy < NAV.rows; gy++) {
      var row = [];
      for (var gx = 0; gx < NAV.cols; gx++) {
        var cx = gx * 8 + 4, cy = gy * 8 + 4;
        var blocked = false;
        if (cy < MAP.wallTop + 6 || cy > MAP.h - 12 || cx < 16 || cx > MAP.w - 16) blocked = true;
        else {
          for (var i = 0; i < COLLIDERS.length; i++) {
            var c = COLLIDERS[i];
            if (cx > c.x - 6 && cx < c.x + c.w + 6 && cy > c.y - 8 && cy < c.y + c.h + 8) { blocked = true; break; }
          }
        }
        row.push(blocked ? 1 : 0);
      }
      NAV.grid.push(row);
    }
  }

  function cellOf(x, y) {
    return { cx: clamp(Math.floor(x / 8), 0, NAV.cols - 1), cy: clamp(Math.floor(y / 8), 0, NAV.rows - 1) };
  }
  function cellFree(cx, cy) {
    if (cx < 0 || cy < 0 || cx >= NAV.cols || cy >= NAV.rows) return false;
    return NAV.grid[cy][cx] === 0;
  }
  function nearestFree(cx, cy) {
    if (cellFree(cx, cy)) return { cx: cx, cy: cy };
    for (var r = 1; r <= 8; r++) {
      for (var dy = -r; dy <= r; dy++) {
        for (var dx = -r; dx <= r; dx++) {
          if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
          if (cellFree(cx + dx, cy + dy)) return { cx: cx + dx, cy: cy + dy };
        }
      }
    }
    return null;
  }

  function findPath(sx, sy, tx, ty) {
    var s = cellOf(sx, sy), t = cellOf(tx, ty);
    var start = nearestFree(s.cx, s.cy);
    var goal = nearestFree(t.cx, t.cy);
    if (!start || !goal) return null;
    if (start.cx === goal.cx && start.cy === goal.cy) return [{ x: tx, y: ty }];

    var cols = NAV.cols, rows = NAV.rows;
    var idx = function (cx, cy) { return cy * cols + cx; };
    var open = [idx(start.cx, start.cy)];
    var came = {};
    var g = {}; g[idx(start.cx, start.cy)] = 0;
    var f = {}; f[idx(start.cx, start.cy)] = Math.hypot(goal.cx - start.cx, goal.cy - start.cy);
    var closed = {};

    var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
    var guard = 0;

    while (open.length && guard++ < 8000) {
      /* 가장 작은 f 찾기 */
      var bestI = 0;
      for (var i = 1; i < open.length; i++) if ((f[open[i]] || 1e9) < (f[open[bestI]] || 1e9)) bestI = i;
      var cur = open.splice(bestI, 1)[0];
      if (closed[cur]) continue;
      closed[cur] = 1;

      var ccx = cur % cols, ccy = Math.floor(cur / cols);
      if (ccx === goal.cx && ccy === goal.cy) {
        /* 경로 복원 */
        var path = [];
        var node = cur;
        while (node !== undefined) {
          var nx = node % cols, ny = Math.floor(node / cols);
          path.unshift({ x: nx * 8 + 4, y: ny * 8 + 4 });
          node = came[node];
        }
        path.shift(); /* 시작 셀 제거 */
        /* 마지막은 정확한 목표 지점 */
        path.push({ x: tx, y: ty });
        return path;
      }

      for (var d = 0; d < dirs.length; d++) {
        var nx2 = ccx + dirs[d][0], ny2 = ccy + dirs[d][1];
        if (!cellFree(nx2, ny2)) continue;
        /* 대각선 코너 컷 방지 */
        if (dirs[d][0] !== 0 && dirs[d][1] !== 0) {
          if (!cellFree(ccx + dirs[d][0], ccy) || !cellFree(ccx, ccy + dirs[d][1])) continue;
        }
        var nIdx = idx(nx2, ny2);
        if (closed[nIdx]) continue;
        var step = (dirs[d][0] !== 0 && dirs[d][1] !== 0) ? 1.42 : 1;
        var ng = (g[cur] || 0) + step;
        if (g[nIdx] === undefined || ng < g[nIdx]) {
          g[nIdx] = ng;
          f[nIdx] = ng + Math.hypot(goal.cx - nx2, goal.cy - ny2);
          came[nIdx] = cur;
          open.push(nIdx);
        }
      }
    }
    return null;
  }

  function moveEntity(e, dx, dy) {
    var steps = Math.max(1, Math.ceil((Math.abs(dx) + Math.abs(dy)) / 3));
    dx /= steps; dy /= steps;
    for (var i = 0; i < steps; i++) {
      if (!blockedAt(e.x + dx, e.y)) e.x += dx;
      else if (!blockedAt(e.x + dx, e.y - 2) && !e.sitting) e.x += dx * 0.4;
      if (!blockedAt(e.x, e.y + dy)) e.y += dy;
      else if (!blockedAt(e.x - 2, e.y + dy) && !e.sitting) e.y += dy * 0.4;
    }
    e.x = clamp(e.x, 18, MAP.w - 18);
    e.y = clamp(e.y, MAP.wallTop + 10, MAP.h - 12);
  }

  function followPath(e, dt) {
    if (!e.path || !e.path.length) { e.moving = false; return; }
    var wp = e.path[0];
    var dx = wp.x - e.x, dy = wp.y - e.y;
    var d = Math.hypot(dx, dy);
    if (d < 3) {
      e.path.shift();
      if (!e.path.length) { e.moving = false; return; }
      wp = e.path[0]; dx = wp.x - e.x; dy = wp.y - e.y; d = Math.hypot(dx, dy) || 1;
    }
    var beforeX = e.x, beforeY = e.y;
    var step = Math.min(SPEED * (e.bot ? 0.82 : 1) * dt, d);
    moveEntity(e, (dx / d) * step, (dy / d) * step);
    e.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    e.moving = true;

    /* 끼임 감지: 거의 못 움직이면 현재 경유지를 건너뛴다 */
    if (Math.hypot(e.x - beforeX, e.y - beforeY) < step * 0.25) {
      e.stuck = (e.stuck || 0) + dt;
      if (e.stuck > 0.35) {
        e.stuck = 0;
        e.path.shift();
        if (!e.path.length) {
          e.moving = false;
          if (e === state.me && e.pendingSeat) e.pendingSeat = null;
        }
      }
    } else {
      e.stuck = 0;
    }
  }

  function goTo(e, pt, seat, kiosk) {
    var path = findPath(e.x, e.y, pt.x, pt.y);
    if (!path) { if (e === state.me) toast('그쪽으로는 지나갈 수 없어요'); return false; }
    e.path = path;
    e.pendingSeat = seat || null;
    e.pendingKiosk = !!kiosk;
    return true;
  }

  /* =============================================================
   *  6. 앉기 / 일어나기
   * ============================================================= */
  function sitAt(e, seat) {
    if (!seat) return false;
    if (seat.occupant && seat.occupant !== e.id) return false;
    if (e.sitting && e.seatId) {
      var old = seatById(e.seatId);
      if (old) old.occupant = null;
    }
    seat.occupant = e.id;
    e.seatId = seat.id;
    e.sitting = true;
    e.studying = true;
    e.moving = false;
    e.path = null;
    e.x = seat.x;
    e.y = seat.y;
    e.dir = seat.face;
    if (e === state.me) syncPresence();
    return true;
  }

  function standUp(e) {
    var seat = e.seatId ? seatById(e.seatId) : null;
    if (seat) {
      seat.occupant = null;
      e.x = seat.interact.x;
      e.y = seat.interact.y;
    }
    e.sitting = false;
    e.studying = false;
    e.seatId = null;
    e.dir = 'down';
    if (e === state.me) syncPresence();
  }

  function freeSeats(zone) {
    return SEATS.filter(function (s) {
      return !s.occupant && (!zone || s.zone === zone);
    });
  }

  /* =============================================================
   *  7. 렌더링
   * ============================================================= */
  function render() {
    paint();

    var list = [];
    for (var i = 0; i < FURNITURE.length; i++) {
      var f = FURNITURE[i];
      list.push({ base: f.y, kind: 'f', obj: f });
    }
    var me = state.me;
    if (me) list.push({ base: me.y, kind: 'p', obj: me });

    var ids = Object.keys(state.players);
    for (var k = 0; k < ids.length; k++) {
      var p = state.players[ids[k]];
      list.push({ base: p.y, kind: 'p', obj: p });
    }
    state.bots.forEach(function (b) { list.push({ base: b.y, kind: 'p', obj: b }); });

    list.sort(function (a, b) { return a.base - b.base; });

    for (var j = 0; j < list.length; j++) {
      var it = list[j];
      if (it.kind === 'f') {
        S.drawFurniture(ctx, it.obj);
      } else {
        drawPlayer(it.obj);
      }
    }

    /* 프롬프트 */
    if (state.prompt && state.prompt.type === 'seat') {
      var seat = state.prompt.seat;
      S.drawPrompt(ctx, { x: seat.x, y: seat.y - 30, label: '앉기', active: true });
    } else if (state.prompt && state.prompt.type === 'kiosk') {
      S.drawPrompt(ctx, { x: KIOSK.x + KIOSK.w / 2, y: KIOSK.y - 22, label: '출석·퇴장', active: true });
    }

    /* 이름표 (항상 맨 위) */
    var all = [];
    if (me) all.push(me);
    Object.keys(state.players).forEach(function (id) { all.push(state.players[id]); });
    state.bots.forEach(function (b) { all.push(b); });
    all.sort(function (a, b) { return a.y - b.y; });
    all.forEach(function (p) {
      if (!state.started && p === me) return;
      var topY = (p.sitting ? p.y - 19 : p.y - 24) - 5;
      S.drawNameTag(ctx, {
        x: p.x,
        y: topY,
        name: p === me ? '나 · ' + p.name : p.name,
        status: p.studying ? '공부 중' : '자리 비움',
        studying: p.studying,
        self: p === me
      });
    });

    /* 리액션 */
    state.reactions.forEach(function (r) {
      var owner = r.playerId === MY_ID ? me : (state.players[r.playerId] || state.bots.filter(function (b) { return b.id === r.playerId; })[0]);
      if (!owner) return;
      S.drawReaction(ctx, owner.x, owner.y, r.emoji, r.t);
    });
  }

  function drawPlayer(p) {
    var c = charOf(p.charId);
    S.drawCharacter(ctx, c, {
      x: p.x,
      y: p.y,
      dir: p.dir,
      sitting: p.sitting,
      walking: !!p.moving,
      frame: Math.floor((p.animT || 0) * 7) % 4
    });
  }

  /* =============================================================
   *  8. 게임 루프
   * ============================================================= */
  var lastTs = 0;
  var uiAccum = 0;
  var presenceAccum = 0;

  function loop(ts) {
    var dt = lastTs ? Math.min(0.06, (ts - lastTs) / 1000) : 0.016;
    lastTs = ts;
    state.time += dt;

    updateMe(dt);
    updateBots(dt);
    updateRemotes(dt);

    state.reactions = state.reactions.filter(function (r) {
      r.t += dt / 1.8;
      return r.t < 1;
    });

    updatePrompt();

    uiAccum += dt;
    if (uiAccum > 0.5) {
      uiAccum = 0;
      renderLeaderboard();
      updateFootStatus();
    }

    presenceAccum += dt;
    if (presenceAccum > 2.5) {
      presenceAccum = 0;
      if (state.mode === 'live') syncPresence();
    }

    render();
    requestAnimationFrame(loop);
  }

  function updateMe(dt) {
    var me = state.me;
    if (!me || !state.started) return;

    me.animT = (me.animT || 0) + dt;

    if (!me.sitting) {
      var dx = 0, dy = 0;
      if (state.keys.up) dy -= 1;
      if (state.keys.down) dy += 1;
      if (state.keys.left) dx -= 1;
      if (state.keys.right) dx += 1;

      if (dx || dy) {
        me.path = null;
        me.pendingSeat = null;
        me.pendingKiosk = false;
        var len = Math.hypot(dx, dy) || 1;
        moveEntity(me, (dx / len) * SPEED * dt, (dy / len) * SPEED * dt);
        me.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
        me.moving = true;
      } else if (me.path && me.path.length) {
        followPath(me, dt);
      } else {
        me.moving = false;
      }

      if (me.pendingSeat && (!me.path || !me.path.length)) {
        if (dist(me, me.pendingSeat.interact) < 30) {
          var s = me.pendingSeat;
          me.pendingSeat = null;
          if (!sitAt(me, s)) toast('이미 누군가 앉아 있는 자리예요');
        }
      }
      if (me.pendingKiosk) {
        if (dist(me, KIOSK.interact) < 24) {
          me.pendingKiosk = false;
          openKiosk();
        }
      }
    } else {
      me.moving = false;
      me.seconds += dt;
      me.studying = true;
    }
  }

  function updateRemotes(dt) {
    Object.keys(state.players).forEach(function (id) {
      var p = state.players[id];
      p.animT = (p.animT || 0) + dt;
      if (p.studying) p.seconds += dt;
      p.x += (p.tx - p.x) * Math.min(1, dt * 9);
      p.y += (p.ty - p.y) * Math.min(1, dt * 9);
      p.moving = Math.hypot(p.tx - p.x, p.ty - p.y) > 0.6;
    });
  }

  function updatePrompt() {
    var me = state.me;
    state.prompt = null;
    if (!me || !state.started) return;

    if (me.sitting) {
      state.prompt = { type: 'stand', label: '일어나기' };
      setActionChip('일어나기', true);
      return;
    }

    var best = null, bd = 15;
    for (var i = 0; i < SEATS.length; i++) {
      var s = SEATS[i];
      if (s.occupant) continue;
      var d = dist(me, s.interact);
      if (d < bd) { bd = d; best = s; }
    }
    var dk = dist(me, KIOSK.interact);

    if (dk < 30 && (!best || dk < bd)) {
      state.prompt = { type: 'kiosk', label: '출석·퇴장' };
      setActionChip('키오스크', true);
    } else if (best) {
      state.prompt = { type: 'seat', seat: best, label: '앉기' };
      setActionChip('앉기', true);
    } else {
      setActionChip('상호작용', false);
    }
  }

  function setActionChip(label, ready) {
    var chip = $('footAction');
    var fab = $('actionFab');
    if (chip) {
      chip.innerHTML = '<b>F</b> ' + label;
      chip.classList.toggle('ready', !!ready);
    }
    if (fab) {
      fab.querySelector('span').textContent = label;
      fab.classList.toggle('ready', !!ready);
    }
  }

  function interact() {
    var me = state.me;
    if (!me || !state.started) return;
    if (me.sitting) { standUp(me); return; }
    if (!state.prompt) { toast('가까이 있는 의자나 키오스크에서 상호작용할 수 있어요'); return; }
    if (state.prompt.type === 'seat') {
      if (!sitAt(me, state.prompt.seat)) toast('이미 누군가 앉아 있는 자리예요');
    } else if (state.prompt.type === 'kiosk') {
      openKiosk();
    }
  }

  /* =============================================================
   *  9. 리더보드 · 상태 표시
   * ============================================================= */
  function allPlayers() {
    var arr = [];
    if (state.me) arr.push(state.me);
    Object.keys(state.players).forEach(function (id) { arr.push(state.players[id]); });
    state.bots.forEach(function (b) { arr.push(b); });
    return arr;
  }

  function renderLeaderboard() {
    var listEl = $('leaderList');
    var players = allPlayers().filter(function (p) {
      return p === state.me ? state.started : true;
    });
    players.sort(function (a, b) { return b.seconds - a.seconds; });

    var html = '';
    players.forEach(function (p, i) {
      var self = p === state.me;
      html += '<li class="lb-row' + (self ? ' is-self' : '') + '">' +
        '<span class="lb-rank">' + (i + 1) + '</span>' +
        '<span class="lb-who"><span class="lb-name">' + escapeHtml(p.name) + (self ? ' (나)' : '') + '</span>' +
        '<span class="lb-status ' + (p.studying ? 'studying' : 'away') + '">' + (p.studying ? '공부 중' : '자리 비움') + '</span></span>' +
        '<span class="lb-time">' + fmtTime(p.seconds) + '</span>' +
        '</li>';
    });
    listEl.innerHTML = html;
    $('lbEmpty').classList.toggle('show', players.length === 0);
    $('liveCount').textContent = players.length + '명 참여';
  }

  function updateFootStatus() {
    var me = state.me;
    if (!me || !state.started) return;
    $('footStudy').textContent = me.sitting
      ? '공부 중 · ' + fmtTime(me.seconds)
      : '자리에 앉으면 공부 시간이 쌓여요';
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  /* =============================================================
   *  10. 채팅
   * ============================================================= */
  function addChat(msg) {
    if (msg.id && state.chatSeen[msg.id]) return;
    if (msg.id) state.chatSeen[msg.id] = 1;
    state.chat.push(msg);
    var max = (CFG.chat && CFG.chat.maxMessages) || 80;
    if (state.chat.length > max) state.chat.splice(0, state.chat.length - max);
    renderChat();
  }

  function renderChat() {
    var feed = $('chatFeed');
    var nearBottom = feed.scrollHeight - feed.scrollTop - feed.clientHeight < 60;
    var html = '';
    state.chat.forEach(function (m) {
      if (m.system) {
        html += '<div class="msg is-system">' + escapeHtml(m.text) + '</div>';
      } else if (m.emoji) {
        html += '<div class="msg is-emoji' + (m.self ? ' is-self' : '') + '"><span class="msg-name">' +
          escapeHtml(m.name) + '</span>' + escapeHtml(m.text) + '</div>';
      } else {
        html += '<div class="msg' + (m.self ? ' is-self' : '') + '"><span class="msg-name" style="color:' +
          (m.self ? '#9a7120' : nameColor(m.name)) + '">' + escapeHtml(m.name) + '</span>' +
          escapeHtml(m.text) + '</div>';
      }
    });
    feed.innerHTML = html;
    if (nearBottom) feed.scrollTop = feed.scrollHeight;
  }

  function sendChat(text) {
    text = (text || '').trim();
    if (!text) return;
    var me = state.me;
    if (!me) return;
    var msg = { id: MY_ID + '-' + Date.now(), name: me.name, text: text, self: true, ts: Date.now() };
    addChat(msg);
    broadcastChat(msg);

    /* 데모 봇이 가끔 대답 */
    if (state.mode === 'demo' && state.bots.length) {
      if (Math.random() < 0.45) {
        var bot = state.bots[Math.floor(Math.random() * state.bots.length)];
        setTimeout(function () { botSay(bot, true); }, rand(1400, 3200));
      }
    }
  }

  function broadcastChat(msg) {
    if (state.mode !== 'live' || !NET.channel) return;
    NET.channel.send({
      type: 'broadcast', event: 'chat',
      payload: { id: msg.id, name: msg.name, text: msg.text, ts: msg.ts }
    });
    if (NET.client) {
      db(NET.client.from('chat_messages').insert({
        nickname: msg.name.slice(0, 24), body: msg.text.slice(0, 300)
      })).then(function () { });
    }
  }

  function onRemoteChat(payload) {
    if (!payload || payload.id === MY_ID) return;
    addChat({ id: payload.id, name: payload.name || '친구', text: String(payload.text || '').slice(0, 300), ts: payload.ts });
  }

  function sendReaction(emoji) {
    var me = state.me;
    if (!me) { toast('먼저 카페에 입장해 주세요'); return; }
    state.reactions.push({ playerId: MY_ID, emoji: emoji, t: 0 });
    addChat({ id: MY_ID + '-r-' + Date.now(), name: me.name, text: emoji, emoji: true, self: true, ts: Date.now() });
    if (state.mode === 'live' && NET.channel) {
      NET.channel.send({ type: 'broadcast', event: 'reaction', payload: { id: MY_ID, emoji: emoji } });
    }
    if (state.mode === 'demo') {
      var bots = state.bots;
      if (bots.length && Math.random() < 0.4) {
        var b = bots[Math.floor(Math.random() * bots.length)];
        setTimeout(function () { state.reactions.push({ playerId: b.id, emoji: emoji, t: 0 }); }, rand(600, 2000));
      }
    }
  }

  function botSay(bot, asReply) {
    if (!bot || !bot.lines || !bot.lines.length) return;
    var line = bot.lines[Math.floor(Math.random() * bot.lines.length)];
    addChat({ id: bot.id + '-' + Date.now(), name: bot.name, text: line, ts: Date.now() });
  }

  /* =============================================================
   *  11. 키오스크
   * ============================================================= */
  var STORE_ATT = 'jey-study-cafe:attendance';

  function loadAttendance() {
    var today = ymd(new Date());
    try {
      var raw = JSON.parse(localStorage.getItem(STORE_ATT) || '{}');
      if (raw && raw.date === today && raw.rounds) return raw;
    } catch (e) { /* ignore */ }
    return { date: today, rounds: {} };
  }

  function saveAttendance() {
    try { localStorage.setItem(STORE_ATT, JSON.stringify(state.attendance)); } catch (e) { /* ignore */ }
  }

  function openKiosk() {
    if (!state.started) return;
    state.attendance = loadAttendance();
    renderKiosk();
    $('kioskSave').textContent = state.mode === 'live' ? '기록은 서버에 저장됩니다' : '기록은 이 브라우저에 저장됩니다';
    openModal('kioskModal');
    if (state.mode === 'live') loadRemoteAttendance();
  }

  function renderKiosk() {
    var wrap = $('kioskRows');
    var rounds = state.attendance.rounds || {};
    var html = '';
    for (var r = 1; r <= ROUNDS; r++) {
      var rec = rounds[r] || {};
      var inDone = !!rec.in, outDone = !!rec.out;
      html += '<div class="kiosk-row">' +
        '<span class="kiosk-round">' + r + '회차</span>' +
        '<button type="button" class="stamp-btn in' + (inDone ? ' done' : '') + '" data-round="' + r + '" data-kind="in"' + (inDone ? ' disabled' : '') + '>' +
        (inDone ? '출석 완료' : '출석 기록') +
        '<span class="stamp-time">' + (inDone ? rec.in : '--:--') + '</span></button>' +
        '<button type="button" class="stamp-btn out' + (outDone ? ' done' : '') + '" data-round="' + r + '" data-kind="out"' + (outDone ? ' disabled' : '') + '>' +
        (outDone ? '퇴장 완료' : '퇴장 기록') +
        '<span class="stamp-time">' + (outDone ? rec.out : '--:--') + '</span></button>' +
        '</div>';
    }
    wrap.innerHTML = html;

    var count = 0;
    Object.keys(rounds).forEach(function (k) { if (rounds[k] && rounds[k].in) count++; });
    var study = state.me ? fmtTime(state.me.seconds) : '00:00:00';
    $('kioskSummary').textContent = '오늘 출석 ' + count + '회 · 공부 ' + study;
  }

  function recordStamp(round, kind) {
    var rounds = state.attendance.rounds;
    rounds[round] = rounds[round] || {};
    if (rounds[round][kind]) return;
    rounds[round][kind] = hhmm(new Date());
    saveAttendance();
    renderKiosk();
    toast(round + '회차 ' + (kind === 'in' ? '출석' : '퇴장') + '을 기록했습니다 · ' + rounds[round][kind]);

    if (state.mode === 'live' && NET.client) {
      db(NET.client.from('attendance_logs').insert({
        nickname: (state.me ? state.me.name : 'guest').slice(0, 24),
        round: round, kind: kind
      })).then(function (res) {
        if (res && res.error) toast('서버 저장에 실패해 이 브라우저에만 기록했어요');
      });
    }
    if (state.mode === 'live' && NET.channel) {
      NET.channel.send({
        type: 'broadcast', event: 'stamp',
        payload: { name: state.me ? state.me.name : '', round: round, kind: kind }
      });
    }
  }

  function loadRemoteAttendance() {
    if (!NET.client || !state.me) return;
    var start = new Date();
    start.setHours(0, 0, 0, 0);
    db(NET.client.from('attendance_logs')
      .select('round,kind,recorded_at')
      .eq('nickname', state.me.name)
      .gte('recorded_at', start.toISOString()))
      .then(function (res) {
        if (res.error || !res.data) return;
        res.data.forEach(function (row) {
          var t = new Date(row.recorded_at);
          var rr = state.attendance.rounds[row.round] || (state.attendance.rounds[row.round] = {});
          if (!rr[row.kind]) rr[row.kind] = hhmm(t);
        });
        saveAttendance();
        renderKiosk();
      });
  }

  /* =============================================================
   *  12. 모달
   * ============================================================= */
  var openModals = [];

  function openModal(id) {
    var el = $(id);
    if (!el) return;
    el.classList.add('open');
    if (openModals.indexOf(id) < 0) openModals.push(id);
    document.body.style.overflow = 'hidden';
  }

  function closeModal(id) {
    var el = $(id);
    if (!el) return;
    el.classList.remove('open');
    openModals = openModals.filter(function (m) { return m !== id; });
    if (!openModals.length) document.body.style.overflow = '';
  }

  function buildCharGrid(selectedId) {
    var grid = $('charGrid');
    grid.innerHTML = '';
    charDefs.forEach(function (c) {
      var card = document.createElement('button');
      card.type = 'button';
      card.className = 'char-card' + (c.id === selectedId ? ' sel' : '');
      card.dataset.id = c.id;

      var cv = document.createElement('canvas');
      cv.width = 132;
      cv.height = 168;
      var g = cv.getContext('2d');
      g.setTransform(3, 0, 0, 3, 0, 0);
      S.drawCharacter(g, c, { x: 22, y: 50, dir: 'down' });

      var label = document.createElement('span');
      label.textContent = c.name;

      card.appendChild(cv);
      card.appendChild(label);
      card.addEventListener('click', function () {
        grid.querySelectorAll('.char-card').forEach(function (n) { n.classList.remove('sel'); });
        card.classList.add('sel');
        state.pickedChar = c.id;
        var nick = $('nickname');
        if (!nick.value.trim()) nick.value = c.name;
      });
      grid.appendChild(card);
    });
  }

  function openEntry() {
    var savedName = '', savedChar = charDefs[0] && charDefs[0].id;
    try {
      var raw = JSON.parse(localStorage.getItem('jey-study-cafe:profile') || '{}');
      savedName = raw.name || '';
      savedChar = raw.charId || savedChar;
    } catch (e) { /* ignore */ }

    state.pickedChar = state.me ? state.me.charId : savedChar;
    $('nickname').value = state.me ? state.me.name : savedName;
    buildCharGrid(state.pickedChar);
    openModal('entryModal');
    setTimeout(function () { $('nickname').focus(); }, 120);
  }

  function enterCafe() {
    var name = ($('nickname').value || '').trim().slice(0, 12);
    if (!name) {
      name = charOf(state.pickedChar).name;
      $('nickname').value = name;
    }
    var charId = state.pickedChar || (charDefs[0] && charDefs[0].id);

    try { localStorage.setItem('jey-study-cafe:profile', JSON.stringify({ name: name, charId: charId })); } catch (e) { }

    if (!state.me) {
      state.me = {
        id: MY_ID, name: name, charId: charId,
        x: 320, y: 300, dir: 'down', moving: false, animT: 0,
        sitting: false, studying: false, seatId: null, seconds: 0, path: null
      };
      state.started = true;
      state.attendance = loadAttendance();
      addSystem(name + '님이 입장했습니다');
      syncPresence();
      $('canvasHint').classList.add('hide');
    } else {
      var oldName = state.me.name;
      state.me.name = name;
      state.me.charId = charId;
      syncPresence();
      if (oldName !== name) addSystem(oldName + '님이 이름을 ' + name + '(으)로 바꿨습니다');
    }

    closeModal('entryModal');
    renderLeaderboard();
    updateFootStatus();
    toast(name + '님, 어서 오세요!');
  }

  function addSystem(text) {
    addChat({ id: 'sys-' + Date.now() + '-' + Math.random(), system: true, text: text });
  }

  /* =============================================================
   *  13. 데모 봇
   * ============================================================= */
  function startBots() {
    if (state.bots.length) return;
    var cfgBots = CFG.demoBots || [];
    var seeds = [720, 480, 180];
    cfgBots.forEach(function (cfg, i) {
      var pool = freeSeats(cfg.zone);
      if (!pool.length) pool = freeSeats();
      if (!pool.length) return;
      var seat = pool[Math.floor(Math.random() * pool.length)];
      var bot = {
        id: 'bot-' + i,
        name: cfg.name,
        charId: cfg.charId,
        x: seat.x, y: seat.y, dir: seat.face,
        sitting: false, studying: false, seatId: null,
        seconds: seeds[i] || 0,
        path: null, pendingSeat: null, moving: false, animT: 0,
        bot: true, lines: cfg.lines || [],
        zone: cfg.zone,
        nextThink: performance.now() + rand(6, 14) * 1000,
        chatAt: performance.now() + rand(18, 40) * 1000
      };
      sitAt(bot, seat);
      state.bots.push(bot);
    });
    renderLeaderboard();
  }

  function updateBots(dt) {
    var now = performance.now();
    state.bots.forEach(function (b) {
      b.animT = (b.animT || 0) + dt;
      if (b.sitting) b.seconds += dt;

      if (b.path && b.path.length) followPath(b, dt);
      else b.moving = false;

      if (b.pendingSeat && (!b.path || !b.path.length) && dist(b, b.pendingSeat.interact) < 26) {
        var s = b.pendingSeat;
        b.pendingSeat = null;
        sitAt(b, s);
      }

      if (now > b.chatAt) {
        b.chatAt = now + rand(30000, 75000);
        if (b.sitting && Math.random() < 0.55) botSay(b);
        else if (Math.random() < 0.18) state.reactions.push({ playerId: b.id, emoji: '☕', t: 0 });
      }

      if (now > b.nextThink) {
        b.nextThink = now + rand(5000, 12000);
        botThink(b);
      }
    });
  }

  function botThink(b) {
    if (b.sitting) {
      /* 아주 가끔 일어났다가 곧 다른 자리로 */
      if (Math.random() < 0.06) {
        standUp(b);
        b.nextThink = performance.now() + rand(1200, 2600);
      }
      return;
    }
    /* 앉을 자리 찾기 */
    if (b.path && b.path.length) return;
    var pool = freeSeats(b.zone);
    if (!pool.length) pool = freeSeats();
    if (pool.length) {
      var seat = pool[Math.floor(Math.random() * pool.length)];
      b.pendingSeat = seat;
      goTo(b, seat.interact, seat);
    } else {
      var s2 = randomWalkSpot(b.zone);
      if (s2) goTo(b, s2);
    }
  }

  function randomWalkSpot(zone) {
    var z = MAP.zones[zone === 'bar' ? 'shared' : zone] || MAP.zones.shared;
    for (var i = 0; i < 20; i++) {
      var x = rand(z.x + 14, z.x + z.w - 14);
      var y = rand(z.y + 24, z.y + z.h - 10);
      if (!blockedAt(x, y) && cellFree(Math.floor(x / 8), Math.floor(y / 8))) return { x: x, y: y };
    }
    return { x: 300, y: 240 };
  }

  /* =============================================================
   *  14. 실시간 (Supabase)
   * ============================================================= */
  var NET = { client: null, channel: null, ready: false, libTried: false };

  /* PostgREST 빌더를 안전한 Promise 로 감싼다 */
  function db(query) {
    try { return Promise.resolve(query).catch(function () { return { error: true, data: null }; }); }
    catch (e) { return Promise.resolve({ error: true, data: null }); }
  }

  function setMode(mode) {
    state.mode = mode;
    var badge = $('connBadge');
    var label = $('connLabel');
    badge.classList.remove('live', 'demo', 'off');
    if (mode === 'live') {
      badge.classList.add('live');
      label.textContent = '실시간 연결';
      $('chatMode').textContent = '실시간';
      $('guideMode').textContent = '지금은 실시간 모드입니다. 같은 방 주소로 들어온 사람들과 함께 공부할 수 있어요.';
    } else if (mode === 'connecting') {
      badge.classList.add('demo');
      label.textContent = '연결 중…';
      $('chatMode').textContent = '연결 중';
    } else if (mode === 'off') {
      badge.classList.add('off');
      label.textContent = '연결 끊김';
      $('chatMode').textContent = '오프라인';
    } else {
      badge.classList.add('demo');
      label.textContent = '데모 모드';
      $('chatMode').textContent = '데모';
      $('guideMode').textContent = '지금은 데모 모드입니다. config.js에 Supabase 주소와 키를 넣으면 여러 명이 실시간으로 함께 쓸 수 있어요.';
    }
  }

  function loadSupabaseLib() {
    return new Promise(function (resolve, reject) {
      if (window.supabase && window.supabase.createClient) return resolve();
      var s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';
      s.async = true;
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error('supabase cdn error')); };
      document.head.appendChild(s);
    });
  }

  function presencePayload() {
    var me = state.me;
    if (!me) return null;
    return {
      id: MY_ID,
      name: me.name,
      charId: me.charId,
      x: Math.round(me.x),
      y: Math.round(me.y),
      dir: me.dir,
      sitting: !!me.sitting,
      seatId: me.seatId || null,
      seconds: Math.round(me.seconds),
      studying: !!me.studying,
      ts: Date.now()
    };
  }

  function syncPresence() {
    if (state.mode !== 'live' || !NET.channel || !state.me) return;
    var payload = presencePayload();
    if (payload) NET.channel.track(payload).catch(function () { });
  }

  function initLive() {
    var sb = CFG.supabase || {};
    if (!sb.url || !sb.anonKey) {
      setMode('demo');
      startBots();
      bootChat();
      return;
    }

    setMode('connecting');
    loadSupabaseLib().then(function () {
      NET.client = window.supabase.createClient(sb.url, sb.anonKey);
      var channel = NET.client.channel('study-cafe:' + (CFG.roomKey || 'main'), {
        config: { presence: { key: MY_ID } }
      });

      channel
        .on('presence', { event: 'sync' }, onPresenceSync)
        .on('broadcast', { event: 'chat' }, function (msg) { onRemoteChat(msg.payload); })
        .on('broadcast', { event: 'reaction' }, function (msg) {
          var p = msg.payload || {};
          if (!p.id || p.id === MY_ID) return;
          state.reactions.push({ playerId: p.id, emoji: String(p.emoji || '☕').slice(0, 4), t: 0 });
        })
        .on('broadcast', { event: 'stamp' }, function (msg) {
          var p = msg.payload || {};
          if (!p.name) return;
          addSystem(p.name + '님이 ' + p.round + '회차 ' + (p.kind === 'in' ? '출석' : '퇴장') + '을 기록했습니다');
        });

      channel.subscribe(function (status) {
        if (status === 'SUBSCRIBED') {
          NET.ready = true;
          setMode('live');
          syncPresence();
          bootChat();
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          if (state.mode === 'live') {
            addSystem('실시간 연결이 끊겼습니다. 새로고침하면 다시 연결됩니다.');
            setMode('off');
          } else if (state.mode === 'connecting') {
            fallbackToDemo('실시간 연결에 실패해 데모 모드로 시작합니다');
          }
        }
      });

      NET.channel = channel;
      loadChatHistory();
    }).catch(function (err) {
      console.warn('[study-cafe] supabase', err);
      fallbackToDemo('실시간 연결에 실패해 데모 모드로 시작합니다');
    });
  }

  function fallbackToDemo(message) {
    setMode('demo');
    startBots();
    bootChat();
    toast(message);
  }

  function onPresenceSync() {
    if (!NET.channel) return;
    var st = NET.channel.presenceState();
    var seen = {};
    Object.keys(st).forEach(function (key) {
      (st[key] || []).forEach(function (meta) {
        var id = meta.id;
        if (!id || id === MY_ID) return;
        seen[id] = 1;
        var p = state.players[id];
        var serverSeconds = Number(meta.seconds) || 0;
        if (!p) {
          p = {
            id: id, name: meta.name || '친구', charId: meta.charId || (charDefs[0] && charDefs[0].id),
            x: Number(meta.x) || 320, y: Number(meta.y) || 300,
            tx: Number(meta.x) || 320, ty: Number(meta.y) || 300,
            dir: meta.dir || 'down', sitting: !!meta.sitting, studying: !!meta.studying,
            seatId: meta.seatId || null, seconds: serverSeconds, animT: 0, moving: false
          };
          state.players[id] = p;
          addSystem(p.name + '님이 입장했습니다');
        } else {
          p.tx = Number(meta.x) || p.x;
          p.ty = Number(meta.y) || p.y;
          p.dir = meta.dir || p.dir;
          p.name = meta.name || p.name;
          p.charId = meta.charId || p.charId;
          p.seconds = Math.max(p.seconds, serverSeconds);
          p.studying = !!meta.studying;
          p.sitting = !!meta.sitting;

          /* 자리 점유 상태 동기화 */
          if (p.seatId && meta.seatId !== p.seatId) {
            var old = seatById(p.seatId);
            if (old && old.occupant === id) old.occupant = null;
          }
          p.seatId = meta.seatId || null;
          if (p.seatId) {
            var s = seatById(p.seatId);
            if (s) s.occupant = id;
          }
        }
      });
    });

    Object.keys(state.players).forEach(function (id) {
      if (seen[id]) return;
      var p = state.players[id];
      if (p.seatId) {
        var s = seatById(p.seatId);
        if (s && s.occupant === id) s.occupant = null;
      }
      addSystem(p.name + '님이 나갔습니다');
      delete state.players[id];
    });

    renderLeaderboard();
  }

  function loadChatHistory() {
    if (!NET.client) return;
    db(NET.client.from('chat_messages')
      .select('id,nickname,body,created_at')
      .order('created_at', { ascending: false })
      .limit(24))
      .then(function (res) {
        if (res.error || !res.data) return;
        var rows = res.data.slice().reverse();
        rows.forEach(function (row) {
          var t = new Date(row.created_at).getTime();
          addChat({ id: 'db-' + row.id, name: row.nickname, text: row.body, ts: t, self: state.me && row.nickname === state.me.name });
        });
      });
  }

  /* =============================================================
   *  15. 첫 채팅
   * ============================================================= */
  function bootChat() {
    addChat({ id: 'hello', system: true, text: TITLE + '에 오신 것을 환영합니다 ✨' });
    if (state.mode === 'demo') {
      addChat({ id: 'hello2', system: true, text: '데모 모드 · 공부 친구 봇 3명과 함께 연습해 보세요.' });
      if (state.bots[0]) {
        setTimeout(function () {
          addChat({ id: 'b0', name: state.bots[0].name, text: '안녕하세요! 오늘은 AI 기초 1차부터 볼게요. ', ts: Date.now() });
        }, 900);
      }
      if (state.bots[1]) {
        setTimeout(function () {
          addChat({ id: 'b1', name: state.bots[1].name, text: '저는 부스에서 코딩 과제 하는 중이에요.', ts: Date.now() });
        }, 2600);
      }
    }
  }

  /* =============================================================
   *  16. 입력
   * ============================================================= */
  var KEYMAP = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    w: 'up', a: 'left', s: 'down', d: 'right',
    W: 'up', A: 'left', S: 'down', D: 'right'
  };

  document.addEventListener('keydown', function (ev) {
    if (ev.target && /INPUT|TEXTAREA/.test(ev.target.tagName)) {
      if (ev.key === 'Escape') ev.target.blur();
      return;
    }
    var dir = KEYMAP[ev.key];
    if (dir) {
      state.keys[dir] = true;
      ev.preventDefault();
      return;
    }
    if (ev.key === 'f' || ev.key === 'F') {
      ev.preventDefault();
      interact();
    }
    if (ev.key === 'Escape') {
      openModals.slice().forEach(function (m) { if (m !== 'entryModal') closeModal(m); });
    }
  });

  document.addEventListener('keyup', function (ev) {
    var dir = KEYMAP[ev.key];
    if (dir) state.keys[dir] = false;
  });

  window.addEventListener('blur', function () { state.keys = {}; });

  /* 캔버스 클릭 이동 / 좌석 클릭 */
  canvas.addEventListener('pointerdown', function (ev) {
    var me = state.me;
    if (!me || !state.started || openModals.length) return;
    var rect = canvas.getBoundingClientRect();
    var x = (ev.clientX - rect.left) / rect.width * MAP.w;
    var y = (ev.clientY - rect.top) / rect.height * MAP.h;

    /* 키오스크 클릭 */
    if (x > KIOSK.x - 6 && x < KIOSK.x + KIOSK.w + 6 && y > KIOSK.y - 10 && y < KIOSK.y + KIOSK.h + 6) {
      goTo(me, KIOSK.interact, null, true);
      return;
    }

    /* 좌석 클릭 */
    for (var i = 0; i < SEATS.length; i++) {
      var s = SEATS[i];
      if (Math.abs(x - s.x) < 12 && Math.abs(y - (s.y - 7)) < 13) {
        if (s.occupant) { toast('이미 누군가 앉아 있는 자리예요'); return; }
        if (!goTo(me, s.interact, s)) return;
        return;
      }
    }

    goTo(me, { x: x, y: y });
  });

  /* 모바일 D-pad */
  (function bindDpad() {
    var pad = $('dpad');
    if (!pad) return;
    var buttons = pad.querySelectorAll('button[data-dir]');
    Array.prototype.forEach.call(buttons, function (btn) {
      var dir = btn.dataset.dir;
      var press = function (e) {
        e.preventDefault();
        state.keys[dir] = true;
        state.me && (state.me.path = null);
      };
      var release = function (e) {
        e.preventDefault();
        state.keys[dir] = false;
      };
      btn.addEventListener('pointerdown', press);
      btn.addEventListener('pointerup', release);
      btn.addEventListener('pointercancel', release);
      btn.addEventListener('pointerleave', release);
    });
  })();

  $('actionFab').addEventListener('click', interact);
  $('footAction').addEventListener('click', interact);

  /* 채팅 */
  $('chatForm').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var input = $('chatInput');
    sendChat(input.value);
    input.value = '';
  });

  (function bindReactions() {
    var wrap = $('reactions');
    var list = (CFG.chat && CFG.chat.quickReactions) || ['👏', '🔥', '💛', '🎉', '☕'];
    list.forEach(function (emoji) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'reaction';
      b.textContent = emoji;
      b.addEventListener('click', function () { sendReaction(emoji); });
      wrap.appendChild(b);
    });
  })();

  /* 모달 버튼 */
  $('btnEnter').addEventListener('click', enterCafe);
  $('nickname').addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter') { ev.preventDefault(); enterCafe(); }
  });
  $('btnCharacter').addEventListener('click', openEntry);
  $('btnGuide').addEventListener('click', function () { openModal('guideModal'); });
  $('guideClose').addEventListener('click', function () { closeModal('guideModal'); });
  $('kioskClose').addEventListener('click', function () { closeModal('kioskModal'); });

  $('kioskRows').addEventListener('click', function (ev) {
    var btn = ev.target.closest ? ev.target.closest('.stamp-btn') : null;
    if (!btn || btn.disabled) return;
    recordStamp(Number(btn.dataset.round), btn.dataset.kind);
  });

  Array.prototype.forEach.call(document.querySelectorAll('.modal-backdrop'), function (el) {
    el.addEventListener('mousedown', function (ev) {
      if (ev.target === el && el.id !== 'entryModal') closeModal(el.id);
    });
  });

  /* =============================================================
   *  17. 시작
   * ============================================================= */
  function boot() {
    document.title = TITLE + ' · ' + SUBTITLE;
    $('cafeTitle').textContent = TITLE;
    $('cafeSubtitle').textContent = SUBTITLE;
    $('guideWelcome').textContent = TITLE + '에 오신 것을 환영합니다. 자리에 앉아 공부를 시작해 보세요.';

    buildRoom();
    buildNav();
    state.attendance = loadAttendance();

    renderLeaderboard();
    initLive();
    openEntry();
    requestAnimationFrame(loop);
  }

  boot();

  /* 테스트·디버그용 (앱 동작에는 영향 없음) */
  window.CAFE_DEBUG = {
    state: state, seats: SEATS, map: MAP, kiosk: KIOSK,
    sitAt: sitAt, standUp: standUp, addChat: addChat
  };
})();
