const path = require('path');
const pathTo = require('../util').pathTo;
const { isAllowedToUse } = require('./options');

const JEST_PATH = path.join(pathTo('jest'), 'bin', 'jest');
const JEST_JUNIT_PATH = pathTo('jest-junit');

const JEST_RUNTIME_FILE_NAME = 'runtime.js';
const JEST_JSDOM_ENVIRONMENT_FILENAME = 'env-jsdom.js';
const JEST_NODE_ENVIRONMENT_FILENAME = 'env-node.js';

const EMPTY_STRING = '';
const logger = console;

function getModuleLoaderPath(root) {
   return path.join(root, JEST_RUNTIME_FILE_NAME);
}

function getEnvironmentPath(root, isJSDOM) {
   if (isJSDOM) {
      return path.join(root, JEST_JSDOM_ENVIRONMENT_FILENAME);
   }
   return path.join(root, JEST_NODE_ENVIRONMENT_FILENAME);
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
      }
   }
   for (let index = 0; index < args.length; ++index) {
      const argv = args[index];
      const [name, value] = argv.split('=', 2);
      if (!name) {
         continue;
      }
      if (name === '--env') {
         if (value === 'jsdom') {
            result.args.push(`--env=${getEnvironmentPath(__dirname, true)}`);
            continue;
         }
         result.args.push(`--env=${getEnvironmentPath(__dirname, false)}`);
         continue;
      }
      if (name.startsWith('--ENV_VAR-')) {
         const envVar = name.replace('--ENV_VAR-', '');
         result.options.env[envVar] = value;
         continue;
      }
      if (isAllowedToUse(name)) {
         result.args.push(argv);
         continue;
      }
      logger.error(`[jest][ERROR] Опция "${name}" запрещена к использованию. Обратитесь в отдел "Система типов"`);
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