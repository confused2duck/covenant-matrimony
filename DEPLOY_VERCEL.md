# Deploy Covenant Matrimony on Vercel

This package contains the latest homepage motion, the three public pages, Member/Branch/Church dashboards, Super admin, demo login, original images, local fonts and PDF report downloads. All website assets are bundled; no API keys or environment variables are needed for the showcase.

The included `vercel.json` deploys `dist/` as a static website. Mock data is saved in the current browser, and login is a fictional demonstration. The PHP files in `server/` are supplied separately for a PHP host; this Vercel deployment does not execute them.

## Deploy through GitHub and the Vercel dashboard

1. Extract `Covenant_Matrimony_Source.zip` and open the inner `Covenant_Matrimony` folder.
2. Create a GitHub repository named `covenant-matrimony`. Upload the CONTENTS of the inner folder. The repository root should contain `dist/`, `server/`, `package.json`, `vercel.json` and this guide. Upload the actual files and folders, not the ZIP file. The Vercel configuration must sit beside `dist/`.
3. Open https://vercel.com/new and sign in. Connect GitHub if requested, then import this repository.
4. Confirm the deployment settings below. The included configuration sets the framework, build, install and output values automatically.

| Setting | Value |
| --- | --- |
| Framework Preset | Other |
| Root Directory | `./` (repository root) |
| Build Command | Empty; skip the build step |
| Install Command | Empty; skip dependency installation |
| Output Directory | `dist` |
| Environment Variables | None |

5. Click **Deploy** and wait for the deployment to finish. Open the URL Vercel returns.
6. Test Home (including the expanding journey panels), About us, Our specialties and `/login.html`. Sign in to each demo role. In Admin > Reports, download the PDF. Sign out before switching roles.

If you uploaded the enclosing `Covenant_Matrimony` folder to GitHub instead of its contents, set Root Directory to `Covenant_Matrimony` rather than `./`. Do not use `dist` as the Root Directory: the root contains `vercel.json`, which points to `dist` as the Output Directory.

## Demo credentials

Every workspace uses the password `Covenant@2026`. The login tabs prefill the matching email.

| Workspace | Email |
| --- | --- |
| Member | `member@covenant.demo` |
| Branch | `branch@covenant.demo` |
| Church | `church@covenant.demo` |
| Super admin | `admin@covenant.demo` |

Changes are browser-local. A different browser or device starts with the fictional seed records. To reset them, use the public footer's Privacy dialog > Reset browser demo data. Real member authentication and shared persistent records require the production backend described in README.md.

## Optional terminal deployment

Install Node.js first. Open a terminal in the extracted inner `Covenant_Matrimony` folder, then run these commands individually:

```bash
npx vercel login
npx vercel link
npx vercel deploy --prod
```

During `vercel link`, select your Vercel account/team, create a new project or choose the intended existing project, and use `./` for the local project directory. Confirm the project before deployment. The included configuration supplies the static deployment settings. `--prod` creates a production deployment; without it the CLI creates a preview.

## Custom domain and future updates

To connect your domain, open the Vercel project's Settings > Domains, add the domain, then follow the exact DNS records Vercel shows.

For GitHub-connected deployment, commit later changes to the connected production branch to trigger a new deployment. For terminal deployment, run `npx vercel deploy --prod` again from the same linked project folder.

## If something fails

- **404 at the homepage:** confirm Root Directory points to the folder containing `vercel.json`, Output Directory is `dist`, and `dist/index.html` exists.
- **Missing photos or fonts:** upload the entire `dist/assets/` folder. Also retain `dist/vendor/` for PDF export.
- **Build command error:** select Other and clear the build/install commands; this site has no build step.
- **Login tries to call PHP:** restore `dist/runtime-config.js` to `backend: 'mock'` for this Vercel showcase.
- **Old-looking page:** reload the page after the new deployment completes.

## PHP backend

Vercel's official runtime documentation lists PHP as a community runtime, not an officially supported native runtime. The supplied PHP session API and writable JSON store were built for a PHP server and have not been adapted to Vercel Functions. Host that version on a PHP server, or migrate it to supported Vercel server functions with persistent database-backed sessions and records. Merely changing `backend` to `php` will not deploy a working API.

For the local PHP demonstration, see README.md. This guide and configuration deploy the current mock-data showcase only.

## Official references

- Static build settings: https://vercel.com/docs/builds/configure-a-build
- Project configuration: https://vercel.com/docs/project-configuration/vercel-json
- Git deployments: https://vercel.com/docs/git
- Runtime support: https://vercel.com/docs/functions/runtimes

Configuration and instructions checked on 11 October 2026. Vercel deployment was not performed as part of this handover.
