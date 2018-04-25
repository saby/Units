/* global exports */

/**
 * Утилиты
 */

let sysfs = require('fs'),
   path = require('path');

const logger = console;

/**
 * Files system
 */
exports.fs = {};

/**
 * Рекурсивно создает каталог
 * @param {String} pathname Создаваемый каталог
 * @param {Number} mode Режим
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
exports.fs.rmdir = function(path) {
   try {
      if (sysfs.existsSync(path)) {
         sysfs.readdirSync(path).forEach(file => {
            try {
               const curPath = path + '/' + file;
               if (sysfs.lstatSync(curPath).isDirectory()) {
                  exports.fs.rmdir(curPath);
               } else {
                  sysfs.unlinkSync(curPath);
               }
            } catch (err) {
               logger.error(err.toString());
            }
         });
         sysfs.rmdirSync(path);
      }
   } catch (err) {
      logger.error(err.toString());
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
   let paths = [
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
         if (sysfs.accessSync) {
            sysfs.accessSync(item);
         } else {
            if (!sysfs.existsSync(item)) {
               throw new Error('Path "' + item + '" does exist');
            }
         }
      } catch (err) {
         continue;
      }
      return item;
   }

   throw new ReferenceError('Path to node module "' + module + '" is not found.');
};

/**
 * Заменяет значения параметров конфигурации значенияеми из переменных окружения
 * @param {Object} config Конфигурация
 * @param {String} prefix Префикс переменных окружения
 */
exports.fromEnv = function(config, prefix) {
   prefix = prefix ? prefix + '_' : '';

   let value;
   for (let key in config) {
      if (config.hasOwnProperty(key)) {
         if (typeof config[key] === 'object') {
            exports.fromEnv(config[key], prefix + key);
         } else {
            let envKey = prefix + key;
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
 * Разбирает аргументы вида ключ=значение
 * @param {Object.<String>} defaults Значения по умолчанию
 * @return {Object.<String>}
 */
exports.parseArgv = function(defaults) {
   let argv = process.argv,
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
