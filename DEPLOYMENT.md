# Azure deployment

The production package now includes the managed .NET 10 API as well as Angular. See [AZURE_STORAGE.md](AZURE_STORAGE.md) for storage settings, API routes, per-user isolation and testing. The deployment action tests and publishes both packages; the API's `.azurefunctions` directory is retained in its artifact.

EngineeringAtlas deploys from `main` in **RogersSoftTech/EngineeringAtlas** to **Azure Static Web Apps**, using the **Free** plan. The deployment workflow is `.github/workflows/azure-static-web-apps.yml`.

## Deployment target

- Resource group: `rg-engineering-atlas`
- Static Web App: `engineering-atlas`
- Region: East US 2
- Site: https://thankful-desert-07248a70f.8.azurestaticapps.net
- Deployment job: `Deploy public site with private cloud data`

The Angular application, roadmaps and 50 bundled course excerpts are publicly viewable without signing in. The Static Web Apps route rule keeps `/api/*` restricted to `atlas_reader`; the API independently checks the authenticated principal and role before returning or changing account-scoped progress and imported courses. Public access does not make Azure storage or user-specific data public.

## What the action does

Every push to `main`, or a manual **Deploy to Azure Static Web Apps** run, installs locked dependencies, runs the tests, builds Angular, verifies the output and access configuration, and uploads the exact verified package. The deployment job publishes that package without rebuilding it in Azure. Pull requests are tested by the existing CI workflow and do not deploy previews.

The production deployment is enabled when repository variable `AZURE_STATIC_WEB_APPS_READY` is `true`. Builds still run when this switch is absent or disabled. Production deployments are serialized to avoid cancelling an in-progress upload.

Required repository secret:

- `AZURE_STATIC_WEB_APPS_API_TOKEN`: deployment token for this specific Static Web App. Keep it in GitHub Secrets; never commit it.

PrimeNG deployment setting:

- `PRIMENG_LICENSE`: the existing organization secret, which must be shared with this repository (**Organization settings → Secrets → PRIMENG_LICENSE → repository access**). The local development key is not copied to GitHub. Without this secret, the generated client configuration has an empty license and PrimeNG may show a license notice. The browser must receive a PrimeUI license value as part of the compiled app, so it is not a place for private npm credentials.

Use **Settings → Secrets and variables → Actions** in GitHub to update these settings. Reset the Azure deployment token if it is ever exposed, then replace the repository secret. GitHub's `GITHUB_TOKEN` uses read-only repository permissions for this workflow; the scoped Azure token authorizes the deployment.

## Authorize cloud saving

Public browsing needs no invitation. To enable private Azure progress and imported-course sync, open **engineering-atlas → Role management → Invite** in Azure Portal. Select **GitHub**, enter the person's exact GitHub username, choose the site's domain, and assign `atlas_reader`. Share the generated invitation directly with that person. Accept the invitation while signed into the matching GitHub account.

For the owner account, the equivalent CLI command is:

```powershell
az staticwebapp users invite --name engineering-atlas --resource-group rg-engineering-atlas --authentication-provider GitHub --user-details jwr3408 --roles atlas_reader --domain thankful-desert-07248a70f.8.azurestaticapps.net --invitation-expiration-in-hours 168
```

Invitation links expire after the selected interval; an accepted role remains until removed in Role management. An uninvited account can still browse all public materials, but cannot access private cloud data. `/logout` signs out; `/login` starts GitHub sign-in.

`public/staticwebapp.config.json` is enforced by Azure at the HTTP layer and is copied to the built site's root. The catch-all route allows anonymous access; the more-specific `/api/*` route still requires `atlas_reader`. Angular uses hash routes, so no navigation fallback is needed. Local `npm start` does not enforce Azure authentication; use the deployed host to verify the public pages and protected API.

## Run or roll back a deployment

Push the desired version to `main`, or run **Actions → Deploy to Azure Static Web Apps → Run workflow → main**. The workflow's summary identifies the deployed URL. To roll back, revert the relevant source commit on `main`; the action tests and deploys the reverted application. Pause automatic uploads by setting `AZURE_STATIC_WEB_APPS_READY` to `false`. The workflow does not depend on protected GitHub Environments, so it can run in this organization's private repository on the GitHub Free plan.

Signed-in notes, progress and imported course replacements save through the API to Azure. Use the one-time **Upload browser data to my account** prompt to migrate earlier browser-only data from the hostname where it was stored. Device caches still belong to individual origins; cloud data belongs to your sign-in for this Static Web App. Keep progress exports and original ChatGPT source exports as additional backups.

## Verification

```powershell
npm test
npm run build
node scripts/verify-azure-deployment.cjs dist/engineering-atlas/browser
```

The verifier checks the production index, all 50 course assets, anonymous access rules for packaged files, and the protected API route. After deployment, anonymous requests to `/` and `/courses/<id>.json` must return successfully, while `/api/learning/session` must redirect to GitHub sign-in. An authenticated account without `atlas_reader` remains denied access to the API. Public static course excerpts and their source links are part of the published site; account-specific notes, progress and imported replacements remain behind the API.

Microsoft references: [build configuration](https://learn.microsoft.com/azure/static-web-apps/build-configuration), [authorization](https://learn.microsoft.com/azure/static-web-apps/authentication-authorization), [routing configuration](https://learn.microsoft.com/azure/static-web-apps/configuration).
