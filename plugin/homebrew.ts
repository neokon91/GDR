// L'HOMEBREW DEL VAULT nel catalogo del kernel.
//
// Le note homebrew (classe, specie, background, talento, sottoclasse, incantesimo) hanno il
// modello del vault: campi scritti a mano, spesso in prosa breve («Forza, Costituzione»,
// «Armi semplici e da guerra»), e `concede` per gli effetti automatici. Qui diventano le stesse
// `Fonte*` che il kernel costruisce dall'SRD, così il creatore (la guida) e `assembla` non
// sanno se una classe è dell'SRD o del vault. Funzione pura: le note le passa il plugin.
//
// Gli id dell'homebrew sono `homebrew.<tipo>.<slug del nome della nota>`: stabili finché la
// nota non si rinomina, e mai in collisione con l'SRD (`dnd.…`).
import type { Caratteristica } from "../regole/src/creatore/attore";
import type { Catalogo } from "../regole/src/creatore/catalogo";
import type { CompArma, Effetto, FonteBackground, FonteClasse, FonteSottoclasse, FonteSpecie } from "../regole/src/creatore/fonti";
import { ABILITA } from "../regole/src/creatore/risolutore";

/** Una nota del vault: il nome (basename) e il frontmatter. */
export type NotaVault = { nome: string; fm: Record<string, any> };
/** Le note homebrew per categoria del vault. */
export type NoteHomebrew = Partial<Record<"classe" | "specie" | "background" | "talento" | "sottoclasse" | "incantesimo", NotaVault[]>>;

const CARATTERISTICHE: Caratteristica[] = ["forza", "destrezza", "costituzione", "intelligenza", "saggezza", "carisma"];
// Le classi dell'SRD da cui un incantatore homebrew prende colonne e slot.
const RIFERIMENTO = { pieno: "dnd.classe.chierico", mezzo: "dnd.classe.paladino" } as const;
const LIVELLI_ASI = [4, 8, 12, 16, 19];

/** Testo normalizzato: minuscolo, senza accenti, spazi → trattini. */
export const slug = (s: unknown): string =>
  String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const idDi = (tipo: string, nome: string) => `homebrew.${tipo}.${slug(nome)}`;

/** Una lista scritta come elenco o come prosa separata da virgole/punti e virgola; con
 *  `ancheE`, anche da «e» («Forza e Costituzione»: solo dove i nomi non la contengono). */
const voci = (v: unknown, ancheE = false): string[] =>
  (Array.isArray(v) ? v : String(v ?? "").split(ancheE ? /[,;]|\be\b/ : /[,;]/)).map((x) => String(x).trim()).filter(Boolean);

/** Il nome di una nota da un link `[[Nome|alias]]` o da un nome nudo. */
const nomeDaLink = (v: unknown): string => {
  const t = String(v ?? "").trim();
  const m = /^\[\[([^\]|]+)/.exec(t);
  return (m ? m[1] : t).split("/").pop()!.trim();
};

const caratteristicheDi = (v: unknown): Caratteristica[] =>
  voci(v, true).map(slug).filter((c): c is Caratteristica => (CARATTERISTICHE as string[]).includes(c));
const abilitaDi = (v: unknown): string[] => voci(v).map(slug).filter((a) => a in ABILITA);

/** Le competenze in armi dalla prosa: semplici e/o da guerra. */
function armiDi(prosa: unknown): CompArma[] {
  const t = slug(prosa);
  return [
    ...(/semplic/.test(t) ? [{ categoria: "semplice" as const }] : []),
    ...(/guerra/.test(t) ? [{ categoria: "guerra" as const }] : []),
  ];
}

/** Le competenze in armature dalla prosa, col vocabolario dell'SRD. */
function armatureDi(prosa: unknown): string[] {
  const t = slug(prosa);
  return [
    ...(/legger/.test(t) ? ["armature-leggere"] : []),
    ...(/medi/.test(t) ? ["armature-medie"] : []),
    ...(/pesant/.test(t) ? ["armature-pesanti"] : []),
    ...(/scud/.test(t) ? ["scudi"] : []),
  ];
}

/**
 * `concede` (il blocco automatico delle note homebrew) → effetti del kernel: punteggi
 * (`caratteristica`/`punteggi`: +N fino a 20), competenze in abilità, armi, armature e
 * strumenti (questi ultimi per nome, contro il catalogo).
 */
export function effettiDaConcede(concede: unknown, cat?: Catalogo): Effetto[] {
  if (!concede || typeof concede !== "object") return [];
  const c = concede as Record<string, any>;
  const out: Effetto[] = [];
  for (const [k, v] of Object.entries((c.caratteristica ?? c.punteggi ?? {}) as Record<string, unknown>)) {
    const car = slug(k);
    const n = Number(v) || 0;
    if ((CARATTERISTICHE as string[]).includes(car) && n)
      out.push({ bersaglio: `caratteristiche.${car}.valore`, operazione: "somma", valore: n, massimo: 20 } as Effetto);
  }
  const abilita = abilitaDi(c.abilita ?? c.competenze_abilita);
  if (abilita.length) out.push({ bersaglio: "competenza_abilita", operazione: "concedi", valore: abilita } as Effetto);
  for (const a of armiDi(c.armi)) out.push({ bersaglio: "competenza_arma", operazione: "concedi", valore: a.categoria === "guerra" ? "armi-da-guerra" : "armi-semplici" } as Effetto);
  for (const a of armatureDi(c.armature)) out.push({ bersaglio: "competenza_armatura", operazione: "concedi", valore: a } as Effetto);
  const strumenti = voci(c.strumenti).flatMap((n) => cat?.oggetti.filter((o) => o.sezione === "strumenti" && slug(o.nome) === slug(n)).map((o) => o.id) ?? []);
  if (strumenti.length) out.push({ bersaglio: "competenza_strumenti", operazione: "concedi", valore: strumenti } as Effetto);
  return out;
}

function classe(n: NotaVault, cat: Catalogo): FonteClasse {
  const fm = n.fm;
  const id = idDi("classe", n.nome);
  const tipo = slug(fm.tipo_incantatore) as "pieno" | "mezzo" | "";
  const rif = tipo === "pieno" || tipo === "mezzo" ? cat.classi.find((c) => c.id === RIFERIMENTO[tipo]) : undefined;
  const primarie = caratteristicheDi(fm.car_primaria);
  // I privilegi: la lista strutturata `privilegi` ({livello, nome, concede}) e il vecchio
  // `privilegi_l1` (nomi del 1º livello, senza effetti).
  const privilegi = [
    ...(Array.isArray(fm.privilegi) ? fm.privilegi : []).filter((p: any) => p?.nome)
      .map((p: any) => ({ livello: Number.parseInt(p.livello, 10) || 1, nome: String(p.nome).trim(), concede: p.concede })),
    ...String(fm.privilegi_l1 ?? "").split(/[;\n]/).map((s) => s.trim()).filter(Boolean).map((nome) => ({ livello: 1, nome, concede: undefined })),
  ];
  const livSottoclasse = Number.parseInt(fm.livello_sottoclasse, 10) || 3;
  const progressione = Array.from({ length: 20 }, (_, i) => {
    const livello = i + 1;
    const r = rif?.progressione?.find((p) => p.livello === livello);
    return {
      livello,
      privilegi: [
        ...privilegi.filter((p) => p.livello === livello).map((p) => slug(p.nome)),
        ...(LIVELLI_ASI.includes(livello) ? ["aumento-punteggi-caratteristica"] : []),
        ...(livello === livSottoclasse ? [`sottoclasse-del-${slug(n.nome)}`] : []),
      ],
      ...(r?.trucchetti != null ? { trucchetti: r.trucchetti } : {}),
      ...(r?.preparati != null ? { preparati: r.preparati } : {}),
      ...(r?.slot ? { slot: r.slot } : {}),
    };
  });
  const dado = String(fm.dado_vita ?? "").match(/\d+/);
  return {
    id,
    nome: n.nome,
    dado_vita: dado ? Number(dado[0]) : 8,
    tiri_salvezza: caratteristicheDi(fm.ts_competenze),
    ...(primarie.length ? { caratteristica_primaria: primarie } : {}),
    competenze_abilita: { quantita: Number.parseInt(fm.abilita_numero, 10) || 2, scelte: ["tutte"] },
    competenze_armi: armiDi(fm.competenze_armi),
    competenze_armature: armatureDi(fm.competenze_armature),
    equipaggiamento: [],
    progressione,
    ...(rif?.incantesimi && primarie[0] ? { incantesimi: { caratteristica: primarie[0], tipo: tipo as "pieno" | "mezzo" } } : {}),
    definizioni_privilegi: Object.fromEntries(
      privilegi.map((p) => [slug(p.nome), { nome: p.nome, effetti: effettiDaConcede(p.concede, cat) }]),
    ),
  } as FonteClasse;
}

function specie(n: NotaVault): FonteSpecie {
  const v = String(n.fm.velocita ?? "").match(/\d+(?:[.,]\d+)?/);
  const scuro = /scurovision/.test(slug(n.fm.tratti));
  return {
    id: idDi("specie", n.nome),
    nome: n.nome,
    taglia: slug(n.fm.taglia) || "media",
    velocita: { camminata: v ? Number(v[0].replace(",", ".")) : 9 },
    tratti: scuro ? [{ id: `${slug(n.nome)}.scurovisione`, nome: "Scurovisione", effetti: [{ bersaglio: "sensi.scurovisione", operazione: "aumento", valore: 18 } as Effetto] }] : [],
  } as FonteSpecie;
}

function background(n: NotaVault, cat: Catalogo): FonteBackground {
  const nomeTalento = slug(nomeDaLink(n.fm.talento_origine));
  const talento = nomeTalento ? cat.talenti.find((t) => slug(t.nome) === nomeTalento || t.id.split(".").pop() === nomeTalento) : undefined;
  return {
    id: idDi("background", n.nome),
    nome: n.nome,
    punteggi_caratteristica: caratteristicheDi(n.fm.car_background),
    ...(talento ? { talento_origine: talento.id } : {}),
    competenze: { abilita: abilitaDi(n.fm.abilita_background) },
    equipaggiamento: [],
  } as FonteBackground;
}

/**
 * Il catalogo con l'homebrew del vault: le voci SRD più quelle tradotte dalle note. L'ordine
 * conta: i talenti prima dei background (il talento d'origine si risolve per nome), le classi
 * prima di sottoclassi e incantesimi (che le citano per nome).
 */
export function conHomebrew(cat: Catalogo, note: NoteHomebrew): Catalogo {
  const talenti = [
    ...cat.talenti,
    ...(note.talento ?? []).map((n) => ({ id: idDi("talento", n.nome), nome: n.nome, effetti: effettiDaConcede(n.fm.concede, cat) })),
  ];
  const conTalenti = { ...cat, talenti };
  const classi = [...cat.classi, ...(note.classe ?? []).map((n) => classe(n, conTalenti))];
  // Una classe citata per nome (link o testo) o per slug: SRD o homebrew.
  const classeDi = (v: unknown) => {
    const s = slug(nomeDaLink(v));
    return classi.find((c) => slug(c.nome) === s || c.id.split(".").pop() === s)?.id;
  };
  const sottoclassi: FonteSottoclasse[] = [
    ...cat.sottoclassi,
    ...(note.sottoclasse ?? []).flatMap((n) => {
      const cl = classeDi(n.fm.classe);
      return cl ? [{ id: idDi("sottoclasse", n.nome), nome: n.nome, classe: cl, privilegi: [] } as FonteSottoclasse] : [];
    }),
  ];
  const incantesimi = [
    ...cat.incantesimi,
    ...(note.incantesimo ?? []).map((n) => {
      const liv = Number.parseInt(n.fm.livello, 10);
      const citate = voci(n.fm.classi).map(classeDi).filter((x): x is string => !!x);
      return {
        id: idDi("incantesimo", n.nome),
        nome: n.nome,
        livello: Number.isFinite(liv) && liv >= 0 ? liv : 1,
        // Nessuna classe citata = per tutte (come nel vecchio creatore del vault).
        classi: citate.length ? citate : classi.map((c) => c.id),
      };
    }),
  ];
  return {
    ...cat,
    talenti,
    classi,
    sottoclassi,
    incantesimi,
    specie: [...cat.specie, ...(note.specie ?? []).map(specie)],
    background: [...cat.background, ...(note.background ?? []).map((n) => background(n, conTalenti))],
  };
}
