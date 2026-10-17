// Vérifie le vrai backend Supabase après exécution de supabase/schema.sql.
// Écrit UNE ligne de test dans le niveau fictif « test-classement » (invisible dans le jeu).
// Nettoyage éventuel (SQL Editor) : delete from public.scores where level_id = 'test-classement';
// Usage : node tools/test-supabase.mjs
import { LEADERBOARD_CONFIG as C } from '../leaderboard-config.js';
const base = C.url.replace(/\/+$/, '') + '/rest/v1';
const H = { apikey: C.key, 'Content-Type': 'application/json' };
let fails = 0;
const ok = (c, m) => { console.log(`${c ? 'OK   ' : 'ÉCHEC'} ${m}`); if (!c) fails++; };
const post = (row) => fetch(`${base}/scores`, { method: 'POST', headers: { ...H, Prefer: 'return=minimal' }, body: JSON.stringify(row) });
const lvl = 'test-classement', name = `Test${Date.now() % 100000}`;

let r = await fetch(`${base}/leaderboard?select=name&limit=1`, { headers: H });
ok(r.ok, `lecture vue leaderboard (HTTP ${r.status})`);
r = await fetch(`${base}/level_top?select=level_id&limit=1`, { headers: H });
ok(r.ok, `lecture vue level_top (HTTP ${r.status})`);
r = await post({ level_id: lvl, name, time_ms: 12345, balises: 3 });
ok(r.status === 201, `insertion anonyme valide (HTTP ${r.status})`);
r = await fetch(`${base}/leaderboard?select=name,time_ms&level_id=eq.${lvl}&name_key=eq.${name.toLowerCase()}`, { headers: H });
const got = r.ok ? await r.json() : [];
ok(got.length === 1 && got[0].time_ms === 12345, 'relecture du temps inséré');
for (const [row, why] of [
  [{ level_id: lvl, name, time_ms: 12000 }, 'anti-rafale (même nom, < 5 s)'],
  [{ level_id: lvl, name: 'X', time_ms: 100 }, 'temps trop court'],
  [{ level_id: lvl, name: '', time_ms: 20000 }, 'nom vide'],
  [{ level_id: lvl, name: 'x'.repeat(21), time_ms: 20000 }, 'nom > 20'],
  [{ level_id: 'Pas Bon!', name: 'X', time_ms: 20000 }, 'level_id invalide'],
  [{ level_id: 'crete', name: 'X', time_ms: 9000 }, 'sous le minimum du niveau'],
]) { r = await post(row); ok(r.status >= 400, `refus : ${why} (HTTP ${r.status})`); }
r = await fetch(`${base}/scores?level_id=eq.${lvl}`, { method: 'PATCH', headers: { ...H, Prefer: 'return=representation' }, body: JSON.stringify({ time_ms: 9999 }) });
ok(r.status >= 400 || (await r.json()).length === 0, `modification interdite (HTTP ${r.status})`);
r = await fetch(`${base}/scores?level_id=eq.${lvl}`, { method: 'DELETE', headers: { ...H, Prefer: 'return=representation' } });
ok(r.status >= 400 || (await r.json()).length === 0, `suppression interdite (HTTP ${r.status})`);
console.log(fails ? `SUPABASE ÉCHEC (${fails})` : 'SUPABASE OK');
process.exit(fails ? 1 : 0);
