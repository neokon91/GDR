// Helper puri condivisi dal plugin GDR (nessuna dipendenza da view/plugin).
import { App, Notice } from "obsidian";

// Parsa la stringa dadi impostata in coppie [etichetta, espressione].
export function parseDadi(s: string): [string, string][] {
  return String(s || "").split(",").map((p) => p.trim()).filter(Boolean).map((p) => {
    const i = p.indexOf(":");
    return (i < 0 ? [p, p] : [p.slice(0, i).trim(), p.slice(i + 1).trim()]) as [string, string];
  });
}

// Carica uno script CommonJS del vault iniettando i SOLI globali che il runtime usa
// (app, Notice — verificato: nessun altro simbolo Obsidian libero in views/meta_actions).
export function evalCjs(src: string, app: App): any {
  const mod: any = { exports: {} };
  // eslint-disable-next-line no-new-func
  const fn = new Function("module", "exports", "app", "Notice", src);
  fn(mod, mod.exports, app, Notice);
  return mod.exports;
}

// Roller locale (affidabile in ItemView): NdM con +/-K e kh1/kl1 (vantaggio/svantaggio).
export function rollFormula(expr: string): { total: number; detail: string } {
  const m = expr.match(/^(\d+)d(\d+)(kh1|kl1)?([+-]\d+)?$/i);
  if (!m) return { total: NaN, detail: expr };
  const n = +m[1], faces = +m[2], keep = (m[3] || "").toLowerCase(), mod = m[4] ? +m[4] : 0;
  const rolls = Array.from({ length: n }, () => 1 + Math.floor(Math.random() * faces));
  let used = rolls;
  if (keep === "kh1") used = [Math.max(...rolls)];
  else if (keep === "kl1") used = [Math.min(...rolls)];
  const total = used.reduce((a, b) => a + b, 0) + mod;
  const modTxt = mod ? (mod > 0 ? `+${mod}` : `${mod}`) : "";
  return { total, detail: `[${rolls.join(", ")}]${keep ? " " + keep : ""}${modTxt}` };
}
