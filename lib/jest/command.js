const path = require('path');
const pathTo = require('../util').pathTo;
const { isAllowedToUse } = require('./options');

const JEST_PATH = path.join(pathTo('jest'), 'bin', 'jest');
const JEST_JUNIT_PATH = pathTo('jest-junit');

const JEST_RUNTIME_FILE_NAME = 'runtime.js';

const EMPTY_STRING = '';
const logger = console;

function getModuleLoaderPath(root) {
   return path.join(root, JEST_RUNTIME_FILE_NAME);
}

function parseArguments(args, defaultEnv) {
   const result = {
      args: [
         JEST_PATH,
         `--moduleLoader=${getModuleLoaderPath(__dirname)}`
      ],
      options: {
         stdio: 'inherit',
         env: {
            ...defaultEnv
         }
      },
      parameters: {
         isBrowser: false
      }
   }
   for (let index = 0; index < args.length; ++index) {
      const argv = args[index];
      const [name, value] = argv.split('=', 2);
      if (!name) {
         continue;
      }
      if (name.startsWith('--ENV_VAR-')) {
         const envVar = name.replace('--ENV_VAR-', '');
         result.options.env[envVar] = value;
         continue;
      }
      if (name === '--port') {
         result.parameters.port = +value;
         continue;
      }
      if (name === '--root') {
         result.parameters.root = value;
         continue;
      }
      if (isAllowedToUse(name)) {
         continue;
      }
      if (name === '--env' && value === 'jsdom') {
         result.parameters.isBrowser = true;
      }
      result.args.push(argv);
   }
   if (result.options.env.hasOwnProperty('JEST_JUNIT_OUTPUT_FILE')) {
      result.args.push(`--reporters=default`);
      result.args.push(`--reporters=${JEST_JUNIT_PATH}`);
      result.args.push(`--testResultsProcessor=${JEST_JUNIT_PATH}`);
   }
   return result;
}

module.exports = {
   parseArguments
};
