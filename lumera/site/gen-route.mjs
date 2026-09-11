// Turn silavu-page.html into the TanStack Start home route (SSR-safe: markup is server-rendered, scripts run after mount).
// Usage: node gen-route.mjs <silavu-page.html> <out index.tsx>
import fs from "node:fs";
const [src, out] = process.argv.slice(2);
let html = fs.readFileSync(src, "utf8");
html = html.replace(/<title>[\s\S]*?<\/title>/, "");
const css = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map(m => m[1]).join("\n");
html = html.replace(/<style>[\s\S]*?<\/style>/g, "");
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
html = html.replace(/<script>[\s\S]*?<\/script>/g, "").trim();
const tsx = `import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

const CSS = ${JSON.stringify(css)};
const HTML = ${JSON.stringify(html)};
const SCRIPTS: string[] = ${JSON.stringify(scripts)};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SILAVU — High jewellery, Dubai · Tel Aviv" },
      { name: "description", content: "A private high-jewellery house in Dubai and Tel Aviv. The SILAVU Line, bespoke pieces, private viewings by appointment." },
      { name: "theme-color", content: "#000000" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "preload", as: "image", href: "/img/hero.jpg", media: "(min-width: 900px)" },
      { rel: "preload", as: "image", href: "/img/herov.jpg", media: "(max-width: 899px)" },
    ],
  }),
  component: Index,
});

function Index() {
  useEffect(() => {
    const els = SCRIPTS.map((code) => { const s = document.createElement("script"); s.textContent = code; document.body.appendChild(s); return s; });
    return () => { els.forEach((s) => s.remove()); };
  }, []);
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div dangerouslySetInnerHTML={{ __html: HTML }} />
    </>
  );
}
`;
fs.writeFileSync(out, tsx);
console.log("route written:", out, (tsx.length / 1024).toFixed(0) + " KB;", scripts.length, "scripts");
