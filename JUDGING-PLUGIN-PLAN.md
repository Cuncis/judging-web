# WPD Judging Plugin — wp-admin Data Entry Plan

> Draft for review. This describes what the **WordPress plugin's backend (wp-admin)** would contain if this
> judging microsite were rebuilt as a standalone plugin — every screen, every field the SwipeRx Admin fills in
> manually, and how bulk CSV import would work. Nothing here is built yet; this is the spec to sign off on first.

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
9. [Screen: Judges](#9-screen-judges)
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

This project already has **two different "admin" experiences**, and the plugin plan below is only about the first one:

| Surface | Who uses it | Purpose | Status |
|---|---|---|---|
| **wp-admin backend** (`/wp-admin/`) | SwipeRx Admin (you) | **Data entry**: create/import submissions, set up categories & countries, manage judge accounts, view/export raw scores | 🆕 This document — not built yet |
| **Front-end Admin Dashboard** (`admin-dashboard.html` in this mockup) | SwipeRx Admin (you) | **Progress monitoring**: country cards, judge progress table, CSV export — the pretty branded page | ✅ Already built as static HTML in this repo |

The front-end dashboard doesn't need to be rebuilt inside wp-admin — it stays as the polished, branded "at a glance" view, and gets wired to pull real numbers from the CPTs this plugin creates instead of hardcoded HTML. wp-admin is purely the boring data-entry side.

**Judges never see wp-admin.** They only ever touch the front-end login → dashboard → scoring pages already built in this repo. The entire menu below is for SwipeRx Admin only.

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
├── Judges                              (WP users with the Judge role)
│   └── Add / Import Judges
├── Scores                              (read-only, judge-submitted — with manual override)
├── Export                              (CSV: submissions / scores / judge progress)
└── Settings                            (event name, deadline, footer text, languages)
```

---

## 4. Screen: Judging Overview (plugin landing page)

Read-only summary shown the moment SwipeRx Admin clicks "Judging Awards" — not a data-entry screen, just orientation:

| Widget | Shows |
|---|---|
| Submissions by status | Total imported → Shortlisted → Not shortlisted |
| Submissions by country × category | 3×4 grid of counts (matches the 40/40/40 pattern from the mockup) |
| Scoring progress | % complete overall + per country (same numbers as the front-end Admin Dashboard) |
| Judges | Count per country, with a "not yet scored anything" flag for stragglers |
| Deadline | Scoring deadline countdown (from Settings) |
| Quick links | "Import Submissions", "Add Judge", "View Front-End Dashboard" |

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
| Criteria | Repeatable rows: Name + Weight % | ✅ | e.g. 4 rows for Cat 1–3 (40/20/20/20), 4 rows for Cat 4 (40/35/15/10) |

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

## 9. Screen: Judges

Judges are WordPress Users with a custom role. **No manual per-judge submission assignment** — the current model is *country-scoped*: every judge in a country reviews every shortlisted submission for that country, across all 4 categories. (If you want true panel-splitting — e.g. only 3 of 9 judges per submission — that's a Phase 2 change, see §17.)

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

CPT: `wpdj_score`. **Judges fill this in from the front-end**, not wp-admin — this screen exists so SwipeRx Admin can audit and, if a genuine dispute or entry error comes up, correct a score.

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

---

## 13. Roles & Capabilities

| Role slug | Capability | Who | wp-admin access |
|---|---|---|---|
| `wpdj_admin` | Full CRUD on Submissions, Categories, Countries, Judges; view/override all Scores; import/export | SwipeRx Admin | ✅ Full "Judging Awards" menu |
| `wpdj_judge` | View/score submissions matching their own `judge_country` only | Country judges | ❌ None — front-end only |

Existing WordPress `administrator` accounts (site owner/dev) automatically get `wpdj_admin` capabilities too, so you're never locked out of your own plugin.

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

Before judges are given login credentials, SwipeRx Admin needs to have completed, in this order:

1. ☐ **Settings** — event name, scoring deadline, confirm supported languages
2. ☐ **Countries** — confirm the 3 countries' hashtags/handles/platform are correct (esp. Vietnam = Facebook, not Instagram)
3. ☐ **Categories** — confirm criteria + weights for all 4 categories sum to 100%
4. ☐ **Submissions** — either import via CSV or hand-enter every shortlisted nomination, then verify the "Shortlisted" toggle is `Yes` only on the entries judges should actually see
5. ☐ **Judges** — create or import all judge accounts with correct Country assignment
6. ☐ **Spot-check** — log in as one test judge per country and confirm: only their country's submissions appear, Cat 4 shows the correct handle/hashtags for that country, scoring saves correctly

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

---

*Draft — for internal review only, not yet built.*
