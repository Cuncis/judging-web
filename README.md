# Self-Care Excellence Awards 2026 — Judging Microsite

> **SwipeRx x Opella · World Pharmacists Day 2026**
> WordPress custom theme. Backend powered by Custom Post Types, WordPress user roles, ACF Pro, and the WP REST API.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Pages & Templates](#4-pages--templates)
5. [Custom Post Types & Data](#5-custom-post-types--data)
6. [Design System](#6-design-system)
7. [Multilingual Support](#7-multilingual-support)
8. [Getting Started](#8-getting-started)
9. [User Roles & Demo Accounts](#9-user-roles--demo-accounts)
10. [What's Mocked vs Real (Phase 2)](#10-whats-mocked-vs-real-phase-2)
11. [Scoring Logic](#11-scoring-logic)
12. [Database Structure](#12-database-structure)

---

## 1. Project Overview

This is the judging portal for the **Self-Care Excellence Awards 2026**, part of World Pharmacists Day (WPD) celebrations by SwipeRx x Opella.

**Who uses this app:**

| Role | What they do |
|---|---|
| **Judge** (pharmacist experts) | Log in, review shortlisted nominations, score them across 4 categories |
| **SwipeRx Admin** | Monitor judging progress across all 3 countries and all 9 judges |

**Countries covered:** 🇮🇩 Indonesia · 🇵🇭 Philippines · 🇻🇳 Vietnam

**Award Categories:**

| Badge | Category | Description |
|---|---|---|
| Cat 1 | Empower & Educate | Advancing public understanding of self-care & medication literacy |
| Cat 2 | Expanding Access | Improving access to self-care products and guidance |
| Cat 3 | Referral & Care Pathways | Exceptional judgment in patient referral and escalation |
| Cat 4 | Social Media Impact | Pharmacist-created social content promoting self-care |

---

## 2. Tech Stack

```
WordPress 6.x          — CMS and routing
PHP 8.1+               — Server-side templating
Advanced Custom Fields Pro — Submission & score field groups
Tailwind CSS           — Utility-first styling (compiled via standalone CLI)
WordPress REST API     — AJAX scoring saves and admin data fetch
Polylang               — Multilingual support (EN / ID / VI)
```

> **Authentication:** WordPress built-in user system with custom roles (`wpdj_judge`, `wpdj_admin`).
> **Data storage:** WordPress Custom Post Types (`wpdj_submission`, `wpdj_score`) — no Google Sheets dependency.

---

## 3. Project Structure

```
wp-content/themes/wpd-judging/
├── assets/
│   ├── css/
│   │   └── app.css                  # Compiled Tailwind CSS
│   ├── js/
│   │   ├── scoring.js               # Live score calculator + unsaved-changes guard
│   │   ├── admin.js                 # Admin dashboard interactions
│   │   └── nav.js                   # Hamburger / mobile nav
│   └── images/                      # Logos, icons
├── template-parts/
│   ├── layout/
│   │   ├── navbar.php               # Shared nav bar (dark green)
│   │   └── footer.php               # Confidentiality footer
│   ├── judge/
│   │   ├── category-badge.php       # Colour-coded category badges
│   │   ├── score-input.php          # 1–10 slider + input per criterion
│   │   ├── weighted-total.php       # Live score preview
│   │   └── progress-table.php       # Category progress rows
│   └── admin/
│       ├── country-card.php         # Summary card per country
│       └── judge-table.php          # Judge progress table
├── page-templates/
│   ├── template-landing.php         # Public homepage — country selector
│   ├── template-judge-login.php     # Judge login (country set via ACF page field)
│   ├── template-admin-login.php     # Admin login
│   ├── template-judge-dashboard.php # /judge/dashboard
│   ├── template-scoring.php         # Cat 1–3 scoring (?submission_id=xxx)
│   ├── template-scoring-cat4.php    # Cat 4 scoring (?submission_id=xxx)
│   └── template-admin-dashboard.php # /admin/dashboard
├── inc/
│   ├── cpt-submissions.php          # CPT: wpdj_submission
│   ├── cpt-scores.php               # CPT: wpdj_score
│   ├── roles.php                    # Register wpdj_judge & wpdj_admin roles
│   ├── rest-api.php                 # Custom REST endpoints (/wp-json/wpdj/v1/)
│   ├── acf-fields.php               # ACF field group registration (or import JSON)
│   └── access-control.php          # template_redirect guards for protected pages
├── acf-json/                        # ACF local JSON (auto-sync)
├── functions.php                    # Enqueue scripts/styles, init hooks
├── style.css                        # Theme header comment
├── header.php
├── footer.php
└── index.php
```

---

## 4. Pages & Templates

Pages are created in the WordPress admin and assigned a custom page template via the **Page Attributes** panel.

### Public Pages

| WordPress Page Slug | Template File | Notes |
|---|---|---|
| `/` | `template-landing.php` | Country selector cards; Admin login link in nav |
| `/login/indonesia` | `template-judge-login.php` | ACF field `judge_country` = `ID` |
| `/login/philippines` | `template-judge-login.php` | ACF field `judge_country` = `PH` |
| `/login/vietnam` | `template-judge-login.php` | ACF field `judge_country` = `VN` |
| `/login/admin` | `template-admin-login.php` | No country shown |

### Judge Pages (protected — requires `wpdj_judge` role)

| WordPress Page Slug | Template File | Notes |
|---|---|---|
| `/judge/dashboard` | `template-judge-dashboard.php` | Progress across all 4 categories |
| `/judge/scoring` | `template-scoring.php` | `?category=cat1&submission_id=123` |
| `/judge/scoring` | `template-scoring-cat4.php` | `?category=cat4&submission_id=123` |

### Admin Pages (protected — requires `wpdj_admin` role)

| WordPress Page Slug | Template File | Notes |
|---|---|---|
| `/admin/dashboard` | `template-admin-dashboard.php` | All countries · All judges · Export CSV |

> Access control is enforced in `inc/access-control.php` via `template_redirect`. Any visitor without the required role is redirected to `/` with a query-string message: `?expired=1`.

---

## 5. Custom Post Types & Data

All data lives in WordPress CPTs registered in `inc/cpt-submissions.php` and `inc/cpt-scores.php`. ACF Pro field groups attach metadata to each CPT.

### CPT: `wpdj_submission` — Shortlisted Nominations

Imported (or entered) by the SwipeRx Admin before judging opens. The post title is the internal submission code (e.g. `PH-CAT1-003`).

**ACF Fields:**

| Field Key | Type | Notes |
|---|---|---|
| `submission_code` | Text | e.g. `PH-CAT1-003` |
| `country` | Select | `ID` / `PH` / `VN` |
| `category` | Select | `CAT1` / `CAT2` / `CAT3` / `CAT4` |
| `entry_type` | Text | Self-Nomination or Peer-Nomination |
| `initiative_title` | Text | Cat 1–3 only |
| `area_of_practice` | Text | Cat 1–3 only |
| `about` | Textarea | Cat 1–3 only |
| `impact` | Textarea | Cat 1–3 only |
| `who_benefited` | Textarea | Cat 1–3 only |
| `swiperx_notes` | Textarea | Internal SwipeRx notes |
| `social_handle` | Text | Cat 4 only |
| `platform` | Select | Instagram / TikTok / Facebook — Cat 4 only |
| `post_date` | Date | Cat 4 only |
| `post_url` | URL | Cat 4 only |
| `post_caption` | Textarea | Cat 4 only |
| `tags` | Text | Cat 4 only |
| `swiperx_tagged` | True/False | Cat 4 only |
| `campaign_link_included` | True/False | Cat 4 only |
| `shortlisted` | True/False | Only `true` entries are shown to judges |

### CPT: `wpdj_score` — Judge Scores

Created (or updated) when a judge submits a scoring form. One post per judge–submission pair.

**ACF Fields:**

| Field Key | Type | Notes |
|---|---|---|
| `judge_user_id` | Number | `WP_User` ID |
| `submission_id` | Post Object | Links to `wpdj_submission` |
| `submission_code` | Text | Denormalised for fast query |
| `country` | Select | Denormalised |
| `category` | Select | Denormalised |
| `score_1` | Number | 1–10 |
| `score_2` | Number | 1–10 |
| `score_3` | Number | 1–10 |
| `score_4` | Number | 1–10 |
| `weighted_total` | Number | Calculated server-side on save |
| `comments` | Textarea | Required |

> Saving via the REST API endpoint (`POST /wp-json/wpdj/v1/scores`) checks for an existing post with matching `judge_user_id` + `submission_id` and **updates** it rather than creating a duplicate.

---

## 6. Design System

### Colour Palette

| Token | Hex | Used for |
|---|---|---|
| `primary-dark` | `#112E1A` | Nav bar, hero section |
| `dark-navy` | `#00102E` | Headings |
| `body-text` | `#233452` | Body copy |
| `teal` | `#30BCA1` | Buttons, CTAs, progress bars |
| `dark-teal` | `#006869` | Hover states |
| `gold` | `#D69900` | Cat 3 accent, reminder borders |
| `warm-cream` | `#F7EFE6` | Section backgrounds |
| `light-cream` | `#FFF8E6` | Card tints, reminder boxes |
| `light-grey` | `#F4F5F7` | Table rows, input backgrounds |
| `error` | `#C0392B` | Error states, "behind" status |

### Category Badge Colours

| Category | Background | Accent | Text |
|---|---|---|---|
| Cat 1 — Empower & Educate | `#E1F5EE` | `#30BCA1` | `#006869` |
| Cat 2 — Expanding Access | `#E6F1FB` | `#185FA5` | `#185FA5` |
| Cat 3 — Referral & Care Pathways | `#FFF3CC` | `#D69900` | `#8A6000` |
| Cat 4 — Social Media Impact | `#E8EAF0` | `#233452` | `#233452` |

### Typography

```css
font-family: 'Cambria', 'Georgia', serif;          /* Headings */
font-family: 'Calibri', system-ui, sans-serif;     /* Body & UI */
font-family: 'Courier New', monospace;             /* Submission codes */
```

### Status Colour Coding (Dashboard)

| Status | Colour |
|---|---|
| Complete | Green `#30BCA1` |
| In Progress | Amber `#D69900` |
| Not Started / Behind | Red `#C0392B` |

---

## 7. Multilingual Support

Language switching is handled by **Polylang** (free) or **WPML** (premium). The selected language persists via Polylang's built-in cookie/session.

**Supported languages:**

| Code | Language |
|---|---|
| `en` | English (default) |
| `id` | Bahasa Indonesia |
| `vi` | Tiếng Việt |

All UI strings use `pll__()` / `pll_e()` helper functions (Polylang equivalents of `__()` / `_e()`). Submission content entered by pharmacists is always displayed as-is.

**Example usage in templates:**

```php
// navbar.php
<a href="<?php echo pll_home_url(); ?>">
  <?php pll_e('Home'); ?>
</a>

// judge-dashboard.php
echo sprintf(
  pll__('Welcome %s. Here is your scoring progress for %s.'),
  esc_html($current_user->display_name),
  esc_html($judge_country)
);
```

> For WPML, replace `pll_e()` / `pll__()` with `_e()` / `__()` and register strings via `icl_register_string()`.

---

## 8. Getting Started

### Prerequisites

- PHP 8.1+
- WordPress 6.x (Local by Flywheel, XAMPP, Laragon, or a live host)
- ACF Pro (license required) or ACF Free (reduced field types)
- Polylang plugin
- Node.js 18+ (only for compiling Tailwind CSS)

### Installation

```bash
# 1. Clone the theme into your WordPress themes folder
cd wp-content/themes/
git clone https://github.com/swiperx/wpd2026-awards.git wpd-judging

# 2. Install and compile Tailwind CSS
cd wpd-judging
npm install
npm run build          # outputs assets/css/app.css
```

### WordPress Setup

1. **Activate the theme** — Appearance → Themes → WPD Judging
2. **Install plugins** — ACF Pro, Polylang (activate both)
3. **Import ACF field groups** — ACF → Tools → Import JSON → select all files in `acf-json/`
4. **Add languages** — Polylang → Languages → add English, Bahasa Indonesia, Tiếng Việt
5. **Create pages** with the correct template (see [Pages & Templates](#4-pages--templates))
6. **Create user accounts** — Users → Add New, assign role `wpdj_judge` (set `judge_country` user meta via ACF User fields) or `wpdj_admin`
7. **Import starter submissions** — use the WP-CLI command below or enter via WP Admin

```bash
# Optional: import sample submission data via WP-CLI
wp eval-file inc/cli-import-sample-data.php
```

### Compile CSS (development)

```bash
npm run dev     # watch mode — rebuilds app.css on file changes
npm run build   # production build (minified)
```

App will be available at your local WordPress URL (e.g. `http://wpd-judging.local`)

---

## 9. User Roles & Demo Accounts

Custom roles are registered in `inc/roles.php` on theme activation.

| Role Slug | Capabilities | Assigned To |
|---|---|---|
| `wpdj_judge` | View/score submissions for their country only | Country judges (3 per country) |
| `wpdj_admin` | View all submissions and scores; export CSV | SwipeRx Admin |

Each judge user has a `judge_country` user meta field (`ID`, `PH`, or `VN`) set via the ACF User field group.

**Demo accounts for local testing:**

| Role | Username | Password | Country |
|---|---|---|---|
| Judge (Indonesia) | `judge.id` | `demo1234` | Indonesia |
| Judge (Philippines) | `judge.ph` | `demo1234` | Philippines |
| Judge (Vietnam) | `judge.vn` | `demo1234` | Vietnam |
| Admin | `swiperx.admin` | `admin2026` | All countries |

> **Note:** WordPress handles password hashing (bcrypt via `wp_hash_password()`). Never store plain-text passwords — these demo credentials should be changed on the production site via Users → Edit User.

---

## 10. What's Mocked vs Real (Phase 2)

| Feature | Phase 1 (current) | Phase 2 (production) |
|---|---|---|
| Login / auth | WordPress demo users with `wpdj_judge` / `wpdj_admin` roles | Same — harden with login attempt limiting (e.g. Limit Login Attempts plugin) |
| Load submissions | `WP_Query` against `wpdj_submission` CPT (sample data imported via WP-CLI) | Same CPT — populated via CSV import tool or SwipeRx Admin WP panel |
| Save scores | `POST /wp-json/wpdj/v1/scores` → writes to `wpdj_score` CPT (persists in WP DB) | Same endpoint — already persistent |
| Admin dashboard data | Computed via `WP_Query` over `wpdj_score` CPT | Same — no change needed |
| CSV export | PHP generates CSV from `WP_Query` results; sent as file download | Same |
| Session management | WordPress native sessions (`wp_get_current_user()`) | Add idle timeout + forced re-login via custom session handler |
| Progress tab | Computed from `wpdj_score` CPT | Same |

---

## 11. Scoring Logic

### Categories 1, 2, 3

Four criteria scored 1–10:

| # | Criterion | Weight |
|---|---|---|
| 1 | Impact on patient outcomes | 40% |
| 2 | Innovation & approach | 20% |
| 3 | Sustainability & scalability | 20% |
| 4 | Relevance to self-care pillar | 20% |

**Formula:**
```
Weighted Total = (Score1 × 0.4) + (Score2 × 0.2) + (Score3 × 0.2) + (Score4 × 0.2)
```

### Category 4 — Social Media Impact

| # | Criterion | Weight |
|---|---|---|
| 1 | Creativity & production quality | 40% |
| 2 | Authenticity & storytelling | 35% |
| 3 | Pharmacy advocacy strength | 15% |
| 4 | Campaign alignment | 10% |

**Formula:**
```
Weighted Total = (Score1 × 0.4) + (Score2 × 0.35) + (Score3 × 0.15) + (Score4 × 0.1)
```

**Live preview** shows the formula breakdown as the judge types, e.g.:
```
8.2 / 10   →   (8×0.4) + (7×0.2) + (8×0.2) + (9×0.2)
```

**Rules:**
- Comments field is **required** — Save button is disabled and field turns red if empty
- Saving a score that already exists **overwrites** the row (matched on Judge Email + Submission Code) — never duplicates
- Navigating away with unsaved changes shows a **confirm dialog**

---

## 12. Database Structure

WordPress stores all data in its standard tables. No custom DB tables are required.

### `wpdj_submission` posts

Each shortlisted nomination is a `wpdj_submission` post. Meta fields are managed by ACF and stored in `wp_postmeta`.

**Key post meta keys:** `_submission_code`, `_country`, `_category`, `_entry_type`, `_initiative_title`, `_area_of_practice`, `_about`, `_impact`, `_who_benefited`, `_swiperx_notes`, `_social_handle`, `_platform`, `_post_date`, `_post_url`, `_post_caption`, `_tags`, `_swiperx_tagged`, `_campaign_link_included`, `_shortlisted`

### `wpdj_score` posts

Each saved score is a `wpdj_score` post. The REST API endpoint (`inc/rest-api.php`) performs an `UPDATE` if a post already exists matching `_judge_user_id` + `_submission_id`.

**Key post meta keys:** `_judge_user_id`, `_submission_id`, `_submission_code`, `_country`, `_category`, `_score_1`, `_score_2`, `_score_3`, `_score_4`, `_weighted_total`, `_comments`

### WordPress Users

Standard `wp_users` / `wp_usermeta` tables. Judge country is stored in `wp_usermeta` under key `judge_country`.

> **WP-CLI query example — export all PH scores:**
> ```bash
> wp post list --post_type=wpdj_score --meta_key=_country --meta_value=PH --format=csv
> ```

---

## Notes for the Development Team

- **Anonymisation:** Cat 1–3 pages must never render nominee name, workplace, phone, or email — these fields simply don't exist in the Submissions mock and should not be added to the UI.
- **Cat 4 unblinding:** Cat 4 is the only category where the pharmacist's social handle and post link are visible. A notice banner must appear at the top of every Cat 4 scoring page.
- **Country filtering:** Judges only ever see submissions matching their own country. This filter is applied at the data layer (mock or API).
- **Session expiry:** Any route under `/judge/*` or `/admin/*` that detects no valid session should immediately redirect to `/` with the message: *"Session expired — please sign in again."*
- **Mobile-first:** Scoring pages stack vertically on mobile (submission content on top, scoring form below). On desktop (≥1024px) they sit side by side.

---

*Confidential — for authorised judges only · SwipeRx 2026*