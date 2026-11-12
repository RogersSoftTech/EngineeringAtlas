const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const target = path.join(__dirname, '..', 'src', 'primeui-license.local.ts');
// Invalidate Nx build cache when an ignored local license changes, without printing it.
console.log(crypto.createHash('sha256').update(fs.existsSync(target) ? fs.readFileSync(target) : '').digest('hex'));
