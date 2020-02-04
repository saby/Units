/**
 * Runs unit testing via Node.js environment.
 */

import spawn from 'child_process';
import path from 'path';
import fs from 'fs';
import unit from './unit';
import saveReport from './saveReport';

import describe from 'mocha';
import assert from 'chai';
import sinon from 'sinon';
import jsdom from 'jsdom';

let global = (0, eval)('this');
global.describe = describe;
global.assert = assert;
global.sinon = sinon;
global.jsdom = jsdom;

import '../../../unit-testing.es';

const logger = console;
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
         wsRoot: '${wsRootPath}',
         resourceRoot: '${resourcesPath}'
      };

      ${testingCode}
      `;

   fs.writeFileSync(TEST_MODULE_FILENAME, testingCode);
}

function testEsmModules(testsList) {
   let hasErrors = false;

   //Run testing
   try {
      buildTestModule(testsList);
   } catch (err) {
      hasErrors = true;
      logger.error(`Testing in '${TEST_MODULE_FILENAME}' has been failed.`);
      logger.error(err);
   }

   return hasErrors;
}

/**
 * Runs unit testing via Node.js
 * @param {Object} config Testing config
 */
export default function run(config) {
   let projectRootPath = config.root || '';
   let testsList = unitTest.getList(projectRootPath, config.tests);
   let hasErrors;

   hasErrors = testEsmModules(testsList);

   if (config.reportFile) {
      saveReport(config.reportFile);
   }

   process.on('exit', () => {
      if (hasErrors) {
         process.exitCode = 1;
      }
      return process.exitCode;
   });
};
