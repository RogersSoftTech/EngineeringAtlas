const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(process.argv[2] || 'dist/engineering-atlas/browser');
const config = JSON.parse(fs.readFileSync(path.join(root, 'staticwebapp.config.json'), 'utf8'));
assert.equal(config.platform?.apiRuntime,'dotnet-isolated:10.0');
assert.deepEqual(config.routes.find(r=>r.route==='/api/*')?.allowedRoles,['atlas_reader']);
assert.ok(fs.existsSync(path.join(root, 'index.html')), 'Build output is missing index.html');
assert.ok(fs.existsSync(path.join(root, 'access-denied.html')), 'Missing access-denied page');
assert.ok(!config.navigationFallback, 'Hash routes do not require navigationFallback; keep authorization on every asset request');
assert.equal(config.responseOverrides?.['401']?.statusCode, 302);
assert.match(config.responseOverrides?.['401']?.redirect ?? '', /^\/\.auth\/login\/github/);
assert.equal(config.responseOverrides?.['403']?.rewrite, '/access-denied.html');
const matches = (rule, url) => rule.route.endsWith('*') ? url.startsWith(rule.route.slice(0, -1)) : rule.route === url;
const files = [];
function walk(directory) {
  for (const entry of fs.readdirSync(directory, {withFileTypes:true})) {
    const absolute=path.join(directory,entry.name);
    assert.ok(!entry.isSymbolicLink(), 'Deployment output must not contain symbolic links');
    if(entry.isDirectory())walk(absolute);else files.push('/'+path.relative(root,absolute).split(path.sep).join('/'));
  }
}
walk(root);
for(const file of files.filter(f=>f!=='/access-denied.html' && f!=='/staticwebapp.config.json')) {
  const rule=config.routes.find(r=>matches(r,file));
  assert.deepEqual(rule?.allowedRoles,['atlas_reader'], 'App assets and course content must be invite-only: '+file);
}
assert.deepEqual(config.routes.find(r=>matches(r,'/'))?.allowedRoles,['atlas_reader']);
const courses=files.filter(f=>/^\/courses\/.+\.json$/.test(f));
assert.equal(courses.length,50,'Expected all 50 course assets in the deployment package');
console.log('Verified production index, 50 course assets, and invite-only authorization for '+files.length+' files.');
if(process.argv[3]){
  const api=path.resolve(process.argv[3]);
  for(const file of ['host.json','worker.config.json','EngineeringAtlas.Api.dll','.azurefunctions/Microsoft.Azure.WebJobs.Extensions.FunctionMetadataLoader.dll'])assert.ok(fs.existsSync(path.join(api,file)),'Missing managed API deployment file: '+file);
  const worker=JSON.parse(fs.readFileSync(path.join(api,'worker.config.json'),'utf8'));
  assert.equal(worker.description.language,'dotnet-isolated');
  assert.equal(worker.description.workerIndexing,'true','The .NET worker must discover the API functions');
  console.log('Verified published .NET 10 managed API.');
}
