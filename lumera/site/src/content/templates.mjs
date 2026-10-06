/* The document pages' main column: a policy, and a page the owner made.
   Pure, so the build writes them and the admin previews them with the same
   markup. Text arrives already made safe (load.mjs) or is escaped here. */
import { toInline, safeHref } from "./apply.mjs";

const escA = v => String(v).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const A = x => `data-en="${escA(x.en)}" data-he="${escA(x.he)}"`;
const T = (tag, x, cls = "") => `<${tag}${cls ? ` class="${cls}"` : ""} ${A(x)}>${x.en}</${tag}>`;
const S = (en, he) => ({ en, he });

export function policyMain(d) {
  return `<main class="doc">
<div class="k gold" ${A(S("Client care", "שירות לקוחות"))}>Client care</div>
<h1 data-doc-title ${A(d.title)}>${d.title.en}</h1>
<p class="lede" ${A(d.lede)}>${d.lede.en}</p>
${d.body.map(([h, t]) => `<section>${T("h2", h)}${T("p", t)}</section>`).join("\n")}
<p class="dask"><span ${A(S("A question this page does not answer?", "יש שאלה שלא נענתה כאן?"))}>A question this page does not answer?</span> <a href="./#concierge" ${A(S("Write to the concierge", "כתבו לקונסיירז'"))}>Write to the concierge</a></p>
</main>`;
}

/* imgSrc(name, width) lets the admin's preview point library pictures at
   their private originals; the build uses the derived files */
export function docpageMain(d, imgSrc = (n, w) => `img/${n}-${w}.jpg`) {
  const I = x => ({ en: toInline((x && x.en) || ""), he: toInline((x && (x.he || x.en)) || "") });
  const blk = b => {
    if (b.type === "heading") return `<section>${T("h2", I(b.text))}</section>`;
    if (b.type === "paragraph") return `<section>${T("p", I(b.text))}</section>`;
    if (b.type === "image" && /^media:[0-9a-f-]{36}$/.test(b.image || "")) {
      const n = "m-" + b.image.slice(6);
      return `<figure class="dfig"><img src="${imgSrc(n, 900)}" srcset="${imgSrc(n, 640)} 640w, ${imgSrc(n, 900)} 900w, ${imgSrc(n, 1254)} 1254w" sizes="(min-width:900px) 720px, 92vw" alt="${escA((b.alt && b.alt.en) || "")}" data-alt-he="${escA((b.alt && b.alt.he) || "")}" loading="lazy" decoding="async">${b.caption && b.caption.en ? `<figcaption ${A(I(b.caption))}>${I(b.caption).en}</figcaption>` : ""}</figure>`;
    }
    if (b.type === "button" && b.label && b.label.en && safeHref(b.href || "")) return `<p class="dask"><a class="dbtn" href="${escA(safeHref(b.href))}" ${A(I(b.label))}>${I(b.label).en}</a></p>`;
    return "";
  };
  return `<main class="doc">
${d.eyebrow && d.eyebrow.en ? `<div class="k gold" ${A(I(d.eyebrow))}>${I(d.eyebrow).en}</div>` : ""}
<h1 data-doc-title ${A(I(d.title))}>${I(d.title).en}</h1>
${d.lede && d.lede.en ? `<p class="lede" ${A(I(d.lede))}>${I(d.lede).en}</p>` : ""}
${(d.blocks || []).map(blk).join("\n")}
</main>`;
}
