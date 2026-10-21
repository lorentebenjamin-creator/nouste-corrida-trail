import { LEVELS, THEMES as EXTRA_THEMES } from "../levels.js";
import { i as e, n as t, r as n, t as r } from "./index-wVumaOia.js";
import { lbEnabled, lbCanSubmit, lbSubmit, lbTop, lbRank, lbMenuTops, lbInvalidate } from "../leaderboard.js";
var i = r(`chevron-left`, [[`path`, { d: `m15 18-6-6 6-6`, key: `1wnfg3` }]]),
  a = r(`chevron-right`, [[`path`, { d: `m9 18 6-6-6-6`, key: `mthhwq` }]]),
  o = r(`pause`, [
    [
      `rect`,
      { x: `14`, y: `4`, width: `4`, height: `16`, rx: `1`, key: `zuxfzm` },
    ],
    [
      `rect`,
      { x: `6`, y: `4`, width: `4`, height: `16`, rx: `1`, key: `1okwgv` },
    ],
  ]),
  s = r(`play`, [[`polygon`, { points: `6 3 20 12 6 21 6 3`, key: `1oa8hb` }]]),
  c = r(`rotate-ccw`, [
    [
      `path`,
      { d: `M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8`, key: `1357e3` },
    ],
    [`path`, { d: `M3 3v5h5`, key: `1xhq8a` }],
  ]),
  l = r(`volume-2`, [
    [
      `path`,
      {
        d: `M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z`,
        key: `uqj9uw`,
      },
    ],
    [`path`, { d: `M16 9a5 5 0 0 1 0 6`, key: `1q6k2b` }],
    [`path`, { d: `M19.364 18.364a9 9 0 0 0 0-12.728`, key: `ijwkga` }],
  ]),
  u = r(`volume-x`, [
    [
      `path`,
      {
        d: `M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z`,
        key: `uqj9uw`,
      },
    ],
    [`line`, { x1: `22`, x2: `16`, y1: `9`, y2: `15`, key: `1ewh16` }],
    [`line`, { x1: `16`, x2: `22`, y1: `9`, y2: `15`, key: `5ykzw1` }],
  ]),
  d = e(n(), 1);
var C = LEVELS;
function ee(e) {
  return C.find((t) => t.id === e) ?? C[0];
}
var w = class {
    ctx = null;
    noise = null;
    muted = !1;
    unlock() {
      if (this.muted) return;
      let e = this.ensure();
      e.state === `suspended` && e.resume();
    }
    ensure() {
      if (!this.ctx) {
        let e = window.AudioContext || window.webkitAudioContext;
        this.ctx = new e();
        let t = this.ctx.createBuffer(
            1,
            Math.floor(this.ctx.sampleRate * 0.25),
            this.ctx.sampleRate,
          ),
          n = t.getChannelData(0);
        for (let e = 0; e < n.length; e++) n[e] = Math.random() * 2 - 1;
        this.noise = t;
      }
      return this.ctx;
    }
    tone(e, t, n, r, i = 0) {
      if (this.muted) return;
      let a = this.ensure(),
        o = a.currentTime + i,
        s = a.createOscillator(),
        c = a.createGain();
      ((s.type = n),
        s.frequency.setValueAtTime(e, o),
        c.gain.setValueAtTime(r, o),
        c.gain.exponentialRampToValueAtTime(1e-4, o + t),
        s.connect(c),
        c.connect(a.destination),
        s.start(o),
        s.stop(o + t + 0.02));
    }
    sweep(e, t, n, r) {
      if (this.muted) return;
      let i = this.ensure(),
        a = i.currentTime,
        o = i.createOscillator(),
        s = i.createGain();
      ((o.type = `sine`),
        o.frequency.setValueAtTime(e, a),
        o.frequency.exponentialRampToValueAtTime(t, a + n),
        s.gain.setValueAtTime(r, a),
        s.gain.exponentialRampToValueAtTime(1e-4, a + n),
        o.connect(s),
        s.connect(i.destination),
        o.start(a),
        o.stop(a + n + 0.02));
    }
    burst(e, t, n = 1) {
      if (this.muted || !this.noise) return;
      let r = this.ensure(),
        i = r.createBufferSource();
      i.buffer = this.noise;
      let a = r.createBiquadFilter();
      ((a.type = `bandpass`), (a.frequency.value = 180 * n));
      let o = r.createGain(),
        s = r.currentTime;
      (o.gain.setValueAtTime(t, s),
        o.gain.exponentialRampToValueAtTime(1e-4, s + e),
        i.connect(a),
        a.connect(o),
        o.connect(r.destination),
        i.start(s),
        i.stop(s + e));
    }
    jump() {
      this.sweep(240, 620, 0.14, 0.05);
    }
    coin() {
      (this.tone(880, 0.08, `triangle`, 0.05),
        this.tone(1320, 0.12, `triangle`, 0.04, 0.06));
    }
    die() {
      (this.burst(0.28, 0.08, 0.6), this.sweep(180, 60, 0.28, 0.05));
    }
    checkpoint() {
      (this.tone(523, 0.1, `triangle`, 0.05),
        this.tone(659, 0.12, `triangle`, 0.045, 0.08),
        this.tone(784, 0.16, `triangle`, 0.04, 0.16));
    }
    finish() {
      [523, 659, 784, 1046].forEach((e, t) =>
        this.tone(e, 0.18, `triangle`, 0.05, t * 0.09),
      );
    }
    beep(e) {
      let t = e >= 3 ? 440 : e === 2 ? 554 : 659;
      this.tone(t, 0.09, `square`, 0.04);
    }
    go() {
      (this.tone(880, 0.1, `square`, 0.055),
        this.tone(1174, 0.18, `square`, 0.05, 0.08));
    }
    step() {
      this.burst(0.04, 0.03, 2.4);
    }
  },
  T = {
    forest: {
      skyTop: `#163246`,
      skyMid: `#4d7c90`,
      skyBot: `#f0c98a`,
      ridge: `#1a332b`,
      ridge2: `#2d4f3e`,
      pine: `#14281f`,
      pine2: `#2a5a3c`,
      dirt: `#6b4632`,
      dirtDark: `#4a3022`,
      grass: `#3e8a48`,
      grassDark: `#2b6634`,
      wood: `#8d5a32`,
      woodDark: `#5c3b22`,
      rock: `#8a7a6c`,
      rockDark: `#5c5148`,
      thorn: `#2c241c`,
      leaf: `#2f6a38`,
      berry: `#a33b3b`,
      fog: `#10201a`,
    },
    ridge: {
      skyTop: `#24344c`,
      skyMid: `#7d93aa`,
      skyBot: `#f2d3a6`,
      ridge: `#3a4552`,
      ridge2: `#5c6b78`,
      pine: `#2c3834`,
      pine2: `#5d6e58`,
      dirt: `#7a5b46`,
      dirtDark: `#54402f`,
      grass: `#8b9a62`,
      grassDark: `#5d6e40`,
      wood: `#8a6240`,
      woodDark: `#5a4030`,
      rock: `#91867c`,
      rockDark: `#61584f`,
      thorn: `#3a342e`,
      leaf: `#5a6844`,
      berry: `#8d4038`,
      fog: `#1a2228`,
    },
    col: {
      skyTop: `#1a1830`,
      skyMid: `#c2654a`,
      skyBot: `#f0b06a`,
      ridge: `#2a3142`,
      ridge2: `#465066`,
      pine: `#242a34`,
      pine2: `#556070`,
      dirt: `#5c5148`,
      dirtDark: `#3a332e`,
      grass: `#8d7a58`,
      grassDark: `#5c5140`,
      wood: `#7a5840`,
      woodDark: `#4a3428`,
      rock: `#9aa3ad`,
      rockDark: `#66707a`,
      thorn: `#3a3034`,
      leaf: `#6a453c`,
      berry: `#c4553a`,
      fog: `#1a1420`,
    },
  },
  E = 540,
  D = 30,
  O = 56,
  k = 352,
  te = 2100,
  A = 4700,
  ne = 1200,
  re = 110,
  j = -770,
  ie = 1080,
  M = 3600,
  ae = 2100,
  N = 3e3,
  P = 0.11,
  oe = 0.13,
  se = 700,
  ce = new Set([`ArrowLeft`, `KeyA`, `KeyQ`]),
  le = new Set([`ArrowRight`, `KeyD`]),
  F = new Set([`ArrowUp`, `Space`, `KeyW`, `KeyZ`]),
  ue = new Set([`ArrowDown`, `KeyS`]),
  I = [
    { name: `Léa Morel`, bib: 12, sheet: `lea`, color: `#2f6b45` },
    { name: `Karim El Yazidi`, bib: 7, sheet: `karim`, color: `#f3ede2` },
    { name: `Inès Rocha`, bib: 23, sheet: `ines`, color: `#7d5bb5` },
  ];
Object.assign(T, EXTRA_THEMES);
function L(e, t, n) {
  return Math.max(t, Math.min(n, e));
}
function de(e) {
  let t = e >>> 0;
  return () => {
    ((t |= 0), (t = (t + 1831565813) | 0));
    let e = Math.imul(t ^ (t >>> 15), 1 | t);
    return (
      (e = (e + Math.imul(e ^ (e >>> 7), 61 | e)) ^ e),
      ((e ^ (e >>> 14)) >>> 0) / 4294967296
    );
  };
}
function fe(e, t) {
  return (
    e.x < t.x + t.w && e.x + e.w > t.x && e.y < t.y + t.h && e.y + e.h > t.y
  );
}
function R(e, t) {
  let n = e.getContext(`2d`);
  if (!n) throw Error(`Canvas indisponible`);
  let r = new w(),
    i = window.matchMedia(`(prefers-reduced-motion: reduce)`).matches,
    a = {
      hero: X(`game/hero.png`),
      lea: X(`game/lea.png`),
      karim: X(`game/karim.png`),
      ines: X(`game/ines.png`),
    },
    o = `menu`,
    s = ee(`sousbois`),
    c = `forest`,
    l = `Toi`,
    u = [],
    d = null,
    f = new Set(),
    p = [],
    m = [],
    h = null,
    g = 0,
    _ = 0,
    v = 0,
    y = 40,
    b = 960,
    x = 1,
    S = 0,
    C = 0,
    R = 1,
    z = 0,
    B = 0,
    V = 0,
    H = 0,
    U = 0,
    W = 0,
    G = !1,
    K = 0,
    q = !1,
    J = new Set(),
    Y = { left: !1, right: !1, jump: !1, down: !1 },
    xe = 0,
    Se = performance.now(),
    Ce = 0;
  function X(e) {
    let t = new Image();
    return ((t.src = e), t);
  }
  function Z(e) {
    o !== e && ((o = e), t.onMode(e));
  }
  function we() {
    d &&
      t.onHud({
        time: g,
        coins: f.size,
        coinTotal: s.coins.length,
        place: Me(),
        deaths: d.deaths,
        meters: Math.max(0, Math.round(d.x / 10)),
      });
  }
  function Te() {
    ((V = 3),
      (H = 3),
      (U = 0),
      (q = !1),
      Z(`count`),
      t.onCount(3),
      we(),
      r.unlock(),
      r.beep(3));
  }
  function Ee(e, n = 1.5) {
    ((W = e ? n : 0), t.onToast(e));
  }
  function De() {
    let e = T[s.theme],
      t = document.createElement(`canvas`);
    ((t.width = s.width), (t.height = 780));
    let n = t.getContext(`2d`);
    if (!n) return;
    let r = s.solids
      .filter((e) => e.kind === `ground`)
      .sort((e, t) => e.x - t.x);
    ((waterGaps = []), (flies = []));
    for (let t = 0; t < r.length - 1; t++) {
      let i = r[t],
        a = r[t + 1],
        o = i.x + i.w,
        s = a.x - o;
      if (s < 8) continue;
      // v2 : face à une falaise (> 100 px), le brouillard part du bord le plus bas
      let c = (Math.abs(i.y - a.y) > 100 ? Math.max(i.y, a.y) : Math.min(i.y, a.y)) + 8;
      ((n.fillStyle = e.fog),
        (n.globalAlpha = 0.72),
        n.fillRect(o, c, s, 780 - c),
        (n.globalAlpha = 0.35),
        (n.fillStyle = `#070b0a`),
        n.fillRect(o + 6, c + 30, Math.max(0, s - 12), 780),
        (n.globalAlpha = 1));
      // Palette de nuit : le gave au fond du ravin (décor seul, la chute reste mortelle à y=700).
      if (e.water) {
        let wy = Math.min(Math.max(i.y, a.y) + 58, 505);
        ((n.fillStyle = e.water),
          n.fillRect(o, wy, s, 780 - wy),
          (n.fillStyle = e.waterHi),
          (n.globalAlpha = 0.9),
          n.fillRect(o, wy, s, 2),
          (n.globalAlpha = 1),
          waterGaps.push({ x: o, w: s, y: wy }));
      }
    }
    for (let t of s.solids)
      t.move
        ? 0
        : t.kind === `ground`
        ? pe(n, t, e)
        : t.kind === `rock`
          ? me(n, t, e)
          : t.kind === `log`
            ? he(n, t, e)
            : ge(n, t, e);
    for (let t of s.hazards) _e(n, t.x, t.y, t.w, e);
    (ve(n, 16, s.floor, `DÉPART`, !1),
      ve(n, s.finishX - 86, s.floor, `ARRIVÉE`, !0));
    for (let t of s.checkpoints)
      ((n.fillStyle = e.woodDark), n.fillRect(t.x, t.y - 78, 5, 78));
    h = t;
    let i = de(s.width + s.floor);
    m = [];
    for (let e = 0; e < 46; e++)
      m.push({
        x: i() * s.width,
        h: 64 + i() * 120,
        layer: i() > 0.45 ? 0.32 : 0.52,
        kind: i(),
      });
    // Lucioles (thème avec `fireflies`) : positions déterministes au-dessus des trous et des
    // points d'appel (bords de sol/passerelle, trajets des bacs). Décor seul, aucun effet de jeu.
    if (e.fireflies) {
      let fr = de(s.width * 7 + 13),
        walk = s.solids.filter((t) => !t.move && !t.net && (t.kind === `ground` || t.kind === `plank`)).sort((t, n) => t.x - n.x),
        add = (x, top, k) => {
          for (let q = 0; q < k; q++)
            flies.push({ x: x + (fr() - 0.5) * 50, y: top - 34 - fr() * 60, ph: fr() * 6.283 });
        };
      for (let t = 0; t < walk.length - 1; t++) {
        let a = walk[t], b2 = walk[t + 1], gx = a.x + a.w, gw = b2.x - gx;
        gw >= 40 && (add(gx + gw / 2, Math.min(a.y, b2.y), 3), add(gx - 12, a.y, 1));
      }
      for (let mv of movers) add(mv.move.x0 + mv.move.dx / 2 + mv.w / 2, mv.move.y0 + Math.min(0, mv.move.dy), 3);
    }
  }
  function Q(e, t, n, r, i, a, o) {
    return {
      name: e,
      bib: t,
      sheet: n,
      color: r,
      you: i,
      speed: a,
      x: o,
      y: s.floor - O,
      w: D,
      h: O,
      vx: 0,
      vy: 0,
      grounded: !0,
      coyote: P,
      buffer: 0,
      cut: !1,
      drop: 0,
      facing: 1,
      anim: i ? 0 : t,
      frame: 1,
      lock: 0,
      hold: !1,
      checkpoint: -1,
      finished: !1,
      finishTime: null,
      invuln: 0,
      alive: !0,
      deaths: 0,
      squash: 0,
      stuck: 0,
      step: 0.2,
    };
  }
  function Oe() {
    ((d = Q(l, 42, `hero`, `#f26522`, !0, 1, s.spawnX + 28)),
      (u = [
        d,
        Q(
          I[0].name,
          I[0].bib,
          I[0].sheet,
          I[0].color,
          !1,
          s.rivals[0].speed,
          s.spawnX - 8,
        ),
        Q(
          I[1].name,
          I[1].bib,
          I[1].sheet,
          I[1].color,
          !1,
          s.rivals[1].speed,
          s.spawnX + 86,
        ),
        Q(
          I[2].name,
          I[2].bib,
          I[2].sheet,
          I[2].color,
          !1,
          s.rivals[2].speed,
          s.spawnX + 46,
        ),
      ]));
    for (let e of u) e.x = Math.max(8, e.x);
  }
  function ke(e) {
    if (e.checkpoint >= 0) {
      let t = s.checkpoints[e.checkpoint];
      ((e.x = t.x + 6), (e.y = t.y - e.h));
    } else
      ((e.x = e.you ? s.spawnX + 28 : Math.max(8, s.spawnX)),
        (e.y = s.floor - e.h));
    ((e.vx = 0),
      (e.vy = 0),
      (e.alive = !0),
      (e.grounded = !0),
      (e.invuln = e.you ? 0.9 : 0.45),
      (e.coyote = P),
      (e.cut = !1),
      (e.hold = !1));
  }
  function Ae(e) {
    e.alive &&
      !e.finished &&
      ((e.deaths += 1),
      e.you && (e.deathXs ||= []).push(Math.round(e.x)),
      e.you
        ? ((e.alive = !1),
          (e.vx = 0),
          (z = 0.9),
          (B = 0.78),
          r.die(),
          Z(`down`))
        : (ke(e),
          (e.stun = 0.85),
          (e.vx = 0),
          e.deaths >= 8 && ((e.finished = !0), (e.finishTime = g + 22))));
  }
  function je() {
    let e = u.map((e) => ({
      name: e.you ? l : e.name,
      bib: e.bib,
      you: e.you,
      time: e.finishTime,
      coins: e.you ? f.size : 0,
    }));
    return (
      e.sort((e, t) => {
        if (e.time != null && t.time != null) return e.time - t.time;
        if (e.time != null) return -1;
        if (t.time != null) return 1;
        let n = u.find((t) => t.bib === e.bib)?.x ?? 0;
        return (u.find((e) => e.bib === t.bib)?.x ?? 0) - n;
      }),
      e
    );
  }
  function Me() {
    let e = u.map((e) => ({ you: e.you, time: e.finishTime, x: e.x }));
    return (
      e.sort((e, t) =>
        e.time != null && t.time != null
          ? e.time - t.time
          : e.time == null
            ? t.time == null
              ? t.x - e.x
              : 1
            : -1,
      ),
      e.findIndex((e) => e.you) + 1
    );
  }
  function Ne(e = !1) {
    let n = je();
    if (
      (t.onRank(n),
      !G && d?.finishTime != null && n.every((e) => e.time != null))
    ) {
      G = !0;
      let e = n.findIndex((e) => e.you) + 1;
      t.onFinish({
        levelId: s.id,
        time: d.finishTime,
        coins: f.size,
        place: e,
      });
    } else e && t.onRank(n);
  }
  function Pe(e) {
    let t = e.y + e.h,
      n = e.x + e.w * 0.5,
      r = null,
      i = 99;
    for (let e of s.solids) {
      if (n < e.x + 1 || n > e.x + e.w - 1) continue;
      let a = Math.abs(e.y - t);
      a < 8 && a < i && ((r = e), (i = a));
    }
    return r;
  }
  function Fe(e) {
    if (e.lock > 0 || (!e.grounded && e.coyote < 0.03)) return !1;
    let t = e.x + e.w,
      n = e.y + e.h;
    for (let e of s.hazards)
      if (e.x < t + 58 && e.x + e.w > t - 4 && Math.abs(e.y + e.h - n) < 40)
        return !0;
    let r = Pe(e);
    if (r) {
      let i = r.x + r.w - t,
        a = null,
        o = 1 / 0;
      for (let e of s.solids)
        e !== r &&
          (e.x + e.w < r.x + r.w + 6 ||
            e.y > n + 200 ||
            e.y < n - 160 ||
            (e.x < o && ((a = e), (o = e.x))));
      if (a && i < 80 && i > -8) {
        let t = a.x - (r.x + r.w),
          o = n - a.y,
          s = 205 * e.speed,
          c = Math.min(62, 22 + Math.max(0, o) * 0.4);
        if (t < s && i < c) return !0;
      }
    }
    for (let e of s.solids)
      if (
        !(e.oneWay || e === r) &&
        !(e.x > t + 42 || e.x + e.w < t + 2) &&
        e.y < n - 14 &&
        e.y > n - 130 &&
        e.h < 90
      )
        return !0;
    return !1;
  }
  function Ie(e) {
    for (let t of s.solids) {
      if (t.oneWay || !fe(e, t)) continue;
      let n = Math.max(e.y, t.y);
      if (!(Math.min(e.y + e.h, t.y + t.h) - n < 8)) {
        if (e.vx > 0) e.x = t.x - e.w;
        else if (e.vx < 0) e.x = t.x + t.w;
        else {
          let n = e.x + e.w - t.x,
            r = t.x + t.w - e.x;
          e.x += n < r ? -n : r;
        }
        e.vx = 0;
      }
    }
  }
  function Le(e, t) {
    e.grounded = !1;
    for (let n of s.solids)
      if (fe(e, n)) {
        if (n.oneWay) {
          if (e.drop > 0 || e.vy < 0 || t > n.y + 3) continue;
          (e.vy > 760 && (e.squash = Math.min(1, e.vy / 1100)),
            (e.y = n.y - e.h),
            (e.vy = 0),
            (e.grounded = !0),
            (e.cut = !1));
          continue;
        }
        e.vy >= 0 && t <= n.y + 8
          ? (e.vy > 760 && (e.squash = Math.min(1, e.vy / 1100)),
            (e.y = n.y - e.h),
            (e.vy = 0),
            (e.grounded = !0),
            (e.cut = !1))
          : e.vy < 0 && t > n.y + 8 && ((e.y = n.y + n.h), (e.vy = 0));
      }
  }
  function Re(e, t) {
    let n = Math.max(
        1,
        Math.ceil(((Math.abs(e.vx) + Math.abs(e.vy)) * t) / 14),
      ),
      r = t / n;
    for (let t = 0; t < n; t++) {
      ((e.x += e.vx * r), Ie(e));
      let t = e.y + e.h;
      ((e.y += e.vy * r), Le(e, t));
    }
    e.x < 0 && ((e.x = 0), e.vx < 0 && (e.vx = 0));
    let i = s.width - e.w - 8;
    e.x > i && ((e.x = i), e.vx > 0 && (e.vx = 0));
  }
  function $(e, t, n) {
    if (!e.alive) return;
    ((e.lock = Math.max(0, e.lock - t)),
      (e.invuln = Math.max(0, e.invuln - t)),
      (e.squash *= Math.exp(-7 * t)));
    e.stun = Math.max(0, (e.stun || 0) - t);
    gusts.length && gustSlow(e, _) < 1 && (e.gustT = (e.gustT || 0) + t);
    let i = e.you ? n.edge : e.finished ? !1 : aiStep(e);
    (!e.you && i && (e.hold = !0),
      !e.you && e.grounded && !i && e.vy === 0 && (e.hold = !1));
    let a = !e.you || n.jump;
    if (
      ((e.drop =
        e.you && n.down && e.grounded ? 0.18 : Math.max(0, e.drop - t)),
      e.finished)
    )
      e.vx *= Math.exp(-6 * t);
    else {
      let r = e.you ? n.left : !1,
        i = e.you ? (n.right ? 1 : 0) - !!r : (e.aiDir ?? 1),
        a = i * k * e.speed * (i > 0 ? gustSlow(e, _) : 1), // v4 : rafale de vent de face
        o = e.grounded ? M : ae;
      if (i !== 0) {
        let n = a - e.vx,
          r = o * t;
        ((e.vx += Math.sign(n) * Math.min(Math.abs(n), r)),
          Math.abs(e.vx) > 20 && (e.facing = e.vx > 0 ? 1 : -1));
      } else {
        let n = N * t * (e.grounded ? 1 : 0.25);
        Math.abs(e.vx) <= n ? (e.vx = 0) : (e.vx -= Math.sign(e.vx) * n);
      }
      (!e.you && e.aiDir === 1 && Math.abs(e.vx) < 15 && e.grounded
        ? (e.stuck += t)
        : (e.stuck = 0),
        !e.you &&
          e.stuck > 1.1 &&
          ((e.vy = j), (e.grounded = !1), (e.stuck = 0), (e.hold = !0)));
    }
    (i && (e.buffer = oe),
      (e.coyote = e.grounded ? P : Math.max(0, e.coyote - t)),
      !e.finished &&
        e.buffer > 0 &&
        e.lock <= 0 &&
        (e.grounded || e.coyote > 0) &&
        ((e.vy = j),
        (e.grounded = !1),
        (e.coyote = 0),
        (e.buffer = 0),
        (e.cut = !1),
        (e.lock = e.you ? 0 : 0.28),
        (e.squash = -0.55),
        e.you && r.jump()),
      (e.buffer = Math.max(0, e.buffer - t)),
      e.you && !a && e.vy < 0 && !e.cut && ((e.vy *= 0.48), (e.cut = !0)));
    let o = e.vy < 0 ? te : A;
    if (
      (Math.abs(e.vy) < re && (o = ne),
      (e.vy = Math.min(ie, e.vy + o * t)),
      jetTouch(e, _),
      Re(e, t),
      e.grounded
        ? Math.abs(e.vx) < 28
          ? (e.frame = 1)
          : ((e.anim += t * ((10 * Math.abs(e.vx)) / k)),
            (e.frame = Math.floor(e.anim) % 4))
        : (e.frame = e.vy < -40 ? 1 : 2),
      e.you &&
        e.grounded &&
        Math.abs(e.vx) > 90 &&
        !e.finished &&
        ((e.step -= t),
        e.step <= 0 &&
          ((e.step = 0.24),
          r.step(),
          ze(e.x + e.w * 0.5, e.y + e.h, e.facing))),
      e.finished)
    )
      return;
    for (let t = 0; t < s.checkpoints.length; t++) {
      let n = s.checkpoints[t];
      t <= e.checkpoint ||
        (e.x + e.w > n.x &&
          e.x < n.x + 36 &&
          e.y + e.h >= n.y - 70 &&
          e.y < n.y &&
          ((e.checkpoint = t),
          e.you &&
            (r.checkpoint(),
            (z = Math.max(z, 0.18)),
            Ee(`Point de contrôle`, 1.35))));
    }
    if (e.you)
      for (let t of s.coins) {
        if (f.has(t.id)) continue;
        let n = L(t.x, e.x, e.x + e.w),
          i = L(t.y, e.y, e.y + e.h),
          a = t.x - n,
          o = t.y - i;
        if (a * a + o * o < 400) {
          (f.add(t.id), r.coin());
          for (let e = 0; e < 6; e++)
            p.push({
              x: t.x,
              y: t.y,
              vx: (Math.random() - 0.5) * 140,
              vy: -80 - Math.random() * 80,
              life: 0.4,
              max: 0.4,
              color: `#f0c14a`,
              size: 3,
            });
        }
      }
    if (
      e.x > s.finishX &&
      e.y + e.h <= s.floor + 28 &&
      e.alive &&
      ((e.finished = !0), (e.finishTime = g), e.you)
    ) {
      (r.finish(), (z = 0.45));
      for (let t = 0; t < 32; t++)
        p.push({
          x: e.x,
          y: e.y + 10,
          vx: (Math.random() - 0.5) * 260,
          vy: -160 - Math.random() * 220,
          life: 0.9,
          max: 0.9,
          color: t % 2 ? `#f26522` : `#f3ede2`,
          size: 3 + (t % 3),
        });
      (Z(`finish`), (K = 0), saveFinish(e));
    }
    let c =
      e.invuln <= 0 && (s.hazards.some((t) => fe(e, t)) || dynHit(e, _));
    (e.y > se || c) && Ae(e);
  }
  // =====================================================================
  //  v2 — Mécaniques dynamiques + IA par simulation (voir LEVELS.md)
  //  Tout est fonction déterministe du temps du monde `_` : l'IA peut donc
  //  prédire exactement passerelles mobiles, chutes de pierres et patous.
  // =====================================================================
  let cb = t,
    movers = [],
    falls = [],
    dogs = [],
    jets = [],
    gusts = [],
    waterGaps = [],
    flies = [],
    autopilot = !1,
    hum = null,
    turbo = 0;
  function moverPos(m, time) {
    let mv = m.move,
      q = 0.5 - 0.5 * Math.cos(2 * Math.PI * (time / mv.period + (mv.phase || 0)));
    return [mv.x0 + mv.dx * q, mv.y0 + mv.dy * q];
  }
  function setMovers(time, riders) {
    for (let m of movers) {
      let [nx, ny] = moverPos(m, time),
        dx = nx - m.x,
        dy = ny - m.y;
      if (riders && (dx || dy))
        for (let rr of riders)
          rr.alive &&
            rr.grounded &&
            Math.abs(rr.y + rr.h - m.y) < 3 &&
            rr.x + rr.w > m.x &&
            rr.x < m.x + m.w &&
            ((rr.x += dx), (rr.y += dy));
      // Passerelle qui MONTE dans un coureur qui retombe : on le pose dessus (sinon elle le
      // traverse entre deux images et il tombe à travers — bug de l'ascenseur de l'Estive).
      if (riders && dy < 0)
        for (let rr of riders) {
          let feet = rr.y + rr.h;
          rr.alive &&
            !rr.grounded &&
            rr.vy / 60 >= dy && // y compris au sommet d'un saut (vy un peu négatif) : la passerelle monte plus vite
            !(rr.drop > 0) &&
            feet >= ny - 0.5 &&
            feet <= m.y + 3 &&
            rr.x + rr.w > nx &&
            rr.x < nx + m.w &&
            ((rr.y = ny - rr.h), (rr.vy = 0), (rr.grounded = !0));
        }
      ((m.x = nx), (m.y = ny));
    }
  }
  function fallState(fl, time) {
    let ph = (((time / fl.period + (fl.phase || 0)) % 1) + 1) % 1;
    if (ph < fl.warn) return { warn: ph / fl.warn };
    let tf = (ph - fl.warn) * fl.period,
      top = fl.top + 0.5 * fl.g * tf * tf;
    return top + fl.size >= fl.groundY
      ? { impact: tf - Math.sqrt((2 * (fl.groundY - fl.size - fl.top)) / fl.g) }
      : { rock: { x: fl.x, y: top, w: fl.size, h: fl.size } };
  }
  function dogRect(dg, time) {
    let ph = (((time / dg.period + (dg.phase || 0)) % 1) + 1) % 1,
      tri = ph < 0.5 ? ph * 2 : 2 - ph * 2;
    return {
      x: dg.x1 + (dg.x2 - dg.x1 - dg.w) * tri,
      y: dg.groundY - dg.h,
      w: dg.w,
      h: dg.h,
      dir: ph < 0.5 ? 1 : -1,
    };
  }
  // Jet de cascade : actif pendant la fraction `on` du cycle, avertissement `warn` s avant.
  function jetState(jt, time) {
    let t = ((((time / jt.period + (jt.phase || 0)) % 1) + 1) % 1) * jt.period,
      onT = jt.on * jt.period;
    if (t < onT) return { on: !0, k: t / onT, warn: 0 };
    let toOn = jt.period - t;
    return { on: !1, k: 0, warn: toOn < jt.warn ? 1 - toOn / jt.warn : 0 };
  }
  function jetPush(e, time) {
    for (let jt of jets)
      if (e.x + e.w > jt.x && e.x < jt.x + jt.w && e.y + e.h > jt.top && e.y < jt.bottom && jetState(jt, time).on)
        return ((e.vx = Math.min(e.vx, -jt.push)), (e.vy = Math.max(e.vy, jt.down)), !0);
    return !1;
  }
  function jetTouch(e, time) {
    let hit = jets.length > 0 && jetPush(e, time);
    hit && !e.inJet && ((e.jetHits = (e.jetHits || 0) + 1), e.you && ((z = Math.max(z, 0.1)), r.burst(0.18, 0.05, 1.6)));
    e.inJet = hit;
  }
  // v4 — Rafale de vent de face : zone [x1, x2] ; active pendant la fraction `on` du cycle,
  // annoncée `warn` s avant (les herbes se couchent de droite à gauche, la manche à air se lève).
  // Active, elle ne tue pas : la vitesse de course VERS LA DROITE est multipliée par `slow`
  // (au sol comme en l'air), donc on avance moins vite et les sauts sont plus courts.
  function gustState(gu, time) {
    let t = ((((time / gu.period + (gu.phase || 0)) % 1) + 1) % 1) * gu.period,
      onT = gu.on * gu.period;
    if (t < onT) return { on: !0, k: t / onT, warn: 0, since: -1 };
    let toOn = gu.period - t;
    return { on: !1, k: 0, warn: toOn < gu.warn ? 1 - toOn / gu.warn : 0, since: t - onT };
  }
  function gustSlow(e, time) {
    if (!gusts.length) return 1;
    let cx = e.x + e.w * 0.5;
    for (let gu of gusts) if (cx >= gu.x1 && cx <= gu.x2 && gustState(gu, time).on) return gu.slow;
    return 1;
  }
  function dynHit(e, time) {
    for (let fl of falls) {
      let st = fallState(fl, time);
      if (st.rock && fe(e, st.rock)) return !0;
    }
    for (let dg of dogs) {
      let rc = dogRect(dg, time);
      if (fe(e, { x: rc.x + 7, y: rc.y + 6, w: rc.w - 14, h: rc.h - 6 })) return !0;
    }
    return !1;
  }
  function initDynamic() {
    movers = s.solids.filter((m) => m.move);
    for (let m of movers) [m.x, m.y] = moverPos(m, 0);
    falls = s.rockfalls || [];
    dogs = s.patrols || [];
    jets = s.jets || [];
    gusts = s.gusts || [];
    for (let fl of falls) fl.wasFalling = !1;
    for (let jt of jets) jt.wasOn = !1;
    // Rafales : touffes d'herbe (positions déterministes) sur les sols/passerelles fixes de la zone,
    // et manche à air plantée sur le sol juste avant la zone.
    for (let gu of gusts) {
      let rn = de(gu.x1 * 31 + gu.x2), tf = [];
      for (let sd of s.solids) {
        if (sd.move || sd.net || (sd.kind !== `ground` && sd.kind !== `plank`)) continue;
        for (let x = Math.max(sd.x + 6, gu.x1); x <= Math.min(sd.x + sd.w - 6, gu.x2); x += 13 + rn() * 6)
          tf.push({ x, y: sd.y + 1, h: 14 + rn() * 10, ph: rn() * 6.283 });
      }
      gu.tufts = tf;
      let px = gu.x1 - 14,
        pole = s.solids.find((sd) => !sd.move && sd.kind === `ground` && px >= sd.x && px <= sd.x + sd.w);
      gu.pole = pole ? { x: px, y: pole.y } : null;
      gu.wasOn = !1;
    }
  }
  function tickDynamicSounds() {
    for (let fl of falls) {
      let st = fallState(fl, _),
        falling = !!st.rock;
      (fl.wasFalling &&
        !falling &&
        o !== `count` &&
        Math.abs(fl.x - (v + b / 2)) < b * 0.7 &&
        (r.burst(0.2, 0.07, 0.7), (z = Math.max(z, 0.12))),
        (fl.wasFalling = falling));
    }
    for (let jt of jets) {
      let on = jetState(jt, _).on;
      (on && !jt.wasOn && o !== `count` && Math.abs(jt.x - (v + b / 2)) < b * 0.6 && r.burst(0.5, 0.035, 0.5),
        (jt.wasOn = on));
    }
    for (let gu of gusts) {
      let on = gustState(gu, _).on;
      (on && !gu.wasOn && o !== `count` && gu.x1 < v + b * 1.1 && gu.x2 > v - b * 0.1 && (r.burst(0.9, 0.04, 0.35), r.burst(0.6, 0.02, 1.1)),
        (gu.wasOn = on));
    }
  }
  // --- IA : simulation exacte de la même physique ---------------------
  function simRunner(e, dir, jumpAt, maxF, stopOnLand) {
    let c = { ...e },
      dt = 1 / 60,
      saved = movers.length ? movers.map((m) => [m.x, m.y]) : null,
      dead = -1,
      invalid = !1,
      jetted = !1,
      left = !c.grounded,
      landed = -1,
      air = -1,
      airX = 0,
      fr = 0;
    for (; fr < maxF; fr++) {
      fr > 0 &&
        ((c.lock = Math.max(0, c.lock - dt)),
        (c.stun = Math.max(0, (c.stun || 0) - dt)),
        saved && setMovers(_ + fr * dt, [c]));
      c.drop = Math.max(0, c.drop - dt);
      let dd = (c.stun || 0) > 0 ? 0 : Array.isArray(dir) ? dir[Math.min(fr, dir.length - 1)] : dir,
        acc = c.grounded ? M : ae;
      if (dd !== 0) {
        let dv = dd * k * c.speed * (dd > 0 ? gustSlow(c, _ + fr * dt) : 1) - c.vx;
        c.vx += Math.sign(dv) * Math.min(Math.abs(dv), acc * dt);
      } else {
        let fz = N * dt * (c.grounded ? 1 : 0.25);
        Math.abs(c.vx) <= fz ? (c.vx = 0) : (c.vx -= Math.sign(c.vx) * fz);
      }
      c.coyote = c.grounded ? P : Math.max(0, c.coyote - dt);
      if (fr === jumpAt) {
        if (!(c.lock <= 0 && (c.grounded || c.coyote > 0))) {
          invalid = !0;
          break;
        }
        ((c.vy = j), (c.grounded = !1), (c.coyote = 0), (c.lock = c.you ? 0 : 0.28), (left = !0));
      }
      let gr = c.vy < 0 ? te : A;
      (Math.abs(c.vy) < re && (gr = ne), (c.vy = Math.min(ie, c.vy + gr * dt)), jetPush(c, _ + fr * dt) && (jetted = !0), Re(c, dt));
      if (c.y > se || s.hazards.some((hz) => fe(c, hz)) || dynHit(c, _ + fr * dt)) {
        dead = fr;
        break;
      }
      if (!c.grounded) ((left = !0), air < 0 && ((air = fr), (airX = c.x)));
      else if (left && landed < 0) landed = fr;
      // après la réception, encore 6 images : se poser juste devant une ronce n'est pas « sûr »
      if (stopOnLand && landed >= 0 && fr - landed >= 6) break;
    }
    if (saved) movers.forEach((m, ix) => ((m.x = saved[ix][0]), (m.y = saved[ix][1])));
    // « sûr » = ni mort ni saut impossible, et on finit posé (pas en pleine chute à l'horizon)
    return { dead, invalid, landed, air, frames: fr + 1, x: c.x, st: c, jetted, dangerX: dead >= 0 && (air < 0 || dead < air) ? c.x : air >= 0 ? airX : c.x, safe: dead < 0 && !invalid && !jetted && (c.grounded || landed >= 0) };
  }
  function aiDecide(e) {
    if ((e.stun || 0) > 0) return ((e.plan = null), { dir: 0, jump: !1 });
    // Arrêté au bord d'un trou qui demande de l'élan : on recule un peu, puis on repart.
    let wt = e.waitT || 0;
    e.waitT = 0;
    if ((e.backT || 0) > 0) {
      e.backT -= 1 / 60;
      if (simRunner(e, -1, -1, 60, !0).safe) return ((e.plan = null), { dir: -1, jump: !1 });
      e.backT = 0;
    }
    let can = e.lock <= 0 && (e.grounded || e.coyote > 0);
    // Saut déjà planifié (cibles mobiles) : on s'y tient tant qu'il reste sûr.
    if (can && e.plan != null) {
      let rem = Math.round((e.plan - _) * 60);
      if (rem <= 0) {
        e.plan = null;
        if (simRunner(e, 1, 0, 85, !0).safe) return { dir: 1, jump: !0 };
      } else {
        if (simRunner(e, 1, rem, 85, !0).safe) return { dir: 1, jump: !1 };
        e.plan = null;
      }
    }
    if (!can) {
      e.plan = null;
      let best = { dir: 1, jump: !1 },
        bestDead = -1;
      for (let dd of [1, 0, -1]) {
        let rs = simRunner(e, dd, -1, e.grounded ? 40 : 90, !e.grounded);
        if (rs.safe) return { dir: dd, jump: !1 };
        rs.dead > bestDead && ((bestDead = rs.dead), (best = { dir: dd, jump: !1 }));
      }
      return best;
    }
    let walk = simRunner(e, 1, -1, 70, !0);
    let moving = (walk.x - e.x) / walk.frames > (k / 60) * e.speed * 0.4;
    if (walk.safe && moving) return { dir: 1, jump: !1 };
    // Bloqué (rocher, tronc) : sauter tout de suite. Sinon : sauter le plus tard possible.
    // (on ne retarde le saut que si l'on reste au sol pendant le délai : pas de « coyote » repoussé)
    for (let dl of !e.grounded || (walk.safe && Math.abs(e.vx) < 30) ? [0] : [6, 3, 0]) {
      if (dl > 0 && walk.air >= 0 && walk.air <= dl) continue;
      let rs = simRunner(e, 1, dl, 85, !0);
      // un saut « sûr » qui retombe avant l'endroit où la marche échoue ne règle rien (petit saut inutile)
      if (rs.safe && (walk.safe || rs.x > walk.dangerX + e.w)) return (dl > 0 && (e.plan = _ + dl / 60), { dir: 1, jump: dl === 0 });
    }
    // Bloqué sans danger (contre un rocher) : on continue d'avancer, la situation change.
    if (walk.safe) return { dir: 1, jump: !1 };
    // Danger encore loin (ni chute ni contact dans les 8 prochaines images) : on avance.
    let commit = Math.min(walk.dead < 0 ? 99 : walk.dead, walk.air < 0 ? 99 : walk.air);
    if (!walk.safe && commit > 8) return { dir: 1, jump: !1 };
    let wait = simRunner(e, 0, -1, 40, !1);
    if (wait.safe) {
      e.grounded && Math.abs(e.vx) < 20 && (wt += 1 / 60);
      wt > 0.7 ? ((e.backT = 0.35), (wt = 0)) : 0;
      e.waitT = wt;
      return { dir: 0, jump: !1 };
    }
    let back = simRunner(e, -1, -1, 30, !1);
    if (back.safe) return { dir: -1, jump: !1 };
    let jmp = simRunner(e, 1, 0, 85, !0),
      opts = [
        [walk.dead, { dir: 1, jump: !1 }],
        [jmp.dead, { dir: 1, jump: !0 }],
        [wait.dead, { dir: 0, jump: !1 }],
      ];
    return opts.sort((p1, p2) => p2[0] - p1[0])[0][1];
  }
  function aiStep(e) {
    let dc = aiDecide(e);
    e.you && window.__aiDebug && (window.__aiLog ||= []).push([Math.round(e.x), Math.round(e.y), e.grounded, dc.dir, dc.jump, e.plan, _.toFixed(3)].join(' '));
    return ((e.aiDir = dc.dir), dc.jump);
  }
  function autoInput(e) {
    let jmp = aiStep(e);
    return { left: e.aiDir < 0, right: e.aiDir > 0, jump: !0, down: !1, edge: jmp };
  }
  // --- Pilote « humain » (tools/playtest.mjs --human) -------------------
  // Même cerveau que l'autopilote, mais : décisions prises avec un délai de réaction D (150–200 ms,
  // tiré par essai) sur l'état extrapolé à +D (le joueur anticipe avec ce qu'il a déjà « commandé »),
  // exécution décalée de D ; sauts décalés d'un jitter gaussien (σ, borné ±2σ) ; durée d'appui sur
  // saut aléatoire (relâcher tôt = saut plus bas). Graine fixe → essais reproductibles.
  function rng32(a) {
    return () => ((a = (a + 0x6d2b79f5) | 0), (a = Math.imul(a ^ (a >>> 15), 1 | a)), (a = (a + Math.imul(a ^ (a >>> 7), 61 | a)) ^ a), ((a ^ (a >>> 14)) >>> 0) / 4294967296);
  }
  function humanReset(opt) {
    let rnd = rng32((opt.seed ?? 1) * 2654435761);
    hum = {
      opt, rnd,
      D: Math.round((opt.delayMin + (opt.delayMax - opt.delayMin) * rnd()) * 60),
      f: 0, q: new Map(), jumpAt: -1, holdEnd: -1, dir: 1, plan: null, deaths: -1, jumps: 0, calmWaits: 0, pauseTo: 0, cAir: !1,
    };
  }
  function gauss(rnd) {
    let u = Math.max(1e-9, rnd()), w = rnd();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * w);
  }
  function humanInput(e) {
    let H = hum, D = H.D, f = ++H.f;
    if (e.deaths !== H.deaths) ((H.deaths = e.deaths), H.q.clear(), (H.jumpAt = -1), (H.holdEnd = -1), (H.plan = null), (H.dir = e.deaths > 0 ? 0 : 1)); // après une chute : on repart après le délai de réaction
    // 1) cerveau : extrapole D images avec les commandes déjà en file, décide pour l'image f + D
    let dirs = [];
    for (let i = 0; i < D; i++) dirs.push(H.q.get(f + i) ?? H.dir);
    let ex = simRunner(e, dirs, H.jumpAt >= f && H.jumpAt < f + D ? H.jumpAt - f : -1, D, !1);
    ex.invalid && (ex = simRunner(e, dirs, -1, D, !1)); // saut en file impossible (en l'air) : tampon moteur
    if (ex.dead < 0 && !ex.invalid) {
      let c = ex.st, t0 = _, sv = movers.map((m) => [m.x, m.y]);
      ((c.plan = H.plan), (c.waitT = H.waitT), (c.backT = H.backT), (_ = t0 + D / 60), setMovers(_));
      let dc = aiDecide(c),
        aim = dc.jump ? 0 : -1;
      // Un humain ne saute pas « au dernier moment » : devant un trou ou une ronce, il vise le milieu
      // de la fenêtre de sauts sûrs (calculée une fois, à l'approche), puis s'y tient.
      if (aim < 0 && dc.dir === 1 && H.jumpAt < f && c.grounded && c.lock <= 0) {
        let walk = simRunner(c, 1, -1, 70, !0);
        if (!walk.safe) {
          let lim = Math.min(45, Math.max(0, Math.min(walk.air >= 0 ? walk.air : 99, walk.dead >= 0 ? walk.dead : 99))),
            k0 = -1, k1 = -1;
          for (let k2 = 0; k2 <= lim; k2++) {
            let r2 = simRunner(c, 1, k2, 85, !0),
              ok2 = r2.safe && r2.x > walk.dangerX + c.w; // un saut qui retombe avant le danger ne compte pas
            if (ok2) (k0 < 0 && (k0 = k2), (k1 = k2));
            else if (k0 >= 0) break;
          }
          k0 >= 0 && (aim = Math.round((k0 + k1) / 2));
        }
      }
      // Rafales (v4) : un humain attentif « joue les accalmies » — il ne prend pas un saut au-dessus
      // du vide pendant la rafale, ni quand les herbes couchées annoncent une rafale qui arrivera
      // avant la fin du saut (≈ 0,8 s) ; il attend le calme sur place (si c'est sûr), même si un
      // saut « au ras » serait encore possible. Option `calm` (profil attentif ; --calm 0 = pressé).
      if (H.opt.calm && gusts.length && c.grounded && (aim >= 0 || H.jumpAt >= f + D)) {
        let tj = t0 + (D + Math.max(0, aim)) / 60, w2 = simRunner(c, 1, -1, 70, !0);
        if (!w2.safe && w2.air >= 0 && (w2.dead < 0 || w2.air <= w2.dead)) {
          let windy = gusts.some((gu) => gu.x2 > c.x && gu.x1 < c.x + 320 && (gustState(gu, tj).on || (gustState(gu, tj).warn > 0 && gustState(gu, tj + 0.8).on)));
          if (windy && simRunner(c, 0, -1, 40, !1).safe) {
            (aim = -1), (dc = { dir: 0, jump: !1 }), (c.plan = null), H.jumpAt >= f + D && (H.jumpAt = -1), (H.calmWaits += 1);
          }
        }
      }
      // Hésitations : après une réception, il arrive qu'on lâche la direction un instant (on regarde
      // la suite, on se recale) ; seulement si s'arrêter là est sûr. Elles étalent les temps d'arrivée
      // (sans elles, tous les essais sans chute finissent au dixième près au temps du pilote auto).
      if (c.grounded && H.cAir && H.opt.hesitP > 0 && H.rnd() < H.opt.hesitP)
        H.pauseTo = f + D + Math.round((H.opt.pauseMin + (H.opt.pauseMax - H.opt.pauseMin) * H.rnd()) * 60);
      H.cAir = !c.grounded;
      if (f + D < (H.pauseTo || 0) && aim < 0 && H.jumpAt < f && dc.dir === 1 && simRunner(c, 0, -1, 40, !1).safe) dc = { dir: 0, jump: !1 };
      ((H.plan = c.plan), (H.waitT = c.waitT), (H.backT = c.backT), (_ = t0), movers.forEach((m, ix) => ((m.x = sv[ix][0]), (m.y = sv[ix][1]))));
      // saut prévu : on garde l'élan jusqu'à l'appel (pas de freinage de dernière seconde)
      H.q.set(f + D, H.jumpAt >= f + D || aim > 0 ? 1 : dc.dir);
      window.__humDebug && (window.__humLog ||= []).push([f, Math.round(e.x) + "," + Math.round(e.y), Math.round(e.vx), e.grounded, Math.round(c.x), dc.dir, dc.jump, aim, H.jumpAt, (H.waitT||0).toFixed(2), (H.backT||0).toFixed(2), c.grounded, Math.round(c.vx)].join(' '));
      if (aim >= 0 && H.jumpAt < f) {
        let sg = H.opt.jitter * 60, j2 = Math.round(Math.max(-2 * sg, Math.min(2 * sg, gauss(H.rnd) * sg)));
        H.jumpAt = Math.max(f + 1, f + D + aim + j2);
      }
    } else {
      // l'extrapolation finit mal (on n'a pas vu venir) : réflexe sur l'état présent, exécuté à l'image suivante
      let c = { ...e, plan: H.plan, waitT: H.waitT, backT: H.backT },
        dc = aiDecide(c);
      ((H.plan = c.plan), (H.waitT = c.waitT), (H.backT = c.backT));
      for (let i = 1; i <= D; i++) H.q.set(f + i, dc.dir);
      dc.jump && H.jumpAt < f && (H.jumpAt = f + 1);
    }
    // 2) mains : exécutent la file
    H.q.has(f) && ((H.dir = H.q.get(f)), H.q.delete(f));
    let edge = f === H.jumpAt;
    edge && ((H.jumps += 1), (H.holdEnd = f + Math.round((H.opt.holdMin + (H.opt.holdMax - H.opt.holdMin) * H.rnd()) * 60)));
    return { left: H.dir < 0, right: H.dir > 0, jump: f <= H.holdEnd, down: !1, edge };
  }
  function saveFinish(e) {
    let place =
      1 + u.filter((rr) => rr !== e && rr.finishTime != null && rr.finishTime < e.finishTime).length;
    cb.onFinish({ levelId: s.id, time: e.finishTime, coins: f.size, place });
  }
  // --- Rendu des éléments dynamiques ------------------------------------
  function drawDynamic() {
    let th = T[s.theme];
    // Reflets mouvants sur le gave (nuit)
    if (th.water)
      for (let wg of waterGaps) {
        n.fillStyle = th.waterHi;
        for (let q = 0; q < wg.w / 26; q++) {
          let ph = q * 1.7 + wg.x * 0.01,
            rx = wg.x + ((q * 26 + _ * 18 + Math.sin(ph) * 8) % Math.max(1, wg.w - 14));
          ((n.globalAlpha = 0.25 + 0.25 * Math.sin(_ * 2.2 + ph)),
            n.fillRect(rx, wg.y + 7 + (q % 3) * 7, 12, 2));
        }
        n.globalAlpha = 1;
      }
    for (let fl of flies) {
      let fx = fl.x + Math.sin(_ * 0.9 + fl.ph) * 14,
        fy = fl.y + Math.sin(_ * 1.3 + fl.ph * 2) * 8,
        al = 0.55 + 0.45 * Math.sin(_ * 3 + fl.ph);
      ((n.globalCompositeOperation = `lighter`),
        (n.fillStyle = `rgba(200,235,90,${0.22 * al})`),
        n.beginPath(),
        n.arc(fx, fy, 10, 0, Math.PI * 2),
        n.fill(),
        (n.fillStyle = `rgba(225,250,120,${0.45 * al})`),
        n.beginPath(),
        n.arc(fx, fy, 4.5, 0, Math.PI * 2),
        n.fill(),
        (n.fillStyle = `rgba(255,255,215,${0.6 + 0.4 * al})`),
        n.beginPath(),
        n.arc(fx, fy, 2.2, 0, Math.PI * 2),
        n.fill(),
        (n.globalCompositeOperation = `source-over`));
    }
    for (let m of movers) {
      let mv = m.move;
      ((n.strokeStyle = `rgba(243,237,226,0.22)`),
        (n.lineWidth = 2),
        n.setLineDash([6, 8]),
        n.beginPath(),
        n.moveTo(mv.x0 + m.w / 2, mv.y0 + 9),
        n.lineTo(mv.x0 + mv.dx + m.w / 2, mv.y0 + mv.dy + 9),
        n.stroke(),
        n.setLineDash([]),
        ge(n, m, th),
        (n.fillStyle = `#f26522`),
        n.fillRect(m.x + 4, m.y + 6, 6, 6),
        n.fillRect(m.x + m.w - 10, m.y + 6, 6, 6));
    }
    for (let fl of falls) {
      let st = fallState(fl, _),
        cx = fl.x + fl.size / 2;
      if (st.warn != null) {
        ((n.fillStyle = `rgba(0,0,0,${0.12 + st.warn * 0.3})`),
          n.beginPath(),
          n.ellipse(cx, fl.groundY, 8 + st.warn * 14, 4, 0, 0, Math.PI * 2),
          n.fill(),
          (n.fillStyle = th.rockDark));
        for (let q = 0; q < 3; q++) {
          let py = ((st.warn * 2.2 + q / 3) % 1) * (fl.groundY - 30);
          n.fillRect(fl.x + 6 + q * 9, py, 4, 4);
        }
        // panneau « ! » en haut de l'écran, qui clignote de plus en plus vite
        if (st.warn > 0.35 && Math.sin(_ * (10 + st.warn * 20)) > -0.2) {
          let ty = y + 70;
          ((n.fillStyle = `#f0c14a`),
            n.beginPath(),
            n.moveTo(cx, ty - 14),
            n.lineTo(cx + 13, ty + 9),
            n.lineTo(cx - 13, ty + 9),
            n.fill(),
            (n.fillStyle = `#142018`),
            n.fillRect(cx - 1.5, ty - 6, 3, 8),
            n.fillRect(cx - 1.5, ty + 4, 3, 3));
        }
      } else if (st.rock) {
        let hgt = (fl.groundY - st.rock.y) / (fl.groundY - fl.top);
        ((n.fillStyle = `rgba(0,0,0,${0.45 - hgt * 0.25})`),
          n.beginPath(),
          n.ellipse(cx, fl.groundY, 22 - hgt * 8, 5, 0, 0, Math.PI * 2),
          n.fill(),
          me(n, { x: st.rock.x - 3, y: st.rock.y - 3, w: st.rock.w + 6, h: st.rock.h + 4 }, { rock: `#141018`, rockDark: `#141018` }),
          me(n, st.rock, th),
          (n.fillStyle = `#f0c14a`),
          n.fillRect(st.rock.x + 12, st.rock.y + 14, 4, 4));
      } else if (st.impact < 0.35) {
        let k2 = st.impact / 0.35;
        n.fillStyle = th.rock;
        n.globalAlpha = 1 - k2;
        for (let q = 0; q < 6; q++)
          n.fillRect(cx + (q - 2.5) * 10 * (0.5 + k2 * 2), fl.groundY - 6 - Math.sin(k2 * Math.PI) * (10 + q * 3), 5, 5);
        n.globalAlpha = 1;
      }
    }
    for (let jt of jets) drawJet(jt);
    for (let sg of s.signs || []) drawSign(sg, th);
    for (let gu of gusts) drawGust(gu, th);
    for (let dg of dogs) {
      let rc = dogRect(dg, _),
        st = Math.sin(_ * 16) * 4;
      (n.save(),
        n.translate(rc.x + rc.w / 2, rc.y + rc.h),
        n.scale(rc.dir, 1),
        (n.fillStyle = `rgba(0,0,0,0.22)`),
        n.beginPath(),
        n.ellipse(0, 1, 26, 5, 0, 0, Math.PI * 2),
        n.fill(),
        (n.fillStyle = `#cfc6b6`),
        n.fillRect(-19 + st * 0.5, -13, 6, 13),
        n.fillRect(-9 - st * 0.5, -13, 6, 13),
        n.fillRect(8 + st * 0.5, -13, 6, 13),
        n.fillRect(17 - st * 0.5, -13, 6, 13),
        (n.strokeStyle = `#f3ede2`),
        (n.lineWidth = 6),
        (n.lineCap = `round`),
        n.beginPath(),
        n.moveTo(-23, -22),
        n.quadraticCurveTo(-34, -30 + Math.sin(_ * 9) * 3, -29, -38),
        n.stroke(),
        (n.fillStyle = `#f3ede2`),
        n.beginPath(),
        n.ellipse(0, -21, 25, 12, 0, 0, Math.PI * 2),
        n.fill(),
        n.beginPath(),
        n.ellipse(22, -28, 11, 10, 0, 0, Math.PI * 2),
        n.fill(),
        (n.fillStyle = `#d8cfbf`),
        n.beginPath(),
        n.ellipse(18, -29, 4, 8, 0.35, 0, Math.PI * 2),
        n.fill(),
        (n.fillStyle = `#b8433a`),
        n.fillRect(11, -27, 5, 12),
        (n.fillStyle = `#1b1b1b`),
        n.fillRect(31, -29, 4, 3),
        n.fillRect(24, -32, 2, 2),
        n.restore());
    }
  }
  // Inclinaison (0 = droite, 1 = couchée vers la gauche) d'une touffe en x : pendant l'annonce,
  // le front de vent arrive de la droite et couche les herbes jusqu'à l'entrée de la zone.
  function gustLean(gu, st, x) {
    if (st.on) return 1;
    if (st.warn > 0) {
      let rel = (gu.x2 - x) / Math.max(1, gu.x2 - gu.x1);
      return 0.9 * L((st.warn * 1.35 - rel) * 4, 0, 1);
    }
    return Math.max(0, 1 - st.since / 0.35);
  }
  function drawGust(gu, th) {
    if (gu.x2 < v - 80 || gu.x1 > v + b + 80) return;
    let st = gustState(gu, _),
      col = th.tuft || `#e3d9a6`;
    // touffes d'herbe qui se couchent (vent de face : elles penchent vers la gauche)
    n.lineCap = `round`;
    for (let q = 0; q < gu.tufts.length; q++) {
      let t = gu.tufts[q];
      if (t.x < v - 30 || t.x > v + b + 30) continue;
      let ln = gustLean(gu, st, t.x),
        fl = ln > 0.5 ? Math.sin(_ * 17 + t.ph) * 0.12 : Math.sin(_ * 2 + t.ph) * 0.08,
        an = ln * 1.2 + fl;
      for (let bl = -1; bl <= 1; bl++) {
        let a2 = an + bl * 0.22 * (1 - ln * 0.7),
          hh = t.h * (bl ? 0.8 : 1);
        ((n.strokeStyle = bl ? th.grassDark : col),
          (n.lineWidth = bl ? 2 : 2.6),
          n.beginPath(),
          n.moveTo(t.x + bl * 3, t.y),
          n.quadraticCurveTo(t.x + bl * 3 - Math.sin(a2 * 0.5) * hh * 0.6, t.y - Math.cos(a2 * 0.5) * hh * 0.6, t.x + bl * 3 - Math.sin(a2) * hh, t.y - Math.cos(a2) * hh),
          n.stroke());
      }
    }
    // manche à air à l'entrée de la zone : pend au calme, se lève à l'annonce, tendue pendant la rafale
    if (gu.pole) {
      let px = gu.pole.x, py = gu.pole.y, ext = gustLean(gu, st, gu.x1),
        droop = (1 - ext) * 1.25 + (ext > 0.5 ? Math.sin(_ * 14) * 0.05 : 0);
      ((n.fillStyle = th.woodDark), n.fillRect(px - 2, py - 92, 4, 92));
      n.save();
      n.translate(px, py - 88);
      n.rotate(-droop); // vers la gauche (sens du vent), qui retombe au calme
      for (let q = 0; q < 5; q++) {
        let x0 = -q * 11, r0 = 9 - q * 1.2, r1 = 9 - (q + 1) * 1.2;
        ((n.fillStyle = q % 2 ? `#f3ede2` : `#f26522`),
          n.beginPath(),
          n.moveTo(x0, -r0),
          n.lineTo(x0 - 11, -r1),
          n.lineTo(x0 - 11, r1),
          n.lineTo(x0, r0),
          n.fill());
      }
      n.restore();
    }
    // rafale active : stries de vent et feuilles qui filent vers la gauche
    if (st.on || st.warn > 0.6) {
      let a = st.on ? Math.min(1, st.k * 10) * (st.k > 0.85 ? (1 - st.k) / 0.15 : 1) : (st.warn - 0.6) * 0.8,
        zw = gu.x2 - gu.x1;
      n.strokeStyle = `rgba(255,255,255,${0.55 * a})`;
      n.lineWidth = 2;
      for (let q = 0; q < 14; q++) {
        let sx = gu.x2 - ((_ * 760 + q * 211) % zw),
          sy = y + 70 + ((q * 97) % (E - 150)),
          ln2 = 36 + (q % 4) * 14;
        if (sx < v - 80 || sx > v + b + 20) continue;
        (n.beginPath(), n.moveTo(sx, sy), n.quadraticCurveTo(sx + ln2 * 0.5, sy - 5, sx + ln2, sy), n.stroke());
      }
      if (st.on) {
        n.fillStyle = th.leaf;
        for (let q = 0; q < 10; q++) {
          let lx = gu.x2 - ((_ * 520 + q * 157) % zw),
            ly = y + 120 + ((q * 61) % (E - 200)) + Math.sin(_ * 9 + q) * 10;
          lx > v - 10 && lx < v + b + 10 && n.fillRect(lx, ly, 5, 3);
        }
      }
    }
    // panneau « vent » en haut de l'écran : clignote pendant l'annonce, fixe pendant la rafale
    if ((st.warn > 0 && Math.sin(_ * (8 + st.warn * 16)) > -0.3) || st.on) {
      let cx = L(v + b * 0.62, gu.x1 + 40, gu.x2 - 40),
        ty = y + 74;
      ((n.globalAlpha = st.on ? 0.75 : 1),
        (n.fillStyle = `#e9f2f7`),
        n.beginPath(),
        n.roundRect ? n.roundRect(cx - 22, ty - 15, 44, 30, 7) : n.rect(cx - 22, ty - 15, 44, 30),
        n.fill(),
        (n.strokeStyle = `#24384a`),
        (n.lineWidth = 2.5),
        n.beginPath(),
        n.moveTo(cx + 14, ty - 7), n.lineTo(cx - 8, ty - 7), n.arc(cx - 8, ty - 3, 4, -Math.PI / 2, Math.PI, !0),
        n.moveTo(cx + 16, ty), n.lineTo(cx - 14, ty),
        n.moveTo(cx + 12, ty + 7), n.lineTo(cx - 4, ty + 7), n.arc(cx - 4, ty + 3, 4, Math.PI / 2, Math.PI, !1),
        n.stroke(),
        (n.globalAlpha = 1));
    }
  }
  // Panneau de sentier (champ facultatif `signs`, helper panneau() de levels.js) : poteau et
  // planche posés sur le sol en (x, y), texte sur 1 ou 2 lignes (séparées par « | »). Décor seul,
  // aucun effet de jeu.
  function drawSign(sg, th) {
    if (sg.x < v - 160 || sg.x > v + b + 160) return;
    let lines = String(sg.text).split(`|`).map((t) => t.trim()),
      bw = 164, bh = 16 + lines.length * 16, top = sg.y - 64 - bh, x0 = sg.x - bw / 2;
    ((n.fillStyle = `rgba(0,0,0,0.22)`), n.beginPath(), n.ellipse(sg.x, sg.y + 1, 18, 4, 0, 0, Math.PI * 2), n.fill());
    ((n.fillStyle = th.woodDark), n.fillRect(sg.x - 3, top + bh - 4, 6, sg.y - top - bh + 4));
    ((n.fillStyle = th.woodDark), n.beginPath(),
      n.roundRect ? n.roundRect(x0 - 3, top - 3, bw + 6, bh + 6, 6) : n.rect(x0 - 3, top - 3, bw + 6, bh + 6), n.fill());
    ((n.fillStyle = `#f4d35e`), n.beginPath(),
      n.roundRect ? n.roundRect(x0, top, bw, bh, 4) : n.rect(x0, top, bw, bh), n.fill());
    ((n.strokeStyle = `#24384a`), (n.lineWidth = 2), n.strokeRect(x0 + 4, top + 4, bw - 8, bh - 8));
    n.save();
    ((n.fillStyle = `#1f2a33`), (n.font = `800 14px Outfit, sans-serif`), (n.textAlign = `center`), (n.textBaseline = `middle`));
    lines.forEach((t, i) => n.fillText(t, sg.x, top + 16 + i * 16));
    n.restore();
  }
  function drawJet(jt) {
    let st = jetState(jt, _),
      top = Math.max(jt.top, y - 60),
      bot = Math.min(jt.bottom, y + E + 60),
      cx = jt.x + jt.w / 2;
    if (bot <= top) return;
    // lèvre rocheuse d'où sort l'eau (en haut de l'écran si la source est hors champ)
    let lip = Math.max(jt.top, y) + 14;
    ((n.fillStyle = `#2b3a3f`), n.fillRect(jt.x - 14, lip - 16, jt.w + 28, 16));
    if (st.on) {
      // rideau plein : blanc-bleu, stries qui descendent vite
      let a = Math.min(1, st.k * 8);
      ((n.fillStyle = `rgba(214,236,246,${0.78 * a})`), n.fillRect(jt.x, top, jt.w, bot - top));
      n.fillStyle = `rgba(255,255,255,${0.85 * a})`;
      for (let q = 0; q < 5; q++) {
        let sx = jt.x + 5 + q * ((jt.w - 12) / 4),
          off = (_ * 900 + q * 137) % 120;
        for (let yy = top - 120 + off; yy < bot; yy += 120) n.fillRect(sx, yy, 3, 54);
      }
      // écume et embruns sur les bords
      n.fillStyle = `rgba(255,255,255,0.55)`;
      for (let q = 0; q < 8; q++) {
        let ph = (_ * 3 + q * 0.37) % 1;
        (n.beginPath(),
          n.arc(q % 2 ? jt.x - 4 - ph * 16 : jt.x + jt.w + 4 + ph * 16, top + ((q * 97 + _ * 300) % (bot - top)), 3 + ph * 4, 0, Math.PI * 2),
          n.fill());
      }
    } else {
      // pause : simple filet ; avertissement : le filet s'élargit, gouttes, panneau qui clignote
      let wv = 4 + st.warn * (jt.w - 10);
      ((n.fillStyle = `rgba(190,224,240,${0.35 + st.warn * 0.35})`), n.fillRect(cx - wv / 2, top, wv, bot - top));
      if (st.warn > 0) {
        n.fillStyle = `rgba(230,246,255,0.9)`;
        for (let q = 0; q < 6; q++) {
          let py = top + ((_ * 1.6 + q / 6) % 1) * (bot - top);
          n.fillRect(cx - wv / 2 + ((q * 13) % Math.max(4, wv)), py, 3, 9);
        }
        if (Math.sin(_ * (8 + st.warn * 18)) > -0.3) {
          let ty = y + 74;
          ((n.fillStyle = `#7fd3f0`),
            n.beginPath(),
            n.moveTo(cx, ty + 14),
            n.lineTo(cx + 14, ty - 8),
            n.lineTo(cx - 14, ty - 8),
            n.fill(),
            (n.fillStyle = `#0f2330`),
            n.fillRect(cx - 1.5, ty - 5, 3, 7),
            n.fillRect(cx - 1.5, ty + 4, 3, 3));
        }
      }
    }
  }
  function ze(e, t, n) {
    p.length > 90 ||
      p.push({
        x: e,
        y: t,
        vx: -n * (30 + Math.random() * 30),
        vy: -20 - Math.random() * 20,
        life: 0.32,
        max: 0.32,
        color: `rgba(90,70,50,0.4)`,
        size: 4,
      });
  }
  function Be() {
    let e = Y.left,
      t = Y.right,
      n = Y.jump,
      r = !!Y.down;
    for (let i of J)
      (ce.has(i) && (e = !0),
        le.has(i) && (t = !0),
        F.has(i) && (n = !0),
        ue.has(i) && (r = !0));
    let i = q;
    return ((q = !1), { left: e, right: t, jump: n, down: r, edge: i });
  }
  function Ve(e) {
    if (o === `menu` || o === `pause`) return;
    if (((_ += e), setMovers(_, u), tickDynamicSounds(), o === `count`)) {
      if (((V -= e), V <= 0)) {
        ((V = 0), (U = 0.9), (q = !1), Z(`play`), t.onCount(0), r.go(), we());
        return;
      }
      let n = Math.ceil(V);
      n !== H && ((H = n), t.onCount(n), r.beep(n));
      for (let e of u) e.frame = 0;
      return;
    }
    (U > 0 && ((U -= e), U <= 0 && ((U = 0), t.onCount(null))),
      (o === `play` || o === `down` || o === `finish`) && (g += e),
      W > 0 && ((W -= e), W <= 0 && Ee(null)));
    let n = Be(),
      a = o === `play`;
    for (let t of u)
      if (t.you) {
        if (o === `down`) continue;
        !a || t.finished
          ? $(t, e, { left: !1, right: !1, jump: !1, down: !1, edge: !1 })
          : $(t, e, autopilot ? (hum ? humanInput(t) : autoInput(t)) : n);
      } else
        t.finished
          ? $(t, e, { left: !1, right: !1, jump: !1, down: !1, edge: !1 })
          : $(t, e, { left: !1, right: !1, jump: !1, down: !1, edge: !1 });
    if (
      (o === `down` && ((B -= e), B <= 0 && d && (ke(d), Z(`play`))),
      o === `finish` && d?.finishTime != null)
    ) {
      for (let e of u)
        if (!e.finished && g > d.finishTime + 16) {
          let t = Math.max(0, s.finishX - e.x) / (k * e.speed);
          ((e.finished = !0), (e.finishTime = g + t));
        }
      ((K -= e), K <= 0 && ((K = 0.25), Ne()));
    }
    let c = 0;
    for (let t of p)
      ((t.life -= e),
        !(t.life <= 0) &&
          ((t.vy += 420 * e),
          (t.x += t.vx * e),
          (t.y += t.vy * e),
          (p[c++] = t)));
    if (
      ((p.length = c), d && (o === `play` || o === `down` || o === `finish`))
    ) {
      let t = L(d.vx * 0.28, -40, 150),
        n = Math.max(0, s.width - b),
        r = L(d.x + d.w * 0.5 - b * 0.36 + t, 0, n),
        a = i ? 1 : 1 - Math.exp(-5 * e);
      v += (r - v) * a;
      let o = L(d.y - E * 0.62, -24, 150);
      ((y += (o - y) * (i ? 1 : 1 - Math.exp(-3.2 * e))),
        (z = Math.max(0, z - e * 1.5)),
        we());
    }
  }
  function He() {
    let t = e.clientWidth || 1,
      n = e.clientHeight || 1;
    x = Math.min(2, window.devicePixelRatio || 1);
    let r = Math.max(1, Math.round(t * x)),
      i = Math.max(1, Math.round(n * x));
    ((e.width !== r || e.height !== i) && ((e.width = r), (e.height = i)),
      (b = L((t / n) * E, 520, 1120)),
      (R = Math.min(t / b, n / E)),
      (S = (t - b * R) / 2),
      (C = (n - E * R) / 2));
  }
  function Ue() {
    e.clientWidth < 2 ||
      (n.setTransform(x, 0, 0, x, 0, 0),
      (n.fillStyle = `#0b100e`),
      n.fillRect(0, 0, e.clientWidth, e.clientHeight),
      n.setTransform(x * R, 0, 0, x * R, S * x, C * x),
      (n.imageSmoothingEnabled = !0),
      o === `menu` ? We(performance.now() / 1e3) : Ge());
  }
  function We(e) {
    let t = T[c];
    (Ke(t, e, 0),
      qe(t, e * 18, b),
      Ye(t, e * 24, 0.4),
      (n.fillStyle = t.grass),
      n.fillRect(0, 444, b, 96),
      (n.fillStyle = t.dirt),
      n.fillRect(0, 462, b, 78),
      (n.fillStyle = t.grassDark));
    for (let e = 0; e < b; e += 16) n.fillRect(e, 456, 2, 10);
    let r = [`ines`, `karim`, `lea`, `hero`],
      i = b * 0.62;
    r.forEach((t, n) => {
      let r = Math.sin(e * 10 + n) * 2,
        a = Math.floor(e * 9 + n) % 4;
      Ze({
        x: i + n * 46,
        y: 406 + r,
        w: D,
        h: O,
        facing: 1,
        frame: a,
        squash: 0,
        sheet: t,
        bib: t === `hero` ? 42 : (I.find((e) => e.sheet === t)?.bib ?? 1),
        color:
          t === `hero`
            ? `#f26522`
            : (I.find((e) => e.sheet === t)?.color ?? `#fff`),
        invuln: 0,
        anim: e * 9,
      });
    });
  }
  function Ge() {
    let e = T[s.theme],
      t = i ? 0 : z * z * 12,
      r = (Math.random() - 0.5) * t,
      a = (Math.random() - 0.5) * t;
    (Ke(e, _, v), qe(e, v, b));
    for (let t of m) {
      let n = t.x - v * t.layer;
      n < -60 || n > b + 60 || Xe(n, 250 + t.kind * 40, t.h, e, t.kind);
    }
    (n.save(),
      n.translate(-Math.round(v) + r, -Math.round(y) + a),
      h && n.drawImage(h, 0, 0),
      drawDynamic());
    let c = _;
    for (let e of s.checkpoints) {
      let t = d ? s.checkpoints.indexOf(e) <= d.checkpoint : !1;
      be(n, e.x, e.y, t, c);
    }
    for (let e of s.coins) f.has(e.id) || ye(n, e.x, e.y, c);
    let l = u.slice().sort((e, t) => e.x - t.x);
    for (let e of l) Ze(e);
    for (let e of p)
      ((n.globalAlpha = Math.max(0, e.life / e.max)),
        (n.fillStyle = e.color),
        n.fillRect(e.x, e.y, e.size, e.size),
        (n.globalAlpha = 1));
    (n.restore(),
      o === `down` &&
        ((n.fillStyle = `rgba(160, 40, 28, ${0.18 + B * 0.2})`),
        n.fillRect(0, 0, b, E)));
  }
  function Ke(e, t, r) {
    let i = n.createLinearGradient(0, 0, 0, E);
    (i.addColorStop(0, e.skyTop),
      i.addColorStop(0.52, e.skyMid),
      i.addColorStop(1, e.skyBot),
      (n.fillStyle = i),
      n.fillRect(0, 0, b, E),
      (n.fillStyle = `rgba(243, 206, 140, 0.92)`),
      n.beginPath(),
      n.arc(b * 0.8, 78, 34, 0, Math.PI * 2),
      n.fill(),
      (n.fillStyle = `rgba(243,237,226,0.28)`));
    for (let e = 0; e < 3; e++) {
      let i = ((e * 280 - r * 0.08 + t * 12) % (b + 200)) - 80;
      (n.beginPath(),
        n.ellipse(i, 70 + e * 28, 46, 14, 0, 0, Math.PI * 2),
        n.ellipse(i + 28, 76 + e * 28, 28, 11, 0, 0, Math.PI * 2),
        n.fill());
    }
  }
  function qe(e, t, n) {
    (Je(e.ridge, 250, 46, 0.0042, t * 0.22, n),
      Je(e.ridge2, 300, 32, 0.0075, t * 0.38, n));
  }
  function Je(e, t, r, i, a, o) {
    ((n.fillStyle = e), n.beginPath(), n.moveTo(0, E));
    for (let e = 0; e <= o; e += 10) {
      let o = e + a,
        s = t + Math.sin(o * i) * r + Math.sin(o * i * 0.37 + 1.7) * r * 0.45;
      n.lineTo(e, s);
    }
    (n.lineTo(o, E), n.fill());
  }
  function Ye(e, t, n) {
    for (let r = 0; r < 9; r++)
      Xe(((r * 140 - t * n) % (b + 160)) - 40, 390, 90 + (r % 3) * 24, e, r);
  }
  function Xe(e, t, r, i, a) {
    ((n.fillStyle = i.pine),
      n.beginPath(),
      n.moveTo(e, t - r),
      n.lineTo(e + 18 + (a % 4), t),
      n.lineTo(e - 18, t),
      n.fill(),
      (n.fillStyle = i.pine2),
      n.beginPath(),
      n.moveTo(e, t - r * 0.7),
      n.lineTo(e + 13, t - r * 0.28),
      n.lineTo(e - 13, t - r * 0.28),
      n.fill());
  }
  function Ze(e) {
    let t = 1 + e.squash * 0.1,
      r = 1 - e.squash * 0.16,
      i = e.x + e.w * 0.5,
      o = e.y + e.h + 2;
    (n.save(),
      e.invuln > 0 && (n.globalAlpha = 0.55 + Math.sin(_ * 28) * 0.25),
      n.translate(i, o),
      n.scale((e.facing < 0 ? -1 : 1) * t, r),
      (n.fillStyle = `rgba(0,0,0,0.22)`),
      n.beginPath(),
      n.ellipse(0, 0, 16, 5, 0, 0, Math.PI * 2),
      n.fill());
    let s = a[e.sheet];
    if (s.complete && s.naturalWidth > 0) {
      let t = e.frame % 2,
        r = Math.floor(e.frame / 2) % 2,
        i = s.width / 2,
        a = s.height / 2;
      n.drawImage(s, t * i, r * a, i, a, -46, -112, 92, 118);
    } else Qe(e);
    n.restore();
    let c = String(e.bib);
    ((n.font = `700 12px Outfit, sans-serif`),
      (n.textAlign = `center`),
      (n.textBaseline = `middle`));
    let l = i - 11,
      u = e.y - 16;
    ((n.fillStyle = e.color),
      n.fillRect(l, u, 22, 15),
      (n.fillStyle = e.sheet === `karim` ? `#142018` : `#f3ede2`),
      n.fillText(c, i, u + 8));
  }
  function Qe(e) {
    let t = Math.sin(e.anim);
    ((n.fillStyle = `#e0b088`),
      n.beginPath(),
      n.arc(0, -96, 11, 0, Math.PI * 2),
      n.fill(),
      (n.fillStyle = e.color),
      n.fillRect(-11, -84, 22, 26),
      (n.fillStyle = e.sheet === `hero` ? `#1e4d8c` : `#22262c`),
      n.fillRect(-11, -60, 22, 14),
      (n.strokeStyle = `#e0b088`),
      (n.lineWidth = 4),
      n.beginPath(),
      n.moveTo(-4, -48),
      n.lineTo(-4 + t * 8, -6),
      n.moveTo(4, -48),
      n.lineTo(4 - t * 8, -6),
      n.stroke());
  }
  function $e(e) {
    let t = Math.min(0.05, (e - Se) / 1e3);
    ((Se = e), (Ce += t));
    let n = 0;
    if (turbo > 0) for (Ce = 0; n < turbo; n++) Ve(1 / 60);
    else for (; Ce >= 1 / 60 && n < 5;) (Ve(1 / 60), (Ce -= 1 / 60), (n += 1));
    (Ue(), (xe = requestAnimationFrame($e)));
  }
  function et(e) {
    if (
      ((ce.has(e.code) ||
        le.has(e.code) ||
        F.has(e.code) ||
        ue.has(e.code) ||
        e.code === `Escape` ||
        e.code === `KeyR`) &&
        o !== `menu` &&
        e.preventDefault(),
      !e.repeat)
    ) {
      if ((r.unlock(), e.code === `Escape`)) {
        o === `play` ? Z(`pause`) : o === `pause` && Z(`play`);
        return;
      }
      if (e.code === `KeyR` && o !== `menu`) {
        it();
        return;
      }
      o !== `menu` &&
        o !== `pause` &&
        o !== `finish` &&
        (J.add(e.code), F.has(e.code) && (q = !0));
    }
  }
  function tt(e) {
    J.delete(e.code);
  }
  function nt() {
    (J.clear(), (Y.left = !1), (Y.right = !1), (Y.jump = !1), (Y.down = !1));
  }
  function rt(e) {
    ((s = ee(e)),
      (f = new Set()),
      (p = []),
      (g = 0),
      (_ = 0),
      (G = !1),
      (z = 0),
      (B = 0),
      (K = 0),
      initDynamic(),
      De(),
      Oe(),
      (v = 0),
      (y = 30),
      (q = !1),
      J.clear(),
      Te());
  }
  function it() {
    rt(s.id);
  }
  function at() {
    o === `play` && (U > 0 && ((U = 0), t.onCount(null)), Z(`pause`));
  }
  function ot() {
    o === `pause` && Z(`play`);
  }
  function st() {
    (J.clear(), (U = 0), (V = 0), t.onCount(null), Z(`menu`), Ee(null));
  }
  let ct = {
    start: rt,
    restart: it,
    pause: at,
    resume: ot,
    menu: st,
    setName: (e) => {
      ((l = e.trim().slice(0, 16) || `Toi`), d?.you && (d.name = l));
    },
    setMute: (e) => {
      r.muted = e;
    },
    setPreview: (e) => {
      c = e;
    },
    touch: (e, t) => {
      (e === `jump`
        ? (t && !Y.jump && (q = !0), (Y.jump = t))
        : e === `left`
          ? (Y.left = t)
          : e === `down`
            ? (Y.down = t)
            : (Y.right = t),
        r.unlock());
    },
    destroy: () => {
      (cancelAnimationFrame(xe),
        window.removeEventListener(`keydown`, et),
        window.removeEventListener(`keyup`, tt),
        window.removeEventListener(`blur`, nt),
        document.removeEventListener(`visibilitychange`, lt),
        ut.disconnect(),
        delete window.__controlsTest);
    },
  };
  function lt() {
    document.hidden && (J.clear(), o === `play` && Z(`pause`));
  }
  (window.addEventListener(`keydown`, et),
    window.addEventListener(`keyup`, tt),
    window.addEventListener(`blur`, nt),
    document.addEventListener(`visibilitychange`, lt));
  let ut = new ResizeObserver(() => He());
  return (
    ut.observe(e),
    He(),
    document.fonts?.ready &&
      document.fonts.ready.then(() => {
        o !== `menu` && De();
      }),
    (window.__controlsTest = {
      setKeys: (e) => {
        let t = [...J].some((e) => F.has(e));
        J.clear();
        for (let t of e) J.add(t);
        e.some((e) => F.has(e)) && !t && (q = !0);
      },
      getSpeed: () => d?.vx ?? 0,
      getX: () => d?.x ?? 0,
      getY: () => d?.y ?? 0,
      getYaw: () => 0,
      getVy: () => d?.vy ?? 0,
      getMode: () => o,
      setAutopilot: (e, opt) => {
        autopilot = !!e;
        opt?.human
          ? humanReset({ delayMin: 0.15, delayMax: 0.2, jitter: 0.045, holdMin: 0.28, holdMax: 0.55, calm: !0, hesitP: 0.2, pauseMin: 0.1, pauseMax: 0.4, ...opt.human })
          : (hum = null);
      },
      // N pas de simulation par image affichée (0 = temps réel) : pour les essais en masse
      setTurbo: (e) => {
        turbo = Math.max(0, Math.min(60, e | 0));
      },
      getHuman: () => (hum ? { D: hum.D, jumps: hum.jumps, calmWaits: hum.calmWaits } : null),
      teleport: (e, t) => {
        d && ((d.x = e), (d.y = t), (d.vx = 0), (d.vy = 0));
      },
      getState: () => ({
        level: s.id,
        mode: o,
        time: g,
        finishTime: d?.finishTime ?? null, // temps d'arrivée exact du joueur (g continue après l'arche)
        coins: f.size,
        checkpoint: d?.checkpoint ?? -1,
        grounded: !!d?.grounded,
        deaths: d?.deaths ?? 0,
        jetHits: d?.jetHits ?? 0,
        gustTime: d?.gustT ?? 0, // temps passé ralenti par une rafale (v4)
        deathXs: d?.deathXs ?? [],
      }),
      getRunners: () =>
        u.map((e) => ({
          name: e.you ? l : e.name,
          x: Math.round(e.x),
          y: Math.round(e.y),
          deaths: e.deaths,
        })),
      start: (e) => rt(e ?? `sousbois`),
    }),
    (xe = requestAnimationFrame($e)),
    ct
  );
}
function pe(e, t, n) {
  ((e.fillStyle = n.dirt),
    e.fillRect(t.x, t.y, t.w, t.h),
    (e.fillStyle = n.dirtDark),
    e.fillRect(t.x, t.y + 16, t.w, 28),
    (e.fillStyle = n.grass),
    e.fillRect(t.x, t.y, t.w, 12));
  let r = de((t.x * 17 + t.y) >>> 0);
  e.fillStyle = n.grassDark;
  for (let n = t.x + 6; n < t.x + t.w - 4; n += 11) {
    let i = 7 + r() * 9;
    e.fillRect(n, t.y - i + 8, 2, i);
  }
  e.fillStyle = `rgba(255,255,255,0.05)`;
  for (let n = 0; n < t.w / 22; n++)
    e.fillRect(t.x + r() * t.w, t.y + 40 + r() * 70, 4, 2);
  ((e.fillStyle = `rgba(0,0,0,0.18)`),
    e.fillRect(t.x, t.y, 7, Math.min(t.h, 220)),
    e.fillRect(t.x + t.w - 7, t.y, 7, Math.min(t.h, 220)));
  rimTop(e, t, n);
}
// Liseré clair sur le dessus des sols et passerelles (palettes de nuit : thème avec `rim`).
// Purement visuel : rend lisibles les bords et les points d'appel dans le noir.
function rimTop(e, t, n) {
  if (!n.rim) return;
  ((e.fillStyle = n.rim),
    (e.globalAlpha = 0.18),
    e.fillRect(t.x - 1, t.y - 3, t.w + 2, 6),
    (e.globalAlpha = 0.85),
    e.fillRect(t.x, t.y, t.w, 2),
    (e.globalAlpha = 0.6),
    e.fillRect(t.x, t.y, 2, Math.min(t.h, 14)),
    e.fillRect(t.x + t.w - 2, t.y, 2, Math.min(t.h, 14)),
    (e.globalAlpha = 1));
}
function me(e, t, n) {
  ((e.fillStyle = n.rockDark),
    e.beginPath(),
    e.moveTo(t.x, t.y + t.h),
    e.lineTo(t.x + 6, t.y + 16),
    e.quadraticCurveTo(t.x + t.w * 0.5, t.y - 8, t.x + t.w - 4, t.y + 14),
    e.lineTo(t.x + t.w, t.y + t.h),
    e.fill(),
    (e.fillStyle = n.rock),
    e.beginPath(),
    e.moveTo(t.x + 4, t.y + t.h),
    e.lineTo(t.x + 12, t.y + 20),
    e.quadraticCurveTo(t.x + t.w * 0.55, t.y + 2, t.x + t.w - 8, t.y + 18),
    e.lineTo(t.x + t.w - 4, t.y + t.h),
    e.fill());
}
function he(e, t, n) {
  ((e.fillStyle = n.woodDark),
    e.fillRect(t.x, t.y + 6, t.w, t.h - 6),
    (e.fillStyle = n.wood),
    e.beginPath(),
    e.ellipse(t.x + 10, t.y + t.h * 0.55, 12, t.h * 0.42, 0, 0, Math.PI * 2),
    e.fill(),
    (e.fillStyle = n.woodDark),
    e.beginPath(),
    e.ellipse(t.x + 10, t.y + t.h * 0.55, 5, 4, 0, 0, Math.PI * 2),
    e.fill());
}
function ge(e, t, n) {
  ((e.fillStyle = n.woodDark),
    e.fillRect(t.x, t.y, t.w, t.h),
    (e.fillStyle = n.wood),
    e.fillRect(t.x + 2, t.y, t.w - 4, 5),
    (e.fillStyle = `rgba(0,0,0,0.2)`));
  for (let r = t.x + 18; r < t.x + t.w; r += 22) e.fillRect(r, t.y, 2, t.h);
  rimTop(e, t, n);
}
function _e(e, t, n, r, i) {
  ((e.strokeStyle = i.thorn), (e.lineWidth = 3), e.beginPath());
  let a = n + 30;
  for (let i = 0; i < 5; i++) {
    let o = t + (r * (i + 0.4)) / 5;
    (e.moveTo(o - 8, a), e.lineTo(o, n + 2 + (i % 2) * 6), e.lineTo(o + 8, a));
  }
  (e.stroke(), (e.fillStyle = i.leaf));
  for (let i = 0; i < 4; i++) {
    let a = t + 8 + (r / 4) * i;
    (e.beginPath(), e.ellipse(a, n + 14, 7, 4, -0.6, 0, Math.PI * 2), e.fill());
  }
  ((e.fillStyle = i.berry),
    e.beginPath(),
    e.arc(t + r * 0.4, n + 16, 3, 0, Math.PI * 2),
    e.arc(t + r * 0.7, n + 12, 2.5, 0, Math.PI * 2),
    e.fill());
}
function ve(e, t, n, r, i) {
  let a = i ? 176 : 150,
    o = i ? 168 : 132;
  ((e.fillStyle = `#f26522`),
    e.fillRect(t, n - a, 16, a),
    (e.fillStyle = `#1e4d8c`),
    e.fillRect(t + o, n - a, 16, a),
    (e.strokeStyle = `#f3ede2`),
    (e.lineWidth = i ? 16 : 12),
    (e.lineCap = `round`),
    e.beginPath(),
    e.moveTo(t + 8, n - a + 8),
    e.quadraticCurveTo(t + o / 2 + 8, n - a - 64, t + o + 8, n - a + 8),
    e.stroke(),
    (e.fillStyle = `#f3ede2`));
  let s = Math.max(70, r.length * 11);
  (e.fillRect(t + o / 2 + 8 - s / 2, n - a + 26, s, 24),
    (e.fillStyle = `#142018`),
    (e.font = `700 15px Outfit, sans-serif`),
    (e.textAlign = `center`),
    (e.textBaseline = `middle`),
    e.fillText(r, t + o / 2 + 8, n - a + 38));
}
// Balise = logo NOUSTE CORRIDA BARLEST (assets/balise-logo.webp, 96×69), ajusté dans la boîte de
// l'ancienne balise (cercle de rayon 11 → 22×22) sans déformation. Repli sur l'ancien dessin tant
// que l'image n'est pas chargée (ou si elle manque).
var baliseImg = typeof Image < `u` ? new Image() : null,
  baliseOk = !1;
baliseImg &&
  ((baliseImg.onload = () => (baliseOk = baliseImg.naturalWidth > 0)),
  (baliseImg.src = new URL(`./balise-logo.webp`, import.meta.url).href));
function ye(e, t, n, r) {
  let i = Math.sin(r * 3 + t * 0.05) * 4,
    a = 0.35 + Math.abs(Math.sin(r * 2.2 + n)) * 0.65;
  if (baliseOk) {
    let k = Math.min(22 / baliseImg.naturalWidth, 22 / baliseImg.naturalHeight),
      w = baliseImg.naturalWidth * k,
      h = baliseImg.naturalHeight * k;
    (e.save(), e.translate(t, n + i), e.scale(a, 1), e.drawImage(baliseImg, -w / 2, -h / 2, w, h), e.restore());
    return;
  }
  (e.save(),
    e.translate(t, n + i),
    e.scale(a, 1),
    (e.fillStyle = `#e2a53a`),
    e.beginPath(),
    e.arc(0, 0, 11, 0, Math.PI * 2),
    e.fill(),
    (e.fillStyle = `#f6e2a8`),
    e.beginPath(),
    e.arc(0, 0, 6, 0, Math.PI * 2),
    e.fill(),
    e.restore());
}
function be(e, t, n, r, i) {
  e.fillStyle = r ? `#f26522` : `#d9d0c2`;
  let a = Math.sin(i * 6 + t * 0.02) * 5;
  (e.beginPath(),
    e.moveTo(t + 5, n - 74),
    e.quadraticCurveTo(t + 20, n - 66 + a, t + 34, n - 60 + a),
    e.lineTo(t + 30, n - 52 + a * 0.4),
    e.lineTo(t + 5, n - 50),
    e.fill());
}
var z = `crete-trail-v1`,
  B = { version: 1, name: `Toi`, mute: !1, levels: {} };
function V() {
  try {
    let e = localStorage.getItem(z);
    if (!e) return { ...B, levels: {} };
    let t = JSON.parse(e);
    return !t || t.version !== 1
      ? { ...B, levels: {} }
      : {
          version: 1,
          name:
            typeof t.name == `string` && t.name.trim()
              ? t.name.slice(0, 16)
              : `Toi`,
          mute: !!t.mute,
          levels: t.levels && typeof t.levels == `object` ? t.levels : {},
        };
  } catch {
    return { ...B, levels: {} };
  }
}
function H(e) {
  localStorage.setItem(z, JSON.stringify(e));
}
var U = t();
function W(e) {
  // en dixièmes entiers (+ 1e-6 : 14.1 s'affichait « 14.0 » ; calculer minutes/secondes/dixièmes
  // à partir du même entier évite « 0:05.10 » pour 5,9999999 s)
  let d = Math.floor(e * 10 + 1e-6),
    t = Math.floor(d / 600),
    n = Math.floor(d / 10) % 60,
    r = d % 10;
  return `${t}:${String(n).padStart(2, `0`)}.${r}`;
}
// Temps cible de médaille : au dixième comme le chrono, au centième si le calibrage l'impose
// (tools/medals.mjs --calibrate peut choisir un or au 0,05 s quand les temps sont très groupés).
function WT(e) {
  if (Math.abs(e * 10 - Math.round(e * 10)) < 1e-6) return W(e + 1e-6);
  let d = Math.round(e * 100),
    t = Math.floor(d / 6000),
    n = Math.floor(d / 100) % 60,
    c = d % 100;
  return `${t}:${String(n).padStart(2, `0`)}.${String(c).padStart(2, `0`)}`;
}
function G(e) {
  return e <= 0 ? `—` : e === 1 ? `1er` : `${e}e`;
}
// ---- Médailles (champ facultatif `medals` des niveaux, écrit par tools/medals.mjs) ----
// medals: { auto, gold, silver, bronze } en secondes. Sans champ (ou champ invalide) : pas de médailles.
var MEDALS = [
  { key: `gold`, label: `Or`, long: `Médaille d’or`, next: `l’or` },
  { key: `silver`, label: `Argent`, long: `Médaille d’argent`, next: `l’argent` },
  { key: `bronze`, label: `Bronze`, long: `Médaille de bronze`, next: `le bronze` },
];
function medalTargets(L) {
  let md = L && L.medals;
  if (!md || typeof md != `object`) return null;
  let ts = MEDALS.map((x) => ({ ...x, t: md[x.key] }));
  if (!ts.every((x) => typeof x.t == `number` && isFinite(x.t) && x.t > 0)) return null;
  if (!(ts[0].t < ts[1].t && ts[1].t < ts[2].t)) return null;
  return ts;
}
// Meilleure médaille obtenue pour un temps (null si aucune ou pas de médailles pour ce niveau)
function medalOf(L, time) {
  let ts = medalTargets(L);
  return ts && typeof time == `number` && isFinite(time) ? (ts.find((x) => time <= x.t) ?? null) : null;
}
// Médaille suivante à viser après `cur` (null = déjà l'or)
function medalNext(L, cur) {
  let ts = medalTargets(L);
  if (!ts) return null;
  let i = cur ? ts.findIndex((x) => x.key === cur.key) : ts.length;
  return i > 0 ? ts[i - 1] : null;
}
function medalDisc(key, big) {
  return (0, U.jsx)(`span`, {
    className: `medal ${key || `none`}${big ? ` big` : ``}`,
    "aria-hidden": !0,
  });
}
function K() {
  let e = (0, d.useRef)(null),
    t = (0, d.useRef)(null),
    [n, r] = (0, d.useState)(() => V()),
    [f, p] = (0, d.useState)(() => V().name),
    [m, h] = (0, d.useState)(`menu`),
    [g, _] = (0, d.useState)(null),
    [v, y] = (0, d.useState)(null),
    [b, x] = (0, d.useState)([]),
    [S, ee] = (0, d.useState)(C[0].id),
    w = (0, d.useRef)(null),
    T = (0, d.useRef)(null),
    E = (0, d.useRef)(null),
    D = (0, d.useRef)(null),
    O = (0, d.useRef)(null),
    [k, te] = (0, d.useState)(!1),
    // Classement en ligne (leaderboard.js) : écran d'arrivée + top 3 par niveau dans le menu
    [lbData, setLbData] = (0, d.useState)(null),
    [menuTops, setMenuTops] = (0, d.useState)(null),
    lbSent = (0, d.useRef)(``);
  (0, d.useEffect)(() => te(!0), []);
  (0, d.useEffect)(() => {
    if (m !== `menu` || !lbEnabled()) return;
    let alive = !0;
    lbMenuTops().then((r) => alive && r && setMenuTops(r));
    return () => { alive = !1; };
  }, [m]);
  // Nouveau départ (menu, Rejouer, R, niveau suivant) → nouvelle course à envoyer
  (0, d.useEffect)(() => {
    m === `count` && ((lbSent.current = ``), setLbData(null));
  }, [m]);
  function lbOnFinish(e) {
    if (!lbEnabled()) return;
    let key = `${e.levelId}:${e.time}`;
    if (lbSent.current === key) return;
    lbSent.current = key;
    let name = A.current, levelId = e.levelId;
    setLbData({ levelId, status: `loading`, top: null, me: null });
    (async () => {
      let can = lbCanSubmit(name),
        sent = can ? await lbSubmit({ levelId, name, timeMs: e.time * 1000, balises: e.coins }) : !1;
      sent && lbInvalidate();
      let [top, me] = await Promise.all([lbTop(levelId, 10), can ? lbRank(levelId, name) : null]);
      setLbData((o) =>
        o && o.levelId === levelId && lbSent.current === key
          ? { levelId, status: top ? (can ? (sent ? `ok` : `rejected`) : `noname`) : `err`, top, me, name }
          : o,
      );
    })();
  }
  let A = (0, d.useRef)(f),
    ne = (0, d.useRef)(n);
  ((A.current = f),
    (ne.current = n),
    (0, d.useEffect)(() => {
      let n = e.current;
      if (!n) return;
      let i = R(n, {
        onMode: h,
        onToast: _,
        onCount: y,
        onHud: (e) => {
          (w.current && (w.current.textContent = W(e.time)),
            T.current && (T.current.textContent = `${e.coins}/${e.coinTotal}`),
            E.current && (E.current.textContent = G(e.place)),
            D.current && (D.current.textContent = `${e.meters} m`),
            O.current && (O.current.hidden = e.time > 4.2));
        },
        onRank: x,
        onFinish: (e) => {
          lbOnFinish(e);
          r((t) => {
            let n = t.levels[e.levelId],
              r = {
                ...t,
                name: A.current,
                levels: {
                  ...t.levels,
                  [e.levelId]: {
                    bestTime: n ? Math.min(n.bestTime, e.time) : e.time,
                    bestCoins: n ? Math.max(n.bestCoins, e.coins) : e.coins,
                    bestPlace: n ? Math.min(n.bestPlace, e.place) : e.place,
                  },
                },
              };
            return (H(r), r);
          });
        },
      });
      return (
        i.setMute(ne.current.mute),
        i.setName(A.current),
        (t.current = i),
        () => i.destroy()
      );
    }, []));
  function re(e) {
    let n = e.slice(0, 16);
    (p(n),
      t.current?.setName(n),
      r((e) => {
        let t = { ...e, name: n || `Toi` };
        return (H(t), t);
      }));
  }
  function j() {
    r((e) => {
      let n = { ...e, mute: !e.mute };
      return (H(n), t.current?.setMute(n.mute), n);
    });
  }
  function ie(e, n) {
    (ee(e),
      x([]),
      t.current?.setPreview(n),
      t.current?.setName(A.current),
      t.current?.start(e));
  }
  let M = C.find((e) => e.id === S) ?? C[0],
    ae = b.find((e) => e.you),
    nextLvl = C[C.indexOf(M) + 1] ?? null;
  // Écran d'arrivée : Entrée ou N = niveau suivant (sauf si un autre bouton a le focus)
  (0, d.useEffect)(() => {
    if (m !== `finish` || !nextLvl) return;
    let h = (ev) => {
      if (ev.repeat) return;
      let onBtn = document.activeElement?.tagName === `BUTTON`; // Entrée sur un bouton = clic natif
      (ev.code === `KeyN` || ((ev.code === `Enter` || ev.code === `NumpadEnter`) && !onBtn)) &&
        (ev.preventDefault(), ie(nextLvl.id, nextLvl.theme));
    };
    return (window.addEventListener(`keydown`, h), () => window.removeEventListener(`keydown`, h));
  }, [m, nextLvl?.id]);
  return (0, U.jsxs)(`div`, {
    className: `shell`,
    children: [
      (0, U.jsx)(`canvas`, { ref: e, "aria-hidden": !0 }),
      (0, U.jsxs)(`div`, {
        className: `overlay`,
        children: [
          m !== `menu` &&
            (0, U.jsxs)(`div`, {
              className: `hud`,
              children: [
                (0, U.jsxs)(`div`, {
                  className: `hud-cluster`,
                  children: [
                    (0, U.jsxs)(`div`, {
                      className: `stat`,
                      children: [
                        (0, U.jsx)(`span`, { children: `Temps` }),
                        (0, U.jsx)(`strong`, { ref: w, children: `0:00.0` }),
                      ],
                    }),
                    (0, U.jsxs)(`div`, {
                      className: `stat`,
                      children: [
                        (0, U.jsx)(`span`, { children: `Place` }),
                        (0, U.jsx)(`strong`, { ref: E, children: `—` }),
                      ],
                    }),
                    (0, U.jsxs)(`div`, {
                      className: `stat`,
                      children: [
                        (0, U.jsx)(`span`, { children: `Balises` }),
                        (0, U.jsx)(`strong`, { ref: T, children: `0/0` }),
                      ],
                    }),
                    (0, U.jsxs)(`div`, {
                      className: `stat`,
                      children: [
                        (0, U.jsx)(`span`, { children: `Distance` }),
                        (0, U.jsx)(`strong`, { ref: D, children: `0 m` }),
                      ],
                    }),
                  ],
                }),
                (0, U.jsxs)(`div`, {
                  className: `hud-cluster`,
                  children: [
                    (0, U.jsx)(`button`, {
                      className: `icon-btn`,
                      type: `button`,
                      onClick: j,
                      "aria-label": n.mute ? `Activer le son` : `Couper le son`,
                      children: n.mute
                        ? (0, U.jsx)(u, { size: 18 })
                        : (0, U.jsx)(l, { size: 18 }),
                    }),
                    m === `play`
                      ? (0, U.jsx)(`button`, {
                          className: `icon-btn`,
                          type: `button`,
                          onClick: () => t.current?.pause(),
                          "aria-label": `Pause`,
                          children: (0, U.jsx)(o, { size: 18 }),
                        })
                      : null,
                  ],
                }),
              ],
            }),
          g && m === `play`
            ? (0, U.jsx)(`div`, { className: `toast`, children: g })
            : null,
          m === `down`
            ? (0, U.jsx)(`div`, {
                className: `toast`,
                children: `Chute — retour au point de contrôle`,
              })
            : null,
          (m === `count` || (m === `play` && v === 0)) && v != null
            ? (0, U.jsxs)(`div`, {
                className: v === 0 ? `countdown go` : `countdown`,
                "aria-live": `assertive`,
                children: [
                  (0, U.jsx)(`span`, {
                    children: v === 0 ? `C’est parti` : `Départ`,
                  }),
                  (0, U.jsx)(`strong`, { children: v === 0 ? `Partez` : v }, v),
                ],
              })
            : null,
          m === `play` && v !== 0
            ? (0, U.jsx)(`div`, {
                className: `hint`,
                ref: O,
                children: `Flèches ou Q/D pour courir · Z, W ou Espace pour sauter`,
              })
            : null,
          m === `menu` &&
            (0, U.jsxs)(`div`, {
              className: `panel menu`,
              children: [
                (0, U.jsx)(`p`, {
                  className: `eyebrow`,
                  children: `Course en montagne`,
                }),
                (0, U.jsxs)(`h1`, {
                  children: [
                    `Nouste`,
                    (0, U.jsx)(`br`, {}),
                    `Corrida`,
                    (0, U.jsx)(`br`, {}),
                    (0, U.jsx)(`em`, { children: `Trail` }),
                  ],
                }),
                (0, U.jsx)(`p`, {
                  className: `lede`,
                  children: `Un sentier, quatre dossards. Cours, saute les ravins, évite les ronces et passe l’arche avant le peloton.`,
                }),
                (0, U.jsxs)(`label`, {
                  className: `name-row`,
                  children: [
                    (0, U.jsx)(`span`, { children: `Nom sur le dossard` }),
                    k
                      ? (0, U.jsx)(`input`, {
                          value: f,
                          maxLength: 16,
                          onChange: (e) => re(e.target.value),
                          "aria-label": `Nom du coureur`,
                        })
                      : (0, U.jsx)(`div`, { className: `name-placeholder` }),
                  ],
                }),
                (0, U.jsx)(`div`, {
                  className: `levels`,
                  children: C.map((e, i) => [e, i])
                    .map(([e, lvlIdx]) => {
                      let r = n.levels[e.id];
                      return (0, U.jsxs)(
                        `button`,
                        {
                          type: `button`,
                          className: `level`,
                          onMouseEnter: () => t.current?.setPreview(e.theme),
                          onFocus: () => t.current?.setPreview(e.theme),
                          onClick: () => ie(e.id, e.theme),
                          children: [
                            (0, U.jsx)(`span`, {
                              className: `diff`,
                              children: [
                                `N°${lvlIdx + 1} · `,
                                e.difficulty,
                                lvlIdx === C.length - 1 && C.length > 3
                                  ? (0, U.jsx)(`span`, {
                                      className: `today`,
                                      children: `Niveau du jour`,
                                    })
                                  : null,
                              ],
                            }),
                            (0, U.jsxs)(`span`, {
                              className: `meters`,
                              children: [Math.round(e.finishX / 10), ` m`],
                            }),
                            (0, U.jsx)(`strong`, { children: e.name }),
                            (0, U.jsxs)(`p`, {
                              children: [
                                e.blurb,
                                r
                                  ? ` Record ${W(r.bestTime)}, ${G(r.bestPlace)}.`
                                  : ``,
                              ],
                            }),
                            (() => {
                              let ts = medalTargets(e);
                              if (!ts) return null;
                              let got = r ? medalOf(e, r.bestTime) : null;
                              return (0, U.jsxs)(`span`, {
                                className: `medals`,
                                children: [
                                  got
                                    ? (0, U.jsxs)(`span`, {
                                        className: `got ${got.key}`,
                                        title: got.long,
                                        children: [medalDisc(got.key), got.label],
                                      })
                                    : (0, U.jsx)(`span`, {
                                        className: `got none`,
                                        children: r ? `Pas de médaille` : `À courir`,
                                      }),
                                  (0, U.jsx)(`span`, {
                                    className: `targets`,
                                    "aria-label": `Temps cibles : ` + ts.map((x) => `${x.label} ${WT(x.t)}`).join(`, `),
                                    children: ts.map((x) =>
                                      (0, U.jsxs)(
                                        `span`,
                                        { className: `tg ${x.key}${got && got.key === x.key ? ` on` : ``}`, children: [medalDisc(x.key), WT(x.t)] },
                                        x.key,
                                      ),
                                    ),
                                  }),
                                ],
                              });
                            })(),
                            menuTops && menuTops[e.id]?.length
                              ? (0, U.jsx)(`span`, {
                                  className: `lb-top`,
                                  children: `🏆 ` + menuTops[e.id].map((x, i) => `${i + 1}. ${x.name} ${W(x.timeMs / 1000)}`).join(` · `),
                                })
                              : null,
                          ],
                        },
                        e.id,
                      );
                    }),
                }),
                (0, U.jsxs)(`p`, {
                  className: `controls-note`,
                  children: [
                    `Clavier : `,
                    (0, U.jsx)(`b`, { children: `flèches` }),
                    ` ou `,
                    (0, U.jsx)(`b`, { children: `ZQSD` }),
                    ` (Q gauche, D droite, Z saut). Espace saute aussi. Un compte à rebours 3, 2, 1 fige le peloton avant chaque départ. Bas pour traverser une passerelle. Mort : retour automatique au dernier point de contrôle. `,
                    (0, U.jsx)(`b`, { children: `R` }),
                    ` recommence le sentier.`,
                  ],
                }),
                (0, U.jsx)(`div`, {
                  className: `actions menu-actions`,
                  children: (0, U.jsx)(`button`, {
                    className: `btn ghost`,
                    type: `button`,
                    onClick: j,
                    children: n.mute ? `Son coupé` : `Son actif`,
                  }),
                }),
              ],
            }),
          m === `pause` &&
            (0, U.jsxs)(`div`, {
              className: `panel sheet`,
              children: [
                (0, U.jsx)(`p`, { className: `eyebrow`, children: `Pause` }),
                (0, U.jsx)(`h2`, { children: M.name }),
                (0, U.jsx)(`p`, {
                  className: `sub`,
                  children: `Le peloton continue dès que tu repars.`,
                }),
                (0, U.jsxs)(`div`, {
                  className: `actions`,
                  children: [
                    (0, U.jsxs)(`button`, {
                      className: `btn`,
                      type: `button`,
                      onClick: () => t.current?.resume(),
                      children: [(0, U.jsx)(s, { size: 16 }), `Reprendre`],
                    }),
                    (0, U.jsxs)(`button`, {
                      className: `btn ghost`,
                      type: `button`,
                      onClick: () => t.current?.restart(),
                      children: [(0, U.jsx)(c, { size: 16 }), `Recommencer`],
                    }),
                    (0, U.jsx)(`button`, {
                      className: `btn ghost`,
                      type: `button`,
                      onClick: () => t.current?.menu(),
                      children: `Sentiers`,
                    }),
                  ],
                }),
              ],
            }),
          m === `finish` &&
            (0, U.jsxs)(`div`, {
              className: `panel sheet`,
              children: [
                (0, U.jsx)(`p`, {
                  className: `eyebrow`,
                  children: ae ? G(b.findIndex((e) => e.you) + 1) : `Arrivée`,
                }),
                (0, U.jsx)(`h2`, { children: `Classement` }),
                (0, U.jsxs)(`p`, {
                  className: `sub`,
                  children: [M.name, ` — les retardataires finissent encore.`],
                }),
                (0, U.jsxs)(`table`, {
                  className: `rank`,
                  children: [
                    (0, U.jsx)(`thead`, {
                      children: (0, U.jsxs)(`tr`, {
                        children: [
                          (0, U.jsx)(`th`, { children: `Place` }),
                          (0, U.jsx)(`th`, { children: `Coureur` }),
                          (0, U.jsx)(`th`, { children: `Temps` }),
                          (0, U.jsx)(`th`, { children: `Balises` }),
                        ],
                      }),
                    }),
                    (0, U.jsx)(`tbody`, {
                      children: b.map((e, t) =>
                        (0, U.jsxs)(
                          `tr`,
                          {
                            className: e.you ? `you` : void 0,
                            children: [
                              (0, U.jsx)(`td`, { children: G(t + 1) }),
                              (0, U.jsxs)(`td`, {
                                children: [e.name, ` · `, e.bib],
                              }),
                              (0, U.jsx)(`td`, {
                                children:
                                  e.time == null ? `en course` : W(e.time),
                              }),
                              (0, U.jsx)(`td`, {
                                children: e.you ? e.coins : `—`,
                              }),
                            ],
                          },
                          e.bib,
                        ),
                      ),
                    }),
                  ],
                }),
                (() => {
                  // Médaille de cette course, record local et temps visé pour la médaille suivante
                  if (!medalTargets(M)) return null;
                  let rec = n.levels[M.id]?.bestTime,
                    run = ae?.time ?? rec,
                    got = medalOf(M, run),
                    recMedal = medalOf(M, rec),
                    nx = medalNext(M, recMedal);
                  return (0, U.jsxs)(`div`, {
                    className: `medal-result ${got ? got.key : `none`}`,
                    children: [
                      medalDisc(got?.key, !0),
                      (0, U.jsxs)(`div`, {
                        className: `mr-text`,
                        children: [
                          (0, U.jsx)(`strong`, { children: got ? got.long : `Pas de médaille` }),
                          (0, U.jsxs)(`span`, {
                            className: `mr-line`,
                            children: [
                              run != null ? `Temps ${W(run)}` : ``,
                              rec != null ? (0, U.jsxs)(`span`, { className: `mr-rec`, children: [` · Record ${W(rec)}`, recMedal ? medalDisc(recMedal.key) : null] }) : null,
                            ],
                          }),
                          (0, U.jsx)(`span`, {
                            className: `mr-next`,
                            children: nx
                              ? `Prochaine : ${nx.next} sous ${WT(nx.t)}`
                              : `Toutes les médailles ! Le pilote auto fait ${W((M.medals.auto ?? medalTargets(M)[0].t) + 1e-6)}.`,
                          }),
                        ],
                      }),
                    ],
                  });
                })(),
                lbEnabled() && lbData && lbData.levelId === M.id ? lbView(lbData) : null,
                nextLvl
                  ? (0, U.jsxs)(`button`, {
                      className: `btn next-level`,
                      type: `button`,
                      autoFocus: !0,
                      onClick: () => ie(nextLvl.id, nextLvl.theme),
                      children: [
                        (0, U.jsx)(`span`, { className: `next-label`, children: `Niveau suivant` }),
                        (0, U.jsx)(`span`, {
                          className: `next-name`,
                          children: `N°${C.indexOf(nextLvl) + 1} · ${nextLvl.name} · ${nextLvl.difficulty}`,
                        }),
                        (0, U.jsx)(`kbd`, { children: `Entrée` }),
                      ],
                    })
                  : (0, U.jsx)(`p`, {
                      className: `last-level`,
                      children: `Dernier niveau — reviens demain pour le niveau du jour.`,
                    }),
                (0, U.jsxs)(`div`, {
                  className: `actions`,
                  children: [
                    (0, U.jsx)(`button`, {
                      className: nextLvl ? `btn ghost` : `btn`,
                      type: `button`,
                      onClick: () => t.current?.restart(),
                      children: `Rejouer`,
                    }),
                    (0, U.jsx)(`button`, {
                      className: `btn ghost`,
                      type: `button`,
                      onClick: () => t.current?.menu(),
                      children: `Autre sentier`,
                    }),
                  ],
                }),
              ],
            }),
        ],
      }),
      m === `play` || m === `down` || m === `count`
        ? (0, U.jsxs)(`div`, {
            className: `touch`,
            children: [
              (0, U.jsxs)(`div`, {
                className: `pair`,
                children: [
                  (0, U.jsx)(`button`, {
                    type: `button`,
                    "aria-label": `Gauche`,
                    ...N(`left`),
                    children: (0, U.jsx)(i, {}),
                  }),
                  (0, U.jsx)(`button`, {
                    type: `button`,
                    "aria-label": `Droite`,
                    ...N(`right`),
                    children: (0, U.jsx)(a, {}),
                  }),
                  (0, U.jsx)(`button`, {
                    type: `button`,
                    className: `down`,
                    "aria-label": `Descendre d’une passerelle`,
                    ...N(`down`),
                    children: `↓`,
                  }),
                ],
              }),
              (0, U.jsx)(`button`, {
                type: `button`,
                className: `jump`,
                "aria-label": `Sauter`,
                ...N(`jump`),
                children: `Saut`,
              }),
            ],
          })
        : null,
    ],
  });
  function lbView(L) {
    let mine = L.me && L.name ? L.name.toLowerCase() : null,
      inTop = mine && L.top?.some((x) => x.name.toLowerCase() === mine),
      msg =
        L.status === `loading` ? `Envoi de ton temps…`
        : L.status === `err` ? `Classement indisponible pour le moment.`
        : L.status === `noname` ? `Mets ton nom sur le dossard (menu) pour entrer au classement.`
        : L.status === `rejected` ? `Temps non enregistré (réessaie dans quelques secondes).`
        : L.me ? `Ton meilleur : ${G(L.me.rank)} sur ${L.me.total}.`
        : null;
    return (0, U.jsxs)(`div`, {
      className: `lb`,
      "aria-live": `polite`,
      children: [
        (0, U.jsx)(`p`, { className: `lb-title`, children: `Classement en ligne · top 10` }),
        L.top && L.top.length
          ? (0, U.jsx)(`ol`, {
              className: `lb-list`,
              children: [
                ...L.top.map((x, i) =>
                  (0, U.jsxs)(
                    `li`,
                    {
                      className: mine && x.name.toLowerCase() === mine ? `you` : void 0,
                      children: [
                        (0, U.jsx)(`span`, { children: G(L.top.filter((y) => y.timeMs < x.timeMs).length + 1) }),
                        (0, U.jsx)(`span`, { children: x.name }),
                        (0, U.jsx)(`span`, { children: W(x.timeMs / 1000) }),
                      ],
                    },
                    i,
                  ),
                ),
                L.me && !inTop
                  ? (0, U.jsxs)(
                      `li`,
                      {
                        className: `you far`,
                        children: [
                          (0, U.jsx)(`span`, { children: G(L.me.rank) }),
                          (0, U.jsx)(`span`, { children: L.name }),
                          (0, U.jsx)(`span`, { children: W(L.me.timeMs / 1000) }),
                        ],
                      },
                      `me`,
                    )
                  : null,
              ],
            })
          : L.status !== `loading` && L.status !== `err`
            ? (0, U.jsx)(`p`, { className: `lb-msg`, children: `Personne encore : sois le premier !` })
            : null,
        msg ? (0, U.jsx)(`p`, { className: `lb-msg`, children: msg }) : null,
      ],
    });
  }
  function N(e) {
    return {
      onPointerDown: (n) => {
        (n.currentTarget.setPointerCapture(n.pointerId),
          n.preventDefault(),
          t.current?.touch(e, !0));
      },
      onPointerUp: () => t.current?.touch(e, !1),
      onPointerCancel: () => t.current?.touch(e, !1),
    };
  }
}
var q = K;
export { q as component };
