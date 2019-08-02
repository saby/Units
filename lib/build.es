/**
 * Builds ESM module with all the unit tests
 */

import path from 'path';
import fs from 'fs';
import unit from './unit';

const TEST_MODULE_FILENAME = './unit-testing.es';

let unitTest = unit.test;

/**
 * Builds ESM module with all tests
 */
function buildTestModule(testsList) {
   let testingCode = testsList.map(test => {
      if (!test.startsWith('.')) {
      test = './' + test;
   }
   return `import '${test}';`;
}).join('\n');

   testingCode = `
      import assert from 'chai';
      import sinon from 'sinon';

      let wsConfig = {
         wsRoot: wsRootPath,
         resourceRoot: resourcesPath
      };

      export default function() {
         ${testingCode}
      }`;

   fs.writeFileSync(TEST_MODULE_FILENAME, testingCode);
}

let testsList = unitTest.getList(projectRootPath, config.tests);
buildTestModule(testsList);

export TEST_MODULE_FILENAME;
