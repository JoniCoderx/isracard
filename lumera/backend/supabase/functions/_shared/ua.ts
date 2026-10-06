// A coarse reading of the user agent: device class, browser family, OS, and
// whether it is plainly a robot. Nothing finer is kept; nothing is combined
// into an identifier.

const BOT = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|quora link|whatsapp|telegrambot|discordbot|preview|headless|lighthouse|pagespeed|phantom|puppeteer|playwright|selenium|python-requests|curl\/|wget\/|httpclient|axios|node-fetch|go-http|java\//i;

export function readAgent(ua: string): { device: string; browser: string; os: string; bot: boolean } {
  const s = ua || "";
  const bot = !s || BOT.test(s);
  const device = /iPad|Tablet|Nexus 7|Nexus 10|SM-T|Kindle|Silk/i.test(s) || (/Android/i.test(s) && !/Mobile/i.test(s)) ? "tablet"
    : /Mobi|iPhone|iPod|Android.*Mobile|Windows Phone/i.test(s) ? "mobile"
    : /Windows|Macintosh|Linux|CrOS|X11/i.test(s) ? "desktop" : "other";
  const browser = /Edg\//.test(s) ? "Edge" : /OPR\/|Opera/.test(s) ? "Opera" : /SamsungBrowser/.test(s) ? "Samsung Internet"
    : /Firefox\/|FxiOS/.test(s) ? "Firefox" : /CriOS|Chrome\//.test(s) ? "Chrome" : /Safari\//.test(s) ? "Safari" : "Other";
  const os = /iPhone|iPad|iPod/.test(s) ? "iOS" : /Android/.test(s) ? "Android" : /Windows/.test(s) ? "Windows" : /Mac OS X|Macintosh/.test(s) ? "macOS" : /CrOS/.test(s) ? "ChromeOS" : /Linux/.test(s) ? "Linux" : "Other";
  return { device, browser, os, bot };
}

/* the two-letter country, only when the platform in front supplies one */
export function country(h: Headers): string | null {
  const c = (h.get("cf-ipcountry") || h.get("x-country") || h.get("x-vercel-ip-country") || "").toUpperCase();
  return /^[A-Z]{2}$/.test(c) && c !== "XX" && c !== "T1" ? c : null;
}
