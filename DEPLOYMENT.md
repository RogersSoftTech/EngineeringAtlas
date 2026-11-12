# Azure deployment

EngineeringAtlas deploys from `main` in **RogersSoftTech/EngineeringAtlas** to **Azure Static Web Apps**, using the **Free** plan. The deployment workflow is `.github/workflows/azure-static-web-apps.yml`.

## Deployment target

- Resource group: `rg-engineering-atlas`
- Static Web App: `engineering-atlas`
- Region: East US 2
- Site: https://thankful-desert-07248a70f.8.azurestaticapps.net
- Deployment job: `Deploy invite-only production site`

The app is reachable on the internet, but its HTML, JavaScript, styles and all bundled course JSON require the custom `atlas_reader` role. GitHub sign-in alone does not grant access. Users must accept an invitation to that role. This is application-level access control, not a private network endpoint.

## What the action does

Every push to `main`, or a manual **Deploy to Azure Static Web Apps** run, installs locked dependencies, runs the tests, builds Angular, verifies the output and access configuration, and uploads the exact verified package. The deployment job publishes that package without rebuilding it in Azure. Pull requests are tested by the existing CI workflow and do not deploy previews.

The production deployment is enabled when repository variable `AZURE_STATIC_WEB_APPS_READY` is `true`. Builds still run when this switch is absent or disabled. Production deployments are serialized to avoid cancelling an in-progress upload.

Required repository secret:

- `AZURE_STATIC_WEB_APPS_API_TOKEN`: deployment token for this specific Static Web App. Keep it in GitHub Secrets; never commit it.

PrimeNG deployment setting:

- `PRIMEUI_LICENSE_KEY`: the appropriate PrimeUI production license key. The local development key is not copied to GitHub. Without this secret, the generated client configuration has an empty license and PrimeNG may show a license notice. The browser must receive a PrimeUI license value as part of the compiled app, so it is not a place for private npm credentials.

Use **Settings → Secrets and variables → Actions** in GitHub to update these settings. Reset the Azure deployment token if it is ever exposed, then replace the repository secret. GitHub's `GITHUB_TOKEN` uses read-only repository permissions for this workflow; the scoped Azure token authorizes the deployment.

## Invite an account

In Azure Portal, open **engineering-atlas → Role management → Invite**. Select **GitHub**, enter the person's exact GitHub username, choose the site's domain, and assign `atlas_reader`. Share the generated invitation directly with that person. Accept the invitation while signed into the matching GitHub account.

For the owner account, the equivalent CLI command is:

```powershell
az staticwebapp users invite --name engineering-atlas --resource-group rg-engineering-atlas --authentication-provider GitHub --user-details jwr3408 --roles atlas_reader --domain thankful-desert-07248a70f.8.azurestaticapps.net --invitation-expiration-in-hours 168
```

Invitation links expire after the selected interval; an accepted role remains until removed in Role management. An uninvited signed-in account sees the access-restricted page. `/logout` signs out; `/login` starts GitHub sign-in.

`public/staticwebapp.config.json` is enforced by Azure at the HTTP layer and is copied to the built site's root. All application and course assets are protected. Angular uses hash routes, so no navigation fallback is needed. Local `npm start` does not enforce Azure authentication; use the deployed host to verify access control.

## Run or roll back a deployment

Push the desired version to `main`, or run **Actions → Deploy to Azure Static Web Apps → Run workflow → main**. The workflow's summary identifies the deployed URL. To roll back, revert the relevant source commit on `main`; the action tests and deploys the reverted application. Pause automatic uploads by setting `AZURE_STATIC_WEB_APPS_READY` to `false`. The workflow does not depend on protected GitHub Environments, so it can run in this organization's private repository on the GitHub Free plan.

Notes, progress and imported course replacements remain browser-local. Moving from localhost or another host creates a separate storage origin. Export progress and keep your ChatGPT source export before switching hosts.

## Verification

```powershell
npm test
npm run build
node scripts/verify-azure-deployment.cjs dist/engineering-atlas/browser
```

The verifier checks the production index, all 50 course assets and access requirements for every packaged asset. Deployment should also be checked anonymously: `/` and a direct `/courses/<id>.json` request must redirect to GitHub sign-in, while an authenticated account without `atlas_reader` must be denied. The access-restricted HTML page contains no course content.

Microsoft references: [build configuration](https://learn.microsoft.com/azure/static-web-apps/build-configuration), [authorization](https://learn.microsoft.com/azure/static-web-apps/authentication-authorization), [routing configuration](https://learn.microsoft.com/azure/static-web-apps/configuration).
