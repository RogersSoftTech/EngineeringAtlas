const fs = require('node:fs');
const path = require('node:path');
const target = path.join(__dirname, '..', 'src', 'primeui-license.local.ts');
// Only a PrimeUI license belongs here. Never put npm credentials in browser code.
if (process.env.PRIMEUI_LICENSE_KEY) {
  fs.writeFileSync(target, 'export const primeUiLicense = ' + JSON.stringify(process.env.PRIMEUI_LICENSE_KEY) + ';\n');
} else if (!fs.existsSync(target)) {
  fs.writeFileSync(target, "export const primeUiLicense = '';\n");
}
