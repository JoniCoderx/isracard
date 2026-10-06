// Times are stored in UTC and shown in Israel time.
export const TZ = "Asia/Jerusalem";
const fmt = (o) => new Intl.DateTimeFormat("en-GB", { timeZone: TZ, ...o });
const D = fmt({ day: "numeric", month: "short", year: "numeric" });
const DT = fmt({ day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const T = fmt({ hour: "2-digit", minute: "2-digit" });
export const day = (v) => v ? D.format(new Date(v)) : "";
export const when = (v) => v ? DT.format(new Date(v)) : "";
export const clock = (v) => v ? T.format(new Date(v)) : "";
export function ago(v) {
  if (!v) return ""; const s = (Date.now() - new Date(v).getTime()) / 1000;
  if (s < 60) return "just now"; if (s < 3600) return Math.round(s / 60) + " min ago"; if (s < 86400) return Math.round(s / 3600) + " h ago";
  return when(v);
}
/* the start of a day in Israel, as a UTC instant */
export function israelDayStart(d) {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  const guess = new Date(p + "T00:00:00Z");
  const off = new Date(guess.toLocaleString("en-US", { timeZone: TZ })).getTime() - new Date(guess.toLocaleString("en-US", { timeZone: "UTC" })).getTime();
  return new Date(guess.getTime() - off);
}
export function range(days, endDate = new Date()) {
  const to = new Date(israelDayStart(endDate).getTime() + 86400000);
  const from = new Date(to.getTime() - days * 86400000);
  return { from, to, prevFrom: new Date(from.getTime() - days * 86400000), prevTo: from };
}
