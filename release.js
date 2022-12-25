const fse = require('fs-extra');
const sh = require('shelljs');

// Publish
const packageFilename = './dist/apika/package.json';
const pkg = require(packageFilename);
pkg.exports['./serv'] = {
  types: "./serv/index.d.ts",
  node: "./serv/index.js",
  default: "./serv/index.js"
}
fse.writeJsonSync(packageFilename, pkg);
if (sh.exec(`npm publish ./dist/apika --access=public ${pkg.version.indexOf('beta') !== -1 ? '--tag=beta' : ''}`).code !== 0) {
  console.log('Publishing error!');
  sh.exit(1);
}

console.log('Done!');
