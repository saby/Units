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
 * @param {String} root Path to the project root
 * @param {Array} testsPaths Path to folder where files looking for
 * @return {Array}
 */
test.getList = function(root, testsPaths) {
   const testMatch = /\.test\.(js|es)$/;
   let list = [];

   //Ищем тесты
   for (const pathToTest of testsPaths) {
      list = [...list, ...lookingForFiles(
         path.join(root, pathToTest),
         () => true,
         (fileName, filePath) => {
            if (!fileName.match(testMatch)) {
               return false;
            }
            return fsExt.unixify(filePath);
         }
      )];
   }

   return list;
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
 * Stuff for reports
 */
class Report {
   constructor(fileName) {
      this.fileName = fileName;
   }

   /**
    * Returns resolved path to the report file
    * @return {String}
    */
   getFilename() {
      return path.resolve(this.fileName);
   }

   /**
    * Removes old report
    */
   clear() {
      const fileName = this.getFilename();
      if (fs.existsSync(fileName)) {
         fs.unlinkSync(fileName);
         logger.log(`File "${fileName}" deleted successfully.`);
      }
   }

   /**
    * Saves the report file
    * @param {String} contents Report contents
    */
   save(contents) {
      const fileName = this.getFilename();
      fsExt.mkdir(path.dirname(fileName));
      fs.writeFileSync(
         fileName,
         new Buffer(contents, 'utf8')
      );
      logger.log(`File "${fileName}" created successfully.`);
   }
}

exports.test = test;
exports.Report = Report;
