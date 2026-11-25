/* =============================================================
 *  제이 스터디 카페 — sprites.js
 *  모든 그림을 코드로 그리는 픽셀아트 엔진 (이미지 파일 없음)
 *  - 배경(벽/바닥/러그), 가구, 캐릭터 10종, 이름표, 프롬프트
 *  - 좌표 단위는 "논리 픽셀" (월드 640 x 400)
 * ============================================================= */

window.SPRITES = (function () {
  'use strict';

  /* ---------------- 색 ---------------- */
  var PAL = {
    out: '#2B2331',
    eye: '#2A2230',
    floorA: '#C8945A',
    floorB: '#C28B50',
    floorC: '#CC9A60',
    floorHi: '#D8A96C',
    floorSeam: '#A9743E',
    floorJoint: '#B37E45',
    wallDark: '#33262F',
    wallTop: '#241A26',
    wainscot: '#5B3A28',
    wainscotHi: '#7A4E33',
    shelfWood: '#5A3826',
    shelfIn: '#2C1D23',
    rugBlue: { edge: '#2E5867', base: '#3C6C7D', line: '#6E9DAC', fringe: '#5B8B9B' },
    rugGreen: { edge: '#4C6A3C', base: '#6A9054', line: '#93B77B', fringe: '#83A96B' },
    rugPurple: { edge: '#4B3860', base: '#6A5183', line: '#8F78A8', fringe: '#806898' }
  };

  var BOOKS = ['#C9635A', '#E0A24C', '#6FA36B', '#6C86C6', '#C9A3D8', '#D8C6A8', '#8B5E3C', '#5FA3A3'];

  /* ---------------- 기본 도구 ---------------- */
  function rect(ctx, x, y, w, h, c) {
    if (w <= 0 || h <= 0) return;
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  function shade(hex, amt) {
    var n = parseInt(hex.slice(1), 16);
    var r = Math.min(255, Math.max(0, (n >> 16) + amt));
    var g = Math.min(255, Math.max(0, ((n >> 8) & 255) + amt));
    var b = Math.min(255, Math.max(0, (n & 255) + amt));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  /* 부드러운 빛무리 (캔버스 1장 재사용) */
  var glowCache = {};
  function glowCanvas(color) {
    if (glowCache[color]) return glowCache[color];
    var size = 64;
    var cv = document.createElement('canvas');
    cv.width = size; cv.height = size;
    var g = cv.getContext('2d');
    var grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grd.addColorStop(0, color);
    grd.addColorStop(0.4, color.replace(/[\d.]+\)$/, '0.45)'));
    grd.addColorStop(1, color.replace(/[\d.]+\)$/, '0)'));
    g.fillStyle = grd;
    g.fillRect(0, 0, size, size);
    glowCache[color] = cv;
    return cv;
  }

  function glow(ctx, cx, cy, r, color) {
    var cv = glowCanvas(color);
    ctx.drawImage(cv, Math.round(cx - r), Math.round(cy - r), Math.round(r * 2), Math.round(r * 2));
  }

  /* =============================================================
   *  배경
   * ============================================================= */
  function drawFloor(ctx, map) {
    var top = map.wallTop, H = map.h, W = map.w;
    rect(ctx, 0, top, W, H - top, PAL.floorB);

    var rowH = 12, row = 0;
    for (var y = top; y < H; y += rowH) {
      var h = Math.min(rowH, H - y);
      var base = row % 3 === 0 ? PAL.floorA : row % 3 === 1 ? PAL.floorB : PAL.floorC;
      rect(ctx, 0, y, W, h, base);
      rect(ctx, 0, y, W, 1, PAL.floorHi);
      rect(ctx, 0, y + h - 1, W, 1, PAL.floorSeam);

      var jx = (row * 53) % 110;
      while (jx < W) {
        rect(ctx, jx, y + 1, 1, h - 2, PAL.floorJoint);
        jx += 92 + ((row * 29) % 52);
      }
      if (row % 4 === 1) rect(ctx, (row * 97) % (W - 12) + 6, y + 5, 4, 1, '#AD7740');
      if (row % 5 === 3) rect(ctx, (row * 191) % (W - 12) + 6, y + 8, 3, 1, '#B98449');
      row++;
    }

    ctx.globalAlpha = 0.09;
    rect(ctx, 0, top, W, 6, '#2A1608');
    rect(ctx, 12, top, 6, H - top, '#2A1608');
    rect(ctx, W - 18, top, 6, H - top, '#2A1608');
    ctx.globalAlpha = 1;
  }

  function drawShelf(ctx, x, y, w, h) {
    rect(ctx, x, y, w, h, PAL.shelfWood);
    rect(ctx, x, y, w, 1, '#7A4E33');
    rect(ctx, x + 1, y + 1, w - 2, h - 3, PAL.shelfIn);

    var rows = [y + 13, y + h - 3];
    for (var r = 0; r < rows.length; r++) {
      var boardY = rows[r];
      rect(ctx, x + 1, boardY, w - 2, 1, '#7A4E33');
      var bx = x + 2, k = 0;
      while (bx < x + w - 3) {
        var bw = (k % 4 === 0) ? 2 : 1;
        if (bx + bw > x + w - 2) break;
        var bh = 5 + ((bx * 7 + boardY) % 3);
        rect(ctx, bx, boardY - bh, bw, bh, BOOKS[(bx + boardY) % BOOKS.length]);
        bx += bw + 1;
        k++;
      }
    }
    rect(ctx, x + w - 9, y + 8, 4, 5, '#9A5433');
    rect(ctx, x + w - 10, y + 6, 6, 3, '#4E7A38');
  }

  function drawWindow(ctx, x, y, w, h) {
    rect(ctx, x - 2, y - 2, w + 4, h + 4, '#5E3C28');
    rect(ctx, x - 1, y - 1, w + 2, h + 2, '#7A4E33');
    rect(ctx, x, y, w, h, '#16233C');
    rect(ctx, x, y, w, 6, '#1B2C4B');
    var stars = [[3, 3], [9, 7], [15, 4], [w - 7, 5], [w - 13, 10], [6, 13], [w - 4, 14], [12, 11]];
    for (var i = 0; i < stars.length; i++) {
      ctx.globalAlpha = i % 2 ? 0.55 : 0.95;
      rect(ctx, x + stars[i][0], y + stars[i][1], 1, 1, '#DCE6FF');
    }
    ctx.globalAlpha = 1;
    rect(ctx, x + w - 14, y + 4, 5, 5, '#F4E7BE');
    rect(ctx, x + w - 15, y + 5, 1, 3, '#F4E7BE');
    rect(ctx, x + w - 9, y + 5, 1, 3, '#F4E7BE');
    rect(ctx, x + w - 13, y + 3, 3, 1, '#F4E7BE');
    rect(ctx, x + w - 13, y + 9, 3, 1, '#F4E7BE');
    rect(ctx, x + Math.floor(w / 2), y, 1, h, '#5E3C28');
    rect(ctx, x, y + Math.floor(h / 2), w, 1, '#5E3C28');
    rect(ctx, x - 3, y + h + 2, w + 6, 3, '#8A5A39');
    rect(ctx, x - 3, y + h + 2, w + 6, 1, '#A46E45');
  }

  function drawClock(ctx, x, y) {
    rect(ctx, x + 1, y, 14, 16, '#5A3826');
    rect(ctx, x, y + 2, 16, 12, '#5A3826');
    rect(ctx, x + 3, y + 2, 10, 12, '#F2EAD2');
    rect(ctx, x + 2, y + 4, 12, 8, '#F2EAD2');
    rect(ctx, x + 8, y + 4, 1, 4, '#3E3230');
    rect(ctx, x + 8, y + 7, 3, 1, '#3E3230');
    rect(ctx, x + 7, y + 10, 3, 1, '#C7BCA0');
  }

  function drawPicture(ctx, x, y) {
    rect(ctx, x, y, 26, 22, '#7A4E33');
    rect(ctx, x + 2, y + 2, 22, 18, '#8FB6C9');
    rect(ctx, x + 2, y + 3, 22, 6, '#A9C8D8');
    rect(ctx, x + 2, y + 13, 22, 7, '#6E9358');
    rect(ctx, x + 6, y + 10, 5, 4, '#7FA85F');
    rect(ctx, x + 16, y + 8, 4, 4, '#4E7A38');
    rect(ctx, x + 17, y + 4, 3, 3, '#F3D27A');
  }

  function drawWalls(ctx, map) {
    var W = map.w, WALL = map.wallTop;
    rect(ctx, 0, 0, W, WALL, PAL.wallDark);
    rect(ctx, 0, 0, W, 6, PAL.wallTop);
    rect(ctx, 0, 6, W, 1, '#4A3742');

    var order = ['shelf', 'window', 'shelf', 'clock', 'window', 'shelf', 'window', 'picture', 'shelf', 'window', 'shelf', 'window', 'shelf'];
    var sizes = { shelf: 36, window: 40, clock: 16, picture: 26 };
    var x = 10;
    for (var i = 0; i < order.length; i++) {
      var t = order[i], w = sizes[t];
      if (x + w > W - 10) break;
      if (t === 'shelf') drawShelf(ctx, x, 7, w, 27);
      else if (t === 'window') drawWindow(ctx, x, 10, w, 22);
      else if (t === 'clock') drawClock(ctx, x, 10);
      else drawPicture(ctx, x, 10);
      x += w + 5;
    }

    rect(ctx, 0, WALL - 9, W, 9, PAL.wainscot);
    rect(ctx, 0, WALL - 9, W, 2, PAL.wainscotHi);
    rect(ctx, 0, WALL - 1, W, 1, '#311E14');

    rect(ctx, 0, WALL, 12, map.h - WALL, '#4A2F22');
    rect(ctx, 10, WALL, 2, map.h - WALL, '#5C3A29');
    rect(ctx, W - 12, WALL, 12, map.h - WALL, '#4A2F22');
    rect(ctx, W - 12, WALL, 2, map.h - WALL, '#5C3A29');
    rect(ctx, 0, map.h - 9, W, 9, '#4A2F22');
    rect(ctx, 0, map.h - 9, W, 2, '#5C3A29');

    /* 스트링 라이트 */
    rect(ctx, 8, 4, W - 16, 1, '#1E1622');
    for (var lx = 26; lx < W - 20; lx += 34) {
      rect(ctx, lx, 4, 1, 3, '#2A2030');
      rect(ctx, lx - 1, 7, 3, 2, '#FFDB96');
      glow(ctx, lx + 0.5, 8, 10, 'rgba(255, 208, 128, 0.28)');
    }
  }

  function drawRug(ctx, z, R) {
    ctx.globalAlpha = 0.16;
    rect(ctx, z.x + 3, z.y + 4, z.w, z.h, '#1A0F08');
    ctx.globalAlpha = 1;

    rect(ctx, z.x, z.y, z.w, z.h, R.edge);
    rect(ctx, z.x + 2, z.y + 2, z.w - 4, z.h - 4, R.base);
    rect(ctx, z.x + 2, z.y + 2, z.w - 4, 1, shade(R.base, 12));
    rect(ctx, z.x + 2, z.y + z.h - 3, z.w - 4, 1, shade(R.base, -14));

    var m = 7;
    rect(ctx, z.x + m, z.y + m, z.w - 2 * m, 1, R.line);
    rect(ctx, z.x + m, z.y + z.h - m - 1, z.w - 2 * m, 1, R.line);
    rect(ctx, z.x + m, z.y + m, 1, z.h - 2 * m, R.line);
    rect(ctx, z.x + z.w - m - 1, z.y + m, 1, z.h - 2 * m, R.line);

    var ticks = [
      [z.x + 3, z.y + 3], [z.x + z.w - 5, z.y + 3],
      [z.x + 3, z.y + z.h - 5], [z.x + z.w - 5, z.y + z.h - 5]
    ];
    for (var i = 0; i < ticks.length; i++) rect(ctx, ticks[i][0], ticks[i][1], 2, 2, R.line);

    /* 술 장식 */
    for (var fx = z.x + 8; fx < z.x + z.w - 6; fx += 12) {
      ctx.globalAlpha = 0.55;
      rect(ctx, fx, z.y - 2, 2, 2, R.fringe);
      rect(ctx, fx, z.y + z.h, 2, 2, R.fringe);
      ctx.globalAlpha = 1;
    }

    ctx.globalAlpha = 0.05;
    for (var yy = z.y + 5; yy < z.y + z.h - 5; yy += 5) rect(ctx, z.x + 3, yy, z.w - 6, 1, '#000000');
    ctx.globalAlpha = 1;
  }

  function drawBackground(ctx, map) {
    drawFloor(ctx, map);
    drawWalls(ctx, map);
    drawRug(ctx, map.zones.shared, PAL.rugBlue);
    drawRug(ctx, map.zones.focus, PAL.rugGreen);
    drawRug(ctx, map.zones.lounge, PAL.rugPurple);
  }

  /* =============================================================
   *  소품
   * ============================================================= */
  function drawLaptop(ctx, x, y) {
    /* y = 노트북 바닥 */
    glow(ctx, x, y - 10, 14, 'rgba(90, 210, 220, 0.16)');
    rect(ctx, x - 7, y - 16, 14, 9, '#2A3140');
    rect(ctx, x - 7, y - 16, 14, 1, '#3A4354');
    rect(ctx, x - 6, y - 15, 12, 7, '#5AC8D0');
    rect(ctx, x - 6, y - 15, 12, 1, '#9BE8EC');
    rect(ctx, x - 5, y - 13, 4, 1, '#3FA3AC');
    rect(ctx, x - 5, y - 11, 7, 1, '#3FA3AC');
    rect(ctx, x - 5, y - 9, 5, 1, '#3FA3AC');
    rect(ctx, x - 8, y - 7, 16, 4, '#3E4655');
    rect(ctx, x - 7, y - 7, 14, 1, '#5A6478');
    rect(ctx, x - 6, y - 5, 12, 1, '#2E3542');
    rect(ctx, x - 8, y - 3, 16, 3, '#333A47');
    rect(ctx, x - 7, y - 2, 14, 1, '#4B5566');
  }

  function drawLamp(ctx, x, y) {
    glow(ctx, x, y - 11, 28, 'rgba(255, 205, 120, 0.22)');
    rect(ctx, x - 4, y - 3, 9, 3, '#6B4A2A');
    rect(ctx, x - 4, y - 3, 9, 1, '#8A6337');
    rect(ctx, x - 1, y - 10, 2, 7, '#7C5636');
    /* 갓 (위가 좁은 사다리꼴) */
    rect(ctx, x - 2, y - 18, 5, 2, '#FFE3A6');
    rect(ctx, x - 3, y - 16, 7, 2, '#F6D283');
    rect(ctx, x - 4, y - 14, 9, 2, '#F2C46B');
    rect(ctx, x - 5, y - 12, 11, 2, '#E6B45C');
    rect(ctx, x - 5, y - 10, 11, 1, '#C08F3F');
  }

  function drawBooks(ctx, x, y) {
    rect(ctx, x - 6, y - 2, 13, 2, '#B85C4E');
    rect(ctx, x - 6, y - 2, 13, 1, '#D4715F');
    rect(ctx, x - 5, y - 4, 11, 2, '#E0A24C');
    rect(ctx, x - 4, y - 6, 9, 2, '#6C86C6');
    rect(ctx, x - 3, y - 7, 4, 1, '#F2E6C8');
    rect(ctx, x + 2, y - 8, 5, 2, '#7FA85F');
  }

  function drawMug(ctx, x, y) {
    rect(ctx, x - 2, y - 4, 4, 4, '#EFE7D2');
    rect(ctx, x - 2, y - 4, 4, 1, '#FFF8E6');
    rect(ctx, x + 2, y - 3, 1, 2, '#EFE7D2');
    rect(ctx, x - 1, y - 3, 2, 1, '#8A5B3A');
    ctx.globalAlpha = 0.45;
    rect(ctx, x, y - 7, 1, 2, '#FFFFFF');
    rect(ctx, x + 2, y - 9, 1, 1, '#FFFFFF');
    ctx.globalAlpha = 1;
  }

  function drawMiniPlant(ctx, x, y) {
    rect(ctx, x - 2, y - 3, 4, 3, '#9A5433');
    rect(ctx, x - 3, y - 5, 6, 2, '#4E7A38');
    rect(ctx, x - 1, y - 7, 3, 2, '#5E8F42');
  }

  function drawMonitor(ctx, x, y) {
    glow(ctx, x, y - 13, 18, 'rgba(90, 210, 220, 0.14)');
    rect(ctx, x - 9, y - 18, 18, 11, '#2A3140');
    rect(ctx, x - 8, y - 17, 16, 9, '#4FB6C0');
    rect(ctx, x - 8, y - 17, 16, 1, '#8CE2E8');
    rect(ctx, x - 6, y - 15, 6, 1, '#3F94A0');
    rect(ctx, x - 6, y - 13, 9, 1, '#3F94A0');
    rect(ctx, x - 6, y - 11, 5, 1, '#3F94A0');
    rect(ctx, x - 2, y - 7, 4, 3, '#3E4655');
    rect(ctx, x - 6, y - 4, 12, 2, '#2A3140');
    rect(ctx, x - 6, y - 4, 12, 1, '#454F62');
  }

  /* =============================================================
   *  가구
   * ============================================================= */
  function drawTable(ctx, o) {
    var x = o.x, y = o.y, w = o.w, h = o.h;
    ctx.globalAlpha = 0.17;
    rect(ctx, x + 4, y + h, w - 4, 4, '#241608');
    ctx.globalAlpha = 1;

    /* 어두운 실루엣 */
    rect(ctx, x - 2, y - 1, w + 4, h + 2, '#4A2B1A');

    /* 다리 */
    rect(ctx, x + 6, y + h - 2, 6, 7, '#6B4026');
    rect(ctx, x + w - 12, y + h - 2, 6, 7, '#6B4026');
    rect(ctx, x + w / 2 - 3, y + h - 2, 6, 6, '#7C4A2B');

    /* 앞면(두께) */
    rect(ctx, x, y + h - 8, w, 8, '#8A5533');
    rect(ctx, x, y + h - 8, w, 2, '#A2663F');
    rect(ctx, x, y + h - 1, w, 1, '#6E4227');

    /* 상판 */
    rect(ctx, x - 1, y, w + 2, h - 7, '#BE7F4A');
    rect(ctx, x - 1, y, w + 2, 2, '#D69A60');
    rect(ctx, x - 1, y + h - 9, w + 2, 1, '#9A6234');
    for (var gx = x + 14; gx < x + w - 16; gx += 32) {
      rect(ctx, gx, y + 6, 22, 1, '#AC7040');
      rect(ctx, gx + 6, y + 11, 16, 1, '#B77C48');
    }

    /* 위에 놓인 것들 */
    var sb = y + h - 8;
    var items = o.items || [];
    for (var i = 0; i < items.length; i++) {
      var it = items[i], ix = x + it.dx;
      if (it.t === 'laptop') drawLaptop(ctx, ix, sb - 1);
      else if (it.t === 'lamp') drawLamp(ctx, ix, sb);
      else if (it.t === 'books') drawBooks(ctx, ix, sb - 3);
      else if (it.t === 'mug') drawMug(ctx, ix, sb - 3);
      else if (it.t === 'plant') drawMiniPlant(ctx, ix, sb - 3);
      else if (it.t === 'monitor') drawMonitor(ctx, ix, sb);
    }
  }

  function drawChair(ctx, o) {
    var x = o.x, y = o.y, w = o.w, h = o.h, back = o.back || 'top';
    ctx.globalAlpha = 0.16;
    rect(ctx, x + 2, y + h, w - 4, 3, '#241608');
    ctx.globalAlpha = 1;

    /* 어두운 실루엣 */
    rect(ctx, x + 1, y, w - 2, h - 1, '#4A2B1A');
    rect(ctx, x, y + 2, w, h - 5, '#4A2B1A');

    var topBack = back === 'top';
    var backY = topBack ? y + 1 : y + h - 6;
    var seatY = topBack ? y + 6 : y + 1;

    /* 등받이 */
    rect(ctx, x + 2, backY, w - 4, 5, '#8A5530');
    rect(ctx, x + 3, backY + 1, w - 6, 3, '#A2683C');
    if (topBack) rect(ctx, x + 3, backY + 1, w - 6, 1, '#C0834C');
    else rect(ctx, x + 3, backY + 3, w - 6, 1, '#6B3E24');

    /* 좌판 */
    rect(ctx, x + 1, seatY, w - 2, 7, '#7A4526');
    rect(ctx, x + 2, seatY + 1, w - 4, 5, '#C0834C');
    rect(ctx, x + 2, seatY + 1, w - 4, 1, '#DBA065');
    rect(ctx, x + 2, seatY + 5, w - 4, 1, '#9A6236');

    /* 다리 */
    rect(ctx, x + 2, y + h - 2, 2, 2, '#3E2415');
    rect(ctx, x + w - 4, y + h - 2, 2, 2, '#3E2415');
  }

  function drawStool(ctx, o) {
    var x = o.x, y = o.y, w = o.w, h = o.h;
    ctx.globalAlpha = 0.16;
    rect(ctx, x + 1, y + h, w - 2, 2, '#241608');
    ctx.globalAlpha = 1;
    rect(ctx, x + 2, y + h - 5, 2, 6, '#6B4026');
    rect(ctx, x + w - 4, y + h - 5, 2, 6, '#6B4026');
    rect(ctx, x + 2, y + h - 8, w - 4, 1, '#7C4A2B');
    rect(ctx, x, y + 2, w, h - 8, '#8A5530');
    rect(ctx, x + 1, y + 3, w - 2, h - 11, '#C0834C');
    rect(ctx, x + 1, y + 3, w - 2, 1, '#DBA065');
    rect(ctx, x + 1, y, w - 2, 3, '#7C4A2A');
    rect(ctx, x + 2, y + 1, w - 4, 1, '#A2683C');
  }

  function drawSofa(ctx, o) {
    var x = o.x, y = o.y, w = o.w, h = o.h, back = o.back || 'top';
    var topBack = back === 'top';
    ctx.globalAlpha = 0.18;
    rect(ctx, x + 3, y + h, w - 4, 4, '#241608');
    ctx.globalAlpha = 1;

    /* 어두운 실루엣 */
    rect(ctx, x - 1, y - 1, w + 2, h + 2, '#17332F');

    rect(ctx, x + 4, y + h - 4, 3, 5, '#6B4026');
    rect(ctx, x + w - 7, y + h - 4, 3, 5, '#6B4026');

    var backY = topBack ? y : y + h - 11;
    var seatY = topBack ? y + 10 : y + 4;

    /* 등받이 */
    rect(ctx, x + 2, backY, w - 4, 11, '#255C57');
    rect(ctx, x + 3, backY + 1, w - 6, 9, '#337A70');
    rect(ctx, x + 4, backY + 1, w - 8, 1, '#4E9E92');
    rect(ctx, x + 3, topBack ? backY + 9 : backY + 1, w - 6, 2, '#1F4E4A');

    /* 팔걸이 */
    rect(ctx, x, y, 6, h, '#2B6E67');
    rect(ctx, x + w - 6, y, 6, h, '#2B6E67');
    rect(ctx, x, y, 6, 2, '#3A857B');
    rect(ctx, x + w - 6, y, 6, 2, '#3A857B');
    rect(ctx, x, y + h - 3, 6, 3, '#245B56');
    rect(ctx, x + w - 6, y + h - 3, 6, 3, '#245B56');

    /* 쿠션 3개 */
    var cw = Math.floor((w - 14) / 3);
    for (var i = 0; i < 3; i++) {
      var cx = x + 7 + i * cw;
      rect(ctx, cx, seatY, cw - 2, h - 15, '#3E9587');
      rect(ctx, cx, seatY, cw - 2, 1, '#57B2A3');
      rect(ctx, cx, seatY + h - 16, cw - 2, 1, '#2F7A70');
      rect(ctx, cx + cw - 3, seatY, 1, h - 15, '#2F7A70');
    }

    /* 앞 스커트 */
    rect(ctx, x + 4, y + h - 4, w - 8, 2, '#2A6B64');
  }

  function drawArmchair(ctx, o) {
    var x = o.x, y = o.y, w = o.w, h = o.h;
    ctx.globalAlpha = 0.18;
    rect(ctx, x + 3, y + h, w - 4, 3, '#241608');
    ctx.globalAlpha = 1;
    rect(ctx, x - 1, y - 1, w + 2, h + 2, '#17332F');
    rect(ctx, x + 4, y + h - 3, 3, 4, '#6B4026');
    rect(ctx, x + w - 7, y + h - 3, 3, 4, '#6B4026');

    rect(ctx, x + 3, y, w - 6, 11, '#255C57');
    rect(ctx, x + 4, y + 1, w - 8, 9, '#337A70');
    rect(ctx, x + 5, y + 1, w - 10, 1, '#4E9E92');
    rect(ctx, x + 4, y + 9, w - 8, 2, '#1F4E4A');

    rect(ctx, x, y, 6, h, '#2B6E67');
    rect(ctx, x + w - 6, y, 6, h, '#2B6E67');
    rect(ctx, x, y, 6, 2, '#3A857B');
    rect(ctx, x + w - 6, y, 6, 2, '#3A857B');

    rect(ctx, x + 7, y + 11, w - 14, h - 18, '#3E9587');
    rect(ctx, x + 7, y + 11, w - 14, 1, '#57B2A3');
    rect(ctx, x + 7, y + h - 8, w - 14, 1, '#2F7A70');
    rect(ctx, x + 5, y + h - 3, w - 10, 2, '#2A6B64');
  }

  function drawCoffeeTable(ctx, o) {
    var x = o.x, y = o.y, w = o.w, h = o.h;
    ctx.globalAlpha = 0.16;
    rect(ctx, x + 3, y + h, w - 2, 3, '#241608');
    ctx.globalAlpha = 1;
    rect(ctx, x + 4, y + h - 3, 3, 5, '#6B4026');
    rect(ctx, x + w - 7, y + h - 3, 3, 5, '#6B4026');
    /* 하단 선반 */
    rect(ctx, x + 4, y + h - 7, w - 8, 2, '#7C4A2B');
    /* 상판 */
    rect(ctx, x, y, w, h - 4, '#A9683B');
    rect(ctx, x + 1, y + 1, w - 2, 3, '#C0834C');
    rect(ctx, x, y + h - 5, w, 2, '#8A5530');
    if (w > 40) {
      drawMug(ctx, x + 12, y + 10);
      drawBooks(ctx, x + w - 15, y + 13);
      rect(ctx, x + w - 26, y + 6, 4, 1, '#E8DCC0');
    }
  }

  function drawDesk(ctx, o) {
    var x = o.x, y = o.y, w = o.w, h = o.h;
    ctx.globalAlpha = 0.16;
    rect(ctx, x + 3, y + h, w - 4, 3, '#241608');
    ctx.globalAlpha = 1;
    rect(ctx, x + 4, y + h - 4, 4, 6, '#6B4026');
    rect(ctx, x + w - 8, y + h - 4, 4, 6, '#6B4026');
    rect(ctx, x, y + h - 5, w, 5, '#8A5533');
    rect(ctx, x, y + h - 5, w, 1, '#A2663F');
    rect(ctx, x - 1, y, w + 2, h - 5, '#BE7F4A');
    rect(ctx, x - 1, y, w + 2, 2, '#D69A60');
    drawMonitor(ctx, x + Math.round(w * 0.34), y + 8);
    drawLamp(ctx, x + Math.round(w * 0.72), y + 9);
    if (w > 52) drawMug(ctx, x + w - 10, y + 10);
  }

  function drawBooth(ctx, o) {
    var x = o.x, y = o.y, w = o.w, h = o.h;
    /* 뒤 패널 */
    rect(ctx, x, y, w, 14, '#6B4026');
    rect(ctx, x, y, w, 2, '#8B5836');
    rect(ctx, x + 1, y + 2, w - 2, 11, '#5E3826');
    rect(ctx, x + 2, y + 3, w - 4, 1, '#7A4A2E');
    /* 작은 선반 + 책 */
    rect(ctx, x + 5, y + 5, w - 10, 1, '#8B5836');
    for (var b = 0; b < 6; b++) {
      rect(ctx, x + 7 + b * 5, y + 2, 3, 3, BOOKS[(b + x) % BOOKS.length]);
    }
    /* 명패 */
    rect(ctx, x + w - 22, y + 7, 14, 4, '#D9C9A2');
    rect(ctx, x + w - 21, y + 8, 12, 2, '#F1E7CE');

    /* 옆 패널 */
    rect(ctx, x, y, 4, h - 10, '#7A4A2E');
    rect(ctx, x + w - 4, y, 4, h - 10, '#7A4A2E');
    rect(ctx, x, y, 1, h - 10, '#8B5836');
    rect(ctx, x + w - 1, y, 1, h - 10, '#8B5836');
    rect(ctx, x, y, 6, 3, '#8B5836');
    rect(ctx, x + w - 6, y, 6, 3, '#8B5836');

    /* 책상 */
    var dy = y + 28;
    ctx.globalAlpha = 0.18;
    rect(ctx, x + 3, dy + 16, w - 6, 3, '#241608');
    ctx.globalAlpha = 1;
    rect(ctx, x + 5, dy + 15, 4, 5, '#6B4026');
    rect(ctx, x + w - 9, dy + 15, 4, 5, '#6B4026');
    rect(ctx, x + 3, dy + 11, w - 6, 5, '#8A5533');
    rect(ctx, x + 2, dy, w - 4, 12, '#BE7F4A');
    rect(ctx, x + 2, dy, w - 4, 2, '#D69A60');
    rect(ctx, x + 2, dy + 11, w - 4, 1, '#9A6234');

    drawLaptop(ctx, x + Math.round(w * 0.32), dy + 8);
    drawLamp(ctx, x + Math.round(w * 0.68), dy + 8);
    drawBooks(ctx, x + 12, dy + 8);
  }

  function drawPlant(ctx, o) {
    var x = o.x, y = o.y + o.h, s = o.s || 1;
    ctx.globalAlpha = 0.18;
    rect(ctx, x - 8 * s, y - 3, 16 * s, 3, '#241608');
    ctx.globalAlpha = 1;
    rect(ctx, x - 5 * s, y - 10 * s, 10 * s, 9 * s, '#A2583A');
    rect(ctx, x - 6 * s, y - 12 * s, 12 * s, 3 * s, '#BC6A45');
    rect(ctx, x - 5 * s, y - 10 * s, 3 * s, 9 * s, '#B96B47');
    rect(ctx, x - 4 * s, y - 12 * s, 8 * s, 1, '#4A3323');

    rect(ctx, x - 7 * s, y - 18 * s, 7 * s, 7 * s, '#45702F');
    rect(ctx, x - 3 * s, y - 22 * s, 6 * s, 10 * s, '#5E8F42');
    rect(ctx, x + 2 * s, y - 19 * s, 5 * s, 8 * s, '#4E7A38');
    rect(ctx, x - 8 * s, y - 21 * s, 4 * s, 6 * s, '#6BA04C');
    rect(ctx, x - 5 * s, y - 20 * s, 3 * s, 2 * s, '#7FB25A');
    rect(ctx, x - 1 * s, y - 21 * s, 2 * s, 3 * s, '#7FB25A');
    rect(ctx, x + 1 * s, y - 16 * s, 2 * s, 2 * s, '#3F6829');
  }

  function drawFloorLamp(ctx, o) {
    var x = o.x, y = o.y + o.h;
    glow(ctx, x, y - 40, 46, 'rgba(255, 205, 130, 0.20)');
    rect(ctx, x - 5, y - 3, 11, 3, '#3E4655');
    rect(ctx, x - 4, y - 4, 9, 1, '#59637A');
    rect(ctx, x - 1, y - 40, 2, 37, '#4A5163');
    rect(ctx, x - 6, y - 50, 13, 10, '#F2C46B');
    rect(ctx, x - 5, y - 50, 11, 1, '#FFE3A6');
    rect(ctx, x - 6, y - 42, 13, 2, '#C08F3F');
    rect(ctx, x - 3, y - 47, 7, 5, '#FFD98C');
  }

  function drawKiosk(ctx, o) {
    var x = o.x, y = o.y, w = o.w, h = o.h;
    ctx.globalAlpha = 0.18;
    rect(ctx, x + 2, y + h, w - 2, 3, '#241608');
    ctx.globalAlpha = 1;

    rect(ctx, x + 1, y + h - 5, w - 2, 5, '#3A3F55');
    rect(ctx, x + 1, y + h - 5, w - 2, 1, '#4E5570');
    rect(ctx, x + 5, y + h - 22, w - 10, 18, '#454C68');
    rect(ctx, x + 5, y + h - 22, 3, 18, '#59617F');

    rect(ctx, x, y, w, 30, '#1E2740');
    rect(ctx, x, y, w, 1, '#39456B');
    rect(ctx, x + 2, y + 2, w - 4, 26, '#243350');
    rect(ctx, x + 4, y + 5, w - 8, 20, '#2C6E8A');
    glow(ctx, x + w / 2, y + 15, 28, 'rgba(80, 200, 220, 0.20)');
    rect(ctx, x + 4, y + 5, w - 8, 1, '#8FE0EA');
    rect(ctx, x + 6, y + 8, w - 12, 2, '#A8EAF0');
    rect(ctx, x + 6, y + 12, w - 16, 1, '#79CFDB');
    rect(ctx, x + 6, y + 15, w - 12, 1, '#79CFDB');
    rect(ctx, x + 6, y + 18, w - 14, 1, '#79CFDB');
    rect(ctx, x + 6, y + 22, 9, 2, '#F3D27A');
    rect(ctx, x + w - 10, y + 25, 6, 3, '#43507A');

    /* 표지판 글자는 drawKioskSign()에서 HiDPI 텍스트 패스로 그린다 */
  }

  function drawCounter(ctx, o) {
    var x = o.x, y = o.y, w = o.w, h = o.h;
    ctx.globalAlpha = 0.17;
    rect(ctx, x + 3, y + h, w - 3, 4, '#241608');
    ctx.globalAlpha = 1;

    /* 앞면 */
    rect(ctx, x, y + h - 13, w, 13, '#7A4A2E');
    for (var sx = x + 2; sx < x + w - 2; sx += 5) rect(ctx, sx, y + h - 12, 1, 11, '#5E3826');
    rect(ctx, x, y + h - 2, w, 2, '#4E2E1F');

    /* 상판 */
    rect(ctx, x - 3, y, w + 6, h - 12, '#BE7F4A');
    rect(ctx, x - 3, y, w + 6, 2, '#D69A60');
    rect(ctx, x - 3, y + h - 14, w + 6, 2, '#9A6234');
    rect(ctx, x - 4, y + 2, 2, h - 16, '#8A5533');
    rect(ctx, x + w + 2, y + 2, 2, h - 16, '#8A5533');

    drawLaptop(ctx, x + 24, y + h - 15);
    drawLamp(ctx, x + 62, y + h - 16);
    drawLaptop(ctx, x + 100, y + h - 15);
    drawBooks(ctx, x + 128, y + h - 17);
  }

  function drawSideTable(ctx, o) {
    var x = o.x, y = o.y, w = o.w, h = o.h;
    ctx.globalAlpha = 0.16;
    rect(ctx, x + 2, y + h, w - 2, 3, '#241608');
    ctx.globalAlpha = 1;
    rect(ctx, x + 5, y + h - 3, 3, 5, '#6B4026');
    rect(ctx, x + w - 8, y + h - 3, 3, 5, '#6B4026');
    rect(ctx, x, y, w, h - 3, '#A9683B');
    rect(ctx, x + 1, y + 1, w - 2, 3, '#C0834C');
    rect(ctx, x, y + h - 4, w, 1, '#8A5530');
    drawMug(ctx, x + 11, y + 9);
    drawBooks(ctx, x + w - 13, y + 12);
  }

  function drawBookCart(ctx, o) {
    var x = o.x, y = o.y, w = o.w, h = o.h;
    ctx.globalAlpha = 0.16;
    rect(ctx, x + 2, y + h, w - 4, 3, '#241608');
    ctx.globalAlpha = 1;
    rect(ctx, x - 1, y - 1, w + 2, h + 2, '#3E2A1C');
    rect(ctx, x, y, w, h, '#8A5530');
    rect(ctx, x, y, w, 2, '#A2663F');
    rect(ctx, x + 1, y + 3, w - 2, h - 5, '#5E3826');
    /* 책 더미 */
    for (var i = 0; i < 5; i++) {
      var bh = 4 + (i % 3);
      rect(ctx, x + 3 + i * 7, y + 3, 5, bh, BOOKS[(i + x) % BOOKS.length]);
      rect(ctx, x + 3 + i * 7, y + 3, 5, 1, shade(BOOKS[(i + x) % BOOKS.length], 26));
    }
    rect(ctx, x + 2, y + h - 4, 2, 4, '#3E2A1C');
    rect(ctx, x + w - 4, y + h - 4, 2, 4, '#3E2A1C');
  }

  function drawFurniture(ctx, o) {
    switch (o.type) {
      case 'table': drawTable(ctx, o); break;
      case 'chair': drawChair(ctx, o); break;
      case 'stool': drawStool(ctx, o); break;
      case 'sofa': drawSofa(ctx, o); break;
      case 'armchair': drawArmchair(ctx, o); break;
      case 'coffeeTable': drawCoffeeTable(ctx, o); break;
      case 'booth': drawBooth(ctx, o); break;
      case 'desk': drawDesk(ctx, o); break;
      case 'plant': drawPlant(ctx, o); break;
      case 'kiosk': drawKiosk(ctx, o); break;
      case 'counter': drawCounter(ctx, o); break;
      case 'sideTable': drawSideTable(ctx, o); break;
      case 'floorLamp': drawFloorLamp(ctx, o); break;
      case 'bookCart': drawBookCart(ctx, o); break;
    }
  }

  /* =============================================================
   *  캐릭터 (키 30px · 큰 머리 12x12)
   * ============================================================= */
  var OUT = '#2B2331';

  function hairBack(ctx, c, x, top) {
    var style = c.hairStyle, hair = c.hair, accent = c.accent || c.shirt;
    switch (style) {
      case 'bob':
        rect(ctx, x - 7, top - 1, 14, 17, hair);
        break;
      case 'long':
        rect(ctx, x - 7, top - 1, 14, 23, hair);
        break;
      case 'ponytail':
        rect(ctx, x - 6, top - 1, 12, 7, hair);
        rect(ctx, x + 6, top + 2, 4, 13, hair);
        rect(ctx, x + 7, top + 5, 2, 3, accent);
        break;
      case 'bun':
        rect(ctx, x - 6, top - 1, 12, 7, hair);
        rect(ctx, x - 3, top - 7, 7, 6, hair);
        rect(ctx, x - 2, top - 6, 4, 3, shade(hair, 26));
        break;
      case 'afro':
        rect(ctx, x - 8, top - 4, 16, 10, hair);
        rect(ctx, x - 8, top + 1, 16, 5, hair);
        break;
      case 'beanie':
      case 'cap':
        rect(ctx, x - 7, top - 2, 14, 6, accent);
        break;
      case 'hood':
        rect(ctx, x - 8, top - 3, 16, 17, c.shirt);
        break;
      default:
        rect(ctx, x - 6, top - 1, 12, 6, hair);
    }
  }

  function hairFront(ctx, c, x, top, dir) {
    var style = c.hairStyle, hair = c.hair, accent = c.accent || c.shirt;
    var hairD = shade(hair, -26);
    var hairL = shade(hair, 22);

    if (dir === 'up') {
      rect(ctx, x - 6, top, 12, 10, hair);
      rect(ctx, x - 6, top, 12, 2, hairL);
      rect(ctx, x + 4, top + 2, 2, 8, hairD);
      rect(ctx, x - 2, top + 5, 4, 1, hairD);
      return;
    }

    switch (style) {
      case 'bob':
        rect(ctx, x - 6, top, 12, 3, hair);
        rect(ctx, x - 6, top + 1, 12, 1, hairL);
        rect(ctx, x - 6, top + 3, 4, 2, hair);
        rect(ctx, x + 2, top + 3, 4, 2, hair);
        rect(ctx, x - 6, top + 3, 1, 9, hair);
        rect(ctx, x + 5, top + 3, 1, 9, hair);
        break;
      case 'long':
        rect(ctx, x - 6, top, 12, 3, hair);
        rect(ctx, x - 6, top + 1, 12, 1, hairL);
        rect(ctx, x - 7, top + 3, 1, 16, hair);
        rect(ctx, x + 6, top + 3, 1, 16, hair);
        rect(ctx, x - 6, top + 3, 4, 1, hair);
        rect(ctx, x + 2, top + 3, 4, 1, hair);
        break;
      case 'ponytail':
        rect(ctx, x - 6, top, 12, 3, hair);
        rect(ctx, x - 6, top + 1, 12, 1, hairL);
        rect(ctx, x - 6, top + 3, 4, 1, hair);
        rect(ctx, x + 2, top + 3, 3, 1, hair);
        rect(ctx, x - 1, top + 1, 4, 1, hairL);
        break;
      case 'bun':
        rect(ctx, x - 6, top, 12, 3, hair);
        rect(ctx, x - 6, top + 1, 12, 1, hairL);
        rect(ctx, x - 6, top + 3, 3, 1, hair);
        rect(ctx, x + 2, top + 3, 3, 1, hair);
        rect(ctx, x + 4, top + 2, 2, 5, hairD);
        break;
      case 'afro':
        rect(ctx, x - 7, top - 3, 14, 7, hair);
        rect(ctx, x - 7, top - 3, 14, 1, hairL);
        rect(ctx, x - 6, top + 4, 3, 1, hair);
        rect(ctx, x + 3, top + 4, 3, 1, hair);
        break;
      case 'beanie':
        rect(ctx, x - 7, top - 2, 14, 6, accent);
        rect(ctx, x - 7, top + 4, 14, 2, shade(accent, -34));
        rect(ctx, x - 3, top - 3, 6, 1, shade(accent, 22));
        rect(ctx, x + 4, top, 2, 4, shade(accent, -16));
        break;
      case 'cap':
        rect(ctx, x - 7, top - 2, 14, 5, accent);
        rect(ctx, x - 7, top + 3, 14, 2, shade(accent, -38));
        rect(ctx, x + 2, top - 2, 5, 3, shade(accent, -20));
        rect(ctx, x - 7, top - 2, 14, 1, shade(accent, 18));
        break;
      case 'hood':
        rect(ctx, x - 8, top - 3, 3, 14, c.shirt);
        rect(ctx, x + 5, top - 3, 3, 14, c.shirt);
        rect(ctx, x - 6, top - 3, 12, 3, c.shirt);
        rect(ctx, x - 8, top - 3, 16, 1, shade(c.shirt, 16));
        rect(ctx, x - 8, top + 10, 16, 1, shade(c.shirt, -24));
        rect(ctx, x - 2, top + 9, 4, 1, shade(c.shirt, -30));
        break;
      default: /* short */
        rect(ctx, x - 6, top, 12, 3, hair);
        rect(ctx, x - 6, top + 1, 12, 1, hairL);
        rect(ctx, x - 6, top + 3, 3, 2, hair);
        rect(ctx, x + 3, top + 3, 3, 2, hair);
        rect(ctx, x + 4, top + 1, 2, 4, hairD);
    }
  }

  function drawCharacter(ctx, c, o) {
    var x = Math.round(o.x);
    var dir = o.dir || 'down';
    var sitting = !!o.sitting;
    var walking = !!o.walking && !sitting;
    var frame = (o.frame | 0) % 4;
    var bob = walking ? (frame === 1 || frame === 3 ? -1 : 0) : 0;
    var y = Math.round(o.y) + bob;

    var skin = c.skin;
    var skinD = shade(skin, -18);
    var shirt = c.shirt;
    var shirtD = c.shirtDark || shade(shirt, -22);
    var shirtL = shade(shirt, 18);
    var pants = c.pants;
    var shoes = c.shoes || shade(pants, -24);

    if (!sitting) {
      ctx.globalAlpha = 0.25;
      rect(ctx, x - 7, o.y - 2, 14, 3, '#1B1119');
      rect(ctx, x - 4, o.y - 3, 8, 1, '#1B1119');
      ctx.globalAlpha = 1;
    }

    var headTop = sitting ? y - 28 : y - 30;
    var bodyTop = headTop + 11;
    var bodyH = 8;

    /* 외곽선 실루엣 */
    rect(ctx, x - 7, headTop - 1, 14, 13, OUT);
    rect(ctx, x - 8, bodyTop - 1, 16, bodyH + 3, OUT);
    if (!sitting) rect(ctx, x - 5, y - 12, 11, 12, OUT);
    else rect(ctx, x - 6, y - 9, 12, 9, OUT);

    /* 뒷머리 */
    hairBack(ctx, c, x, headTop);

    /* 다리 */
    if (sitting) {
      /* 허벅지 (앞으로 굽은 무릎) */
      rect(ctx, x - 5, y - 9, 10, 6, pants);
      rect(ctx, x - 5, y - 9, 10, 1, shade(pants, 16));
      rect(ctx, x - 5, y - 4, 4, 3, shade(pants, -8));
      rect(ctx, x + 1, y - 4, 4, 3, shade(pants, -8));
      rect(ctx, x - 5, y - 1, 4, 1, shoes);
      rect(ctx, x + 1, y - 1, 4, 1, shoes);
    } else {
      var swing = walking ? (frame % 2 === 0 ? 1 : -1) : 0;
      rect(ctx, x - 4, y - 11, 3, 8, pants);
      rect(ctx, x + 2, y - 11, 3, 8, pants);
      rect(ctx, x - 4, y - 11, 3, 2, shade(pants, 16));
      rect(ctx, x + 2, y - 11, 3, 2, shade(pants, 16));
      rect(ctx, x - 5 + swing, y - 3, 4, 2, shoes);
      rect(ctx, x + 1 - swing, y - 3, 4, 2, shoes);
    }

    /* 몸통 */
    rect(ctx, x - 5, bodyTop, 10, bodyH, shirt);
    rect(ctx, x + 3, bodyTop, 2, bodyH, shirtD);
    rect(ctx, x - 5, bodyTop, 2, bodyH, shirtL);
    rect(ctx, x - 5, bodyTop, 10, 1, shade(shirt, 26));
    rect(ctx, x - 5, bodyTop + bodyH - 2, 10, 1, shade(shirt, -16));
    /* 깃 */
    rect(ctx, x - 2, bodyTop + 1, 4, 1, shade(shirt, -30));
    rect(ctx, x - 3, bodyTop + 1, 1, 2, shade(shirt, -22));
    rect(ctx, x + 2, bodyTop + 1, 1, 2, shade(shirt, -22));

    /* 팔 */
    rect(ctx, x - 7, bodyTop + 1, 2, 6, shirtD);
    rect(ctx, x + 5, bodyTop + 1, 2, 6, shirtD);
    rect(ctx, x - 7, bodyTop + 1, 1, 6, shade(shirtD, 14));
    rect(ctx, x + 5, bodyTop + 1, 1, 6, shade(shirtD, 14));
    rect(ctx, x - 7, bodyTop + 7, 2, 2, skin);
    rect(ctx, x + 5, bodyTop + 7, 2, 2, skin);

    /* 목 */
    rect(ctx, x - 1, headTop + 10, 3, 2, skinD);

    /* 머리 */
    rect(ctx, x - 6, headTop, 12, 12, skin);
    rect(ctx, x + 3, headTop + 2, 3, 9, skinD);
    rect(ctx, x - 7, headTop + 5, 1, 3, skin);
    rect(ctx, x + 6, headTop + 5, 1, 3, skin);
    rect(ctx, x - 4, headTop + 10, 8, 1, shade(skin, -10));

    /* 얼굴 */
    if (dir !== 'up') {
      var eyeY = headTop + 6;
      if (dir === 'left') {
        rect(ctx, x - 5, eyeY, 2, 2, PAL.eye);
        rect(ctx, x - 5, eyeY, 1, 1, '#FFFFFF');
        rect(ctx, x - 3, eyeY + 4, 2, 1, shade(skin, -42));
      } else if (dir === 'right') {
        rect(ctx, x + 3, eyeY, 2, 2, PAL.eye);
        rect(ctx, x + 3, eyeY, 1, 1, '#FFFFFF');
        rect(ctx, x + 1, eyeY + 4, 2, 1, shade(skin, -42));
      } else {
        rect(ctx, x - 4, eyeY, 2, 2, PAL.eye);
        rect(ctx, x + 2, eyeY, 2, 2, PAL.eye);
        rect(ctx, x - 4, eyeY, 1, 1, '#FFFFFF');
        rect(ctx, x + 2, eyeY, 1, 1, '#FFFFFF');
        rect(ctx, x - 1, eyeY + 3, 2, 1, shade(skin, -42));
      }
      ctx.globalAlpha = 0.4;
      rect(ctx, x - 6, headTop + 9, 2, 1, '#E08D7F');
      rect(ctx, x + 4, headTop + 9, 2, 1, '#E08D7F');
      ctx.globalAlpha = 1;
    }

    /* 앞머리 */
    hairFront(ctx, c, x, headTop, dir);

    /* 액세서리 */
    var acc = c.accessory || 'none';
    if (acc === 'glasses' && dir !== 'up') {
      rect(ctx, x - 5, headTop + 5, 4, 1, '#2C2C38');
      rect(ctx, x + 2, headTop + 5, 4, 1, '#2C2C38');
      rect(ctx, x - 5, headTop + 6, 1, 1, '#2C2C38');
      rect(ctx, x + 5, headTop + 6, 1, 1, '#2C2C38');
      rect(ctx, x - 1, headTop + 5, 3, 1, '#2C2C38');
    } else if (acc === 'headphones') {
      var hc = c.accent || '#F2B45E';
      rect(ctx, x - 6, headTop - 2, 12, 1, hc);
      rect(ctx, x - 8, headTop + 4, 2, 5, hc);
      rect(ctx, x + 6, headTop + 4, 2, 5, hc);
      rect(ctx, x - 8, headTop + 5, 1, 3, '#3A3244');
      rect(ctx, x + 7, headTop + 5, 1, 3, '#3A3244');
    } else if (acc === 'scarf') {
      var sc = c.accent || '#F6D78A';
      rect(ctx, x - 5, bodyTop - 1, 10, 3, sc);
      rect(ctx, x - 5, bodyTop + 1, 10, 1, shade(sc, -22));
      rect(ctx, x + 2, bodyTop + 2, 2, 5, sc);
      rect(ctx, x + 2, bodyTop + 6, 2, 1, shade(sc, -22));
    }
  }

  /* =============================================================
   *  이름표 · 프롬프트 · 표지판 · 리액션 (HiDPI 텍스트 패스)
   *  - 좌표(o.x, o.y)는 논리 픽셀, o.k = CSS 픽셀 / 논리 픽셀
   *  - 호출 전에 ctx 변환을 CSS 픽셀 좌표계(dpr 배율)로 맞춰 둔다
   *    → 글자는 화면 해상도 그대로 그려져 또렷하다
   * ============================================================= */
  var FONT_UI = '"Pretendard","Pretendard Variable","Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic","맑은 고딕",sans-serif';
  var FONT_MONO = 'ui-monospace,"SFMono-Regular",Menlo,Consolas,monospace';

  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  function pillPath(ctx, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function pill(ctx, x, y, w, h, r, border, body) {
    ctx.save();
    ctx.shadowColor = 'rgba(6, 10, 22, 0.42)';
    ctx.shadowBlur = Math.max(3, h * 0.36);
    ctx.shadowOffsetY = Math.max(1, h * 0.1);
    pillPath(ctx, x, y, w, h, r);
    ctx.fillStyle = border;
    ctx.fill();
    ctx.restore();
    pillPath(ctx, x + 1, y + 1, w - 2, h - 2, Math.max(1, r - 1));
    ctx.fillStyle = body;
    ctx.fill();
  }

  function pointer(ctx, x, y, halfW, h, color) {
    ctx.beginPath();
    ctx.moveTo(x - halfW, y - 1);
    ctx.lineTo(x + halfW, y - 1);
    ctx.lineTo(x, y + h);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  function drawNameTag(ctx, o) {
    var k = o.k || 1;
    var self = !!o.self;
    var statusText = o.status || (o.studying ? '공부 중' : '자리 비움');
    var size = clamp(7.7 * k, 9, 11.5);
    var sizeSm = clamp(size * 0.86, 7.8, 10.2);
    var showStatus = o.compact ? false : true;
    var fontMain = '700 ' + size.toFixed(2) + 'px ' + FONT_UI;
    var fontSm = '600 ' + sizeSm.toFixed(2) + 'px ' + FONT_UI;

    ctx.save();
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.font = fontMain;
    var nameW = ctx.measureText(o.name).width;
    ctx.font = fontSm;
    var statusTxt = '· ' + statusText;
    var statusW = showStatus ? ctx.measureText(statusTxt).width : 0;

    var padX = Math.round(size * 0.55);
    var dot = Math.max(4, Math.round(size * 0.3));
    var gap = Math.round(size * 0.34);
    var h = Math.round(size * 1.66);
    var rad = Math.round(h * 0.42);
    var w = Math.ceil(padX * 2 + dot + gap + nameW + (showStatus ? 4 + statusW : 0));

    var ax = Math.round(o.x * k);
    var top = Math.round(o.y * k) - h;
    var left = Math.round(ax - w / 2);
    var border = self ? '#E3B954' : '#101731';

    pill(ctx, left, top, w, h, rad, border, self ? '#FCEFC0' : '#26325A');

    var cy = top + h / 2;
    ctx.beginPath();
    ctx.arc(left + padX + dot / 2, cy, dot / 2, 0, Math.PI * 2);
    ctx.fillStyle = o.studying ? '#4AC97A' : '#E8AF52';
    ctx.fill();

    var tx = left + padX + dot + gap;
    ctx.font = fontMain;
    ctx.fillStyle = self ? '#3B2B12' : '#F4F8FF';
    ctx.fillText(o.name, tx, cy + 0.5);

    if (showStatus) {
      ctx.font = fontSm;
      ctx.fillStyle = self ? '#8B6A22' : '#A9B8D8';
      ctx.fillText(statusTxt, tx + nameW + 4, cy + 0.5);
    }

    pointer(ctx, ax, top + h, Math.max(2, Math.round(size * 0.32)), Math.max(3, Math.round(size * 0.34)), border);
    ctx.restore();
  }

  function drawPrompt(ctx, o) {
    var k = o.k || 1;
    var active = o.active !== false;
    var label = o.label || '';
    var size = clamp(7.9 * k, 9, 11.5);
    var font = '700 ' + size.toFixed(2) + 'px ' + FONT_UI;

    ctx.save();
    ctx.textBaseline = 'middle';
    ctx.font = font;
    var tw = ctx.measureText(label).width;

    var key = Math.round(size * 1.4);
    var padX = Math.round(size * 0.5);
    var gap = Math.round(size * 0.36);
    var h = Math.round(size * 1.86);
    var rad = Math.round(h * 0.42);
    var w = Math.ceil(padX * 2 + key + gap + tw);

    var ax = Math.round(o.x * k);
    var top = Math.round(o.y * k) - h;
    var left = Math.round(ax - w / 2);
    var border = active ? '#E3B954' : '#1B2340';

    pill(ctx, left, top, w, h, rad, border, active ? '#FCE9A8' : '#242F52');

    var ky = Math.round(top + (h - key) / 2);
    pillPath(ctx, left + padX, ky, key, key, Math.max(2, Math.round(key * 0.3)));
    ctx.fillStyle = active ? '#2A2130' : '#3D4A6E';
    ctx.fill();

    ctx.font = '700 ' + (size * 0.84).toFixed(2) + 'px ' + FONT_MONO;
    ctx.fillStyle = active ? '#FCE9A8' : '#DCE4F7';
    ctx.textAlign = 'center';
    ctx.fillText('F', left + padX + key / 2, top + h / 2 + 0.5);

    ctx.font = font;
    ctx.textAlign = 'left';
    ctx.fillStyle = active ? '#2A2130' : '#E7EDFB';
    ctx.fillText(label, left + padX + key + gap, top + h / 2 + 0.5);

    pointer(ctx, ax, top + h, Math.max(2, Math.round(size * 0.3)), Math.max(3, Math.round(size * 0.3)), border);
    ctx.restore();
  }

  function drawKioskSign(ctx, o) {
    var k = o.k || 1;
    var label = o.label || '출석·퇴장';
    var size = clamp(7.6 * k, 8.5, 11);
    var font = '700 ' + size.toFixed(2) + 'px ' + FONT_UI;

    ctx.save();
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.font = font;
    var tw = ctx.measureText(label).width;

    var padX = Math.round(size * 0.85);
    var h = Math.round(size * 1.72);
    var rad = Math.round(h * 0.32);
    var w = Math.ceil(tw + padX * 2);
    var cx = Math.round(o.x * k);
    var top = Math.round(o.y * k) - h;

    pill(ctx, Math.round(cx - w / 2), top, w, h, rad, '#0E1526', '#26325A');

    ctx.fillStyle = '#EAF0FF';
    ctx.fillText(label, cx, top + h / 2 + 0.5);

    /* 화면 위 작은 표시등 */
    ctx.beginPath();
    ctx.arc(cx, top + h + 3, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(120, 226, 236, 0.9)';
    ctx.fill();
    ctx.restore();
  }

  function drawReaction(ctx, x, y, emoji, progress, k) {
    k = k || 1;
    var p = Math.max(0, Math.min(1, progress));
    var alpha = p < 0.72 ? 1 : (1 - (p - 0.72) / 0.28);
    var size = clamp(15 * k, 15, 22);
    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.font = size.toFixed(1) + 'px "Apple Color Emoji","Noto Color Emoji","Segoe UI Emoji",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, Math.round(x * k), Math.round((y - 30) * k - p * 26 * k));
    ctx.restore();
  }

  return {
    PAL: PAL,
    shade: shade,
    rect: rect,
    drawBackground: drawBackground,
    drawFurniture: drawFurniture,
    drawCharacter: drawCharacter,
    drawNameTag: drawNameTag,
    drawPrompt: drawPrompt,
    drawKioskSign: drawKioskSign,
    drawReaction: drawReaction
  };
})();
