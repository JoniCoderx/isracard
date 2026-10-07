# SILAVU admin: setup, running, publishing, backups

The admin is a separate small app at **`/isracard/admin/`** (later `https://<your domain>/admin/`).
The public site stays a static GitHub Pages site. Behind both is one Supabase project
(Postgres with row-level security, Auth, private Storage, Edge Functions).

```
 visitor ──► GitHub Pages (static site) ──► enquiry / collect ──► Supabase Edge Functions ──► Postgres
                     ▲                                                          │
                     │  GitHub Actions builds the site from the published release
 staff ──► /admin/ ──┴─► Supabase Auth + Postgres (RLS) ──► publish ──► repository_dispatch
```

* Saving in the admin writes a **draft** to the database. Nothing public changes.
* **Publish** freezes the chosen drafts into a numbered **release** and asks GitHub to rebuild.
  The build fetches that release (with a build token), renders the site, derives the photographs,
  and deploys. The admin shows the release as *queued → building → live* (or *failed*, in which
  case the site keeps the previous release).
* The browser only ever holds the project's **public** address and **publishable (anon) key**.
  Everything else is a server secret (table below).

Until the steps below are done, the site builds exactly as before and `/admin/` says
"The admin is not connected yet".

---

## 1. What is public and what is secret

| Name | Where it lives | Public? | What it is |
|---|---|---|---|
| `SILAVU_SUPABASE_URL` | the workflows (default) or GitHub Actions **Variables** (override) | yes | `https://bugfiwulkbsjelmswcjh.supabase.co` |
| `SILAVU_SUPABASE_ANON_KEY` | the workflows (default) or GitHub Actions **Variables** (override) | yes | the project's anon key. It is in the admin every browser downloads, and can do nothing that row-level security does not allow. |
| `SILAVU_BUILD_TOKEN` | GitHub Actions **Secrets** | **no** | *optional.* Without it (the current setup) each build proves itself with GitHub's own signed statement of the run (OIDC, audience `silavu-build`), which the backend checks against `GH_REPO` and `GH_BRANCH`. |
| `GH_BRANCH` | Supabase function secret | no | `claude/isracard-dev-environment-tzc6s5`: the only branch whose builds the backend accepts |
| `BUILD_TOKEN` | Supabase function secret | **no** | 64 hex characters (`openssl rand -hex 32`). Lets the build read the published release and report its status, and lets the nightly job back up. Never contains a dot. |
| `GH_TOKEN` | Supabase function secret | **no** | *optional.* Without it (the current setup), GitHub checks for waiting releases every 5 minutes (`publish-watch.yml`) and a publish is live in about 10–15 minutes. With a fine-grained token (**only this repository**, *Contents: Read and write*), the build starts at once (2–4 minutes). |
| `GH_REPO` | Supabase function secret | no | `JoniCoderx/isracard` |
| `SITE_URL` | Supabase function secret | no | `https://jonicoderx.github.io/isracard` |
| `ADMIN_URL` | Supabase function secret | no | `https://jonicoderx.github.io/isracard/admin/` |
| `ALLOWED_ORIGINS` | Supabase function secret | no | `https://jonicoderx.github.io` (origin only, no path; comma-separate if a domain is added) |
| `RATE_SALT` | Supabase function secret | **no** | any long random string; visitor IP addresses are only ever kept as salted hashes for rate limits |
| `NOTIFY_TO` | Supabase function secret | no | *optional, not used now.* Who is emailed when an enquiry arrives |
| `RESEND_API_KEY` | Supabase function secret | **no** | *optional, not used now:* email through Resend (needs a verified sending domain) |
| `MAIL_FROM` | Supabase function secret | no | with Resend: e.g. `SILAVU <concierge@mail.silavu.com>` on the verified domain |
| `NOTIFY_FORMSUBMIT` | Supabase function secret | no | `on` to notify through FormSubmit instead of Resend (the inbox must have been activated) |
| `AUTO_REPLY` | Supabase function secret | no | `on` sends the visitor a short confirmation (Resend only). Off by default; the site never promises a confirmation that is not sent. |
| `EXPORT_KEEP_DAYS` | Supabase function secret | no | how long nightly backups are kept (default 35) |

`SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are provided to the functions
by Supabase itself. **The service-role key is never put anywhere else**: not in GitHub, not in the
repository, not in the admin. The admin's build refuses to run if it is given one.

A template with every name and no values: `lumera/backend/supabase/.env.example`.
Fill a copy called `.env.production` **on your own computer only** (it is ignored by git).

---

## 2. One-time setup (about an hour)

You need: a Supabase account, the Supabase CLI (`npm i -g supabase` or `brew install supabase/tap/supabase`),
Node 22, and admin rights on the GitHub repository.

1. **Create the project.** supabase.com → New project. Region: *Central EU (Frankfurt)* is closest
   to Israel and the Gulf. Free plan to start (see costs, section 8). Note the project ref.
2. **Apply the database.**
   ```bash
   cd lumera/backend
   supabase login
   supabase link --project-ref <ref>
   supabase db push            # applies supabase/migrations/*, in order; nothing is dropped
   ```
3. **Function secrets.** Fill `supabase/.env.production` from the template, then
   ```bash
   supabase secrets set --env-file supabase/.env.production
   ```
4. **Deploy the functions.**
   ```bash
   supabase functions deploy     # all of them; each checks its own caller (config.toml)
   ```
5. **Auth settings** (Dashboard → Authentication):
   * *Sign In / Providers*: turn **off** "Allow new users to sign up". Staff only ever arrive by invitation.
   * *URL Configuration*: Site URL = `https://jonicoderx.github.io/isracard/admin/`.
   * *Emails → SMTP Settings*: **optional; skipped for now.** Supabase's built-in mailer only
     delivers to members of your Supabase organisation, about two emails an hour. Without SMTP the
     admin works without email: **Team → Invite someone** with a password makes the account ready
     at once, and **Set a password** on the team list replaces a forgotten one. Enquiries are saved
     in the admin; nobody is emailed about them. To add email later, with Resend: host
     `smtp.resend.com`, port `465`, user `resend`, password = a Resend API key.
   * *Emails → Templates*: paste `supabase/templates/invite.html` into **Invite user** and
     `supabase/templates/recovery.html` into **Reset password** (subjects are in `config.toml`).
     These links carry a one-time token the admin exchanges itself, so they work from a phone's mail app.
   * *Multi-Factor*: TOTP enabled (the default).
   (`supabase config push` applies the `[auth]` section of `config.toml` if your CLI version supports it;
   check the dashboard afterwards either way.)
6. **The first owner.** Dashboard → Authentication → Users → *Add user* (your email, a strong password,
   *Auto confirm*). Then Dashboard → SQL Editor:
   ```sql
   select app.bootstrap_owner('you@example.com');
   ```
   This works once: when an owner exists it refuses, and everyone else is invited from the admin.
7. **GitHub.** Repository → Settings → Secrets and variables → Actions:
   variables `SILAVU_SUPABASE_URL`, `SILAVU_SUPABASE_ANON_KEY`; secret `SILAVU_BUILD_TOKEN`.
   Then Actions → *SILAVU static site* → **Run workflow** once.
8. **First sign-in.** Open `/isracard/admin/`, sign in, go to **Account** and set up the
   authenticator app (strongly advised for the owner). Then **Publishing → Import the current site**.
   The site's content is now in the admin, exactly as it is live (this is checked byte for byte in the
   tests). From now on the admin is where it changes.
9. **The team.** **Team → Invite someone**, with a role (and, while no email is set up, a password you give them). Tick *Authenticator required* for anyone
   who should need one; they are asked to set it up at their next sign-in and see nothing until then.

### Roles

| Role | Can | Cannot |
|---|---|---|
| Owner | everything: team, roles, second factor, exports, restoring releases, costs and suppliers, visit-counting settings | – |
| Editor | products, pages and text, media, The Line, languages and SEO, settings (not visit counting), publishing, history | enquiries, customers, quotes, team, exports |
| Support | enquiries, customers, quotes | content, publishing, team, analytics, bulk export |
| Analyst | visit figures (summaries only) | names, enquiries, editing anything |

Roles are read from the database on **every request** (row-level security and the functions),
never from anything the browser holds. A role change or removal applies to the next request;
removal also signs the person out and blocks the account at Auth.

---

## 3. Running it locally (no accounts needed)

Needs Postgres 15+ listening on a socket in `/tmp`, port 54329 (any local cluster; the tests create
their own databases `silavu_test` / `silavu_restore` and touch nothing else), Node 22, and Chromium
for the browser tests (`/opt/pw-browsers` or `CHROMIUM=/path/to/chrome`).

```bash
npm ci --prefix lumera && npm ci --prefix lumera/admin && npm ci --prefix lumera/backend
cd lumera/backend
npm test                     # database policies (16) and edge functions (10)
npm run test:acceptance      # the brief's checks 1–15 in a real browser (about 12 minutes)
node --experimental-strip-types test/dev.mjs
# → admin http://127.0.0.1:8777/admin/  owner@silavu.test / local-owner-password
```

`test/dev.mjs` runs everything on this machine: a fresh database, a local stand-in for Supabase's
HTTP services that runs the **real** edge functions against the real database and policies, the
**real** site build as "GitHub Actions", and a static server. Email is not sent (it is recorded),
GitHub is not called (a local build runs instead). The local stack leaves out the heavy films and
3D assets that only the live build fetches, so a few images are blank locally; that is expected.

---

## 4. Publishing, step by step

1. Edit and **Save draft** (also autosaved every 30 s; unsaved work is kept on the device if the
   connection drops). If someone else saved the same page meanwhile, you are told and choose whose
   version to keep; nothing is overwritten silently.
2. **Preview**: your draft laid over the real live page, in English or Hebrew, desktop or phone.
   Previews exist only inside the signed-in admin; they are never at a public address.
3. **Publish** (one page) or the **Publish** button at the top (everything waiting).
4. The release appears under **History → Releases**: *queued → building → live*, usually 2–4 minutes.
   Without `GH_TOKEN` it stays *queued* until GitHub's next 5-minute check (`publish-watch.yml`)
   picks it up; GitHub runs schedules on a best-effort basis, so allow 10–15 minutes.
   With a token, if GitHub could not be reached it stays *queued* with the reason and a **Start the build again** button.
   If the build fails it is marked *failed*; **the site keeps the last good release**.

A code push to the branch also rebuilds the site, always from the newest release that did not fail,
so a code change never undoes what was published.

**Rollback.** History → Releases → **Restore** on any earlier release makes every page as it was
then, as a new release (nothing in between is deleted). For one page: open it → *Earlier versions* →
**Use this version**, then publish.

**Moved pages.** GitHub Pages cannot send HTTP redirects. *Pages & text → Menus → Moved pages*
writes a small forwarding page at the old address (`noindex`, canonical to the new one, instant
refresh), which browsers and search engines follow.

---

## 5. Backups and restoring

* **Nightly**: `.github/workflows/maintenance.yml` (01:17 UTC) asks the backend to write a full
  export into the private `exports` bucket, then runs the housekeeping (visit records past the
  retention set in Settings, spent rate-limit counters, scheduled backups past `EXPORT_KEEP_DAYS`).
  Nothing personal passes through GitHub; the job sees only counts and a file name.
* **By hand**: History & backups → Backups → **Make an export now** (owner only). The download
  link works for ten minutes.
* An export holds: content and every version, releases, the library's records, product costs,
  customers, enquiries and notes, quotes, the team list and the audit trail. Pictures and films
  stay in the private `media` bucket and are copied by the restore script.
* Supabase's own daily database backups exist on paid plans only (Pro: 7 days).

**Restoring** (into a new, empty project; the script refuses a database that already has content):

1. Create the new project and do steps 1–6 of section 2 (migrations, secrets, functions, auth,
   owner). Invite the team again first: accounts and passwords are not part of an export, and staff
   records are matched to the new accounts by email.
2. On your computer:
   ```bash
   cd lumera/backend && npm ci
   export RESTORE_DATABASE_URL='postgresql://postgres:<db password>@db.<new ref>.supabase.co:5432/postgres'
   node scripts/restore.mjs silavu-export-<date>.json.gz --dry-run      # counts only, writes nothing
   SOURCE_SUPABASE_URL=https://<old ref>.supabase.co SOURCE_SERVICE_ROLE_KEY=<old service key> \
   TARGET_SUPABASE_URL=https://<new ref>.supabase.co TARGET_SERVICE_ROLE_KEY=<new service key> \
   node scripts/restore.mjs silavu-export-<date>.json.gz
   ```
   Keys are read from the environment only; do not save them in a file in the repository.
3. Point GitHub's variables and secret at the new project, run the site workflow once.

The acceptance test (check 15) rehearses exactly this on local databases: export → empty backend →
restore (refused the second time) → identical counts → the site rebuilt from the restored backend
is identical to the original, page for page.

---

## 6. Moving to your own domain

1. Put the domain on one line in `lumera/site/CNAME`, push, and set the DNS records GitHub Pages asks for.
2. Function secrets: `SITE_URL=https://<domain>`, `ADMIN_URL=https://<domain>/admin/`,
   `ALLOWED_ORIGINS=https://<domain>,https://jonicoderx.github.io` (keep the old one until the move is done).
3. Auth → URL Configuration: Site URL = `https://<domain>/admin/`.
4. Run the site workflow. Canonical links, the sitemap, sharing tags and structured data all follow.

---

## 7. Privacy, as built

* Enquiries are saved in the house's own database. The house is emailed through the provider set
  above; the visitor gets a confirmation only if `AUTO_REPLY=on` and they left an email.
* Visit counting (Settings → Visit counting, owner only): *consent* (default; nothing is sent until
  the visitor says yes), *cookieless*, or *off*. Global Privacy Control is a no. The admin's own
  browser is never counted. No form contents, emails, phone numbers, photos, URL secrets or tokens
  are collected; no fingerprinting, no session recordings. The privacy page's wording follows the
  setting automatically when you publish.
* The wrist try-on still works entirely on the visitor's device; no photo is uploaded.

---

## 8. Costs and limits (check the providers' pages before relying on these figures)

| Service | Plan | Cost | Limits that matter here |
|---|---|---|---|
| GitHub Pages + Actions | free (public repo) | $0 | site ≤ 1 GB, ~100 GB/month bandwidth (soft) |
| Supabase | Free | $0 | 500 MB database, ~500 MB–1 GB files, 5 GB egress, 500k function calls/month; **a free project pauses after about a week without activity** (the nightly job calls it every day, which is expected to keep it awake, but this is not guaranteed); no automatic backups |
| Supabase | Pro | $25/month per organisation | 8 GB database, 100 GB files, 250 GB egress, daily backups kept 7 days, never paused. Recommended once the admin is in daily use; it is your decision (nothing has been subscribed). |
| Resend (not used now) | Free | $0 | 3,000 emails/month, 100/day, one domain, if email is added later |

Media uploads are limited to 50 MB per file; on the free plan a handful of films fills the file quota.

---

## 9. What has been verified, and what has not

**Verified here** (automated, on this machine; see `lumera/backend/test/`): database policies,
every edge function, and the brief's acceptance checks 1–15 end to end in a real browser against the
real database, policies, functions and site build, with the site served under `/isracard/`.

**Not verified** (needs the real accounts, so it could not be run from here):
* Supabase-hosted behaviour: `db push` on a hosted project, function deployment, hosted Auth
  (invite/recovery emails through your SMTP, TOTP on the hosted service), Storage signed URLs.
* The 5-minute publish check (`publish-watch.yml`) on GitHub's real scheduler, and the Pages workflow building from a real release.
* Email (not set up, by choice).
* The nightly workflow against the real project; whether it keeps a free project from pausing.
* Country detection (needs a hosting header the local stand-in does not have).
* The custom domain (not set up yet).
