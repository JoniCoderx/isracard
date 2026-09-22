/* The words, checked: does every English string have a Hebrew one, do they
   agree, is anything duplicated that should not be, is the document structured
   the way a reader's software expects. */
import fs from "fs";
/* the built page, not the template: the Collection is rendered from
   pieces.mjs now, so reading the source would audit the template literals
   rather than the words a reader actually sees */
const src = fs.readFileSync("/home/user/isracard/lumera/site/silavu-page.html", "utf8");
const out = [];

/* 1. every data-en must have a data-he and vice versa */
const pairs = [...src.matchAll(/data-en="([^"]*)"\s+data-he="([^"]*)"/g)].map(m => [m[1], m[2]]);
const enOnly = [...src.matchAll(/data-en="([^"]*)"(?!\s+data-he)/g)].map(m => m[1]);
const heOnly = [...src.matchAll(/(?<!data-en="[^"]*"\s)data-he="([^"]*)"/g)].map(m => m[1]);
out.push(`translated pairs: ${pairs.length}`);
out.push(`English with no Hebrew: ${enOnly.length}` + (enOnly.length ? "\n    " + enOnly.slice(0,8).join("\n    ") : ""));

/* 2. a Hebrew string that is still English, or identical to it */
const untranslated = pairs.filter(([en, he]) => he === en || !/[֐-׿]/.test(he.replace(/[^\p{L}]/gu, "")) && /[a-z]{4}/i.test(he));
out.push(`Hebrew still in English: ${untranslated.length}` + (untranslated.length ? "\n    " + untranslated.slice(0,10).map(x => `"${x[0]}" → "${x[1]}"`).join("\n    ") : ""));

/* 3. em markup must survive translation: if the English emphasises a phrase, the Hebrew should too */
const emMismatch = pairs.filter(([en, he]) => (/<em>/.test(en)) !== (/<em>/.test(he)));
out.push(`emphasis lost in translation: ${emMismatch.length}` + (emMismatch.length ? "\n    " + emMismatch.slice(0,8).map(x => `"${x[0]}" → "${x[1]}"`).join("\n    ") : ""));

/* 4. the same English saying two different things in Hebrew */
const byEn = {};
pairs.forEach(([en, he]) => { (byEn[en] = byEn[en] || new Set()).add(he); });
const inconsistent = Object.entries(byEn).filter(([, s]) => s.size > 1);
out.push(`same English, different Hebrew: ${inconsistent.length}` + (inconsistent.length ? "\n    " + inconsistent.slice(0,8).map(([en, s]) => `"${en}" → ${[...s].map(x=>`"${x}"`).join(" / ")}`).join("\n    ") : ""));

/* 5. terminology drift across the site */
const terms = {
  "the signature line": /The Line\b/g,
  "build verb": /Design your bracelet|Start designing|Build your line|Design yours/g,
  "viewing CTA": /Book a private viewing|Book a viewing|Request a private viewing/g,
  "bespoke CTA": /Start a bespoke piece|Begin a bespoke piece|Begin\b/g,
};
Object.entries(terms).forEach(([k, re]) => {
  const hits = {}; [...src.matchAll(re)].forEach(m => hits[m[0]] = (hits[m[0]]||0)+1);
  out.push(`${k}: ` + Object.entries(hits).map(([a,b]) => `"${a}"×${b}`).join(", "));
});

/* 6. images without alt, headings out of order */
const imgs = [...src.matchAll(/pic\("([^"]+)",\s*"([^"]*)"/g)].map(m => [m[1], m[2]]);
const noAlt = imgs.filter(([, a]) => !a || a.length < 12);
out.push(`pictures: ${imgs.length}, with thin or missing alt: ${noAlt.length}` + (noAlt.length ? "\n    " + noAlt.map(x=>x[0]+": \""+x[1]+"\"").join("\n    ") : ""));
const h1 = (src.match(/<h1/g)||[]).length;
out.push(`h1 count: ${h1} (should be 1)`);

/* 7. straight quotes and double spaces in prose */
const straight = pairs.filter(([en]) => /\w'\w|\s'|"\w/.test(en)).map(x=>x[0]);
out.push(`straight quotes in English copy: ${straight.length}` + (straight.length ? "\n    " + straight.slice(0,5).join("\n    ") : ""));
const dbl = pairs.filter(([en, he]) => /\s{2}/.test(en) || /\s{2}/.test(he));
out.push(`double spaces: ${dbl.length}` + (dbl.length ? "\n    " + dbl.slice(0,5).map(x=>x[0]).join("\n    ") : ""));

console.log(out.join("\n"));
