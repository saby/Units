// Необходимо загружать тестовый файл асинхронно, дожидаясь выполнения callback-функции define,
// чтобы произошла регистрация тестов. Для этого в jasmine вызов функции requireModule для
// тестового файла делается асинхронным (добавляется ключевое слово await). Это вся суть патча

const fs = require('fs');
const { dirname, join } = require('path');
const logger = console;

const root = dirname(require.resolve('jest-jasmine2/package.json'));
const path = join(root, 'build', 'index.js');
const backup = join(root, 'build', 'index.backup.js');
const patch = join(__dirname, 'lib', 'jest', 'index.patch.js');

fs.rename(path, backup, error => {
   if (error) {
      throw error;
   }
   logger.log('Backup jasmine file "index.js"');
});

fs.copyFile(patch, path, error => {
   if (error) {
      throw error;
   }
   logger.log('Patch jasmine file "index.js"');
});
