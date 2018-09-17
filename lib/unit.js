/**
 * Unit testing stuff
 */

let path = require('path');
let fs = require('fs');
let fsExt = require('./util').fs;

const logger = console;

/**
 * Recursive traverse folders and collect files by callback result.
 * @param {String} parentDir Folder path
 * @param {Function} dirCallback Callback for each folder
 * @param {Function} fileCallback Callback for each file
 * @param {Array} [items] Files collected on previous level
 * @param {Number} [level=0] Depth level from initial call
 * @return {Array} Files collected
 */
function lookingForFiles(parentDir, dirCallback, fileCallback, items, level) {
   items = items || [];
   level = level || 0;

   fs.readdirSync(parentDir).forEach(itemName => {
      let itemPath = path.join(parentDir, itemName);
      let stat = fs.statSync(itemPath);
      if (stat.isDirectory()) {
         if (dirCallback(itemName, itemPath, level)) {
            lookingForFiles(itemPath, dirCallback, fileCallback, items, 1 + level);
         }
      } else if (stat.isFile()) {
         let saveName = fileCallback(itemName, itemPath, level);
         if (saveName) {
            items.push(saveName);
         }
      }
   });

   return items;
}

/**
 * Юнит тесты
 */
let test = {};

/**
 * Returns list of files with unit tests. Lokking for files match mask *.test.*
 * @param {String} testsPath Path to folder where files looking for
 * @return {Array}
 */
test.getList = function(testsPath) {
   const searchPath = testsPath || '';
   const testMatch = /\.test\.[\.A-z0-9]+$/;

   //Ищем тесты
   return lookingForFiles(
      searchPath,
      () => true,
      (fileName, filePath) => {
         if (!fileName.match(testMatch)) {
            return false;
         }
         return fsExt.unixify(filePath);
      }
   );
};

/**
 * Converts filenames to valid AMD-names
 * @param {String} rootPath Project root
 * @param {String} testsList Tests list
 */
test.amdfyList = function(rootPath, testsList) {
   const ROOT = fsExt.unixify(path.normalize(rootPath + path.sep));
   const ROOT_LENGTH = ROOT.length;
   const JS_EXT = '.js';

   return testsList.map((test) => {
      //Remove root path from AMD-name
      if (test.startsWith(ROOT)) {
         test = test.substring(ROOT_LENGTH);
         //Remove extension from AMD-name
         if (test.endsWith(JS_EXT)) {
            test = test.substring(0, test.length - JS_EXT.length);
         }
      }
      return test;
   });
};

/**
 * Returns list of files with unit tests with given path prefix of each
 * @param {String} rootPath Project root
 * @param {String} testsPath Path to folder where files looking for
 */
test.buildFiles = function(rootPath, testsPath) {
   let basePath = path.join(rootPath, testsPath);
   return this.getList(basePath);
};

/**
 * Stuff for report in XUnit format
 */
let report = {};

/**
 * Returns resolved path to the report file
 * @return {String}
 */
report.getFilename = function() {
   return path.resolve(this.fileName);
};

/**
 * Sets path to the report file
 * @param {String} name
 */
report.setFileName = function(name) {
   this.fileName = name;
};

/**
 * Removes old report
 */
report.clear = function() {
   try {
      const fileName = this.getFilename();
      fs.unlinkSync(fileName);
      logger.log('File "' + fileName + '" deleted successfully.');
   } catch (err) {
      //Not found
   }
};

/**
 * Saves the report file
 * @param {String} contents Report contents
 */
report.save = function(contents) {
   const fileName = this.getFilename();
   fsExt.mkdir(path.dirname(fileName));
   fs.writeFileSync(
      fileName,
      new Buffer(contents, 'utf8')
   );
   logger.log('File "' + fileName + '" created successfully.');
};

exports.test = test;
exports.report = report;
