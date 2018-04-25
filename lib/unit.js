/**
 * Юнит тестирование
 */

let path = require('path'),
   fs = require('fs'),
   fsExt = require('./util').fs;

const logger = console;

/**
 * Рекурсивно обходит каталоги и собирает в них файлы на основе результатов 2-х ф-ий обратного вызова.
 * @param {String} parentDir Путь до папки, в которой делаем обход
 * @param {Function} dirCallback Callback, определяющий, будем ли заходить в эту папку
 * @param {Function} fileCallback Callback, определяющий, будем собирать этот файл
 * @param {Array} [items] Собранные файлы
 * @param {Number} [level=0] Текущий уровень вложенности
 * @return {Array} Собранные файлы, готовые для подключения через require/requirejs
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
 * Возвращает список файлов юнит тестов. Ищутся файлы *.test.js
 * @param {String} basePath Путь до каталога с тестами
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
 * Возвращает содержимое файла со списком тестов
 * @param {String} basePath Путь к каталогу с тестами
 * @param {String} [prefix=''] Добавить префикс в пути к файлам
 */
test.buildFile = function(basePath, prefix) {
   basePath = basePath || '';
   prefix = prefix || '';

   return 'define([\n' +
      this.getList(basePath)
         .map(test => {
            return '\'' + prefix + test + '\'';
         })
         .join(',\n') +
      '\n]);';
};

/**
 * Работа с файлом отчета о тестировании в формате XUnit
 */
let report = {};

/**
 * Возвращает путь до файла с отчетом
 * @return {String}
 */
report.getFilename = function() {
   return path.resolve(this.fileName);
};

/**
 * Устанавливает путь до файла с отчетом
 * @param {String} name
 */
report.setFileName = function(name) {
   this.fileName = name;
};

/**
 * Удаляет старый файл отчета
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
 * Сохраняет содержимое отчета в файл
 * @param {String} contents Содержимое отчета
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
