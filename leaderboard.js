// Classement en ligne partagé entre tous les joueurs, par niveau.
// Backend interchangeable (voir leaderboard-config.js). Sans config → tout est désactivé.
// API (toutes les fonctions sont sûres : elles ne lèvent jamais, elles renvoient null en cas d'échec) :
//   lbEnabled()                                   → bool
//   lbSubmit({ levelId, name, timeMs, balises })   → true | false
//   lbTop(levelId, limit = 10)                     → [{ name, timeMs, balises }] | null
//   lbRank(levelId, name)                          → { rank, timeMs, total } | null
//   lbMenuTops()                                   → { [levelId]: [{ name, timeMs }] (≤ 3) } | null
//   lbCanSubmit(name)                              → bool (nom personnalisé, pas « Toi »)
import { LEADERBOARD_CONFIG } from "./leaderboard-config.js";

const TIMEOUT_MS = 6000;
const DEFAULT_NAME = "Toi";
export const NAME_MAX = 20;

export const cleanName = (n) =>
  String(n ?? "").replace(/[\u0000-\u001f\u007f<>]/g, "").trim().slice(0, NAME_MAX).trim();
export const lbCanSubmit = (n) => {
  const c = cleanName(n);
  return c.length >= 1 && c.toLowerCase() !== DEFAULT_NAME.toLowerCase();
};

async function req(url, opts = {}) {
  const ctl = new AbortController();
  const tm = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...opts, signal: ctl.signal });
  } finally {
    clearTimeout(tm);
  }
}

// --- Supabase (API REST PostgREST, pas de dépendance) ---------------------------
function supabase(cfg) {
  const base = cfg.url.replace(/\/+$/, "") + "/rest/v1";
  const headers = { apikey: cfg.key, Accept: "application/json" };
  // Les anciennes clés « anon » sont des JWT et vont aussi dans Authorization ;
  // les nouvelles clés sb_publishable_ ne vont QUE dans apikey.
  if (cfg.key.split(".").length === 3) headers.Authorization = `Bearer ${cfg.key}`;
  const q = (p) => new URLSearchParams(p).toString();
  const get = async (path, params, extra = {}) => {
    const r = await req(`${base}/${path}?${q(params)}`, { headers: { ...headers, ...extra } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r;
  };
  const count = async (path, params) => {
    const r = await get(path, { ...params, select: "level_id", limit: "1" }, { Prefer: "count=exact" });
    const m = /\/(\d+)$/.exec(r.headers.get("content-range") || "");
    return m ? Number(m[1]) : (await r.json()).length;
  };
  return {
    async submit(s) {
      const r = await req(`${base}/scores`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ level_id: s.levelId, name: s.name, time_ms: s.timeMs, balises: s.balises }),
      });
      return r.ok;
    },
    async top(levelId, limit) {
      const r = await get("leaderboard", {
        select: "name,time_ms,balises",
        level_id: `eq.${levelId}`,
        order: "time_ms.asc,created_at.asc",
        limit: String(limit),
      });
      return (await r.json()).map((x) => ({ name: x.name, timeMs: x.time_ms, balises: x.balises }));
    },
    async rank(levelId, name) {
      const r = await get("leaderboard", {
        select: "time_ms",
        level_id: `eq.${levelId}`,
        name_key: `eq.${name.toLowerCase()}`,
        limit: "1",
      });
      const me = (await r.json())[0];
      if (!me) return null;
      const [before, total] = await Promise.all([
        count("leaderboard", { level_id: `eq.${levelId}`, time_ms: `lt.${me.time_ms}` }),
        count("leaderboard", { level_id: `eq.${levelId}` }),
      ]);
      return { rank: before + 1, timeMs: me.time_ms, total };
    },
    async menuTops() {
      const r = await get("level_top", { select: "level_id,name,time_ms,rn", order: "level_id.asc,rn.asc" });
      const out = {};
      for (const x of await r.json()) (out[x.level_id] ||= []).push({ name: x.name, timeMs: x.time_ms });
      return out;
    },
  };
}

// --- Local (localStorage, même navigateur uniquement) ----------------------------
function local() {
  const K = "corrida-classement-local-v1";
  const load = () => { try { return JSON.parse(localStorage.getItem(K)) || []; } catch { return []; } };
  const best = (levelId) => {
    const m = new Map();
    for (const s of load()) {
      if (s.levelId !== levelId) continue;
      const k = s.name.toLowerCase(), o = m.get(k);
      if (!o || s.timeMs < o.timeMs) m.set(k, s);
    }
    return [...m.values()].sort((a, b) => a.timeMs - b.timeMs || a.t - b.t);
  };
  return {
    async submit(s) { const a = load(); a.push({ ...s, t: Date.now() }); localStorage.setItem(K, JSON.stringify(a.slice(-2000))); return true; },
    async top(levelId, limit) { return best(levelId).slice(0, limit).map(({ name, timeMs, balises }) => ({ name, timeMs, balises })); },
    async rank(levelId, name) {
      const l = best(levelId), i = l.findIndex((s) => s.name.toLowerCase() === name.toLowerCase());
      return i < 0 ? null : { rank: l.filter((s) => s.timeMs < l[i].timeMs).length + 1, timeMs: l[i].timeMs, total: l.length };
    },
    async menuTops() {
      const out = {};
      for (const id of new Set(load().map((s) => s.levelId))) out[id] = best(id).slice(0, 3).map(({ name, timeMs }) => ({ name, timeMs }));
      return out;
    },
  };
}

const BACKENDS = { supabase, local };

function makeBackend(cfg) {
  try {
    if (!cfg || cfg.enabled === false) return null;
    if (typeof location !== "undefined" && /[?&]classement=0\b/.test(location.search)) return null;
    const f = BACKENDS[cfg.provider];
    if (!f) return null;
    if (cfg.provider === "supabase" && !(cfg.url && cfg.key)) return null;
    return f(cfg);
  } catch {
    return null;
  }
}
const backend = makeBackend(LEADERBOARD_CONFIG);

const safe = (fn) => async (...a) => {
  if (!backend) return null;
  try { return await fn(...a); } catch (e) { console.warn("[classement]", e?.message || e); return null; }
};

export const lbEnabled = () => !!backend;
export const lbSubmit = safe(async ({ levelId, name, timeMs, balises }) => {
  const n = cleanName(name);
  if (!lbCanSubmit(n)) return false;
  const t = Math.round(timeMs);
  if (!(t >= 8000 && t <= 3600000)) return false;
  return backend.submit({ levelId, name: n, timeMs: t, balises: Math.max(0, Math.min(500, balises | 0)) });
});
export const lbTop = safe((levelId, limit = 10) => backend.top(levelId, limit));
export const lbRank = safe((levelId, name) => (lbCanSubmit(name) ? backend.rank(levelId, cleanName(name)) : null));
let menuCache = null, menuAt = 0;
export const lbMenuTops = safe(async (force = false) => {
  if (!force && menuCache && Date.now() - menuAt < 60000) return menuCache;
  menuCache = await backend.menuTops(); menuAt = Date.now();
  return menuCache;
});
export const lbInvalidate = () => { menuAt = 0; };
