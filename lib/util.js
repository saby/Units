/* global exports */

/**
 * Утилиты
 */

var sysfs = require('fs'),
    path = require('path');

/**
 * Files system
 */
exports.fs = {};

/**
 * Рекурсивно создает каталог
 * @param {String} pathname Создаваемый каталог
 */
exports.fs.mkdir = function(pathname, mode) {
   if (pathname && !sysfs.existsSync(pathname)) {
      exports.fs.mkdir(path.dirname(pathname), mode);
      sysfs.mkdirSync(pathname, mode);
   }
};

/**
 * Рекурсивно удаляет каталог
 * @param {String} path Удаляемый каталог
 */
exports.fs.rmdir = function (path) {
   try {
      if (sysfs.existsSync(path)) {
         sysfs.readdirSync(path).forEach(function (file) {
            try {
               var curPath = path + '/' + file;
               if (sysfs.lstatSync(curPath).isDirectory()) {
                  exports.fs.rmdir(curPath);
               } else {
                  sysfs.unlinkSync(curPath);
               }
            } catch (e) {
               console.error(e.toString());
            }
         });
         sysfs.rmdirSync(path);
      }
   } catch (e) {
      console.error(e.toString());
   }
};

/**
 * Node.js
 */
exports.node = {};

/**
 * Возвращает путь до NPM модуля
 * @param {String} module Название модуля
 * @return {String}
 */
exports.node.pathTo = function(module) {
   var paths = [
         path.join(
            path.resolve(path.join(__dirname, '..')), 'node_modules', module
         ),
         path.join(
            process.cwd(), 'node_modules', module
         )
      ],
      item,
      i;

   for (i = 0; i < paths.length; i++) {
      item = paths[i];
      try {
         sysfs.accessSync(item, sysfs.constants.R_OK);
      } catch (e) {
         continue;
      }
      return item;
   }

   console.log(paths);
   throw new ReferenceError('Path to node module "' + module + '" is not found.')
};

/**
 * Config
 */
exports.config = {};

/**
 * Заменяет значения параметров конфига значенияеми из переменных окружения
 * @param {String} path Удаляемый каталог
 */
exports.config.fromEnv = function (config, prefix) {
   prefix = prefix ? prefix + '_' : '';

   var value;
   for (var key in config) {
      if (config.hasOwnProperty(key)) {
         if (typeof config[key] == 'object') {
            exports.config.fromEnv(config[key], prefix + key);
         } else {
            var envKey = prefix + key;
            if (process.env[envKey] !== undefined) {
               value = process.env[envKey];
               if (typeof config[key] === 'boolean') {
                  value = Number(value) !== 0;
               }
               config[key] = value;
            }
         }
      }
   }
};

/**
 * Argv
 */
exports.argv = {};

/**
 * Разбирает аргументы вида ключ=значение
 * @param {Object.<Sting, String>} defaults Значения по умолчанию
 * @return {Object.<Sting, String>}
 */
exports.argv.parse = function (defaults) {
   var argv = process.argv,
      result = defaults || {},
      i,
      key,
      val;
   for (i = 1; i < argv.length; i++) {
      val = argv[i].split('=');
      if (val.length > 1) {
         key = val.shift();
         val = val.join('=');
         if (key) {
            result[key] = val;
         }
      }
   }
   return result;
};
