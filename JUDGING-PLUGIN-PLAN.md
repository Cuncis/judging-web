# WPD Judging Plugin — wp-admin Data Entry Plan

> Draft for review. This describes what the **WordPress plugin's backend (wp-admin)** would contain if this
> judging microsite were rebuilt as a standalone plugin — every screen, every field the real **WordPress
> Administrator** (the person who can already log into `/wp-admin/` today) fills in manually, and how bulk CSV
> import would work. Nothing here is built yet; this is the spec to sign off on first.

---

## Table of Contents

1. [Why a Plugin (not a Theme)](#1-why-a-plugin-not-a-theme)
2. [Two Admin Surfaces — Don't Confuse Them](#2-two-admin-surfaces--dont-confuse-them)
3. [wp-admin Menu Structure](#3-wp-admin-menu-structure)
4. [Screen: Judging Overview (plugin landing page)](#4-screen-judging-overview-plugin-landing-page)
5. [Screen: Submissions](#5-screen-submissions)
6. [Screen: Import Submissions (CSV)](#6-screen-import-submissions-csv)
7. [Screen: Categories](#7-screen-categories)
8. [Screen: Countries](#8-screen-countries)
9. [Screen: Judging Admins & Judges](#9-screen-judging-admins--judges)
10. [Screen: Import Judges (CSV)](#10-screen-import-judges-csv)
11. [Screen: Scores (read-only + override)](#11-screen-scores-read-only--override)
12. [Screen: Settings](#12-screen-settings)
13. [Roles & Capabilities](#13-roles--capabilities)
14. [CSV Templates (exact columns)](#14-csv-templates-exact-columns)
15. [Validation & Duplicate-Handling Rules](#15-validation--duplicate-handling-rules)
16. [Pre-Launch Checklist — "What Must Be Filled In"](#16-pre-launch-checklist--what-must-be-filled-in)
17. [Phase 2 / Explicitly Out of Scope for v1](#17-phase-2--explicitly-out-of-scope-for-v1)
18. [Open Questions Before Development Starts](#18-open-questions-before-development-starts)

---

## 1. Why a Plugin (not a Theme)

The `README.md` in this repo originally scoped this as a **custom theme**. A plugin is the better call if you want:

- The judging portal to work **regardless of which theme the WordPress site is running** (install it on any site, activate, done).
- To **not lose the judging data** if the site's theme ever changes.
- Front-end pages served via **shortcodes** (e.g. `[wpdj_judge_dashboard]`, `[wpdj_scoring]`, `[wpdj_admin_progress]`) dropped into normal WP Pages, rather than theme page-templates.

Everything below assumes the plugin owns its own Custom Post Types, roles, and admin menu, and is fully removable without breaking the rest of the site.

**Recommendation:** build custom meta boxes with plain PHP instead of requiring ACF Pro. ACF is great for editorial speed, but a paid third-party dependency is a bad fit for something you're handing to a client to self-host, and bulk CSV import is easier to validate against native meta fields than through ACF's abstraction. (Happy to go the ACF route instead if you'd rather — flag it in [Open Questions](#18-open-questions-before-development-starts).)

---

## 2. Two Admin Surfaces — Don't Confuse Them

This project has **three distinct people/roles**, and it's important not to blur them:

| Surface | Who uses it | Purpose | wp-admin access |
|---|---|---|---|
| **wp-admin backend** (`/wp-admin/`) | The real **WordPress Administrator** — the site owner/developer, the only person with an actual WordPress account today | **Data entry**: create/import submissions, set up categories & countries, create Judging Admin accounts, create/import Judge accounts, view/override raw scores | ✅ Full "Judging Awards" menu |
| **Front-end Admin Dashboard** (`admin-dashboard.html` in this mockup, reached via `login-admin.html`) | **Judging Admin** (`wpdj_admin` role) — e.g. a SwipeRx program manager who needs to watch progress but should never touch WordPress itself | **Progress monitoring**: country cards, judge progress table, CSV export — the pretty branded page | ❌ None at all |
| **Front-end Judge pages** (`login-{country}.html` → judge dashboard → scoring pages) | **Judge** (`wpdj_judge` role) | Score assigned submissions for their own country | ❌ None at all |

This is a correction to how earlier drafts of this document phrased it: the person who logs in at `login-admin.html` and sees `admin-dashboard.html` is **not** the WordPress Administrator and does **not** get a `/wp-admin/` login. They're a separate, front-end-only role — `wpdj_admin` — created by the real WordPress Administrator, exactly the same way a Judge account is created. The Judge model in this document was already correct (front-end only, no wp-admin); the Judging Admin role now follows the identical pattern.

The front-end dashboard doesn't need to be rebuilt inside wp-admin — it stays as the polished, branded "at a glance" view, and gets wired to pull real numbers from the CPTs this plugin creates instead of hardcoded HTML.

**Neither Judges nor Judging Admins ever see wp-admin.** They only ever touch the front-end login → dashboard → scoring/progress pages already built in this repo. The entire wp-admin menu below is for the real WordPress Administrator only — and that includes the screen where Judging Admin and Judge accounts themselves get created (see [§9](#9-screen-judging-admins--judges)).

---

## 3. wp-admin Menu Structure

```
Judging Awards                          (top-level menu, dashicons-awards)
├── Overview                            (stats, deadline countdown, quick links)
├── Submissions                         (CPT list table)
│   └── Add New Submission
├── Import Submissions                  (CSV bulk upload)
├── Categories                          (the 4 award categories + criteria/weights)
├── Countries                           (ID / PH / VN + hashtags, handles, judge quota)
├── Judging Admins                      (wpdj_admin accounts — front-end progress dashboard only)
│   └── Add New Judging Admin
├── Judges                              (wpdj_judge accounts — front-end scoring only)
│   └── Add / Import Judges
├── Scores                              (read-only, judge-submitted — with manual override)
├── Export                              (CSV: submissions / scores / judge progress)
└── Settings                            (event name, deadline, footer text, languages)
```

---

## 4. Screen: Judging Overview (plugin landing page)

Read-only summary shown the moment the WordPress Administrator clicks "Judging Awards" — not a data-entry screen, just orientation:

| Widget | Shows |
|---|---|
| Submissions by status | Total imported → Shortlisted → Not shortlisted |
| Submissions by country × category | 3×4 grid of counts (matches the 40/40/40 pattern from the mockup) |
| Scoring progress | % complete overall + per country (same numbers as the front-end Admin Dashboard) |
| Judges | Count per country, with a "not yet scored anything" flag for stragglers |
| Deadline | Scoring deadline countdown (from Settings) |
| Quick links | "Import Submissions", "Add Judge", "Add Judging Admin", "View Front-End Dashboard" |

---

## 5. Screen: Submissions

CPT: `wpdj_submission`. This is the biggest data-entry surface — one row per shortlisted nomination, filled in manually **or** via [bulk CSV import](#6-screen-import-submissions-csv).

**List table** — filterable by Country, Category, Shortlisted status; searchable by Submission Code.

### Fields — common to all categories

| Field | Type | Required | Notes |
|---|---|---|---|
| Submission Code | Text | ✅ | e.g. `PH-CAT1-003`. Unique — this is the natural key for import upserts. Can auto-generate from Country+Category+next number, or be typed in to match an existing spreadsheet. |
| Country | Select (Indonesia / Philippines / Vietnam) | ✅ | Drives which judges see it |
| Category | Select (Cat 1–4) | ✅ | Drives which fields below apply and which scoring criteria are used |
| Entry Type | Select (Self / Team / Individual) | ✅ | Matches the enum already used across the judge dashboard table |
| Shortlisted | Toggle | ✅ | Only `Yes` entries become visible to judges. Lets you import everything first, then flip shortlisted entries on once the shortlisting decision is made. |
| Internal Notes | Textarea | — | SwipeRx-only, never rendered on any judge-facing page |

### Fields — Categories 1–3 only (blinded from judges)

| Field | Type | Required |
|---|---|---|
| Initiative Title | Text | ✅ |
| Area of Practice | Text | ✅ |
| About This Initiative | Textarea | ✅ |
| Impact | Textarea | ✅ |
| Who Benefited | Textarea | ✅ |

> ⚠️ Nominee name, workplace, phone, and email are **intentionally not fields at all** — Cat 1–3 judging is blind. Don't add them even as "admin-only" fields; if they exist in the DB there's a real risk they leak into a future template.

### Fields — Category 4 only (unblinded — social handle & post are shown to judges)

| Field | Type | Required | Notes |
|---|---|---|---|
| Social Handle | Text | ✅ | e.g. `@theurbanfarmacist` — shown as the submission title |
| Platform | Select (Instagram / Facebook / TikTok) | ✅ | Vietnam entries are typically Facebook, not Instagram — see [Countries](#8-screen-countries) |
| Post Date | Date | ✅ | |
| Post URL | URL | ✅ | |
| Post Caption | Textarea | ✅ | Rendered verbatim, in whatever language the nominee posted in — never machine-translated |
| Hashtags Used | Repeatable text / comma-separated | — | Free text, not restricted to the 4 official campaign tags |
| Official SwipeRx Account Tagged? | Toggle | ✅ | |
| Campaign Link Included? | Toggle | ✅ | |
| Engagement — Likes / Comments / Shares | 3 number fields | — | Optional context for judges |
| Media Upload | Image or video file | — | Replaces the "Post Preview (media placeholder)" block once real assets exist |

### Computed, not manually filled

- **Scoring status** (Complete / In Progress / Not Started) — derived from whether a `wpdj_score` exists per judge for this submission, shown as a read-only column on the list table.

### Judge navigation order (Previous / Next submission)

The mockup's "← Previous submission" / "Next submission →" links now walk a full ordered queue — Category 1 → 2 → 3 → 4, submissions in ascending Submission Code order within each category, wrapping around at the end — matching the order the real plugin should use: all of that judge's assigned submissions in their own country, ordered by Submission Code. No extra field is required for this by default; it falls out of the existing `Country` + `Category` + `Submission Code` fields. (An optional manual "Display Order" number field could be added later if the client wants control over judging sequence independent of code order — see [Open Questions](#18-open-questions-before-development-starts).)

**Important — this is demoed with fabricated sample data, not real data:** to make the ordering/persistence behaviour clickable, the mockup ships `assets/js/submissions-data.js`, a hardcoded JS array of 40 made-up Philippines submissions (10 per category) standing in for real `wpdj_submission` posts, plus a `wpdjScores` object in the browser's `localStorage` standing in for real `wpdj_score` posts. **Neither of those exists in the real plugin.** In the actual build:
- The queue is built from a live database query (all `wpdj_submission` posts matching the judge's `judge_country`, ordered by the `Submission Code` postmeta), not a static JS file.
- "Already scored, shows saved values" / "not yet scored, defaults to 0" is driven by whether a `wpdj_score` post exists for that judge + submission pair in the database, not a `localStorage` key — `localStorage` is per-browser/per-device and would silently lose or fail to share a judge's scores the moment they switch devices, clear their browser, or use a different machine, which is unacceptable for real judging data.
- Saving a score is a real write (AJAX/REST call persisting a `wpdj_score` post), not a client-side-only state toggle.

---

## 6. Screen: Import Submissions (CSV)

1. **Download template** button — outputs a CSV with the exact headers from [§14](#14-csv-templates-exact-columns), pre-filled with one example row per category so the format is obvious.
2. **Upload** — file picker, auto-detects delimiter/encoding.
3. **Column mapping step** — if headers don't exactly match the template (e.g. client re-orders or renames columns in their own spreadsheet), map each CSV column to a plugin field manually. Mapping is remembered for next time.
4. **Validation pass (dry run, nothing written yet)** — checks:
   - Required fields present for the row's Category
   - `Country` and `Category` are valid enum values
   - `Submission Code` uniqueness — flags whether each row will **create** a new submission or **update** an existing one (matched by Submission Code)
   - Category-4-only fields aren't required on Cat 1–3 rows and vice versa
5. **Preview table** — first 50 rows shown with a status badge per row (✅ Create / 🔄 Update / ❌ Error + reason). Nothing commits until you click **Import**.
6. **Commit + results summary** — "112 created, 8 updated, 0 skipped." Any errors are downloadable as an `errors.csv` with the original row + reason, so they can be fixed and re-uploaded without redoing the whole file.

**Re-running an import is safe** — same Submission Code = update in place, never a duplicate.

---

## 7. Screen: Categories

The 4 award categories are **admin-configurable**, not hardcoded — so next year's weights can change without a developer.

| Field | Type | Required | Notes |
|---|---|---|---|
| Category Code | Text (locked after creation) | ✅ | `CAT1`–`CAT4` |
| Category Name | Text | ✅ | e.g. "Empower & Educate" |
| Short Description | Textarea | — | Shown on the judge dashboard tile |
| Blinded? | Toggle | ✅ | `No` for Cat 4 only — controls whether the "unblinded category" notice renders and whether nominee-identifying fields show |
| Criteria | Repeatable rows: Name + Weight % + Judge-Facing Guidance | ✅ | e.g. 4 rows for Cat 1–3 (40/20/20/20), 4 rows for Cat 4 (40/35/15/10) |

**Judge-Facing Guidance** is the short sentence rendered under each criterion heading on the scoring page (e.g. "How clearly the initiative leads to measurable improvements in patient health behaviour, adherence, or wellbeing.") — currently hardcoded per criterion in the mockup's HTML, but should be an admin-editable field here so wording can be tuned without a developer touching code.

**Validation:** the weights across all criteria rows for a category must sum to exactly 100%. Block save otherwise.

---

## 8. Screen: Countries

Also admin-configurable rather than hardcoded — useful since the campaign hashtags/handles are genuinely different per market (confirmed against the live WPD ID/PH/VN campaign pages: Vietnam's primary channel is Facebook, not Instagram).

| Field | Type | Required | Notes |
|---|---|---|---|
| Country Code | Text (locked) | ✅ | `ID` / `PH` / `VN` |
| Display Name | Text | ✅ | Indonesia / Philippines / Vietnam |
| Flag | Fixed enum, maps to existing SVG icon | ✅ | Reuses the flag-icon set already built (no upload needed) |
| Primary Social Platform | Select (Instagram / Facebook / TikTok) | ✅ | Default platform pre-filled when adding a new Cat 4 submission for this country |
| Official Handle(s) | Text per platform | — | e.g. ID → `@swiperxapp` (IG + TikTok), PH → `@swiperxapp_ph` (IG), VN → `@swiperxvn` (FB + TikTok) |
| Campaign Hashtags | Repeatable text | — | The 3 shared tags + 1 country tag, e.g. `#TrustBeginsAtTheCounter #SwipeRxJoinTheMovement #SwipeRxWPD2026 #WPD2026ID` |
| Registration/Campaign Link | URL | — | e.g. `https://swiperx.app.link/e/sm/home/WPDxID` |
| Judges assigned | Read-only count | — | Computed from the Judges screen |
| Submissions | Read-only count | — | Computed from Submissions |

> These country hashtag/handle fields exist specifically so the Cat 4 scoring page examples (and any future auto-fill helpers) never drift back to being Philippines-only again.

---

## 9. Screen: Judging Admins & Judges

Both roles below are **WordPress Users with a custom role**, and both are created here, by the real WordPress Administrator, inside wp-admin. Neither role is ever granted `/wp-admin/` access — this screen exists purely so the Administrator can provision their accounts. Once created, each person logs into their own front-end page (`login-admin.html` or a country's `login-{country}.html`) exactly as already built in this mockup.

### Judging Admins (`wpdj_admin`)

Front-end-only role for whoever needs to watch overall judging progress without scoring anything — e.g. a SwipeRx program manager. Logs in at `login-admin.html`, sees only the front-end `admin-dashboard.html` (progress across all 3 countries, judge progress table, CSV export). Not scoped to a single country, since their job is to see everything.

| Field | Type | Required | Notes |
|---|---|---|---|
| Name | Text | ✅ | WP display name |
| Email | Email | ✅ | WP username/login |
| Password | Auto-generate + email, or set manually | ✅ | Standard WP `wp_hash_password()` |
| Active | Toggle | ✅ | Deactivate to revoke access without deleting the account |

There are typically only one or two of these accounts, so no bulk CSV import is planned for this role — add manually via "Add New Judging Admin."

### Judges (`wpdj_judge`)

**No manual per-judge submission assignment** — the current model is *country-scoped*: every judge in a country reviews every shortlisted submission for that country, across all 4 categories. (If you want true panel-splitting — e.g. only 3 of 9 judges per submission — that's a Phase 2 change, see §17.)

| Field | Type | Required | Notes |
|---|---|---|---|
| Name | Text | ✅ | WP display name |
| Email | Email | ✅ | WP username/login; also where the welcome email goes |
| Country | Select (ID / PH / VN) | ✅ | Stored as user meta `judge_country`; controls which submissions they can see |
| Preferred Language default | Select (native / English) | — | Pre-fills the language dropdown on their login page; they can still switch at login like the current mockup |
| Password | Auto-generate + email, or set manually | ✅ | Standard WP `wp_hash_password()` |
| Active | Toggle | ✅ | Deactivate to revoke access without deleting their scoring history |

**List table** — filterable by Country, with a "submissions scored / total assigned" progress column (same number as the front-end judge progress table).

---

## 10. Screen: Import Judges (CSV)

Separate tool from Submissions import since judges are WP Users, not a CPT.

**CSV columns:** `name, email, country, language, active`

- One row per judge (up to however many you need — the mockup ships 3 per country as a demo, but the import isn't hardcoded to 3).
- On import: creates a WP user if the email doesn't exist, or updates country/language/active status if it does (upsert by email).
- Triggers WordPress's standard "your account has been created" email, or a custom-branded welcome email with their login URL — decide which in [Open Questions](#18-open-questions-before-development-starts).

---

## 11. Screen: Scores (read-only + override)

CPT: `wpdj_score`. **Judges fill this in from the front-end**, not wp-admin — this screen exists so the WordPress Administrator can audit and, if a genuine dispute or entry error comes up, correct a score.

| Column | Notes |
|---|---|
| Judge | Name + email |
| Submission Code | Links to the Submission |
| Country / Category | Denormalised for fast filtering |
| Score 1–4 | Per-criterion, editable only via the "Override" action |
| Weighted Total | Always computed server-side from Score 1–4 × that category's weights — never hand-typed |
| Comments | Judge's rationale — required at save time on the front-end, read-only here unless overriding |
| Submitted At | Timestamp |

**Override action** requires a reason (short text, stored alongside the edit) so there's a lightweight audit trail — not a full revision history, just enough to answer "why does this number not match what the judge originally typed."

**Filters:** Country, Category, Judge, "Missing scores" (submissions with zero score records yet).

**Export CSV** button on this screen — same shape as the export the front-end Admin Dashboard already produces (`submission_code, country, category, judge, score_1..4, weighted_total, comments`), so nothing about the client-facing export changes.

---

## 12. Screen: Settings

| Field | Type | Notes |
|---|---|---|
| Event Name | Text | Default "Self-Care Excellence Awards 2026" — shown in nav/footer branding |
| Scoring Deadline | Date | Drives the Overview countdown; could later gate score submission after this date |
| Footer / Confidentiality Text | Text | "Confidential: authorised judges only · SwipeRx 2026" |
| Supported UI Languages | Checkboxes (EN / Bahasa Indonesia / Filipino / Tiếng Việt) | Matches the login-page language dropdowns already built |
| Category 4 Unblinding Notice Text | Textarea | Editable copy for the notice banner, in case legal/marketing wants to adjust wording later |

**How the UI translation itself would actually work:** the mockup's `assets/js/i18n.js` is a hardcoded client-side JS object mapping ~90 English UI strings (nav, labels, buttons, scoring guide, criterion headings and guidance text) to Bahasa Indonesia / Filipino / Tiếng Việt, swapped in by matching exact text nodes once `localStorage['wpdjLang']` is set at login. That approach doesn't carry over into WordPress as-is. Two real options:

1. **Standard WordPress i18n** — wrap every UI string in `__()`/`_e()` with the plugin's text domain, ship `.po`/`.mo` translation files per language, load via `load_plugin_textdomain()`. Fastest to build, but editing wording after launch means editing translation files, not a wp-admin screen.
2. **Custom "String Overrides" screen** — a simple key → {id, fil, vi} table in wp-admin (functionally the server-side equivalent of the current `PHRASES` object), editable without touching code. Slower to build but matches how Criteria Guidance and other client-editable copy already works elsewhere in this plan.

Either way, this only covers **plugin-owned UI chrome** — nominee-submitted content (initiative descriptions, impact text, Cat 4 captions) is never machine-translated and always renders in whatever language it was submitted in, same scoping decision as the current mockup.

---

## 13. Roles & Capabilities

| Role slug | Capability | Who | wp-admin access |
|---|---|---|---|
| `administrator` (built-in WP role) | Full CRUD on Submissions, Categories, Countries; create/manage Judging Admin accounts; create/import Judge accounts; view/override all Scores; import/export | The real WordPress Administrator (site owner/dev) | ✅ Full "Judging Awards" menu |
| `wpdj_admin` | View aggregated progress across all countries via the front-end Admin Dashboard; export CSVs. **No CRUD capability on anything, no wp-admin access of any kind.** | Judging Admin (e.g. SwipeRx program manager) | ❌ None — front-end only, via `login-admin.html` |
| `wpdj_judge` | View/score submissions matching their own `judge_country` only | Country judges | ❌ None — front-end only |

On plugin activation, the "Judging Awards" wp-admin menu's capabilities are granted to the built-in `administrator` role automatically, so the real site owner is never locked out regardless of the specific capability names the plugin registers. `wpdj_admin` and `wpdj_judge` are intentionally kept capability-free in wp-admin — they exist only to gate what each front-end page shows.

---

## 14. CSV Templates (exact columns)

### Submissions import

```
submission_code, country, category, entry_type, shortlisted, internal_notes,
initiative_title, area_of_practice, about, impact, who_benefited,
social_handle, platform, post_date, post_url, post_caption, hashtags_used,
swiperx_tagged, campaign_link_included, likes, comments, shares
```

Cat 1–3 rows leave the `social_handle` → `shares` columns blank; Cat 4 rows leave `initiative_title` → `who_benefited` blank. The importer only enforces "required" per-category, not across the whole row.

### Judges import

```
name, email, country, language, active
```

---

## 15. Validation & Duplicate-Handling Rules

Applies to both manual entry and CSV import:

- **Submissions** — unique key is `submission_code`. Re-import with the same code **updates**, never duplicates. Category-specific required fields are enforced based on the row's `category` value.
- **Judges** — unique key is `email`. Re-import with the same email **updates** country/language/active status.
- **Scores** — unique key is `judge_user_id` + `submission_id` (this already matches the logic in the existing `README.md` §5). A judge re-saving a score updates their existing record; it never creates a second one. This part is unchanged from the current mockup's `assets/js/scoring.js` behaviour, just moved server-side.
- **Category weights** — must sum to 100% per category or the save is blocked with an inline error.

---

## 16. Pre-Launch Checklist — "What Must Be Filled In"

Before judges (or the Judging Admin) are given login credentials, the WordPress Administrator needs to have completed, in this order:

1. ☐ **Settings** — event name, scoring deadline, confirm supported languages
2. ☐ **Countries** — confirm the 3 countries' hashtags/handles/platform are correct (esp. Vietnam = Facebook, not Instagram)
3. ☐ **Categories** — confirm criteria, weights, and judge-facing guidance text for all 4 categories sum to 100%
4. ☐ **Submissions** — either import via CSV or hand-enter every shortlisted nomination, then verify the "Shortlisted" toggle is `Yes` only on the entries judges should actually see
5. ☐ **Judging Admins & Judges** — create the Judging Admin account(s) for whoever will monitor the front-end dashboard, and create/import all Judge accounts with correct Country assignment
6. ☐ **Spot-check** — log in as one test judge per country and as the test Judging Admin, and confirm: judges see only their country's submissions and Cat 4 shows the correct handle/hashtags for that country; the Judging Admin sees the progress dashboard and nothing else (no `/wp-admin/` access for either)

Nothing on the judge-facing side becomes visible/usable until step 4 and 5 are both done — an empty Submissions list or a judge with no Country assigned should show a clear "nothing assigned yet" state rather than a blank/broken page.

---

## 17. Phase 2 / Explicitly Out of Scope for v1

Keeping these out of the first build on purpose — flag if any of these are actually must-haves and they move up:

- Per-judge submission assignment (panel-splitting instead of "every judge sees every submission in their country")
- Automated email notifications (deadline reminders, "new submission assigned")
- Full revision history / audit log on score overrides (v1 is just a reason field, not a diff log)
- Multi-year archive / cloning last year's categories & countries into a new event
- REST API endpoints beyond what the front-end scoring pages need (no public API)
- Media library integration for Cat 4 post previews beyond a simple upload field
- Auto-import from Google Forms/Sheets (CSV export-then-import covers this manually for now)

---

## 18. Open Questions Before Development Starts

- ACF Pro vs. plain custom meta boxes — confirm the recommendation in §1, or you already have an ACF Pro license and want to keep using it?
- Judge welcome emails: WordPress default new-user email, or a custom-branded one?
- Should `submission_code` auto-generate (e.g. next available `PH-CAT2-0XX`) or always come from an existing spreadsheet/import?
- Any country beyond ID/PH/VN expected in future years? (Affects whether Countries should be a fixed 3-row config screen or a fully generic "add a country" screen — the plan above already assumes generic/extensible.)
- Should the scoring deadline actually **block** judges from saving scores after it passes, or just be a display-only countdown for admin?
- Should Previous/Next submission order be automatic (by Submission Code) or should admins be able to manually re-order a judge's queue (a "Display Order" field)?
- UI translation: standard WordPress `.po`/`.mo` files, or a custom wp-admin "String Overrides" screen so wording can be tweaked without a developer? (See [Settings](#12-screen-settings).)

---

*Draft — for internal review only, not yet built.*
