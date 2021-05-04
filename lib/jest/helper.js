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

function prepareArguments(args) {
    return args.map(arg => {
        const [name, value] = arg.split('=', 2);
        if (name === '--jestConfig') {
            return `--config=${value}`;
        }
        return arg;
    });
}

function getArguments(args) {
    const preparedArgs = prepareArguments(args);
    return [
        JEST_PATH,
        '--expand',
        `--env=${getEnvironmentPath(__dirname)}`,
        `--moduleLoader=${getModuleLoaderPath(__dirname)}`,
        ...preparedArgs
    ];
}

module.exports = {
    getArguments
};