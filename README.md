# Covenant Matrimony

A premium HTML, CSS and JavaScript showcase built from the supplied Covenant Matrimony blueprint. The package also contains a PHP session and JSON API demonstration.

## What is included

- Three public pages: Home, About us and Our specialties.
- Three role workspaces: Member, Branch and Church.
- A Super admin workspace for central review and oversight.
- Shared mock login, an online profile wizard, branch/church assisted drafts and partner enquiries.
- An eight-stage homepage photo accordion that expands on hover, focus or tap; a horizontal photo carousel for eight specialties, with swipe, keyboard and arrow controls; larger readable text, reduced-motion support and a five-state India enquiry map.
- Original generated wedding, family, church and counselling images; fictional profile portraits.
- A branded A4 PDF download in Admin > Reports, using the current aggregate workspace totals.
- Bundled pdf-lib for local PDF generation; no remote JavaScript, paid APIs, CDNs or font requests.

## Deploy on Vercel

Follow DEPLOY_VERCEL.md. A ready-to-use vercel.json is included for the static mock-data showcase.

## Open the hosted showcase

https://covenant-matrimony-showcase.nkaransrinivas1319.chatgpt.site

The hosted version is a private static showcase. Changes are saved in the current browser. It does not execute PHP or authenticate real members.

## Demo login

Open `login.html`. Each workspace tab fills its credentials automatically.

| Workspace | Email | Password |
| --- | --- | --- |
| Member | member@covenant.demo | Covenant@2026 |
| Branch | branch@covenant.demo | Covenant@2026 |
| Church | church@covenant.demo | Covenant@2026 |
| Super admin | admin@covenant.demo | Covenant@2026 |

Sign out to switch roles. To reset browser records, open the public footer's Privacy dialog and select Reset browser demo data.

## Run the static version

Serve the `dist` directory over HTTP; do not open it with a `file://` URL because browser module loading and map fetches require HTTP.

```bash
python3 -m http.server 8080 --directory dist
```

Open http://localhost:8080. There is no build or dependency installation step.

## Run the PHP demonstration

Requirements: PHP 8.2 or newer, with its standard JSON and session modules. No database extension is needed for this bounded demo.

From the package root:

```bash
php -S 127.0.0.1:8080 server/router.php
```

Open http://127.0.0.1:8080. The router serves the same UI and automatically sets the transport to PHP. `server/api.php` stores shared fictional state in `var/demo.json`, outside the public `dist` directory. `COVENANT_DATA_DIR` can choose a different private, writable storage directory. Delete `var/demo.json` to reset the server demo when no request is in progress.

The PHP API uses server sessions, regenerated session IDs, HttpOnly/SameSite cookies, a CSRF token, organisation checks on each request and exclusive file locks for mutations. A branch or church cannot approve profiles or record member consent. Central review requires member consent and evidence. Contact permission is independent of interest acceptance and membership. Coordinator reassignment removes the previous organisation's case access.

The credentials are deliberately public fictional demo accounts. PHP's development server and the JSON store are demonstration infrastructure, not a real-member production deployment.

## Suggested showcase walkthrough

1. Open Home and hover, tap or use the arrows to expand the eight journey image panels, then explore the five regional enquiry choices.
2. Open About us and Our specialties.
3. Sign in to the Member demo. View profiles, accept Daniel's interest and review the new introduction awaiting assignment. Contact details remain private.
4. Sign out and sign in to Admin. Assign a coordinator to the new introduction and approve Anna's existing review-ready profile with a reason.
5. Sign in as Branch to inspect its scoped directory and create a fictional assisted draft. It remains awaiting consent; submission cannot bypass this.
6. Sign in as Church to record an affiliation confirmation and inspect its assigned introduction worklist.
7. Reassign an introduction from the church to the branch in Admin, then inspect the former coordinator's worklist to see access removed.
8. In Member, pause discovery or revoke a permission. In Admin, see the resulting state and recorded events.
9. In Admin > Reports, choose Download PDF report. The PDF contains current totals, intake routes, review stages, state counts and coordination progress, without individual member details.

## Scope and next development stage

This handover is a functional showcase. Membership pricing and benefits remain undecided. No real email, SMS, payment, identity verification, document upload, church onboarding invitation or counselling note storage is performed. Public registration saves an unpublished fictional draft; it does not create a real login account. The member login remains the seeded demonstration account.

The demo has role-scoped states and central review actions. The production build must connect an actual member registration and verification flow, durable relational records, private assets, versioned consent, individual staff identities and MFA, member-authorised delegation, retention/deletion rules, backups and recovery, delivery providers, and approved pricing and entitlement policies. Website Content displays the three authored pages; a publishing CMS is outside this mock build. Appointment management covers member responses to a seeded proposed appointment.

The five states are Karnataka, Kerala, Tamil Nadu, Andhra Pradesh and Telangana. They are enquiry options, not claims of offices, partner coverage or available members. No invented success counts, endorsements, founder history or testimonials are included.

## File structure

```text
dist/                 Public HTML, CSS, JavaScript and assets
  index.html          Home
  about.html          About us
  specialties.html    Our specialties
  login.html          Shared demo login
  member.html         Member workspace
  branch.html         Branch workspace
  church.html         Church workspace
  admin.html          Super admin workspace
  app.js              Rendering and interactions
  data.mjs            Shared mock records and state rules
  report.mjs          Branded aggregate PDF generation
  vendor/             Local pdf-lib runtime and its MIT license
server/
  router.php          Static UI and API routing for PHP
  api.php             PHP sessions, scoped data and demo mutations
  seed.json           Fictional starting data
tests/                Domain and render checks
ASSET_NOTES.md        Image prompts and attribution
```

## Checks

```bash
node --test tests/*.test.mjs
php -l server/api.php
php -l server/router.php
python3 tests/php_api_test.py
```

The Node suite checks all workspace rendering functions and key rules: consent gating, separate branch/church directories, central approval, idempotent interests and cases, contact permission, and removal of former coordinator access. See VERIFICATION.md for the checks actually completed in this environment.
