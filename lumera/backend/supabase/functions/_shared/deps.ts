// The real dependencies, on Supabase's Deno runtime. The handlers never touch
// these directly, so the test suite can give them the same shape over a local
// Postgres. SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are
// provided by the platform; everything else is a function secret.
import { createClient } from "npm:@supabase/supabase-js@2";
import type { Deps } from "./http.ts";

export function makeDeps(): Deps {
  const env = (k: string) => Deno.env.get(k);
  const url = env("SUPABASE_URL")!, anon = env("SUPABASE_ANON_KEY")!, service = env("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  const check = <T>(r: { data: T; error: any }): T => { if (r.error) throw new Error(r.error.message + (r.error.code ? " (" + r.error.code + ")" : "")); return r.data; };
  return {
    env,
    fetch: (input, init) => fetch(input, init),
    rpc: async (fn, args) => check(await admin.rpc(fn, args)),
    userRpc: async (jwt, fn, args) => {
      const as = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: "Bearer " + jwt } } });
      return check(await as.rpc(fn, args));
    },
    verify: async (jwt) => {
      const { data, error } = await admin.auth.getUser(jwt);
      if (error || !data || !data.user) return null;
      return { id: data.user.id, email: data.user.email, aal: "aal1" };
    },
    storage: {
      signedUrl: async (bucket, path, seconds) => check(await admin.storage.from(bucket).createSignedUrl(path, seconds)).signedUrl,
      download: async (bucket, path) => new Uint8Array(await check(await admin.storage.from(bucket).download(path)).arrayBuffer()),
      upload: async (bucket, path, body, type) => { check(await admin.storage.from(bucket).upload(path, body, { contentType: type, upsert: false })); },
      list: async (bucket) => (check(await admin.storage.from(bucket).list("", { limit: 1000, sortBy: { column: "created_at", order: "desc" } })) as any[]).filter(f => f.id).map(f => ({ name: f.name, created_at: f.created_at })),
      remove: async (bucket, paths) => { check(await admin.storage.from(bucket).remove(paths)); }
    },
    authAdmin: {
      invite: async (email, redirectTo) => {
        const r = await admin.auth.admin.inviteUserByEmail(email, { redirectTo });
        if (r.error) {
          // already has an account: look it up instead of inviting twice
          const list = check(await admin.auth.admin.listUsers({ page: 1, perPage: 1000 }));
          const u = list.users.find((x: any) => (x.email || "").toLowerCase() === email);
          if (!u) throw new Error(r.error.message);
          return { id: u.id };
        }
        return { id: r.data.user.id };
      },
      create: async (email, password) => {
        const r = await admin.auth.admin.createUser({ email, password, email_confirm: true });
        if (r.error) throw new Error(/already/i.test(r.error.message) ? "conflict: this email already has an account; set its password from the team list instead" : r.error.message);
        return { id: r.data.user.id };
      },
      setPassword: async (userId, password) => { check(await admin.auth.admin.updateUserById(userId, { password })); },
      ban: async (userId) => { check(await admin.auth.admin.updateUserById(userId, { ban_duration: "876000h" })); }
    }
  };
}
