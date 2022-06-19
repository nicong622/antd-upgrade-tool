const { run: jscodeshift } = require('jscodeshift/src/Runner');
const { resolve } = require('path');

const transformPath = resolve(__dirname, './transform.js');
const paths = ['/Users/liangningcong/projects/imax-plus/crm/src/pages'];
// const paths = ['./examples/index.jsx'];

const options = {
  // dry: true,
  // print: true,
  verbose: 1,
};

async function run() {
  const res = await jscodeshift(transformPath, paths, options);
  console.log(res);
}

run();
