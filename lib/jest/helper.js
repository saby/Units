const path = require('path');
const pathTo = require('../util').pathTo;

const JEST_PATH = path.join(pathTo('jest'), 'bin', 'jest');
const JEST_ENVIRONMENT_FILE_NAME = 'environment.js';
const JEST_RUNTIME_FILE_NAME = 'runtime.js';

function getModuleLoaderPath(root) {
    return path.join(root, JEST_RUNTIME_FILE_NAME);
}

function getEnvironmentPath(root) {
    return path.join(root, JEST_ENVIRONMENT_FILE_NAME);
}

/**
 * Jest CLI commands:
 *      --coverage[=<boolean>]
 *      --findRelatedTests <spaceSeparatedListOfSourceFiles>
 *      --init
 *      --listTests
 *      --runInBand
 *      --runTestsByPath
 *      --testNamePattern=<regex>
 *      --testPathPattern=<regex>
 *      --updateSnapshot
 *      --watch
 *      --watchAll
 */
function getArguments(args) {
    return [
        JEST_PATH,
        '--expand',
        `--env=${getEnvironmentPath(__dirname)}`,
        `--moduleLoader=${getModuleLoaderPath(__dirname)}`,
        ...args
    ];
}

module.exports = {
    getArguments
};