const JEST_OPTION_ALIASES = new Map([
   ['c', 'config'],
   ['b', 'bail'],
   ['e', 'expand'],
   ['w', 'maxWorkers'],
   ['i', 'runInBand'],
   ['t', 'onlyChanged'],
   ['u', 'updateSnapshot'],
]);

const JEST_OPTIONS = new Map([
   // Forbidden to use / override
   ['env', false],
   ['json', false],
   ['projects', false],
   ['reporters', false],
   ['roots', false],

   ['coverage-provider', false], ['coverageProvider', false],
   ['inject-globals', false], ['injectGlobals', false],
   ['output-file', false], ['outputFile', false],
   ['setup-test-framework-script-file', false], ['setupTestFrameworkScriptFile', false],
   ['test-runner', false], ['testRunner', false],
   ['test-sequencer', false], ['testSequencer', false],

   // Allowed to use / override
   ['config', true],
   ['bail', true],
   ['cache', true],
   ['ci', true],
   ['colors', true],
   ['coverage', true],
   ['debug', true],
   ['expand', true],
   ['filter', true],
   ['force-exit', true],
   ['forceExit', true],
   ['help', true],
   ['init', true],
   ['notify', true],
   ['silent', true],

   ['no-cache', true], ['noCache', true],
   ['clear-cache', true], ['clearCache', true],
   ['collect-coverage-from', true], ['collectCoverageFrom', true],
   ['changed-files-with-ancestor', true], ['changedFilesWithAncestor', true],
   ['changed-since', true], ['changedSince', true],
   ['detect-open-handles', true], ['detectOpenHandles', true],
   ['error-on-deprecated', true], ['errorOnDeprecated', true],
   ['find-related-tests', true], ['findRelatedTests', true],
   ['last-commit', true], ['lastCommit', true],
   ['list-tests', true], ['listTests', true],
   ['log-heap-usage', true], ['logHeapUsage', true],
   ['max-concurrency', true], ['maxConcurrency', true],
   ['max-workers', true], ['maxWorkers', true],
   ['noStackTrace', true], ['noStackTrace', true],
   ['only-changed', true], ['onlyChanged', true],
   ['pass-with-no-tests', true], ['passWithNoTests', true],
   ['run-in-band', true], ['runInBand', true],
   ['select-projects', true], ['selectProjects', true],
   ['run-tests-by-path', true], ['runTestsByPath', true],
   ['show-config', true], ['showConfig', true],
   ['test-name-pattern', true], ['testNamePattern', true],
   ['test-location-in-results', true], ['testLocationInResults', true],
   ['test-path-pattern', true], ['testPathPattern', true],
   ['test-path-ignore-patterns', true], ['testPathIgnorePatterns', true],
   ['test-timeout', true], ['testTimeout', true],
   ['update-snapshot', true], ['updateSnapshot', true],
   ['use-stderr', true], ['useStderr', true],
   ['verbose', true],
   ['version', true],
   ['watch', true],
   ['watch-all', true], ['watchAll', true],
   ['watchman', true],
   ['no-watchman', true], ['noWatchman', true],
]);

function cleanOption(name) {
   if (name.startsWith('--')) {
      return name.slice(2);
   }
   if (name.startsWith('-')) {
      return name.slice(1);
   }
   return name;
}

function isAllowedToUse(rawOptionName) {
   const optionName = cleanOption(rawOptionName);
   const fullOptionName = JEST_OPTION_ALIASES.has(optionName) ? JEST_OPTION_ALIASES.get(optionName) : optionName;
   if (JEST_OPTIONS.has(fullOptionName)) {
      return JEST_OPTIONS.get(fullOptionName);
   }
   // Даем возможность ругаться самому Jest.
   return true;
}

module.exports = {
   isAllowedToUse
};
