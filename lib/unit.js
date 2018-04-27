/**
 * Unit testing stuff
 */

let path = require('path'),
   fs = require('fs'),
   fsExt = require('./util').fs;

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
 * @param {String} basePath Path to folder where files looking for
 * @return {Array}
 */
test.getList = function(basePath) {
   basePath = basePath || '';
   const testMatch = /\.test\.[\.A-z0-9]+$/;

   //Ищем тесты
   return lookingForFiles(
      basePath,
      () => {
         return true;
      },
      (fileName, filePath) => {
         if (!fileName.match(testMatch)) {
            return false;
         }
         return filePath
            .split('\\')
            .join('/');
      }
   );
};

/**
 * Returns list of files with unit tests with given path prefix of each
 * @param {String} basePath Path to folder where files looking for
 * @param {String} [prefix=''] Prefix to add
 */
test.buildFiles = function(basePath, prefix) {
   basePath = basePath || '';
   prefix = prefix || '';

   return this.getList(basePath)
      .map(test => {
         return  prefix + test;
      });
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
