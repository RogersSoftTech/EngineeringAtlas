# PrimeNG controls

PrimeNG 22 is configured with an Aura preset using the blue palette and light mode. Components are imported individually by each standalone Angular component.

- SelectButton: Learning / Interview Prep
- InputText and Select: roadmap search and discipline filter
- Textarea and Select: notes, takeaways, evidence and confidence
- Button: export, module completion and next-module actions
- ProgressBar: roadmap completion
- Toast and ConfirmDialog: backup results and import confirmation

## License setup

The PrimeUI license value is in **src/primeui-license.local.ts**, which is excluded by `.gitignore`. Never commit this file or put an npm access token in it. The local development key has been configured on this machine.

For a fresh checkout, `npm start`, `npm test`, `npm run build` and `npm run build:pages` automatically generate an empty local file if needed. Set `PRIMEUI_LICENSE_KEY` in the process environment or CI secrets to populate it with the appropriate PrimeUI license. The generator preserves an existing local file unless that environment variable is set. Direct Nx commands should be preceded by `node scripts/configure-license.cjs` on a fresh checkout.

This is a client-side license configuration: the value is included in the browser bundle, as required by PrimeNG's provider. It is not a secure place for package download credentials. Use the appropriate production license for deployed domains; the supplied key is a development key.

Official setup: https://primeng.dev/installation

## GitHub Actions

If deploying, add the appropriate production key as a repository secret named `PRIMEUI_LICENSE_KEY`. The existing workflows read that secret for builds. Without a license, the source still builds but PrimeNG may display a license notice at runtime.
