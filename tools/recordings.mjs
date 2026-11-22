// Liste aller arabischen Texte der App für Aufnahmen eines Kāriʾ (Rezitators).
// Aufruf: node tools/recordings.mjs  →  audio/ar/LISTE.csv (Schlüssel, Gruppe, Text, vorgeschlagener Dateiname)
// Aufnahmen als MP3 nach audio/ar/ legen und in audio/ar/index.json eintragen: { "<Schlüssel>": "<Datei>.mp3" }.
// Die App spielt dann die Aufnahme statt der Computerstimme – Zeile für Zeile, wie sie hier steht.
import fs from 'node:fs';
import { recKey } from '../src/voice.js';
import { TXT_KEYS, text } from '../src/prayer.js';
import { DUAS } from '../src/duas.js';
import { ESMA } from '../src/esma.js';
import { LETTERS, MARKS, WORDS } from '../src/alphabet.js';

const rows = new Map();
const add = (group, ar) => { for (const line of [].concat(ar)) if (line && !rows.has(recKey(line))) rows.set(recKey(line), [group, line]); };
for (const k of TXT_KEYS) add(`gebet:${k}`, text(k).ar);
for (const d of DUAS) add(`dua:${d.id}`, d.ar);
for (const e of ESMA) add(`esma:${e.i + 1}`, e.ar);
for (const l of LETTERS) add(`elif:${l.i + 1}`, l.arName);
for (const m of MARKS) add('elif:zeichen', m.ar);
for (const w of WORDS) add('elif:wort', w.ar);
const esc = (s) => `"${String(s).replace(/"/g, '""')}"`;
const out = ['Schlüssel,Gruppe,Arabisch,Datei', ...[...rows].map(([k, [g, ar]]) => [k, g, esc(ar), `${g.replace(/[^a-z0-9]+/gi, '-')}-${k}.mp3`].join(','))];
fs.mkdirSync('audio/ar', { recursive: true });
fs.writeFileSync('audio/ar/LISTE.csv', `﻿${out.join('\n')}\n`);
console.log(`${rows.size} Texte → audio/ar/LISTE.csv`);
