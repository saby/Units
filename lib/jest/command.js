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

function parseArguments(args) {
   return args.map(argv => {
      const [name, value] = argv.split('=', 2);
      if (name === '--env') {
         if (value === 'jsdom') {
            return `--env=${getEnvironmentPath(__dirname, true)}`;
         }
         return `--env=${getEnvironmentPath(__dirname, false)}`;
      }
      if (isAllowedToUse(name)) {
         return argv;
      }
      logger.error(`[jest][ERROR] Опция "${name}" запрещена к использованию. Обратитесь в отдел "Система типов"`);
      return EMPTY_STRING;
   }).filter(argv => !!argv);
}

function getArguments(args) {
   const parsedArguments = parseArguments(args);
   return [
      JEST_PATH,
      `--moduleLoader=${getModuleLoaderPath(__dirname)}`,
      `--reporters=default`,
      `--reporters=${JEST_JUNIT_PATH}`,
      `--testResultsProcessor=${JEST_JUNIT_PATH}`,
      ...parsedArguments
   ];
}

module.exports = {
   getArguments
};
